import express from "express";
import rateLimit from "express-rate-limit";
import Service from "../models/Service.js";
import Blog from "../models/Blog.js";
import GalleryItem from "../models/GalleryItem.js";
import GallerySection from "../models/GallerySection.js";
import GalleryTag from "../models/GalleryTag.js";
import Testimonial from "../models/Testimonial.js";
import ContactMessage from "../models/ContactMessage.js";
import Appointment from "../models/Appointment.js";
import Subscriber from "../models/Subscriber.js";
import Setting from "../models/Setting.js";
import { trackVisit } from "../middleware/trackVisit.js";
import { publishDueBlogs } from "../services/scheduledPublish.js";

const router = express.Router();

const formLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many submissions. Please try again later." },
});

async function getSetting(key, fallback = {}) {
  const doc = await Setting.findOne({ key });
  return doc ? doc.value : fallback;
}

/**
 * The administrator-managed gallery tags that may appear as public filter
 * chips, newest configuration order preserved. Only published tags are
 * returned; an empty list tells the frontend to fall back to its caption
 * classifier, which is how older deployments keep working.
 */
async function publishedGalleryTags() {
  const [tags, counts] = await Promise.all([
    GalleryTag.find({ published: true }).sort({ order: 1, createdAt: 1 }).lean(),
    GalleryItem.aggregate([{ $unwind: "$tags" }, { $group: { _id: "$tags", n: { $sum: 1 } } }]),
  ]);
  const map = Object.fromEntries(counts.map((c) => [c._id, c.n]));
  return tags.map((t) => ({ name: t.name, blurb: t.blurb || "", order: t.order || 0, count: map[t.name] || 0 }));
}

/**
 * Express 4 does not catch rejected promises from async handlers, so a failed
 * database query leaves the request hanging until the platform times out. Every
 * async route is wrapped so failures reach the error middleware as a 500
 * instead of an endless request.
 */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Aggregated payload for fast frontend page loads */
