import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function PageHero({ title, subtitle, breadcrumb, image }) {
  return (
    <section className="relative overflow-hidden bg-primary pb-16 pt-[104px] sm:pb-20 lg:pt-[116px]">
      {image && (
        <div className="absolute inset-0">
          <img src={image} alt="" className="h-full w-full object-cover opacity-20" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/70 via-primary/60 to-primary" />
        </div>
      )}
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-sage/15 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-lime/15 blur-3xl" />
      <div className="container-x relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          {breadcrumb && (
            <nav className="mb-4 flex items-center gap-1.5 text-sm text-[#DBE6D5]/70" aria-label="Breadcrumb">
              <Link to="/" className="transition hover:text-lime">Home</Link>
              {breadcrumb.map((b) => (
                <span key={b} className="flex items-center gap-1.5">
                  <ChevronRight size={14} />
                  <span className="text-[#EEF3EA]/90">{b}</span>
                </span>
              ))}
            </nav>
          )}
          <h1 className="h1 text-[#EEF3EA]">{title}</h1>
          {subtitle && <p className="lead mt-5 max-w-xl text-[#DBE6D5]/80">{subtitle}</p>}
        </motion.div>
      </div>
    </section>
  );
}
