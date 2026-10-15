import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, animate, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Reveal from "./Reveal";
import Counter from "./Counter";
import TestimonialCard from "./TestimonialCard";

const GAP = 32;
const AUTOPLAY_MS = 6000;

const TRUST_STATS = [
  { value: 8, suffix: "k+", label: "Happy Clients", decimals: 0 },
  { value: 4.8, suffix: "/5", label: "Average Rating", decimals: 1 },
  { value: 95, suffix: "%", label: "Goal Achievement", decimals: 0 },
];

function usePerPage() {
  const [perPage, setPerPage] = useState(() => {
    if (typeof window === "undefined") return 3;
    if (window.matchMedia("(min-width: 1024px)").matches) return 3;
    if (window.matchMedia("(min-width: 640px)").matches) return 2;
    return 1;
  });

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const tablet = window.matchMedia("(min-width: 640px)");
    const update = () => setPerPage(desktop.matches ? 3 : tablet.matches ? 2 : 1);
    update();
    desktop.addEventListener("change", update);
    tablet.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
    };
  }, []);

  return perPage;
}

function TiltCard({ children }) {
  const ref = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 220, damping: 22, mass: 0.6 });
  const sry = useSpring(ry, { stiffness: 220, damping: 22, mass: 0.6 });
  const reduced = useReducedMotion();
  const [canTilt, setCanTilt] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanTilt(mq.matches);
    const onChange = (e) => setCanTilt(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const onMove = (e) => {
    if (!canTilt || reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 5);
    rx.set(-py * 5);
  };

  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
      className="h-full will-change-transform"
    >
      {children}
    </motion.div>
  );
}

