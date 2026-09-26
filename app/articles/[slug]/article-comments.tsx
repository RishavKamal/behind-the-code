"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { createClient } from "@/components/lib/supabase/client";

type ArticleComment = {
  id: string;
  article_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
};

function formatCommentDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  }).format(date);
}

function getInitials(displayName: string) {
  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "D";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ArticleComments({
  articleId,
}: {
  articleId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ArticleComment | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      setLoading(true);
      setError("");

      try {
        const [
          {
            data: { user },
          },
          { data: commentData, error: commentError },
        ] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("article_comments")
            .select("id, article_id, user_id, content, created_at, updated_at")
            .eq("article_id", articleId)
            .order("created_at", { ascending: false }),
        ]);

        if (commentError) throw commentError;

        const loadedComments = (commentData ?? []) as ArticleComment[];
        const userIds = [...new Set(loadedComments.map((comment) => comment.user_id))];

        let profileMap: Record<string, Profile> = {};

        if (userIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, display_name, username")
            .in("id", userIds);

          if (profileError) throw profileError;

          profileMap = Object.fromEntries(
            ((profileData ?? []) as Profile[]).map((profile) => [
              profile.id,
              profile,
            ]),
          );
        }

        if (cancelled) return;

        setCurrentUserId(user?.id ?? null);
        setComments(loadedComments);
        setProfiles(profileMap);
        setLoading(false);
      } catch (loadError) {
        console.error("Article comments loading error:", loadError);

        if (!cancelled) {
          setError("Unable to load comments right now.");
          setLoading(false);
        }
      }
    }

    void loadComments();

    return () => {
      cancelled = true;
    };
  }, [articleId, supabase]);

  function getProfile(userId: string) {
    const profile = profiles[userId];

    if (profile) {
      return {
        displayName: profile.display_name?.trim() || "Developer",
        username: profile.username?.trim() || null,
      };
    }

    return {
      displayName: "Developer",
      username: null,
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedComment = commentText.trim();

    if (!trimmedComment || submitting) return;

    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
      return;
    }

    if (trimmedComment.length > 5000) {
      setError("Comments must be 5000 characters or fewer.");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error: insertError } = await supabase
        .from("article_comments")
        .insert({
          article_id: articleId,
          user_id: user.id,
          content: trimmedComment,
        })
        .select("id, article_id, user_id, content, created_at, updated_at")
        .single();

      if (insertError) throw insertError;

      const newComment = data as ArticleComment;

      setComments((current) => [newComment, ...current]);
      setCurrentUserId(user.id);
      setCommentText("");
    } catch (submitError) {
      console.error("Article comment submission error:", submitError);
      setError("Unable to post your comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEditing(comment: ArticleComment) {
    setError("");
    setEditingId(comment.id);
    setEditingText(comment.content);
  }

  function cancelEditing() {
    if (savingEditId) return;

    setEditingId(null);
    setEditingText("");
  }

  async function handleSaveEdit(comment: ArticleComment) {
    if (savingEditId || editingId !== comment.id) return;

    const trimmedComment = editingText.trim();

    if (!trimmedComment) {
      setError("Comment cannot be empty.");
      return;
    }

    if (trimmedComment.length > 5000) {
      setError("Comments must be 5000 characters or fewer.");
      return;
    }

    setSavingEditId(comment.id);
    setError("");

    try {
      const { data, error: updateError } = await supabase
        .from("article_comments")
        .update({
          content: trimmedComment,
        })
        .eq("id", comment.id)
        .eq("user_id", currentUserId ?? "")
        .select("id, article_id, user_id, content, created_at, updated_at")
        .single();

      if (updateError) throw updateError;

      const updatedComment = data as ArticleComment;

      setComments((current) =>
        current.map((item) =>
          item.id === updatedComment.id ? updatedComment : item,
        ),
      );

      setEditingId(null);
      setEditingText("");
    } catch (updateError) {
      console.error("Article comment update error:", updateError);
      setError("Unable to update your comment. Please try again.");
    } finally {
      setSavingEditId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || deletingId) return;

    setDeletingId(deleteTarget.id);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("article_comments")
        .delete()
        .eq("id", deleteTarget.id)
        .eq("user_id", currentUserId ?? "");

      if (deleteError) throw deleteError;

      setComments((current) =>
        current.filter((comment) => comment.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (deleteError) {
      console.error("Article comment deletion error:", deleteError);
      setError("Unable to delete your comment. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const remainingCharacters = 5000 - commentText.length;

  return (
    <section className="mt-16 border-t border-[#deded9] pt-12 md:mt-20 md:pt-16">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#3568e8]">
            Discussion
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#171717] md:text-3xl">
            Comments
          </h2>
        </div>

        <p className="text-xs text-[#999992]">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-[#deded9] bg-white p-5 sm:p-6">
        <form onSubmit={handleSubmit}>
          <label
            htmlFor="article-comment"
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777771]"
          >
            Leave a comment
          </label>

          <textarea
            id="article-comment"
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Share a thought, question, or useful perspective..."
            maxLength={5000}
            rows={5}
            className="mt-3 w-full resize-y rounded-xl border border-[#deded9] bg-[#fafaf8] px-4 py-3 text-sm leading-6 text-[#333330] outline-none transition placeholder:text-[#aaa9a3] focus:border-[#aaa9a3] focus:bg-white"
          />

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-[#aaa9a3]">
                {remainingCharacters.toLocaleString()} characters remaining
              </p>

              {error && (
                <p className="mt-1 text-xs text-[#b04a42]">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!commentText.trim() || submitting}
              className="inline-flex items-center justify-center rounded-lg bg-[#171717] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {submitting ? "Posting..." : "Post comment"}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-10">
        {loading ? (
          <div className="space-y-5">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse border-b border-[#deded9] pb-6"
              >
                <div className="h-4 w-32 rounded bg-[#e7e7e2]" />
                <div className="mt-4 h-4 w-full rounded bg-[#ededE8]" />
                <div className="mt-2 h-4 w-3/4 rounded bg-[#ededE8]" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="border-y border-[#deded9] py-12 text-center">
            <p className="text-sm font-medium text-[#555550]">
              No comments yet.
            </p>
            <p className="mt-2 text-sm text-[#999992]">
              Start the discussion with the first comment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#deded9]">
            {comments.map((comment) => {
              const { displayName, username } = getProfile(comment.user_id);
              const isOwner = currentUserId === comment.user_id;

              return (
                <article key={comment.id} className="py-7 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#171717] text-[10px] font-semibold text-white">
                        {getInitials(displayName)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#333330]">
                          {displayName}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[#999992]">
                          {username && <span>@{username}</span>}
                          <span>·</span>
                          <time dateTime={comment.created_at}>
                            {formatCommentDate(comment.created_at)}
                          </time>
                        </div>
                      </div>
                    </div>

                    {isOwner && editingId !== comment.id && (
                      <div className="flex shrink-0 items-center gap-3">
                        <button
                          type="button"
                          onClick={() => startEditing(comment)}
                          className="text-xs font-medium text-[#999992] transition hover:text-[#555550]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(comment)}
                          className="text-xs font-medium text-[#999992] transition hover:text-[#555550]"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {editingId === comment.id ? (
                    <div className="mt-4">
                      <textarea
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                        maxLength={5000}
                        rows={5}
                        autoFocus
                        className="w-full resize-y rounded-xl border border-[#deded9] bg-[#fafaf8] px-4 py-3 text-sm leading-7 text-[#333330] outline-none transition placeholder:text-[#aaa9a3] focus:border-[#aaa9a3] focus:bg-white"
                      />

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-[#aaa9a3]">
                          {Math.max(0, 5000 - editingText.length).toLocaleString()} characters remaining
                        </p>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={cancelEditing}
                            disabled={Boolean(savingEditId)}
                            className="rounded-lg border border-[#d6d6d0] bg-white px-4 py-2 text-xs font-medium text-[#555550] transition hover:border-[#bdbdb7] hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleSaveEdit(comment)}
                            disabled={
                              !editingText.trim() || Boolean(savingEditId)
                            }
                            className="rounded-lg bg-[#171717] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingEditId === comment.id
                              ? "Saving..."
                              : "Save changes"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#555550]">
                      {comment.content}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#171717]/35 px-5 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-comment-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#deded9] bg-[#f8f8f5] p-6 shadow-[0_20px_60px_rgba(20,20,20,0.16)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
              Delete comment
            </p>

            <h3
              id="delete-comment-title"
              className="mt-3 text-xl font-semibold tracking-[-0.025em] text-[#171717]"
            >
              Remove this comment?
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#777771]">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={Boolean(deletingId)}
                className="rounded-lg border border-[#d6d6d0] bg-white px-4 py-2.5 text-sm font-medium text-[#555550] transition hover:border-[#bdbdb7] hover:text-[#171717] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={Boolean(deletingId)}
                className="rounded-lg bg-[#171717] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingId ? "Deleting..." : "Delete comment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
