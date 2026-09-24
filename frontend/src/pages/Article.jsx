import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getArticleBySlug } from "../api/articleApi";

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const Article = () => {
  const { slug } = useParams();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getArticleBySlug(slug);

        setArticle(data);
      } catch (err) {
        console.error("Failed to load article:", err);

        if (err.response?.status === 404) {
          setError("Article not found.");
        } else {
          setError("Unable to load article.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug]);

  if (loading) {
    return (
      <main className="article-page">
        <section className="article-not-found">
          <p>Loading article...</p>
        </section>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="article-page">
        <section className="article-not-found">
          <p className="eyebrow">404</p>

          <h1>
            Article not found<span className="accent-dot">.</span>
          </h1>

          <p>
            {error || "The article you're looking for doesn't exist."}
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
              {formatDate(
                article.publishedAt || article.createdAt
              )}
            </span>

            <span className="meta-dot">•</span>

            <span>
              {article.readTimeMinutes
                ? `${article.readTimeMinutes} min read`
                : "Article"}
            </span>
          </div>
        </header>

        <div className="article-body">
          <p>{article.content}</p>
        </div>

        <footer className="article-footer">
          <Link to="/articles" className="back-link">
            ← Back to all articles
          </Link>
        </footer>
      </article>
    </main>
  );
};

export default Article;