import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, CalendarCheck, CheckCircle2, Clock, Users, Wallet } from "lucide-react";
import SEO from "../components/SEO";
import PageHero from "../components/PageHero";
import { useSite } from "../context/SiteContext";
import { ICON_MAP } from "../utils/helpers";
import { loadService, localService } from "../services/servicesApi";

/**
 * Individual service detail view — /services/:slug
 *
 * The bundled catalogue resolves the slug synchronously, so the page renders
 * immediately and a failed CMS call simply keeps that copy. There is no
 * loading gate and no reconnect message: from the visitor's point of view there
 * is nothing to recover from.
 */
export default function ServiceDetail() {
  const { slug } = useParams();
  const { site } = useSite();
  const [service, setService] = useState(() => localService(slug));
  const [notFound, setNotFound] = useState(() => !localService(slug));

  useEffect(() => {
    let alive = true;
    setService(localService(slug));
    setNotFound(!localService(slug));
    window.scrollTo({ top: 0 });

    loadService(slug).then(({ service: item, error }) => {
      if (!alive) return;
      if (item) {
        setService(item);
        if (error) console.warn(`[service:${slug}] CMS record unavailable, serving the bundled copy:`, error.message);
      } else if (!localService(slug)) {
        setNotFound(true);
      }
    });

    return () => {
      alive = false;
    };
  }, [slug]);

  if (notFound) {
    return (
      <section className="section-pad pt-[140px]">
        <div className="container-x text-center">
          <h1 className="font-heading text-3xl font-semibold text-ink">Service not found</h1>
          <p className="mx-auto mt-3 max-w-md text-muted">That service is no longer available. Browse the full range below.</p>
          <Link to="/services" className="btn-primary mt-8">
            <ArrowLeft size={17} /> Back to Services
          </Link>
        </div>
      </section>
    );
  }

  if (!service) {
    return (
      <section className="section-pad pt-[160px]">
        <div className="container-x">
          <div className="mx-auto h-[60vh] max-w-3xl animate-pulse rounded-[24px] border border-line bg-white/60 motion-reduce:animate-none" />
        </div>
      </section>
    );
  }

  const Icon = ICON_MAP.get(service.icon) || ICON_MAP.get("Sparkles");
  const planCovers = Array.isArray(service.planCovers) ? service.planCovers : [];
  const suitableFor = Array.isArray(service.suitableFor) ? service.suitableFor : [];
  /* "Ongoing" carries no information a visitor can act on, so it is never shown. */
  const rawDuration = typeof service.duration === "string" ? service.duration.trim() : "";
  const duration = rawDuration && !/^ongoing$/i.test(rawDuration) ? rawDuration : "";

  return (
    <>
      <SEO
        title={service.title}
        fullTitle={`${service.title} | GOLZ \u2013 Giggles of Livez`}
        description={service.shortDesc}
        image={service.image}
        keywords={`${service.title}, nutrition, dietitian, diet plan`}
        canonical={`${window.location.origin}/services/${service.slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "MedicalProcedure",
          name: service.title,
          description: service.shortDesc,
          provider: { "@type": "MedicalClinic", name: site.general?.clinicName || "GOLZ (Giggles of Livez)" },
        }}
      />

      <PageHero title={service.title} subtitle={service.shortDesc} breadcrumb={["Services", service.title]} image={service.image} />

      <section className="section-pad pt-0">
        <div className="container-x grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-w-0"
          >
            <div className="mb-10 flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-sage text-primary">
                {Icon ? <Icon size={28} /> : null}
              </span>
              <div className="min-w-0">
                <h1 className="font-heading text-3xl font-semibold leading-tight text-ink">{service.title}</h1>
                {duration ? (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
                    <Clock size={14} /> {duration}
                  </p>
                ) : null}
              </div>
            </div>

            {service.forWho ? (
              <p className="mb-8 rounded-[18px] border border-line bg-sage/50 px-6 py-4 text-sm font-medium leading-relaxed text-ink">
                <span className="font-semibold text-primary">For: </span>
                {service.forWho}
              </p>
            ) : null}

            {service.description ? <div className="rich-text" dangerouslySetInnerHTML={{ __html: service.description }} /> : null}

            {planCovers.length > 0 ? (
              <>
                <h2 className="mb-5 mt-12 font-heading text-2xl font-semibold text-ink">What Your Plan Covers</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {planCovers.map((item) => (
                    <li key={item} className="flex items-start gap-3 rounded-[18px] border border-line bg-white p-4 text-sm font-medium leading-relaxed text-ink/80">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-limeDark" /> {item}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {service.credibility ? (
              <p className="mt-8 flex items-start gap-3 rounded-[18px] border border-lime/40 bg-lime/10 px-6 py-4 text-sm font-medium leading-relaxed text-ink">
                <BadgeCheck size={20} className="mt-0.5 shrink-0 text-limeDark" /> {service.credibility}
              </p>
            ) : null}

            {suitableFor.length > 0 ? (
              <>
                <h2 className="mb-4 mt-12 font-heading text-2xl font-semibold text-ink">Who Should Choose This</h2>
                <ul className="flex flex-wrap gap-3">
                  {suitableFor.map((item) => (
                    <li key={item} className="chip !cursor-default">{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </motion.article>

          <aside>
            <div className="card sticky top-28 p-8">
              <div className="mb-7 space-y-3 text-sm text-ink/70">
                {duration ? (
                  <p className="flex items-center gap-3"><Clock size={17} className="shrink-0 text-primary" /> {duration}</p>
                ) : null}
                <p className="flex items-center gap-3"><Users size={17} className="shrink-0 text-primary" /> 1-on-1 with your nutritionist</p>
                <p className="flex items-center gap-3"><Wallet size={17} className="shrink-0 text-primary" /> Flexible payment options</p>
              </div>
              <Link to={`/contact?service=${encodeURIComponent(service.title)}`} className="btn-primary w-full">
                <CalendarCheck size={18} /> Book Consultation
              </Link>
              <p className="mt-5 text-center text-xs text-muted">Free 10-minute discovery call before you commit.</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
