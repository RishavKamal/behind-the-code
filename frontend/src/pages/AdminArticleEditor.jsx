import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createArticle,
  getArticleById,
  updateArticle,
} from "../api/articleApi";

const emptyArticle = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "Java",
  coverImage: "",
  published: false,
  readTimeMinutes: 5,
};

const categories = [
  "Java",
  "DSA",
  "Spring Boot",
  "React",
  "Projects",
  "Debugging",
];

const AdminArticleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditing = Boolean(id);

  const [article, setArticle] = useState(emptyArticle);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const loadArticle = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getArticleById(id);

        setArticle({
          title: data.title || "",
          slug: data.slug || "",
          excerpt: data.excerpt || "",
          content: data.content || "",
          category: data.category || "Java",
          coverImage: data.coverImage || "",
          published: data.published ?? false,
          readTimeMinutes: data.readTimeMinutes || 5,
        });
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
  }, [id, isEditing]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setArticle((currentArticle) => ({
      ...currentArticle,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const generateSlug = () => {
    const slug = article.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    setArticle((currentArticle) => ({
      ...currentArticle,
      slug,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...article,
        readTimeMinutes: Number(article.readTimeMinutes),
      };

      if (isEditing) {
        await updateArticle(id, payload);
      } else {
        await createArticle(payload);
      }

      navigate("/admin");
    } catch (err) {
      console.error("Failed to save article:", err);

      if (err.response?.status === 409) {
        setError(
          "An article with this slug already exists."
        );
      } else {
        setError("Unable to save article.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="admin-page">
        <section className="admin-status">
          <p>Loading article...</p>
        </section>
      </main>
    );
  }

  if (error && isEditing && !article.title) {
    return (
      <main className="admin-page">
        <section className="admin-status admin-error">
          <p>{error}</p>

          <Link
            to="/admin"
            className="admin-secondary-button"
          >
            ← Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-editor-header">
        <div>
          <Link to="/admin" className="back-link">
            ← Back to dashboard
          </Link>

          <p className="eyebrow">
            {isEditing ? "EDIT ARTICLE" : "NEW ARTICLE"}
          </p>

          <h1>
            {isEditing ? "Edit article" : "Write an article"}
            <span className="accent-dot">.</span>
          </h1>
        </div>
      </section>

      <section className="admin-editor">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="admin-form-error">
              {error}
            </div>
          )}

          <div className="admin-form-group">
            <label htmlFor="title">Title</label>

            <input
              id="title"
              name="title"
              type="text"
              value={article.title}
              onChange={handleChange}
              placeholder="Understanding HashMap in Java"
              required
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="slug">Slug</label>

            <div className="slug-input-row">
              <input
                id="slug"
                name="slug"
                type="text"
                value={article.slug}
                onChange={handleChange}
                placeholder="understanding-hashmap-in-java"
                required
              />

              <button
                type="button"
                className="admin-secondary-button"
                onClick={generateSlug}
              >
                Generate
              </button>
            </div>

            <small>
              The slug becomes part of the article URL.
            </small>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label htmlFor="category">Category</label>

              <select
                id="category"
                name="category"
                value={article.category}
                onChange={handleChange}
                required
              >
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label htmlFor="readTimeMinutes">
                Read time
              </label>

              <input
                id="readTimeMinutes"
                name="readTimeMinutes"
                type="number"
                min="1"
                value={article.readTimeMinutes}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label htmlFor="excerpt">Excerpt</label>

            <textarea
              id="excerpt"
              name="excerpt"
              value={article.excerpt}
              onChange={handleChange}
              placeholder="A short description of the article..."
              rows="3"
              required
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="content">Content</label>

            <textarea
              id="content"
              name="content"
              value={article.content}
              onChange={handleChange}
              placeholder="Write your article here..."
              rows="18"
              required
            />

            <small>
              Markdown support will be added next.
            </small>
          </div>

          <div className="admin-form-group">
            <label htmlFor="coverImage">
              Cover image URL
            </label>

            <input
              id="coverImage"
              name="coverImage"
              type="url"
              value={article.coverImage}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <label className="admin-publish-toggle">
            <input
              name="published"
              type="checkbox"
              checked={article.published}
              onChange={handleChange}
            />

            <span>
              Publish this article
            </span>
          </label>

          <div className="admin-editor-actions">
            <Link
              to="/admin"
              className="admin-secondary-button"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : isEditing
                ? "Save changes"
                : "Create article"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default AdminArticleEditor;