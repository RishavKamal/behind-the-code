"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/components/lib/supabase/client";

type Topic = {
  name: string;
  slug: string;
  count: number;
};

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTopics() {
      try {
        setLoading(true);
        setError("");

        const supabase = createClient();

        const [
          {
            data: { user },
          },
          { data, error: articlesError },
        ] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("articles")
            .select("category")
            .eq("status", "published"),
        ]);

        if (articlesError) {
          throw articlesError;
        }

        if (cancelled) {
          return;
        }

        setIsLoggedIn(Boolean(user));

        const topicMap = new Map<string, number>();

        for (const article of data ?? []) {
          const category =
            typeof article.category === "string"
              ? article.category.trim()
              : "";

          if (!category) {
            continue;
          }

          const normalizedCategory = category.toLowerCase();

          const existingCategory = Array.from(topicMap.keys()).find(
            (topic) => topic.toLowerCase() === normalizedCategory,
          );

          if (existingCategory) {
            topicMap.set(
              existingCategory,
              (topicMap.get(existingCategory) ?? 0) + 1,
            );
          } else {
            topicMap.set(category, 1);
          }
        }

        const topicList: Topic[] = Array.from(topicMap.entries())
          .map(([name, count]) => ({
            name,
            count,
            slug: name.toLowerCase().replace(/\s+/g, "-"),
          }))
          .sort((a, b) => {
            if (b.count !== a.count) {
              return b.count - a.count;
            }

            return a.name.localeCompare(b.name);
          });

        setTopics(topicList);
      } catch (topicError) {
        console.error("Failed to load topics:", topicError);

        if (!cancelled) {
          setError("Unable to load topics right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTopics();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return topics;
    }

    return topics.filter((topic) =>
      topic.name.toLowerCase().includes(query),
    );
  }, [topics, searchQuery]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f5f1] text-[#151515]">
      {/* =========================================================
          HERO / TOPIC INDEX
      ========================================================= */}
      <section
        className="relative overflow-hidden border-b border-[#dcdcd5]"
        style={{
          background:
            "radial-gradient(circle at 88% 18%, rgba(155,182,255,0.30) 0%, rgba(155,182,255,0.14) 24%, transparent 48%), #f5f5f1",
        }}
      >
        {/* Editorial grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(rgba(21,21,21,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(21,21,21,0.055) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            maskImage:
              "linear-gradient(to bottom, black 0%, black 88%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 88%, transparent 100%)",
          }}
        />

        {/* Soft white glow */}
        <div
          className="pointer-events-none absolute -left-32 top-1/2 h-[380px] w-[380px] -translate-y-1/2 rounded-full blur-[120px]"
          style={{
            background: "rgba(255,255,255,0.75)",
          }}
        />

        {/* Stronger blue atmosphere on the right */}
        <div
          className="pointer-events-none absolute -right-32 -top-24 h-[520px] w-[520px] rounded-full blur-[130px]"
          style={{
            background: "rgba(155,182,255,0.18)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-14 sm:px-8 md:pb-24 md:pt-16 lg:px-10">
          {/* Small identity */}
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

            <div className="hidden rounded-full border border-[#d8d8d1] bg-white/75 px-4 py-2 backdrop-blur-sm sm:block">
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#777770]">
                Topic Index
              </span>
            </div>
          </div>

          {/* Hero content */}
          <div className="mt-20 grid gap-14 lg:grid-cols-[1fr_0.55fr] lg:items-end lg:gap-20">
            {/* Left */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#3568e8]">
                Explore · Discover · Learn
              </p>

              <h1 className="mt-6 max-w-4xl text-[4.5rem] font-bold leading-[0.86] tracking-[-0.075em] sm:text-[6rem] md:text-[7.5rem] lg:text-[8.2rem]">
                Find your
                <br />
                <span className="text-[#3568e8]">topic.</span>
              </h1>

              <p className="mt-8 max-w-2xl text-base leading-7 text-[#686861] md:text-lg">
                Explore the ideas, technologies, projects, and lessons
                documented throughout Behind the Code.
              </p>
            </div>

            {/* Right journal card */}
            <div className="relative mx-auto w-full max-w-[430px] lg:mx-0 lg:ml-auto">
              <div
                className="absolute -inset-5 rounded-[2rem] blur-3xl"
                style={{
                  background: "rgba(155,182,255,0.16)",
                }}
              />

              <div className="relative overflow-hidden rounded-[1.75rem] border border-[#d6d6cf] bg-white/95 shadow-[0_25px_70px_rgba(20,20,20,0.08)] backdrop-blur-sm">
                {/* Card header */}
                <div className="flex items-center justify-between border-b border-[#deded9] px-6 py-5">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#999991]">
                      Journal index
                    </p>

                    <p className="mt-1 text-sm font-bold">
                      What happens behind the code?
                    </p>
                  </div>

                  <span className="font-mono text-[9px] text-[#999991]">
                    2026
                  </span>
                </div>

                {/* Card items */}
                <div className="divide-y divide-[#deded9]">
                  <div className="flex items-center gap-5 px-6 py-6">
                    <span className="font-mono text-[9px] text-[#aaa9a1]">
                      01
                    </span>

                    <div>
                      <p className="text-lg font-bold tracking-tight">
                        Learn
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#777771]">
                        Understand concepts, experiments, debugging, and
                        decisions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 px-6 py-6">
                    <span className="font-mono text-[9px] text-[#aaa9a1]">
                      02
                    </span>

                    <div>
                      <p className="text-lg font-bold tracking-tight">
                        Build
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#777771]">
                        Turn ideas into projects and real software.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 px-6 py-6">
                    <span className="font-mono text-[9px] text-[#aaa9a1]">
                      03
                    </span>

                    <div>
                      <p className="text-lg font-bold tracking-tight">
                        Share
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#777771]">
                        Document discoveries so others can learn too.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="flex items-center justify-between border-t border-[#deded9] bg-[#f7f7f4] px-6 py-4">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#999991]">
                    Current focus
                  </span>

                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3568e8]" />
                    Document the process.
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
                  Topics
                </span>
              </div>

              <div className="flex min-h-[58px] items-center justify-center border-b border-[#deded9] px-3 py-3 sm:border-r lg:border-b-0">
                <span className="text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-[#777771]">
                  Technology
                </span>
              </div>

              <div className="flex min-h-[58px] items-center justify-center border-b border-r border-[#deded9] px-3 py-3 lg:border-b-0">
                <span className="text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-[#777771]">
                  Development
                </span>
              </div>

              <div className="flex min-h-[58px] items-center justify-center border-b border-[#deded9] px-3 py-3 sm:border-r lg:border-b-0">
                <span className="text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-[#777771]">
                  Projects
                </span>
              </div>

              <div className="flex min-h-[58px] items-center justify-center border-r border-[#deded9] px-3 py-3">
                <span className="text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-[#777771]">
                  Learning
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

      {/* =========================================================
          BROWSE TOPICS
      ========================================================= */}
      <section className="relative overflow-hidden bg-white">
        {/* Very subtle blue atmosphere */}
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full blur-[130px]"
          style={{
            background: "rgba(155,182,255,0.10)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-24 lg:px-10">
          {/* Section heading */}
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3568e8]">
                The index
              </p>

              <h2 className="mt-3 text-4xl font-bold tracking-[-0.055em] sm:text-5xl">
                Browse topics
                <span className="text-[#3568e8]">.</span>
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-6 text-[#777770]">
                Every topic below comes from published articles in the
                journal.
              </p>
            </div>

            {/* Search */}
            <div className="w-full md:max-w-xs">
              <label htmlFor="topic-search" className="sr-only">
                Search topics
              </label>

              <div className="relative">
                <input
                  id="topic-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search topics..."
                  className="h-12 w-full appearance-none rounded-xl border border-[#d9d9d2] bg-[#f8f8f5] px-4 pr-10 text-sm text-[#171717] outline-none transition-all placeholder:text-[#aaa9a3] focus:border-[#3568e8]/50 focus:bg-white focus:ring-4 focus:ring-[#3568e8]/5"
                />

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#999991]">
                  /
                </span>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-[1.5rem] border border-[#deded9] bg-[#f5f5f1]"
                />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mt-12 rounded-[1.5rem] border border-[#deded9] bg-[#f7f7f4] px-6 py-14 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#151515] text-sm font-bold text-white">
                !
              </div>

              <p className="mt-5 text-lg font-bold">
                Unable to load topics
              </p>

              <p className="mt-2 text-sm text-[#777771]">
                {error}
              </p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredTopics.length === 0 && (
            <div className="mt-12 rounded-[1.5rem] border border-[#deded9] bg-[#f7f7f4] px-6 py-14 text-center">
              {topics.length === 0 ? (
                <>
                  <p className="text-lg font-bold">
                    No topics yet.
                  </p>

                  <p className="mt-2 text-sm text-[#777771]">
                    Published articles will automatically appear here as
                    topics.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold">
                    No matching topics.
                  </p>

                  <p className="mt-2 text-sm text-[#777771]">
                    Try a different search term.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Topic cards */}
          {!loading && !error && filteredTopics.length > 0 && (
            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTopics.map((topic, index) => (
                <Link
                  key={topic.name}
                  href={`/articles?topic=${encodeURIComponent(
                    topic.slug,
                  )}`}
                  className="group relative min-h-[190px] overflow-hidden rounded-[1.5rem] border border-[#d5d5ce] bg-[#f6f6f2] p-6 shadow-[0_8px_30px_rgba(20,20,20,0.025)] transition-all duration-300 hover:-translate-y-1 hover:border-[#3568e8]/35 hover:bg-white hover:shadow-[0_22px_50px_rgba(20,20,20,0.08)]"
                >
                  {/* Large background number */}
                  <span className="absolute -right-2 -top-6 text-[130px] font-black leading-none tracking-[-0.12em] text-[#e9e9e3] transition-colors duration-300 group-hover:text-[#e1e8ff]">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#999991]">
                        Topic
                      </span>

                      <span className="font-mono text-[9px] text-[#aaa9a1]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="mt-12">
                      <h3 className="max-w-[85%] text-2xl font-bold tracking-[-0.04em] transition-colors group-hover:text-[#3568e8]">
                        {topic.name}
                      </h3>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-[#777771]">
                          {topic.count}{" "}
                          {topic.count === 1
                            ? "article"
                            : "articles"}
                        </span>

                        <span className="text-xl text-[#aaa9a1] transition-all group-hover:translate-x-1 group-hover:text-[#3568e8]">
                          ↗
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          WRITE AN ARTICLE CTA
      ========================================================= */}
      <section className="relative overflow-hidden border-t border-[#262626] bg-[#151515] text-white">
        {/* Soft blue atmospheric glow */}
        <div
          className="pointer-events-none absolute -right-24 -top-32 h-[500px] w-[500px] rounded-full blur-[130px]"
          style={{
            background: "rgba(155,182,255,0.14)",
          }}
        />

        {/* Very subtle secondary glow */}
        <div
          className="pointer-events-none absolute -left-40 bottom-[-220px] h-[420px] w-[420px] rounded-full blur-[130px]"
          style={{
            background: "rgba(255,255,255,0.035)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-24 lg:px-10">
          <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#9bb6ff]">
                Keep building
              </p>

              <h2 className="mt-4 text-4xl font-bold leading-[0.95] tracking-[-0.055em] text-white sm:text-5xl md:text-6xl">
                Have something
                <br />
                worth documenting?
              </h2>

              <p className="mt-6 max-w-xl text-sm leading-6 text-[#a8a8a1]">
                Turn your projects, experiments, and lessons into something
                another developer can learn from.
              </p>
            </div>

            <Link
              href={isLoggedIn ? "/dashboard/articles/new" : "/register"}
              className="group inline-flex w-fit items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#151515] transition-all hover:-translate-y-0.5 hover:bg-[#f0f0ed] hover:shadow-xl hover:shadow-black/20"
            >
              Write an article

              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>

          {/* Bottom editorial line */}
          <div className="mt-16 flex items-center justify-between border-t border-[#303030] pt-5">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#666660]">
              Behind the Code
            </span>

            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#666660]">
              Build · Learn · Share
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}