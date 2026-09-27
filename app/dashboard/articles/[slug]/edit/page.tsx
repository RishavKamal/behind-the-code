"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { createClient } from "@/components/lib/supabase/client";
import ScrollReveal from "@/components/scroll-reveal";

const categories = [
  "Web Development",
  "Java",
  "Spring Boot",
  "React",
  "Backend",
  "DSA",
  "System Design",
  "Projects",
  "Learning",
];

type Article = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  content: string;
  status: "draft" | "published";
  published_at: string | null;
};

export default function EditArticlePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const slug = params.slug;

  const [article, setArticle] = useState<Article | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadArticle() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      if (userError || !user) {
        router.replace(
          `/login?redirectTo=${encodeURIComponent(
            `/dashboard/articles/${slug}/edit`
          )}`
        );
        return;
      }

      setAuthChecking(false);

      const { data, error: articleError } = await supabase
        .from("articles")
        .select(
          "id, slug, title, description, category, tags, content, status, published_at"
        )
        .eq("slug", slug)
        .eq("author_id", user.id)
        .maybeSingle();

      if (articleError) {
        console.error(articleError);
        if (!cancelled) {
          setError("Unable to load this article.");
          setLoading(false);
        }
        return;
      }

      if (!data) {
        if (!cancelled) {
          setError("The article you are trying to edit does not exist.");
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setArticle({
          ...data,
          tags: data.tags ?? [],
        });
        setLoading(false);
      }
    }

    void loadArticle();

    return () => {
      cancelled = true;
    };
  }, [router, slug, supabase]);

  if (authChecking) {
    return (
      <main className="min-h-screen bg-[#f4f4f0] text-[#171717]">
        <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:px-10">
          <div className="animate-pulse">
            <div className="h-4 w-32 rounded bg-[#deded9]" />
            <div className="mt-8 h-12 w-64 rounded bg-[#deded9]" />
            <div className="mt-6 h-4 w-96 max-w-full rounded bg-[#e7e7e2]" />
            <div className="mt-10 h-[500px] rounded-[26px] bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f4f0] text-[#171717]">
        <section className="mx-auto max-w-7xl px-6 py-10 md:py-12">
          <div className="animate-pulse">
            <div className="h-4 w-28 rounded bg-[#deded9]" />
            <div className="mt-6 h-10 w-64 rounded bg-[#deded9]" />
            <div className="mt-3 h-4 w-96 max-w-full rounded bg-[#e7e7e2]" />
            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="h-[650px] rounded-xl bg-white" />
              <div className="h-[360px] rounded-xl bg-white" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main>
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#777771]">
            Article
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-[#171717]">
            Article not found
          </h1>

          <p className="mt-4 text-sm text-[#777771]">
            {error || "The article you are trying to edit does not exist."}
          </p>

          <Link
            href="/dashboard/articles"
            className="mt-7 inline-block rounded-lg bg-[#171717] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#303030]"
          >
            Back to articles
          </Link>
        </section>
      </main>
    );
  }

  return <EditArticleForm article={article} supabase={supabase} />;
}

