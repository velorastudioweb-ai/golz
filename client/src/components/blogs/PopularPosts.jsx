import { Link } from "react-router-dom";
import { TrendingUp, CalendarDays } from "lucide-react";
import LazyImage from "../LazyImage";
import { formatDate } from "../../utils/helpers";
import { coverAt, coverSrcSet } from "../../blogs/blogsApi";

/**
 * Sidebar article list.
 *
 * The heading reflects what the data can actually support: "Most read" only
 * appears when the database records view counts, otherwise the widget is
 * labelled with the ordering it really uses. Inventing a popularity ranking
 * from an arbitrary sort would be dishonest.
 */
export default function PopularPosts({ posts = [], tracked = false }) {
  const items = posts.slice(0, 4);
  const heading = tracked ? "Most Read" : "Latest Articles";
  const Icon = tracked ? TrendingUp : CalendarDays;

  return (
    <section className="card p-6" aria-labelledby="popular-posts-heading">
      <h2 id="popular-posts-heading" className="h3 flex items-center gap-2 text-ink">
        <Icon size={18} className="text-primary" aria-hidden="true" />
        {heading}
      </h2>

      {items.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          No articles to show yet. New insights are on the way.
        </p>
      ) : (
        <ul className="mt-5 space-y-5">
          {items.map((blog) => (
            <li key={blog.id || blog._id || blog.slug}>
              <Link to={blog.url || `/blogs/${blog.slug}`} className="group flex gap-3.5">
                <span className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-sage">
                  {blog.cover ? (
                    <LazyImage
                      src={coverAt(blog.cover, 480)}
                      srcSet={coverSrcSet(blog.cover)}
                      sizes="80px"
                      alt=""
                      className="h-full w-full"
                      imgClassName="transition-transform duration-500 motion-reduce:transform-none group-hover:scale-105"
                    />
                  ) : null}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-sm font-medium leading-snug text-ink transition-colors group-hover:text-primary">
                    {blog.title}
                  </span>
                  <span className="mt-1.5 block text-xs text-muted">
                    {formatDate(blog.publishedAt || blog.createdAt)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}