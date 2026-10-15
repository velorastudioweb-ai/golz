import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, CalendarCheck, Star, ArrowUpRight, BadgeCheck, Camera,
  Leaf, GraduationCap, Sparkles,
} from "lucide-react";
import { useSite } from "../context/SiteContext";
import SEO from "../components/SEO";
import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";
import BookingSection from "../components/BookingSection";
import Lightbox, { PlayBadge } from "../components/Lightbox";
import { FALLBACK_SERVICES, loadServices } from "../services/servicesApi";
import ServiceIcon from "../components/ServiceIcon";
import TestimonialsSection from "../components/TestimonialsSection";

const FALLBACK_STATS = [
  { value: 19, suffix: "+", label: "Years of changing lives with nutrition and wellness programs" },
  { value: 13, suffix: "+", label: "Countries with global clientele" },
  { value: 8000, suffix: "+", label: "Personalized diet plans delivered" },
  { value: 3000, suffix: "+", label: "Specialized diet plans for children" },
];

/* Success Stories returns null on an empty list, so these three published
   client stories ship with the bundle: the section renders even when the CMS
   payload never arrives, and the live records replace them once it does. */
const FALLBACK_TESTIMONIALS = [
  {
    _id: "fallback-chandrakala",
    name: "Chandrakala N",
    role: "Weight Management Program",
    rating: 5,
    photo: "",
    result: "Lost 2.2 kg & 6 cm off waist in 2 months",
    text: "I had a very positive experience following the program. Within two months I saw clear and measurable improvements — my weight reduced by 2.2 kg and my waist came down by 6 cm. My body fat percentage and BMI also improved, and my overall InBody score increased. What stood out even more was how I felt — more energetic, lighter, better sleep and almost no leg pain. The approach felt structured and sustainable rather than extreme. I would recommend this to anyone looking for a disciplined and result-oriented plan.",
    published: true,
  },
  {
    _id: "fallback-geetha",
    name: "Geetha Murthy",
    role: "Weight & Body Composition Program",
    rating: 5,
    photo: "",
    result: "Lost 5.8 kg in 3 months",
    text: "I had an excellent experience with Dr. Sushma Appaiah over the last 3 months. I lost 5.8 kg with major improvements in body fat, waist and hip measurements, visceral fat, and overall body composition. My energy levels are good and my periods remained regular, which shows the diet was healthy and well balanced. The results feel sustainable, not extreme. Truly professional guidance — highly recommend Dr. Sushma Appaiah.",
    published: true,
  },
  {
    _id: "fallback-shruthi",
    name: "Shruthi Vinayak",
    role: "Gut Health & Weight Gain",
    rating: 5,
    photo: "",
    result: "Healthy weight gain & new energy in 3 months",
    text: "I went to GOLZ with gut issues. Dr. Sushma gave me a diet plan which was not only simple to follow — all the ingredients were from the kitchen and easily available in the market. In just 3 months I saw tremendous change in my health. I was underweight and struggling to gain weight; my weight started increasing and I started feeling more energetic. Along with the diet she gave me pranayama which helped me become more stable emotionally and mentally. It was a complete holistic approach in a natural way. I would recommend GOLZ nutrition to everyone who wants to lead a happy, healthy and peaceful life. Thank you Dr. Sushma from the bottom of my heart.",
    published: true,
  },
];

