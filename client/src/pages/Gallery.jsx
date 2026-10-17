import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { CalendarCheck, MessageCircle } from "lucide-react";
import SEO from "../components/SEO";
import Reveal from "../components/Reveal";
import Lightbox from "../components/Lightbox";
import GalleryHero from "../components/gallery/GalleryHero";
import GalleryFilters from "../components/gallery/GalleryFilters";
import GalleryGrid from "../components/gallery/GalleryGrid";
import GalleryEmptyState from "../components/gallery/GalleryEmptyState";
import { archiveItems, deriveSections, loadGallery, compareFolders } from "../gallery/galleryApi";
import { typesIn, itemMatchesType } from "../gallery/eventTypes";

const SEO_TITLE = "Gallery | GOLZ \u2013 Giggles of Livez";
const SEO_DESCRIPTION =
  "Browse the GOLZ Nutrition gallery from Mysuru: photographs from nutrition workshops, awareness talks, conferences, hospital and institution visits, community events and life at our diet clinic.";

const CANONICAL = typeof window !== "undefined" ? `${window.location.origin}/gallery` : "";

export default function Gallery() {
  /* The photo library is bundled with the app, so the grid is populated on the
     very first render: no skeletons, no empty state, and nothing to wait for.
     CMS records are merged in afterwards when the request resolves. */
  const [items, setItems] = useState(() => archiveItems());
  const [sections, setSections] = useState(() => deriveSections(archiveItems()));
  const [tags, setTags] = useState([]);
  const [section, setSection] = useState("All");
  const [type, setType] = useState("All");
  const [viewer, setViewer] = useState(null);

  /* CMS records are merged in quietly: they only ever add photos an administrator
     uploaded themselves, and the bundled archive already covers everything else.
     A failed or empty CMS response is logged and nothing else, because the visitor
     is looking at the complete library either way and an error or retry banner
     here would only report a problem that cannot affect what they see. */
  useEffect(() => {
    let alive = true;

    loadGallery().then(({ items: loaded, sections: loadedSections, tags: loadedTags, adminCount, error }) => {
      if (!alive) return;
      setItems(loaded);
      setSections(loadedSections);
      setTags(loadedTags || []);
      if (error) console.error("[gallery] CMS gallery unavailable, showing the bundled archive:", error.message);
      else if (adminCount > 0) console.info(`[gallery] merged ${adminCount} CMS upload(s) into the archive`);
    });

    return () => {
      alive = false;
    };
  }, []);

  /* Only the published, admin-managed tags become type chips. */
  const tagNames = useMemo(() => tags.filter((t) => t.published !== false).map((t) => t.name), [tags]);

  /* Description-only sections stay in `sections` for blurbs but never become a
     filter chip. A section is offered when it holds photos, or when the
     administrator explicitly enabled an empty one. */
  const visibleSections = useMemo(
    () => sections.filter((s) => s.published !== false && (s.count > 0 || s.showEmpty)),
    [sections]
  );

  const types = useMemo(() => (items?.length ? typesIn(items, tags) : []), [items, tags]);

  /* Section and type are independent axes, so the two filter rows combine. */
  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      const bySection = section === "All" || item.section === section;
      const byType = itemMatchesType(item, type, tagNames);
      return bySection && byType;
    });
  }, [items, section, type, tagNames]);

  const isEmpty = items.length === 0;

  /* Photos are laid out as year sections, and each year as its events, so a
     visitor can find a specific occasion instead of scrolling one long wall.
     Sections follow the administrator's configured order (newest-first by
     default); the bundled archive's own year order breaks ties in offline mode.
     Every tile keeps its position in the flat list, which is what the lightbox
     walks through, so next/previous follow the same order the page shows. */
  const sectionRank = useMemo(() => {
    const map = new Map();
    sections.forEach((s, i) => map.set(s.name, Number.isFinite(s.order) ? s.order : i));
    return map;
  }, [sections]);

  const groups = useMemo(() => {
    const bySection = new Map();

    filtered.forEach((item, flatIndex) => {
      if (!bySection.has(item.section)) bySection.set(item.section, new Map());
      const events = bySection.get(item.section);
      if (!events.has(item.eventName)) events.set(item.eventName, []);
      events.get(item.eventName).push({ ...item, flatIndex });
    });

    return [...bySection.keys()]
      .sort((a, b) => {
        const ra = sectionRank.has(a) ? sectionRank.get(a) : Infinity;
        const rb = sectionRank.has(b) ? sectionRank.get(b) : Infinity;
        if (ra !== rb) return ra - rb;
        return compareFolders(a, b);
      })
      .map((section) => {
        const events = [...bySection.get(section).entries()];
        return {
          section,
          count: events.reduce((total, [, list]) => total + list.length, 0),
          events: events.map(([event, items]) => ({ event, items })),
        };
      });
  }, [filtered, sectionRank]);

  /* Hero statistics come from the records this page renders — never from other
     collections. Photographs counts unique published image URLs across the
     complete gallery (videos excluded, a photo referenced twice counted once)
     and ignores the active filters, so the figure describes the whole archive
     rather than the current subset. */
  const stats = useMemo(() => {
    if (!items.length) return [];
    const photographs = new Set();
    for (const item of items) {
      if (item.type === "video") continue;
      const url = String(item.image || "").trim().split("#")[0].split("?")[0];
      if (url) photographs.add(url);
    }
    const years = new Set(items.map((i) => i.year).filter(Boolean));
    const events = new Set(items.map((i) => i.eventName).filter(Boolean));
    return [
      { value: photographs.size, label: "Photographs" },
      { value: events.size, label: "Events documented" },
      { value: years.size, label: "Years archived" },
      { value: visibleSections.length, label: "Collections" },
    ];
  }, [items, visibleSections.length]);

  const openViewer = useCallback((index) => setViewer({ items: filtered, index }), [filtered]);
  const navigate = useCallback((index) => setViewer((v) => (v ? { ...v, index } : v)), []);

  /* Optional CMS blurbs: one stored per section (a year) and one per event
     title. An empty description renders nothing, so no stray gap is left. */
  const descriptionFor = useCallback(
    (name) =>
      sections.find((s) => String(s.name || "").toLowerCase() === String(name || "").toLowerCase())?.description || "",
    [sections]
  );

  /* Subsection (event) blurb: the map lives on the parent year section, keyed
     by the event title, so every subsection carries its own independent text.
     A section row named exactly like the event still works as a fallback,
     keeping descriptions written that way before the map existed on screen. */
  const eventDescriptionFor = useCallback(
    (sectionName, eventName) => {
      const event = String(eventName || "").trim().toLowerCase();
      if (!event) return "";
      const parent = sections.find(
        (s) => String(s.name || "").toLowerCase() === String(sectionName || "").toLowerCase()
      );
      const stored = parent?.eventDescriptions || {};
      const key = Object.keys(stored).find((k) => String(k).trim().toLowerCase() === event);
      const direct = key ? String(stored[key] || "").trim() : "";
      return direct || descriptionFor(eventName);
    },
    [sections, descriptionFor]
  );

  /* A real photo from the archive, so the social card shows the actual gallery
     instead of an empty tag. The index stores site-relative paths, and social
     crawlers need a full URL, so the origin is added back here. */
  const ogImage = useMemo(() => {
    const path = items?.find((i) => i.type === "image")?.image;
    if (!path) return undefined;
    if (/^https?:\/\//i.test(path)) return path;
    return typeof window !== "undefined" ? `${window.location.origin}${path}` : undefined;
  }, [items]);

  return (
    <>
      <SEO
        fullTitle={SEO_TITLE}
        title="Gallery"
        description={SEO_DESCRIPTION}
        image={ogImage}
        keywords="nutrition gallery Mysuru, nutrition workshop photos, awareness talk, conference, hospital visit, diet clinic Mysuru, GOLZ Nutrition events"
        canonical={CANONICAL}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: "GOLZ Nutrition Gallery",
          description: SEO_DESCRIPTION,
          url: CANONICAL,
        }}
      />

      <GalleryHero stats={stats} />

      {/* ============ GALLERY ============ */}
      <section className="bg-paper section-pad" aria-labelledby="gallery-heading">
        <div className="container-x">
          <div className="flex flex-col gap-4 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-limeDark">Our Archive</span>
              <h2
                id="gallery-heading"
                className="mt-3 font-heading text-3xl font-semibold leading-tight text-ink sm:text-4xl lg:text-[42px] lg:leading-[1.12]"
              >
                {isEmpty
                  ? "Nothing to show yet"
                  : `${filtered.length} ${filtered.length === 1 ? "photograph" : "photographs"}`}
              </h2>
            </div>

            {!isEmpty ? (
              <p className="max-w-md text-sm leading-relaxed text-muted">
                Real moments from our workshops, talks, hospital programmes and community events. Select any photo to
                view it full size.
              </p>
            ) : null}
          </div>

          {isEmpty ? (
            <GalleryEmptyState />
          ) : (
            <>
              <div className="mt-8">
                <GalleryFilters
                  sections={visibleSections}
                  types={types}
                  section={section}
                  type={type}
                  counts={{ total: items?.length ?? 0 }}
                  onSection={setSection}
                  onType={setType}
                />
              </div>

              <div className="mt-10">
                {groups.map((group) => {
                  const sectionDescription = descriptionFor(group.section);
                  return (
                    <section
                      key={group.section}
                      id={`gallery-${group.section.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      aria-labelledby={`gallery-${group.section.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-heading`}
                      className="mb-14 last:mb-0"
                    >
                      <div className="mb-6 flex items-baseline gap-3 border-b border-line pb-3">
                        <h3
                          id={`gallery-${group.section.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-heading`}
                          className="font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
                        >
                          {group.section}
                        </h3>
                        <span className="text-sm font-semibold text-muted">
                          {group.count} {group.count === 1 ? "photo" : "photos"}
                        </span>
                      </div>

                      {sectionDescription ? (
                        <p className="body -mt-3 mb-7 max-w-3xl text-muted">
                          {sectionDescription}
                        </p>
                      ) : null}

                      {group.events.map((event) => {
                        const eventDescription = eventDescriptionFor(group.section, event.event);
                        const showEventTitle = group.events.length > 1 || Boolean(eventDescription);
                        return (
                          <div key={event.event} className="mb-9 last:mb-0">
                            {showEventTitle ? (
                              <h4 className="mb-4 font-heading text-base font-semibold text-primary">{event.event}</h4>
                            ) : null}
                            {eventDescription ? (
                              <p className="-mt-2 mb-5 max-w-3xl text-sm leading-relaxed text-muted">
                                {eventDescription}
                              </p>
                            ) : null}
                            <GalleryGrid items={event.items} onOpen={openViewer} />
                          </div>
                        );
                      })}
                    </section>
                  );
                })}

                {filtered.length === 0 ? (
                  <div className="mt-10 rounded-[22px] border border-line bg-white px-6 py-14 text-center">
                    <p className="font-heading text-lg font-semibold text-ink">No photos match this combination</p>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
                      Try another year or a different event type.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSection("All");
                        setType("All");
                      }}
                      className="btn-outline mt-6"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative overflow-hidden bg-primary section-pad">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.06) 0%, transparent 45%), radial-gradient(circle at 80% 85%, rgba(163,198,68,0.1) 0%, transparent 50%)",
          }}
          aria-hidden="true"
        />

        <div className="container-x relative z-10 text-center">
          <Reveal>
            <h2 className="h2 mx-auto max-w-2xl text-[#EEF3EA]">
              Ready to Start Your Healthy Journey?
            </h2>
            <p className="body-lg mx-auto mt-5 max-w-xl text-[#DBE6D5]/80">
              Personalized, science-backed nutrition plans &mdash; built around you, your body and your goals.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/contact" className="btn-lime w-full transition-transform duration-300 ease-out hover:scale-[1.02] sm:w-auto">
                <CalendarCheck size={18} aria-hidden="true" />
                Book a Consultation
              </Link>
              <Link
                to="/contact"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-7 py-3.5 font-body font-semibold text-[#EEF3EA] backdrop-blur transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-lime hover:text-lime sm:w-auto"
              >
                <MessageCircle size={18} aria-hidden="true" />
                Contact Us
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <AnimatePresence>
        {viewer ? (
          <Lightbox
            items={viewer.items}
            index={viewer.index}
            onClose={() => setViewer(null)}
            onNavigate={navigate}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
