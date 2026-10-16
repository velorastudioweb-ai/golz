import { Link } from "react-router-dom";
import { CalendarCheck, Camera, Sparkles } from "lucide-react";

/**
 * Shown only when the gallery genuinely has no images — never as a stand-in for
 * a failed request. Copy makes no claims about content that does not exist.
 */
export default function GalleryEmptyState() {
  return (
    <div className="relative mt-10 overflow-hidden rounded-[28px] border border-line bg-white px-6 py-16 text-center shadow-soft sm:px-12 sm:py-20">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sage/60 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-lime/15 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-xl">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-sage text-primary">
          <Camera size={30} aria-hidden="true" />
        </span>

        <h2 className="h2 mt-7 text-ink">
          Gallery Coming Soon
        </h2>

        <p className="body-lg mx-auto mt-5 text-muted">
          We&rsquo;re preparing moments from GOLZ nutrition, workshops, recipes and wellness events. Check back soon.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/contact" className="btn-primary w-full sm:w-auto">
            <CalendarCheck size={18} aria-hidden="true" />
            Book a Consultation
          </Link>
          <Link to="/services" className="btn-outline w-full sm:w-auto">
            <Sparkles size={17} aria-hidden="true" />
            Explore Our Services
          </Link>
        </div>
      </div>
    </div>
  );
}
