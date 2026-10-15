import api from "../api/client";
/* Bundled with the application rather than fetched at runtime: the photo library
   is the primary content, so it must be present in the first paint and must not
   depend on a second request succeeding. */
import manifest from "../data/galleryManifest.json";

const REQUEST_TIMEOUT_MS = 9000;
/** Bounded loading: past this the page stops showing skeletons. */
export const LOADING_BUDGET_MS = 6000;

const text = (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

/**
 * Normalises one API record. Field names are read defensively because the
 * gallery schema (url/thumb/caption/eventName) and older records do not always
 * agree, and a single bad record must never blank the grid.
 */
export function toGalleryItem(raw, index = 0) {
  if (!raw || typeof raw !== "object") return null;

  const url = text(raw.url) || text(raw.image) || text(raw.src);
  if (!url) return null;

  const eventName = text(raw.eventName);
  const caption = text(raw.caption) || text(raw.description);
  const year = text(raw.year) || (/^\d{4}$/.test(raw.category) ? text(raw.category) : "");

  return {
    id: text(raw._id) || text(raw.id) || `gallery-item-${index}`,
    image: url,
    thumb: text(raw.thumb) || url,
    type: raw.type === "video" ? "video" : "image",
    section: text(raw.category) || "General",
    sectionId: text(raw.gallerySectionId),
    year,
    eventName,
    caption,
    /* Tag names assigned in the admin. Empty means the public page classifies
       the photo from its caption wording instead. */
    tags: Array.isArray(raw.tags) ? raw.tags.map(text).filter(Boolean) : [],
    origin: text(raw.origin),
    /* True only when the caption adds something the title does not say. */
    hasOwnCaption: Boolean(caption) && caption !== eventName,
    alt: text(raw.alt) || caption || eventName || text(raw.category) || "GOLZ nutrition gallery image",
    order: Number.isFinite(raw.order) ? raw.order : index,
  };
}

export function toGalleryItems(list) {
  return (list || []).map(toGalleryItem).filter(Boolean);
}

/* --------------------------------------------------------- archive library */

/**
 * Normalises one entry from the build-generated index into the same shape as a
 * CMS record, so every downstream component (grid, tile, lightbox, filters)
 * works unchanged no matter which source an item came from.
 *
 * The generated file is the single source of truth for the photo library: it is
 * produced by `scripts/generate-gallery-index.mjs` at build time, which is why
 * adding a photo to the archive needs no code change and no manual list.
 */
export function toArchiveItem(entry, index = 0) {
  if (!entry || typeof entry !== "object") return null;

  /* Manifest paths may or may not carry a leading slash; normalise to exactly
     one so no request is ever made for "//gallery/...". */
  const sitePath = (value) => `/${text(value).replace(/^\/+/, "")}`;

  const full = text(entry.src);
  const thumb = text(entry.thumb);
  if (!full) return null;

  const folder = text(entry.folder) || "Gallery";
  const event = text(entry.event) || folder;

  const srcSet = text(entry.srcSet)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `${sitePath(part.split(/\s+/)[0])} ${part.split(/\s+/).slice(1).join(" ")}`)
    .filter((part) => part.split(/\s+/).length === 2)
    .join(", ");

  return {
    id: text(entry.id) || `archive-${index}`,
    image: sitePath(full),
    thumb: thumb ? sitePath(thumb) : sitePath(full),
    srcSet,
    sizes: text(entry.sizes),
    width: Number(entry.width) || undefined,
    height: Number(entry.height) || undefined,
    type: "image",
    section: folder,
    sectionId: "",
    /* Only folders that begin with a year get a year badge; "Other" does not. */
    year: /^(\d{4})/.exec(folder)?.[1] || "",
    eventName: event,
    caption: text(entry.caption),
    hasOwnCaption: Boolean(text(entry.caption)) && text(entry.caption) !== event,
    alt: text(entry.alt) || text(entry.caption) || event,
    order: Number.isFinite(index) ? index : 0,
    tags: [],
    /* Original archive path, kept only so duplicates can be recognised. */
    sourceFile: text(entry.file) || text(entry.source).split("/").pop() || "",
    origin: "archive",
  };
}

