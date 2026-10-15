import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  MapPin, Phone, Mail, MessageCircle, Clock, CalendarCheck,
} from "lucide-react";
import SEO from "../components/SEO";
import PageHero from "../components/PageHero";
import { useSite } from "../context/SiteContext";

/* The page degrades badly without these: an empty `workingHours` array would
   render a bare "Govt Holidays" row and a missing `mapEmbed` would silently
   drop the map. Both ship as defaults so the consultation page always shows
   hours and a clinic map, with the CMS values winning once they load. */
const FALLBACK_WORKING_HOURS = [
  { day: "Monday – Saturday", hours: "10:30 AM – 5:00 PM" },
  { day: "Sunday", hours: "Closed" },
];

const FALLBACK_MAP =
  "https://maps.google.com/maps?q=Bogadi%20Main%20Road%20Mysuru%20Karnataka%20570026&t=&z=14&ie=UTF8&iwloc=&output=embed";

export default function Contact() {
  const { site } = useSite();
  const g = site.general || {};
  const workingHours = g.workingHours?.length ? g.workingHours : FALLBACK_WORKING_HOURS;
  const whatsapp = g.whatsapp || "919342674406";
  const [params] = useSearchParams();

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: { service: params.get("service") || "" },
  });

  useEffect(() => {
    if (params.get("service")) reset({ service: params.get("service") });
  }, [params, reset]);

  const onSubmit = (values) => {
    const lines = [
      "New consultation request",
      "",
      `Name: ${values.name}`,
      `Phone: ${values.phone}`,
      `Email: ${values.email}`,
      `Area of Concern: ${values.service}`,
      `Preferred Date: ${values.preferredDate}`,
      `Preferred Time: ${values.preferredTime}`,
    ];
    if (values.message) lines.push(`Message: ${values.message}`);
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
    reset({ service: "" });
  };

  return (
    <>
      <SEO
        title="Book Consultation"
        description="Book a consultation with Dr. Sushma Appaiah — pick a program, date and preferred slot. Online and in-clinic consultations in Mysuru."
        keywords="book consultation, nutritionist appointment, dietitian booking"
      />
      <PageHero title="Book Consultation" subtitle="Pick a program and your preferred slot — we'll confirm your consultation shortly." breadcrumb={["Book Consultation"]} />

      <section className="section-pad">
        <div className="container-x">
          {/* Info cards */}
          <div className="mb-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: MapPin, title: "Clinic Address", lines: [g.address || "@Kshema Healthcare, #338, Bogadi Main Road, Bogadi, Mysuru 570026"] },
              { Icon: Phone, title: "Call Us", lines: [g.phone || "+91 934-267-4406"] },
              { Icon: Mail, title: "Email Us", lines: [g.email || "nutrigolz@gmail.com"] },
              { Icon: MessageCircle, title: "WhatsApp", lines: ["Chat with us instantly"] },
            ].map(({ Icon, title, lines }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card p-6 text-center">
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 p-3.5 text-primary"><Icon size={24} /></span>
                <h3 className="card-title mb-1.5 text-charcoal">{title}</h3>
                {lines.map((l) => <p key={l} className="text-sm text-charcoal/60">{l}</p>)}
              </motion.div>
            ))}
          </div>

          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
            {/* Form */}
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <h2 className="h3 mb-2 text-charcoal">Book a Consultation</h2>
              <p className="mb-7 text-sm text-charcoal/55">
                Fill in your details below — on submit, they open in WhatsApp for us to confirm your consultation.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="card grid gap-5 p-8" noValidate>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="cf-name" className="label">Name *</label>
                      <input id="cf-name" className="input" placeholder="Your full name" {...register("name", { required: "Name is required" })} />
                      {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="cf-phone" className="label">Phone *</label>
                      <input id="cf-phone" className="input" placeholder="+91 98xxxxxx" {...register("phone", { required: "Phone is required", pattern: { value: /^[+\d][\d\s-]{7,15}$/, message: "Enter a valid phone number" } })} />
                      {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="cf-email" className="label">Email *</label>
                    <input id="cf-email" type="email" className="input" placeholder="you@example.com" {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" } })} />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="cf-subject" className="label">Area of Concern *</label>
                    <select
                      id="cf-subject"
                      className="input"
                      {...register("service", { required: "Please select an area of concern" })}
                    >
                      <option value="">Select an area of concern…</option>
                      {site.services.map((s) => (
                        <option key={s._id} value={s.title}>{s.title}</option>
                      ))}
                      <option value="Other / Not sure">Other / Not sure yet</option>
                    </select>
                    {errors.service && <p className="mt-1 text-xs text-red-500">{errors.service.message}</p>}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="cf-date" className="label">Preferred Date *</label>
                      <input id="cf-date" type="date" className="input" min={new Date().toISOString().slice(0, 10)} {...register("preferredDate", { required: "Pick a date" })} />
                      {errors.preferredDate && <p className="mt-1 text-xs text-red-500">{errors.preferredDate.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="cf-time" className="label">Preferred Time *</label>
                      <select id="cf-time" className="input" {...register("preferredTime", { required: "Pick a slot" })}>
                        <option value="">Select a slot…</option>
                        <option>Morning (9 AM – 12 PM)</option>
                        <option>Afternoon (12 PM – 4 PM)</option>
                        <option>Evening (4 PM – 7 PM)</option>
                      </select>
                      {errors.preferredTime && <p className="mt-1 text-xs text-red-500">{errors.preferredTime.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cf-message" className="label">Message (optional)</label>
                    <textarea
                      id="cf-message"
                      rows={3}
                      className="input resize-none"
                      placeholder="Any health concerns or goals to share…"
                      {...register("message")}
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full">
                    <MessageCircle size={17} /> Send on WhatsApp
                  </button>
                  <p className="text-center text-xs text-charcoal/50">WhatsApp opens with your details pre-filled — just press send.</p>
                </form>
            </motion.div>

            {/* Info column */}
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <div className="card mb-8 overflow-hidden p-0">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h3 className="card-title text-charcoal">Working Hours</h3>
                  <Clock size={18} className="text-primary" />
                </div>
                <div className="divide-y divide-gray-50 px-6">
                  {workingHours.map((w, i) => (
                    <p key={`${w.day}-${i}`} className="flex justify-between py-3.5 text-sm">
                      <span className="text-charcoal/70">{w.day}</span>
                      <span className={`font-semibold ${w.hours === "Closed" ? "text-accent" : "text-primary"}`}>{w.hours}</span>
                    </p>
                  ))}
                  <p className="flex justify-between py-3.5 text-sm">
                    <span className="text-charcoal/70">Govt Holidays</span>
                    <span className="font-semibold text-accent">Closed</span>
                  </p>
                </div>
              </div>

              <div className="mb-8 overflow-hidden rounded-3xl shadow-card">
                <iframe
                  src={g.mapEmbed || FALLBACK_MAP}
                  title="Clinic location"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-[490px] w-full border-0"
                />
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-7 text-white shadow-lift">
                <h3 className="h3 mb-2">Prefer WhatsApp?</h3>
                <p className="mb-4 text-sm text-white/80">Message us anytime — we'll get back to you within working hours.</p>
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-gold !bg-white !text-primary">
                  <MessageCircle size={17} /> Chat on WhatsApp
                </a>
              </div>
            </motion.div>
          </div>

          <p className="mt-10 text-center text-sm text-charcoal/50">
            Not sure which program fits?{" "}
            <Link to="/services" className="font-semibold text-primary underline underline-offset-2">Browse our programs</Link>
          </p>
        </div>
      </section>
    </>
  );
}
