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

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

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

        if (countError) {
          throw countError;
        }

        let userLiked = false;
        let userBookmarked = false;

        if (user) {
          const [
            {
              data: likeData,
              error: likeError,
            },
            {
              data: bookmarkData,
              error: bookmarkError,
            },
          ] = await Promise.all([
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

          if (likeError) {
            throw likeError;
          }

          if (bookmarkError) {
            throw bookmarkError;
          }

          userLiked = Boolean(likeData);
          userBookmarked = Boolean(bookmarkData);
        }

        if (cancelled) {
          return;
        }

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

  /*
   * Build the exact page the user is currently viewing.
   *
   * Example:
   * /articles/java-streams
   *
   * This is used after the user chooses to log in.
   */
  function getCurrentArticlePath() {
    if (typeof window === "undefined") {
      return `/articles/${slug}`;
    }

    return `${window.location.pathname}${window.location.search}`;
  }

  /*
   * Show the login popup instead of immediately
   * sending the user away from the article.
   */
  function openLoginPrompt() {
    setShowLoginPrompt(true);
  }

  function closeLoginPrompt() {
    setShowLoginPrompt(false);
  }

  /*
   * User explicitly chooses to log in.
   */
  function continueToLogin() {
    const currentPath = getCurrentArticlePath();

    router.push(
      `/login?redirectTo=${encodeURIComponent(currentPath)}`,
    );
  }

  async function handleLike() {
    if (actionLoading) {
      return;
    }

    /*
     * Logged-out users get a choice instead of
     * being immediately redirected.
     */
    if (!isLoggedIn) {
      openLoginPrompt();
      return;
    }

    setActionLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      /*
       * The session may have expired after the component
       * initially loaded. Show the popup in that case too.
       */
      if (!user) {
        setIsLoggedIn(false);
        openLoginPrompt();
        return;
      }

      if (liked) {
        const { error } = await supabase
          .from("article_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("article_id", articleId);

        if (error) {
          throw error;
        }

        setLiked(false);
        setLikeCount((count) => Math.max(0, count - 1));
      } else {
        const { error } = await supabase
          .from("article_likes")
          .insert({
            user_id: user.id,
            article_id: articleId,
          });

        if (error) {
          throw error;
        }

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
    if (actionLoading) {
      return;
    }

    /*
     * Logged-out users get a choice instead of
     * being immediately redirected.
     */
    if (!isLoggedIn) {
      openLoginPrompt();
      return;
    }

    setActionLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      /*
       * The session may have expired after the component
       * initially loaded. Show the popup in that case too.
       */
      if (!user) {
        setIsLoggedIn(false);
        openLoginPrompt();
        return;
      }

      if (bookmarked) {
        const { error } = await supabase
          .from("article_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("article_id", articleId);

        if (error) {
          throw error;
        }

        setBookmarked(false);
      } else {
        const { error } = await supabase
          .from("article_bookmarks")
          .insert({
            user_id: user.id,
            article_id: articleId,
          });

        if (error) {
          throw error;
        }

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
    <>
      {/* =========================================================
          ENGAGEMENT BUTTONS
      ========================================================= */}

      <div className="flex items-center gap-2">
        {/* Like */}
        <button
          type="button"
          onClick={handleLike}
          disabled={actionLoading}
          aria-pressed={liked}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
            liked
              ? "border-[#3568e8]/30 bg-[#3568e8]/10 text-[#3568e8]"
              : "border-[#deded9] bg-white text-[#555550] hover:border-[#bdbdb7] hover:bg-[#f8f8f6] hover:text-[#171717]"
          }`}
        >
          <HeartIcon filled={liked} />

          <span>
            {liked ? "Liked" : "Like"}
          </span>

          <span className="tabular-nums">
            {likeCount}
          </span>
        </button>

        {/* Bookmark */}
        <button
          type="button"
          onClick={handleBookmark}
          disabled={actionLoading}
          aria-pressed={bookmarked}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
            bookmarked
              ? "border-[#3568e8]/30 bg-[#3568e8]/10 text-[#3568e8]"
              : "border-[#deded9] bg-white text-[#555550] hover:border-[#bdbdb7] hover:bg-[#f8f8f6] hover:text-[#171717]"
          }`}
        >
          <BookmarkIcon filled={bookmarked} />

          <span>
            {bookmarked ? "Saved" : "Bookmark"}
          </span>
        </button>
      </div>

      {/* =========================================================
          LOGIN PROMPT
      ========================================================= */}

      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-5 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-prompt-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeLoginPrompt();
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#deded9] bg-[#fdfdfb] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#777771]">
                    Account access
                  </p>

                  <h2
                    id="login-prompt-title"
                    className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#171717]"
                  >
                    Sign in to continue.
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeLoginPrompt}
                  aria-label="Close"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#999992] transition-colors duration-200 hover:bg-[#eeeeea] hover:text-[#171717]"
                >
                  <CloseIcon />
                </button>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#777771]">
                Create an account or sign in to like and bookmark articles.
                You&apos;ll return to this article after logging in.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={continueToLogin}
                className="flex w-full items-center justify-between rounded-lg bg-[#171717] px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#303030] active:scale-[0.99]"
              >
                <span>Log in</span>
                <span aria-hidden="true">→</span>
              </button>

              <button
                type="button"
                onClick={closeLoginPrompt}
                className="w-full rounded-lg border border-[#deded9] bg-white px-4 py-3 text-sm font-medium text-[#555550] transition-all duration-200 hover:border-[#bdbdb7] hover:bg-[#f8f8f6] hover:text-[#171717]"
              >
                Maybe later
              </button>
            </div>

            {/* Register */}
            <p className="mt-5 text-center text-xs leading-5 text-[#999992]">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  const currentPath = getCurrentArticlePath();

                  router.push(
                    `/register?redirectTo=${encodeURIComponent(currentPath)}`,
                  );
                }}
                className="font-medium text-[#555550] underline underline-offset-2 transition-colors hover:text-[#171717]"
              >
                Create one
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================
   ICONS
========================================================= */

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
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}