/** The generated index, mapped once and reused. */
let archiveCache = null;
export function archiveItems() {
  if (!archiveCache) {
    /* Raw manifest entries go straight to `toArchiveItem`: they are a different
       shape from CMS records and must not be normalised as CMS records first. */
    archiveCache = (manifest?.images || []).map((entry, index) => toArchiveItem(entry, index)).filter(Boolean);
  }
  return archiveCache;
}

export function loadArchiveItems() {
  return Promise.resolve(archiveItems());
}

/* -------------------------------------------------------- deduplication */

/**
 * Reduces a caption to a comparable signature.
 *
 * The CMS importer derived captions from filenames and appended "(1)", "(2)",
 * "001" or "-copy" suffixes, so those are removed first. Separators, spacing,
 * case and "&"/"and" are then ignored, which is what lets
 * "NCED Feb - 2018 certificate (1)" match "NCED Feb 2018 Certificate".
 */
const signature = (value) =>
  text(value)
    .replace(/\((?:copy|img|image|photo|file)?\s*\d*\)/gi, " ")
    .replace(/\bcopy\b/gi, " ")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

/** Filename at the end of a URL or a manifest `folder/file.jpg` path. */
const basenameOf = (value) => decodeURIComponent(text(value).split("?")[0].split("/").pop() || "");

/**
 * Records written by the old archive importer were uploaded under this blob
 * prefix. They are re-uploads of photos the generated index already serves from
 * the original files, so they are dropped by location alone — a check that
 * cannot misfire on an administrator's own upload.
 */
const LEGACY_ARCHIVE_PATH = /\/gallery\/archive\//i;

/** Gallery order: newest year first, then event, then file — the order the
    lightbox walks and the order the page renders. */
const sortGallery = (a, b) =>
  compareFolders(a.section, b.section) ||
  (a.eventName || "").localeCompare(b.eventName || "", undefined, { numeric: true }) ||
  String(a.id).localeCompare(String(b.id), undefined, { numeric: true });

/**
 * Merges the generated archive index with CMS records.
 *
 * Used when the CMS is unreachable: the archive is authoritative for the photo
 * library, so a CMS record is dropped when it is a re-upload of an archive photo,
 * detected either by the legacy import path or by matching the original
 * filename/caption in the same folder. Both checks are one-directional and
 * per-photo, so a genuine new upload added to an existing event still appears.
 */
export function mergeGallery(archive = [], admin = []) {
  const covered = new Set();
  for (const item of archive) {
    covered.add(`${item.section}::${signature(item.sourceFile)}`);
    covered.add(`${item.section}::${signature(item.caption)}`);
  }

  const extra = admin.filter((item) => {
    if (LEGACY_ARCHIVE_PATH.test(text(item.image))) return false;
    const file = signature(basenameOf(item.image));
    return !covered.has(`${item.section}::${file}`) && !covered.has(`${item.section}::${signature(item.caption)}`);
  });

  return [...archive, ...extra].sort(sortGallery);
}

/**
 * Online merge: the database is authoritative.
 *
 * Every archive photo is imported as a managed record, so the CMS copy carries
 * the administrator's latest tags, titles and filing. A bundled archive entry is
 * only added when no CMS record covers it (e.g. a photo added to the filesystem
 * before its import ran), which keeps the library complete without ever
 * double-listing a photo.
 */
export function preferDatabase(archive = [], db = []) {
  const covered = new Set();
  for (const item of db) {
    covered.add(item.image);
    covered.add(`${item.section}::${signature(basenameOf(item.image))}`);
    covered.add(`${item.section}::${signature(item.caption)}`);
  }

  const extras = archive.filter(
    (item) =>
      !covered.has(item.image) &&
      !covered.has(`${item.section}::${signature(item.sourceFile)}`) &&
      !covered.has(`${item.section}::${signature(item.caption)}`)
  );

  return [...db, ...extras].sort(sortGallery);
}

