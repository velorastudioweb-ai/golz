import { motion } from "framer-motion";
import { Camera } from "lucide-react";

/** Gallery hero. */
export default function GalleryHero({
  title = "Glimpses Inside GOLZ Nutrition",
  description = "Nutrition workshops, awareness talks, conferences, hospital and institution visits, community events, and everyday life at our nutrition clinic.",
  stats = [],
}) {
  return (
    <section className="relative overflow-hidden bg-primary">
      <div className="absolute inset-0 bg-gradient-to-b from-primary-darker/80 via-primary/75 to-primary" aria-hidden="true" />
      <div className="absolute -right-24 top-8 h-64 w-64 rounded-full bg-lime/15 blur-3xl" aria-hidden="true" />
      <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-sage/15 blur-3xl" aria-hidden="true" />

      <div className="container-x relative z-10">
        <div className="flex min-h-[360px] flex-col justify-center py-16 sm:min-h-[420px] lg:min-h-[460px] lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.21, 0.65, 0.36, 1] }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-lime backdrop-blur">
              <Camera size={14} aria-hidden="true" />
              The GOLZ Gallery
            </span>

            <h1 className="h1 mt-6 text-[#EEF3EA]">
              {title}
            </h1>

            <p className="lead mt-6 max-w-2xl text-[#DBE6D5]/85">
              {description}
            </p>
          </motion.div>

          {stats.length ? (
            <motion.dl
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.21, 0.65, 0.36, 1] }}
              className="mt-12 grid max-w-3xl grid-cols-2 gap-4 border-t border-white/15 pt-8 sm:grid-cols-4 sm:gap-6"
            >
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block font-heading text-2xl font-semibold text-lime sm:text-3xl">{stat.value}</span>
                    <span className="mt-1 block text-xs leading-snug text-[#A9C0A0] sm:text-sm">{stat.label}</span>
                  </dd>
                </div>
              ))}
            </motion.dl>
          ) : null}
        </div>
      </div>
    </section>
  );
}
