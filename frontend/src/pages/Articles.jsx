import { useState } from "react";
import { Link } from "react-router-dom";
import articles from "../data/articles";

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
  const [selectedCategory, setSelectedCategory] = useState("All");

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
                    {formatDate(article.publishedAt)}
                  </span>

                  <span>•</span>

                  <span>
                    {article.readTimeMinutes} min read
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
      </section>
    </main>
  );
};

export default Articles;