/** Newest year first, and the unfiled folder last. */
const folderRank = (folder) => {
  const match = /^(\d{4})/.exec(folder);
  return match ? Number(match[1]) : -1;
};

const compareFolders = (a, b) => folderRank(b) - folderRank(a) || a.localeCompare(b, undefined, { numeric: true });

export { compareFolders, folderRank };

/**
 * Builds filter sections from the admin configuration, falling back to the
 * photos actually on screen when the CMS is unreachable.
 *
 * With a live CMS, only sections the administrator created are returned — a year
 * appears because it was configured, never because a photo mentioned it. In
 * offline mode there is no configuration to read, so the bundled archive's own
 * folders become the sections and nothing is lost.
 */
export function deriveSections(items = [], apiSections = []) {
  const counts = new Map();
  for (const item of items) counts.set(item.section, (counts.get(item.section) || 0) + 1);

  const configured = apiSections.filter((s) => s?.name);

  if (!configured.length) {
    return [...counts.keys()].sort(compareFolders).map((name) => ({
      name,
      title: name,
      description: "",
      eventDescriptions: {},
      cover: "",
      order: 999,
      showEmpty: false,
      published: true,
      count: counts.get(name) || 0,
    }));
  }

  return configured.map((s) => ({
    name: s.name,
    title: text(s.title) || s.name,
    /* Optional blurb written in the CMS; empty means "show nothing". */
    description: text(s.description),
    /* Optional blurbs for the event subsections under this section. */
    eventDescriptions: normalizeEventDescriptions(s.eventDescriptions),
    cover: text(s.cover),
    order: Number.isFinite(s.order) ? s.order : 999,
    showEmpty: !!s.showEmpty,
    published: s.published !== false,
    count: counts.get(s.name) || 0,
  }));
}

export const titleOf = (item) => item?.eventName || item?.year || "Gallery";
export const captionOf = (item) => (item?.hasOwnCaption ? item.caption : "");
export const labelOf = (item) => [item?.year, item?.eventName].filter(Boolean).join(" \u00b7 ");

/** Applies a section's human title to items that have no event name of their own. */
export const withSectionLabels = (items, section) =>
  (items || []).map((item) =>
    item.eventName ? item : { ...item, eventName: text(section?.title) || text(section?.name) || item.section }
  );

/**
 * Accepts `{ items }`, `{ gallery }`, a bare array, or null — and always returns
 * an array. Never assumes the response shape.
 */
function extractItems(payload) {
  const candidate = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.gallery)
        ? payload.gallery
        : Array.isArray(payload?.data)
          ? payload.data
          : null;
  return toGalleryItems(candidate);
}

/**
 * The optional per-event (subsection) description map stored on a section.
 * Anything that is not a usable `{ eventTitle: "text" }` object collapses to
 * an empty map, so older API responses and the bundled snapshot keep working
 * without the field ever existing there.
 */
export function normalizeEventDescriptions(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    const name = text(key);
    const desc = text(value);
    if (name && desc) out[name] = desc;
  }
  return out;
}

function extractSections(payload) {
  const raw = Array.isArray(payload?.sections) ? payload.sections : Array.isArray(payload) ? payload : [];
  return raw
    .filter((s) => s && typeof s === "object")
    .map((s) => ({
      name: text(s.name),
      title: text(s.title) || text(s.name),
      description: text(s.description),
      eventDescriptions: normalizeEventDescriptions(s.eventDescriptions),
      cover: text(s.cover),
      order: Number.isFinite(s.order) ? s.order : 999,
      showEmpty: !!s.showEmpty,
      published: s.published !== false,
      count: Number.isFinite(s.count) ? s.count : 0,
    }))
    .filter((s) => s.name);
}

/**
 * The administrator-managed tags that may appear as public type chips. An empty
 * list (older API, or none configured) tells the page to fall back to its
 * caption classifier.
 */
