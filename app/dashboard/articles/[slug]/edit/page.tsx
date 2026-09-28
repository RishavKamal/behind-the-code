"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { sql } from "@codemirror/lang-sql";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { rust } from "@codemirror/lang-rust";
import { go } from "@codemirror/lang-go";
import { markdown } from "@codemirror/lang-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

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


type CodeLanguage =
  | "javascript"
  | "typescript"
  | "java"
  | "python"
  | "cpp"
  | "sql"
  | "html"
  | "css"
  | "json"
  | "rust"
  | "go"
  | "markdown"
  | "text";

const languageLabels: Record<CodeLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  java: "Java",
  python: "Python",
  cpp: "C / C++",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  rust: "Rust",
  go: "Go",
  markdown: "Markdown",
  text: "Plain Text",
};

function getLanguageExtension(language: CodeLanguage) {
  switch (language) {
    case "javascript":
      return javascript();
    case "typescript":
      return javascript({ typescript: true });
    case "java":
      return java();
    case "python":
      return python();
    case "cpp":
      return cpp();
    case "sql":
      return sql();
    case "html":
      return html();
    case "css":
      return css();
    case "json":
      return json();
    case "rust":
      return rust();
    case "go":
      return go();
    case "markdown":
      return markdown();
    case "text":
    default:
      return null;
  }
}

function isSafeUrl(url: string) {
  return /^(https?:\/\/|mailto:)/i.test(url.trim());
}

function renderInline(text: string): React.ReactNode[] {
  const pattern = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (!part) return null;
    if (part.startsWith("***") && part.endsWith("***") && part.length > 6) {
      return <strong key={index}><em>{part.slice(3, -3)}</em></strong>;
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("~~") && part.endsWith("~~") && part.length > 4) {
      return <del key={index}>{part.slice(2, -2)}</del>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={index} className="rounded bg-[#f1f1ed] px-1.5 py-0.5 font-mono text-sm">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("[") && part.includes("](")) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        const [, label, url] = match;
        if (isSafeUrl(url)) {
          return <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-[#3568e8] underline underline-offset-2 hover:text-[#214fbf]">{label}</a>;
        }
      }
    }
    return <span key={index}>{part}</span>;
  });
}