router.get("/site", asyncHandler(async (_req, res) => {
  try {
    const [general, homepage, about, seo, services, testimonials, gallery, blogs, categories] = await Promise.all([
      getSetting("general"),
      getSetting("homepage"),
      getSetting("about"),
      getSetting("seo"),
      Service.find({ published: true }).sort({ order: 1, createdAt: 1 }).limit(12),
      Testimonial.find({ published: true }).sort({ featured: -1, createdAt: -1 }).limit(12),
      GalleryItem.find({ published: true }).sort({ category: 1, order: 1, featured: -1, createdAt: 1 }),
      Blog.find({ published: true }).sort({ publishedAt: -1 }).limit(3),
      GalleryItem.distinct("category", { published: true }),
    ]);
    res.json({ general, homepage, about, seo, services, testimonials, gallery, blogs, galleryCategories: categories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}));

router.get("/services", asyncHandler(async (_req, res) => {
  const items = await Service.find({ published: true }).sort({ order: 1, createdAt: 1 });
  res.json(items);
}));

router.get("/services/:slug", asyncHandler(async (req, res) => {
  const item = await Service.findOne({ slug: req.params.slug, published: true });
  if (!item) return res.status(404).json({ message: "Service not found" });
  res.json(item);
}));

/**
 * Gallery items plus the section/category metadata the page needs, in a single
 * request. The frontend used to fire three calls (items, categories, sections)
 * on every render; bundling them removes duplicate round-trips and the chance of
 * the grid and its filters disagreeing.
 *
 * `category` accepts a section name (or "All") exactly as before, so existing
 * callers keep working.
 */
router.get("/gallery", asyncHandler(async (req, res) => {
  const { category } = req.query;

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));

  const filter = { published: true };
  if (category && category !== "All") filter.category = category;

  /* Sections before items: `order` restarts inside every section, so sorting on
     it alone interleaves the years and scrambles the gallery. */
  const GALLERY_SORT = { category: 1, order: 1, featured: -1, createdAt: 1 };

  const [items, total, sections, categories, tags] = await Promise.all([
    GalleryItem.find(filter).sort(GALLERY_SORT).skip((page - 1) * limit).limit(limit),
    GalleryItem.countDocuments(filter),
    GallerySection.find().sort({ order: 1, createdAt: 1 }).lean(),
    GalleryItem.distinct("category", { published: true }),
    publishedGalleryTags(),
  ]);

  const counts = await GalleryItem.aggregate([
    { $match: { published: true } },
    { $group: { _id: "$category", n: { $sum: 1 } } },
  ]);
  const countByCategory = Object.fromEntries(counts.map((c) => [c._id, c.n]));

  res.json({
    items,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    categories,
    tags,
    /* Sections with no published photos are omitted, unless the administrator
       ticked "show empty" on that section. A section that carries a description
       is kept even with no photos — it exists only to place that text under an
       event or year title. */
    sections: sections
      .map((s) => ({ ...s, count: countByCategory[s.name] || 0 }))
      .filter((s) => s.count > 0 || s.showEmpty || Boolean(s.description)),
  });
}));

router.get("/gallery/tags", asyncHandler(async (_req, res) => {
  res.json(await publishedGalleryTags());
}));

router.get("/gallery/categories", asyncHandler(async (_req, res) => {
  res.json(await GalleryItem.distinct("category", { published: true }));
}));

/**
 * Section list only (older callers / partial patch requests). Sections are
 * NEVER created here: a year is displayed because an administrator configured
 * it, not because a photo happened to reference an unknown group.
 */
router.get("/gallery/sections", asyncHandler(async (_req, res) => {
  const sections = await GallerySection.find().sort({ order: 1, createdAt: 1 }).lean();

  const counts = await GalleryItem.aggregate([
    { $match: { published: true } },
    { $group: { _id: "$category", n: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(counts.map((c) => [c._id, c.n]));
  res.json(
    sections
      .map((s) => ({ ...s, count: map[s.name] || 0 }))
      .filter((s) => s.count > 0 || s.showEmpty || Boolean(s.description))
  );
}));

router.get("/blogs", asyncHandler(async (req, res) => {
  /* On serverless there is no cron, so scheduled posts publish themselves here.
     Fire-and-forget: a failure must never break the listing. */
  publishDueBlogs();

  const { search, category, tag, page = 1, limit = 6, sort = "latest" } = req.query;
  const filter = { published: true };
  if (search) filter.$or = [
    { title: { $regex: search, $options: "i" } },
    { excerpt: { $regex: search, $options: "i" } },
    { content: { $regex: search, $options: "i" } },
  ];
  if (category && category !== "All") filter.category = category;
  if (tag) filter.tags = tag;
  const sortBy = sort === "popular" ? { views: -1 } : { publishedAt: -1, createdAt: -1 };
  const [items, total, categories, tags] = await Promise.all([
    Blog.find(filter).sort(sortBy).skip((page - 1) * limit).limit(Number(limit)),
    Blog.countDocuments(filter),
    Blog.distinct("category", { published: true }),
    Blog.distinct("tags", { published: true }),
  ]);
  res.json({ items, total, page: Number(page), pages: Math.ceil(total / limit), categories, tags });
}));

router.get("/blogs/:slug", asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, published: true });
  if (!blog) return res.status(404).json({ message: "Blog not found" });
  blog.views += 1;
  await blog.save();
  res.json(blog);
}));

router.get("/blogs/:slug/related", asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, published: true });
  if (!blog) return res.json([]);
  let related = await Blog.find({
    _id: { $ne: blog._id },
    published: true,
    $or: [{ category: blog.category }, { tags: { $in: blog.tags } }],
  })
    .sort({ publishedAt: -1 })
    .limit(3);
  if (related.length === 0) {
    related = await Blog.find({ _id: { $ne: blog._id }, published: true }).sort({ publishedAt: -1 }).limit(3);
  }
  res.json(related);
}));

router.get("/testimonials", asyncHandler(async (_req, res) => {
  const items = await Testimonial.find({ published: true }).sort({ featured: -1, createdAt: -1 }).limit(20);
  res.json(items);
}));

router.post("/visit", trackVisit);

router.post("/contact", formLimiter, async (req, res) => {
  try {
    const msg = await ContactMessage.create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      subject: req.body.subject,
      message: req.body.message,
    });
    res.status(201).json({ message: "Message sent successfully. We will get back to you soon.", id: msg._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/appointments", formLimiter, async (req, res) => {
  try {
    const appt = await Appointment.create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      service: req.body.service,
      preferredDate: req.body.preferredDate,
      preferredTime: req.body.preferredTime,
      message: req.body.message,
    });
    res.status(201).json({ message: "Consultation request received. We will confirm your slot shortly.", id: appt._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/subscribe", formLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Please enter a valid email address." });
    await Subscriber.updateOne({ email }, { $set: { active: true } }, { upsert: true });
    res.json({ message: "Subscribed! You'll hear from us soon." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
