/**
 * Builds the gallery image index from the raw photo library in `public/`.
 *
 * Why this exists
 * ---------------
 * The archive holds 140+ phone photos (~4608x3456, hundreds of MB) arranged in
 * year/event folders. Those files are source material: they must not be edited,
 * renamed or moved, and they are far too large to deploy or to page-load.
 * So this script *reads* them and emits deployable derivatives plus a manifest.
 *
 * What it guarantees
 * ------------------
 *  - fully recursive discovery of every supported image inside `public/<year>/`
 *    folders only: sibling folders such as `home-gallery` and loose root assets
 *    (`logo.png`, `doctor.png`) are managed elsewhere and stay out of the gallery;
 *  - automatic grouping: the top-level folder becomes the year/event section,
 *    and the next folder down (when present) becomes the event name;
 *  - URL-safe output paths (spaces, brackets, commas and ampersands in folder
 *    names such as "2021 B 1" are slugified, never emitted raw);
 *  - readable captions derived from the filename when no caption exists
 *    ("annual_meet_2019.jpg" -> "Annual Meet 2019"), falling back to the event;
 *  - original files are opened read-only and never written to.
 *
 * Nothing here is hand-maintained: drop a new photo into `public/<year>/` and
 * the next build discovers it.
 *
 * Usage
 * -----
 *   node scripts/generate-gallery-index.mjs
 *   node scripts/generate-gallery-index.mjs --check   # verify, write nothing
 *
 * When the archive is absent (for example a Vercel build, which only receives
 * the committed derivatives) the script leaves the existing manifest untouched
 * and exits successfully, so a build never fails because of missing sources.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");

const SRC = path.join(REPO, "public");
/* Derivatives live under `media/` rather than `gallery/`: a top-level directory
   named after a route makes `/gallery` 301-redirect to `/gallery/`, and on a
   static host that directory has no index.html to fall back to. */
const ASSET_PREFIX = "media/gallery";
const OUT_ASSETS = path.join(REPO, "client", "public", "media", "gallery");
const OUT_MANIFEST = path.join(REPO, "client", "src", "data", "galleryManifest.json");

const CHECK_ONLY = process.argv.includes("--check");

/** Every extension the gallery must support. */
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

/** Responsive widths. The largest doubles as the lightbox source. */
const WIDTHS = (process.env.GALLERY_WIDTHS || "800,1600")
  .split(",")
  .map((w) => Number(w.trim()))
  .filter((w) => Number.isFinite(w) && w > 0)
  .sort((a, b) => a - b);

/** Responsive sizes hint handed to the browser. */
const SIZES =
  "(min-width: 1280px) 22vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw";

const QUALITY = Number(process.env.GALLERY_QUALITY || 76);

/* ------------------------------------------------------------------ helpers */

