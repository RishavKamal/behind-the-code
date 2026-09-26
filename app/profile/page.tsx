"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/components/lib/supabase/client";

type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  created_at: string | null;
};

type Article = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  views: number | null;
  published_at: string | null;
  created_at: string;
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

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "BT";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatViews(value: number | null) {
  const views = value ?? 0;

  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (views >= 1000) {
    return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }

  return String(views);
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authChecking, setAuthChecking] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (!cancelled) {
            setAuthChecking(false);
            router.replace("/login?redirectTo=%2Fprofile");
          }

          return;
        }

        if (!cancelled) {
          setAuthChecking(false);
        }

        const [
          { data: profileData, error: profileError },
          { data: articleData, error: articleError },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, display_name, username, avatar_url, bio, website, github_url, linkedin_url, created_at",
            )
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("articles")
            .select(
              "id, title, slug, description, category, views, published_at, created_at",
            )
            .eq("author_id", user.id)
            .eq("status", "published")
            .order("published_at", {
              ascending: false,
              nullsFirst: false,
            }),
        ]);

        if (profileError) {
          console.error("Profile loading error:", profileError);
        }

        if (articleError) {
          console.error(
            "Profile articles loading error:",
            articleError,
          );
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

        const fallbackName =
          metadataName ||
          user.email?.split("@")[0] ||
          "Developer";

        setProfile({
          id: user.id,
          display_name:
            profileData?.display_name?.trim() || fallbackName,
          username:
            profileData?.username?.trim() ||
            metadataUsername ||
            null,
          avatar_url: profileData?.avatar_url ?? null,
          bio: profileData?.bio?.trim() || null,
          website: profileData?.website?.trim() || null,
          github_url: profileData?.github_url?.trim() || null,
          linkedin_url: profileData?.linkedin_url?.trim() || null,
          created_at:
            profileData?.created_at ??
            user.created_at ??
            null,
        });

        setArticles(articleData ?? []);
        setLoading(false);
      } catch (profileError) {
        console.error("Profile loading error:", profileError);

        if (!cancelled) {
          setError(
            "Something went wrong while loading your profile.",
          );
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const displayName = useMemo(() => {
    return profile?.display_name?.trim() || "Developer";
  }, [profile]);

  const username = useMemo(() => {
    return profile?.username?.trim() || "developer";
  }, [profile]);

  const initials = useMemo(
    () => getInitials(displayName),
    [displayName],
  );

  const totalViews = useMemo(
    () =>
      articles.reduce(
        (total, article) => total + (article.views ?? 0),
        0,
      ),
    [articles],
  );

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      articles
        .map((article) => article.category?.trim())
        .filter(Boolean),
    );

    return Array.from(uniqueCategories);
  }, [articles]);

  if (authChecking || loading) {
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

          <div className="pointer-events-none absolute right-[8%] top-[-180px] h-[500px] w-[500px] rounded-full bg-[#dfe8ff]/40 blur-[120px]" />

          <div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:px-10">
            <div className="animate-pulse">
              <div className="h-3 w-24 rounded bg-[#deded9]" />

              <div className="mt-8 h-12 max-w-md rounded bg-[#deded9]" />

              <div className="mt-4 h-4 max-w-sm rounded bg-[#e7e7e2]" />
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
              Profile
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
              Unable to load profile.
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
      {/* =========================================================
          PROFILE HERO
      ========================================================= */}
      <section className="relative border-b border-[#deded9]">
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
        <div className="pointer-events-none absolute right-[4%] top-[-140px] h-[520px] w-[520px] rounded-full bg-[#dfe8ff]/45 blur-[130px]" />

        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-12 sm:px-8 lg:px-10 lg:pb-24 lg:pt-16">
          {/* Top navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-[#777771] transition hover:text-[#171717]"
            >
              <span aria-hidden="true">←</span>
              Back to home
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 rounded-xl border border-[#deded9] bg-white/90 px-4 py-2.5 text-xs font-semibold text-[#171717] transition hover:border-[#bdbdb6]"
              >
                Edit profile
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-[#deded9] bg-white/90 px-4 py-2.5 text-xs font-semibold text-[#171717] transition hover:border-[#bdbdb6]"
              >
                Go to dashboard
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Main profile area */}
          <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3568e8]">
                Developer Profile
              </p>

              <div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-center">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="absolute -inset-2 rounded-full border border-[#deded9]" />

                  <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#171717] text-2xl font-semibold text-white shadow-[0_15px_35px_rgba(20,20,20,0.12)] sm:h-28 sm:w-28">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={displayName}
                        width={112}
                        height={112}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                </div>

                <div>
                  <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-semibold leading-[0.9] tracking-[-0.065em]">
                    {displayName}
                  </h1>

                  <p className="mt-4 text-sm text-[#777771] sm:text-base">
                    @{username}
                  </p>
                </div>
              </div>

              <p className="mt-8 max-w-2xl text-base leading-7 text-[#777771] sm:text-lg">
                {profile?.bio ||
                  "A developer documenting projects, experiments, lessons, and the things learned while building."}
              </p>
            </div>

            {/* Profile index card */}
            <div className="relative">
              <div className="absolute -right-3 -top-3 h-full w-full rounded-3xl border border-[#deded9] bg-white/50" />

              <div className="relative rounded-3xl border border-[#deded9] bg-white p-7 shadow-[0_25px_60px_rgba(20,20,20,0.06)]">
                <div className="flex items-center justify-between border-b border-[#deded9] pb-5">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#999992]">
                      Profile Index
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      Behind the work
                    </p>
                  </div>

                  <span className="font-mono text-[10px] text-[#999992]">
                    2026
                  </span>
                </div>

                <div className="divide-y divide-[#deded9]">
                  <div className="flex items-center justify-between py-5">
                    <div>
                      <p className="text-xs text-[#999992]">
                        Published
                      </p>

                      <p className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                        {articles.length}
                      </p>
                    </div>

                    <span className="font-mono text-[10px] text-[#999992]">
                      ARTICLES
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-5">
                    <div>
                      <p className="text-xs text-[#999992]">
                        Total views
                      </p>

                      <p className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                        {formatViews(totalViews)}
                      </p>
                    </div>

                    <span className="font-mono text-[10px] text-[#999992]">
                      READS
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-5">
                    <div>
                      <p className="text-xs text-[#999992]">
                        Topics
                      </p>

                      <p className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                        {categories.length}
                      </p>
                    </div>

                    <span className="font-mono text-[10px] text-[#999992]">
                      AREAS
                    </span>
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between border-t border-[#deded9] pt-5">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
                    Member since
                  </span>

                  <span className="text-xs font-medium text-[#555550]">
                    {formatDate(profile?.created_at ?? null)}
                  </span>
                </div>
              </div>

              {/* Floating status */}
              <div className="absolute -bottom-6 -left-3 rounded-xl border border-[#deded9] bg-[#171717] px-5 py-4 text-white shadow-[0_15px_35px_rgba(20,20,20,0.12)] sm:-left-7">
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Current focus
                </p>

                <p className="mt-1.5 text-xs font-medium">
                  Building and documenting.
                </p>
              </div>
            </div>
          </div>

          {/* =====================================================
              FULL WIDTH PROFILE INDEX BAR
          ===================================================== */}
          <div className="mt-20 border-y border-[#deded9]">
            <div className="grid grid-cols-2 divide-x divide-[#deded9] sm:grid-cols-4">
              {/* Username */}
              <div className="min-w-0 px-4 py-5 sm:px-6">
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
                  Username
                </p>

                <p className="mt-2 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3568e8]">
                  @{username}
                </p>
              </div>

              {/* Published */}
              <div className="min-w-0 px-4 py-5 sm:px-6">
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
                  Published
                </p>

                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#555550]">
                  {articles.length}{" "}
                  {articles.length === 1 ? "article" : "articles"}
                </p>
              </div>

              {/* Views */}
              <div className="min-w-0 px-4 py-5 sm:px-6">
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
                  Reach
                </p>

                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#555550]">
                  {formatViews(totalViews)} views
                </p>
              </div>

              {/* Focus */}
              <div className="min-w-0 px-4 py-5 sm:px-6">
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
                  Focus
                </p>

                <p className="mt-2 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3568e8]">
                  Keep building
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {(profile.website || profile.github_url || profile.linkedin_url) && (
        <section className="border-b border-[#deded9]">
          <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8 lg:px-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="mr-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
                Links
              </span>
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#deded9] bg-white px-4 py-2 text-xs font-medium text-[#555550] transition hover:border-[#bdbdb6] hover:text-[#171717]"
                >
                  Website
                </a>
              )}
              {profile.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#deded9] bg-white px-4 py-2 text-xs font-medium text-[#555550] transition hover:border-[#bdbdb6] hover:text-[#171717]"
                >
                  GitHub
                </a>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#deded9] bg-white px-4 py-2 text-xs font-medium text-[#555550] transition hover:border-[#bdbdb6] hover:text-[#171717]"
                >
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          PUBLISHED ARTICLES
      ========================================================= */}
      <section className="border-b border-[#deded9]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
            {/* Section label */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#777771]">
                01 / Writing
              </p>

              <p className="mt-4 max-w-[160px] text-xs leading-5 text-[#999992]">
                Published work and notes from the development journey.
              </p>
            </div>

            {/* Articles */}
            <div>
              <div className="flex items-end justify-between border-b border-[#deded9] pb-6">
                <div>
                  <h2 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                    Published articles
                  </h2>

                  <p className="mt-3 text-sm text-[#777771]">
                    {articles.length === 0
                      ? "Nothing published yet."
                      : `${articles.length} ${
                          articles.length === 1
                            ? "article"
                            : "articles"
                        } in the journal.`}
                  </p>
                </div>

                {articles.length > 0 && (
                  <span className="hidden font-mono text-[10px] text-[#999992] sm:block">
                    {String(articles.length).padStart(2, "0")}
                  </span>
                )}
              </div>

              {articles.length > 0 ? (
                <div className="divide-y divide-[#deded9]">
                  {articles.map((article, index) => (
                    <article
                      key={article.id}
                      className="group py-8"
                    >
                      <Link
                        href={`/articles/${article.slug}`}
                        className="grid gap-5 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:items-start sm:gap-7"
                      >
                        <span className="font-mono text-[10px] text-[#aaa9a1]">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em]">
                            <span className="text-[#3568e8]">
                              {article.category}
                            </span>

                            <span className="text-[#c7c7c1]">
                              ·
                            </span>

                            <span className="text-[#999991]">
                              {formatDate(
                                article.published_at ??
                                  article.created_at,
                              )}
                            </span>
                          </div>

                          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em] transition-colors group-hover:text-[#3568e8] sm:text-3xl">
                            {article.title}
                          </h3>

                          {article.description && (
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777771]">
                              {article.description}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#aaa9a1]">
                            <span>
                              {formatViews(article.views)} views
                            </span>

                            <span>·</span>

                            <span>Read article</span>
                          </div>
                        </div>

                        <span className="hidden text-xl text-[#c4c4be] transition-transform group-hover:translate-x-1 group-hover:text-[#3568e8] sm:block">
                          →
                        </span>
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-8 rounded-3xl border border-dashed border-[#d5d5cf] bg-white px-6 py-20 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3568e8]">
                    The journal is quiet
                  </p>

                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.035em]">
                    No published articles yet.
                  </h3>

                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#777771]">
                    Start documenting something you are building, learning,
                    debugging, or experimenting with.
                  </p>

                  <Link
                    href="/dashboard/articles/new"
                    className="mt-7 inline-flex items-center gap-3 rounded-xl bg-[#171717] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#292929]"
                  >
                    Write an article
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:px-10 lg:py-28">
          <div className="relative overflow-hidden rounded-3xl border border-[#deded9] bg-white p-8 sm:p-12 lg:p-16">
            <div className="pointer-events-none absolute right-[-80px] top-[-100px] h-72 w-72 rounded-full bg-[#dfe8ff]/40 blur-[90px]" />

            <div className="relative flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3568e8]">
                  Keep Building
                </p>

                <h2 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                  Build something worth documenting.
                </h2>

                <p className="mt-6 max-w-xl text-[15px] leading-7 text-[#777771]">
                  Projects become more useful when the decisions,
                  experiments, and lessons behind them are shared.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3">
                <Link
                  href="/dashboard/articles/new"
                  className="inline-flex items-center gap-3 rounded-xl bg-[#171717] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#292929]"
                >
                  Write an article
                  <span aria-hidden="true">→</span>
                </Link>

                <Link
                  href="/articles"
                  className="inline-flex items-center rounded-xl border border-[#deded9] bg-white px-6 py-3.5 text-sm font-semibold text-[#171717] transition hover:border-[#bdbdb6]"
                >
                  Explore articles
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}