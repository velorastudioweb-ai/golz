import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, CalendarCheck, BadgeCheck, ArrowRight } from "lucide-react";
import SEO from "../components/SEO";
import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";
import { ICON_MAP } from "../utils/helpers";
import { FALLBACK_SERVICES, loadServices } from "../services/servicesApi";

const CATEGORIES = [
  { id: "metabolic", no: "1", title: "Metabolic & Lifestyle", blurb: "Weight, blood sugar, hormones and heart health." },
  { id: "family", no: "2", title: "Women & Family", blurb: "Pregnancy, women's health, children and senior care." },
  { id: "specialised", no: "3", title: "Specialised & Clinical", blurb: "Special-needs children and oncology nutrition." },
  { id: "performance", no: "4", title: "Performance & Precision", blurb: "Sports nutrition and DNA-based precision plans." },
];

const STEPS = [
  { title: "Consultation", text: "We start by understanding you: your health history, condition, lifestyle, food habits and goals." },
  { title: "Assessment", text: "We review your labs, body composition and — where relevant — your DNA and gut-microbiome data, so the plan is built on evidence, not guesswork." },
  { title: "Your personalised plan", text: "You get a plan designed around your body and your everyday food — not a generic chart." },
  { title: "Monitoring & adjustment", text: "We track your progress and refine the plan as your body responds, so it keeps working over time." },
];

const SEO_TITLE = "Services | GOLZ \u2013 Giggles of Livez";
const SEO_DESCRIPTION =
  "Nutrition & care for every stage of life — weight, diabetes, thyroid & PCOS, pregnancy, children's health, special needs, oncology, sports and precision nutrition. Personalised plans built around you.";

/**
 * Service listing.
 *
 * The bundled catalogue is rendered on the first frame, so the page is never
 * empty, never shows a spinner and never waits on a request. A CMS refresh runs
 * in the background and swaps in newer records when it answers; if it does not,
 * the same programmes stay on screen and nothing is shown to the visitor.
 */
