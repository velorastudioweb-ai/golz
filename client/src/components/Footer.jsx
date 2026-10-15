import { Link } from "react-router-dom";
import {
  Leaf, Phone, Mail, MapPin, Clock, Facebook, Instagram, Youtube, Twitter, Linkedin,
  ChevronRight, MessageCircle,
} from "lucide-react";
import { useSite } from "../context/SiteContext";

const SOCIAL_ICONS = { facebook: Facebook, instagram: Instagram, youtube: Youtube, twitter: Twitter, linkedin: Linkedin };

/* Published clinic profiles, so the footer never ships without social links
   even when the settings payload is missing or the fields are still empty. */
const FALLBACK_SOCIALS = {
  facebook: "https://www.facebook.com/company/golzmysuru",
  instagram: "https://www.instagram.com/golzmysuru/",
  twitter: "https://x.com/GolzMysuru",
};

export default function Footer() {
  const { site } = useSite();
  const g = site.general || {};
  const year = new Date().getFullYear();

  /* Contact details are the one thing a visitor must never lose, so they fall
     back to the published clinic numbers when the settings payload is absent. */
  const phone = g.phone || "+91 934-267-4406";
  const email = g.email || "nutrigolz@gmail.com";
  const whatsapp = g.whatsapp || "919342674406";

  const providedSocials = Object.fromEntries(
    Object.entries(g.socials || {}).filter(([, url]) => typeof url === "string" && url.trim())
  );
  const socials = Object.entries({ ...FALLBACK_SOCIALS, ...providedSocials })
    .map(([key, url]) => ({ key, url, Icon: SOCIAL_ICONS[key] }))
    .filter((s) => s.Icon);

  return (
    <footer className="bg-primary text-[#DBE6D5]/85">
      <div className="container-x grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/10 text-lime">
              <Leaf size={22} />
            </span>
            <span className="font-heading text-lg font-semibold text-[#EEF3EA]">{g.clinicName || "GOLZ (Giggles of Livez)"}</span>
          </div>
          <p className="mb-6 text-sm leading-relaxed">
            Personalized, evidence-based nutrition care — helping you transform your health through science-backed
            meal plans, compassionate support and results that last.
          </p>
          <div className="flex gap-2.5">
            {socials.map(({ key, url, Icon }) => (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={key}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#DBE6D5] transition hover:bg-lime hover:text-ink">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-5 font-heading text-base font-semibold text-[#EEF3EA]">Quick Links</h3>
          <ul className="space-y-2.5 text-sm">
            {[
              ["Home", "/"], ["About Us", "/about"], ["Services", "/services"],
              ["Gallery", "/gallery"], ["Blogs", "/blogs"], ["Book Consultation", "/contact"],
            ].map(([label, to]) => (
              <li key={to}>
                <Link to={to} className="inline-flex items-center gap-1.5 transition hover:text-lime">
                  <ChevronRight size={14} className="text-lime" /> {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-5 font-heading text-base font-semibold text-[#EEF3EA]">Contact & Hours</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-lime" /><span>{g.address || "@Kshema Healthcare, #338, Bogadi Main Road, Bogadi, Mysuru 570026"}</span></li>
            <li className="flex gap-3"><Phone size={18} className="shrink-0 text-lime" /><a href={`tel:${phone.replace(/\s/g, "")}`} className="transition hover:text-lime">{phone}</a></li>
            <li className="flex gap-3"><Mail size={18} className="shrink-0 text-lime" /><a href={`mailto:${email}`} className="transition hover:text-lime">{email}</a></li>
            <li className="flex gap-3"><MessageCircle size={18} className="shrink-0 text-lime" /><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="transition hover:text-lime">WhatsApp Us</a></li>
          </ul>
          <div className="mt-5 rounded-[18px] border border-white/15 bg-white/5 p-4 text-sm">
            <p className="mb-2 flex items-center gap-2 font-heading font-semibold text-[#EEF3EA]"><Clock size={15} className="text-lime" /> Working Hours</p>
            {(g.workingHours || []).map((w) => (
              <p key={w.day} className="flex justify-between py-0.5 text-xs text-[#A9C0A0]/90">
                <span>{w.day}</span><span className={w.hours === "Closed" ? "text-lime" : ""}>{w.hours}</span>
              </p>
            ))}
            <p className="flex justify-between py-0.5 text-xs text-[#A9C0A0]/90">
              <span>Govt Holidays</span><span className="text-lime">Closed</span>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-[#A9C0A0]/80 sm:flex-row">
          <p>© {year} {g.clinicName || "GOLZ (Giggles of Livez)"}. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/privacy-policy" className="transition hover:text-lime">Privacy Policy</Link>
            <Link to="/terms" className="transition hover:text-lime">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
