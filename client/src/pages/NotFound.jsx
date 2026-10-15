import { Link } from "react-router-dom";
import { Search, Home } from "lucide-react";
import SEO from "../components/SEO";

export default function NotFound() {
  return (
    <>
      <SEO title="Page Not Found" description="The page you're looking for doesn't exist." noindex />
      <section className="flex min-h-screen items-center justify-center bg-hero-pattern px-4 pt-24">
        <div className="text-center">
          <p className="font-heading text-8xl font-bold text-primary/20 sm:text-9xl">404</p>
          <h1 className="h2 mt-2 text-charcoal">Oops! Page not found</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-charcoal/60">
            The page you're looking for may have been moved or doesn't exist. Let's get you back on track.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/" className="btn-primary"><Home size={17} /> Back Home</Link>
            <Link to="/services" className="btn-outline"><Search size={17} /> Explore Services</Link>
          </div>
        </div>
      </section>
    </>
  );
}
