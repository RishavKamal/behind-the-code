import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getArticles, deleteArticle } from "../api/articleApi";

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const Admin = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getArticles();

      setArticles(data);
    } catch (err) {
      console.error("Failed to load admin articles:", err);
      setError("Unable to load articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleDelete = async (id, title) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      await deleteArticle(id);

      setArticles((currentArticles) =>
        currentArticles.filter((article) => article.id !== id)
      );
    } catch (err) {
      console.error("Failed to delete article:", err);
      window.alert("Unable to delete article.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="eyebrow">ADMIN</p>

          <h1>
            Dashboard<span className="accent-dot">.</span>
          </h1>

          <p>
            Manage your articles and publish new content.
          </p>
        </div>

        <Link
          to="/admin/articles/new"
          className="admin-primary-button"
        >
          + New Article
        </Link>
      </section>

      <section className="admin-content">
        <div className="admin-section-header">
          <div>
            <p className="eyebrow">ARTICLES</p>

            <h2>Published content</h2>
          </div>

          {!loading && !error && (
            <span className="admin-count">
              {articles.length}{" "}
              {articles.length === 1 ? "article" : "articles"}
            </span>
          )}
        </div>

        {loading && (
          <div className="admin-status">
            <p>Loading articles...</p>
          </div>
        )}

        {!loading && error && (
          <div className="admin-status admin-error">
            <p>{error}</p>

            <button
              type="button"
              onClick={loadArticles}
              className="admin-secondary-button"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="admin-empty-state">
            <h2>No articles yet.</h2>

            <p>
              Create your first article to start building
              Behind the Code.
            </p>

            <Link
              to="/admin/articles/new"
              className="admin-primary-button"
            >
              Create Article
            </Link>
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="admin-article-list">
            {articles.map((article) => (
              <article
                key={article.id}
                className="admin-article-card"
              >
                <div className="admin-article-info">
                  <div className="admin-article-top">
                    <span className="article-category">
                      {article.category}
                    </span>

                    <span
                      className={
                        article.published
                          ? "admin-status-badge published"
                          : "admin-status-badge draft"
                      }
                    >
                      {article.published
                        ? "Published"
                        : "Draft"}
                    </span>
                  </div>

                  <h2>{article.title}</h2>

                  <p>{article.excerpt}</p>

                  <div className="article-meta">
                    <span>
                      {formatDate(
                        article.publishedAt ||
                          article.createdAt
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

                <div className="admin-article-actions">
                  <Link
                    to={`/admin/articles/${article.id}/edit`}
                    className="admin-secondary-button"
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() =>
                      handleDelete(article.id, article.title)
                    }
                    disabled={deletingId === article.id}
                  >
                    {deletingId === article.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Admin;