import mongoose from "mongoose";

/**
 * A homepage gallery photo — one tile under the home page's
 * "Awards / Recognitions" or "Milestones" tabs.
 *
 * The twelve bundled photos in client/public/home-gallery remain the offline
 * fallback; these records are what an administrator manages at runtime
 * (image, caption text, which tab, order and visibility) without a code change.
 * The home page shows the bundled set only while the database has no records.
 */
const schema = new mongoose.Schema(
  {
    image: { type: String, required: true, trim: true },
    thumb: { type: String, default: "" },
    caption: { type: String, default: "", trim: true },
    tab: { type: String, enum: ["award", "milestone"], default: "milestone" },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("HomeGalleryItem", schema);
