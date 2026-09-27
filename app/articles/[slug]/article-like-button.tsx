"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { createClient } from "@/components/lib/supabase/client";

type ArticleLikeButtonProps = {
  articleId: string;
};

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

export default function ArticleLikeButton({
  articleId,
}: ArticleLikeButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLikeState() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      if (!user) {
        setLiked(false);
        setLoading(false);
        return;
      }

      const { data, error: likeError } = await supabase
        .from("article_likes")
        .select("article_id")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (likeError) {
        console.error("Like state error:", likeError);
        setError("Unable to load like status.");
      } else {
        setLiked(Boolean(data));
      }

      setLoading(false);
    }

    void loadLikeState();

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  function openLoginPrompt() {
    setShowLoginPrompt(true);
  }

  function closeLoginPrompt() {
    setShowLoginPrompt(false);
  }

  function continueToLogin() {
    const currentPath =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : pathname;

    router.push(
      `/login?redirectTo=${encodeURIComponent(currentPath)}`,
    );
  }

  async function handleLike() {
    if (saving) {
      return;
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      /*
       * Do not immediately redirect.
       * Let the user decide whether to log in.
       */
      openLoginPrompt();
      return;
    }

    setSaving(true);
    setError("");

    if (liked) {
      const { error: deleteError } = await supabase
        .from("article_likes")
        .delete()
        .eq("article_id", articleId)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Unlike error:", deleteError);
        setError("Unable to remove your like.");
        setSaving(false);
        return;
      }

      setLiked(false);
    } else {
      const { error: insertError } = await supabase
        .from("article_likes")
        .insert({
          article_id: articleId,
          user_id: user.id,
        });

      if (insertError) {
        console.error("Like error:", insertError);
        setError("Unable to like this article.");
        setSaving(false);
        return;
      }

      setLiked(true);
    }

    setSaving(false);
  }

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleLike}
          disabled={loading || saving}
          aria-pressed={liked}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
            liked
              ? "border-[#171717] bg-[#171717] text-white"
              : "border-[#deded9] bg-white text-[#555550] hover:border-[#bdbdb7] hover:bg-[#f8f8f6] hover:text-[#171717]"
          }`}
        >
          <HeartIcon filled={liked} />
          <span>
            {loading ? "Like" : liked ? "Liked" : "Like"}
          </span>
        </button>

        {error && (
          <p className="max-w-[180px] text-right text-[11px] leading-4 text-[#a14a4a]">
            {error}
          </p>
        )}
      </div>

      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-5 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="article-login-prompt-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeLoginPrompt();
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#deded9] bg-[#fdfdfb] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#777771]">
                  Account access
                </p>

                <h2
                  id="article-login-prompt-title"
                  className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#171717]"
                >
                  Sign in to like.
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
              Sign in to like this article. You&apos;ll return to this
              article after logging in.
            </p>

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

            <p className="mt-5 text-center text-xs leading-5 text-[#999992]">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  const currentPath =
                    typeof window !== "undefined"
                      ? `${window.location.pathname}${window.location.search}`
                      : pathname;

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
