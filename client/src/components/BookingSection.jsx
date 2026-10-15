import { memo } from "react";
import { MapPin, Clock3, Phone, Mail, Navigation, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useSite } from "../context/SiteContext";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const FALLBACK_MAP =
  "https://maps.google.com/maps?q=Bogadi%20Main%20Road%20Mysuru%20Karnataka%20570026&t=&z=14&ie=UTF8&iwloc=&output=embed";

const MAP_LINKS = {
  open: "https://www.google.com/maps/search/?api=1&query=Kshema+Healthcare+%23338+Bogadi+Main+Road+Mysuru+Karnataka+570026",
  bogadi: "https://www.google.com/maps/dir/?api=1&destination=Kshema+Healthcare+%23338+Bogadi+Main+Road+Mysuru+Karnataka+570026",
  roopanagar: "https://www.google.com/maps/dir/?api=1&destination=%231286+15A+Cross+Roopanagar+Mysuru",
};

const PILL_BTN =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-soft focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30";

function ClinicBlock({ title, badge, address, directionsUrl }) {
  return (
    <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="h3 text-ink">{title}</h3>
          {badge}
        </div>
        <p className="body mt-2 whitespace-pre-line text-muted">{address}</p>
      </div>
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Get directions to ${title}`}
        className={`${PILL_BTN} shrink-0 self-start sm:self-center`}
      >
        <Navigation size={15} /> Get Directions
      </a>
    </div>
  );
}

function ContactRow({ icon: Icon, label, href, children }) {
  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="truncate text-[15px] font-medium text-ink">{children}</p>
    </>
  );
  return (
    <div className="flex items-center gap-3.5">
      <Icon size={18} className="shrink-0 text-primary" />
      {href ? (
        <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} className="min-w-0 transition hover:opacity-75">
          {content}
        </a>
      ) : (
        <div className="min-w-0">{content}</div>
      )}
    </div>
  );
}

function BookingSection() {
  const { site } = useSite();
  const g = site.general || {};
  const phone = g.phone || "+91 934-267-4406";
  const whatsapp = g.whatsapp || "919342674406";
  const email = g.email || "nutrigolz@gmail.com";

  const waLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hi! I'd like to book a nutrition consultation.")}`;

  return (
    <section
      className="relative overflow-hidden bg-[#F8FAF7] section-pad"
      style={{
        background:
          "radial-gradient(circle at 88% 8%, rgba(163,198,68,0.09) 0%, transparent 42%), radial-gradient(circle at 6% 92%, rgba(28,75,55,0.06) 0%, transparent 45%), #F8FAF7",
      }}
    >
      <div className="container-x relative z-10">
        <SectionHeading
          title="Visit Our Clinics"
          subtitle="Book an appointment at the location most convenient for you."
        />

        <div className="grid items-start gap-10 lg:grid-cols-[2fr_3fr] lg:items-stretch lg:gap-14">
          {/* ---- Information panel ---- */}
          <Reveal className="order-2 lg:order-1">
            <div className="rounded-[28px] border border-[#ECEFEA] bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:p-10">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-7">
                <MapPin size={20} className="shrink-0 text-primary" />
                <h2 className="h3 text-ink">Clinic Locations</h2>
              </div>

              <div className="divide-y divide-gray-100">
                <ClinicBlock
                  title="Bogadi Clinic"
                  badge={<span className="rounded-full bg-lime/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-limeDark">Primary Clinic</span>}
                  directionsUrl={MAP_LINKS.bogadi}
                  address={`Kshema Healthcare\n#338, Bogadi Main Road\nBogadi, Mysuru – 570026`}
                />
                <ClinicBlock
                  title="Roopanagar Clinic"
                  directionsUrl={MAP_LINKS.roopanagar}
                  address={`#1286, 15A Cross\nRoopanagar, Mysuru`}
                />
              </div>

              <div className="border-t border-gray-100 pt-7">
                <div className="flex items-center gap-3">
                  <Clock3 size={20} className="shrink-0 text-primary" />
                  <h3 className="h3 text-ink">Consultation Hours</h3>
                </div>
                <div className="mt-5 space-y-5 text-[15px]">
                  <div>
                    <p className="font-semibold text-ink">Monday – Saturday</p>
                    <div className="mt-2 grid grid-cols-[minmax(0,90px)_1fr] gap-x-4 gap-y-1.5 text-muted">
                      <span className="font-medium text-ink/60">Morning</span>
                      <span>9:00 AM – 1:00 PM</span>
                      <span className="font-medium text-ink/60">Evening</span>
                      <span>4:30 PM – 8:00 PM</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-ink">Sunday</p>
                    <p className="font-semibold text-limeDark">Closed</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-ink">Govt Holidays</p>
                    <p className="font-semibold text-limeDark">Closed</p>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-5 border-t border-gray-100 pt-7">
                <ContactRow icon={Phone} label="Phone" href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</ContactRow>
                <ContactRow icon={MessageCircle} label="WhatsApp" href={waLink}>Chat with us instantly</ContactRow>
                <ContactRow icon={Mail} label="Email" href={`mailto:${email}`}>{email}</ContactRow>
              </div>
            </div>
          </Reveal>

          {/* ---- Map ---- */}
          <Reveal delay={0.12} className="order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-[380px] overflow-hidden rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:h-[460px] lg:h-full"
            >
              <iframe
                src={g.mapEmbed || FALLBACK_MAP}
                title="GOLZ clinic locations map"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0"
              />
              <a
                href={MAP_LINKS.open}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open clinic location in Google Maps"
                className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-sm font-semibold text-primary shadow-card backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
              >
                <MapPin size={16} className="text-primary" /> Visit Our Clinic
              </a>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default memo(BookingSection);
