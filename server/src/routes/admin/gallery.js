import express from "express";
import mongoose from "mongoose";
import GalleryItem from "../../models/GalleryItem.js";
import GallerySection from "../../models/GallerySection.js";
import ActivityLog from "../../models/ActivityLog.js";
import { processUpload } from "../../middleware/upload.js";
import { ensureMediaRecord, removeStoredFile } from "../../utils/media.js";
import Media from "../../models/Media.js";

const router = express.Router();

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

const ITEM_FIELDS = ["type", "url", "thumb", "year", "eventName", "caption", "description", "alt", "order", "featured", "published"];

/** Best-effort removal of the media record + stored file for one gallery item's URL. */
async function removeItemMedia(url, thumb) {
  const media = url ? await Media.findOne({ url }) : null;
  if (media) {
    await removeStoredFile(media);
    await Media.deleteOne({ _id: media._id });
    return;
  }
  await removeStoredFile({ storage: "blob", storageKey: url, resourceType: "image" });
  if (thumb && thumb !== url) await removeStoredFile({ storage: "blob", storageKey: thumb, resourceType: "image" });
}

function log(user, action, details) {
  return ActivityLog.create({ user, action, details });
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Cleans the optional per-event description map down to `{ eventTitle: text }`
 * with trimmed non-empty values. Blank entries are dropped, which is how the
 * admin removes a subsection description, and any non-object payload degrades
 * to an empty map so a bad body can never break a save.
 */
export function cleanEventDescriptions(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out = {};
  for (const [key, desc] of Object.entries(value)) {
    const name = String(key || "").trim();
    const text = typeof desc === "string" ? desc.trim() : "";
    if (name && text) out[name] = text;
  }
  return out;
}

async function sectionCounts() {
  const counts = await GalleryItem.aggregate([{ $group: { _id: "$category", n: { $sum: 1 } } }]);
  return Object.fromEntries(counts.map((c) => [c._id, c.n]));
}

/** Resolve a section record by name (case-insensitive), returns _id or null. */
async function findSectionId(name) {
  const section = await GallerySection.findOne({ name: new RegExp(`^${escapeRegExp(name || "General")}$`, "i") });
  return section ? section._id : null;
}

// ---------- Sections ----------

router.get("/sections", async (_req, res) => {
  const [sections, map] = await Promise.all([GallerySection.find().sort({ order: 1, createdAt: 1 }), sectionCounts()]);
  res.json(sections.map((s) => ({ ...s.toObject(), count: map[s.name] || 0 })));
});

router.post("/sections", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Section name is required" });
    const exists = await GallerySection.findOne({ name: { $regex: new RegExp(`^${escapeRegExp(name)}$`, "i") } });
    if (exists) return res.status(400).json({ message: "A section with this name already exists" });
    const max = await GallerySection.findOne().sort({ order: -1 });
    const section = await GallerySection.create({
      name,
      title: String(req.body.title || "").trim() || name,
      description: String(req.body.description || "").trim(),
      eventDescriptions: cleanEventDescriptions(req.body.eventDescriptions),
      cover: req.body.cover || "",
      order: (max?.order ?? 0) + 1,
      published: req.body.published !== false,
    });
    await log(req.user.name, "Gallery section added", `Added section "${name}"`);
    res.status(201).json(section);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/sections/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid section ID" });
    const section = await GallerySection.findById(req.params.id);
    if (!section) return res.status(404).json({ message: "Section not found" });
    const oldName = section.name;
    const name = String(req.body.name || "").trim();
    if (name && name !== oldName) {
      const dup = await GallerySection.findOne({
        _id: { $ne: section._id },
        name: { $regex: new RegExp(`^${escapeRegExp(name)}$`, "i") },
      });
      if (dup) return res.status(400).json({ message: "A section with this name already exists" });
      section.name = name;
      await GalleryItem.updateMany({ category: oldName }, { $set: { category: name, gallerySectionId: section._id } });
      await log(req.user.name, "Gallery section renamed", `Renamed to "${name}"`);
    }
    if ("title" in req.body) section.title = String(req.body.title || "").trim() || oldName;
    if ("description" in req.body) section.description = String(req.body.description || "").trim();
    if ("eventDescriptions" in req.body) section.eventDescriptions = cleanEventDescriptions(req.body.eventDescriptions);
    if ("cover" in req.body) section.cover = req.body.cover || "";
    if ("published" in req.body) section.published = !!req.body.published;
    await section.save();
    await log(req.user.name, "Gallery section updated", `Updated "${section.name}"`);
    res.json(section);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/sections/reorder", async (req, res) => {
  try {
    const ids = req.body.ids || [];
    if (!Array.isArray(ids) || ids.some((id) => !validId(id))) {
      return res.status(400).json({ message: "Invalid section IDs" });
    }
    for (let i = 0; i < ids.length; i++) {
      await GallerySection.updateOne({ _id: ids[i] }, { $set: { order: i + 1 } });
    }
    await log(req.user.name, "Gallery sections reordered", "Changed section order");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/sections/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid section ID" });
    const section = await GallerySection.findByIdAndDelete(req.params.id);
    if (!section) return res.status(404).json({ message: "Section not found" });
    await GalleryItem.updateMany({ category: section.name }, { $set: { category: "General", gallerySectionId: null } });
    await log(req.user.name, "Gallery section deleted", `Deleted "${section.name}", items moved to General`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Items ----------

router.get("/", async (req, res) => {
  const { category, type } = req.query;
  const filter = {};
  if (category && category !== "All") filter.category = category;
  if (type && type !== "All") filter.type = type;
  res.json(await GalleryItem.find(filter).sort({ order: 1, featured: -1, createdAt: -1 }));
});

router.get("/categories", async (_req, res) => {
  res.json(await GalleryItem.distinct("category"));
});

router.post("/", async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.url && !req.file) return res.status(400).json({ message: "Image or video is required" });
    if (req.file) {
      const isVideo = /^video\//.test(req.file.mimetype);
      const upload = await processUpload(req.file, isVideo ? "golz/videos" : "golz/gallery");
      data.url = upload.url;
      data.thumb = upload.thumb;
      data.type = isVideo ? "video" : "image";
      data.gallerySectionId = await findSectionId(data.category);
      await ensureMediaRecord({ file: req.file, upload, user: req.user, gallerySectionId: String(data.category || "").trim() });
    }
    const maxOrder = await GalleryItem.findOne().sort({ order: -1 });
    data.order = (maxOrder?.order ?? 0) + 1;
    const item = await GalleryItem.create(data);
    await log(req.user.name, "Gallery item added", `Added ${item.type} in "${item.category}"`);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/upload", async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const isVideo = /^video\//.test(req.file.mimetype);
    const upload = await processUpload(req.file, isVideo ? "golz/videos" : "golz/gallery");
    await ensureMediaRecord({
      file: req.file,
      upload,
      user: req.user,
      gallerySectionId: String(req.body.category || "General").trim(),
    });
    const maxOrder = await GalleryItem.findOne().sort({ order: -1 });
    const category = req.body.category || "General";
    const item = await GalleryItem.create({
      type: isVideo ? "video" : "image",
      url: upload.url,
      thumb: upload.thumb,
      category,
      gallerySectionId: await findSectionId(category),
      caption: req.body.caption || "",
      description: req.body.description || "",
      alt: req.body.alt || "",
      order: (maxOrder?.order ?? 0) + 1,
      published: true,
    });
    await log(req.user.name, "Gallery upload", `Uploaded ${item.type}`);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid item ID" });
    const item = await GalleryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if ("category" in req.body && String(req.body.category) !== item.category) {
      item.category = String(req.body.category || "General");
      item.gallerySectionId = await findSectionId(item.category);
    }
    for (const field of ITEM_FIELDS) {
      if (field in req.body) item[field] = req.body[field];
    }
    await item.save();
    await log(req.user.name, "Gallery item updated", `Updated ${item.type}`);
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/reorder", async (req, res) => {
  try {
    const ids = req.body.ids || [];
    if (!Array.isArray(ids) || ids.some((id) => !validId(id))) {
      return res.status(400).json({ message: "Invalid item IDs" });
    }
    for (let i = 0; i < ids.length; i++) {
      await GalleryItem.updateOne({ _id: ids[i] }, { $set: { order: i + 1 } });
    }
    await log(req.user.name, "Gallery reordered", "Changed gallery order");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid item ID" });
    const item = await GalleryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    await removeItemMedia(item.url, item.thumb);
    await log(req.user.name, "Gallery item deleted", `Deleted ${item.type}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/bulk-delete", async (req, res) => {
  try {
    const ids = req.body.ids || [];
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "No media selected" });
    const items = await GalleryItem.find({ _id: { $in: ids } });
    await GalleryItem.deleteMany({ _id: { $in: ids } });
    for (const item of items) await removeItemMedia(item.url, item.thumb);
    await log(req.user.name, "Gallery bulk delete", `Deleted ${items.length} items`);
    res.json({ ok: true, deleted: items.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
