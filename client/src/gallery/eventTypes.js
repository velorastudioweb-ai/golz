/**
 * Classifies real gallery photos into browsable tags (the public page's "Type"
 * chips).
 *
 * Tags are managed in the admin panel, so a photo's tag comes from its own
 * `tags` list first. The caption-wording rules below are the fallback for
 * photos that carry no tag — they match the wording the clinic actually used in
 * its own captions ("One day workshop Enteral nutrition", "Golz Launch") so a
 * newly uploaded, untagged photo still lands somewhere sensible.
 *
 * The rules are ordered and every photo falls through to `Events`, so all real
 * images always remain reachable.
 */

const FALLBACK_BLURB = "Everyday moments from the GOLZ nutrition clinic.";

const RULES = [
  {
    key: "Workshops",
    pattern: /workshop/i,
    blurb: "Hands-on sessions we ran for parents, students and professionals.",
  },
  {
    key: "Conferences & Awards",
    pattern: /conference|award|recognition|certificate|launch/i,
    blurb: "Conference appearances, launches and professional recognition.",
  },
  {
    key: "Talks & Awareness",
    pattern: /talk|awareness|seminar|session|camp|college|school|breast ?feeding/i,
    blurb: "Talks, awareness drives and sessions at colleges and schools.",
  },
  {
    key: "Hospitals & Institutions",
    pattern: /hospital|clinic|apollo|aiish|fmkmc|poshan|anganwadi|women ?& ?child|department/i,
    blurb: "Programmes delivered with hospitals and public institutions.",
  },
];

/** The caption-wording type of one item, always defined. */
export function eventTypeOf(item) {
  const haystack = `${item?.eventName ?? ""} ${item?.caption ?? ""}`;
  const match = RULES.find((rule) => rule.pattern.test(haystack));
  return match ? match.key : "Events";
}

/** The blurb for a tag name, from the admin list when present, else the rules. */
function blurbFor(name, adminTags) {
  const match = adminTags.find((t) => String(t?.name || "").toLowerCase() === String(name || "").toLowerCase());
  if (match?.blurb) return match.blurb;
  return RULES.find((r) => r.key.toLowerCase() === String(name || "").toLowerCase())?.blurb || FALLBACK_BLURB;
}

/**
 * The canonical tag name for one photo.
 *
 * An explicit tag assigned in the admin wins (matched case-insensitively against
 * the live tag list so a small rename never detaches a photo). A photo with no
 * usable tag falls back to its caption wording, but only if that wording names a
 * tag the administrator still offers; otherwise it lands under "Events" when
 * that tag exists, keeping every photo reachable.
 */
export function classifyItem(item, adminTagNames = []) {
  const known = adminTagNames.map((n) => String(n));
  const lower = new Map(known.map((n) => [n.toLowerCase(), n]));
  const explicit = (item?.tags || []).map((t) => String(t || "").trim()).filter(Boolean);

  for (const tag of explicit) {
    const match = lower.get(tag.toLowerCase());
    if (match) return match;
  }

  const fallback = eventTypeOf(item);
  if (!known.length) return explicit[0] || fallback;

  const fallbackMatch = lower.get(fallback.toLowerCase());
  if (fallbackMatch) return fallbackMatch;
  if (lower.has("events")) return lower.get("events");
  return explicit[0] || known[0];
}

/** True when a photo should appear under the given type chip. */
export function itemMatchesType(item, type, adminTagNames = []) {
  if (!type || type === "All") return true;
  return classifyItem(item, adminTagNames).toLowerCase() === String(type).toLowerCase();
}

/**
 * The type chips present in `items`, in the administrator's configured order
 * (tags with photos only), with unknown extras appended by count. Falls back to
 * pure caption classification when no tags are configured.
 */
export function typesIn(items, adminTags = []) {
  const active = (adminTags || []).filter((t) => t && t.name && t.published !== false);
  const names = active.map((t) => t.name);

  const counts = new Map();
  for (const item of items) {
    const key = classifyItem(item, names);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const order = names.map((n) => n.toLowerCase());

  return [...counts.entries()]
    .sort((a, b) => {
      const ia = order.indexOf(a[0].toLowerCase());
      const ib = order.indexOf(b[0].toLowerCase());
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      return b[1] - a[1] || a[0].localeCompare(b[0]);
    })
    .map(([key, count]) => ({ key, count, blurb: blurbFor(key, active) }));
}

/** Event types present in `items`, most common first — legacy, tag-less list. */
export function eventTypesIn(items) {
  const counts = new Map();
  for (const item of items) {
    const key = eventTypeOf(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => ({
      key,
      count,
      blurb: RULES.find((r) => r.key === key)?.blurb ?? FALLBACK_BLURB,
    }));
}
