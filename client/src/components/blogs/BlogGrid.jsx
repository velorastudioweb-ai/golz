import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import BlogCard from "./BlogCard";

/**
 * Article grid: three across on desktop, two on tablet, one on mobile.
 *
 * There is no loading and no error state. The page renders bundled articles on
 * its first frame and a failed CMS call simply keeps that list, so the grid can
 * only ever be in one of two honest states: there are articles, or there are
 * none to show.
 */
export default function BlogGrid({ posts = [], hasFilters = false }) {
  if (posts.length === 0) {
    if (hasFilters) {
      return (
        <div className="rounded-[24px] border border-line bg-white px-6 py-16 text-center">
          <SearchX size={30} className="mx-auto text-primary" aria-hidden="true" />
          <h3 className="card-title mt-4 text-ink">No articles match that search</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Try a different keyword, or browse every category to see the full library.
          </p>
          <Link to="/blogs" className="btn-outline mt-7 !py-3.5 !text-base">
            View all articles
          </Link>
        </div>
      );
    }

    return (
      <div className="rounded-[24px] border border-line bg-white px-6 py-16 text-center">
        <h3 className="h3 text-ink">New Insights Coming Soon</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          We’re preparing practical nutrition, wellness and healthy lifestyle articles from GOLZ. Check back soon.
        </p>
        <Link to="/contact" className="btn-primary mt-8 !py-3.5 !text-base">
          Book a Consultation
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((blog, index) => (
        <BlogCard key={blog.id || blog._id || blog.slug} blog={blog} eager={index < 3} />
      ))}
    </div>
  );
}
