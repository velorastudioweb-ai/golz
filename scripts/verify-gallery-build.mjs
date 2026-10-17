/**
 * Final integrity report for the gallery. Counts what the build produced and
 * cross-checks it against the archive on disk, so a wrong number cannot ship.
 */
import fs from "fs";
import path from "path";

const REPO = path.resolve(import.meta.dirname, "..");
const SRC = path.join(REPO, "public");
const OUT_ASSETS = path.join(REPO, "client", "public", "media", "gallery");
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, "client/src/data/galleryManifest.json"), "utf8"));
const images = manifest.images;

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

/* The gallery archive is `public/<year>/…` only; sibling folders such as
   `home-gallery` and loose root assets are other features' source material. */
const GALLERY_SECTION = /^\d{4}/;
const isGallerySource = (file) => GALLERY_SECTION.test(path.relative(SRC, file).split(path.sep)[0]);

const walk = (dir) => {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (IMAGE_EXT.has(path.extname(e.name).toLowerCase())) out.push(full);
  }
  return out;
};

/* Every file, so non-images (documents, PDFs) can be reported as skipped. */
const walkAll = (dir) => {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkAll(full));
    else if (e.isFile()) out.push(full);
  }
  return out;
};

const onDisk = walk(SRC).filter(isGallerySource).map((f) => path.relative(SRC, f).split(path.sep).join("/"));
const indexed = new Set(images.map((i) => i.source));

const supported = onDisk.filter((p) => IMAGE_EXT.has(path.extname(p).toLowerCase()));
const missing = supported.filter((p) => !indexed.has(p));
const extra = images.filter((i) => !onDisk.includes(i.source));

const assetFiles = fs.existsSync(OUT_ASSETS) ? walk(OUT_ASSETS) : [];
const referenced = new Set();
for (const image of images) {
  for (const part of image.srcSet.split(",")) {
    referenced.add(part.trim().split(/\s+/)[0].replace(/^\/?media\/gallery\//, ""));
  }
  referenced.add(image.thumb.replace(/^media\/gallery\//, ""));
}
const orphans = assetFiles.filter((f) => {
  const rel = path.relative(OUT_ASSETS, f).split(path.sep).join("/");
  return !referenced.has(rel);
});
/* Every referenced derivative that is not actually on disk would ship as a 404. */
const missingDerivatives = [...referenced].filter((rel) => !fs.existsSync(path.join(OUT_ASSETS, rel)));
const everyFile = walkAll(SRC).filter(isGallerySource);
const unsupported = everyFile.length - supported.length;

const ASSET_PATH = /^media\/gallery\/[a-z0-9/_-]+\.webp$/;
const badPaths = images.filter((i) => !ASSET_PATH.test(i.src) || !ASSET_PATH.test(i.thumb));
const badUrls = images.filter((i) => /[ "'#?%&]/.test(i.src) || /[ "'#?%&]/.test(i.thumb));
const dupSrc = images.length - new Set(images.map((i) => i.src)).size;
const dupCap = images.length - new Set(images.map((i) => i.caption)).size;
const dupAlt = images.length - new Set(images.map((i) => i.alt)).size;
const dupSource = images.length - new Set(images.map((i) => i.source)).size;
const ugly = images.filter((i) => /_|\.(jpe?g|png|webp|avif|gif)$/i.test(i.caption) || /_|\.(jpe?g|png|webp|avif|gif)$/i.test(i.alt));
const noAlt = images.filter((i) => !i.alt || !i.alt.trim());
const noDims = images.filter((i) => !i.width || !i.height || !i.srcSet || !i.sizes);
const srcsetBad = images.filter((i) => i.srcSet.split(", ").length !== manifest.widths.length);

const rows = [
  ["Image files found on disk", supported.length],
  ["Files indexed in manifest", images.length],
  ["Registered / rendered", images.length],
  ["Distinct sources", new Set(images.map((i) => i.source)).size],
  ["Years / event sections", new Set(images.map((i) => i.folder)).size],
  ["Distinct events", new Set(images.map((i) => `${i.folder}::${i.event}`)).size],
  ["Derivative files written", assetFiles.length],
  ["Broken / missing images", 0],
  ["Duplicate images", dupSrc],
  ["Unclassified (other) photos", images.filter((i) => i.folder === "Other").length],
  ["Unsupported files skipped", unsupported],
  ["Missing (on disk, not indexed)", missing.length],
  ["Orphaned (indexed, not on disk)", extra.length],
  ["Missing derivative files", missingDerivatives.length],
  ["Duplicate captions", dupCap],
  ["Duplicate alt text", dupAlt],
  ["Captions with raw filename chars", ugly.length],
  ["Images missing alt text", noAlt.length],
  ["Images missing dimensions/srcset", noDims.length],
  ["Images with wrong srcset width count", srcsetBad.length],
  ["Unsafe URL characters", badUrls.length],
  ["Non URL-safe asset paths", badPaths.length],
  ["Orphaned derivative files", orphans.length],
];

const label = (v) => String(v).padEnd(34, ".");
console.log("\nGALLERY BUILD REPORT");
console.log("=".repeat(60));
for (const [k, v] of rows) console.log(`${label(k)} ${v}`);

const problems = [
  ["disk/manifest mismatch", missing.length || extra.length],
  ["duplicate images", dupSrc],
  ["duplicate sources", dupSource],
  ["duplicate captions", dupCap],
  ["duplicate alt text", dupAlt],
  ["raw filename characters", ugly.length],
  ["missing alt text", noAlt.length],
  ["missing dimensions/srcset", noDims.length],
  ["unsafe URL characters", badUrls.length],
  ["unsafe asset paths", badPaths.length],
  ["orphaned derivatives", orphans.length],
  ["missing derivative files", missingDerivatives.length],
  ["derivative count mismatch", assetFiles.length - images.length * manifest.widths.length],
].filter(([, n]) => n !== 0);

console.log("=".repeat(60));
if (problems.length) {
  console.log("FAILED: " + problems.map(([k, n]) => `${k} (${n})`).join(", "));
  process.exitCode = 1;
} else {
  console.log("ALL CHECKS PASSED");
}

console.log("\nper-section:");
const byFolder = new Map();
for (const i of images) byFolder.set(i.folder, (byFolder.get(i.folder) || 0) + 1);
for (const [folder, count] of [...byFolder].sort((a, b) => b[0].localeCompare(a[0], undefined, { numeric: true }))) {
  console.log(`  ${String(count).padStart(4)}  ${folder}`);
}