function extractTags(payload) {
  const raw = Array.isArray(payload?.tags) ? payload.tags : Array.isArray(payload) ? payload : [];
  return raw
    .filter((t) => t && typeof t === "object" && text(t.name))
    .map((t, index) => ({
      name: text(t.name),
      blurb: text(t.blurb),
      order: Number.isFinite(t.order) ? t.order : index,
      published: t.published !== false,
      count: Number.isFinite(t.count) ? t.count : 0,
    }));
}

function extractCategories(payload) {
  const raw = Array.isArray(payload?.categories) ? payload.categories : Array.isArray(payload) ? payload : [];
  return raw.filter((c) => typeof c === "string" && c.trim());
}

/**
 * The bundled snapshot is loaded in parallel with the API request rather than
 * imported statically, so it never lands in the initial bundle but is still
 * ready if the request has to fall back.
 */
let fallbackPromise = null;
export function loadFallbackItems() {
  if (!fallbackPromise) {
    fallbackPromise = import("../data/galleryFallback")
      .then((m) => toGalleryItems(m.default))
      .catch(() => []);
  }
  return fallbackPromise;
}

const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_resolve, reject) => setTimeout(() => reject(new Error("Request timed out")), REQUEST_TIMEOUT_MS)),
  ]);

async function requestWithRetry(path, attempts = 2) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await withTimeout(api.get(path, { timeout: REQUEST_TIMEOUT_MS }));
    } catch (err) {
      lastError = err;
      if (attempt < attempts) await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
  throw lastError;
}

/**
 * Fetches the CMS half of the gallery on its own: live records first, bundled
 * snapshot if the API is unreachable or empty. Kept separate from
 * `loadGallery` so an admin outage can never cost the visitor the archive.
 */
async function loadAdminItems() {
  try {
    const { data } = await requestWithRetry("/public/gallery?page=1&limit=200");

    let items = extractItems(data);
    let sections = extractSections(data);
    let categories = extractCategories(data);
    let tags = extractTags(data);

    /* Older deployments may still answer without the bundled metadata. */
    const [sectionPatch, categoryPatch, tagPatch] = await Promise.all([
      sections.length ? Promise.resolve(null) : api.get("/public/gallery/sections").catch(() => null),
      categories.length ? Promise.resolve(null) : api.get("/public/gallery/categories").catch(() => null),
      Array.isArray(data?.tags) ? Promise.resolve(null) : api.get("/public/gallery/tags").catch(() => null),
    ]);
    if (sectionPatch) sections = extractSections(sectionPatch.data);
    if (categoryPatch) categories = extractCategories(categoryPatch.data);
    if (tagPatch) tags = extractTags(tagPatch.data);

    if (!items.length) {
      return {
        items: await loadFallbackItems(),
        sections,
        categories,
        tags,
        source: "fallback",
        error: new Error("Gallery API returned no usable records"),
      };
    }

    return { items, sections, categories, tags, source: "api", error: null };
  } catch (err) {
    return {
      items: await loadFallbackItems(),
      sections: extractSections(null),
      categories: [],
      tags: [],
      source: "fallback",
      error: err,
    };
  }
}

/**
 * Loads the whole gallery.
 *
 * ONLINE : the database is the single source of truth. Every archive photo was
 *          imported as a managed record, so `preferDatabase` renders the CMS
 *          copies (with the administrator's latest tags and filing) and only
 *          adds a bundled entry when no CMS record covers it.
 * OFFLINE: the bundled archive carries the page on its own, with the bundled
 *          snapshot of older CMS records merged in exactly as before.
 *
 * `source` reports which admin channel answered so the page can log a notice
 * without ever hiding real content, and the fallback never writes to the
 * database.
 */
export async function loadGallery() {
  const [archive, admin] = await Promise.all([loadArchiveItems(), loadAdminItems()]);

  const items = admin.source === "api" ? preferDatabase(archive, admin.items) : mergeGallery(archive, admin.items);
  const sections = deriveSections(items, admin.sections);

  /* Only the admin half can be missing; the archive is bundled with the build. */
  return {
    items,
    sections,
    categories: admin.categories,
    tags: admin.tags || [],
    source: admin.source,
    error: admin.error,
    archiveCount: archive.length,
    adminCount: items.length - archive.length,
  };
}
