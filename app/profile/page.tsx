"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import ScrollReveal from "@/components/scroll-reveal";
import { createClient } from "@/components/lib/supabase/client";

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  created_at: string;
};

type Article = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  content: string;
  published_at: string | null;
};

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "U";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function calculateReadTime(content: string) {
  const words = content.trim()
    ? content.trim().split(/\s+/).length
    : 0;

  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(date: string | null) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(userError);
          setError("Unable to load your account.");
          setLoading(false);
          return;
        }

        if (!user) {
          setError("You need to be logged in to view your profile.");
          setLoading(false);
          return;
        }

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "id, username, display_name, bio, avatar_url, website, github_url, linkedin_url, created_at",
          )
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(profileError);
          setError("Unable to load your profile.");
          setLoading(false);
          return;
        }

        if (!profileData) {
          setError("Your profile could not be found.");
          setLoading(false);
          return;
        }

        const {
          data: articleData,
          error: articleError,
        } = await supabase
          .from("articles")
          .select(
            "id, slug, title, description, category, content, published_at",
          )
          .eq("author_id", user.id)
          .eq("status", "published")
          .order("published_at", { ascending: false });

        if (articleError) {
          console.error(articleError);
          setError("Unable to load your articles.");
          setLoading(false);
          return;
        }

        setProfile(profileData);
        setArticles(articleData ?? []);
      } catch (err) {
        console.error(err);
        setError("Something went wrong while loading your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const displayName = useMemo(() => {
    if (!profile) {
      return "User";
    }

    return (
      profile.display_name?.trim() ||
      profile.username?.trim() ||
      "User"
    );
  }, [profile]);

  const initials = useMemo(() => {
    return getInitials(displayName);
  }, [displayName]);

  if (loading) {
    return (
      <main className="min-h-screen">
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center">
            <p className="text-sm text-[#777771]">
              Loading profile...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen">
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <ScrollReveal distance={12}>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#777771]">
              Profile
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-[#171717]">
              Profile unavailable
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#777771]">
              {error || "We could not load this profile."}
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-lg bg-[#171717] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#303030]"
            >
              Back to home
            </Link>
          </ScrollReveal>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <ScrollReveal distance={14}>
        <section>
          <div className="mx-auto max-w-6xl px-6 pt-14 md:pt-16">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-[#777771] transition-colors hover:text-[#171717]"
            >
              <span aria-hidden="true">←</span>
              <span>Back to home</span>
            </Link>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal distance={20} delay={80}>
        <section className="mx-auto max-w-6xl px-6 pb-14 pt-8 md:pb-16 md:pt-10">
          <div className="overflow-hidden rounded-2xl border border-[#deded9] bg-white">
            <div className="h-28 bg-[#171717] md:h-32" />

            <div className="relative px-6 pb-7 md:px-8 md:pb-9">
              <div className="-mt-9 flex items-end justify-between md:-mt-10">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#171717] text-xl font-semibold text-white md:h-22 md:w-22">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.display_name || displayName}
                      width={80}
                      height={80}
                      unoptimized
                      className="h-20 w-20 rounded-full border border-[#deded9] object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                <Link
                  href="/dashboard"
                  className="mb-1 rounded-lg border border-[#deded9] bg-white px-4 py-2.5 text-sm text-[#555550] transition-colors hover:border-[#bdbdb7] hover:bg-[#f8f8f6] hover:text-[#171717]"
                >
                  Go to dashboard
                </Link>
              </div>

              <div className="mt-5">
                <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#171717] md:text-4xl">
                  {displayName}
                </h1>

                {profile.username && (
                  <p className="mt-1 text-sm text-[#999992]">
                    @{profile.username}
                  </p>
                )}

                {profile.bio && (
                  <p className="mt-5 max-w-2xl text-sm leading-6 text-[#555550] md:text-base md:leading-7">
                    {profile.bio}
                  </p>
                )}

                {(profile.website ||
                  profile.github_url ||
                  profile.linkedin_url) && (
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-[#deded9] px-3.5 py-2 text-sm text-[#555550] transition-colors hover:border-[#bdbdb7] hover:bg-[#f8f8f6] hover:text-[#171717]"
                      >
                        Website
                      </a>
                    )}

                    {profile.github_url && (
                      <a
                        href={profile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-[#deded9] px-3.5 py-2 text-sm text-[#555550] transition-colors hover:border-[#bdbdb7] hover:bg-[#f8f8f6] hover:text-[#171717]"
                      >
                        GitHub
                      </a>
                    )}

                    {profile.linkedin_url && (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-[#deded9] px-3.5 py-2 text-sm text-[#555550] transition-colors hover:border-[#bdbdb7] hover:bg-[#f8f8f6] hover:text-[#171717]"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8 border-t border-[#deded9] pt-7">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#999992]">
                  Account information
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[#999992]">
                      Username
                    </p>

                    <p className="mt-1 text-sm text-[#171717]">
                      {profile.username
                        ? `@${profile.username}`
                        : "Not set"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#999992]">
                      Member since
                    </p>

                    <p className="mt-1 text-sm text-[#171717]">
                      {formatDate(profile.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <section className="border-t border-[#deded9] bg-[#fafaf8]">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-16">
          <ScrollReveal distance={16}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#777771]">
                  Writing
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#171717]">
                  Published articles
                </h2>
              </div>

              <span className="text-sm text-[#999992]">
                {articles.length}{" "}
                {articles.length === 1 ? "article" : "articles"}
              </span>
            </div>
          </ScrollReveal>

          {articles.length > 0 ? (
            <div className="mt-8 grid gap-4">
              {articles.map((article, index) => {
                const readTime = calculateReadTime(article.content);

                return (
                  <ScrollReveal
                    key={article.id}
                    delay={Math.min(index * 70, 350)}
                    distance={18}
                  >
                    <Link
                      href={`/articles/${article.slug}`}
                      className="group block rounded-xl border border-[#deded9] bg-white p-6 transition-colors hover:border-[#bdbdb7]"
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="max-w-3xl">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.13em] text-[#777771]">
                            <span>{article.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{readTime} min read</span>

                            {article.published_at && (
                              <>
                                <span aria-hidden="true">·</span>
                                <time>
                                  {formatDate(article.published_at)}
                                </time>
                              </>
                            )}
                          </div>

                          <h3 className="mt-3 text-xl font-semibold tracking-[-0.025em] text-[#171717] transition-colors group-hover:text-[#555550] md:text-2xl">
                            {article.title}
                          </h3>

                          {article.description && (
                            <p className="mt-2 text-sm leading-6 text-[#777771]">
                              {article.description}
                            </p>
                          )}
                        </div>

                        <span className="shrink-0 text-sm text-[#777771] transition-colors group-hover:text-[#171717]">
                          Read article →
                        </span>
                      </div>
                    </Link>
                  </ScrollReveal>
                );
              })}
            </div>
          ) : (
            <ScrollReveal distance={22} delay={100}>
              <div className="mt-8 rounded-xl border border-dashed border-[#deded9] bg-white px-6 py-16 text-center">
                <h3 className="text-lg font-semibold text-[#171717]">
                  No published articles yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#777771]">
                  Published articles will appear here once they are
                  available.
                </p>

                <Link
                  href="/dashboard/articles/new"
                  className="mt-6 inline-flex rounded-lg bg-[#171717] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#303030]"
                >
                  Write an article
                </Link>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      <ScrollReveal distance={12}>
        <section className="border-t border-[#deded9]">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="flex flex-col gap-3 text-xs text-[#999992] sm:flex-row sm:items-center sm:justify-between">
              <p>
                Your developer profile on Behind the Code.
              </p>

              <div className="flex items-center gap-4">
                <Link
                  href="/settings"
                  className="transition-colors hover:text-[#171717]"
                >
                  Edit profile
                </Link>

                <Link
                  href="/dashboard"
                  className="transition-colors hover:text-[#171717]"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </main>
  );
}