function isTableSeparator(line: string) {
  const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function splitTableRow(line: string) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

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

  const codeInsertionRef = useRef({
    start: 0,
    end: 0,
  });

  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeDraft, setCodeDraft] = useState("");
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>("text");

  const codeExtensions = useMemo(() => {
    const extension = getLanguageExtension(codeLanguage);
    return extension ? [extension] : [];
  }, [codeLanguage]);

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
    placeholder = "text",
  ) {
    const textarea = editorRef.current;
    if (!textarea) return;

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
      if (selectedText) {
        const cursorStart = start + before.length;
        textarea.setSelectionRange(cursorStart, cursorStart + selectedText.length);
      } else {
        const cursor = start + before.length + replacement.length;
        textarea.setSelectionRange(cursor, cursor);
      }
    });
  }

  function insertAtCursor(text: string) {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextContent = content.slice(0, start) + text + content.slice(end);
    setContent(nextContent);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + text.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function applyBold() { updateContent("**", "**"); }
  function applyItalic() { updateContent("*", "*"); }
  function applyStrikethrough() { updateContent("~~", "~~"); }
  function applyInlineCode() { updateContent("`", "`"); }

  function applyHeading(level: 1 | 2 | 3) {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);
    const prefix = `${"#".repeat(level)} `;

    if (!selectedText) {
      insertAtCursor(prefix);
      return;
    }

    const formatted = selectedText
      .split("\n")
      .map((line) => `${prefix}${line.replace(/^#{1,6}\s+/, "")}`)
      .join("\n");

    setContent(content.slice(0, start) + formatted + content.slice(end));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formatted.length);
    });
  }

  function applyList(ordered = false) {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);

    if (!selectedText) {
      insertAtCursor(ordered ? "1. " : "- ");
      return;
    }

    const formatted = selectedText.split("\n").map((line, index) => {
      const cleanLine = line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, "");
      return ordered ? `${index + 1}. ${cleanLine}` : `- ${cleanLine}`;
    }).join("\n");

    setContent(content.slice(0, start) + formatted + content.slice(end));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formatted.length);
    });
  }

  function applyQuote() {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);

    if (!selectedText) {
      insertAtCursor("> ");
      return;
    }

    const formatted = selectedText.split("\n").map((line) => `> ${line}`).join("\n");
    setContent(content.slice(0, start) + formatted + content.slice(end));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formatted.length);
    });
  }

  function applyDivider() { insertAtCursor("\n---\n"); }

  function applyLink() {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);

    if (selectedText) {
      const replacement = `[${selectedText}](https://example.com)`;
      setContent(content.slice(0, start) + replacement + content.slice(end));
      requestAnimationFrame(() => {
        textarea.focus();
        const urlStart = start + selectedText.length + 3;
        textarea.setSelectionRange(urlStart, urlStart + "https://example.com".length);
      });
      return;
    }

    const replacement = "[link text](https://example.com)";
    setContent(content.slice(0, start) + replacement + content.slice(end));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, start + 1 + "link text".length);
    });
  }

  function applyTable() {
    const table =
      "| Column 1 | Column 2 | Column 3 |\n" +
      "| --- | --- | --- |\n" +
      "| Value 1 | Value 2 | Value 3 |\n" +
      "| Value 4 | Value 5 | Value 6 |";
    insertAtCursor(`\n${table}\n`);
  }

  function parseSelectedCodeBlock(selectedText: string) {
    const trimmed = selectedText.trim();
    const match = trimmed.match(/^```([^\n]*)\n([\s\S]*?)\n```$/);

    if (!match) {
      return { language: "text" as CodeLanguage, code: selectedText };
    }

    const language = match[1].trim().toLowerCase();
    const supportedLanguage = Object.keys(languageLabels).includes(language)
      ? (language as CodeLanguage)
      : "text";

    return { language: supportedLanguage, code: match[2] };
  }

  function openCodeEditor() {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);

    codeInsertionRef.current = { start, end };

    if (selectedText) {
      const parsed = parseSelectedCodeBlock(selectedText);
      setCodeLanguage(parsed.language);
      setCodeDraft(parsed.code);
    } else {
      setCodeLanguage("text");
      setCodeDraft("");
    }

    setShowCodeEditor(true);
  }

  function insertCodeBlock() {
    const { start, end } = codeInsertionRef.current;
    const language = codeLanguage === "text" ? "" : codeLanguage;
    const fencedCode = `\`\`\`${language}\n${codeDraft}\n\`\`\``;

    const before = content.slice(0, start);
    const after = content.slice(end);
    let insertion = fencedCode;

    if (before.length > 0 && !before.endsWith("\n")) insertion = `\n\n${insertion}`;
    if (after.length > 0 && !after.startsWith("\n")) insertion = `${insertion}\n\n`;

    const nextContent = before + insertion + after;
    setContent(nextContent);
    setShowCodeEditor(false);

    requestAnimationFrame(() => {
      const textarea = editorRef.current;
      if (!textarea) return;
      textarea.focus();
      const cursor = before.length + insertion.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function handleEditorKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const modifier = event.ctrlKey || event.metaKey;

    if (modifier && event.key.toLowerCase() === "b") { event.preventDefault(); applyBold(); return; }
    if (modifier && event.key.toLowerCase() === "i") { event.preventDefault(); applyItalic(); return; }
    if (modifier && event.key.toLowerCase() === "k") { event.preventDefault(); applyLink(); return; }
    if (modifier && event.shiftKey && event.key === "7") { event.preventDefault(); applyList(true); return; }
    if (modifier && event.shiftKey && event.key === "8") { event.preventDefault(); applyList(false); return; }
    if (modifier && event.shiftKey && event.key.toLowerCase() === "c") { event.preventDefault(); openCodeEditor(); }
  }

  function getTags() {
    return tags.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean);
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
    if (!showCodeEditor) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowCodeEditor(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCodeEditor]);

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
                    <div className="flex flex-wrap items-center gap-1.5 border-b border-[#deded9] bg-[#fafaf8] px-4 py-3">
                      <ToolbarButton label={<strong>B</strong>} title="Bold — Ctrl/Cmd + B" onClick={applyBold} />
                      <ToolbarButton label={<em>I</em>} title="Italic — Ctrl/Cmd + I" onClick={applyItalic} />
                      <ToolbarButton label={<span className="line-through">S</span>} title="Strikethrough" onClick={applyStrikethrough} />
                      <ToolbarButton label={<span className="font-mono">``</span>} title="Inline code" onClick={applyInlineCode} />

                      <div className="mx-1 h-5 w-px bg-[#deded9]" />

                      <ToolbarButton label="H1" title="Heading 1" onClick={() => applyHeading(1)} />
                      <ToolbarButton label="H2" title="Heading 2" onClick={() => applyHeading(2)} />
                      <ToolbarButton label="H3" title="Heading 3" onClick={() => applyHeading(3)} />

                      <div className="mx-1 h-5 w-px bg-[#deded9]" />

                      <ToolbarButton label="Link" title="Link — Ctrl/Cmd + K" onClick={applyLink} />
                      <ToolbarButton label="―" title="Horizontal divider" onClick={applyDivider} />
                      <ToolbarButton label="•" title="Bullet list" onClick={() => applyList(false)} />
                      <ToolbarButton label="1." title="Numbered list" onClick={() => applyList(true)} />
                      <ToolbarButton label={'"'} title="Blockquote" onClick={applyQuote} />
                      <ToolbarButton label="Table" title="Insert Markdown table" onClick={applyTable} />

                      <div className="mx-1 h-5 w-px bg-[#deded9]" />

                      <button
                        type="button"
                        title="Open code editor — Ctrl/Cmd + Shift + C"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={openCodeEditor}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#171717] px-3 text-xs font-semibold text-white transition hover:bg-[#2d2d2d]"
                      >
                        <span className="font-mono">{'</>'}</span>
                        Code
                      </button>
                    </div>

                    {/* Textarea */}
                    <textarea
                      ref={editorRef}
                      value={content}
                      onChange={(event) =>
                        setContent(event.target.value)
                      }
                      onKeyDown={handleEditorKeyDown}
                      spellCheck
                      className="min-h-[620px] w-full resize-y border-0 bg-white px-5 py-6 font-mono text-[13px] leading-7 text-[#252521] outline-none placeholder:text-[#b8b8b0] sm:px-7 sm:py-7"
                    />

                    <div className="border-t border-[#deded9] bg-[#fafaf8] px-5 py-3">
                      <p className="text-xs text-[#999992]">
                        Markdown editor · Use the toolbar or keyboard shortcuts.
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

      {/* CodeMirror modal */}
      {showCodeEditor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowCodeEditor(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="code-editor-title"
            className="flex w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[#deded9] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#deded9] px-5 py-4">
              <div>
                <h2 id="code-editor-title" className="font-semibold text-[#171717]">
                  Insert Code Block
                </h2>
                <p className="mt-1 text-xs text-[#777771]">
                  Write your code here, choose the language, then insert it into the Markdown article.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCodeEditor(false)}
                className="rounded-md px-2 py-1 text-lg text-[#999992] hover:bg-[#f4f4f1] hover:text-[#171717]"
                aria-label="Close code editor"
              >
                ×
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-[#deded9] bg-[#fafaf8] px-5 py-3">
              <label htmlFor="code-language" className="text-sm font-medium text-[#555550]">
                Language
              </label>

              <select
                id="code-language"
                value={codeLanguage}
                onChange={(event) => setCodeLanguage(event.target.value as CodeLanguage)}
                className="rounded-lg border border-[#deded9] bg-white px-3 py-2 text-sm text-[#171717] outline-none focus:border-[#999992]"
              >
                {(Object.keys(languageLabels) as CodeLanguage[]).map((language) => (
                  <option key={language} value={language}>
                    {languageLabels[language]}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white p-4">
              <div className="overflow-hidden rounded-lg border border-[#deded9]">
                <CodeMirror
                  value={codeDraft}
                  height="440px"
                  theme="light"
                  extensions={codeExtensions}
                  onChange={(value) => setCodeDraft(value)}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    dropCursor: false,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    highlightSelectionMatches: true,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#deded9] bg-[#fafaf8] px-5 py-4">
              <div className="text-xs text-[#777771]">
                The code will be stored as a Markdown fenced code block.
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCodeEditor(false)}
                  className="rounded-lg border border-[#deded9] bg-white px-4 py-2 text-sm font-medium text-[#555550] hover:bg-[#f8f8f6]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!codeDraft.trim()}
                  onClick={insertCodeBlock}
                  className="rounded-lg bg-[#171717] px-4 py-2 text-sm font-medium text-white hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Insert code block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
  label: React.ReactNode;
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

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(" ");
    blocks.push(
      <p key={`paragraph-${blocks.length}`} className="mb-5 text-base leading-8 text-[#555550] md:text-lg md:leading-[1.9]">
        {renderInline(text)}
      </p>,
    );
    paragraph = [];
  };

  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      flushParagraph();
      index++;
      continue;
    }

    if (line.trim().startsWith("```")) {
      flushParagraph();
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      index++;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index++;
      }

      if (index < lines.length) index++;
      const code = codeLines.join("\n");
      const lower = language.toLowerCase();
      const syntaxLanguage = lower === "javascript" ? "javascript" :
        lower === "typescript" ? "typescript" :
        lower === "java" ? "java" :
        lower === "python" ? "python" :
        lower === "cpp" || lower === "c++" ? "cpp" :
        lower === "sql" ? "sql" :
        lower === "html" ? "markup" :
        lower === "css" ? "css" :
        lower === "json" ? "json" :
        lower === "rust" ? "rust" :
        lower === "go" ? "go" :
        lower === "markdown" ? "markdown" : "text";

      blocks.push(
        <div key={`code-${blocks.length}`} className="mb-8 overflow-hidden rounded-xl border border-[#deded9] bg-[#fafaf8]">
          <div className="flex items-center justify-between border-b border-[#deded9] px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#d6d6d0]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#d6d6d0]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#d6d6d0]" />
              </div>
              {language && (
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#999992]">{language}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => void navigator.clipboard.writeText(code)}
              className="rounded-md px-2.5 py-1 text-xs text-[#777771] transition hover:bg-white hover:text-[#171717]"
            >
              Copy
            </button>
          </div>
          <div className="overflow-x-auto bg-[#f8f8f6]">
            <SyntaxHighlighter
              language={syntaxLanguage}
              style={oneLight}
              showLineNumbers
              wrapLongLines={false}
              customStyle={{ margin: 0, padding: "18px 0", background: "transparent", fontSize: "14px", lineHeight: "1.75", minWidth: "max-content" }}
              lineNumberStyle={{ minWidth: "48px", paddingRight: "12px", paddingLeft: "12px", marginRight: "16px", textAlign: "right", userSelect: "none", opacity: 0.5 }}
              codeTagProps={{ style: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" } }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>,
      );
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      blocks.push(<h1 key={`h1-${blocks.length}`} className="mb-5 mt-2 text-4xl font-bold tracking-[-0.045em] text-[#171717] md:text-5xl">{renderInline(line.slice(2))}</h1>);
      index++;
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      blocks.push(<h2 key={`h2-${blocks.length}`} className="mb-4 mt-10 text-2xl font-semibold tracking-[-0.035em] text-[#171717] md:text-3xl">{renderInline(line.slice(3))}</h2>);
      index++;
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      blocks.push(<h3 key={`h3-${blocks.length}`} className="mb-3 mt-8 text-xl font-semibold text-[#171717] md:text-2xl">{renderInline(line.slice(4))}</h3>);
      index++;
      continue;
    }

    if (/^\s*((---+)|(\*\*\*)|(___+))\s*$/.test(line)) {
      flushParagraph();
      blocks.push(<hr key={`hr-${blocks.length}`} className="my-8 border-0 border-t border-[#deded9]" />);
      index++;
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].startsWith("> ")) {
        quoteLines.push(lines[index].slice(2));
        index++;
      }
      blocks.push(<blockquote key={`quote-${blocks.length}`} className="mb-6 border-l-2 border-[#171717] pl-5 italic leading-8 text-[#777771]">{quoteLines.map((quoteLine, quoteIndex) => <div key={quoteIndex}>{renderInline(quoteLine)}</div>)}</blockquote>);
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      flushParagraph();
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*+]\s+/, ""));
        index++;
      }
      blocks.push(<ul key={`ul-${blocks.length}`} className="mb-6 list-disc space-y-2 pl-6 leading-7 text-[#555550]">{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}</ul>);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      flushParagraph();
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ""));
        index++;
      }
      blocks.push(<ol key={`ol-${blocks.length}`} className="mb-6 list-decimal space-y-2 pl-6 leading-7 text-[#555550]">{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}</ol>);
      continue;
    }

    if (index + 1 < lines.length && line.includes("|") && isTableSeparator(lines[index + 1])) {
      flushParagraph();
      const header = splitTableRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(splitTableRow(lines[index]));
        index++;
      }
      blocks.push(
        <div key={`table-${blocks.length}`} className="mb-6 overflow-x-auto rounded-lg border border-[#deded9]">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[#fafaf8]"><tr>{header.map((cell, cellIndex) => <th key={cellIndex} className="border-b border-[#deded9] px-4 py-3 font-semibold text-[#171717]">{renderInline(cell)}</th>)}</tr></thead>
            <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{header.map((_, cellIndex) => <td key={cellIndex} className="border-b border-[#eee] px-4 py-3 text-[#555550]">{renderInline(row[cellIndex] ?? "")}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }

    paragraph.push(line);
    index++;
  }

  flushParagraph();

  return <article className="max-w-3xl">{blocks.length > 0 ? blocks : <p className="text-[#999992]">Nothing to preview yet.</p>}</article>;
}
