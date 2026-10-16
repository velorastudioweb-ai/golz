import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, Award, Target, Eye, ArrowRight, CheckCircle2, BadgeCheck,
  Sparkles, HeartPulse, Quote, Baby, Mic, Medal,
} from "lucide-react";
import { useSite } from "../context/SiteContext";
import SEO from "../components/SEO";
import PageHero from "../components/PageHero";
import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";

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

const HELP_ICONS = [Sparkles, HeartPulse, Baby];

/* Bundled copy of the About payload. The CMS values always win, but these keep
   the story, helps-with, specialisation, credentials, recognition and
   beyond-the-clinic sections populated if the request never lands. */
const FB = {
  heroTitle: "About Dr. Sushma Appaiah",
  name: "Dr. Sushma Appaiah",
  designation: "Founder & Nutrition Scientist, GOLZ",
  image: "/doctor-portrait.jpg",
  experienceYears: 19,
  story:
    "Dr. Sushma Appaiah is the Founder of GOLZ (Giggles of Livez) and a distinguished nutrition scientist with 19 years of experience in clinical nutrition, corporate wellness, and health counselling. She holds a Ph.D. in Food Science & Technology from CSIR-CFTRI, Mysore, and an M.Sc. in Food & Nutrition (2nd Rank) from the University of Mysore. Over the years, she has helped clients across 13 countries achieve sustainable health through evidence-based nutrition and personalized care.",
  approach:
    "Since founding GOLZ in Mysore in 2015, she's grown it into two centres serving clients across 13 countries — but the philosophy has never changed: nutrition should be personal. She doesn't hand out generic meal charts. She reads your body — your condition, your labs, even your genetics through nutrigenomics — and builds a plan that fits your life. Over the years, that approach has helped thousands reverse diabetes, manage PCOS and thyroid issues, recover from illness, and simply feel better.",
  helpGroups: [
    {
      title: "Metabolic & Lifestyle",
      items: [
        "Diabetes reversal",
        "PCOS",
        "Thyroid",
        "Weight management",
        "Onco (cancer recovery)",
        "Sports nutrition",
        "Stress & mental wellbeing",
      ],
    },
    {
      title: "Life-stage & Family",
      items: ["Pregnancy, GDM & lactation", "ASD/Autism & ADHD child nutrition", "Nutrigenomics, Gutbiomics"],
    },
  ],
  specialNeeds: {
    heading: "Nutrition for children with special needs",
    text: "Specialised child nutrition is at the heart of Dr. Sushma's work — she's delivered over 3,000 diet plans for children with ASD/Autism, ADHD, and developmental needs, through institutions like AIISH (Mysore) and early-intervention school programs. Certified in Autism & ADHD Nutrition Therapy (Cambridge International Institute, UK), she builds gentle, practical plans that work with a child's sensitivities, not against them.",
    stat: {
      value: 3000,
      suffix: "+",
      label: "diet plans delivered for children with special needs",
    },
    credibility: "Certified in Autism & ADHD Nutrition Therapy, Level 1 & 2 — Cambridge International Institute, UK",
    ctaLabel: "Book a consultation for your child",
  },
  credentials: [
    "Ph.D, Food Science & Technology — CSIR-CFTRI, Mysore",
    "M.Sc, Food & Nutrition (2nd Rank) — University of Mysore",
    "Advanced Nutrigenomics Expert — Genebox Academy",
    "Autism & ADHD Nutrition Therapy, Level 1 & 2 — Cambridge International Institute, UK",
    "19 years in personalised nutrition counselling",
  ],
  recognition: [
    "Karnataka Pride Award for remarkable achievements & transformative contributions in nutrition and wellness",
    "Women Achiever entrepreneur from Academia",
    "Changemaker Award Feb/2022 by Aryan Institute",
    "Awarded women achiever entrepreneur impacting Global health",
    "Most Innovative Nutrition counsellor of the year 2019-20",
    "Special Recognition for Innovative food formulations",
    "DST Women Scientist Awardee",
    "Won awards for best research presentations",
  ],
  recognitionFootnote: "…among 10+ national and international honours.",
  speaking: {
    eyebrow: "Speaking",
    title: "Speaking Engagements & Expertise",
    since: "Since 2015 onwards",
    items: [
      "Invited speaker for more than 40–45 national and international conferences.",
      "Delivered more than 250 invited talks on prevention and management of disease as nutrition counsellor/invited speaker at academic and public forums, Pan India.",
    ],
  },
  professionalAffiliations: {
    eyebrow: "Memberships",
    title: "Professional Affiliations",
    items: [
      "Life member — Association of Food Scientists and Technologists, India (AFSTI)",
      "Life member — Indian Dietetics Association (IDA)",
      "Life member — Indian Nutritional Medical Association (INMA)",
    ],
  },
  beyondClinic:
    "Beyond her practice, Dr. Sushma shapes how nutrition is taught in India. She's developed UGC-approved nutrition programs, convenes the Indian Dietetics Association's Mysore chapter, has delivered 250+ invited talks, published 15+ peer-reviewed papers, and — during the pandemic — coordinated nutrition training for 20,000+ Anganwadi and ASHA workers across the country.",
  affiliations: "AFSTI · Indian Dietetics Association (IDA) · Indian Nutritional Medical Association (INMA)",
  mission:
    "To make evidence-based nutrition simple, accessible and enjoyable — so every client can achieve lasting health without deprivation or fad diets.",
  vision: "A world where personalized nutrition is the first line of defence against lifestyle disease, not the last resort.",
  stats: [
    { value: 19, suffix: "+", label: "Years of changing lives with nutrition and wellness programs" },
    { value: 8000, suffix: "+", label: "Personalized diet plans delivered" },
    { value: 3000, suffix: "+", label: "Specialized diet plans for children" },
  ],
};

