import { Link } from "react-router-dom";
import { ChevronRight, CalendarHeart } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Dark-green editorial hero for the blog listing.
 *
 * The copy lives here as the default so the page cannot ship without it, and
 * the primary action is the same "Book a Consultation" call used across the site
 * rather than a second, competing one.
 */
export default function BlogHero({
  title = "Nutrition & Wellness Insights",
  description = "Practical nutrition guidance, healthy recipes, wellness insights, and expert advice from GOLZ.",
}) {
  return (
    <section className="relative overflow-hidden bg-primary pb-16 pt-[104px] sm:pb-20 lg:pt-[120px]">
      <div className="absolute -left-24 top-4 h-72 w-72 rounded-full bg-sage/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-lime/15 blur-3xl" aria-hidden="true" />

      <div className="container-x relative z-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.21, 0.65, 0.36, 1] }}
            className="max-w-3xl"
          >
            <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-sm text-[#DBE6D5]/70">
              <Link to="/" className="transition hover:text-lime">
                Home
              </Link>
              <ChevronRight size={14} aria-hidden="true" />
              <span className="text-[#EEF3EA]/90">Blogs</span>
            </nav>

            <h1 className="h1 text-[#EEF3EA]">
              {title}
            </h1>
            <p className="body-lg mt-5 max-w-xl text-[#DBE6D5]/80">{description}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.21, 0.65, 0.36, 1] }}
            className="lg:pb-2"
          >
            <Link to="/contact" className="btn-lime w-full !px-7 !py-4 text-base sm:w-auto lg:text-[18px]">
              <CalendarHeart size={18} aria-hidden="true" />
              Book a Consultation
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}