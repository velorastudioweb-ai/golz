import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import LazyImage from "../LazyImage";
import { formatDate } from "../../utils/helpers";
import { coverAt, coverSrcSet } from "../../blogs/blogsApi";

/**
 * Lead article for the listing.
 *
 * A side image beside the text rather than a full-bleed hero: the grid below
 * already provides large imagery, and a second oversized image pushed the
 * articles themselves below the fold on a laptop.
 */
export default function BlogFeatured({ blog }) {
  if (!blog) return null;

  const href = blog.url || `/blogs/${blog.slug}`;
  const date = formatDate(blog.publishedAt || blog.createdAt);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.21, 0.65, 0.36, 1] }}
      className="card group relative mb-10 overflow-hidden border border-ink/5"
    >
      <div className="grid lg:grid-cols-2">
        <div className="relative aspect-[16/11] overflow-hidden bg-sage lg:aspect-auto lg:min-h-[340px]">
          {blog.cover ? (
            <LazyImage
              src={coverAt(blog.cover, 1200)}
              srcSet={coverSrcSet(blog.cover)}
              sizes="(min-width: 1024px) 50vw, 100vw"
              alt={blog.title ? `${blog.title} — article cover` : "Featured article cover"}
              className="h-full w-full"
              imgClassName="transition-transform duration-700 motion-reduce:transform-none group-hover:scale-105"
              loading="eager"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-sage" aria-hidden="true" />
          )}

          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white shadow-soft">
            <Sparkles size={12} aria-hidden="true" />
            {blog.featured ? "Featured" : "Latest"}
          </span>
        </div>

        <div className="flex flex-col justify-center p-7 sm:p-9">
          {blog.category ? (
            <Link
              to={`/blogs?category=${encodeURIComponent(blog.category)}`}
              className="mb-4 w-fit rounded-full bg-sage px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary transition hover:bg-primary hover:text-white"
            >
              {blog.category}
            </Link>
          ) : null}

          <h3 className="h3 leading-tight text-ink">
            <Link to={href} className="transition-colors after:absolute after:inset-0 hover:text-primary focus-visible:outline-none">
              {blog.title}
            </Link>
          </h3>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            {date ? (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} aria-hidden="true" />
                {date}
              </span>
            ) : null}
            {blog.readingTime ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} aria-hidden="true" />
                {blog.readingTime} min read
              </span>
            ) : null}
          </div>

          {blog.excerpt ? (
                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">
              {blog.excerpt}
            </p>
          ) : null}

          <span className="relative z-10 mt-7 inline-flex w-fit items-center gap-2 rounded-lg text-sm font-semibold text-primary">
            Read Article
            <ArrowRight
              size={16}
              className="transition-transform duration-300 motion-reduce:transform-none group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </motion.article>
  );
}