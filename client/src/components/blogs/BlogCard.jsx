import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import LazyImage from "../LazyImage";
import { formatDate, stripHtml, truncate } from "../../utils/helpers";
import { coverAt, coverSrcSet } from "../../blogs/blogsApi";

/**
 * Article card: cover image, category badge, date, reading time and excerpt.
 *
 * The whole card is one link target, but only the title and the "Read Article"
 * label are interactive, so keyboard users get two clear stops instead of a
 * duplicated control.
 */
export default function BlogCard({ blog, eager = false }) {
  if (!blog) return null;

  const title = blog.title?.trim();
  const href = blog.url || `/blogs/${blog.slug}`;
  const date = formatDate(blog.publishedAt || blog.createdAt);
  const summary = blog.excerpt?.trim() || stripHtml(blog.content || "");
  const excerpt = truncate(summary, 110);

  return (
    <article className="card group relative flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden bg-sage">
        {blog.cover ? (
          <LazyImage
            src={coverAt(blog.cover, 800)}
            srcSet={coverSrcSet(blog.cover)}
            sizes="(min-width: 1280px) 300px, (min-width: 768px) 45vw, 100vw"
            alt={title ? `${title} — article cover` : "Article cover image"}
            className="h-full w-full"
            imgClassName="transition-transform duration-700 motion-reduce:transform-none group-hover:scale-105"
            loading={eager ? "eager" : "lazy"}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-sage" aria-hidden="true" />
        )}

        {blog.category ? (
          <span className="absolute left-4 top-4 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white shadow-soft">
            {blog.category}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
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

        {title ? (
          <h3 className="card-title leading-snug text-ink transition-colors group-hover:text-primary">
            <Link
              to={href}
              className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
              aria-label={title ? `Read article: ${title}` : "Read article"}
            >
              {title}
            </Link>
          </h3>
        ) : null}

        {excerpt ? <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted">{excerpt}</p> : <span className="flex-1" />}

        <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg text-sm font-semibold text-primary">
          Read Article
          <ArrowRight
            size={16}
            className="transition-transform duration-300 motion-reduce:transform-none group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </article>
  );
}