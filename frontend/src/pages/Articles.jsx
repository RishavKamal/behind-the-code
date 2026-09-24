import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getArticles } from "../api/articleApi";

const categories = [
  "All",
  "Java",
  "DSA",
  "Spring Boot",
  "React",
  "Projects",
  "Debugging",
];

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getArticles();

        setArticles(data);
      } catch (err) {
        console.error("Failed to load articles:", err);
        setError("Unable to load articles.");
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  const filteredArticles =
    selectedCategory === "All"
      ? articles
      : articles.filter(
          (article) => article.category === selectedCategory
        );

  return (
    <main className="articles-page">
      <section className="articles-header">
        <p className="eyebrow">THE ARCHIVE</p>

        <h1>
          Articles<span className="accent-dot">.</span>
        </h1>

        <p className="articles-intro">
          Notes, lessons, experiments, and things I learn while building.
        </p>
      </section>

      <section className="articles-content">
        <div className="category-filter">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={
                selectedCategory === category
                  ? "category-button active"
                  : "category-button"
              }
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {loading && (
          <div className="articles-status">
            <p>Loading articles...</p>
          </div>
        )}

        {!loading && error && (
          <div className="articles-status">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filteredArticles.length === 0 && (
          <div className="articles-status">
            <p>No articles found.</p>
          </div>
        )}

        {!loading && !error && filteredArticles.length > 0 && (
          <div className="articles-list">
            {filteredArticles.map((article) => (
              <article
                className="article-list-card"
                key={article.id}
              >
                <div className="article-list-main">
                  <span className="article-category">
                    {article.category}
                  </span>

                  <h2>{article.title}</h2>

                  <p>{article.excerpt}</p>

                  <div className="article-meta">
                    <span>
                      {formatDate(
                        article.publishedAt || article.createdAt
                      )}
                    </span>

                    <span>•</span>

                    <span>
                      {article.readTimeMinutes
                        ? `${article.readTimeMinutes} min read`
                        : "Article"}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/articles/${article.slug}`}
                  className="article-arrow"
                  aria-label={`Read ${article.title}`}
                >
                  →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Articles;