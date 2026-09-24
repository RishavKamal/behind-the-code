import { Link, useParams } from "react-router-dom";
import articles from "../data/articles";

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const Article = () => {
  const { slug } = useParams();

  const article = articles.find(
    (item) => item.slug === slug
  );

  if (!article) {
    return (
      <main className="article-page">
        <section className="article-not-found">
          <p className="eyebrow">404</p>

          <h1>
            Article not found
            <span className="accent-dot">.</span>
          </h1>

          <p>
            The article you're looking for doesn't exist.
          </p>

          <Link to="/articles" className="back-link">
            ← Back to articles
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="article-page">
      <article>
        <header className="article-header">
          <Link to="/articles" className="back-link">
            ← All articles
          </Link>

          <div className="article-category">
            {article.category}
          </div>

          <h1>{article.title}</h1>

          <p className="article-excerpt">
            {article.excerpt}
          </p>

          <div className="article-meta">
            <span>
              {formatDate(article.publishedAt)}
            </span>

            <span className="meta-dot">•</span>

            <span>
              {article.readTimeMinutes} min read
            </span>
          </div>
        </header>

        <div className="article-body">
          {article.content.map((block, index) => {
            if (block.type === "heading") {
              return (
                <h2 key={index}>
                  {block.text}
                </h2>
              );
            }

            if (block.type === "code") {
              return (
                <div
                  className="article-code-wrapper"
                  key={index}
                >
                  <div className="code-header">
                    <span>
                      {block.language || "code"}
                    </span>
                  </div>

                  <pre className="article-code">
                    <code>{block.code}</code>
                  </pre>
                </div>
              );
            }

            return (
              <p key={index}>
                {block.text}
              </p>
            );
          })}
        </div>

        <footer className="article-footer">
          <Link
            to="/articles"
            className="back-link"
          >
            ← Back to all articles
          </Link>
        </footer>
      </article>
    </main>
  );
};

export default Article;