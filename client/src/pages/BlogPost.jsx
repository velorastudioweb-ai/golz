import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Tag } from "lucide-react";
import SEO from "../components/SEO";
import LazyImage from "../components/LazyImage";
import BlogArticleContent from "../components/blogs/BlogArticleContent";
import ShareArticle from "../components/blogs/ShareArticle";
import AuthorCard from "../components/blogs/AuthorCard";
import RelatedArticles from "../components/blogs/RelatedArticles";
import { fetchBlogBySlug, fetchRelated, localPost, localRelated, coverAt, coverSrcSet } from "../blogs/blogsApi";
import { stripHtml } from "../utils/helpers";

/**
 * Single article.
 *
 * The bundled snapshot resolves the slug synchronously, so an article is
 * readable on the first frame and there is no loading or retry state. A CMS
 * refresh still runs in the background and swaps in the newest copy when it
 * answers, but the page never waits for it.
 *
 * Only two states remain: the article, or a real 404. A slug that the snapshot
 * does not hold renders the 404 immediately rather than spinning on a request
 * that may never arrive; if the CMS does know the article it replaces the 404
 * in place as soon as it responds.
 */
export default function BlogPost() {
  const { slug } = useParams();
  const [status, setStatus] = useState(() => (localPost(slug) ? "ready" : "missing")); // ready | missing
  const [blog, setBlog] = useState(() => localPost(slug));
  const [related, setRelated] = useState(() => localRelated(slug));

  useEffect(() => {
    let active = true;
    const bundled = localPost(slug);
    setBlog(bundled);
    setRelated(localRelated(slug));
    setStatus(bundled ? "ready" : "missing");
    window.scrollTo({ top: 0 });

    fetchBlogBySlug(slug).then((result) => {
      if (!active || !result.post) return;
      setBlog(result.post);
      setStatus("ready");

      fetchRelated(slug).then((items) => {
        if (active) setRelated(items);
      });
    });

    return () => {
      active = false;
    };
  }, [slug]);

  if (status === "missing" || !blog) {
    return (
      <>
        <SEO
          fullTitle="Article not found | GOLZ"
          description="The article you are looking for may have been moved or removed."
          noindex
        />
        <div className="container-x py-32 text-center sm:py-40">
          <p className="text-sm font-semibold uppercase tracking-wider text-limeDark">404</p>
          <h1 className="h2 mt-3 text-ink">Article not found</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            The article you are looking for may have been moved or removed.
          </p>
          <Link to="/blogs" className="btn-primary mt-8 !py-3.5 !text-base">
            <ArrowLeft size={17} aria-hidden="true" />
            Back to Blogs
          </Link>
        </div>
      </>
    );
  }

  const url = typeof window !== "undefined" ? window.location.href : "";
  const description = (blog.excerpt || stripHtml(blog.content).slice(0, 160)).trim();
  const shareImage = blog.cover ? coverAt(blog.cover, 1200) : "";
  const published = blog.publishedAt || blog.createdAt || null;
  const modified = blog.updatedAt || published;

  return (
    <>
      <SEO
        title={blog.title}
        description={description}
        image={shareImage}
        keywords={blog.tags.join(", ")}
        canonical={url}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: blog.title,
          description,
          ...(shareImage ? { image: shareImage } : {}),
          datePublished: published,
          dateModified: modified,
          ...(blog.author ? { author: { "@type": "Person", name: blog.author } } : {}),
          ...(blog.category ? { articleSection: blog.category } : {}),
          ...(blog.tags.length ? { keywords: blog.tags.join(", ") } : {}),
          publisher: { "@type": "Organization", name: "GOLZ (Giggles of Livez)" },
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
        }}
      />

      <article>
        <header className="relative overflow-hidden bg-primary pb-14 pt-[104px] sm:pb-16 lg:pt-[120px]">
          <div className="absolute -right-20 -top-10 h-72 w-72 rounded-full bg-lime/10 blur-3xl" aria-hidden="true" />
          <div className="container-x relative z-10">
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 text-sm text-[#DBE6D5]/80 transition hover:text-lime"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              All articles
            </Link>

            <div className="mt-6 max-w-3xl">
              {blog.category ? (
                <Link
                  to={`/blogs?category=${encodeURIComponent(blog.category)}`}
                  className="mb-5 inline-block rounded-full bg-lime px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink transition hover:bg-white"
                >
                  {blog.category}
                </Link>
              ) : null}

              <h1 className="h1 text-[#EEF3EA]">
                {blog.title}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#DBE6D5]/80">
                {blog.author ? <span>{blog.author}</span> : null}
                {blog.author && published ? <span aria-hidden="true">·</span> : null}
                {published ? (
                  <time dateTime={published}>{new Date(published).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</time>
                ) : null}
                {blog.readingTime ? <span>{blog.readingTime} min read</span> : null}
              </div>
            </div>
          </div>
        </header>

        <section className="section-pad">
          <div className="container-x">
            <div className="mx-auto max-w-3xl">
              {shareImage ? (
                <LazyImage
                  src={shareImage}
                  srcSet={coverSrcSet(blog.cover)}
                  sizes="(min-width: 768px) 768px, 100vw"
                  alt={blog.title ? `${blog.title} — featured image` : "Article featured image"}
                  className="mb-12 aspect-video w-full rounded-[24px] shadow-lift"
                  loading="eager"
                />
              ) : null}

              <BlogArticleContent content={blog.content} />

              {blog.tags.length ? (
                <div className="mt-12 flex flex-wrap items-center gap-2.5">
                  <Tag size={17} className="text-primary" aria-hidden="true" />
                  {blog.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/blogs?search=${encodeURIComponent(tag)}`}
                      className="chip text-sm"
                      aria-label={`Search articles for ${tag}`}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              ) : null}

              <ShareArticle url={url} title={blog.title} />
              <AuthorCard author={blog.author} />

              <div className="mt-14 rounded-[24px] bg-primary p-8 text-center shadow-card sm:p-10">
                <h2 className="h3 text-[#EEF3EA]">
                  Want a plan built around you?
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#B6CCAF] sm:text-base">
                  Book a consultation and turn these ideas into a routine that fits your goals, your schedule and your
                  body.
                </p>
                <Link to="/contact" className="btn-lime mt-7 !px-7 !py-4 !text-base">
                  Book a Consultation
                </Link>
              </div>
            </div>
          </div>
        </section>
      </article>

      <RelatedArticles posts={related} />
    </>
  );
}