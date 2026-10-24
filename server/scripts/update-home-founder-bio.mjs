/**
 * One-off: updates the homepage founder bio (settings key "homepage",
 * value.aboutPreview.text) to the approved copy. Safe to re-run.
 *
 *   node scripts/update-home-founder-bio.mjs
 */
import "dotenv/config";
import mongoose from "mongoose";

const FOUNDER_BIO =
  "Dr. Sushma Appaiah is the Founder of GOLZ (Giggles of Livez) and a distinguished nutrition scientist with 19 years of experience in clinical nutrition, corporate wellness, and health counselling.\n\n" +
  "She holds a Ph.D. in Food Science & Technology from CSIR-CFTRI, Mysore, and an M.Sc. in Food & Nutrition (2nd Rank) from the University of Mysore.\n\n" +
  "Over the years, she has helped clients across 13 countries achieve sustainable health through evidence-based nutrition and personalized care.\n\n" +
  "Recently honoured with Karnataka Pride Award for remarkable achievements & transformative contributions in the field of nutrition and wellness.\n\n" +
  "A recipient of the DST Women Scientist Award and recognized as the Most Innovative Nutrition Counsellor of the Year, Dr. Sushma is known for developing innovative food formulations for special children and translating scientific research into practical nutrition solutions.\n\n" +
  "HER AREAS OF EXPERTISE INCLUDE REVERSING DIABETES, PCOD (RECENTLY TERMED AS PMOS), THYROID DISORDERS, PREGNANCY NUTRITION, SPORTS NUTRITION, ASD/AUTISM AND SPECIAL CHILD NUTRITION, NUTRIGENOMICS, GUTBIOMICS, EMPOWERING INDIVIDUALS AND FAMILIES TO BUILD HEALTHIER LIVES THROUGH PERSONALIZED NUTRITION.";

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const res = await db
    .collection("settings")
    .updateOne({ key: "homepage" }, { $set: { "value.aboutPreview.text": FOUNDER_BIO } });
  console.log("homepage matched/modified:", res.matchedCount, res.modifiedCount);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