function TestimonialsSection({ items = [] }) {
  const list = useMemo(() => items.filter((t) => t.published !== false), [items]);
  const T = list.length;
  const perPage = usePerPage();
  const reduced = useReducedMotion();
  const carousel = T > perPage;

  const track = useMemo(() => [...list, ...list, ...list], [list]);
  const maxPos = 3 * T - perPage;

  const viewportRef = useRef(null);
  const x = useMotionValue(0);
  const [width, setWidth] = useState(0);
  const [pos, setPos] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [visible, setVisible] = useState(true);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [carousel]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [carousel]);

  const step = width > 0 ? (width - (perPage - 1) * GAP) / perPage + GAP : 0;

  const goTo = useCallback(
    (target, instant = false) => {
      if (step <= 0) return;
      const clamped = Math.max(0, Math.min(target, maxPos));
      const targetX = -clamped * step;
      if (instant || reduced) {
        x.set(targetX);
      } else {
        animate(x, targetX, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
      }
      setPos(clamped);
    },
    [x, step, maxPos, reduced]
  );

  const next = useCallback(() => {
    if (step <= 0) return;
    const t = pos + 1;
    goTo(t > maxPos ? t - T : t);
  }, [goTo, pos, maxPos, T, step]);

  const prev = useCallback(() => {
    if (step <= 0) return;
    if (pos === 0) {
      x.set(-(2 * T) * step);
      goTo(2 * T - 1);
    } else {
      goTo(pos - 1);
    }
  }, [goTo, pos, T, x, step]);

  useEffect(() => {
    if (!carousel || paused || dragging || !visible || reduced || step <= 0) return;
    const id = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [carousel, paused, dragging, visible, reduced, step, next]);

  useEffect(() => {
    if (step > 0) x.set(-Math.min(pos, maxPos) * step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, perPage]);

  const handleDragEnd = useCallback(
    (_, info) => {
      setDragging(false);
      if (info.offset.x < -60 || info.velocity.x < -500) next();
      else if (info.offset.x > 60 || info.velocity.x > 500) prev();
      else goTo(pos);
    },
    [next, prev, goTo, pos]
  );

  if (T === 0) return null;

  const arrowBase =
    "flex items-center justify-center rounded-full border border-[#D4AF37]/40 bg-white/[0.06] text-[#F0C75E] backdrop-blur-xl transition-all duration-300 active:scale-95 sm:hover:scale-105 sm:hover:bg-[#D4AF37]/20 sm:hover:text-white";

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-[#0B3D2E] via-[#14532D] to-[#1B4332] py-[60px] md:py-[100px] lg:py-[120px]"
      aria-roledescription="carousel"
      aria-label="Client success stories"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 12% 12%, rgba(212,175,55,0.10) 0%, transparent 42%), radial-gradient(circle at 90% 20%, rgba(255,255,255,0.05) 0%, transparent 38%), radial-gradient(circle at 50% 100%, rgba(22,163,74,0.12) 0%, transparent 45%)",
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-[24rem] w-[24rem] rounded-full bg-[#D4AF37]/[0.07] blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-28 top-24 h-80 w-80 rounded-full bg-[#16A34A]/[0.08] blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full border border-white/[0.06]" aria-hidden="true" />

      <div className="container-x relative z-10">
        <Reveal className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
          <span className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#F0C75E]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" aria-hidden="true" /> Success Stories
          </span>
          <h2 className="h2 text-white">
            Real Transformations.{" "}
            <span className="bg-gradient-to-r from-[#E6C05A] to-[#D4AF37] bg-clip-text text-transparent">Real Results.</span>
          </h2>
          <p className="lead mx-auto mt-6 max-w-[640px] text-white/70">
            Read inspiring journeys from our clients who transformed their health with personalized nutrition care.
          </p>
        </Reveal>

        <div className="mx-auto mb-10 grid max-w-3xl grid-cols-1 gap-4 sm:mb-14 sm:grid-cols-3">
          {TRUST_STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-5 text-center backdrop-blur transition-all duration-300 sm:hover:-translate-y-1 sm:hover:border-[#D4AF37]/30">
                <p className="font-heading stat-value font-bold text-[#D4AF37]">
                  <Counter value={s.value} suffix={s.suffix} decimals={s.decimals} />
                </p>
                <p className="mt-1 text-sm font-medium text-white/70">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {carousel ? (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
              if (e.key === "ArrowRight") { e.preventDefault(); next(); }
            }}
          >
            <div className="pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2">
              <div className="absolute left-[8%] top-0 h-56 w-56 -translate-y-1/2 rounded-full bg-[#D4AF37]/[0.08] blur-3xl" aria-hidden="true" />
              <div className="absolute right-[6%] bottom-0 h-64 w-64 translate-y-1/2 rounded-full bg-[#16A34A]/[0.1] blur-3xl" aria-hidden="true" />
            </div>

            <div
              ref={viewportRef}
              className="relative overflow-hidden py-4 -my-4 sm:py-8 sm:-my-8"
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
            >
              {width > 0 && (
                <motion.div
                  className="flex cursor-grab active:cursor-grabbing"
                  style={{ x, touchAction: "pan-y" }}
                  drag="x"
                  dragConstraints={{ left: -(maxPos * step + 160), right: 160 }}
                  dragElastic={0.1}
                  dragMomentum={false}
                  onDragStart={() => setDragging(true)}
                  onDragEnd={handleDragEnd}
                >
                  {track.map((t, i) => (
                    <div
                      key={i}
                      className="h-auto shrink-0"
                      style={{ width: step, paddingRight: i === track.length - 1 ? 0 : GAP }}
                    >
                      <TiltCard>
                        <TestimonialCard item={t} />
                      </TiltCard>
                    </div>
                  ))}
                </motion.div>
              )}

              <button onClick={prev} aria-label="Previous testimonials" className={`${arrowBase} absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 p-3 sm:flex`}>
                <ChevronLeft size={22} />
              </button>
              <button onClick={next} aria-label="Next testimonials" className={`${arrowBase} absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 p-3 sm:flex`}>
                <ChevronRight size={22} />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-wrap items-stretch justify-center gap-8">
            {list.map((t) => (
              <div key={t._id} className="w-full sm:w-[calc(50%-16px)] lg:w-[380px]">
                <TiltCard>
                  <TestimonialCard item={t} />
                </TiltCard>
              </div>
            ))}
          </div>
        )}

        {carousel && (
          <div className="mt-6 flex items-center justify-center gap-3 sm:mt-8 sm:gap-5">
            <button onClick={prev} aria-label="Previous testimonials" className={`${arrowBase} h-9 w-9 sm:hidden`}>
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2" role="tablist" aria-label="Testimonial slides">
              {list.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === pos % T}
                  aria-label={`Go to testimonial ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#D4AF37]/40 ${
                    i === pos % T ? "w-8 bg-[#D4AF37]" : "w-2.5 bg-white/25 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
            <button onClick={next} aria-label="Next testimonials" className={`${arrowBase} h-9 w-9 sm:hidden`}>
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(TestimonialsSection);
