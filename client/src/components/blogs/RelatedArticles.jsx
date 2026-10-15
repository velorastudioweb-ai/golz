import BlogCard from "./BlogCard";

/** Three related articles, rendered on the sage section below the article body. */
export default function RelatedArticles({ posts = [] }) {
  const items = posts.slice(0, 3);
  if (items.length === 0) return null;

  return (
    <section className="bg-section-sage section-pad" aria-labelledby="related-articles-heading">
      <div className="container-x">
        <h2 id="related-articles-heading" className="h2 text-center text-ink">
          Related Articles
        </h2>

        <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((blog) => (
            <BlogCard key={blog.id || blog._id || blog.slug} blog={blog} />
          ))}
        </div>
      </div>
    </section>
  );
}