const str = (v, f) => (typeof v === "string" && v.trim() ? v : f);
const arr = (v, f) => (Array.isArray(v) && v.length ? v : f);

export default function About() {
  const { site } = useSite();
  const a = site.about || {};
  const seo = site.seo || {};

  const heroTitle = str(a.heroTitle, FB.heroTitle);
  const name = str(a.name, FB.name);
  const designation = str(a.designation, FB.designation);
  const image = str(a.image, FB.image);
  const experienceYears = Number(a.experienceYears) > 0 ? Number(a.experienceYears) : FB.experienceYears;
  const story = str(a.story, FB.story);
  const approach = str(a.approach, FB.approach);
  const helpGroups = arr(a.helpGroups, FB.helpGroups);
  const credentials = arr(a.credentials, FB.credentials);
  const recognition = arr(a.recognition, FB.recognition);
  const recognitionFootnote = str(a.recognitionFootnote, FB.recognitionFootnote);
  const speaking = a.speaking?.items?.length ? a.speaking : FB.speaking;
  const professionalAffiliations = a.professionalAffiliations?.items?.length ? a.professionalAffiliations : FB.professionalAffiliations;
  const beyondClinic = str(a.beyondClinic, FB.beyondClinic);
  const affiliations = str(a.affiliations, FB.affiliations);
  const mission = str(a.mission, FB.mission);
  const vision = str(a.vision, FB.vision);
  const stats = arr(a.stats, FB.stats);

  const s = a.specialNeeds || {};
  const sn = {
    heading: str(s.heading, FB.specialNeeds.heading),
    text: str(s.text, FB.specialNeeds.text),
    credibility: str(s.credibility, FB.specialNeeds.credibility),
    ctaLabel: str(s.ctaLabel, FB.specialNeeds.ctaLabel),
    stat: {
      /* 8,000+ is the approved figure everywhere diet plans are counted. */
      value: Number(s.stat?.value) > 0 ? Number(s.stat.value) : FB.specialNeeds.stat.value,
      suffix: str(s.stat?.suffix, FB.specialNeeds.stat.suffix),
      label: str(s.stat?.label, FB.specialNeeds.stat.label),
    },
  };

  return (
    <>
      <SEO
        title="About"
        description={story}
        image={image}
        keywords={seo.keywords}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Person",
          name,
          jobTitle: designation,
          description: story,
        }}
      />
      <PageHero
        title={heroTitle}
        subtitle={`${name} — ${designation}`}
        breadcrumb={["About"]}
        image={image}
      />

      {/* ================= STORY ================= */}
      <section className="section-pad">
        <div className="container-x grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal className="relative order-2 lg:order-1">
            <div className="absolute -left-5 top-5 h-40 w-40 rounded-3xl bg-sage/60" />
            <div className="absolute -bottom-6 -right-6 h-44 w-44 rounded-full bg-lime/15 blur-2xl" />
            {image && (
              <img src={image} alt={name} className="relative z-10 h-[360px] w-full rounded-[180px_180px_22px_22px] object-cover shadow-lift sm:h-[500px] lg:h-[600px]" loading="lazy" />
            )}
            <div className="glass absolute -bottom-7 left-10 z-20 rounded-[18px] px-7 py-4 shadow-card">
              <p className="font-heading text-2xl font-semibold text-primary">{experienceYears}+</p>
              <p className="text-xs text-muted">Years of Experience</p>
            </div>
          </Reveal>
          <div className="order-1 lg:order-2">
            <SectionHeading center={false} eyebrow="The Story" title={name || "Your Nutritionist"} />
            <div className="body mt-5 space-y-4 text-ink/75">
              {story.split(/\n{2,}/).map((para) => (
                <p key={para.slice(0, 24)}>{para}</p>
              ))}
            </div>
            <p className="body mt-6 rounded-[18px] border border-line bg-sage/50 p-6 text-ink/75">
              <Quote size={20} className="mb-2 text-primary" />
              {approach}
            </p>
          </div>
        </div>
      </section>

      {/* ================= WHAT SHE HELPS WITH ================= */}
      <section className="bg-section-sage section-pad">
        <div className="container-x">
          <SectionHeading
            eyebrow="What She Helps With"
            title="A food platter scientifically curated for you"
            subtitle="From metabolic conditions to family nutrition, every area of her work follows the same principle — nutrition that is personal."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {helpGroups.map((group, gi) => {
              const Icon = HELP_ICONS[gi % HELP_ICONS.length];
              return (
                <Reveal key={group.title} delay={gi * 0.1}>
                  <div className="card h-full p-8">
                    <div className="mb-6 flex items-center gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                        {Icon && <Icon size={24} />}
                      </span>
                      <h3 className="card-title text-ink">{group.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {(group.items || []).map((item) => (
                        <span key={item} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink/80 transition hover:border-primary hover:text-primary">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SPECIAL NEEDS ================= */}
      <section className="relative overflow-hidden bg-primary section-pad">
        <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-sage/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-lime/10 blur-3xl" aria-hidden="true" />
        <div className="container-x relative z-10 grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-lime px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-ink">
              <HeartPulse size={14} /> Core Specialisation
            </span>
            <h2 className="h2 text-[#EEF3EA]">
              {sn.heading}
            </h2>
            <p className="body mt-6 text-[#DBE6D5]/90">{sn.text}</p>
            <p className="mt-8 flex items-start gap-3 rounded-[18px] border border-lime/40 bg-white/5 px-6 py-4 text-sm font-medium leading-relaxed text-[#EEF3EA]">
              <BadgeCheck size={20} className="mt-0.5 shrink-0 text-lime" /> {sn.credibility}
            </p>
            <Link to="/contact" className="btn-gold mt-9 !bg-lime !text-ink hover:!bg-limeDark">
              {sn.ctaLabel} <ArrowRight size={18} />
            </Link>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="rounded-[180px_180px_22px_22px] border border-white/15 bg-white/5 p-10 text-center lg:p-14">
              <p className="font-heading stat-value font-semibold text-lime">
                <CountUp value={sn.stat.value} suffix={sn.stat.suffix} />
              </p>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-[#A9C0A0]">
                {sn.stat.label}
              </p>
              <p className="mt-8 text-xs uppercase tracking-widest text-[#9FB4A5]">Through institutions like</p>
              <p className="mt-2 font-heading text-lg font-semibold text-[#EEF3EA]">AIISH, Mysore · Early-intervention school programs</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= CREDENTIALS ================= */}
      <section className="section-pad">
        <div className="container-x">
          <SectionHeading eyebrow="Credentials" title="Professionally trained with practical expertise" />
          <div className="grid gap-5 sm:grid-cols-2">
            {credentials.map((c, i) => (
              <Reveal key={c} delay={(i % 2) * 0.08}>
                <div className="card flex items-start gap-4 p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                    <GraduationCap size={22} />
                  </span>
                  <p className="pt-1.5 text-sm font-medium leading-relaxed text-ink/80">{c}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SPEAKING ENGAGEMENTS & EXPERTISE ================= */}
      <section className="bg-section-sage section-pad">
        <div className="container-x">
          <SectionHeading
            eyebrow={speaking.eyebrow}
            title={speaking.title}
            subtitle={speaking.since}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {speaking.items.map((item, i) => (
              <Reveal key={item} delay={(i % 2) * 0.08}>
                <div className="card flex h-full items-start gap-4 p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-lime/15 text-limeDark">
                    <Mic size={22} />
                  </span>
                  <p className="pt-1.5 text-sm font-medium leading-relaxed text-ink/80">{item}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PROFESSIONAL AFFILIATIONS ================= */}
      <section className="section-pad">
        <div className="container-x">
          <SectionHeading eyebrow={professionalAffiliations.eyebrow} title={professionalAffiliations.title} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {professionalAffiliations.items.map((item, i) => (
              <Reveal key={item} delay={(i % 3) * 0.08}>
                <div className="card flex h-full items-start gap-4 p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Medal size={22} />
                  </span>
                  <p className="pt-1.5 text-sm font-medium leading-relaxed text-ink/80">{item}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= RECOGNITION ================= */}
      <section className="bg-section-sage section-pad">
        <div className="container-x">
          <SectionHeading
            eyebrow="Recognition"
            title="Honoured For Impact Beyond The Clinic"
            subtitle="National and international recognition for her work in research, Reversal of disease, innovation and community health."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {recognition.map((r, i) => (
              <Reveal key={r} delay={(i % 2) * 0.08}>
                <div className="card flex items-start gap-4 p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime/15 text-limeDark">
                    <Award size={22} />
                  </span>
                  <p className="pt-1.5 text-sm font-medium leading-relaxed text-ink/80">{r}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8 text-center">
            <p className="text-sm italic text-muted">{recognitionFootnote}</p>
          </Reveal>
        </div>
      </section>

      {/* ================= BEYOND THE CLINIC ================= */}
      <section className="section-pad">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <SectionHeading
              center={false}
              eyebrow="Beyond The Clinic"
              title="Nurturing Nutrition academically"
            />
            <p className="body text-ink/75">{beyondClinic}</p>
            <div className="mt-8 flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted">Life member —</span>
              {affiliations.split("·").map((af) => (
                <span key={af} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink/80">
                  {af.trim()}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="card p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-lime text-ink"><Target size={24} /></span>
                <h3 className="card-title text-ink">Our Mission</h3>
              </div>
              <p className="text-sm leading-relaxed text-ink/70">{mission}</p>
              <div className="mt-8 mb-6 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary/10 text-primary"><Eye size={24} /></span>
                <h3 className="card-title text-ink">Our Vision</h3>
              </div>
              <p className="text-sm leading-relaxed text-ink/70">{vision}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="section-pad pt-0">
        <div className="container-x">
          <Reveal className="grid grid-cols-1 gap-6 rounded-[24px] bg-primary p-8 shadow-lift sm:grid-cols-3 sm:gap-8 sm:p-10">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-heading stat-value font-semibold text-lime">
                  <CountUp value={Number(s.value)} suffix={s.suffix} />
                </p>
                <p className="mt-1.5 text-sm text-[#DBE6D5]/80">{s.label}</p>
              </div>
            ))}
          </Reveal>
          <Reveal className="mt-12 text-center">
            <Link to="/contact" className="btn-primary">
              Book a Consultation <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