const slug = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['\u2019]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";

const collapse = (value) => value.replace(/\s+/g, " ").trim();

/** Names that carry no information ("pic 3", "IMG_0012", "Screenshot"). */
const GENERIC_STEM = /^(pic|pics|img|image|images|photo|photos|pxl|p|dsc|dscn|dscno|dsc_\d+|file|untitled|screenshot|pxl_\d+)?[\s._\-#]*\d*[\s._\-#]*$/i;

/** Small words left lowercase unless they open the caption. */
const MINOR_WORDS = new Set(["of", "on", "in", "at", "for", "to", "and", "the", "a", "an", "by", "with", "vs", "or"]);

/**
 * Turns a filename into something a human would accept as a caption:
 *   "annual_meet_2019.jpg"      -> "Annual Meet 2019"
 *   "IMG_20190518_142233.jpg"   -> "18 May 2019"
 *   "pic 3.jpg"                 -> null (no usable caption)
 */
function captionFromFilename(stem) {
  const raw = collapse(stem);

  /* Camera-style stamps carry a real date worth showing. Tested on the raw
     stem, before separators are rewritten to spaces. */
  const stamp = /^(?:img|dsc|dscn|pxl|photo|image)?[_\-\s]?(\d{4})(\d{2})(\d{2})[_\-\s]?(\d{2})(\d{2})(\d{2})?$/i.exec(raw);
  if (stamp) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = months[Number(stamp[2]) - 1];
    /* The time matters: a folder can hold a dozen photos from the same day, and
       "6 March 2024 at 10:24" tells them apart where a bare date cannot. */
    if (month) return `${Number(stamp[3])} ${month} ${stamp[1]} at ${stamp[4]}:${stamp[5]}`;
  }

  /* Names that only describe the file, never the photograph. */
  if (/^(screenshot|screen shot|img|dsc|dscn|pxl|pic|pics|photo|photos|image|images|file|untitled)\b/i.test(raw)) return null;
  if (GENERIC_STEM.test(raw)) return null;

  let text = raw
    .replace(/[_\-]+/g, " ")
    .replace(/\((?:copy|img|image|photo|file)?\s*\d*\)/gi, " ")
    .replace(/\b(?:copy|final|new|edited?)\b(?:\s*\d+)?/gi, " ")
    .replace(/\s*\(\d+\)\s*$/, " ")
    /* Repair words glued together in the source, e.g. "eventPOSHAAN". */
    .replace(/([a-z\d])([A-Z]{2,})/g, "$1 $2")
    .replace(/[^\w\s&/'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return null;
  if (GENERIC_STEM.test(text)) return null;

  /* Drop a leading camera prefix, keep the descriptive remainder. */
  text = text.replace(/^(?:img|dsc|dscn|pxl|photograph|photo)[_\s-]*\d+[_\s-]*/i, "").trim();
  if (!text || GENERIC_STEM.test(text)) return null;

  /* Title case, keeping small words lowercase except at the start. */
  const words = text.split(" ");
  const titled = words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (/^[A-Z0-9&/'-]{2,}$/.test(word) && word === upper(word)) return word; /* acronyms kept */
      if (index > 0 && MINOR_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");

  return titled;
}

const upper = (value) => value.toUpperCase();

/** Only `public/<year>/…` belongs to the gallery archive. Top-level names that
 *  do not start with a year (e.g. `home-gallery`) and loose root assets are
 *  other features' source material, so they must never become gallery entries. */
const GALLERY_SECTION = /^\d{4}/;
const isGallerySource = (file) => GALLERY_SECTION.test(path.relative(SRC, file).split(path.sep)[0]);

/** Recursively yields every supported image file below `dir`. */
function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) {
    if (entry.name.startsWith(".") || /^(thumbs\.db|desktop\.ini|~\$|\.~lock)/i.test(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) yield full;
  }
}

/** Loads sharp, installing it only if genuinely missing. */
function loadSharp() {
  const mod = (() => {
    try {
      return require("sharp");
    } catch {
      console.log("  sharp is not installed. Run: npm install --save-dev sharp");
      return null;
    }
  })();
  if (!mod) return null;
  const fn = typeof mod === "function" ? mod : mod?.default;
  return typeof fn === "function" ? fn : null;
}

/* ------------------------------------------------------------------- build */

async function main() {
  if (!fs.existsSync(SRC)) {
    console.log(`[gallery-index] No archive at ${path.relative(REPO, SRC)} — keeping the committed manifest.`);
    return 0;
  }

  /* Scoped to year folders: everything else under public/ is another feature's
     source material (home-gallery, site assets) and is not gallery content. */
  const sources = [...walk(SRC)].filter(isGallerySource);

  const yearFolders = new Set(sources.map((file) => path.relative(SRC, file).split(path.sep)[0]));

  console.log(`[gallery-index] discovered ${sources.length} images across ${yearFolders.size} year folders`);

  if (!sources.length) {
    console.log("[gallery-index] nothing to index.");
    return 0;
  }

  if (CHECK_ONLY) {
    const manifest = fs.existsSync(OUT_MANIFEST) ? JSON.parse(fs.readFileSync(OUT_MANIFEST, "utf8")) : null;
    /* The manifest is an object (`{ generatedAt, widths, images }`); tolerate the
       bare-array shape so an older checkout cannot crash the check. */
    const entries = Array.isArray(manifest) ? manifest : manifest?.images ?? [];
    const known = new Set(entries.map((entry) => entry.source));
    const missing = sources.filter((file) => !known.has(path.relative(SRC, file).split(path.sep).join("/")));
    const extra = entries.filter((entry) => !fs.existsSync(path.join(SRC, entry.source)));
    const noAlt = entries.filter((entry) => !entry.alt || !entry.width || !entry.height);
    const orphanDerivatives = [];
    for (const entry of entries) {
      for (const candidate of [entry.thumb, entry.src]) {
        if (!candidate) continue;
        const onDisk = path.join(OUT_ASSETS, candidate.replace(`${ASSET_PREFIX}/`, "").split("/").join(path.sep));
        if (!fs.existsSync(onDisk)) orphanDerivatives.push(candidate);
      }
    }

    console.log(`[gallery-index] manifest holds ${entries.length} entries`);
    console.log(`[gallery-index] discovered images not indexed.... ${missing.length}`);
    console.log(`[gallery-index] indexed but missing on disk..... ${extra.length}`);
    console.log(`[gallery-index] entries missing alt/dimensions. ${noAlt.length}`);
    console.log(`[gallery-index] derivatives missing on disk..... ${orphanDerivatives.length}`);

    const bad = missing.length + extra.length + noAlt.length + orphanDerivatives.length;
    if (bad) {
      for (const file of missing.slice(0, 20)) console.log(`  not indexed: ${path.relative(SRC, file)}`);
      for (const file of extra.slice(0, 20)) console.log(`  not on disk: ${file.source}`);
      for (const file of noAlt.slice(0, 20)) console.log(`  incomplete:  ${file.source}`);
      for (const file of orphanDerivatives.slice(0, 20)) console.log(`  no asset:    ${file}`);
      console.log(`[gallery-index] run \`npm run gallery:index\` to regenerate.`);
      return 1;
    }
    console.log("[gallery-index] manifest is current");
    return 0;
  }

  const sharp = loadSharp();
  if (!sharp) return 1;

  /* Rebuild from scratch so a deleted photo cannot leave a stale derivative. */
  fs.rmSync(OUT_ASSETS, { recursive: true, force: true });
  fs.mkdirSync(OUT_ASSETS, { recursive: true });
  fs.mkdirSync(path.dirname(OUT_MANIFEST), { recursive: true });

  const entries = [];
  const failures = [];
  const usedPaths = new Set();
  let sourceBytes = 0;
  let outputBytes = 0;

  /* Folder layout is read once, up front: the top-level folder is the section
     ("2015", "2021 B 1"), the next level is the event ("Golz Launch - June 2015")
     and loose files get their own group. Doing this before any image work also
     makes it possible to number photos within an event. */
  const layout = new Map();
  const counters = new Map();

  for (const file of sources) {
    const parts = path.relative(SRC, file).split(path.sep);
    const section = parts.length > 1 ? collapse(parts[0]) : "Other";
    const event = parts.length > 2 ? collapse(parts[1]) : section;

    const eventKey = `${section}::${event}`;
    const next = (counters.get(eventKey) || 0) + 1;
    counters.set(eventKey, next);

    layout.set(file, { section, event, position: next });
  }

  /* Captions are resolved for every file before any resizing, because making
     them unique needs to see the whole event at once. */
  const captions = new Map();
  const seenInEvent = new Map();

  for (const file of sources) {
    const { section, event, position } = layout.get(file);
    const stem = path.basename(file, path.extname(file));

    const fromName = captionFromFilename(stem);
    let caption = fromName || `${event} — Photo ${position}`;
    let alt = fromName || `${event}, photo ${position}`;

    /* Two files can still reduce to the same text — "Photos of the program"
       twice, or a pair captured minutes apart. A suffix settles it while
       keeping the caption readable and the alt text unique for screen readers. */
    const eventKey = `${section}::${event}`;
    const siblings = seenInEvent.get(eventKey) || new Map();
    const used = (siblings.get(caption) || 0) + 1;
    siblings.set(caption, used);
    seenInEvent.set(eventKey, siblings);

    if (used > 1) {
      caption = `${caption} — Photo ${used}`;
      alt = `${alt}, photo ${used}`;
    }

    captions.set(file, { caption, alt });
  }

  for (const file of sources) {
    const relative = path.relative(SRC, file);
    const { section, event } = layout.get(file);
    const stem = path.basename(file, path.extname(file));
    const { caption, alt } = captions.get(file);

    const sectionSlug = slug(section);
    const eventSlug = slug(event);
    const baseSlug = slug(stem);

    /* Deterministic, collision-free output name. */
    let nameSlug = baseSlug;
    for (let n = 2; usedPaths.has(`${sectionSlug}/${eventSlug}/${nameSlug}`); n++) nameSlug = `${baseSlug}-${n}`;
    usedPaths.add(`${sectionSlug}/${eventSlug}/${nameSlug}`);

    const outDir = path.join(OUT_ASSETS, sectionSlug, eventSlug);
    fs.mkdirSync(outDir, { recursive: true });

    try {
      const meta = await sharp(file, { failOn: "none" }).metadata();
      const variants = [];

      for (const width of WIDTHS) {
        const outPath = path.join(outDir, `${nameSlug}-${width}.webp`);
        const buffer = await sharp(file, { failOn: "none" })
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: QUALITY, effort: 4 })
          .toBuffer();

        const info = await sharp(buffer).metadata();
        fs.writeFileSync(outPath, buffer);
        outputBytes += buffer.length;
        variants.push({
          width,
          path: `${sectionSlug}/${eventSlug}/${nameSlug}-${width}.webp`,
          bytes: buffer.length,
          w: info.width,
          h: info.height,
        });
      }

      sourceBytes += fs.statSync(file).size;

      /* Intrinsic ratio/dimensions come from the largest variant, which is what
         the lightbox shows, so the browser can reserve the right space. */
      const largest = variants[variants.length - 1];

      entries.push({
        id: `${sectionSlug}/${eventSlug}/${nameSlug}`,
        source: relative.split(path.sep).join("/"),
        folder: section,
        event,
        file: path.basename(file),
        caption,
        alt,
        width: largest?.w ?? null,
        height: largest?.h ?? null,
        thumb: `${ASSET_PREFIX}/${variants[0].path}`,
        src: `${ASSET_PREFIX}/${largest.path}`,
        srcSet: variants.map((v) => `/${ASSET_PREFIX}/${v.path} ${v.width}w`).join(", "),
        sizes: SIZES,
        aspect: meta.width && meta.height ? Number((meta.width / meta.height).toFixed(4)) : 4 / 3,
      });
    } catch (err) {
      failures.push({ file: relative, message: err.message });
      console.error(`  ! ${relative}: ${err.message}`);
    }
  }

  entries.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  fs.writeFileSync(OUT_MANIFEST, `${JSON.stringify({ generatedAt: new Date().toISOString(), widths: WIDTHS, images: entries }, null, 2)}\n`);

  const sections = new Map();
  for (const entry of entries) sections.set(entry.folder, (sections.get(entry.folder) || 0) + 1);

  console.log(`\n[gallery-index] sections   : ${[...sections.keys()].sort().join(", ")}`);
  for (const [folder, count] of [...sections].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))) {
    console.log(`  ${String(count).padStart(4)}  ${folder}`);
  }
  console.log(`[gallery-index] indexed    : ${entries.length} images`);
  console.log(`[gallery-index] originals  : ${(sourceBytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`[gallery-index] derivatives: ${(outputBytes / 1024 / 1024).toFixed(1)} MB  (widths ${WIDTHS.join(", ")})`);
  console.log(`[gallery-index] failures   : ${failures.length}`);
  console.log(`[gallery-index] manifest   : ${path.relative(REPO, OUT_MANIFEST)}`);

  /* A derivative must exist for every indexed image, or the gallery ships 404s. */
  const missingAssets = entries.filter((entry) => !fs.existsSync(path.join(REPO, "client", "public", entry.thumb)));
  if (missingAssets.length) {
    console.error(`[gallery-index] FAILED: ${missingAssets.length} entries have no derivative on disk.`);
    return 1;
  }

  if (entries.length !== sources.length) {
    console.error(`[gallery-index] FAILED: ${sources.length} discovered but only ${entries.length} indexed.`);
    return 1;
  }

  console.log("[gallery-index] OK");
  return 0;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error("[gallery-index] failed:", err);
      process.exit(1);
    });
}

export { captionFromFilename, slug, IMAGE_EXT, WIDTHS };