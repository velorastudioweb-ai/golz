import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, default: "Sparkles" },
    image: { type: String, default: "" },
    category: { type: String, default: "" },
    shortDesc: { type: String, default: "" },
    description: { type: String, default: "" },
    forWho: { type: String, default: "" },
    benefits: [{ type: String }],
    planCovers: [{ type: String }],
    credibility: { type: String, default: "" },
    suitableFor: [{ type: String }],
    duration: { type: String, default: "" },
    price: { type: Number, default: null },
    order: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Service", schema);
