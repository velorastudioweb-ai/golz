/**
 * Fix testimonial photos: assign CC0 Indian faces from client/public/home-gallery/faces
 * to the 3 existing testimonial records in the database.
 * Idempotent: safe to re-run.
 * 
 *   node scripts/fix-testimonial-photos.mjs
 */
import "dotenv/config";
import mongoose from "mongoose";

const FACE_URLS = [
  "/home-gallery/faces/face-1.jpg",
  "/home-gallery/faces/face-2.jpg",
  "/home-gallery/faces/face-3.jpg",
];
const TESTIMONIAL_IDS = [
  "6aba467df80d49e74814a9f4",
  "6aba467df80d49e74814a9f6",
  "6aba467df80d49e74814a9f8",
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_DIRECT_URI);

  for (let i = 0; i < TESTIMONIAL_IDS.length; i++) {
    const id = TESTIMONIAL_IDS[i];
    const faceUrl = FACE_URLS[i];
    const result = await mongoose.connection.db.collection("testimonials").updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { photo: faceUrl } }
    );
    console.log(
      `Updated testimonial ${i + 1}: ${result.modifiedCount ? "modified" : "no change"} (id=${id})`
    );
  }

  const docs = await mongoose.connection.db
    .collection("testimonials")
    .find({}, { name: 1, photo: 1 })
    .toArray();
  console.log("\nCurrent testimonials:");
  docs.forEach((d) => console.log(` - ${d.name} | photo: ${d.photo}`));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exitCode = 1;
});