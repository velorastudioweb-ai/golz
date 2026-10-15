/**
 * Gallery taxonomy + archive migration.
 *
 * Makes the database the single source of truth for the public gallery:
 *
 *   1. Seeds the administrator-managed gallery tags (the public "Type" chips).
 *   2. Ensures a GallerySection row exists for every year folder in the photo
 *      archive, in newest-first display order.
 *   3. Imports each bundled archive photo as a managed GalleryItem (so every
 *      photo can be tagged, re-titled and re-filed from the admin panel).
 *   4. Unpublishes the legacy duplicate re-uploads that the public page used to
 *      drop silently, so the imported archive is the only visible copy.
 *
 * Idempotent: safe to re-run. Nothing is deleted; legacy records are only
 * unpublished and can be restored from the admin panel.
 *
 *   node scripts/sync-gallery-taxonomy.mjs
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import GallerySection from "../src/models/GallerySection.js";
import GalleryItem from "../src/models/GalleryItem.js";
import GalleryTag from "../src/models/GalleryTag.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = path.resolve(__dirname, "../../client/src/data/galleryManifest.json");

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const images = Array.isArray(manifest.images) ? manifest.images : [];

/* Mirrors client/src/gallery/eventTypes.js so the seed classifications match
   exactly what the public page used to compute in the browser. */
const RULES = [
  { key: "Workshops", pattern: /workshop/i, blurb: "Hands-on sessions we ran for parents, students and professionals." },
  { key: "Conferences & Awards", pattern: /conference|award|recognition|certificate|launch/i, blurb: "Conference appearances, launches and professional recognition." },
  { key: "Talks & Awareness", pattern: /talk|awareness|seminar|session|camp|college|school|breast ?feeding/i, blurb: "Talks, awareness drives and sessions at colleges and schools." },
  { key: "Hospitals & Institutions", pattern: /hospital|clinic|apollo|aiish|fmkmc|poshan|anganwadi|women ?& ?child|department/i, blurb: "Programmes delivered with hospitals and public institutions." },
];

const DEFAULT_TAGS = [
  { name: "Events", blurb: "Everyday moments from the GOLZ nutrition clinic." },
  ...RULES.map((r) => ({ name: r.key, blurb: r.blurb })),
];

const classify = (item) => {
  const haystack = `${item.eventName ?? ""} ${item.caption ?? ""}`;
  const match = RULES.find((rule) => rule.pattern.test(haystack));
  return match ? match.key : "Events";
};

const text = (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");
const sitePath = (value) => `/${text(value).replace(/^\/+/, "")}`;
const folderRank = (folder) => {
  const match = /^(\d{4})/.exec(folder);
  return match ? Number(match[1]) : -1;
};

/* Same duplicate signature the frontend merge used, so the legacy cleanup
   unpublishes exactly the re-uploads that were already invisible. */
const signature = (value) =>
  text(value)
    .replace(/\((?:copy|img|image|photo|file)?\s*\d*\)/gi, " ")
    .replace(/\bcopy\b/gi, " ")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
const basenameOf = (value) => decodeURIComponent(text(value).split("?")[0].split("/").pop() || "");
const LEGACY_ARCHIVE_PATH = /\/gallery\/archive\//i;

const summary = { tagsCreated: [], sectionsCreated: [], itemsImported: 0, legacyUnpublished: 0 };

await mongoose.connect(process.env.MONGO_URI);

/* ---------- 1. Tags ---------- */
for (let i = 0; i < DEFAULT_TAGS.length; i++) {
  const { name, blurb } = DEFAULT_TAGS[i];
  const existing = await GalleryTag.findOne({ name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } });
  if (!existing) {
    await GalleryTag.create({ name, blurb, order: i + 1, published: true });
    summary.tagsCreated.push(name);
  }
}

/* ---------- 2. Sections ---------- */
const folders = [...new Set(images.map((img) => text(img.folder)).filter(Boolean))].sort(
  (a, b) => folderRank(b) - folderRank(a) || a.localeCompare(b, undefined, { numeric: true })
);
for (let i = 0; i < folders.length; i++) {
  const name = folders[i];
  const section = await GallerySection.findOne({ name });
  if (!section) {
    await GallerySection.create({ name, title: name, order: i + 1, published: true });
    summary.sectionsCreated.push(name);
  } else if (!section.order || section.order !== i + 1) {
    section.order = i + 1;
    await section.save();
  }
}

/* ---------- 3. Import archive photos as managed items ---------- */
const existingUrls = new Set((await GalleryItem.find({}, "url").lean()).map((it) => it.url));
const toImport = [];
images.forEach((img, index) => {
  const url = sitePath(img.src);
  if (!url || existingUrls.has(url)) return;
  const folder = text(img.folder) || "Gallery";
  const eventName = text(img.event) || folder;
  const caption = text(img.caption);
  const item = {
    type: "image",
    url,
    thumb: img.thumb ? sitePath(img.thumb) : url,
    category: folder,
    year: /^(\d{4})/.exec(folder)?.[1] || "",
    eventName,
    caption,
    description: "",
    alt: text(img.alt) || caption || eventName,
    order: index,
    featured: false,
    published: true,
    origin: "archive",
  };
  item.tags = [classify(item)];
  toImport.push(item);
});
if (toImport.length) {
  await GalleryItem.insertMany(toImport, { ordered: false });
  summary.itemsImported = toImport.length;
}

/* ---------- 4. Unpublish legacy duplicate re-uploads ---------- */
const covered = new Set();
for (const img of images) {
  const folder = text(img.folder) || "Gallery";
  covered.add(`${folder}::${signature(img.file)}`);
  covered.add(`${folder}::${signature(img.caption)}`);
}

const legacyCandidates = await GalleryItem.find({ published: true }).lean();
const legacyIds = [];
for (const item of legacyCandidates) {
  if (text(item.url).startsWith("/media/gallery/")) continue; // imported archive
  if (LEGACY_ARCHIVE_PATH.test(item.url)) {
    legacyIds.push(item._id);
    continue;
  }
  const key = `${item.category}::${signature(basenameOf(item.url))}`;
  const captionKey = `${item.category}::${signature(item.caption)}`;
  if (covered.has(key) || covered.has(captionKey)) legacyIds.push(item._id);
}
if (legacyIds.length) {
  await GalleryItem.updateMany({ _id: { $in: legacyIds } }, { $set: { published: false } });
  summary.legacyUnpublished = legacyIds.length;
}

console.log("tags created:", summary.tagsCreated.length ? summary.tagsCreated.join(", ") : "(none — already present)");
console.log("sections created:", summary.sectionsCreated.length ? summary.sectionsCreated.join(", ") : "(none — already present)");
console.log("archive items imported:", summary.itemsImported);
console.log("legacy duplicate re-uploads unpublished:", summary.legacyUnpublished);
console.log("totals -> sections:", await GallerySection.countDocuments(), "tags:", await GalleryTag.countDocuments(), "items:", await GalleryItem.countDocuments(), "published:", await GalleryItem.countDocuments({ published: true }));

await mongoose.disconnect();
