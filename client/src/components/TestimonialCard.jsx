import { memo, useState } from "react";
import { Quote, Star, CheckCircle2 } from "lucide-react";
import ImgFallback from "./ImgFallback";

function TestimonialCard({ item }) {
  const { name = "", role = "", rating = 5, result = "", text = "", photo = "" } = item;
  const [expanded, setExpanded] = useState(false);
  const initial = (name.trim()[0] || "G").toUpperCase();
  const category = role.replace(/\s*Program\s*$/i, "").trim();
  const long = text.length > 240;

  return (
    <article className="relative flex h-full flex-col rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out sm:p-7 sm:hover:-translate-y-2 sm:hover:scale-[1.02] sm:hover:shadow-[0_32px_80px_rgba(0,0,0,0.22)]">
      <Quote size={40} strokeWidth={1.2} className="absolute right-6 top-6 text-[#D4AF37]/25" aria-hidden="true" />

      <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={17}
            className={i <= Math.round(rating) ? "fill-[#D4AF37] text-[#D4AF37]" : "fill-gray-200 text-gray-200"}
          />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        {category && (
          <span className="rounded-full bg-[#14532D] px-3.5 py-1.5 text-[12px] font-semibold text-white">
            {category}
          </span>
        )}
        {result && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16A34A]/10 px-3.5 py-1.5 text-[12px] font-semibold text-[#16A34A]">
            <CheckCircle2 size={13} aria-hidden="true" /> {result}
          </span>
        )}
      </div>

      <blockquote className="mt-5 grow">
        <p className={`text-[18px] leading-[1.8] text-[#374151] ${expanded ? "" : "line-clamp-5"}`}>“{text}”</p>
        {long && (
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-2 text-sm font-semibold text-[#16A34A] transition-colors hover:text-[#12843A]"
          >
            {expanded ? "Read Less" : "Read More"}
          </button>
        )}
      </blockquote>

      <footer className="mt-6 flex items-center gap-4 border-t border-gray-100 pt-6">
        {photo ? (
          <ImgFallback
            src={photo}
            alt={name}
            loading="lazy"
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-[#D4AF37]/30"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F6C453] to-[#DFA63B] font-heading text-xl font-bold text-[#3E2A00] ring-2 ring-[#D4AF37]/30"
          >
            {initial}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="h3 truncate text-[#111827]">{name}</h3>
          {role && <p className="truncate text-base text-[#6B7280]">{role}</p>}
        </div>
      </footer>
    </article>
  );
}

export default memo(TestimonialCard);