export default function Services() {
  const [services, setServices] = useState(FALLBACK_SERVICES);

  /* Background refresh only: it may replace the list, but it can never empty it. */
  useEffect(() => {
    let alive = true;

    loadServices().then(({ services: items, error }) => {
      if (!alive || !items?.length) return;
      setServices(items);
      if (error) {
        // Developer-facing signal only; the bundled catalogue is already on screen.
        console.warn("[services] CMS list unavailable, serving the bundled catalogue:", error.message);
      }
    });

    return () => {
      alive = false;
    };
  }, []);

  const ordered = useMemo(() => [...services].sort((a, b) => a.order - b.order), [services]);

  const knownCategories = new Set(CATEGORIES.map((c) => c.id));
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: ordered.filter((s) => s.category === cat.id),
  }));
  const orphans = ordered.filter((s) => !knownCategories.has(s.category));

  const canonical = typeof window !== "undefined" ? `${window.location.origin}/services` : "";

  const renderRow = (s, i) => {
    const Icon = ICON_MAP.get(s.icon) || ICON_MAP.get("Sparkles");
    return (
      <Reveal key={s._id} delay={(i % 2) * 0.08}>
        <article className="card grid gap-8 p-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:p-10">
          <div>
            {s.image ? (
              <img
                src={s.image}
                alt={s.title}
                loading="lazy"
                className="mb-6 aspect-[16/9] w-full rounded-[18px] object-cover"
              />
            ) : null}
            <div className="mb-4 flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                {Icon && <Icon size={24} />}
              </span>
              <h3 className="font-heading text-[19px] font-semibold leading-snug text-ink">
                <Link to={`/services/${s.slug}`} className="transition hover:text-primary">
                  {s.title}
                </Link>
              </h3>
            </div>
            {s.forWho ? (
              <p className="mb-3 text-sm font-medium text-primary">
                <span className="uppercase tracking-wide text-[11px]">For: </span>
                {s.forWho}
              </p>
            ) : null}
            <p className="text-[15px] leading-relaxed text-ink/70">{s.description}</p>
          </div>
          <div className="flex flex-col justify-between gap-6 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
                What your plan covers
              </p>
              <ul className="space-y-2.5">
                {(s.planCovers || []).map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink/80">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-limeDark" /> {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to={`/contact?service=${encodeURIComponent(s.title)}`}
                className="btn-primary ml-auto !px-5 !py-2.5 !text-sm"
              >
                Book <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </article>
      </Reveal>
    );
  };

  return (
    <>
      <SEO
        fullTitle={SEO_TITLE}
        title="Services"
        description={SEO_DESCRIPTION}
        keywords="nutrition services, diet plans, weight loss program, PCOS diet, diabetes diet"
        canonical={canonical}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Nutrition Services",
          itemListElement: ordered.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.title,
            url: `${canonical}/${s.slug}`,
          })),
        }}
      />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-paper pb-14 pt-[100px] sm:pb-16 lg:pt-[116px]">
        <div className="absolute inset-0 bg-hero-pattern" aria-hidden="true" />
        <div className="absolute -right-40 top-40 h-[26rem] w-[26rem] rounded-full bg-sage blur-3xl" aria-hidden="true" />
        <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-sage2/60 blur-3xl" aria-hidden="true" />
        <div className="container-x relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left"
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary backdrop-blur">
              <BadgeCheck size={15} /> Services
            </span>
            <h1 className="text-[34px] font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[64px]">
              Nutrition &amp; care for every stage of life
            </h1>
            <p className="mx-auto mt-5 max-w-[600px] text-base leading-relaxed text-muted sm:text-lg lg:mx-0">
              From weight and diabetes to pregnancy, children's health and special needs — every plan is built around
              your body, your goals and your food habits. No fad diets. No crash plans. Just science-backed nutrition you
              can actually live with.
            </p>
            <Link to="/contact" className="btn-primary mt-8 min-w-[200px] lg:min-w-[220px]">
              <CalendarCheck size={19} /> Book a Consultation
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ================= STICKY SUB-NAV ================= */}
      <nav className="sticky top-[72px] z-40 border-b border-ink/10 bg-[rgba(247,248,245,0.9)] backdrop-blur-[10px]">
        <div className="container-x flex items-center gap-1 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className="whitespace-nowrap rounded-full px-4 py-2 font-body text-[14.5px] font-medium text-ink/70 transition hover:bg-primary/5 hover:text-primary"
            >
              <span className="mr-1.5 text-xs font-semibold text-limeDark">{cat.no}</span>
              {cat.title}
            </a>
          ))}
          {orphans.length > 0 && (
            <a
              href="#more-services"
              className="whitespace-nowrap rounded-full px-4 py-2 font-body text-[14.5px] font-medium text-ink/70 transition hover:bg-primary/5 hover:text-primary"
            >
              <span className="mr-1.5 text-xs font-semibold text-limeDark">+</span>
              All Services
            </a>
          )}
        </div>
      </nav>

      {/* ================= CATEGORY SECTIONS ================= */}
      {grouped.map((cat, catIndex) => (
        <section
          key={cat.id}
          id={cat.id}
          className={`scroll-mt-[128px] section-pad ${catIndex % 2 === 0 ? "bg-paper" : "bg-white"}`}
          aria-labelledby={`services-${cat.id}`}
        >
          <div className="container-x">
            <div id={`services-${cat.id}`}>
              <SectionHeading
                center={false}
                eyebrow={`${cat.no} · ${cat.title}`}
                title={cat.title}
                subtitle={cat.blurb}
              />
            </div>
            <div className="space-y-6">
              {cat.items.length > 0 ? (
                    cat.items.map(renderRow)
                  ) : (
                    <p className="text-sm text-muted">No services in this category right now.</p>
                  )}
                </div>
              </div>
            </section>
          ))}

          {ordered.length === 0 ? (
            <section className="section-pad">
              <div className="container-x rounded-[22px] border border-line bg-white px-6 py-16 text-center">
                <p className="font-heading text-xl font-semibold text-ink">Services are being updated</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                  Our programme list is being refreshed. Please get in touch and we will guide you.
                </p>
                <Link to="/contact" className="btn-primary mt-7">
                  Contact us
                </Link>
              </div>
            </section>
          ) : null}

      {orphans.length > 0 && (
        <section id="more-services" className="scroll-mt-[128px] section-pad bg-white">
          <div className="container-x">
            <SectionHeading
              center={false}
              eyebrow="All Services"
              title="More Services"
              subtitle="Additional services — every plan is personalised to your body and goals."
            />
            <div className="space-y-6">{orphans.map(renderRow)}</div>
          </div>
        </section>
      )}

      {ordered.some((s) => s.credibility) && (
        <section className="bg-section-sage py-10">
          <div className="container-x flex flex-wrap items-start justify-center gap-x-10 gap-y-4">
            {ordered
              .filter((s) => s.credibility)
              .map((s) => (
                <p
                  key={s._id}
                  className="flex items-start gap-2.5 rounded-full border border-lime/40 bg-white/80 px-6 py-3 text-sm font-medium text-ink"
                >
                  <BadgeCheck size={17} className="mt-0.5 shrink-0 text-limeDark" /> {s.credibility}
                </p>
              ))}
          </div>
        </section>
      )}

      {/* ================= HOW IT WORKS ================= */}
      <section className="bg-primary section-pad">
        <div className="container-x">
          <SectionHeading
            light
            eyebrow="How It Works"
            title="One Method, Personalised For Every Condition"
            subtitle="Every plan above, however different the condition, follows the same personalised method."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.1}>
                <div className="h-full rounded-[18px] border border-white/15 bg-white/5 p-7 transition hover:bg-white/10">
                  <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-lime font-heading text-lg font-semibold text-ink">
                    {i + 1}
                  </span>
                  <h3 className="mb-2 font-heading text-[19px] font-semibold text-[#EEF3EA]">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[#A9C0A0]">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12 text-center">
            <Link to="/contact" className="btn-gold !bg-lime !text-ink hover:!bg-limeDark">
              <CalendarCheck size={19} /> Book your consultation
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}