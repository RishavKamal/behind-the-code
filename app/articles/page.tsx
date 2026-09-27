"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/components/lib/supabase/client";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Article = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content: string;
  author_id: string;
  created_at: string;
  published_at: string | null;
  slug: string;
};

type Topic = {
  slug: string;
  label: string;
};

const featuredTopicOrder = [
  "Web Development",
  "Java",
  "Spring Boot",
  "React",
  "Backend",
  "DSA",
  "Projects",
];

function categoryToSlug(category: string) {
  return category.toLowerCase().replace(/\s+/g, "-");
}

function slugToLabel(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function calculateReadTime(content: string) {
  const wordCount = content.trim()
    ? content.trim().split(/\s+/).length
    : 0;

  const minutes = Math.max(1, Math.ceil(wordCount / 200));

  return `${minutes} min read`;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function ArticlesPageContent() {
  const pageRef = useRef<HTMLElement | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const topicFromUrl = searchParams.get("topic");

  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(
    topicFromUrl ? topicFromUrl.toLowerCase() : "all",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topicsOpen, setTopicsOpen] = useState(false);

  useEffect(() => {
    setSelectedTopic(topicFromUrl ? topicFromUrl.toLowerCase() : "all");
  }, [topicFromUrl]);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function loadPage() {
      setLoading(true);
      setError("");

      const [
        {
          data: { user },
        },
        { data, error: articlesError },
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("articles")
          .select(
            "id, title, description, category, content, author_id, created_at, published_at, slug",
          )
          .eq("status", "published")
          .order("published_at", { ascending: false }),
      ]);

      if (!mounted) {
        return;
      }

      setIsLoggedIn(Boolean(user));

      if (articlesError) {
        setError(articlesError.message);
        setArticles([]);
        setLoading(false);
        return;
      }

      setArticles(data ?? []);
      setLoading(false);
    }

    loadPage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setIsLoggedIn(Boolean(session?.user));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const availableTopics = useMemo(() => {
    const unique = new Map<string, string>();

    articles.forEach((article) => {
      const label = article.category.trim();

      if (!label) {
        return;
      }

      const slug = categoryToSlug(label);

      if (!unique.has(slug)) {
        unique.set(slug, label);
      }
    });

    return Array.from(unique.entries()).map(([slug, label]) => ({
      slug,
      label,
    }));
  }, [articles]);

  const visibleTopics = useMemo(() => {
    const preferred = featuredTopicOrder
      .map((topic) => {
        const slug = categoryToSlug(topic);

        return availableTopics.find(
          (item) => item.slug === slug,
        );
      })
      .filter(
        (topic): topic is Topic => Boolean(topic),
      );

    const remaining = availableTopics.filter(
      (topic) =>
        !featuredTopicOrder.some(
          (preferredTopic) =>
            categoryToSlug(preferredTopic) === topic.slug,
        ),
    );

    return [...preferred, ...remaining];
  }, [availableTopics]);

  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesTopic =
        selectedTopic === "all" ||
        categoryToSlug(article.category) === selectedTopic;

      const matchesSearch =
        query.length === 0 ||
        article.title.toLowerCase().includes(query) ||
        (article.description ?? "")
          .toLowerCase()
          .includes(query) ||
        article.category.toLowerCase().includes(query);

      return matchesTopic && matchesSearch;
    });
  }, [articles, searchQuery, selectedTopic]);

  const selectedTopicLabel =
    selectedTopic === "all"
      ? "All articles"
      : availableTopics.find(
          (topic) => topic.slug === selectedTopic,
        )?.label ?? slugToLabel(selectedTopic);

  const hasFilters =
    searchQuery.trim().length > 0 ||
    selectedTopic !== "all";

  function handleSearchChange(value: string) {
    setSearchQuery(value);

    if (value.trim().length > 0) {
      setSelectedTopic("all");

      if (topicFromUrl) {
        router.replace(pathname);
      }
    }
  }

  function handleTopicChange(topic: string) {
    setSelectedTopic(topic);
    setSearchQuery("");
    setTopicsOpen(false);

    if (topic === "all") {
      router.replace(pathname);
      return;
    }

    router.replace(
      `${pathname}?topic=${encodeURIComponent(topic)}`,
    );
  }

  function clearFilters() {
    setSearchQuery("");
    setSelectedTopic("all");
    router.replace(pathname);
  }

  return (
    <main
      ref={pageRef}
      className="overflow-hidden bg-[#f5f5f1] text-[#151515]"
    >
      <ArticlesPageAnimations root={pageRef} />
      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="relative border-b border-[#dcdcd5]">
        {/* Grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(rgba(21,21,21,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(21,21,21,0.055) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            maskImage:
              "linear-gradient(to bottom, black 0%, black 75%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 75%, transparent 100%)",
          }}
        />

        {/* Subtle atmosphere */}
        <div className="pointer-events-none absolute right-[5%] top-[-180px] h-[500px] w-[500px] rounded-full bg-[#dfe8ff]/55 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-14 sm:px-8 md:pb-24 md:pt-16 lg:px-10">
          {/* Identity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#151515] text-xs font-bold text-white shadow-lg shadow-black/10">
                BT
              </div>

              <div>
                <p className="text-xs font-bold tracking-tight">
                  Behind the Code
                </p>

                <p className="text-[10px] uppercase tracking-[0.18em] text-[#888881]">
                  Developer journal
                </p>
              </div>
            </div>

            <div className="hidden rounded-full border border-[#d8d8d1] bg-white/75 px-4 py-2 sm:block">
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#777770]">
                The Archive
              </span>
            </div>
          </div>

          {/* Hero content */}
          <div className="mt-20 grid gap-14 lg:grid-cols-[1fr_0.55fr] lg:items-end lg:gap-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#3568e8]">
                Read · Learn · Build
              </p>

              <h1 className="mt-6 max-w-4xl text-[4.7rem] font-bold leading-[0.84] tracking-[-0.075em] sm:text-[6.2rem] md:text-[7.5rem] lg:text-[8.2rem]">
                Articles
                <span className="text-[#3568e8]">.</span>
              </h1>

              <p className="mt-8 max-w-2xl text-base leading-7 text-[#686861] md:text-lg">
                Notes, tutorials, experiments, and lessons from building
                software and learning computer science.
              </p>
            </div>

            {/* Archive card */}
            <div className="relative mx-auto w-full max-w-[430px] lg:mx-0 lg:ml-auto">
              <div className="absolute -inset-5 rounded-[2rem] bg-[#3568e8]/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-[1.75rem] border border-[#d6d6cf] bg-white shadow-[0_25px_70px_rgba(20,20,20,0.08)]">
                <div className="flex items-center justify-between border-b border-[#deded9] px-6 py-5">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#999991]">
                      Journal archive
                    </p>

                    <p className="mt-1 text-sm font-bold">
                      What happens behind the code?
                    </p>
                  </div>

                  <span className="font-mono text-[9px] text-[#999991]">
                    2026
                  </span>
                </div>

                <div className="divide-y divide-[#deded9]">
                  <div className="flex items-center gap-5 px-6 py-6">
                    <span className="font-mono text-[9px] text-[#aaa9a1]">
                      01
                    </span>

                    <div>
                      <p className="text-lg font-bold tracking-tight">
                        Tutorials
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#777771]">
                        Learn concepts by breaking them down.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 px-6 py-6">
                    <span className="font-mono text-[9px] text-[#aaa9a1]">
                      02
                    </span>

                    <div>
                      <p className="text-lg font-bold tracking-tight">
                        Experiments
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#777771]">
                        Discover what works by building and testing.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 px-6 py-6">
                    <span className="font-mono text-[9px] text-[#aaa9a1]">
                      03
                    </span>

                    <div>
                      <p className="text-lg font-bold tracking-tight">
                        Lessons
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#777771]">
                        Document the mistakes and decisions along the way.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#deded9] bg-[#f7f7f4] px-6 py-4">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#999991]">
                    Published
                  </span>

                  <span className="text-sm font-bold">
                    {loading
                      ? "—"
                      : String(articles.length).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Editorial strip */}
          <div className="mt-20 border-y border-[#deded9]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              <div className="flex min-h-[58px] items-center justify-center border-b border-r border-[#deded9] px-3 py-3 lg:border-b-0">
                <span className="text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-[#3568e8]">
                  Articles
                </span>
              </div>

              <div className="flex min-h-[58px] items-center justify-center border-b border-[#deded9] px-3 py-3 sm:border-r lg:border-b-0">
                <span className="text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-[#777771]">
                  Tutorials
                </span>
              </div>

              <div className="flex min-h-[58px] items-center justify-center border-b border-r border-[#deded9] px-3 py-3 lg:border-b-0">
                <span className="text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-[#777771]">
                  Notes
                </span>
              </div>

              <div className="flex min-h-[58px] items-center justify-center border-b border-[#deded9] px-3 py-3 sm:border-r lg:border-b-0">
                <span className="text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-[#777771]">
                  Experiments
                </span>
              </div>

              <div className="flex min-h-[58px] items-center justify-center border-r border-[#deded9] px-3 py-3">
                <span className="text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-[#777771]">
                  Lessons
                </span>
              </div>

              <div className="flex min-h-[58px] items-center justify-center px-3 py-3">
                <span className="text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-[#3568e8]">
                  The Process
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SEARCH / FILTERS
      ===================================================== */}
      <section className="border-b border-[#dcdcd5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 md:py-10 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            {/* Search */}
            <div>
              <label
                htmlFor="article-search"
                className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#777770]"
              >
                Search the journal
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#999991]">
                  <SearchIcon />
                </div>

                <input
                  id="article-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    handleSearchChange(event.target.value)
                  }
                  placeholder="Search articles..."
                  className="h-12 w-full appearance-none rounded-xl border border-[#d9d9d2] bg-[#f8f8f5] py-2.5 pl-11 pr-11 text-sm text-[#171717] outline-none transition-all placeholder:text-[#aaa9a3] focus:border-[#3568e8]/50 focus:bg-white focus:ring-4 focus:ring-[#3568e8]/5 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full p-1 text-[#999992] transition-colors hover:bg-[#ecece7] hover:text-[#171717]"
                    aria-label="Clear search"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            </div>

            {/* Topics */}
            <div>
              <div className="mb-2.5 flex items-center justify-between gap-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#777770]">
                  Topics
                </p>

                <button
                  type="button"
                  onClick={() => setTopicsOpen(true)}
                  className="text-xs font-semibold text-[#55554f] transition-colors hover:text-[#3568e8]"
                >
                  Explore all topics →
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleTopicChange("all")}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-all ${
                    selectedTopic === "all"
                      ? "border-[#171717] bg-[#171717] text-white shadow-sm"
                      : "border-[#deded9] bg-white text-[#555550] hover:border-[#bdbdb7] hover:bg-[#f4f4f1]"
                  }`}
                >
                  All
                </button>

                <div className="flex min-w-0 gap-2 overflow-hidden">
                  {visibleTopics.slice(0, 6).map((topic) => (
                    <button
                      key={topic.slug}
                      type="button"
                      onClick={() => handleTopicChange(topic.slug)}
                      className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-all ${
                        selectedTopic === topic.slug
                          ? "border-[#3568e8] bg-[#3568e8] text-white shadow-sm"
                          : "border-[#deded9] bg-white text-[#555550] hover:border-[#bdbdb7] hover:bg-[#f4f4f1] hover:text-[#171717]"
                      }`}
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          TOPIC MODAL
      ===================================================== */}
      {topicsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#151515]/35 px-5 py-8 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="topics-dialog-title"
            className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-[#d8d8d1] bg-[#f7f7f4] shadow-[0_30px_100px_rgba(0,0,0,0.2)]"
          >
            <div className="flex items-start justify-between border-b border-[#deded8] bg-white px-6 py-5 sm:px-7">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3568e8]">
                  Explore
                </p>

                <h2
                  id="topics-dialog-title"
                  className="mt-1 text-2xl font-bold tracking-[-0.04em]"
                >
                  All topics
                </h2>

                <p className="mt-1 text-xs text-[#85857e]">
                  Browse every topic currently available in the journal.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTopicsOpen(false)}
                className="rounded-full border border-[#deded8] bg-white p-2 text-[#777770] transition-colors hover:bg-[#f1f1ed] hover:text-[#171717]"
                aria-label="Close topics"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-6 sm:p-7">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleTopicChange("all")}
                  className={`group flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                    selectedTopic === "all"
                      ? "border-[#171717] bg-[#171717] text-white"
                      : "border-[#deded8] bg-white hover:border-[#3568e8]/40"
                  }`}
                >
                  <span className="font-semibold">
                    All articles
                  </span>

                  <span>→</span>
                </button>

                {availableTopics.map((topic, index) => (
                  <button
                    key={topic.slug}
                    type="button"
                    onClick={() => handleTopicChange(topic.slug)}
                    className={`group flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                      selectedTopic === topic.slug
                        ? "border-[#3568e8] bg-[#3568e8] text-white"
                        : "border-[#deded8] bg-white hover:border-[#3568e8]/40"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`font-mono text-[10px] ${
                          selectedTopic === topic.slug
                            ? "text-white/60"
                            : "text-[#aaa9a1]"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="font-semibold">
                        {topic.label}
                      </span>
                    </span>

                    <span className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </button>
                ))}
              </div>

              {!loading && availableTopics.length === 0 && (
                <p className="py-10 text-center text-sm text-[#777770]">
                  No topics are available yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          ARTICLE ARCHIVE
      ===================================================== */}
      <section className="bg-[#f5f5f1]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 md:py-20 lg:px-10">
          {/* Section heading */}
          <div className="flex flex-col gap-5 border-b border-[#dcdcd5] pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3568e8]">
                {hasFilters ? "Filtered journal" : "The archive"}
              </p>

              <h2 className="mt-2 text-4xl font-bold tracking-[-0.055em]">
                {hasFilters
                  ? selectedTopic !== "all" && !searchQuery
                    ? selectedTopicLabel
                    : "Matching articles"
                  : "Latest articles"}
                <span className="text-[#3568e8]">.</span>
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#999991]">
                {loading
                  ? "Loading..."
                  : `${String(filteredArticles.length).padStart(2, "0")} ${
                      filteredArticles.length === 1
                        ? "article"
                        : "articles"
                    }`}
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-[#777771] underline decoration-[#c7c7c1] underline-offset-4 transition-colors hover:text-[#3568e8]"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-[1.5rem] border border-[#deded8] bg-white p-7"
                >
                  <div className="h-3 w-24 rounded bg-[#e7e7e1]" />

                  <div className="mt-7 h-8 w-3/4 rounded bg-[#e7e7e1]" />

                  <div className="mt-4 h-4 w-full rounded bg-[#ededE8]" />

                  <div className="mt-2 h-4 w-2/3 rounded bg-[#ededE8]" />

                  <div className="mt-10 h-3 w-28 rounded bg-[#e7e7e1]" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="border-b border-[#deded9] py-20 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#151515] text-white">
                !
              </div>

              <h3 className="mt-5 text-xl font-bold tracking-[-0.025em]">
                Could not load articles
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#777771]">
                {error}
              </p>
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {filteredArticles.map((article, index) => (
                <article key={article.id}>
                  <Link
                    href={`/articles/${article.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-[#d9d9d2] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#3568e8]/35 hover:shadow-[0_22px_50px_rgba(20,20,20,0.08)]"
                  >
                    {/* Card top */}
                    <div className="flex items-center justify-between border-b border-[#e8e8e2] px-6 py-4">
                      <span className="font-mono text-[10px] font-bold text-[#aaa9a1] transition-colors group-hover:text-[#3568e8]">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="rounded-full bg-[#f0f3ff] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#3568e8]">
                        {article.category}
                      </span>
                    </div>

                    {/* Card content */}
                    <div className="flex flex-1 flex-col p-6 sm:p-7">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#999991]">
                        <span>
                          {calculateReadTime(article.content)}
                        </span>

                        <span>·</span>

                        <time
                          dateTime={
                            article.published_at ??
                            article.created_at
                          }
                        >
                          {formatDate(
                            article.published_at ??
                              article.created_at,
                          )}
                        </time>
                      </div>

                      <h3 className="mt-5 text-2xl font-bold leading-[1.05] tracking-[-0.045em] transition-colors group-hover:text-[#3568e8] sm:text-3xl">
                        {article.title}
                      </h3>

                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#777770]">
                        {article.description ||
                          "A note from the Behind the Code journal."}
                      </p>

                      <div className="mt-auto flex items-center justify-between border-t border-[#e8e8e2] pt-5">
                        <span className="text-xs text-[#999991]">
                          Rishav Kamal
                        </span>

                        <span className="flex items-center gap-2 text-xs font-bold text-[#33332f] transition-colors group-hover:text-[#3568e8]">
                          Read article

                          <span className="text-base transition-transform group-hover:translate-x-1">
                            →
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="border-b border-[#deded9] py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#777771] shadow-sm">
                <SearchIcon />
              </div>

              <h3 className="mt-5 text-xl font-bold tracking-[-0.025em]">
                No articles found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#777771]">
                {hasFilters
                  ? "We couldn't find any articles matching your search. Try another keyword or explore a different topic."
                  : "There are no published articles yet."}
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 rounded-xl bg-[#151515] px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#2b2b2b]"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          CONTRIBUTION CTA
      ===================================================== */}
      <section className="relative overflow-hidden border-t border-[#dcdcd5] bg-[#151515] text-white">
        <div className="pointer-events-none absolute right-[-100px] top-[-150px] h-96 w-96 rounded-full bg-[#3568e8]/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-24 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6f9aff]">
                Contribute
              </p>

              <h2 className="mt-4 max-w-3xl text-4xl font-bold leading-[0.92] tracking-[-0.055em] sm:text-5xl md:text-6xl">
                Have something
                <br />
                worth sharing?
              </h2>

              <p className="mt-6 max-w-xl text-sm leading-6 text-[#a7a7a2]">
                Write about something you built, learned, discovered, or
                struggled with. Document the process and make the next
                developer&apos;s path a little easier.
              </p>
            </div>

            <Link
              href={
                isLoggedIn
                  ? "/dashboard/articles/new"
                  : "/login?redirectTo=/dashboard/articles/new"
              }
              className="group inline-flex w-fit items-center gap-3 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-[#151515] transition-all hover:-translate-y-0.5 hover:bg-[#eeeeeb]"
            >
              Start writing

              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>

          <div className="mt-16 border-t border-white/10 pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
            Read. Learn. Build. Share.
          </div>
        </div>
      </section>
    </main>
  );
}


function ArticlesPageAnimations({
  root,
}: {
  root: React.RefObject<HTMLElement | null>;
}) {
  useGSAP(
    () => {
      const page = root.current;

      if (!page) {
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const hero = page.querySelector<HTMLElement>("section:first-of-type");
      const searchSection = hero?.nextElementSibling as HTMLElement | null;
      const archiveSection =
        searchSection?.nextElementSibling as HTMLElement | null;
      const ctaSection = page.querySelector<HTMLElement>("section:last-of-type");

      /* ------------------------------------------------------------
       * HERO
       * ---------------------------------------------------------- */
      const heroIdentity = hero?.querySelector<HTMLElement>(
        ".relative.mx-auto.max-w-7xl > .flex.items-center.justify-between",
      );
      const heroContent = hero?.querySelector<HTMLElement>(
        ".relative.mx-auto.max-w-7xl > .mt-20",
      );
      const editorialStrip = hero?.querySelector<HTMLElement>(
        ".relative.mx-auto.max-w-7xl > .mt-20.border-y",
      );

      if (heroIdentity) {
        gsap.fromTo(
          heroIdentity,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: "power3.out",
          },
        );
      }

      if (heroContent) {
        gsap.fromTo(
          heroContent.children,
          { opacity: 0, y: 38 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            stagger: 0.12,
            delay: 0.1,
            ease: "power3.out",
          },
        );
      }

      if (editorialStrip) {
        gsap.fromTo(
          editorialStrip,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay: 0.25,
            ease: "power3.out",
          },
        );
      }

      const archiveCard = hero?.querySelector<HTMLElement>(
        ".relative.overflow-hidden.rounded-\\[1\\.75rem\\]",
      );

      if (archiveCard) {
        gsap.fromTo(
          archiveCard,
          { opacity: 0, y: 50, rotate: 1.2 },
          {
            opacity: 1,
            y: 0,
            rotate: 0,
            duration: 1,
            delay: 0.2,
            ease: "power3.out",
          },
        );
      }

      const grid = hero?.querySelector<HTMLElement>(
        ".pointer-events-none.absolute.inset-0",
      );

      if (grid) {
        gsap.to(grid, {
          y: 65,
          ease: "none",
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      }

      const archiveGlow = hero?.querySelector<HTMLElement>(".absolute.-inset-5");

      if (archiveGlow) {
        gsap.to(archiveGlow, {
          y: -24,
          scale: 1.08,
          ease: "none",
          scrollTrigger: {
            trigger: archiveGlow.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.3,
          },
        });
      }

      /* ------------------------------------------------------------
       * SEARCH / FILTERS
       * ---------------------------------------------------------- */
      if (searchSection) {
        const filterContent = searchSection.firstElementChild;

        if (filterContent instanceof HTMLElement) {
          gsap.fromTo(
            filterContent.children,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              stagger: 0.12,
              ease: "power3.out",
              scrollTrigger: {
                trigger: searchSection,
                start: "top 82%",
                once: true,
              },
            },
          );
        }
      }

      /* ------------------------------------------------------------
       * ARTICLE CARDS
       *
       * GSAP never transforms the clickable <a>.
       * Tailwind remains the owner of hover:-translate-y-1.
       * The inner content gets the subtle mouse-follow effect.
       * ---------------------------------------------------------- */
      const cards = Array.from(
        archiveSection?.querySelectorAll<HTMLElement>(
          'article > a[href^="/articles/"]',
        ) ?? [],
      );

      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 35 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            delay: index * 0.07,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              once: true,
            },
          },
        );

        const inner = card.firstElementChild;

        if (!(inner instanceof HTMLElement)) {
          return;
        }

        const moveX = gsap.quickTo(inner, "x", {
          duration: 0.25,
          ease: "power2.out",
        });

        const moveY = gsap.quickTo(inner, "y", {
          duration: 0.25,
          ease: "power2.out",
        });

        const handleEnter = () => {
          gsap.to(inner, {
            scale: 1.012,
            duration: 0.28,
            ease: "power2.out",
            overwrite: true,
          });
        };

        const handleMove = (event: MouseEvent) => {
          const rect = card.getBoundingClientRect();

          if (!rect.width || !rect.height) {
            return;
          }

          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;

          moveX(x * 4);
          moveY(y * 4);
        };

        const handleLeave = () => {
          moveX(0);
          moveY(0);

          gsap.to(inner, {
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.32,
            ease: "power3.out",
            overwrite: true,
          });
        };

        card.addEventListener("mouseenter", handleEnter);
        card.addEventListener("mousemove", handleMove);
        card.addEventListener("mouseleave", handleLeave);

        return () => {
          card.removeEventListener("mouseenter", handleEnter);
          card.removeEventListener("mousemove", handleMove);
          card.removeEventListener("mouseleave", handleLeave);
        };
      });

      /* ------------------------------------------------------------
       * CTA
       * ---------------------------------------------------------- */
      if (ctaSection) {
        const ctaContent = ctaSection.querySelector<HTMLElement>(
          ".relative.mx-auto.max-w-7xl",
        );

        if (ctaContent) {
          gsap.fromTo(
            ctaContent.children,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.75,
              stagger: 0.1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: ctaSection,
                start: "top 80%",
                once: true,
              },
            },
          );
        }
      }

      const ctaGlow = ctaSection?.querySelector<HTMLElement>(
        ".absolute.right-\\[-100px\\]",
      );

      if (ctaGlow && ctaSection) {
        gsap.to(ctaGlow, {
          x: -70,
          y: 45,
          scale: 1.12,
          ease: "none",
          scrollTrigger: {
            trigger: ctaSection,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.4,
          },
        });
      }

      /* ------------------------------------------------------------
       * TOPIC MODAL
       * ---------------------------------------------------------- */
      const modal = page.querySelector<HTMLElement>('[role="dialog"]');

      if (modal) {
        gsap.fromTo(
          modal,
          { opacity: 0, scale: 0.96, y: 22 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "power3.out",
          },
        );
      }
    },
    { scope: root },
  );

  return null;
}

export default function ArticlesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f5f5f1] text-[#151515]">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
            <div className="animate-pulse">
              <div className="h-4 w-28 rounded bg-[#deded9]" />
              <div className="mt-6 h-20 w-72 rounded bg-[#deded9]" />
              <div className="mt-6 h-5 w-full max-w-2xl rounded bg-[#e7e7e2]" />
              <div className="mt-12 h-48 rounded-[1.75rem] bg-white" />
            </div>
          </div>
        </main>
      }
    >
      <ArticlesPageContent />
    </Suspense>
  );
}


function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}