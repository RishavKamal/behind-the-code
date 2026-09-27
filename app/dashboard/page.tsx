"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/components/lib/supabase/client";
import ScrollReveal from "@/components/scroll-reveal";

type DashboardArticle = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  status: string;
  views: number | null;
  created_at: string;
  published_at: string | null;
};

type Profile = {
  display_name: string | null;
  username: string | null;
};

function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

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

export default function DashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [articles, setArticles] = useState<DashboardArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
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

        const [
          { data: profileData, error: profileError },
          { data: articleData, error: articleError },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name, username")
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("articles")
            .select(
              "id, title, slug, description, category, status, views, created_at, published_at",
            )
            .eq("author_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (profileError) {
          console.error("Dashboard profile error:", profileError);
        }

        if (articleError) {
          console.error("Dashboard articles error:", articleError);
        }

        if (cancelled) {
          return;
        }

        const metadata = user.user_metadata ?? {};

        const metadataName =
          typeof metadata.full_name === "string"
            ? metadata.full_name.trim()
            : "";

        const metadataUsername =
          typeof metadata.username === "string"
            ? metadata.username.trim().toLowerCase()
            : "";

        setProfile({
          display_name:
            profileData?.display_name?.trim() ||
            metadataName ||
            user.email?.split("@")[0] ||
            "Developer",

          username:
            profileData?.username?.trim() ||
            metadataUsername ||
            null,
        });

        setArticles(articleData ?? []);
        setLoading(false);
      } catch (dashboardError) {
        console.error("Dashboard loading error:", dashboardError);

        if (!cancelled) {
          setError("Something went wrong while loading your dashboard.");
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const displayName = useMemo(() => {
    return profile?.display_name || "Developer";
  }, [profile]);

  const publishedCount = useMemo(() => {
    return articles.filter(
      (article) => article.status === "published",
    ).length;
  }, [articles]);

  const draftCount = useMemo(() => {
    return articles.filter(
      (article) => article.status === "draft",
    ).length;
  }, [articles]);

  const totalViews = useMemo(() => {
    return articles.reduce(
      (total, article) => total + (article.views ?? 0),
      0,
    );
  }, [articles]);

  const categoryCount = useMemo(() => {
    return new Set(
      articles
        .map((article) => article.category?.trim())
        .filter(Boolean),
    ).size;
  }, [articles]);

  const recentArticles = useMemo(() => {
    return articles.slice(0, 5);
  }, [articles]);

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f8f5] text-[#171717]">
        <section className="relative overflow-hidden border-b border-[#deded9]">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(#e7e7e2 1px, transparent 1px), linear-gradient(90deg, #e7e7e2 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage:
                "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
            }}
          />

          <div className="pointer-events-none absolute right-[5%] top-[-180px] h-[480px] w-[480px] rounded-full bg-[#dfe8ff]/45 blur-[130px]" />

          <div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:px-10">
            <div className="animate-pulse">
              <div className="h-3 w-28 rounded bg-[#deded9]" />
              <div className="mt-7 h-16 w-[520px] max-w-full rounded bg-[#deded9]" />
              <div className="mt-5 h-4 w-[430px] max-w-full rounded bg-[#e7e7e2]" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Error                                                                  */
  /* ---------------------------------------------------------------------- */

  if (error) {
    return (
      <main className="min-h-screen bg-[#f8f8f5] text-[#171717]">
        <section className="mx-auto flex min-h-[70vh] max-w-6xl items-center px-6 sm:px-8 lg:px-10">
          <div className="w-full border-y border-[#deded9] py-20 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3568e8]">
              Dashboard
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
              Unable to load your workspace.
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#777771]">
              {error}
            </p>

            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#171717] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#292929]"
            >
              Back to home
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f8f5] text-[#171717]">
      {/* ================================================================== */}
      {/* HERO                                                               */}
      {/* ================================================================== */}

      <section className="relative overflow-hidden border-b border-[#deded9]">
        {/* Editorial grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
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

        {/* Soft blue atmosphere */}
        <div className="pointer-events-none absolute right-[-80px] top-[-170px] h-[520px] w-[520px] rounded-full bg-[#dfe8ff]/45 blur-[130px]" />

        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-14 sm:px-8 lg:px-10 lg:pb-20 lg:pt-16">
          {/* Small identity row */}
          <ScrollReveal distance={16}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#171717] text-[10px] font-bold text-white">
                  BT
                </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#3568e8]">
                    Creator Space
                  </p>

                  <p className="mt-0.5 text-xs font-medium text-[#555550]">
                    Dashboard
                  </p>
                </div>
              </div>

              <span className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-[#999992] sm:block">
                Behind the Code
              </span>
            </div>
          </ScrollReveal>

          {/* Main hero */}
          <ScrollReveal delay={120} distance={24}>
            <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#777771]">
                  Your workspace
                </p>

                <h1 className="mt-6 max-w-3xl text-[clamp(3rem,6vw,5.5rem)] font-semibold leading-[0.9] tracking-[-0.065em]">
                  Welcome back,
                  <br />
                  <span className="text-[#3568e8]">
                    {displayName}.
                  </span>
                </h1>

                <p className="mt-7 max-w-2xl text-sm leading-7 text-[#777771] sm:text-base">
                  Your writing, drafts, and the work you have shared with
                  readers — all in one place.
                </p>
              </div>

              {/* Hero actions */}
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

                <Link
                  href="/dashboard/articles"
                  className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#777771] transition hover:text-[#3568e8]"
                >
                  Manage all articles →
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* ============================================================= */}
          {/* DASHBOARD INDEX                                                */}
          {/* ============================================================= */}

          <ScrollReveal delay={220} distance={20}>
            <div className="mt-16 border-y border-[#deded9]">
              <div className="grid grid-cols-2 divide-x divide-y divide-[#deded9] sm:grid-cols-4 sm:divide-y-0">
                {/* Articles */}
                <div className="min-w-0 px-5 py-5 sm:px-6 sm:py-6">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#999992]">
                    Articles
                  </p>

                  <div className="mt-3 flex items-end justify-between gap-4">
                    <p className="text-3xl font-semibold tracking-[-0.05em]">
                      {articles.length}
                    </p>

                    <span className="hidden text-[8px] uppercase tracking-[0.15em] text-[#aaa9a1] sm:block">
                      Total
                    </span>
                  </div>
                </div>

                {/* Published */}
                <div className="min-w-0 px-5 py-5 sm:px-6 sm:py-6">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#999992]">
                    Published
                  </p>

                  <div className="mt-3 flex items-end justify-between gap-4">
                    <p className="text-3xl font-semibold tracking-[-0.05em]">
                      {publishedCount}
                    </p>

                    <span className="hidden text-[8px] uppercase tracking-[0.15em] text-[#aaa9a1] sm:block">
                      Live
                    </span>
                  </div>
                </div>

                {/* Drafts */}
                <div className="min-w-0 px-5 py-5 sm:px-6 sm:py-6">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#999992]">
                    Drafts
                  </p>

                  <div className="mt-3 flex items-end justify-between gap-4">
                    <p className="text-3xl font-semibold tracking-[-0.05em]">
                      {draftCount}
                    </p>

                    <span className="hidden text-[8px] uppercase tracking-[0.15em] text-[#aaa9a1] sm:block">
                      In progress
                    </span>
                  </div>
                </div>

                {/* Views */}
                <div className="min-w-0 px-5 py-5 sm:px-6 sm:py-6">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#999992]">
                    Views
                  </p>

                  <div className="mt-3 flex items-end justify-between gap-4">
                    <p className="text-3xl font-semibold tracking-[-0.05em]">
                      {formatViews(totalViews)}
                    </p>

                    <span className="hidden text-[8px] uppercase tracking-[0.15em] text-[#aaa9a1] sm:block">
                      Total reads
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================== */}
      {/* RECENT ARTICLES                                                    */}
      {/* ================================================================== */}

      <section className="border-b border-[#deded9]">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
            {/* Articles */}
            <div>
              <ScrollReveal distance={20}>
                <div className="flex items-end justify-between border-b border-[#deded9] pb-6">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3568e8]">
                      Writing
                    </p>

                    <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                      Recent articles.
                    </h2>
                  </div>

                  {articles.length > 0 && (
                    <Link
                      href="/dashboard/articles"
                      className="hidden text-[9px] font-semibold uppercase tracking-[0.16em] text-[#777771] transition hover:text-[#3568e8] sm:block"
                    >
                      View all →
                    </Link>
                  )}
                </div>
              </ScrollReveal>

              {recentArticles.length > 0 ? (
                <div className="divide-y divide-[#deded9]">
                  {recentArticles.map((article, index) => (
                    <ScrollReveal
                      key={article.id}
                      delay={Math.min(index * 70, 280)}
                      distance={18}
                    >
                      <article className="group py-7">
                        <div className="grid gap-4 sm:grid-cols-[42px_minmax(0,1fr)_auto] sm:items-start sm:gap-6">
                          <span className="font-mono text-[10px] text-[#aaa9a1]">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.15em]">
                              <span className="text-[#3568e8]">
                                {article.category}
                              </span>

                              <span className="text-[#c7c7c1]">
                                ·
                              </span>

                              <span className="text-[#999992]">
                                {article.status === "published"
                                  ? formatDate(
                                      article.published_at ??
                                        article.created_at,
                                    )
                                  : "Draft"}
                              </span>
                            </div>

                            <Link
                              href={
                                article.status === "published"
                                  ? `/articles/${article.slug}`
                                  : `/dashboard/articles/${article.id}/edit`
                              }
                              className="mt-2 block"
                            >
                              <h3 className="text-2xl font-semibold tracking-[-0.04em] transition-colors group-hover:text-[#3568e8]">
                                {article.title}
                              </h3>

                              {article.description && (
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777771]">
                                  {article.description}
                                </p>
                              )}
                            </Link>
                          </div>

                          <div className="flex items-center gap-4 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#999992]">
                            <span>
                              {formatViews(article.views ?? 0)} views
                            </span>

                            <Link
                              href={
                                article.status === "published"
                                  ? `/articles/${article.slug}`
                                  : `/dashboard/articles/${article.id}/edit`
                              }
                              className="text-[#171717] transition hover:text-[#3568e8]"
                            >
                              →
                            </Link>
                          </div>
                        </div>
                      </article>
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                <ScrollReveal distance={22}>
                  <div className="flex min-h-[260px] items-center justify-center border-b border-[#deded9] text-center">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#3568e8]">
                        Your journal is empty
                      </p>

                      <h3 className="mt-4 text-3xl font-semibold tracking-[-0.045em]">
                        Start with one idea.
                      </h3>

                      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#777771]">
                        Write your first article and it will appear here
                        automatically.
                      </p>

                      <Link
                        href="/dashboard/articles/new"
                        className="mt-6 inline-flex items-center gap-3 rounded-xl bg-[#171717] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#292929]"
                      >
                        Write an article
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              )}
            </div>

            {/* =========================================================== */}
            {/* QUICK ACTIONS                                                */}
            {/* =========================================================== */}

            <ScrollReveal delay={120} distance={22}>
              <aside>
                <div className="rounded-3xl border border-[#deded9] bg-white p-6">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#3568e8]">
                    Quick actions
                  </p>

                  <div className="mt-5 divide-y divide-[#deded9]">
                    <Link
                      href="/dashboard/articles/new"
                      className="group flex items-center justify-between py-5 first:pt-0"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          Write an article
                        </p>

                        <p className="mt-1 text-xs text-[#999992]">
                          Start something new
                        </p>
                      </div>

                      <span className="text-[#aaa9a1] transition-transform group-hover:translate-x-1 group-hover:text-[#3568e8]">
                        →
                      </span>
                    </Link>

                    <Link
                      href="/dashboard/articles"
                      className="group flex items-center justify-between py-5"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          Manage articles
                        </p>

                        <p className="mt-1 text-xs text-[#999992]">
                          Edit and organize your writing
                        </p>
                      </div>

                      <span className="text-[#aaa9a1] transition-transform group-hover:translate-x-1 group-hover:text-[#3568e8]">
                        →
                      </span>
                    </Link>

                    <Link
                      href="/articles"
                      className="group flex items-center justify-between py-5"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          View public site
                        </p>

                        <p className="mt-1 text-xs text-[#999992]">
                          See what readers see
                        </p>
                      </div>

                      <span className="text-[#aaa9a1] transition-transform group-hover:translate-x-1 group-hover:text-[#3568e8]">
                        →
                      </span>
                    </Link>

                    <Link
                      href="/profile"
                      className="group flex items-center justify-between py-5 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          View profile
                        </p>

                        <p className="mt-1 text-xs text-[#999992]">
                          See your public profile
                        </p>
                      </div>

                      <span className="text-[#aaa9a1] transition-transform group-hover:translate-x-1 group-hover:text-[#3568e8]">
                        →
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Small journal index */}
                <ScrollReveal delay={180} distance={18}>
                  <div className="mt-5 border-y border-[#deded9] py-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
                        Journal index
                      </p>

                      <span className="font-mono text-[9px] text-[#aaa9a1]">
                        2026
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-y-3 text-[9px] font-semibold uppercase tracking-[0.14em]">
                      <span className="text-[#3568e8]">
                        {articles.length} articles
                      </span>

                      <span className="text-right text-[#777771]">
                        {categoryCount} topics
                      </span>

                      <span className="text-[#777771]">
                        {draftCount} drafts
                      </span>

                      <span className="text-right text-[#777771]">
                        {formatViews(totalViews)} reads
                      </span>
                    </div>
                  </div>
                </ScrollReveal>
              </aside>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL STRIP                                                        */}
      {/* ================================================================== */}

      <section>
        <ScrollReveal distance={20}>
          <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-10">
            <div className="grid grid-cols-2 divide-x divide-[#deded9] border-y border-[#deded9] sm:grid-cols-4">
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
                href="/dashboard/articles"
                className="group px-4 py-5 transition hover:bg-white sm:px-6"
              >
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
                  Manage
                </p>

                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.13em] transition-colors group-hover:text-[#3568e8]">
                  Your articles →
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
                href="/profile"
                className="group px-4 py-5 transition hover:bg-white sm:px-6"
              >
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
                  Identity
                </p>

                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.13em] transition-colors group-hover:text-[#3568e8]">
                  Your profile →
                </p>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}