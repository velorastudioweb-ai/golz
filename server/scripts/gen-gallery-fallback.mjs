// One-off generator: emits client/src/data/galleryFallback.js from the live
// GalleryItem records so the read-only fallback matches the CMS exactly.
import "dotenv/config";
import mongoose from "mongoose";
import GalleryItem from "../src/models/GalleryItem.js";

await mongoose.connect(process.env.MONGO_DIRECT_URI || process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });

const docs = await GalleryItem.find({}).sort({ category: 1, order: 1, createdAt: 1 }).lean();

const KEEP = ["_id", "type", "url", "thumb", "category", "year", "eventName", "caption", "alt", "order", "featured", "published"];

const clean = docs.map((d) => {
  const out = {};
  for (const k of KEEP) if (d[k] !== undefined && d[k] !== null) out[k] = d[k];
  return out;
});

const body = clean.map((r) => "  " + JSON.stringify(r) + ",").join("\n");

const file = `/**
 * Read-only snapshot of the GOLZ gallery, taken from the CMS records.
 *
 * This file is NEVER written to the database and never replaces CMS data. It
 * exists purely so /gallery always shows real photographs even if the public
 * API is unreachable on a cold Vercel start. Every photo is a genuine GOLZ
 * archive image on Vercel Blob; the admin panel remains the source of truth.
 *
 * Regenerate with server/scripts/gen-gallery-fallback.mjs after adding or
 * editing gallery items.
 */
const GALLERY_FALLBACK = [
${body}
];

export default GALLERY_FALLBACK;
`;

const { writeFileSync, mkdirSync } = await import("node:fs");
mkdirSync("../client/src/data", { recursive: true });
writeFileSync("../client/src/data/galleryFallback.js", file);
console.log(`wrote ${clean.length} gallery items, ${file.length} bytes`);

await mongoose.disconnect();
