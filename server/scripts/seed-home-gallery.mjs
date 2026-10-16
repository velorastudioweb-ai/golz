/**
 * Puts the twelve bundled homepage gallery photos (client/public/home-gallery)
 * under admin management, preserving their captions, tab assignment and order,
 * so the site keeps showing exactly what it shows today while the admin gains
 * full image/text control over the Awards / Recognitions and Milestones tabs.
 *
 * Idempotent: does nothing when the collection already has records.
 *
 *   node scripts/seed-home-gallery.mjs
 */
import "dotenv/config";
import mongoose from "mongoose";
import HomeGalleryItem from "../src/models/HomeGalleryItem.js";

/* Mirrors HOME_GALLERY_CAPTIONS / AWARD_PHOTOS in client/src/pages/Home.jsx. */
const CAPTIONS = {
  2: "Recognition by IISF 2020 — newspaper",
  3: "MOU with St Philomean's College — June 2015",
  4: "Awareness on food safety — April 2016",
  5: "Nov 2020 — SIG-PHN Pan India (IDA)",
  6: "April 2016 — Food Safety & Food Law for post graduate Nutrition & dietetics students",
  7: "The Changemaker Award — Aryan Shiksha — 2022",
  8: "Lucknow — March 6, 7, 8, 2024",
  9: "AVP — program VO2 Max",
  11: "Award Function — Feb 2020",
  12: "IKMC 2018, Hyderabad",
};
const AWARD_PHOTOS = new Set([2, 7, 11, 12]);

async function main() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_DIRECT_URI);

  const existing = await HomeGalleryItem.countDocuments();
  if (existing > 0) {
    console.log(`home gallery already has ${existing} managed images — nothing to do.`);
    return;
  }

  const docs = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const padded = String(n).padStart(2, "0");
    const caption = CAPTIONS[n] || "";
    const url = `/home-gallery/home-${padded}.jpg`;
    return {
      image: url,
      thumb: url,
      caption,
      tab: AWARD_PHOTOS.has(n) ? "award" : "milestone",
      order: n,
      published: true,
    };
  });

  await HomeGalleryItem.insertMany(docs);
  console.log(
    `inserted ${docs.length} homepage gallery images ` +
      `(${docs.filter((d) => d.tab === "award").length} awards, ` +
      `${docs.filter((d) => d.tab === "milestone").length} milestones).`
  );
}

main()
  .catch((err) => {
    console.error("seed-home-gallery failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
