import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import cron from "node-cron";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import { requireAuth, requireAdmin } from "./middleware/auth.js";
import { dbGate } from "./middleware/dbGate.js";
import { upload, UPLOAD_DIR } from "./middleware/upload.js";
import { seedIfEmpty } from "./seed.js";

import publicRoutes from "./routes/public.js";
import adminAuthRoutes from "./routes/admin/auth.js";
import adminServiceRoutes from "./routes/admin/services.js";
import adminBlogRoutes from "./routes/admin/blogs.js";
import adminGalleryRoutes from "./routes/admin/gallery.js";
import adminTestimonialRoutes from "./routes/admin/testimonials.js";
import adminMessageRoutes from "./routes/admin/messages.js";
import adminSettingRoutes from "./routes/admin/settings.js";
import adminDashboardRoutes from "./routes/admin/dashboard.js";
import adminMediaRoutes from "./routes/admin/media.js";
import adminHomeGalleryRoutes from "./routes/admin/homeGallery.js";
import Blog from "./models/Blog.js";
import Service from "./models/Service.js";
import Setting from "./models/Setting.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set("trust proxy", 1);
// Must be registered before any route: on Vercel the function is cold, and a
// gate mounted later would sit behind handlers that already query the database.
// Scoped to /api on purpose: a database outage should degrade data endpoints
// (which the client handles with its snapshot + retry) without also taking the
// app shell down with a 503.
app.use("/api", dbGate());
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", credentials: true }));
// On Vercel the body is already parsed for JSON payloads — skip re-parsing.
app.use((req, _res, next) => { if (req.body) req._body = true; next(); });
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "30d" }));

// ---------- Routes ----------
app.use("/api/public", publicRoutes);
app.use("/api/auth", adminAuthRoutes);

const adminGuard = [requireAuth, requireAdmin];
const fileUpload = upload.single("file");
// Admin APIs are always live — never cache so uploads/deletes show immediately.
app.use("/api/admin", (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
app.use("/api/admin/dashboard", ...adminGuard, adminDashboardRoutes);
app.use("/api/admin/services", ...adminGuard, fileUpload, adminServiceRoutes);
app.use("/api/admin/blogs", ...adminGuard, adminBlogRoutes);
app.use("/api/admin/gallery", ...adminGuard, fileUpload, adminGalleryRoutes);
app.use("/api/admin/testimonials", ...adminGuard, fileUpload, adminTestimonialRoutes);
app.use("/api/admin/messages", ...adminGuard, adminMessageRoutes);
app.use("/api/admin/settings", ...adminGuard, adminSettingRoutes);
app.use("/api/admin/media", ...adminGuard, fileUpload, adminMediaRoutes);
app.use("/api/admin/home-gallery", ...adminGuard, fileUpload, adminHomeGalleryRoutes);

// Generic file upload (used by admin editors for covers, avatars, inline images)
app.post("/api/admin/upload", ...adminGuard, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const { processUpload } = await import("./middleware/upload.js");
    const { ensureMediaRecord } = await import("./utils/media.js");
    const upload = await processUpload(req.file, "golz/misc");
    const media = await ensureMediaRecord({ file: req.file, upload, user: req.user });
    res.json({ url: upload.url, thumb: upload.thumb, _id: media._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- SEO endpoints ----------
app.get("/robots.txt", async (_req, res) => {
  const seo = (await Setting.findOne({ key: "seo" }))?.value || {};
  const site = process.env.SITE_URL || "https://www.golznutrition.in";
  res.type("text/plain").send(
    `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${site}/sitemap.xml\n` +
      (seo.robotsText ? `\n${seo.robotsText}` : "")
  );
});

app.get("/sitemap.xml", async (_req, res) => {
  const site = process.env.SITE_URL || "https://www.golznutrition.in";
  const [services, blogs] = await Promise.all([
    Service.find({ published: true }),
    Blog.find({ published: true }),
  ]);
  const staticPages = ["", "about", "services", "gallery", "blog", "contact", "privacy-policy", "terms"];
  const urls = [
    ...staticPages.map((p) => `<url><loc>${site}/${p}</loc><changefreq>weekly</changefreq></url>`),
    ...services.map((s) => `<url><loc>${site}/services/${s.slug}</loc></url>`),
    ...blogs.map((b) => `<url><loc>${site}/blog/${b.slug}</loc></url>`),
  ];
  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`
  );
});

// ---------- Scheduled blog publishing ----------
// Serverless instances are short-lived and multiply per region, so a timer here
// would never fire reliably and would keep every instance warm. Only run it on
// a long-lived Node process.
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  cron.schedule("* * * * *", async () => {
    try {
      const due = await Blog.find({ published: false, scheduledAt: { $ne: null, $lte: new Date() } });
      for (const b of due) {
        b.published = true;
        b.publishedAt = b.publishedAt || new Date();
        await b.save();
        console.log(`[cron] published scheduled blog: ${b.title}`);
      }
    } catch (err) {
      console.error("[cron] error:", err.message);
    }
  });
}

// ---------- Production static hosting ----------
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  /* Hashed build assets may be cached for an hour, but index.html must always
     revalidate — a cached shell is what makes an already-deployed change look
     like it "reverts" for about an hour before the old copy reappears. */
  app.use(
    express.static(clientDist, {
      maxAge: "1h",
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) res.setHeader("Cache-Control", "no-cache");
      },
    })
  );
  app.get(/^\/(?!api|uploads).*/, (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use("/api", (_req, res) => res.status(404).json({ message: "API endpoint not found" }));
app.use((err, _req, res, _next) => {
  console.error("[error]", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

export async function bootstrap() {
  await connectDB();
  await seedIfEmpty();
}

export { app };

/* On Vercel this file is the lambda entry, so the DB connection (and optional
   first-run seeding) is kicked off eagerly; failures are logged and left to the
   gate, which answers 503 honestly. */
if (process.env.VERCEL) {
  bootstrap().catch((err) => console.error("[api] bootstrap failed:", err.message));
}

export default app;

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("src/index.js") || process.argv[1]?.replace(/\\/g, "/").endsWith("/index.js");

if (isDirectRun) {
  bootstrap()
    .then(() => app.listen(PORT, () => console.log(`[server] GOLZ API running on http://localhost:${PORT}`)))
    .catch((err) => {
      console.error("[server] failed to start:", err);
      process.exit(1);
    });
}
