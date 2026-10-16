import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/** Sidebar consultation call-to-action. */
export default function BlogCTA() {
  return (
    <section className="rounded-[24px] bg-primary p-7 shadow-card">
      <h2 className="h3 text-[#EEF3EA]">Ready for a change?</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#B6CCAF]">
        Get a personalised nutrition plan built around your goals, your routine and your body.
      </p>
      <Link to="/contact" className="btn-lime mt-6 w-full !px-4 !py-3.5 !text-base">
        Book a Consultation
        <ArrowRight size={17} aria-hidden="true" />
      </Link>
    </section>
  );
}