function CountUp({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1600;
          const start = performance.now();
          const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {display.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

const FOUNDER_BIO = [
  "Dr. Sushma Appaiah is the Founder of GOLZ (Giggles of Livez) and a distinguished nutrition scientist with 19 years of experience in clinical nutrition, corporate wellness, and health counselling.",
  "Karnataka Pride Award for remarkable achievements & transformative contributions in the field of nutrition and wellness.",
  "She holds a Ph.D. in Food Science & Technology from CSIR-CFTRI, Mysore, and an M.Sc. in Food & Nutrition (2nd Rank) from the University of Mysore.",
  "Over the years, she has helped clients across 13 countries achieve sustainable health through evidence-based nutrition and personalized care.",
  "A recipient of the DST Women Scientist Award and recognized as the Most Innovative Nutrition Counsellor of the Year, Dr. Sushma is known for developing innovative food formulations for special children and translating scientific research into practical nutrition solutions.",
  "HER AREAS OF EXPERTISE INCLUDE REVERSING DIABETES, PCOD (RECENTLY TERMED AS PMOS), THYROID DISORDERS, PREGNANCY NUTRITION, SPORTS NUTRITION, ASD/ AUTISM AND SPECIAL CHILDREN NUTRITION, NUTRIGENOMICS, GUTBIOMICS, EMPOWERING INDIVIDUALS AND FAMILIES TO BUILD HEALTHIER LIVES THROUGH PERSONALIZED NUTRITION.",
].join("\n\n");

/* Client photos from the home gallery stand in for the hero social-proof
   stack, so the row shows real people instead of placeholder glyphs. */
const PATIENT_PHOTOS = [1, 2, 3, 4, 5].map((n) => ({
  src: `/home-gallery/home-${String(n).padStart(2, "0")}.jpg`,
  alt: `GOLZ client ${n}`,
}));

function PatientAvatar({ photo, color }) {
  const [broken, setBroken] = useState(false);
  return (
    <span
      className={`relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-cream ${color} text-white shadow-card`}
      aria-hidden="true"
    >
      {broken ? (
        <Leaf size={16} />
      ) : (
        <img
          src={photo.src}
          alt=""
          loading="lazy"
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </span>
  );
}

/* The client's own photo drop in client/public/home-gallery ships with the
   bundle and always leads the home grid; the pinned events and the rest of the
   archive fill the remaining slots behind it. */
const HOME_GALLERY_CAPTIONS = {
  2: "RECOGNITION BY IISF 2020 — NEWSPAPER",
  3: "MOU with St Philomean's College — June 2015",
  4: "Awareness on food safety — April 2016",
  5: "Nov 2020 — SIG-PHN Pan India (IDA)",
  6: "April 2016 — Food Safety & Food Law for post graduate Nutrition & dietetics students",
  7: "The Changemaker Award — Aryan Shiksha — 2022",
  8: "Lucknow — March 6, 7, 8, 2024",
  9: "AVP — program VO2 Max",
  11: "Award Function — Feb 2020",
  12: "IKMC 2018, Hyderabad",
};

/* Photos of awards, honours and press recognition — the default tab. */
const AWARD_PHOTOS = new Set([2, 7, 11]);

const LOCAL_HOME_GALLERY = Array.from({ length: 12 }, (_, i) => {
  const n = i + 1;
  const padded = String(n).padStart(2, "0");
  const caption = HOME_GALLERY_CAPTIONS[n] || "";
  return {
    id: `home-gallery-${padded}`,
    image: `/home-gallery/home-${padded}.jpg`,
    thumb: `/home-gallery/home-${padded}.jpg`,
    type: "image",
    section: "Home Gallery",
    sectionId: "",
    year: "",
    eventName: caption || "Our journey - Precious moments",
    caption,
    /* The label doubles as the event name, so the lightbox shows it once. */
    hasOwnCaption: false,
    alt: caption || "GOLZ nutrition — precious moment",
    order: i,
    origin: "home",
    /* Photos that show an award, honour or newspaper recognition. */
    award: AWARD_PHOTOS.has(n),
  };
});

const GALLERY_TABS = [
  { id: "awards", label: "Awards / Recognitions" },
  { id: "all", label: "All Photos" },
];

export default function Home() {
  const { site } = useSite();
  const h = site.homepage || {};
  const seo = site.seo || {};
  const testimonials = site.testimonials?.length ? site.testimonials : FALLBACK_TESTIMONIALS;
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 600], [0, -24]);
  const [heroSrc, setHeroSrc] = useState(
    typeof h.heroPortrait === "string" && h.heroPortrait.trim() ? h.heroPortrait : "/hero-banner.webp"
  );
  const [lightbox, setLightbox] = useState(null);
  const navigateLightbox = useCallback((index) => setLightbox((lb) => (lb ? { ...lb, index } : lb)), []);

  const [services, setServices] = useState(FALLBACK_SERVICES);

  /* Late resolutions are ignored after unmount. */
  useEffect(() => {
    let alive = true;
    loadServices()
      .then(({ services: items }) => {
        if (alive) setServices(items);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  /* The home preview shows only the client's own home-gallery photos; the full
     archive lives behind "View Gallery". */
  const [galleryTab, setGalleryTab] = useState(GALLERY_TABS[0].id);
  const homeGallery =
    galleryTab === "all" ? LOCAL_HOME_GALLERY : LOCAL_HOME_GALLERY.filter((g) => g.award);
  /* The lightbox walks whichever tab is on screen, so next/previous follow the grid. */
  const lightboxItems = homeGallery;

  return (
    <>
      <SEO
        title={seo.metaTitle}
        description={seo.metaDescription}
        image={seo.ogImage}
        keywords={seo.keywords}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "MedicalClinic",
          name: site.general?.clinicName,
          description: h.heroSubtitle,
          address: { "@type": "PostalAddress", streetAddress: site.general?.address },
          telephone: site.general?.phone,
        }}
      />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-paper pb-16 pt-[100px] sm:pb-20 lg:pt-[120px]">
        <div className="absolute inset-0 bg-hero-pattern" aria-hidden="true" />
        <div className="absolute -right-32 top-24 h-[26rem] w-[26rem] rounded-full bg-olive/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-terracotta/10 blur-3xl" aria-hidden="true" />

        <div className="container-x relative z-10">
          <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center lg:text-left"
            >
              {h.heroBadge && (
                <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-olive shadow-card">
                  <BadgeCheck size={15} /> {h.heroBadge}
                </span>
              )}
              <h1 className="mx-auto max-w-[640px] text-[34px] font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:mx-0 lg:text-[64px] xl:text-[68px]">
                {h.heroTitle || "Real food. Real plans. Real results—built around you."}
              </h1>
              <p className="mx-auto mt-5 max-w-[600px] text-base leading-relaxed text-muted sm:text-lg lg:mx-0 lg:text-xl">
                {h.heroSubtitle || "GOLZ is a science-backed platform offering personalized nutrition plans designed to improve your health without giving up the foods you love, serving a global clientele with clinical nutrition."}
              </p>
              <div className="mt-8 flex justify-center lg:justify-start">
                <Link to={h.ctaPrimary?.link || "/contact"} className="btn-terracotta min-w-[200px] lg:min-w-[220px]">
                  <CalendarCheck size={19} /> {h.ctaPrimary?.label || "Book a Consultation"}
                </Link>
              </div>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-5 lg:justify-start">
                <div className="flex -space-x-3">
                  {PATIENT_PHOTOS.map((photo, i) => (
                    <PatientAvatar key={photo.src} photo={photo} color={["bg-primary", "bg-olive", "bg-honey", "bg-sage", "bg-terracotta"][i]} />
                  ))}
                </div>
                <div className="text-center lg:text-left">
                  <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-ink lg:justify-start">
                    <Star size={16} className="fill-honey text-honey" /> 4.8 Google Rating
                  </p>
                  <p className="mt-0.5 text-sm text-muted">8k+ Happy Clients</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="relative mx-auto w-full max-w-[380px] sm:max-w-[440px] lg:max-w-[480px]"
            >
              <motion.div style={{ y: parallaxY }} className="relative">
                <div className="absolute -inset-5 rounded-[32px] bg-gradient-to-br from-olive/15 via-beige to-terracotta/15 blur-2xl" aria-hidden="true" />
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 5 }}
                  className="relative"
                >
                  <img
                    src={heroSrc}
                    onError={() => setHeroSrc("/hero-banner.png")}
                    alt="Nutritionist preparing a healthy salad"
                    className="aspect-[4/5] h-auto w-full rounded-[180px_180px_22px_22px] object-cover shadow-lift"
                    loading="eager"
                    fetchpriority="high"
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= STATISTICS ================= */}
      <section className="bg-sageLight section-pad">
        <div className="container-x">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {(h.stats?.length ? h.stats : FALLBACK_STATS).map((s, i) => (
              <Reveal key={s.label} delay={i * 0.08}>
                <div className="group flex min-h-[170px] flex-col items-center justify-center rounded-[24px] border border-ink/5 bg-white p-6 text-center shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
                  <p className="font-heading text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                    <CountUp value={Number(s.value)} suffix={s.suffix} />
                  </p>
                  <p className="mx-auto mt-2.5 max-w-[200px] text-sm font-medium leading-snug text-muted">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MEET THE FOUNDER ================= */}
      <section className="relative overflow-hidden bg-primary section-pad">
        <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-sage/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-lime/10 blur-3xl" aria-hidden="true" />
        <div className="container-x relative z-10 grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* Founder story */}
          <Reveal className="order-2 text-center lg:order-none lg:text-left">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-lime px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-ink">
              <Leaf size={14} /> About the Founder
            </span>
            <h2 className="font-heading text-4xl font-semibold leading-tight text-[#EEF3EA] lg:text-[46px]">
              {h.aboutPreview?.title || "Meet Dr. Sushma Appaiah"}
            </h2>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-lime">
              {site.about?.designation || "Founder — Clinical Nutritionist & Wellness Counsellor"}
            </p>

            <div className="mx-auto mt-6 max-w-[620px] space-y-4 text-[15px] leading-[1.85] text-[#DBE6D5]/90 lg:mx-0">
              {(h.aboutPreview?.text || FOUNDER_BIO).split(/\n{2,}/).map((para) => (
                <p key={para.slice(0, 24)}>{para}</p>
              ))}
            </div>

            <div className="mx-auto mt-9 grid max-w-[620px] grid-cols-2 divide-x divide-white/10 rounded-[18px] border border-white/15 bg-white/5 py-6 lg:mx-0">
              {[
                { value: site.about?.experienceYears || 19, suffix: "+", label: "Years of Experience" },
                { value: 8000, suffix: "+", label: "Diet Plans" },
              ].map((s) => (
                <div key={s.label} className="px-2 text-center sm:px-4">
                  <p className="font-heading text-2xl font-semibold text-lime sm:text-4xl">
                    <CountUp value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-[#A9C0A0] sm:text-xs">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                to={h.aboutPreview?.buttonLink || "/about"}
                className="btn-gold w-full !bg-lime !text-ink hover:!bg-limeDark sm:w-auto sm:min-w-[200px]"
              >
                {h.aboutPreview?.buttonLabel || "Know More"} <ArrowRight size={18} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/25 px-8 py-3.5 text-sm font-bold text-[#EEF3EA] transition-all duration-300 hover:border-lime hover:text-lime sm:w-auto sm:min-w-[200px]"
              >
                Book Consultation <ArrowUpRight size={18} />
              </Link>
            </div>
          </Reveal>

          {/* Portrait */}
          <Reveal delay={0.15} className="relative order-1 mx-auto w-full max-w-[420px] lg:order-none lg:max-w-none">
            <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-lime px-4 py-2 text-ink shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
              <p className="flex items-center gap-2 text-sm font-bold"><Sparkles size={15} /> GOLZ · Founder</p>
            </div>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 6 }} className="relative rounded-[180px_180px_22px_22px] border border-white/15 bg-white/5 p-6 sm:p-8">
              <img
                src={h.aboutPreview?.image || "/doctor-portrait.jpg"}
                onError={(e) => {
                  if (e.currentTarget.src.indexOf("/doctor-portrait.jpg") === -1) {
                    e.currentTarget.src = "/doctor-portrait.jpg";
                  }
                }}
                alt="Dr. Sushma Appaiah"
                className="aspect-[3/4] w-full rounded-[150px_150px_16px_16px] object-cover object-top"
                loading="lazy"
              />
              <div className="mt-6 flex items-center justify-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-lime/15 text-lime">
                  <GraduationCap size={22} />
                </span>
                <div className="text-left">
                  <p className="font-heading text-xl font-bold leading-none text-lime">{site.about?.experienceYears || 19}+</p>
                  <p className="mt-1 text-xs font-medium text-[#A9C0A0]">Years of Experience</p>
                </div>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section className="bg-white section-pad">
        <div className="container-x">
          <Reveal className="mx-auto max-w-[900px] text-center">
            <span className="mb-6 inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              Services
            </span>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-[46px]">
              NUTRITION &amp; CARE FOR EVERY LIFE STAGE TO MEET YOUR GOALS &amp; HEALTH NEEDS
            </h2>
            <p className="mx-auto mt-5 max-w-[600px] text-base leading-[1.8] text-muted sm:text-lg">
              From weight management and diabetes care to pregnancy, children's nutrition, sports nutrition, oncology, and healthy aging, every nutrition plan is personalized to your body, goals, medical history, and food preferences.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => {
              return (
                <Reveal key={s._id} delay={(i % 3) * 0.08} className="h-full">
                  <Link
                    to={`/services/${s.slug}`}
                    className="group flex h-full min-h-[240px] flex-col rounded-[24px] border border-[#ECECEC] bg-white p-7 transition-all duration-300 ease-out hover:-translate-y-2 hover:border-transparent hover:shadow-lift sm:p-8"
                  >
                    {s.image ? (
                      <img
                        src={s.image}
                        alt={s.title}
                        loading="lazy"
                        className="mb-6 aspect-[16/9] w-full rounded-[18px] object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    ) : null}
                    <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary transition-transform duration-300 ease-out group-hover:scale-110">
                      <ServiceIcon service={s} size={26} />
                    </span>
                    <h3 className="text-xl font-bold leading-snug text-ink transition-colors group-hover:text-primary sm:text-2xl">
                      {s.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-[1.8] text-muted">{s.shortDesc}</p>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="bg-section-sage section-pad">
        <div className="container-x">
          <Reveal className="mx-auto max-w-[820px] text-center">
            <span className="mb-6 inline-flex items-center rounded-full border border-primary/30 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              Steps
            </span>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-[46px]">
              How It Works
            </h2>
            <p className="mx-auto mt-5 max-w-[600px] text-base leading-[1.8] text-muted sm:text-lg">
              Precision nutrition, step by step — every plan is built on real data about your body and fine-tuned as you progress.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {[
              {
                no: "01",
                title: "Book your appointment",
                text: "Choose online or in-clinic. All consultations are by prior appointment — call or WhatsApp to reserve your slot.",
              },
              {
                no: "02",
                title: "Understand your nutritional profile",
                text: "We map your health, habits and goals with a scientific BCA (Body Composition Analysis), and medical checkups where needed, for a precise profile of your body.",
              },
              {
                no: "03",
                title: "Get a personalized diet plan for you",
                text: "Receive a precision diet plan built specially for you with your preferred foods along with exercise schedules — calibrated to your body, goals and health needs to prevent, manage and reverse disorders.",
              },
              {
                no: "04",
                title: "Progress with regular follow-ups",
                text: "We track your numbers at every follow-up and fine-tune your plan with precision as your body responds.",
              },
            ].map((step, i) => (
              <Reveal key={step.no} delay={i * 0.08}>
                <div className="relative h-full">
                  <p className="text-6xl font-bold leading-none text-primary/15 transition-colors duration-300 hover:text-primary/30">
                    {step.no}
                  </p>
                  <span className="mt-5 block h-px w-12 bg-lime" />
                  <h3 className="mt-4 text-xl font-bold leading-snug text-ink">{step.title}</h3>
                  <p className="mt-3 text-[18px] leading-[1.75] text-muted">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= GALLERY ================= */}
      <section className="section-pad">
        <div className="container-x">
          <SectionHeading
            eyebrow="Gallery"
            title="Our journey - Precious moments"
          />
          <div className="mb-8 flex flex-wrap justify-center gap-2.5">
            {GALLERY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGalleryTab(tab.id)}
                aria-pressed={galleryTab === tab.id}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  galleryTab === tab.id
                    ? "bg-primary text-white shadow-soft"
                    : "border border-primary/30 bg-white/80 text-primary hover:bg-white hover:shadow-soft"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div
            className={`grid gap-2 sm:gap-3 lg:gap-4 ${
              homeGallery.length <= 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-4"
            }`}
          >
            {homeGallery.map((g, i) => (
              <Reveal key={g.id} delay={(i % 4) * 0.06} className="h-full">
                <button
                  onClick={() => setLightbox({ items: lightboxItems, index: i })}
                  className="group relative block h-full w-full cursor-pointer overflow-hidden rounded-2xl text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                  aria-label={`Open ${g.caption || g.alt || "gallery item"}`}
                >
                  {g.type === "video" ? (
                    <>
                      <video src={g.image} muted className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <PlayBadge />
                    </>
                  ) : (
                    <img
                      src={g.thumb || g.image}
                      srcSet={g.srcSet || undefined}
                      sizes="25vw"
                      alt={g.alt || g.caption}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100" />
                  {g.caption && (
                    <span className="absolute bottom-2.5 left-3 right-3 line-clamp-2 text-[11px] font-medium leading-snug text-white opacity-100 transition sm:bottom-3 sm:text-xs sm:opacity-0 sm:translate-y-2 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                      {g.caption}
                    </span>
                  )}
                </button>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 text-center">
            <Link to="/gallery" className="btn-primary"><Camera size={18} /> View Gallery</Link>
          </Reveal>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <TestimonialsSection items={testimonials} />

      {/* ================= BOOK CONSULTATION ================= */}
      <BookingSection />

      <AnimatePresence>
        {lightbox && <Lightbox items={lightbox.items} index={lightbox.index} onClose={() => setLightbox(null)} onNavigate={navigateLightbox} />}
      </AnimatePresence>
    </>
  );
}
