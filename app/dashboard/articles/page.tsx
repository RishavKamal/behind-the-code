"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/components/lib/supabase/client";

type Article = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  status: string;
  views: number | null;
  content: string | null;
  created_at: string;
  published_at: string | null;
};

type Filter = "all" | "published" | "drafts";

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function formatViews(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }

  return String(value);
}

function getReadTime(content: string | null) {
  if (!content?.trim()) {
    return 1;
  }

  const words = content.trim().split(/\s+/).length;

  return Math.max(1, Math.ceil(words / 200));
}

export default function MyArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const router = useRouter();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArticles() {
      const supabase = createClient();

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (!cancelled) {
            router.replace("/login");
          }

          return;
        }

        const { data, error: articlesError } = await supabase
          .from("articles")
          .select(
            "id, title, slug, description, category, status, views, content, created_at, published_at",
          )
          .eq("author_id", user.id)
          .order("created_at", { ascending: false });

        if (articlesError) {
          throw articlesError;
        }

        if (!cancelled) {
          setArticles(data ?? []);
          setLoading(false);
        }
      } catch (loadError) {
        console.error("My articles loading error:", loadError);

        if (!cancelled) {
          setError("Something went wrong while loading your articles.");
          setLoading(false);
        }
      }
    }

    void loadArticles();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      articles
        .map((article) => article.category?.trim())
        .filter(Boolean),
    );

    return Array.from(uniqueCategories).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [articles]);

  const publishedCount = useMemo(
    () =>
      articles.filter((article) => article.status === "published").length,
    [articles],
  );

  const draftCount = useMemo(
    () => articles.filter((article) => article.status === "draft").length,
    [articles],
  );

  const totalViews = useMemo(
    () =>
      articles.reduce(
        (total, article) => total + (article.views ?? 0),
        0,
      ),
    [articles],
  );

  const filteredArticles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesSearch =
        !normalizedSearch ||
        article.title.toLowerCase().includes(normalizedSearch) ||
        article.description?.toLowerCase().includes(normalizedSearch) ||
        article.category?.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        filter === "all" ||
        (filter === "published" && article.status === "published") ||
        (filter === "drafts" && article.status === "draft");

      const matchesCategory =
        categoryFilter === "all" ||
        article.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [articles, search, filter, categoryFilter]);

  function requestDelete(article: Article) {
    setDeleteError("");
    setArticleToDelete(article);
  }

  async function handleDelete(article: Article) {
    setDeletingId(article.id);
    setDeleteError("");
    setDeleteError("");

    try {
      const supabase = createClient();

      const { error: deleteArticleError } = await supabase
        .from("articles")
        .delete()
        .eq("id", article.id);

      if (deleteArticleError) {
        throw deleteArticleError;
      }

      setArticles((current) =>
        current.filter((item) => item.id !== article.id),
      );
      setArticleToDelete(null);
    } catch (deleteArticleError) {
      console.error("Article delete error:", deleteArticleError);
      setDeleteError("Unable to delete this article. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f8f5] text-[#171717]">
        <section className="relative overflow-hidden border-b border-[#deded9]">
          <div
            className="pointer-events-none absolute inset-0 opacity-55"
            style={{
              backgroundImage:
                "linear-gradient(#e7e7e2 1px, transparent 1px), linear-gradient(90deg, #e7e7e2 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage:
                "linear-gradient(to bottom, black 0%, black 75%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 75%, transparent 100%)",
            }}
          />

          <div className="pointer-events-none absolute right-[-100px] top-[-180px] h-[500px] w-[500px] rounded-full bg-[#dfe8ff]/45 blur-[130px]" />

          <div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:px-10">
            <div className="animate-pulse">
              <div className="h-3 w-28 rounded bg-[#deded9]" />

              <div className="mt-7 h-20 w-[500px] max-w-full rounded bg-[#deded9]" />

              <div className="mt-5 h-4 w-[420px] max-w-full rounded bg-[#e7e7e2]" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f8f8f5] text-[#171717]">
        <section className="mx-auto flex min-h-[70vh] max-w-6xl items-center px-6 sm:px-8 lg:px-10">
          <div className="w-full border-y border-[#deded9] py-20 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3568e8]">
              Creator journal
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
              Unable to load your articles.
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#777771]">
              {error}
            </p>

            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#171717] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#292929]"
            >
              Back to dashboard
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f8f5] text-[#171717]">
      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative overflow-hidden border-b border-[#deded9]">
        <div
          className="pointer-events-none absolute inset-0 opacity-55"
          style={{
            backgroundImage:
              "linear-gradient(#e7e7e2 1px, transparent 1px), linear-gradient(90deg, #e7e7e2 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "linear-gradient(to bottom, black 0%, black 72%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 72%, transparent 100%)",
          }}
        />

        <div className="pointer-events-none absolute right-[-100px] top-[-180px] h-[520px] w-[520px] rounded-full bg-[#dfe8ff]/45 blur-[130px]" />

        <div className="relative mx-auto max-w-6xl px-6 pb-12 pt-12 sm:px-8 lg:px-10 lg:pb-14">
          {/* Back link */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#777771] transition hover:text-[#3568e8]"
          >
            <span aria-hidden="true">←</span>
            Dashboard
          </Link>

          {/* Hero content */}
          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#171717] text-[9px] font-bold text-white">
                  BT
                </div>

                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#3568e8]">
                  Creator journal
                </p>
              </div>

              <h1 className="mt-7 max-w-3xl text-[clamp(3rem,6vw,5.4rem)] font-semibold leading-[0.9] tracking-[-0.065em]">
                Your words.
                <br />
                <span className="text-[#3568e8]">Your archive.</span>
              </h1>

              <p className="mt-7 max-w-xl text-sm leading-7 text-[#777771] sm:text-base">
                Everything you have published, drafted, and started writing —
                all in one quiet workspace.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 lg:items-end">
              <Link
                href="/dashboard/articles/new"
                className="inline-flex items-center gap-3 rounded-xl bg-[#171717] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(20,20,20,0.12)] transition hover:bg-[#292929]"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/25 text-xs">
                  +
                </span>

                Write a new article

                <span aria-hidden="true">→</span>
              </Link>

              <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
                {articles.length} total · {publishedCount} published ·{" "}
                {draftCount} drafts
              </p>
            </div>
          </div>

          {/* =====================================================
              FULL WIDTH STATS
          ===================================================== */}
          <div className="mt-12 border-y border-[#deded9]">
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {/* Articles */}
              <div className="border-b border-r border-[#deded9] px-6 py-5 sm:border-b-0 sm:px-7">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tracking-[-0.05em]">
                    {articles.length}
                  </span>

                  <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#999992]">
                    Articles
                  </span>
                </div>
              </div>

              {/* Published */}
              <div className="border-b border-[#deded9] px-6 py-5 sm:border-b-0 sm:border-r sm:px-7">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tracking-[-0.05em]">
                    {publishedCount}
                  </span>

                  <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#999992]">
                    Published
                  </span>
                </div>
              </div>

              {/* Drafts */}
              <div className="border-r border-[#deded9] px-6 py-5 sm:px-7">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tracking-[-0.05em]">
                    {draftCount}
                  </span>

                  <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#999992]">
                    Drafts
                  </span>
                </div>
              </div>

              {/* Views */}
              <div className="px-6 py-5 sm:px-7">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tracking-[-0.05em]">
                    {formatViews(totalViews)}
                  </span>

                  <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#999992]">
                    Views
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FILTER BAR
      ========================================================= */}
      <section className="border-b border-[#deded9] bg-white/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          {/* Search */}
          <div className="relative w-full md:max-w-[440px]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999992]"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your writing..."
              className="h-11 w-full rounded-xl border border-[#deded9] bg-[#f8f8f5] pl-11 pr-4 text-sm text-[#171717] outline-none transition placeholder:text-[#aaa9a1] focus:border-[#bdbdb7] focus:bg-white"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-[#aaa9a1]">
              Show
            </span>

            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                filter === "all"
                  ? "border-[#171717] bg-[#171717] text-white"
                  : "border-[#deded9] bg-white text-[#777771] hover:border-[#aaa9a1] hover:text-[#171717]"
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => setFilter("published")}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                filter === "published"
                  ? "border-[#171717] bg-[#171717] text-white"
                  : "border-[#deded9] bg-white text-[#777771] hover:border-[#aaa9a1] hover:text-[#171717]"
              }`}
            >
              Published
            </button>

            <button
              type="button"
              onClick={() => setFilter("drafts")}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                filter === "drafts"
                  ? "border-[#171717] bg-[#171717] text-white"
                  : "border-[#deded9] bg-white text-[#777771] hover:border-[#aaa9a1] hover:text-[#171717]"
              }`}
            >
              Drafts
            </button>

            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
                className="h-9 rounded-full border border-[#deded9] bg-white px-3 text-xs text-[#777771] outline-none transition focus:border-[#aaa9a1]"
                aria-label="Filter by topic"
              >
                <option value="all">All topics</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          ARTICLE COLLECTION
      ========================================================= */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="flex items-end justify-between border-b border-[#deded9] pb-6">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#3568e8]">
                Your collection
              </p>

              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                {filter === "published"
                  ? "Published articles."
                  : filter === "drafts"
                    ? "Drafts."
                    : "All articles."}
              </h2>
            </div>

            <span className="hidden text-[8px] font-semibold uppercase tracking-[0.18em] text-[#aaa9a1] sm:block">
              {filteredArticles.length.toString().padStart(2, "0")} items
            </span>
          </div>

          {deleteError && (
            <div className="mt-5 rounded-xl border border-[#deded9] bg-white px-4 py-3 text-sm text-[#9a4a4a]">
              {deleteError}
            </div>
          )}

          {filteredArticles.length > 0 ? (
            <div className="divide-y divide-[#deded9]">
              {filteredArticles.map((article, index) => {
                const isPublished = article.status === "published";

                return (
                  <article
                    key={article.id}
                    className="group py-8"
                  >
                    <div className="grid gap-6 lg:grid-cols-[50px_minmax(0,1fr)_180px] lg:items-start">
                      {/* Number */}
                      <div className="hidden lg:block">
                        <span className="font-mono text-[10px] text-[#aaa9a1]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      {/* Article */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-[8px] font-semibold uppercase tracking-[0.16em]">
                          <span className="text-[#3568e8]">
                            {article.category || "Uncategorized"}
                          </span>

                          <span className="text-[#c7c7c1]">·</span>

                          <span
                            className={
                              isPublished
                                ? "text-[#777771]"
                                : "text-[#999992]"
                            }
                          >
                            {isPublished ? "Published" : "Draft"}
                          </span>

                          <span className="text-[#c7c7c1]">·</span>

                          <span className="text-[#999992]">
                            {getReadTime(article.content)} min read
                          </span>
                        </div>

                        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                          {article.title}
                        </h3>

                        {article.description && (
                          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777771]">
                            {article.description}
                          </p>
                        )}

                        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#aaa9a1]">
                          <span>
                            {isPublished
                              ? formatDate(
                                  article.published_at ??
                                    article.created_at,
                                )
                              : `Created ${formatDate(article.created_at)}`}
                          </span>

                          <span>
                            {formatViews(article.views ?? 0)} views
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 lg:justify-end">
                        {isPublished ? (
                          <Link
                            href={`/articles/${article.slug}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#deded9] bg-white px-4 py-2.5 text-xs font-semibold transition hover:border-[#aaa9a1]"
                          >
                            View
                            <span aria-hidden="true">↗</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/dashboard/articles/${article.slug}/edit`}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#292929]"
                          >
                            Continue
                            <span aria-hidden="true">→</span>
                          </Link>
                        )}

                        <Link
                          href={`/dashboard/articles/${article.slug}/edit`}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#deded9] bg-white text-[#777771] transition hover:border-[#aaa9a1] hover:text-[#171717]"
                          aria-label={`Edit ${article.title}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                          </svg>
                        </Link>

                        <button
                          type="button"
                          onClick={() => requestDelete(article)}
                          disabled={deletingId === article.id}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#deded9] bg-white text-[#999992] transition hover:border-[#d0aaaa] hover:text-[#9a4a4a] disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Delete ${article.title}`}
                        >
                          {deletingId === article.id ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#aaa9a1] border-t-transparent" />
                          ) : (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              className="h-4 w-4"
                              aria-hidden="true"
                            >
                              <path d="M4 7h16" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M6 7l1 13h10l1-13" />
                              <path d="M9 7V4h6v3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="border-b border-[#deded9] py-20 text-center">
              {articles.length === 0 ? (
                <>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#3568e8]">
                    Nothing here yet
                  </p>

                  <h3 className="mt-4 text-3xl font-semibold tracking-[-0.045em]">
                    Start with an idea.
                  </h3>

                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#777771]">
                    Your articles will appear here once you start writing.
                  </p>

                  <Link
                    href="/dashboard/articles/new"
                    className="mt-7 inline-flex items-center gap-3 rounded-xl bg-[#171717] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#292929]"
                  >
                    Write an article
                    <span aria-hidden="true">→</span>
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#3568e8]">
                    No matches
                  </p>

                  <h3 className="mt-4 text-3xl font-semibold tracking-[-0.045em]">
                    Nothing matches your search.
                  </h3>

                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#777771]">
                    Try another search term or change the filters.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setFilter("all");
                      setCategoryFilter("all");
                    }}
                    className="mt-7 rounded-xl border border-[#deded9] bg-white px-5 py-3 text-sm font-semibold transition hover:border-[#aaa9a1]"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          BOTTOM INDEX
      ========================================================= */}
      <section className="border-t border-[#deded9]">
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8 lg:px-10">
          <div className="grid grid-cols-2 divide-x divide-[#deded9] border-y border-[#deded9] sm:grid-cols-4">
            <Link
              href="/dashboard"
              className="group px-4 py-5 transition hover:bg-white sm:px-6"
            >
              <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
                Workspace
              </p>

              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.13em] transition-colors group-hover:text-[#3568e8]">
                Dashboard →
              </p>
            </Link>

            <Link
              href="/dashboard/articles/new"
              className="group px-4 py-5 transition hover:bg-white sm:px-6"
            >
              <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
                Create
              </p>

              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.13em] transition-colors group-hover:text-[#3568e8]">
                New article →
              </p>
            </Link>

            <Link
              href="/topics"
              className="group px-4 py-5 transition hover:bg-white sm:px-6"
            >
              <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
                Explore
              </p>

              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.13em] transition-colors group-hover:text-[#3568e8]">
                Browse topics →
              </p>
            </Link>

            <Link
              href="/articles"
              className="group px-4 py-5 transition hover:bg-white sm:px-6"
            >
              <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
                Publication
              </p>

              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.13em] transition-colors group-hover:text-[#3568e8]">
                Public articles →
              </p>
            </Link>
          </div>
        </div>
      </section>

      {articleToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#171717]/35 px-6 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingId) {
              setArticleToDelete(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-article-title"
            className="w-full max-w-md rounded-2xl border border-[#deded9] bg-[#f8f8f5] p-6 shadow-[0_25px_80px_rgba(20,20,20,0.18)]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2cccc] bg-white text-[#9a4a4a]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M4 7h16" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M6 7l1 13h10l1-13" />
                <path d="M9 7V4h6v3" />
              </svg>
            </div>

            <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#3568e8]">
              Delete article
            </p>

            <h2
              id="delete-article-title"
              className="mt-2 text-2xl font-semibold tracking-[-0.04em]"
            >
              Delete this article?
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#777771]">
              <span className="font-medium text-[#171717]">
                “{articleToDelete.title}”
              </span>{" "}
              will be permanently deleted. This action cannot be undone.
            </p>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
                disabled={Boolean(deletingId)}
                className="rounded-xl border border-[#deded9] bg-white px-4 py-2.5 text-sm font-semibold transition hover:border-[#aaa9a1] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDelete(articleToDelete)}
                disabled={Boolean(deletingId)}
                className="inline-flex min-w-[110px] items-center justify-center gap-2 rounded-xl bg-[#9a4a4a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#853d3d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === articleToDelete.id ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Deleting
                  </>
                ) : (
                  "Delete article"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}