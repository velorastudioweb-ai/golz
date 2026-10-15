import mongoose from "mongoose";

/**
 * A browsable gallery tag (the public page's "Type" filter chips).
 *
 * The list used to live as regex rules in the frontend; it is now data so an
 * administrator can create, rename, reorder, hide and delete tags without a
 * code change. Deleting a tag only detaches it from images — photos are never
 * removed with their tag.
 */
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    blurb: { type: String, default: "", trim: true },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("GalleryTag", schema);
