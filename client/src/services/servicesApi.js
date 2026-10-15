import api from "../api/client";
import SERVICES_FALLBACK from "../data/servicesFallback";

/** A request must never outlive this, or the refresh would hang in the background. */
const REQUEST_TIMEOUT_MS = 8000;

const asText = (value) => (typeof value === "string" ? value.trim() : "");
const asList = (value) =>
  Array.isArray(value) ? value.map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean) : [];
export function slugify(value) {
  return asText(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Coerces one record into the shape the UI expects. A single malformed service
 * degrades to a card with fewer details instead of breaking the whole grid.
 */
export function normaliseService(raw) {
  if (!raw || typeof raw !== "object") return null;

  const title = asText(raw.title);
  const slug = asText(raw.slug) || slugify(title);
  if (!title || !slug) return null;

  return {
    _id: asText(raw._id) || `fallback-${slug}`,
    title,
    slug,
    icon: asText(raw.icon) || "Sparkles",
    image: asText(raw.image),
    category: asText(raw.category),
    shortDesc: asText(raw.shortDesc) || asText(raw.description).replace(/<[^>]*>/g, " ").trim().slice(0, 160),
    description: asText(raw.description),
    forWho: asText(raw.forWho),
    benefits: asList(raw.benefits),
    planCovers: asList(raw.planCovers),
    credibility: asText(raw.credibility),
    suitableFor: asList(raw.suitableFor),
    duration: asText(raw.duration),
    price: asText(raw.price),
    order: Number.isFinite(raw.order) ? raw.order : 999,
    published: raw.published !== false,
  };
}

/** Accepts an array, or a wrapper object such as { items: [...] } / { services: [...] }. */function extractList(payload) {
  const candidate = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.services)
        ? payload.services
        : Array.isArray(payload?.data)
          ? payload.data
          : null;

  if (!candidate) return null;
  return candidate.map(normaliseService).filter(Boolean);
}

const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_resolve, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), REQUEST_TIMEOUT_MS)
    ),
  ]);

/**
 * The bundled catalogue, normalised once. Exported so the UI can render real
 * content synchronously if the API is slower than the loading budget.
 */
export const FALLBACK_SERVICES = SERVICES_FALLBACK.map(normaliseService).filter(Boolean);

/** Looks one service up in the bundled catalogue, so a slug always resolves offline. */
export function localService(slug) {
  return FALLBACK_SERVICES.find((service) => service.slug === slug) || null;
}

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
 * Loads the service catalogue.
 *
 * PRIMARY  : the public API (CMS-managed).
 * FALLBACK : a bundled snapshot of the same records.
 *
 * The fallback is read-only and never overwrites the database. The page always
 * receives a usable, non-empty array plus the source, so it can render a full
 * layout regardless of network conditions.
 */
export async function loadServices() {
  try {
    const { data } = await requestWithRetry("/public/services");
    const items = extractList(data);

    if (!items || items.length === 0) {
      return { services: FALLBACK_SERVICES, source: "fallback", error: new Error("Service API returned no usable records") };
    }

    return { services: items, source: "api", error: null };
  } catch (err) {
    return { services: FALLBACK_SERVICES, source: "fallback", error: err };
  }
}

/** Loads one service by slug, falling back to the bundled snapshot. */
export async function loadService(slug) {
  try {
    const { data } = await requestWithRetry(`/public/services/${encodeURIComponent(slug)}`);
    const item = normaliseService(data);
    if (item) return { service: item, source: "api", error: null };
  } catch (err) {
    const match = FALLBACK_SERVICES.find((s) => s.slug === slug);
    if (match) return { service: match, source: "fallback", error: err };
    return { service: null, source: "none", error: err };
  }
  return { service: null, source: "none", error: new Error("Service not found") };
}