function EditArticleForm({
  article,
  supabase,
}: {
  article: Article;
  supabase: ReturnType<typeof createClient>;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(article.title);
  const [description, setDescription] = useState(article.description ?? "");
  const [category, setCategory] = useState(article.category);
  const [tags, setTags] = useState(article.tags.join(", "));
  const [content, setContent] = useState(article.content);

  const [status, setStatus] = useState<"Draft" | "Published">(
    article.status === "published" ? "Published" : "Draft"
  );

  const [mode, setMode] = useState<"write" | "preview">("write");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Delete state
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = useMemo(() => {
    if (!content.trim()) {
      return 0;
    }

    return content.trim().split(/\s+/).length;
  }, [content]);

  const characterCount = content.length;

  function updateContent(
    before: string,
    after = "",
    placeholder = "text"
  ) {
    const textarea = editorRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = content.slice(start, end);

    const replacement = selectedText || placeholder;

    const nextContent =
      content.slice(0, start) +
      before +
      replacement +
      after +
      content.slice(end);

    setContent(nextContent);

    requestAnimationFrame(() => {
      textarea.focus();

      const selectionStart = start + before.length;

      const selectionEnd = selectionStart + replacement.length;

      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  function insertAtCursor(text: string, cursorOffset?: number) {
    const textarea = editorRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const nextContent =
      content.slice(0, start) +
      text +
      content.slice(end);

    setContent(nextContent);

    requestAnimationFrame(() => {
      textarea.focus();

      const position =
        cursorOffset !== undefined
          ? start + cursorOffset
          : start + text.length;

      textarea.setSelectionRange(position, position);
    });
  }

  function applyHeading(level: 1 | 2) {
    const textarea = editorRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = content.slice(start, end);

    const prefix = level === 1 ? "# " : "## ";

    if (selectedText) {
      const nextContent =
        content.slice(0, start) +
        prefix +
        selectedText +
        content.slice(end);

      setContent(nextContent);

      requestAnimationFrame(() => {
        textarea.focus();

        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + selectedText.length
        );
      });

      return;
    }

    insertAtCursor(prefix, prefix.length);
  }

  function applyList() {
    const textarea = editorRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = content.slice(start, end);

    if (selectedText) {
      const formatted = selectedText
        .split("\n")
        .map((line) => `- ${line}`)
        .join("\n");

      const nextContent =
        content.slice(0, start) +
        formatted +
        content.slice(end);

      setContent(nextContent);

      requestAnimationFrame(() => {
        textarea.focus();

        textarea.setSelectionRange(
          start,
          start + formatted.length
        );
      });

      return;
    }

    insertAtCursor("- ", 2);
  }

  function applyQuote() {
    const textarea = editorRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = content.slice(start, end);

    if (selectedText) {
      const formatted = selectedText
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");

      const nextContent =
        content.slice(0, start) +
        formatted +
        content.slice(end);

      setContent(nextContent);

      requestAnimationFrame(() => {
        textarea.focus();

        textarea.setSelectionRange(
          start,
          start + formatted.length
        );
      });

      return;
    }

    insertAtCursor("> ", 2);
  }

  function applyCode() {
    const textarea = editorRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = content.slice(start, end);

    const codeText = selectedText || "your code here";

    const formatted =
      "```javascript\n" +
      codeText +
      "\n```";

    const nextContent =
      content.slice(0, start) +
      formatted +
      content.slice(end);

    setContent(nextContent);

    requestAnimationFrame(() => {
      textarea.focus();

      const codeStart =
        start + "```javascript\n".length;

      textarea.setSelectionRange(
        codeStart,
        codeStart + codeText.length
      );
    });
  }

  function getTags() {
    return tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
  }

  async function saveArticle(
    nextStatus?: "draft" | "published"
  ) {
    setSaveError("");

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedCategory = category.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setSaveError("Please add a title.");
      return;
    }

    if (!trimmedContent) {
      setSaveError("Please write some article content.");
      return;
    }

    if (!trimmedCategory) {
      setSaveError("Please choose or enter a category.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(
        `/login?redirectTo=${encodeURIComponent(
          `/dashboard/articles/${article.slug}/edit`
        )}`
      );
      return;
    }

    const finalStatus =
      nextStatus ?? statusToDatabase(status);

    setSaving(true);

    const updateData: {
      title: string;
      description: string | null;
      category: string;
      tags: string[];
      content: string;
      status: "draft" | "published";
      published_at?: string | null;
    } = {
      title: trimmedTitle,
      description: trimmedDescription || null,
      category: trimmedCategory,
      tags: getTags(),
      content: trimmedContent,
      status: finalStatus,
    };

    if (finalStatus === "published") {
      updateData.published_at =
        article.published_at ??
        new Date().toISOString();
    } else {
      updateData.published_at = null;
    }

    const { error } = await supabase
      .from("articles")
      .update(updateData)
      .eq("id", article.id)
      .eq("author_id", user.id);

    if (error) {
      console.error(error);
      setSaveError(
        "Unable to save the article. Please try again."
      );
      setSaving(false);
      return;
    }

    setStatus(
      finalStatus === "published"
        ? "Published"
        : "Draft"
    );

    setSaving(false);

    router.push("/dashboard/articles");
    router.refresh();
  }

  async function handleSave() {
    await saveArticle();
  }

  async function handlePublishToggle() {
    const nextStatus =
      status === "Published"
        ? "draft"
        : "published";

    await saveArticle(nextStatus);
  }

  function openDeleteModal() {
    if (saving || deleting) {
      return;
    }

    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (deleting) {
      return;
    }

    setShowDeleteModal(false);
  }

  useEffect(() => {
    if (!showDeleteModal) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleting) {
        setShowDeleteModal(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDeleteModal, deleting]);

  async function confirmDelete() {
    if (deleting) {
      return;
    }

    setSaveError("");
    setDeleting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaveError("You must be logged in to delete this article.");
      setDeleting(false);
      setShowDeleteModal(false);
      return;
    }

    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", article.id)
      .eq("author_id", user.id);

    if (error) {
      console.error(error);
      setSaveError(
        "Unable to delete the article. Please try again."
      );
      setDeleting(false);
      return;
    }

    router.push("/dashboard/articles");
    router.refresh();
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <ScrollReveal distance={14}>
        <section className="border-b border-[#deded9]">
        <div className="mx-auto max-w-7xl px-6 py-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/dashboard/articles"
                className="inline-flex items-center gap-2 text-sm text-[#777771] transition-colors hover:text-[#171717]"
              >
                <span aria-hidden="true">←</span>
                <span>My Articles</span>
              </Link>

              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#777771]">
                  Writing
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-[#171717]">
                  Edit Article
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || deleting}
                className="rounded-lg border border-[#deded9] bg-white px-4 py-2.5 text-sm text-[#555550] transition-colors hover:border-[#bdbdb7] hover:bg-[#f8f8f6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>

              <button
                type="button"
                onClick={handlePublishToggle}
                disabled={saving || deleting}
                className="rounded-lg bg-[#171717] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "Published"
                  ? "Unpublish"
                  : "Publish"}
              </button>
            </div>
          </div>

          {saveError && (
            <div className="mt-5 rounded-lg border border-[#e2caca] bg-[#fff7f7] px-4 py-3 text-sm text-[#8b4444]">
              {saveError}
            </div>
          )}
        </div>
        </section>
      </ScrollReveal>

      {/* Editor */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-8 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            {/* Main */}
            <div className="min-w-0">
              {/* Title */}
              <ScrollReveal distance={18}>
                <div>
                <label
                  htmlFor="article-title"
                  className="mb-2 block text-[11px] font-medium uppercase tracking-[0.15em] text-[#777771]"
                >
                  Title
                </label>

                <input
                  id="article-title"
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  className="w-full border-0 border-b border-[#deded9] bg-transparent px-0 py-3 text-4xl font-bold tracking-[-0.045em] text-[#171717] outline-none placeholder:text-[#c4c4bd] focus:border-[#999992] md:text-5xl"
                />
                </div>
              </ScrollReveal>

              {/* Description */}
              <ScrollReveal delay={80} distance={18}>
                <div className="mt-7">
                <label
                  htmlFor="article-description"
                  className="mb-2 block text-[11px] font-medium uppercase tracking-[0.15em] text-[#777771]"
                >
                  Description
                </label>

                <textarea
                  id="article-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[#deded9] bg-white px-4 py-3 text-sm leading-6 text-[#171717] outline-none placeholder:text-[#aaa9a3] transition-colors focus:border-[#999992]"
                />
                </div>
              </ScrollReveal>

              {/* Editor */}
              <ScrollReveal delay={150} distance={22}>
                <div className="mt-8 overflow-hidden rounded-xl border border-[#deded9] bg-white">
                {/* Mode */}
                <div className="flex items-center justify-between border-b border-[#deded9] bg-[#fafaf8] px-4 py-3">
                  <div
                    role="tablist"
                    aria-label="Article editor mode"
                    className="flex items-center rounded-lg border border-[#deded9] bg-white p-1"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === "write"}
                      onClick={() => setMode("write")}
                      className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all ${
                        mode === "write"
                          ? "bg-[#171717] text-white shadow-sm"
                          : "text-[#777771] hover:text-[#171717]"
                      }`}
                    >
                      Write
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === "preview"}
                      onClick={() => setMode("preview")}
                      className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all ${
                        mode === "preview"
                          ? "bg-[#171717] text-white shadow-sm"
                          : "text-[#777771] hover:text-[#171717]"
                      }`}
                    >
                      Preview
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#999992]">
                    <span>{wordCount} words</span>

                    <span>{characterCount} characters</span>
                  </div>
                </div>

                {mode === "write" && (
                  <div>
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 border-b border-[#deded9] px-4 py-2.5">
                      <ToolbarButton
                        label="B"
                        title="Bold"
                        onClick={() =>
                          updateContent("**", "**")
                        }
                      />

                      <ToolbarButton
                        label="I"
                        title="Italic"
                        onClick={() =>
                          updateContent("*", "*")
                        }
                      />

                      <ToolbarButton
                        label="H1"
                        title="Heading 1"
                        onClick={() => applyHeading(1)}
                      />

                      <ToolbarButton
                        label="H2"
                        title="Heading 2"
                        onClick={() => applyHeading(2)}
                      />

                      <div className="mx-1 h-5 w-px bg-[#deded9]" />

                      <ToolbarButton
                        label="{}"
                        title="Code block"
                        onClick={applyCode}
                      />

                      <ToolbarButton
                        label="•"
                        title="Bullet list"
                        onClick={applyList}
                      />

                      <ToolbarButton
                        label=">"
                        title="Quote"
                        onClick={applyQuote}
                      />
                    </div>

                    {/* Textarea */}
                    <textarea
                      ref={editorRef}
                      value={content}
                      onChange={(event) =>
                        setContent(event.target.value)
                      }
                      spellCheck={false}
                      className="min-h-[520px] w-full resize-y border-0 bg-white px-5 py-5 font-mono text-sm leading-7 text-[#333330] outline-none"
                    />

                    <div className="border-t border-[#deded9] bg-[#fafaf8] px-5 py-3">
                      <p className="text-xs text-[#999992]">
                        Markdown is supported. Use the toolbar or
                        write Markdown directly.
                      </p>
                    </div>
                  </div>
                )}

                {mode === "preview" && (
                  <div className="min-h-[600px] bg-white px-6 py-8 md:px-10 md:py-10">
                    <MarkdownPreview content={content} />
                  </div>
                )}
                </div>
              </ScrollReveal>
            </div>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <ScrollReveal delay={120} distance={18}>
                <div className="rounded-xl border border-[#deded9] bg-white">
                {/* Publishing */}
                <div className="p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#777771]">
                    Publishing
                  </p>

                  <div className="mt-5 space-y-5">
                    <div>
                      <label
                        htmlFor="category"
                        className="mb-2 block text-xs font-medium text-[#555550]"
                      >
                        Category
                      </label>

                      <input
                        id="category"
                        list="article-category-suggestions"
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        placeholder="Python, AI, DevOps..."
                        maxLength={60}
                        className="w-full rounded-lg border border-[#deded9] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none transition-colors focus:border-[#999992]"
                      />
                      <datalist id="article-category-suggestions">
                        {categories.map((item) => (
                          <option key={item} value={item} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label
                        htmlFor="tags"
                        className="mb-2 block text-xs font-medium text-[#555550]"
                      >
                        Tags
                      </label>

                      <input
                        id="tags"
                        type="text"
                        value={tags}
                        onChange={(event) =>
                          setTags(event.target.value)
                        }
                        placeholder="react, nextjs, tutorial"
                        className="w-full rounded-lg border border-[#deded9] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none placeholder:text-[#aaa9a3] transition-colors focus:border-[#999992]"
                      />

                      <p className="mt-2 text-xs leading-5 text-[#999992]">
                        Separate tags with commas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="border-t border-[#deded9] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#777771]">
                      Status
                    </p>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                        status === "Published"
                          ? "bg-[#eef5ee] text-[#486048]"
                          : "bg-[#f2f2ef] text-[#777771]"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-[#999992]">
                    {status === "Published"
                      ? "This article is visible to readers."
                      : "This article is currently unpublished."}
                  </p>

                  <button
                    type="button"
                    onClick={handlePublishToggle}
                    disabled={saving || deleting}
                    className="mt-4 text-xs font-medium text-[#555550] underline decoration-[#c7c7c1] underline-offset-4 transition-colors hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "Published"
                      ? "Move to drafts"
                      : "Publish article"}
                  </button>
                </div>

                {/* Checklist */}
                <div className="border-t border-[#deded9] p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#777771]">
                    Checklist
                  </p>

                  <div className="mt-4 space-y-3">
                    <ChecklistItem
                      label="Add a title"
                      complete={title.trim().length > 0}
                    />

                    <ChecklistItem
                      label="Add a description"
                      complete={description.trim().length > 0}
                    />

                    <ChecklistItem
                      label="Choose a category"
                      complete={category.length > 0}
                    />

                    <ChecklistItem
                      label="Write article content"
                      complete={content.trim().length > 0}
                    />
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="border-t border-[#deded9] p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#777771]">
                    Danger zone
                  </p>

                  <button
                    type="button"
                    onClick={openDeleteModal}
                    disabled={saving || deleting}
                    className="mt-4 text-sm font-medium text-[#9a4d4d] transition-colors hover:text-[#7f3535] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete article
                  </button>

                  <p className="mt-2 text-xs leading-5 text-[#999992]">
                    Permanently delete this article.
                  </p>
                </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={240} distance={14}>
                <Link
                  href="/dashboard/articles"
                className="mt-5 block text-center text-sm text-[#777771] transition-colors hover:text-[#171717]"
              >
                  ← Back to my articles
                </Link>
              </ScrollReveal>
            </aside>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleting
            ) {
              closeDeleteModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-article-title"
            className="w-full max-w-md rounded-xl border border-[#deded9] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#999992]">
                  Delete article
                </p>

                <h2
                  id="delete-article-title"
                  className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[#171717]"
                >
                  Delete this article?
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#999992] transition-colors hover:bg-[#f4f4f1] hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Modal Content */}
            <div className="mt-5">
              <p className="text-sm leading-6 text-[#777771]">
                Are you sure you want to permanently delete:
              </p>

              <div className="mt-3 rounded-lg border border-[#deded9] bg-[#fafaf8] px-4 py-3">
                <p className="truncate text-sm font-medium text-[#171717]">
                  {article.title}
                </p>
              </div>

              <p className="mt-3 text-xs leading-5 text-[#999992]">
                This action cannot be undone.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="mt-7 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-lg border border-[#deded9] bg-white px-4 py-2.5 text-sm text-[#555550] transition-colors hover:border-[#bdbdb7] hover:bg-[#f8f8f6] hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-[#171717] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete article"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function statusToDatabase(
  status: "Draft" | "Published"
): "draft" | "published" {
  return status === "Published" ? "published" : "draft";
}

function ToolbarButton({
  label,
  title,
  onClick,
}: {
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium text-[#777771] transition-colors hover:bg-[#f0f0ed] hover:text-[#171717]"
    >
      {label}
    </button>
  );
}

function ChecklistItem({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border text-[9px] ${
          complete
            ? "border-[#171717] bg-[#171717] text-white"
            : "border-[#c7c7c1] bg-white text-transparent"
        }`}
      >
        ✓
      </span>

      <span
        className={`text-xs ${
          complete ? "text-[#555550]" : "text-[#999992]"
        }`}
      >
        {label}
      </span>
    </div>
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

function MarkdownPreview({
  content,
}: {
  content: string;
}) {
  const lines = content.split("\n");

  const elements: React.ReactNode[] = [];

  let insideCodeBlock = false;
  let codeLines: string[] = [];
  let codeLanguage = "";

  lines.forEach((line, index) => {
    if (line.startsWith("```")) {
      if (!insideCodeBlock) {
        insideCodeBlock = true;
        codeLines = [];
        codeLanguage = line.slice(3).trim();
      } else {
        elements.push(
          <div
            key={`code-${index}`}
            className="my-8 overflow-hidden rounded-xl border border-[#deded9] bg-[#fafaf8]"
          >
            <div className="flex items-center justify-between border-b border-[#deded9] px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#d6d6d0]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#d6d6d0]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#d6d6d0]" />
              </div>

              {codeLanguage && (
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#999992]">
                  {codeLanguage}
                </span>
              )}
            </div>

            <pre className="overflow-x-auto p-5">
              <code className="font-mono text-sm leading-7 text-[#333330]">
                {codeLines.join("\n")}
              </code>
            </pre>
          </div>
        );

        insideCodeBlock = false;
        codeLines = [];
        codeLanguage = "";
      }

      return;
    }

    if (insideCodeBlock) {
      codeLines.push(line);
      return;
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h1
          key={index}
          className="mb-6 text-4xl font-bold tracking-[-0.045em] text-[#171717] md:text-5xl"
        >
          {line.slice(2)}
        </h1>
      );

      return;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={index}
          className="mb-4 mt-10 text-2xl font-semibold tracking-[-0.035em] text-[#171717] md:text-3xl"
        >
          {line.slice(3)}
        </h2>
      );

      return;
    }

    if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={index}
          className="my-6 border-l-2 border-[#171717] pl-5 text-base leading-8 text-[#777771]"
        >
          {line.slice(2)}
        </blockquote>
      );

      return;
    }

    if (line.startsWith("- ")) {
      elements.push(
        <li
          key={index}
          className="ml-5 list-disc text-base leading-8 text-[#555550]"
        >
          {line.slice(2)}
        </li>
      );

      return;
    }

    if (line.trim() === "") {
      elements.push(
        <div
          key={index}
          className="h-4"
        />
      );

      return;
    }

    elements.push(
      <p
        key={index}
        className="text-base leading-8 text-[#555550] md:text-lg md:leading-[1.9]"
      >
        {line}
      </p>
    );
  });

  return (
    <article className="max-w-3xl">
      {elements}
    </article>
  );
}