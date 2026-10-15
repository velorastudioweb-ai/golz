import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    /* Optional blurbs for the event subsections inside this section, keyed by
       the event title (e.g. { "AVP Program – 4th Feb 2024": "text shown under
       that event's heading" }). Stored as a plain object so records written
       before the field existed keep working unchanged. */
    eventDescriptions: { type: mongoose.Schema.Types.Mixed },
    cover: { type: String, default: "" },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("GallerySection", schema);
