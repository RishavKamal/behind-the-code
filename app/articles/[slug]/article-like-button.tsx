"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { createClient } from "@/components/lib/supabase/client";

type ArticleBookmarkButtonProps = {
  articleId: string;
};

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
      <path d="M6.5 4.5A2.5 2.5 0 0 1 9 2h6a2.5 2.5 0 0 1 2.5 2.5v16l-5.5-3-5.5 3v-16Z" />
    </svg>
  );
}

export default function ArticleBookmarkButton({
  articleId,
}: ArticleBookmarkButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isBookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBookmarkState() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        setBookmarked(false);
        setLoading(false);
        return;
      }

      const { data, error: bookmarkError } = await supabase
        .from("article_bookmarks")
        .select("article_id")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (bookmarkError) {
        console.error("Bookmark state error:", bookmarkError);
        setError("Unable to load bookmark status.");
      } else {
        setBookmarked(Boolean(data));
      }

      setLoading(false);
    }

    void loadBookmarkState();

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  async function handleBookmark() {
    if (saving) return;

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
      return;
    }

    setSaving(true);
    setError("");

    if (isBookmarked) {
      const { error: deleteError } = await supabase
        .from("article_bookmarks")
        .delete()
        .eq("article_id", articleId)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Unbookmark error:", deleteError);
        setError("Unable to remove your bookmark.");
        setSaving(false);
        return;
      }

      setBookmarked(false);
    } else {
      const { error: insertError } = await supabase
        .from("article_bookmarks")
        .insert({
          article_id: articleId,
          user_id: user.id,
        });

      if (insertError) {
        console.error("Bookmark error:", insertError);
        setError("Unable to bookmark this article.");
        setSaving(false);
        return;
      }

      setBookmarked(true);
    }

    setSaving(false);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleBookmark}
        disabled={loading || saving}
        aria-pressed={isBookmarked}
        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
          isBookmarked
            ? "border-[#171717] bg-[#171717] text-white"
            : "border-[#deded9] bg-white text-[#555550] hover:border-[#bdbdb7] hover:bg-[#f8f8f6] hover:text-[#171717]"
        }`}
      >
        <BookmarkIcon filled={isBookmarked} />
        <span>{loading ? "Bookmark" : isBookmarked ? "Bookmarked" : "Bookmark"}</span>
      </button>

      {error && (
        <p className="max-w-[180px] text-right text-[11px] leading-4 text-[#a14a4a]">
          {error}
        </p>
      )}
    </div>
  );
}
