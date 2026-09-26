"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/components/lib/supabase/client";

export default function ArticleEngagement({
  articleId,
  slug,
}: {
  articleId: string;
  slug: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadEngagement() {
      try {
        const [
          {
            data: { user },
          },
          { data: count, error: countError },
        ] = await Promise.all([
          supabase.auth.getUser(),
          supabase.rpc("get_article_like_count", {
            target_article_id: articleId,
          }),
        ]);

        if (countError) throw countError;

        let userLiked = false;
        let userBookmarked = false;

        if (user) {
          const [{ data: likeData, error: likeError }, { data: bookmarkData, error: bookmarkError }] =
            await Promise.all([
              supabase
                .from("article_likes")
                .select("article_id")
                .eq("user_id", user.id)
                .eq("article_id", articleId)
                .maybeSingle(),
              supabase
                .from("article_bookmarks")
                .select("article_id")
                .eq("user_id", user.id)
                .eq("article_id", articleId)
                .maybeSingle(),
            ]);

          if (likeError) throw likeError;
          if (bookmarkError) throw bookmarkError;

          userLiked = Boolean(likeData);
          userBookmarked = Boolean(bookmarkData);
        }

        if (cancelled) return;

        setIsLoggedIn(Boolean(user));
        setLikeCount(Number(count ?? 0));
        setLiked(userLiked);
        setBookmarked(userBookmarked);
        setLoading(false);
      } catch (error) {
        console.error("Article engagement loading error:", error);

        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadEngagement();

    return () => {
      cancelled = true;
    };
  }, [articleId, supabase]);

  async function handleLike() {
    if (actionLoading) return;

    if (!isLoggedIn) {
      router.push(
        `/login?redirectTo=${encodeURIComponent(`/articles/${slug}`)}`,
      );
      return;
    }

    setActionLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (liked) {
        const { error } = await supabase
          .from("article_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("article_id", articleId);

        if (error) throw error;

        setLiked(false);
        setLikeCount((count) => Math.max(0, count - 1));
      } else {
        const { error } = await supabase.from("article_likes").insert({
          user_id: user.id,
          article_id: articleId,
        });

        if (error) throw error;

        setLiked(true);
        setLikeCount((count) => count + 1);
      }
    } catch (error) {
      console.error("Article like action error:", error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBookmark() {
    if (actionLoading) return;

    if (!isLoggedIn) {
      router.push(
        `/login?redirectTo=${encodeURIComponent(`/articles/${slug}`)}`,
      );
      return;
    }

    setActionLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (bookmarked) {
        const { error } = await supabase
          .from("article_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("article_id", articleId);

        if (error) throw error;

        setBookmarked(false);
      } else {
        const { error } = await supabase
          .from("article_bookmarks")
          .insert({
            user_id: user.id,
            article_id: articleId,
          });

        if (error) throw error;

        setBookmarked(true);
      }
    } catch (error) {
      console.error("Article bookmark action error:", error);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-24 animate-pulse rounded-lg border border-[#deded9] bg-[#f4f4f0]" />
        <div className="h-10 w-28 animate-pulse rounded-lg border border-[#deded9] bg-[#f4f4f0]" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleLike}
        disabled={actionLoading}
        aria-pressed={liked}
        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
          liked
            ? "border-[#3568e8]/30 bg-[#3568e8]/10 text-[#3568e8]"
            : "border-[#deded9] bg-white text-[#555550] hover:border-[#bdbdb7] hover:bg-[#f8f8f6] hover:text-[#171717]"
        }`}
      >
        <HeartIcon filled={liked} />
        <span>{liked ? "Liked" : "Like"}</span>
        <span className="tabular-nums">{likeCount}</span>
      </button>

      <button
        type="button"
        onClick={handleBookmark}
        disabled={actionLoading}
        aria-pressed={bookmarked}
        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
          bookmarked
            ? "border-[#3568e8]/30 bg-[#3568e8]/10 text-[#3568e8]"
            : "border-[#deded9] bg-white text-[#555550] hover:border-[#bdbdb7] hover:bg-[#f8f8f6] hover:text-[#171717]"
        }`}
      >
        <BookmarkIcon filled={bookmarked} />
        <span>{bookmarked ? "Saved" : "Bookmark"}</span>
      </button>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M20.8 8.8c0 5.5-8.8 10.2-8.8 10.2S3.2 14.3 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.8L6 21V4.5Z" />
    </svg>
  );
}
