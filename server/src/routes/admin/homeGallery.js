import express from "express";
import HomeGalleryItem from "../../models/HomeGalleryItem.js";
import ActivityLog from "../../models/ActivityLog.js";

const router = express.Router();

const TABS = ["award", "milestone"];

function log(user, action, details) {
  return ActivityLog.create({ user, action, details });
}

router.get("/", async (_req, res) => {
  res.json(await HomeGalleryItem.find().sort({ tab: 1, order: 1, createdAt: 1 }));
});

router.post("/", async (req, res) => {
  try {
    if (!req.body.image) return res.status(400).json({ message: "An image is required" });
    const tab = TABS.includes(req.body.tab) ? req.body.tab : "milestone";
    const last = await HomeGalleryItem.findOne({ tab }).sort({ order: -1 });
    const item = await HomeGalleryItem.create({
      image: req.body.image,
      thumb: req.body.thumb || req.body.image,
      caption: req.body.caption || "",
      tab,
      order: Number.isFinite(req.body.order) ? req.body.order : (last?.order ?? 0) + 1,
      published: req.body.published !== false,
    });
    await log(req.user.name, "Homepage gallery added", `Added ${tab} image to the homepage gallery`);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* Reordering sends the tab's full id list in its new display order. */
router.put("/reorder", async (req, res) => {
  try {
    const { tab, ids } = req.body;
    if (!TABS.includes(tab) || !Array.isArray(ids)) return res.status(400).json({ message: "tab and ids are required" });
    await Promise.all(ids.map((id, index) => HomeGalleryItem.updateOne({ _id: id }, { $set: { order: index } })));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const item = await HomeGalleryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Homepage gallery image not found" });
    const allowed = ["caption", "tab", "order", "published", "image", "thumb"];
    for (const key of allowed) if (key in req.body) item[key] = req.body[key];
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const item = await HomeGalleryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Homepage gallery image not found" });
    await log(req.user.name, "Homepage gallery deleted", "Removed an image from the homepage gallery");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
