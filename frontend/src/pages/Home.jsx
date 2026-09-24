import { Link } from "react-router-dom";
import articles from "../data/articles";

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const featuredArticle = articles.find(
  (article) => article.slug === "building-my-developer-portfolio"
);

const latestArticles = [
  articles.find(
    (article) => article.slug === "understanding-hashmap-in-java"
  ),
  articles.find(
    (article) => article.slug === "my-first-rest-api-with-spring-boot"
  ),
  articles.find(
    (article) => article.slug === "how-i-approach-a-leetcode-problem"
  ),
  articles.find(
    (article) =>
      article.slug === "what-i-learned-building-my-first-react-project"
  ),
];

const topics = [
  "Java",
  "DSA",
  "Spring Boot",
  "React",
  "Projects",
  "Debugging",
];

const Home = () => {
  return (
    <div className="home">
      {/* =========================================
          HERO
      ========================================= */}

      <section className="hero">
        <div className="hero-content">
          <img
            src="/favicon.svg"
            alt="Behind the Code"
            className="hero-logo"
          />

          <p className="eyebrow">A DEVELOPER JOURNAL</p>

          <h1>
            Behind the
            <br />
            Code<span className="accent-dot">.</span>
          </h1>

          <p className="hero-description">
            Notes, lessons, projects, and ideas from
            behind the code.
          </p>
        </div>
      </section>

      {/* =========================================
          FEATURED
      ========================================= */}

      <section className="blog-section">
        <div className="section-heading">
          <div>
            <p className="section-label">FEATURED</p>
            <h2>Start here</h2>
          </div>

          <Link to="/articles" className="view-all">
            View all articles →
          </Link>
        </div>

        {featuredArticle && (
          <article className="featured-card">
            <div className="featured-content">
              <span className="article-category">
                {featuredArticle.category}
              </span>

              <h3>{featuredArticle.title}</h3>

              <p>{featuredArticle.excerpt}</p>

              <div className="article-meta">
                <span>
                  {formatDate(featuredArticle.publishedAt)}
                </span>

                <span>•</span>

                <span>
                  {featuredArticle.readTimeMinutes} min read
                </span>
              </div>

              <Link
                to={`/articles/${featuredArticle.slug}`}
                className="read-link"
              >
                Read article
                <span>→</span>
              </Link>
            </div>
          </article>
        )}
      </section>

      {/* =========================================
          LATEST ARTICLES
      ========================================= */}

      <section className="blog-section">
        <div className="section-heading">
          <div>
            <p className="section-label">LATEST ARTICLES</p>
            <h2>From behind the code</h2>
          </div>
        </div>

        <div className="articles-grid">
          {latestArticles
            .filter(Boolean)
            .map((article) => (
              <article className="article-card" key={article.id}>
                <span className="article-category">
                  {article.category}
                </span>

                <h3>{article.title}</h3>

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

                <Link
                  to={`/articles/${article.slug}`}
                  className="read-link"
                >
                  Read article
                  <span>→</span>
                </Link>
              </article>
            ))}
        </div>
      </section>

      {/* =========================================
          TOPICS
      ========================================= */}

      <section className="blog-section topics-section">
        <div className="section-heading">
          <div>
            <p className="section-label">EXPLORE</p>
            <h2>Browse by topic</h2>
          </div>
        </div>

        <div className="topic-grid">
          {topics.map((topic) => (
            <Link
              to="/topics"
              className="topic-card"
              key={topic}
            >
              <span>{topic}</span>
              <span className="topic-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;