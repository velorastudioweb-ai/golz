import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video"], default: "image" },
    url: { type: String, required: true },
    thumb: { type: String, default: "" },
    category: { type: String, default: "General" },
    gallerySectionId: { type: mongoose.Schema.Types.ObjectId, ref: "GallerySection", default: null, index: true },
    year: { type: String, default: "", trim: true },
    eventName: { type: String, default: "", trim: true },
    caption: { type: String, default: "" },
    description: { type: String, default: "" },
    alt: { type: String, default: "" },
    /* Tag names assigned in the admin (managed via GalleryTag). Empty means the
       public page classifies the photo with its caption-wording fallback. */
    tags: { type: [String], default: [] },
    /* "archive" marks a photo imported from the bundled /media/gallery library;
       blank marks an administrator's own upload. Never shown publicly. */
    origin: { type: String, default: "" },
    order: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("GalleryItem", schema);
