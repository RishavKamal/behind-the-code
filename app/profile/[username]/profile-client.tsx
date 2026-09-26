"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "BT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

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

export default function PublicProfileClient({
  username: initialUsername,
}: {
  username: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const profileUsername = initialUsername;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!profileUsername) {
        setError("This profile could not be found.");
        setLoading(false);
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (cancelled) return;

        setCurrentUserId(user?.id ?? null);
        setIsLoggedIn(Boolean(user));

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, display_name, username, avatar_url, bio, website, github_url, linkedin_url, created_at",
          )
          .eq("username", profileUsername)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profileData) {
          setError("This profile could not be found.");
          setLoading(false);
          return;
        }

        const [
          { data: articleData, error: articleError },
          { data: followerData, error: followerError },
        ] = await Promise.all([
          supabase
            .from("articles")
            .select(
              "id, title, slug, description, category, views, published_at, created_at",
            )
            .eq("author_id", profileData.id)
            .eq("status", "published")
            .order("published_at", {
              ascending: false,
              nullsFirst: false,
            }),
          supabase.rpc("get_follower_count", {
            target_profile_id: profileData.id,
          }),
        ]);

        if (articleError) throw articleError;
        if (followerError) throw followerError;

        let following = false;

        if (user && user.id !== profileData.id) {
          const { data: followData, error: followError } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id)
            .eq("following_id", profileData.id)
            .maybeSingle();

          if (followError) throw followError;
          following = Boolean(followData);
        }

        if (cancelled) return;

        setProfile(profileData);
        setArticles(articleData ?? []);
        setFollowerCount(Number(followerData ?? 0));
        setIsFollowing(following);
        setLoading(false);
      } catch (loadError) {
        console.error("Public profile loading error:", loadError);

        if (!cancelled) {
          setError("Something went wrong while loading this profile.");
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [profileUsername, supabase]);

  async function handleFollow() {
    if (!profile) return;

    if (!isLoggedIn) {
      router.push(
        `/login?redirectTo=${encodeURIComponent(`/profile/${profile.username}`)}`,
      );
      return;
    }

    if (followLoading) return;

    setFollowLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(
          `/login?redirectTo=${encodeURIComponent(`/profile/${profile.username}`)}`,
        );
        return;
      }

      if (user.id === profile.id) return;

      if (isFollowing) {
        const { error: deleteError } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profile.id);

        if (deleteError) throw deleteError;

        setIsFollowing(false);
        setFollowerCount((count) => Math.max(0, count - 1));
      } else {
        const { error: insertError } = await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: profile.id,
        });

        if (insertError) throw insertError;

        setIsFollowing(true);
        setFollowerCount((count) => count + 1);
      }
    } catch (followError) {
      console.error("Follow action error:", followError);
      setError("We could not update your follow status. Please try again.");
    } finally {
      setFollowLoading(false);
    }
  }

  const displayName = useMemo(
    () => profile?.display_name?.trim() || "Developer",
    [profile],
  );

  const username = useMemo(
    () => profile?.username?.trim() || profileUsername,
    [profile, profileUsername],
  );

  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const totalViews = useMemo(
    () => articles.reduce((total, article) => total + (article.views ?? 0), 0),
    [articles],
  );

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      articles.map((article) => article.category?.trim()).filter(Boolean),
    );

    return Array.from(uniqueCategories);
  }, [articles]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f8f5] text-[#171717]">
        <section className="relative overflow-hidden border-b border-[#deded9]">
          <div className="pointer-events-none absolute inset-0 opacity-60" />
          <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:px-10">
            <div className="animate-pulse">
              <div className="h-3 w-24 rounded bg-[#deded9]" />
              <div className="mt-8 h-12 max-w-md rounded bg-[#deded9]" />
              <div className="mt-4 h-4 max-w-sm rounded bg-[#e7e7e2]" />
              <div className="mt-10 h-24 max-w-xl rounded bg-[#e7e7e2]" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-[#f8f8f5] text-[#171717]">
        <section className="mx-auto flex min-h-[70vh] max-w-6xl items-center px-6 sm:px-8 lg:px-10">
          <div className="w-full border-y border-[#deded9] py-20 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3568e8]">
              Profile
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
              {error || "Profile not found."}
            </h1>
            <Link
              href="/articles"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#171717] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#292929]"
            >
              Explore articles
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const isOwnProfile = currentUserId === profile.id;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f8f5] text-[#171717]">
      <section className="relative border-b border-[#deded9]">
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

        <div className="pointer-events-none absolute right-[4%] top-[-140px] h-[520px] w-[520px] rounded-full bg-[#dfe8ff]/45 blur-[130px]" />

        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-12 sm:px-8 lg:px-10 lg:pb-24 lg:pt-16">
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
                href="/articles"
                className="inline-flex items-center gap-2 rounded-xl border border-[#deded9] bg-white/90 px-4 py-2.5 text-xs font-semibold text-[#171717] transition hover:border-[#bdbdb6]"
              >
                Explore articles
              </Link>

              {isLoggedIn && (
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#deded9] bg-white/90 px-4 py-2.5 text-xs font-semibold text-[#171717] transition hover:border-[#bdbdb6]"
                >
                  My profile
                </Link>
              )}
            </div>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3568e8]">
                Developer Profile
              </p>

              <div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                  <div className="absolute -inset-2 rounded-full border border-[#deded9]" />

                  <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#171717] text-2xl font-semibold text-white shadow-[0_15px_35px_rgba(20,20,20,0.12)] sm:h-28 sm:w-28">
                    {profile.avatar_url ? (
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

                <div className="min-w-0">
                  <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-semibold leading-[0.9] tracking-[-0.065em]">
                    {displayName}
                  </h1>

                  <p className="mt-4 text-sm text-[#777771] sm:text-base">
                    @{username}
                  </p>
                </div>
              </div>

              <p className="mt-8 max-w-2xl text-base leading-7 text-[#777771] sm:text-lg">
                {profile.bio ||
                  "A developer documenting projects, experiments, lessons, and the things learned while building."}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {!isOwnProfile && (
                  <button
                    type="button"
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      isFollowing
                        ? "border border-[#deded9] bg-white text-[#171717] hover:border-[#bdbdb6]"
                        : "bg-[#171717] text-white hover:bg-[#292929]"
                    }`}
                  >
                    <span aria-hidden="true">{isFollowing ? "✓" : "+"}</span>
                    {followLoading
                      ? "Updating..."
                      : isFollowing
                        ? "Following"
                        : isLoggedIn
                          ? "Follow"
                          : "Follow"}
                  </button>
                )}

                <div className="rounded-xl border border-[#deded9] bg-white px-5 py-3">
                  <span className="font-semibold">{followerCount}</span>
                  <span className="ml-1.5 text-sm text-[#777771]">
                    {followerCount === 1 ? "follower" : "followers"}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-3 -top-3 h-full w-full rounded-3xl border border-[#deded9] bg-white/50" />

              <div className="relative rounded-3xl border border-[#deded9] bg-white p-7 shadow-[0_25px_60px_rgba(20,20,20,0.06)]">
                <div className="flex items-center justify-between border-b border-[#deded9] pb-5">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#999992]">
                      Profile Index
                    </p>
                    <p className="mt-1 text-sm font-semibold">Behind the work</p>
                  </div>

                  <span className="font-mono text-[10px] text-[#999992]">2026</span>
                </div>

                <div className="divide-y divide-[#deded9]">
                  <div className="flex items-center justify-between py-5">
                    <div>
                      <p className="text-xs text-[#999992]">Published</p>
                      <p className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                        {articles.length}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-[#999992]">ARTICLES</span>
                  </div>

                  <div className="flex items-center justify-between py-5">
                    <div>
                      <p className="text-xs text-[#999992]">Total views</p>
                      <p className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                        {formatViews(totalViews)}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-[#999992]">READS</span>
                  </div>

                  <div className="flex items-center justify-between py-5">
                    <div>
                      <p className="text-xs text-[#999992]">Topics</p>
                      <p className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                        {categories.length}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-[#999992]">AREAS</span>
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between border-t border-[#deded9] pt-5">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
                    Member since
                  </span>
                  <span className="text-xs font-medium text-[#555550]">
                    {formatDate(profile.created_at)}
                  </span>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-3 rounded-xl border border-[#deded9] bg-[#171717] px-5 py-4 text-white shadow-[0_15px_35px_rgba(20,20,20,0.12)] sm:-left-7">
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Followers
                </p>
                <p className="mt-1.5 text-xs font-medium">
                  {followerCount.toLocaleString()} people following this work.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-20 border-y border-[#deded9]">
            <div className="grid grid-cols-2 divide-x divide-[#deded9] sm:grid-cols-4">
              <div className="min-w-0 px-4 py-5 sm:px-6">
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999992]">Username</p>
                <p className="mt-2 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3568e8]">@{username}</p>
              </div>
              <div className="min-w-0 px-4 py-5 sm:px-6">
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999992]">Followers</p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#555550]">{followerCount.toLocaleString()}</p>
              </div>
              <div className="min-w-0 px-4 py-5 sm:px-6">
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999992]">Published</p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#555550]">{articles.length} {articles.length === 1 ? "article" : "articles"}</p>
              </div>
              <div className="min-w-0 px-4 py-5 sm:px-6">
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999992]">Reach</p>
                <p className="mt-2 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3568e8]">{formatViews(totalViews)} views</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {(profile.website || profile.github_url || profile.linkedin_url) && (
        <section className="border-b border-[#deded9]">
          <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8 lg:px-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="mr-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#999992]">Links</span>
              {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" className="rounded-full border border-[#deded9] bg-white px-4 py-2 text-xs font-medium text-[#555550] transition hover:border-[#bdbdb6] hover:text-[#171717]">Website</a>}
              {profile.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer" className="rounded-full border border-[#deded9] bg-white px-4 py-2 text-xs font-medium text-[#555550] transition hover:border-[#bdbdb6] hover:text-[#171717]">GitHub</a>}
              {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="rounded-full border border-[#deded9] bg-white px-4 py-2 text-xs font-medium text-[#555550] transition hover:border-[#bdbdb6] hover:text-[#171717]">LinkedIn</a>}
            </div>
          </div>
        </section>
      )}

      <section className="border-b border-[#deded9]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#777771]">01 / Writing</p>
              <p className="mt-4 max-w-[160px] text-xs leading-5 text-[#999992]">Published work and notes from the development journey.</p>
            </div>

            <div>
              <div className="flex items-end justify-between border-b border-[#deded9] pb-6">
                <div>
                  <h2 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Published articles</h2>
                  <p className="mt-3 text-sm text-[#777771]">
                    {articles.length === 0 ? "Nothing published yet." : `${articles.length} ${articles.length === 1 ? "article" : "articles"} in the journal.`}
                  </p>
                </div>
                {articles.length > 0 && <span className="hidden font-mono text-[10px] text-[#999992] sm:block">{String(articles.length).padStart(2, "0")}</span>}
              </div>

              {articles.length > 0 ? (
                <div className="divide-y divide-[#deded9]">
                  {articles.map((article, index) => (
                    <article key={article.id} className="group py-8">
                      <Link href={`/articles/${article.slug}`} className="grid gap-5 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:items-start sm:gap-7">
                        <span className="font-mono text-[10px] text-[#aaa9a1]">{String(index + 1).padStart(2, "0")}</span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em]">
                            <span className="text-[#3568e8]">{article.category}</span>
                            <span className="text-[#c7c7c1]">·</span>
                            <span className="text-[#999991]">{formatDate(article.published_at ?? article.created_at)}</span>
                          </div>
                          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em] transition-colors group-hover:text-[#3568e8] sm:text-3xl">{article.title}</h3>
                          {article.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777771]">{article.description}</p>}
                          <div className="mt-4 flex flex-wrap items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#aaa9a1]">
                            <span>{formatViews(article.views)} views</span>
                            <span>·</span>
                            <span>Read article</span>
                          </div>
                        </div>
                        <span className="hidden text-xl text-[#c4c4be] transition-transform group-hover:translate-x-1 group-hover:text-[#3568e8] sm:block">→</span>
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-8 rounded-3xl border border-dashed border-[#d5d5cf] bg-white px-6 py-20 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3568e8]">The journal is quiet</p>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.035em]">No published articles yet.</h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#777771]">This developer has not published anything yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:px-10 lg:py-28">
          <div className="relative overflow-hidden rounded-3xl border border-[#deded9] bg-white p-8 sm:p-12 lg:p-16">
            <div className="pointer-events-none absolute right-[-80px] top-[-100px] h-72 w-72 rounded-full bg-[#dfe8ff]/40 blur-[90px]" />
            <div className="relative flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3568e8]">Behind the Code</p>
                <h2 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">Read the work. Follow the journey.</h2>
                <p className="mt-6 max-w-xl text-[15px] leading-7 text-[#777771]">Follow developers whose work you want to keep up with, then their new posts can become part of your home feed.</p>
              </div>
              <Link href="/articles" className="inline-flex shrink-0 items-center gap-3 rounded-xl bg-[#171717] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#292929]">Explore articles <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
