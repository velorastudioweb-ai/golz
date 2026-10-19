import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, CalendarCheck, Leaf } from "lucide-react";
import { useSite } from "../context/SiteContext";

const NAV = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Services", to: "/services" },
  { label: "Gallery", to: "/gallery" },
  { label: "Blogs", to: "/blogs" },
];

export default function Header() {
  const { site } = useSite();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  /* The supplied GOLZ badge ships with the bundle; the drawn mark stands in
     only if the image ever fails to load. */
  const [logoOk, setLogoOk] = useState(true);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const name = site.general?.clinicName || "GOLZ (Giggles of Livez)";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b border-ink/10 bg-[rgba(247,248,245,0.86)] backdrop-blur-[10px] transition-shadow duration-300 ${
          scrolled ? "shadow-soft" : ""
        }`}
      >
        <div className="container-x flex h-[72px] items-center justify-between gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Home">
            {logoOk ? (
              <img
                src="/logo.png"
                alt={name}
                onError={() => setLogoOk(false)}
                className="h-12 w-auto shrink-0 object-contain"
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary text-white shadow-soft">
                <Leaf size={22} />
              </span>
            )}
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-heading text-lg font-semibold text-ink">{name}</span>
              <span className="hidden text-[11px] tracking-wide text-muted sm:block">{site.general?.tagline || "Nutrition and Diet Solutions, Mysuru"}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 font-body font-medium transition ${
                    isActive ? "bg-primary/10 text-primary" : "text-ink/75 hover:bg-primary/5 hover:text-primary"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <Link to="/contact" className="btn-primary hidden !px-5 !py-2.5 md:inline-flex">
              <CalendarCheck size={17} /> Book a Consultation
            </Link>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className={`rounded-xl p-2.5 transition lg:hidden ${open ? "bg-primary/10 text-primary" : "text-ink hover:bg-primary/5"}`}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-x-0 top-[72px] bottom-0 z-40 overflow-y-auto border-t border-ink/10 bg-paper shadow-soft lg:hidden"
            aria-label="Mobile navigation"
          >
            <div className="container-x flex h-full flex-col gap-1 py-6">
              {NAV.map((item, i) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.3 }}
                >
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `block rounded-2xl px-5 py-4 font-heading text-lg font-semibold transition ${isActive ? "bg-primary text-white shadow-card" : "text-ink/80 hover:bg-primary/5 hover:text-primary"}`
                    }
                  >
                    {item.label}
                  </NavLink>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="mt-auto pt-6"
              >
                <Link to="/contact" className="btn-primary w-full">
                  <CalendarCheck size={18} /> Book a Consultation
                </Link>
                <p className="mt-4 text-center text-xs text-muted">{site.general?.phone || "+91 934-267-4406"}</p>
              </motion.div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
