import Link from "next/link";

import HomePageAnimations from "@/components/home-page-animations";

import { createClient } from "@/components/lib/supabase/server";

type Article = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  slug: string;
  created_at: string;
  published_at: string | null;
  content: string;
};

type FollowedArticle = Article & {
  author_id: string;
};

type FollowedProfile = {
  id: string;
  display_name: string | null;
  username: string | null;
};

function calculateReadTime(content: string) {
  const wordCount = content.trim()
    ? content.trim().split(/\s+/).length
    : 0;

  return `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function getTopicHref(topic: string) {
  return `/articles?topic=${encodeURIComponent(
    topic.toLowerCase().replace(/\s+/g, "-"),
  )}`;
}

export default async function Home() {
  const supabase = await createClient();

  /* ---------------------------------------------------------------------- */
  /* Authentication                                                        */
  /* ---------------------------------------------------------------------- */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* ---------------------------------------------------------------------- */
  /* Published Articles                                                     */
  /* ---------------------------------------------------------------------- */

  const { data: articleData, error: articlesError } = await supabase
    .from("articles")
    .select(
      "id, title, description, category, slug, created_at, published_at, content",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const articles = (articleData ?? []) as Article[];

  /*
   * If there is no published_at value, the article still remains usable.
   * The secondary created_at ordering handles older rows safely.
   */
  const featuredArticle = articles[0] ?? null;

  const latestArticles = articles.slice(1, 4);

  /* ---------------------------------------------------------------------- */
  /* Following Feed                                                         */
  /* ---------------------------------------------------------------------- */

  let followedArticles: FollowedArticle[] = [];
  let followedProfiles: FollowedProfile[] = [];

  if (user) {
    const { data: followData, error: followError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (!followError) {
      const followingIds = Array.from(
        new Set(
          (followData ?? [])
            .map((follow) => follow.following_id)
            .filter((id): id is string => Boolean(id) && id !== user.id),
        ),
      );

      if (followingIds.length > 0) {
        const [
          { data: followedArticleData },
          { data: followedProfileData },
        ] = await Promise.all([
          supabase
            .from("articles")
            .select(
              "id, title, description, category, slug, created_at, published_at, content, author_id",
            )
            .in("author_id", followingIds)
            .eq("status", "published")
            .order("published_at", {
              ascending: false,
              nullsFirst: false,
            })
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("profiles")
            .select("id, display_name, username")
            .in("id", followingIds),
        ]);

        followedArticles = (followedArticleData ?? []) as FollowedArticle[];
        followedProfiles = (followedProfileData ?? []) as FollowedProfile[];
      }
    }
  }

  const followedProfileMap = new Map(
    followedProfiles.map((profile) => [profile.id, profile]),
  );

  /* ---------------------------------------------------------------------- */
  /* Topics                                                                  */
  /* ---------------------------------------------------------------------- */

  const topicMap = new Map<string, number>();

  for (const article of articles) {
    const category = article.category?.trim();

    if (!category) {
      continue;
    }

    topicMap.set(category, (topicMap.get(category) ?? 0) + 1);
  }

  const topics = Array.from(topicMap.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      return a[0].localeCompare(b[0]);
    })
    .slice(0, 6)
    .map(([name, count]) => ({
      name,
      count,
    }));

  /* ---------------------------------------------------------------------- */
  /* Authentication-aware CTA                                               */
  /* ---------------------------------------------------------------------- */

  const writingHref = user
    ? "/dashboard/articles/new"
    : "/login?redirectTo=/dashboard/articles/new";

  return (
    <HomePageAnimations>
      <main className="overflow-hidden bg-[#f5f5f1] text-[#151515]">
      {/* ================================================================== */}
      {/* Hero                                                               */}
      {/* ================================================================== */}

      <section className="relative min-h-[720px] border-b border-[#dcdcd5]">
        {/* Grid + glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(53,104,232,0.16),transparent_26%),radial-gradient(circle_at_10%_70%,rgba(53,104,232,0.06),transparent_24%)]" />

        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(21,21,21,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(21,21,21,0.055)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-10 sm:px-8 md:pb-20 md:pt-16 lg:px-10">
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

            <div className="hidden items-center gap-2 rounded-full border border-[#d8d8d1] bg-white/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777770] sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3568e8]" />
              Now building
            </div>
          </div>

          <div className="mt-16 grid items-center gap-14 lg:grid-cols-[1fr_0.72fr] lg:gap-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#3568e8]">
                Build · Learn · Share
              </p>

              <h1 className="mt-5 max-w-4xl text-[4.6rem] font-bold leading-[0.84] tracking-[-0.075em] sm:text-[6rem] md:text-[7.4rem] lg:text-[8.3rem]">
                Behind
                <br />
                the <span className="text-[#3568e8]">Code.</span>
              </h1>

              <div className="mt-8 flex max-w-2xl flex-col gap-6 sm:flex-row sm:items-end">
                <p className="text-base leading-7 text-[#686861] md:text-lg">
                  Notes, lessons, projects, experiments, and ideas from the
                  process of becoming a better developer.
                </p>

                <div className="hidden h-14 w-px bg-[#d4d4cc] sm:block" />

                <p className="shrink-0 font-mono text-[10px] leading-5 text-[#8b8b84]">
                  01 / JOURNAL
                  <br />
                  02 / PROJECTS
                  <br />
                  03 / LESSONS
                </p>
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/articles"
                  className="group inline-flex items-center gap-3 rounded-xl bg-[#151515] px-5 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#2b2b2b] hover:shadow-xl hover:shadow-black/10"
                >
                  Explore articles

                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>

                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d5d5ce] bg-white/75 px-5 py-3.5 text-sm font-semibold text-[#353530] transition-all hover:border-[#3568e8]/40 hover:bg-white hover:text-[#3568e8]"
                >
                  About the journal
                </Link>
              </div>
            </div>

            {/* Code-window visual */}
            <div className="relative mx-auto w-full max-w-[460px] lg:mx-0 lg:ml-auto">
              <div className="absolute -inset-6 rounded-[2rem] bg-[#3568e8]/10 blur-3xl" />

              <div className="relative rotate-1 overflow-hidden rounded-2xl border border-[#cfcfc8] bg-[#17191d] shadow-[0_30px_80px_rgba(20,20,20,0.18)] transition-transform duration-500 hover:rotate-0">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff6257]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>

                  <span className="font-mono text-[9px] text-white/35">
                    behind-the-code.tsx
                  </span>

                  <span className="text-[9px] text-white/30">●</span>
                </div>

                <div className="px-5 py-6 font-mono text-[11px] leading-7 sm:px-7 sm:py-8 sm:text-xs">
                  <p>
                    <span className="text-[#7f8c98]">01</span>{" "}
                    <span className="text-[#c792ea]">const</span>{" "}
                    <span className="text-[#82aaff]">journal</span>{" "}
                    <span className="text-white">=</span>{" "}
                    <span className="text-[#c3e88d]">
                      &quot;Behind the Code&quot;
                    </span>
                  </p>

                  <p>
                    <span className="text-[#7f8c98]">02</span>{" "}
                    <span className="text-[#c792ea]">const</span>{" "}
                    <span className="text-[#82aaff]">ideas</span>{" "}
                    <span className="text-white">=</span>{" "}
                    <span className="text-[#89ddff]">new</span>{" "}
                    <span className="text-[#ffcb6b]">Set</span>
                    <span className="text-white">()</span>
                  </p>

                  <p>
                    <span className="text-[#7f8c98]">03</span>{" "}
                    <span className="text-[#89ddff]">while</span>{" "}
                    <span className="text-white">(</span>
                    <span className="text-[#f78c6c]">building</span>
                    <span className="text-white">) {"{"}</span>
                  </p>

                  <p>
                    <span className="text-[#7f8c98]">04</span>{" "}
                    <span className="text-white">{"  "}write(</span>
                    <span className="text-[#c3e88d]">
                      &quot;what I learn&quot;
                    </span>
                    <span className="text-white">)</span>
                  </p>

                  <p>
                    <span className="text-[#7f8c98]">05</span>{" "}
                    <span className="text-white">{"  "}build(</span>
                    <span className="text-[#c3e88d]">
                      &quot;something real&quot;
                    </span>
                    <span className="text-white">)</span>
                  </p>

                  <p>
                    <span className="text-[#7f8c98]">06</span>{" "}
                    <span className="text-white">{"  "}share(</span>
                    <span className="text-[#c3e88d]">
                      &quot;the process&quot;
                    </span>
                    <span className="text-white">)</span>
                  </p>

                  <p>
                    <span className="text-[#7f8c98]">07</span>{" "}
                    <span className="text-white">{"}"}</span>
                  </p>

                  <p className="mt-3">
                    <span className="text-[#7f8c98]">08</span>{" "}
                    <span className="text-[#89ddff]">export default</span>{" "}
                    <span className="text-[#82aaff]">journal</span>
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.03] px-5 py-3">
                  <span className="font-mono text-[9px] text-white/35">
                    main · utf-8
                  </span>

                  <span className="font-mono text-[9px] text-[#6f9aff]">
                    ready
                  </span>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-5 hidden rounded-xl border border-[#d7d7d0] bg-white px-4 py-3 shadow-lg sm:block">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#999991]">
                  Current status
                </p>

                <p className="mt-1 flex items-center gap-2 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#28a745]" />
                  Building something real
                </p>
              </div>
            </div>
          </div>

          {/* Editorial Topic Bar */}
          <div className="mt-24 border-y border-[#deded9]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              <div className="flex min-h-[58px] items-center justify-center border-b border-r border-[#deded9] px-3 py-3 lg:border-b-0">
                <span className="text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-[#3568e8]">
                  Developer Journal
                </span>
              </div>

              <div className="flex min-h-[58px] items-center justify-center border-b border-[#deded9] px-3 py-3 sm:border-r lg:border-b-0">
                <span className="text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-[#777771]">
                  Ideas
                </span>
              </div>

              <div className="flex min-h-[58px] items-center justify-center border-b border-r border-[#deded9] px-3 py-3 lg:border-b-0">
                <span className="text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-[#777771]">
                  Lessons
                </span>
              </div>

              <div className="flex min-h-[58px] items-center justify-center border-b border-[#deded9] px-3 py-3 sm:border-r lg:border-b-0">
                <span className="text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-[#777771]">
                  Projects
                </span>
              </div>

              <div className="flex min-h-[58px] items-center justify-center border-r border-[#deded9] px-3 py-3">
                <span className="text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777771]">
                  Experiments
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

      {/* ================================================================== */}
      {/* Following                                                           */}
      {/* ================================================================== */}

      {user && (
        <section className="border-b border-[#dcdcd5] bg-[#f5f5f1]">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 md:py-20 lg:px-10">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3568e8]">
                  Your feed
                </p>

                <h2 className="mt-3 text-4xl font-bold tracking-[-0.055em] sm:text-5xl">
                  From people you follow.
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-6 text-[#777770]">
                  The latest published writing from the developers you follow.
                </p>
              </div>

              <Link
                href="/articles"
                className="text-sm font-semibold text-[#55554f] underline decoration-[#c7c7c0] underline-offset-4 transition-colors hover:text-[#3568e8]"
              >
                Explore all articles →
              </Link>
            </div>

            {followedArticles.length > 0 ? (
              <div className="mt-10">
                {followedArticles.map((article, index) => {
                  const author = followedProfileMap.get(article.author_id);
                  const authorName =
                    author?.display_name?.trim() ||
                    author?.username?.trim() ||
                    "Developer";

                  return (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="group grid gap-5 border-t border-[#dcdcd5] py-7 transition-all hover:px-3 md:grid-cols-[50px_1fr_auto] md:items-start md:gap-8"
                    >
                      <span className="font-mono text-sm font-bold text-[#b2b2aa] transition-colors group-hover:text-[#3568e8]">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]">
                          <span className="text-[#3568e8]">
                            {article.category || "Article"}
                          </span>

                          <span className="text-[#b7b7af]">/</span>

                          <span className="text-[#96968e]">
                            {authorName}
                          </span>

                          <span className="text-[#b7b7af]">/</span>

                          <span className="text-[#96968e]">
                            {calculateReadTime(article.content)}
                          </span>
                        </div>

                        <h3 className="mt-3 max-w-3xl text-2xl font-bold tracking-[-0.04em] transition-colors group-hover:text-[#3568e8] sm:text-3xl">
                          {article.title}
                        </h3>

                        {article.description && (
                          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777770]">
                            {article.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-6 md:block md:text-right">
                        <time className="text-xs text-[#999991]">
                          {formatDate(
                            article.published_at ?? article.created_at,
                          )}
                        </time>

                        <span className="mt-4 block text-2xl text-[#aaa9a1] transition-all group-hover:translate-x-1 group-hover:text-[#3568e8] md:mt-8">
                          →
                        </span>
                      </div>
                    </Link>
                  );
                })}

                <div className="border-t border-[#dcdcd5]" />
              </div>
            ) : (
              <div className="mt-10 rounded-2xl border border-[#d9d9d2] bg-white p-7 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#999991]">
                  Nothing here yet
                </p>

                <h3 className="mt-3 text-2xl font-bold tracking-[-0.04em]">
                  Follow developers to build your feed.
                </h3>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[#777770]">
                  When someone you follow publishes an article, it will appear
                  here automatically.
                </p>

                <Link
                  href="/articles"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#171717] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#303030]"
                >
                  Discover articles
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* Featured                                                            */}
      {/* ================================================================== */}

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-24 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.55fr_1.45fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3568e8]">
                Featured
              </p>

              <h2 className="mt-3 text-4xl font-bold leading-none tracking-[-0.055em] sm:text-5xl">
                Start with
                <br />
                the story.
              </h2>

              <p className="mt-5 max-w-sm text-sm leading-6 text-[#777770]">
                Every project has a story behind the finished screen. Start
                here and explore the latest work from the journal.
              </p>
            </div>

            {featuredArticle ? (
              <Link
                href={`/articles/${featuredArticle.slug}`}
                className="group relative overflow-hidden rounded-[1.75rem] border border-[#d9d9d2] bg-[#f6f6f2] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#3568e8]/30 hover:shadow-[0_25px_60px_rgba(20,20,20,0.09)] sm:p-10"
              >
                <div className="absolute right-[-20px] top-[-55px] text-[180px] font-black leading-none tracking-[-0.12em] text-[#ecece5] transition-transform duration-500 group-hover:translate-x-3">
                  01
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#3568e8]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#3568e8]">
                      {featuredArticle.category || "Article"}
                    </span>

                    <span className="text-xs text-[#999991]">
                      {calculateReadTime(featuredArticle.content)}
                    </span>
                  </div>

                  <h3 className="mt-14 max-w-2xl text-3xl font-bold leading-tight tracking-[-0.05em] sm:text-4xl md:text-5xl">
                    {featuredArticle.title}
                  </h3>

                  {featuredArticle.description && (
                    <p className="mt-5 max-w-xl text-sm leading-6 text-[#777770] sm:text-base">
                      {featuredArticle.description}
                    </p>
                  )}

                  <div className="mt-8 flex items-center justify-between border-t border-[#dcdcd5] pt-5">
                    <span className="text-xs text-[#999991]">
                      {formatDate(
                        featuredArticle.published_at ??
                          featuredArticle.created_at,
                      )}
                    </span>

                    <span className="flex items-center gap-2 text-sm font-bold text-[#171717]">
                      Read story

                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="rounded-[1.75rem] border border-[#d9d9d2] bg-[#f6f6f2] p-8 sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#999991]">
                  No published articles yet
                </p>

                <h3 className="mt-4 text-3xl font-bold tracking-[-0.05em]">
                  The journal is just getting started.
                </h3>

                <p className="mt-4 max-w-xl text-sm leading-6 text-[#777770]">
                  Published articles will appear here once they are available.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Latest                                                              */}
      {/* ================================================================== */}

      <section className="border-y border-[#dcdcd5] bg-[#f5f5f1]">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-24 lg:px-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3568e8]">
                The journal
              </p>

              <h2 className="mt-3 text-4xl font-bold tracking-[-0.055em] sm:text-5xl">
                Latest notes.
              </h2>
            </div>

            <Link
              href="/articles"
              className="text-sm font-semibold text-[#55554f] underline decoration-[#c7c7c0] underline-offset-4 transition-colors hover:text-[#3568e8]"
            >
              View all articles →
            </Link>
          </div>

          <div className="mt-12">
            {latestArticles.length > 0 ? (
              <>
                {latestArticles.map((article, index) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="group grid gap-5 border-t border-[#dcdcd5] py-8 transition-all hover:px-3 md:grid-cols-[60px_1fr_auto] md:items-start md:gap-8"
                  >
                    <span className="font-mono text-sm font-bold text-[#b2b2aa] transition-colors group-hover:text-[#3568e8]">
                      0{index + 2}
                    </span>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]">
                        <span className="text-[#3568e8]">
                          {article.category || "Article"}
                        </span>

                        <span className="text-[#b7b7af]">/</span>

                        <span className="text-[#96968e]">
                          {calculateReadTime(article.content)}
                        </span>
                      </div>

                      <h3 className="mt-3 max-w-3xl text-2xl font-bold tracking-[-0.04em] transition-colors group-hover:text-[#3568e8] sm:text-3xl">
                        {article.title}
                      </h3>

                      {article.description && (
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777770]">
                          {article.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-6 md:block md:text-right">
                      <time className="text-xs text-[#999991]">
                        {formatDate(article.published_at ?? article.created_at)}
                      </time>

                      <span className="mt-4 block text-2xl text-[#aaa9a1] transition-all group-hover:translate-x-1 group-hover:text-[#3568e8] md:mt-8">
                        →
                      </span>
                    </div>
                  </Link>
                ))}

                <div className="border-t border-[#dcdcd5]" />
              </>
            ) : (
              <div className="border-y border-[#dcdcd5] py-12">
                <p className="text-sm text-[#777770]">
                  No additional published articles yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Topics                                                              */}
      {/* ================================================================== */}

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3568e8]">
                Explore
              </p>

              <h2 className="mt-3 text-4xl font-bold tracking-[-0.055em] sm:text-5xl">
                Find your
                <br />
                rabbit hole.
              </h2>

              <p className="mt-5 max-w-md text-sm leading-6 text-[#777770]">
                Pick a topic and follow the trail. The best learning usually
                starts with one question.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {topics.length > 0 ? (
                topics.map((topic, index) => (
                  <Link
                    key={topic.name}
                    href={getTopicHref(topic.name)}
                    className="group relative min-h-32 overflow-hidden rounded-2xl border border-[#d9d9d2] bg-[#f7f7f4] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#3568e8]/30 hover:bg-white hover:shadow-[0_18px_40px_rgba(20,20,20,0.07)]"
                  >
                    <span className="absolute right-4 top-2 text-6xl font-black tracking-[-0.08em] text-[#e9e9e3] transition-colors group-hover:text-[#e4eaff]">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="relative flex h-full flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#999991]">
                        Topic
                      </span>

                      <div className="mt-10 flex items-end justify-between gap-4">
                        <div>
                          <p className="font-bold tracking-tight text-[#252521]">
                            {topic.name}
                          </p>

                          <p className="mt-1 text-[11px] text-[#999991]">
                            {topic.count}{" "}
                            {topic.count === 1 ? "article" : "articles"}
                          </p>
                        </div>

                        <span className="text-xl text-[#aaa9a1] transition-all group-hover:translate-x-1 group-hover:text-[#3568e8]">
                          ↗
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-[#d9d9d2] bg-[#f7f7f4] p-6 sm:col-span-2">
                  <p className="text-sm text-[#777770]">
                    Topics will appear here once articles are published.
                  </p>
                </div>
              )}
            </div>
          </div>

          <Link
            href="/topics"
            className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-[#55554f] transition-colors hover:text-[#3568e8]"
          >
            Explore all topics →
          </Link>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Manifesto / CTA                                                    */}
      {/* ================================================================== */}

      <section className="relative overflow-hidden bg-[#151515] text-white">
        <div className="pointer-events-none absolute -right-20 -top-40 h-96 w-96 rounded-full bg-[#3568e8]/20 blur-3xl" />

        <div className="pointer-events-none absolute bottom-[-180px] left-[-80px] h-80 w-80 rounded-full bg-[#3568e8]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-28 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.45fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6f9aff]">
                The idea
              </p>

              <h2 className="mt-5 max-w-4xl text-4xl font-bold leading-[0.92] tracking-[-0.06em] sm:text-5xl md:text-7xl">
                The interesting part
                <br />
                isn&apos;t just the{" "}
                <span className="text-[#6f9aff]">code.</span>
              </h2>

              <p className="mt-7 max-w-2xl text-base leading-7 text-[#a7a7a2]">
                It is the decisions, bugs, experiments, mistakes, and lessons
                that happen while building something real.
              </p>
            </div>

            <div className="lg:justify-self-end">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                Have something worth documenting?
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={writingHref}
                  className="rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-[#151515] transition-all hover:-translate-y-0.5 hover:bg-[#f0f0ed]"
                >
                  Start writing →
                </Link>

                <Link
                  href="/about"
                  className="rounded-xl border border-white/20 px-5 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/40 hover:bg-white/5"
                >
                  About
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-20 flex flex-col justify-between gap-5 border-t border-white/10 pt-5 text-[10px] uppercase tracking-[0.16em] text-white/30 sm:flex-row">
            <span>Behind the Code · 2026</span>

            <span>Build something. Learn something. Share it.</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Database error is intentionally not rendered to users.             */}
      {/* ------------------------------------------------------------------ */}

      {articlesError && null}
      </main>
    </HomePageAnimations>
  );
}