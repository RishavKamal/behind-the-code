"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/components/lib/supabase/client";
import ScrollReveal from "@/components/scroll-reveal";

type LikeRow = {
  article_id: string;
  created_at: string;
};

type Article = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  created_at: string;
  published_at: string | null;
  content: string;
  author_id: string;
};

type Profile = {
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

export default function LikedArticlesPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [articles, setArticles] = useState<Article[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLikedArticles() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace(
            `/login?redirectTo=${encodeURIComponent("/dashboard/liked")}`,
          );
          return;
        }

        const { data: likeData, error: likeError } = await supabase
          .from("article_likes")
          .select("article_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (likeError) {
          throw likeError;
        }

        const likeRows = (likeData ?? []) as LikeRow[];
        const articleIds = likeRows.map((like) => like.article_id);

        if (articleIds.length === 0) {
          if (!cancelled) {
            setArticles([]);
            setProfiles([]);
            setLoading(false);
          }
          return;
        }

        const { data: articleData, error: articleError } = await supabase
          .from("articles")
          .select(
            "id, title, slug, description, category, created_at, published_at, content, author_id",
          )
          .in("id", articleIds)
          .eq("status", "published");

        if (articleError) {
          throw articleError;
        }

        const loadedArticles = (articleData ?? []) as Article[];
        const authorIds = Array.from(
          new Set(loadedArticles.map((article) => article.author_id)),
        );

        let profileData: Profile[] = [];

        if (authorIds.length > 0) {
          const { data, error: profileError } = await supabase
            .from("profiles")
            .select("id, display_name, username")
            .in("id", authorIds);

          if (profileError) {
            throw profileError;
          }

          profileData = (data ?? []) as Profile[];
        }

        const articleMap = new Map(
          loadedArticles.map((article) => [article.id, article]),
        );

        const orderedArticles = articleIds
          .map((id) => articleMap.get(id))
          .filter((article): article is Article => Boolean(article));

        if (!cancelled) {
          setArticles(orderedArticles);
          setProfiles(profileData);
          setLoading(false);
        }
      } catch (loadError) {
        console.error("Liked articles loading error:", loadError);

        if (!cancelled) {
          setError("Unable to load your liked articles.");
          setLoading(false);
        }
      }
    }

    void loadLikedArticles();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  async function unlikeArticle(articleId: string) {
    if (removingId) {
      return;
    }

    setRemovingId(articleId);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace(
          `/login?redirectTo=${encodeURIComponent("/dashboard/liked")}`,
        );
        return;
      }

      const { error: deleteError } = await supabase
        .from("article_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("article_id", articleId);

      if (deleteError) {
        throw deleteError;
      }

      setArticles((current) =>
        current.filter((article) => article.id !== articleId),
      );
    } catch (removeError) {
      console.error("Unlike article error:", removeError);
      setError("Unable to remove this like. Please try again.");
    } finally {
      setRemovingId(null);
    }
  }

  const profileMap = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile])),
    [profiles],
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f4f0]">
        <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 lg:px-10">
          <div className="animate-pulse">
            <div className="h-3 w-24 rounded bg-[#deded9]" />
            <div className="mt-5 h-12 w-72 rounded bg-[#deded9]" />
            <div className="mt-4 h-4 w-[520px] max-w-full rounded bg-[#e7e7e2]" />
            <div className="mt-10 space-y-4">
              <div className="h-40 rounded-2xl bg-white" />
              <div className="h-40 rounded-2xl bg-white" />
              <div className="h-40 rounded-2xl bg-white" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f4f0] text-[#171717]">
      <ScrollReveal distance={16}>
        <section className="border-b border-[#deded9] bg-[#f8f8f5]">
          <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3568e8]">
            Your activity
          </p>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-[-0.05em] text-[#171717] sm:text-5xl">
                Liked articles.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#777771] sm:text-base">
                Articles you have liked, kept together so you can find them
                again.
              </p>
            </div>

            <div className="shrink-0 rounded-full border border-[#deded9] bg-white px-4 py-2 text-xs font-medium text-[#777771]">
              {articles.length} {articles.length === 1 ? "article" : "articles"}
            </div>
          </div>
          </div>
        </section>
      </ScrollReveal>

      <section className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        {error && (
          <ScrollReveal distance={12}>
            <div className="mb-6 rounded-xl border border-[#e4caca] bg-[#fff8f8] px-4 py-3 text-sm text-[#8b4444]">
              {error}
            </div>
          </ScrollReveal>
        )}

        {articles.length === 0 ? (
          <ScrollReveal distance={22}>
            <div className="rounded-2xl border border-[#deded9] bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#deded9] bg-[#f8f8f5]">
              <HeartIcon />
            </div>

            <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em]">
              No liked articles yet.
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#777771]">
              When you like an article, it will appear here.
            </p>

            <Link
              href="/articles"
              className="mt-6 inline-flex rounded-xl bg-[#171717] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#303030]"
            >
              Browse articles
            </Link>
            </div>
          </ScrollReveal>
        ) : (
          <div className="space-y-4">
            {articles.map((article, index) => {
              const profile = profileMap.get(article.author_id);
              const authorName =
                profile?.display_name?.trim() ||
                profile?.username?.trim() ||
                "Behind the Code";

              const publishedDate =
                article.published_at ?? article.created_at;

              return (
                <ScrollReveal
                  key={article.id}
                  delay={Math.min(index * 70, 350)}
                  distance={18}
                >
                  <article
                  className="rounded-2xl border border-[#deded9] bg-white p-5 transition-shadow hover:shadow-[0_12px_30px_rgba(20,20,20,0.04)] sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#888880]">
                        <span>{article.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{calculateReadTime(article.content)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDate(publishedDate)}</span>
                      </div>

                      <Link
                        href={`/articles/${article.slug}`}
                        className="mt-3 block max-w-3xl text-2xl font-semibold tracking-[-0.035em] text-[#171717] transition-colors hover:text-[#3568e8] sm:text-[28px]"
                      >
                        {article.title}
                      </Link>

                      {article.description && (
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#777771]">
                          {article.description}
                        </p>
                      )}

                      <p className="mt-4 text-xs font-medium text-[#999992]">
                        By {authorName}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void unlikeArticle(article.id)}
                      disabled={removingId === article.id}
                      className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[#deded9] bg-white px-4 py-2.5 text-sm font-medium text-[#555550] transition-colors hover:border-[#bdbdb7] hover:bg-[#f8f8f5] hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {removingId === article.id ? "Removing..." : "Unlike"}
                    </button>
                  </div>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-5 w-5 text-[#555550]"
      aria-hidden="true"
    >
      <path d="M20.8 8.8c0 5.5-8.8 10.2-8.8 10.2S3.2 14.3 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z" />
    </svg>
  );
}
