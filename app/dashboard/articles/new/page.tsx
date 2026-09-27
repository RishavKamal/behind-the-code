"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CodeMirror from "@uiw/react-codemirror";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

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

import { createClient } from "@/components/lib/supabase/client";
import ScrollReveal from "@/components/scroll-reveal";

type EditorMode = "write" | "preview";
type ArticleStatus = "draft" | "published";

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

const categories = [
  "Web Development",
  "Java",
  "Python",
  "JavaScript",
  "TypeScript",
  "Spring Boot",
  "React",
  "Next.js",
  "Node.js",
  "Backend",
  "Databases",
  "DSA",
  "System Design",
  "AI",
  "Machine Learning",
  "DevOps",
  "Cybersecurity",
  "Projects",
  "Learning",
];

const initialContent = `# Getting Started

Write your article here.

You can use **bold**, *italic*, \`inline code\`, links, lists, tables, and code blocks.

## Example

\`\`\`javascript
const message = "Hello World";
console.log(message);
\`\`\`

Start writing something useful.
`;

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

function ToolbarButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={onClick}
      className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-gray-200 bg-white px-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

function isSafeUrl(url: string) {
  return /^(https?:\/\/|mailto:)/i.test(url.trim());
}

function renderInline(text: string): React.ReactNode[] {
  const pattern =
    /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;

  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (!part) {
      return null;
    }

    if (
      part.startsWith("***") &&
      part.endsWith("***") &&
      part.length > 6
    ) {
      return (
        <strong key={index}>
          <em>{part.slice(3, -3)}</em>
        </strong>
      );
    }

    if (
      part.startsWith("**") &&
      part.endsWith("**") &&
      part.length > 4
    ) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("~~") && part.endsWith("~~")) {
      return <del key={index}>{part.slice(2, -2)}</del>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (
      part.startsWith("*") &&
      part.endsWith("*") &&
      part.length > 2
    ) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    if (
      part.startsWith("_") &&
      part.endsWith("_") &&
      part.length > 2
    ) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith("[") && part.includes("](")) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

      if (match) {
        const [, label, url] = match;

        if (isSafeUrl(url)) {
          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
            >
              {label}
            </a>
          );
        }
      }
    }

    return <span key={index}>{part}</span>;
  });
}

function isTableSeparator(line: string) {
  const cells = line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

  return (
    cells.length > 0 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell))
  );
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  const blocks: React.ReactNode[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }

    const text = paragraph.join(" ");

    blocks.push(
      <p
        key={`paragraph-${blocks.length}`}
        className="mb-5 leading-7 text-gray-700"
      >
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

    // Code block
if (line.trim().startsWith("```")) {
  flushParagraph();

  const language = line.trim().slice(3).trim();
  const codeLines: string[] = [];

  index++;

  while (
    index < lines.length &&
    !lines[index].trim().startsWith("```")
  ) {
    codeLines.push(lines[index]);
    index++;
  }

  if (index < lines.length) {
    index++;
  }

  const code = codeLines.join("\n");

  const syntaxLanguage =
    language.toLowerCase() === "javascript"
      ? "javascript"
      : language.toLowerCase() === "typescript"
        ? "typescript"
        : language.toLowerCase() === "java"
          ? "java"
          : language.toLowerCase() === "python"
            ? "python"
            : language.toLowerCase() === "cpp"
              ? "cpp"
              : language.toLowerCase() === "c++"
                ? "cpp"
                : language.toLowerCase() === "sql"
                  ? "sql"
                  : language.toLowerCase() === "html"
                    ? "markup"
                    : language.toLowerCase() === "css"
                      ? "css"
                      : language.toLowerCase() === "json"
                        ? "json"
                        : language.toLowerCase() === "rust"
                          ? "rust"
                          : language.toLowerCase() === "go"
                            ? "go"
                            : language.toLowerCase() === "markdown"
                              ? "markdown"
                              : "text";

  blocks.push(
    <div
      key={`code-${blocks.length}`}
      className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white"
    >
      {/* Code header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* Window dots */}
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
          </div>

          {/* Language */}
          {language && (
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-500">
              {language}
            </span>
          )}
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(code);
          }}
          className="rounded-md px-2.5 py-1 text-xs text-gray-500 transition hover:bg-white hover:text-gray-900"
        >
          Copy
        </button>
      </div>

      {/* Syntax-highlighted code */}
      <div className="overflow-x-auto bg-[#f8f8f6]">
        <SyntaxHighlighter
          language={syntaxLanguage}
          style={oneLight}
          showLineNumbers
          wrapLongLines={false}
          customStyle={{
            margin: 0,
            padding: "18px 0",
            background: "transparent",
            fontSize: "14px",
            lineHeight: "1.75",
            minWidth: "max-content",
          }}
          lineNumberStyle={{
            minWidth: "48px",
            paddingRight: "12px",
            paddingLeft: "12px",
            marginRight: "16px",
            textAlign: "right",
            userSelect: "none",
            opacity: 0.5,
          }}
          codeTagProps={{
            style: {
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>,
  );

  continue;
}

    // H1
    if (line.startsWith("# ")) {
      flushParagraph();

      blocks.push(
        <h1
          key={`h1-${blocks.length}`}
          className="mb-5 mt-2 text-3xl font-bold tracking-tight text-gray-950"
        >
          {renderInline(line.slice(2))}
        </h1>,
      );

      index++;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      flushParagraph();

      blocks.push(
        <h2
          key={`h2-${blocks.length}`}
          className="mb-4 mt-8 text-2xl font-bold tracking-tight text-gray-950"
        >
          {renderInline(line.slice(3))}
        </h2>,
      );

      index++;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      flushParagraph();

      blocks.push(
        <h3
          key={`h3-${blocks.length}`}
          className="mb-3 mt-6 text-xl font-semibold text-gray-950"
        >
          {renderInline(line.slice(4))}
        </h3>,
      );

      index++;
      continue;
    }

    // Horizontal divider
    if (/^\s*((---+)|(\*\*\*)|(___+))\s*$/.test(line)) {
      flushParagraph();

      blocks.push(
        <hr
          key={`hr-${blocks.length}`}
          className="my-8 border-0 border-t border-gray-200"
        />,
      );

      index++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushParagraph();

      const quoteLines: string[] = [];

      while (
        index < lines.length &&
        lines[index].startsWith("> ")
      ) {
        quoteLines.push(lines[index].slice(2));
        index++;
      }

      blocks.push(
        <blockquote
          key={`quote-${blocks.length}`}
          className="mb-6 border-l-4 border-gray-300 pl-4 italic leading-7 text-gray-600"
        >
          {quoteLines.map((quoteLine, quoteIndex) => (
            <div key={quoteIndex}>
              {renderInline(quoteLine)}
            </div>
          ))}
        </blockquote>,
      );

      continue;
    }

    // Bullet list
    if (/^\s*[-*+]\s+/.test(line)) {
      flushParagraph();

      const items: string[] = [];

      while (
        index < lines.length &&
        /^\s*[-*+]\s+/.test(lines[index])
      ) {
        items.push(
          lines[index].replace(/^\s*[-*+]\s+/, ""),
        );
        index++;
      }

      blocks.push(
        <ul
          key={`ul-${blocks.length}`}
          className="mb-6 list-disc space-y-2 pl-6 leading-7 text-gray-700"
        >
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ul>,
      );

      continue;
    }

    // Numbered list
    if (/^\s*\d+\.\s+/.test(line)) {
      flushParagraph();

      const items: string[] = [];

      while (
        index < lines.length &&
        /^\s*\d+\.\s+/.test(lines[index])
      ) {
        items.push(
          lines[index].replace(/^\s*\d+\.\s+/, ""),
        );
        index++;
      }

      blocks.push(
        <ol
          key={`ol-${blocks.length}`}
          className="mb-6 list-decimal space-y-2 pl-6 leading-7 text-gray-700"
        >
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ol>,
      );

      continue;
    }

    // Table
    if (
      index + 1 < lines.length &&
      line.includes("|") &&
      isTableSeparator(lines[index + 1])
    ) {
      flushParagraph();

      const header = splitTableRow(line);

      index += 2;

      const rows: string[][] = [];

      while (
        index < lines.length &&
        lines[index].includes("|") &&
        lines[index].trim()
      ) {
        rows.push(splitTableRow(lines[index]));
        index++;
      }

      blocks.push(
        <div
          key={`table-${blocks.length}`}
          className="mb-6 overflow-x-auto rounded-lg border border-gray-200"
        >
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                {header.map((cell, cellIndex) => (
                  <th
                    key={cellIndex}
                    className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900"
                  >
                    {renderInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {header.map((_, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="border-b border-gray-100 px-4 py-3 text-gray-700"
                    >
                      {renderInline(row[cellIndex] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );

      continue;
    }

    paragraph.push(line);
    index++;
  }

  flushParagraph();

  return (
    <div className="prose max-w-none">
      {blocks.length > 0 ? (
        blocks
      ) : (
        <p className="text-gray-400">
          Nothing to preview yet.
        </p>
      )}
    </div>
  );
}

export default function NewArticlePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const editorRef =
    useRef<HTMLTextAreaElement | null>(null);

  const codeInsertionRef = useRef({
    start: 0,
    end: 0,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [tags, setTags] = useState("");
  const [content, setContent] = useState(initialContent);

  const [mode, setMode] = useState<EditorMode>("write");
  const [status, setStatus] =
    useState<ArticleStatus>("draft");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [authChecking, setAuthChecking] = useState(true);

  const [showCodeEditor, setShowCodeEditor] =
    useState(false);

  const [codeDraft, setCodeDraft] = useState("");
  const [codeLanguage, setCodeLanguage] =
    useState<CodeLanguage>("text");

  const wordCount = useMemo(() => {
    const trimmed = content.trim();

    if (!trimmed) {
      return 0;
    }

    return trimmed.split(/\s+/).length;
  }, [content]);

  const characterCount = content.length;

  useEffect(() => {
    let cancelled = false;

    async function checkAuthentication() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      setAuthChecking(false);
    }

    void checkAuthentication();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const codeExtensions = useMemo(() => {
    const extension =
      getLanguageExtension(codeLanguage);

    return extension ? [extension] : [];
  }, [codeLanguage]);

  useEffect(() => {
    if (!showCodeEditor) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCodeEditor(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [showCodeEditor]);

  function updateContent(
    before: string,
    after = "",
    placeholder = "text",
  ) {
    const textarea = editorRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = content.slice(start, end);

    const replacement =
      selectedText || placeholder;

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
        const cursorStart =
          start + before.length;

        const cursorEnd =
          cursorStart + selectedText.length;

        textarea.setSelectionRange(
          cursorStart,
          cursorEnd,
        );
      } else {
        const cursor =
          start +
          before.length +
          replacement.length;

        textarea.setSelectionRange(
          cursor,
          cursor,
        );
      }
    });
  }

  function insertAtCursor(text: string) {
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

      const cursor = start + text.length;

      textarea.setSelectionRange(
        cursor,
        cursor,
      );
    });
  }

  function applyBold() {
    updateContent("**", "**");
  }

  function applyItalic() {
    updateContent("*", "*");
  }

  function applyStrikethrough() {
    updateContent("~~", "~~");
  }

  function applyInlineCode() {
    updateContent("`", "`");
  }

  function applyHeading(level: 1 | 2 | 3) {
    const textarea = editorRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = content.slice(start, end);

    if (!selectedText) {
      insertAtCursor(
        `${"#".repeat(level)} `,
      );
      return;
    }

    const prefix = `${"#".repeat(level)} `;

    const formatted = selectedText
      .split("\n")
      .map((line) => {
        const cleanLine = line.replace(
          /^#{1,6}\s+/,
          "",
        );

        return `${prefix}${cleanLine}`;
      })
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
        start + formatted.length,
      );
    });
  }

  function applyList(ordered = false) {
    const textarea = editorRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = content.slice(start, end);

    if (!selectedText) {
      insertAtCursor(
        ordered ? "1. " : "- ",
      );
      return;
    }

    const lines = selectedText.split("\n");

    const formatted = lines
      .map((line, index) => {
        const cleanLine = line.replace(
          /^\s*(?:[-*+]|\d+\.)\s+/,
          "",
        );

        return ordered
          ? `${index + 1}. ${cleanLine}`
          : `- ${cleanLine}`;
      })
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
        start + formatted.length,
      );
    });
  }

  function applyQuote() {
    const textarea = editorRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = content.slice(start, end);

    if (!selectedText) {
      insertAtCursor("> ");
      return;
    }

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
        start + formatted.length,
      );
    });
  }

  function applyDivider() {
    insertAtCursor("\n---\n");
  }

  function applyLink() {
    const textarea = editorRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = content.slice(start, end);

    if (selectedText) {
      const replacement =
        `[${selectedText}](https://example.com)`;

      const nextContent =
        content.slice(0, start) +
        replacement +
        content.slice(end);

      setContent(nextContent);

      requestAnimationFrame(() => {
        textarea.focus();

        const urlStart =
          start +
          selectedText.length +
          3;

        const urlEnd =
          urlStart +
          "https://example.com".length;

        textarea.setSelectionRange(
          urlStart,
          urlEnd,
        );
      });

      return;
    }

    const replacement =
      "[link text](https://example.com)";

    const nextContent =
      content.slice(0, start) +
      replacement +
      content.slice(end);

    setContent(nextContent);

    requestAnimationFrame(() => {
      textarea.focus();

      const textStart = start + 1;

      textarea.setSelectionRange(
        textStart,
        textStart + "link text".length,
      );
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

  function parseSelectedCodeBlock(
    selectedText: string,
  ) {
    const trimmed = selectedText.trim();

    const match = trimmed.match(
      /^```([^\n]*)\n([\s\S]*?)\n```$/,
    );

    if (!match) {
      return {
        language: "text" as CodeLanguage,
        code: selectedText,
      };
    }

    const language = match[1].trim();

    const supportedLanguage =
      Object.keys(languageLabels).includes(
        language,
      )
        ? (language as CodeLanguage)
        : "text";

    return {
      language: supportedLanguage,
      code: match[2],
    };
  }

  function openCodeEditor() {
    const textarea = editorRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = content.slice(start, end);

    codeInsertionRef.current = {
      start,
      end,
    };

    if (selectedText) {
      const parsed =
        parseSelectedCodeBlock(selectedText);

      setCodeLanguage(parsed.language);
      setCodeDraft(parsed.code);
    } else {
      setCodeLanguage("text");
      setCodeDraft("");
    }

    setShowCodeEditor(true);
  }

  function insertCodeBlock() {
    const { start, end } =
      codeInsertionRef.current;

    const language =
      codeLanguage === "text"
        ? ""
        : codeLanguage;

    const fencedCode =
      `\`\`\`${language}\n` +
      `${codeDraft}\n` +
      "```";

    const before = content.slice(0, start);
    const after = content.slice(end);

    let insertion = fencedCode;

    if (
      before.length > 0 &&
      !before.endsWith("\n")
    ) {
      insertion = `\n\n${insertion}`;
    }

    if (
      after.length > 0 &&
      !after.startsWith("\n")
    ) {
      insertion = `${insertion}\n\n`;
    }

    const nextContent =
      before + insertion + after;

    setContent(nextContent);
    setShowCodeEditor(false);

    requestAnimationFrame(() => {
      const textarea = editorRef.current;

      if (!textarea) {
        return;
      }

      textarea.focus();

      const cursor =
        before.length + insertion.length;

      textarea.setSelectionRange(
        cursor,
        cursor,
      );
    });
  }

  function handleEditorKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    const modifier =
      event.ctrlKey || event.metaKey;

    if (
      modifier &&
      event.key.toLowerCase() === "b"
    ) {
      event.preventDefault();
      applyBold();
      return;
    }

    if (
      modifier &&
      event.key.toLowerCase() === "i"
    ) {
      event.preventDefault();
      applyItalic();
      return;
    }

    if (
      modifier &&
      event.key.toLowerCase() === "k"
    ) {
      event.preventDefault();
      applyLink();
      return;
    }

    if (
      modifier &&
      event.shiftKey &&
      event.key === "7"
    ) {
      event.preventDefault();
      applyList(true);
      return;
    }

    if (
      modifier &&
      event.shiftKey &&
      event.key === "8"
    ) {
      event.preventDefault();
      applyList(false);
      return;
    }

    if (
      modifier &&
      event.shiftKey &&
      event.key.toLowerCase() === "c"
    ) {
      event.preventDefault();
      openCodeEditor();
      return;
    }

    // Auto-pair inline Markdown backticks.
    if (
      event.key === "`" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const textarea = editorRef.current;

      if (!textarea) {
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start === end) {
        event.preventDefault();

        const nextContent =
          content.slice(0, start) +
          "``" +
          content.slice(end);

        setContent(nextContent);

        requestAnimationFrame(() => {
          textarea.focus();

          textarea.setSelectionRange(
            start + 1,
            start + 1,
          );
        });
      }
    }
  }

  function createSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function getTags() {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  async function saveArticle(
    nextStatus: ArticleStatus,
  ) {
    setSaving(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const trimmedTitle = title.trim();
      const trimmedCategory = category.trim();

      if (!trimmedTitle) {
        throw new Error(
          "Please enter an article title.",
        );
      }

      if (!trimmedCategory) {
        throw new Error(
          "Please enter an article category.",
        );
      }

      if (!content.trim()) {
        throw new Error(
          "Please write some article content.",
        );
      }

      let slug = createSlug(trimmedTitle);

      if (!slug) {
        throw new Error(
          "Unable to create a valid article slug.",
        );
      }

      const { data: existingArticle } =
        await supabase
          .from("articles")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

      if (existingArticle) {
        slug = `${slug}-${Date.now()}`;
      }

      const { error: insertError } =
        await supabase.from("articles").insert({
          author_id: user.id,
          title: trimmedTitle,
          slug,
          description: description.trim(),
          content,
          category: trimmedCategory,
          tags: getTags(),
          status: nextStatus,
          featured: false,
          views: 0,
          likes: 0,
          published_at:
            nextStatus === "published"
              ? new Date().toISOString()
              : null,
        });

      if (insertError) {
        throw insertError;
      }

      setStatus(nextStatus);

      router.push("/dashboard/articles");
      router.refresh();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving the article.",
      );
    } finally {
      setSaving(false);
    }
  }

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

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-[#171717]">
      {/* Page intro / actions */}
      <ScrollReveal distance={14}>
        <div className="border-b border-[#d9d9d2] bg-[#f8f8f5]">
        <div className="mx-auto max-w-[1500px] px-5 py-5 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href="/dashboard/articles"
                className="inline-flex items-center gap-2 text-[11px] font-medium text-[#777770] transition hover:text-[#171717]"
              >
                <span>←</span>
                Back to articles
              </Link>

              <div className="mt-5 flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#171717] font-bold text-[11px] text-white">
                  BT
                </span>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#3568e8]">
                    Creator workspace
                  </p>
                  <h1 className="mt-0.5 text-2xl font-bold tracking-[-0.035em] text-[#171717] sm:text-3xl">
                    New article
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-[#deded8] bg-white px-3 py-1.5 text-[10px] font-medium text-[#777770] shadow-sm">
                <span className={`h-1.5 w-1.5 rounded-full ${status === "published" ? "bg-[#4f8a61]" : "bg-[#3568e8]"}`} />
                {status === "published" ? "Published" : "Draft workspace"}
              </div>

              {/* Desktop publishing actions live in the sticky sidebar below. */}
            </div>
          </div>
        </div>
        </div>
      </ScrollReveal>

      <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
        {error && (
          <ScrollReveal distance={12}>
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            <span className="mt-0.5 font-bold">!</span>
            <span>{error}</span>
            </div>
          </ScrollReveal>
        )}

        <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_330px]">
          {/* Main writing column */}
          <section className="min-w-0">
            {/* Article identity */}
            <ScrollReveal distance={22}>
              <div className="relative overflow-hidden rounded-[26px] border border-[#d9d9d2] bg-white shadow-[0_16px_50px_rgba(30,30,20,0.05)]">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#dce6ff] opacity-50 blur-3xl" />

              <div className="relative px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
                <div className="mb-7 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#3568e8]">
                      Step 01
                    </p>
                    <p className="mt-1 text-xs text-[#85857e]">
                      Start with the idea readers will see first.
                    </p>
                  </div>

                  <span className="hidden rounded-full border border-[#deded8] bg-[#fafaf7] px-3 py-1.5 font-mono text-[9px] text-[#8b8b84] sm:inline-flex">
                    TITLE / DESCRIPTION
                  </span>
                </div>

                <div className="border-b border-[#e4e4de] pb-7">
                  <label
                    htmlFor="article-title"
                    className="mb-3 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#777770]"
                  >
                    Article title
                  </label>

                  <div className="overflow-hidden rounded-2xl border border-[#d8d8d1] bg-[#fafaf7] transition focus-within:border-[#3568e8]/60 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#3568e8]/[0.06]">
                    <input
                      id="article-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      maxLength={120}
                      placeholder="What are you going to teach?"
                      className="w-full border-0 bg-transparent px-5 py-5 text-3xl font-bold tracking-[-0.045em] text-[#151515] outline-none placeholder:text-[#bdbdb5] sm:px-6 sm:py-6 sm:text-4xl lg:text-[48px] lg:leading-[1.08]"
                    />

                    <div className="flex items-center justify-between border-t border-[#e5e5df] px-5 py-2.5 sm:px-6">
                      <span className="text-[10px] text-[#aaa9a1]">
                        Clear, specific titles work best.
                      </span>
                      <span className="font-mono text-[10px] text-[#aaa9a1]">
                        {title.length}/120
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <label
                    htmlFor="article-description"
                    className="mb-3 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#777770]"
                  >
                    Short description
                  </label>

                  <div className="overflow-hidden rounded-2xl border border-[#d8d8d1] bg-[#fafaf7] transition focus-within:border-[#3568e8]/60 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#3568e8]/[0.06]">
                    <textarea
                      id="article-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Give readers a quick reason to open this article..."
                      rows={4}
                      maxLength={300}
                      className="w-full resize-none border-0 bg-transparent px-5 py-5 text-base leading-7 text-[#5f5f58] outline-none placeholder:text-[#bdbdb5] sm:px-6 sm:py-6 sm:text-lg"
                    />

                    <div className="flex items-center justify-between border-t border-[#e5e5df] px-5 py-2.5 sm:px-6">
                      <span className="text-[10px] text-[#aaa9a1]">
                        Used in article cards and search results.
                      </span>
                      <span className="font-mono text-[10px] text-[#aaa9a1]">
                        {description.length}/300
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </ScrollReveal>

            {/* Writing editor */}
            <ScrollReveal delay={120} distance={22}>
              <div className="mt-7 overflow-hidden rounded-[26px] border border-[#d9d9d2] bg-white shadow-[0_16px_50px_rgba(30,30,20,0.05)]">
              <div className="flex flex-col border-b border-[#e0e0da] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex px-3 pt-2 sm:px-4">
                  <button
                    type="button"
                    onClick={() => setMode("write")}
                    className={`relative px-4 py-3 text-xs font-semibold transition ${
                      mode === "write"
                        ? "text-[#171717]"
                        : "text-[#999990] hover:text-[#55554f]"
                    }`}
                  >
                    Write
                    {mode === "write" && (
                      <span className="absolute bottom-[-1px] left-3 right-3 h-0.5 rounded-full bg-[#3568e8]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("preview")}
                    className={`relative px-4 py-3 text-xs font-semibold transition ${
                      mode === "preview"
                        ? "text-[#171717]"
                        : "text-[#999990] hover:text-[#55554f]"
                    }`}
                  >
                    Preview
                    {mode === "preview" && (
                      <span className="absolute bottom-[-1px] left-3 right-3 h-0.5 rounded-full bg-[#3568e8]" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3 px-4 pb-3 text-[10px] text-[#999990] sm:pb-0">
                  <span className="rounded-full bg-[#f5f5f1] px-2.5 py-1 font-mono">
                    {wordCount} words
                  </span>
                  <span className="hidden font-mono sm:inline">
                    {characterCount} chars
                  </span>
                </div>
              </div>

              {mode === "write" ? (
                <>
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 border-b border-[#e5e5df] bg-[#fafaf8] px-4 py-3">
                    <ToolbarButton title="Bold — Ctrl/Cmd + B" onClick={applyBold}>
                      <strong>B</strong>
                    </ToolbarButton>

                    <ToolbarButton title="Italic — Ctrl/Cmd + I" onClick={applyItalic}>
                      <em>I</em>
                    </ToolbarButton>

                    <ToolbarButton title="Strikethrough" onClick={applyStrikethrough}>
                      <span className="line-through">S</span>
                    </ToolbarButton>

                    <ToolbarButton title="Inline code" onClick={applyInlineCode}>
                      <span className="font-mono">``</span>
                    </ToolbarButton>

                    <div className="mx-1 h-5 w-px bg-[#deded8]" />

                    <ToolbarButton title="Heading 1" onClick={() => applyHeading(1)}>H1</ToolbarButton>
                    <ToolbarButton title="Heading 2" onClick={() => applyHeading(2)}>H2</ToolbarButton>
                    <ToolbarButton title="Heading 3" onClick={() => applyHeading(3)}>H3</ToolbarButton>

                    <div className="mx-1 h-5 w-px bg-[#deded8]" />

                    <ToolbarButton title="Link — Ctrl/Cmd + K" onClick={applyLink}>Link</ToolbarButton>
                    <ToolbarButton title="Horizontal divider" onClick={applyDivider}>―</ToolbarButton>
                    <ToolbarButton title="Bullet list" onClick={() => applyList(false)}>•</ToolbarButton>
                    <ToolbarButton title="Numbered list" onClick={() => applyList(true)}>1.</ToolbarButton>
                    <ToolbarButton title="Blockquote" onClick={applyQuote}>&quot;</ToolbarButton>
                    <ToolbarButton title="Insert Markdown table" onClick={applyTable}>Table</ToolbarButton>

                    <div className="mx-1 h-5 w-px bg-[#deded8]" />

                    <button
                      type="button"
                      title="Open code editor — Ctrl/Cmd + Shift + C"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={openCodeEditor}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#171717] px-3 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2d2d2d]"
                    >
                      <span className="font-mono">{"</>"}</span>
                      Code
                    </button>
                  </div>

                  <textarea
                    ref={editorRef}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    onKeyDown={handleEditorKeyDown}
                    spellCheck
                    className="min-h-[620px] w-full resize-y border-0 bg-[#fff] px-5 py-6 font-mono text-[13px] leading-7 text-[#252521] outline-none placeholder:text-[#b8b8b0] sm:px-7 sm:py-7"
                    placeholder="Start writing your article..."
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7e7e1] bg-[#fafaf8] px-4 py-2.5 text-[9px] text-[#9a9a92]">
                    <span>
                      Markdown editor · Use the toolbar or keyboard shortcuts.
                    </span>
                    <span className="font-mono">
                      Ctrl/Cmd + Shift + C · code block
                    </span>
                  </div>
                </>
              ) : (
                <div className="min-h-[620px] bg-white p-6 sm:p-9">
                  <MarkdownPreview content={content} />
                </div>
              )}
              </div>
            </ScrollReveal>
          </section>

          {/* Publishing / metadata rail */}
          <aside className="space-y-4 xl:sticky xl:top-6">
            {/* Category */}
            <ScrollReveal delay={80} distance={18}>
              <div className="rounded-[24px] border border-[#d9d9d2] bg-white p-5 shadow-[0_12px_35px_rgba(30,30,20,0.04)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#3568e8]">
                    Step 02
                  </p>
                  <h2 className="mt-1 text-sm font-semibold text-[#171717]">
                    Topic
                  </h2>
                </div>

                <span className="text-[9px] font-mono text-[#aaa9a1]">METADATA</span>
              </div>

              <label
                htmlFor="article-category"
                className="mt-5 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#777770]"
              >
                Category
              </label>

              <input
                id="article-category"
                list="article-category-suggestions"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Python, AI, DevOps..."
                maxLength={60}
                className="mt-2 w-full rounded-xl border border-[#d8d8d1] bg-[#fafaf7] px-3.5 py-3 text-sm font-medium text-[#171717] outline-none transition focus:border-[#3568e8]/50 focus:bg-white focus:ring-4 focus:ring-[#3568e8]/5"
              />

              <datalist id="article-category-suggestions">
                {categories.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {categories.slice(0, 10).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`rounded-full border px-2.5 py-1.5 text-[10px] transition ${
                      category.trim().toLowerCase() === item.toLowerCase()
                        ? "border-[#3568e8] bg-[#3568e8] text-white"
                        : "border-[#deded8] bg-white text-[#66665f] hover:border-[#bfc0ba] hover:text-[#171717]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-[10px] leading-5 text-[#999991]">
                Type any topic. New categories appear automatically in the public topic explorer after publication.
              </p>
            </div>

            {/* Tags */}
            <div className="rounded-[24px] border border-[#d9d9d2] bg-white p-5 shadow-[0_12px_35px_rgba(30,30,20,0.04)]">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#3568e8]">
                Step 03
              </p>
              <h2 className="mt-1 text-sm font-semibold text-[#171717]">
                Tags
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#85857e]">
                Help readers discover related articles.
              </p>

              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="react, javascript, backend"
                className="mt-4 w-full rounded-xl border border-[#d8d8d1] bg-[#fafaf7] px-3.5 py-3 text-sm text-[#171717] outline-none placeholder:text-[#aaa9a1] focus:border-[#3568e8]/50 focus:bg-white focus:ring-4 focus:ring-[#3568e8]/5"
              />

              {getTags().length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {getTags().map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-[10px] font-medium text-[#3568e8]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              </div>
            </ScrollReveal>

            {/* Checklist */}
            <ScrollReveal delay={220} distance={18}>
              <div className="rounded-[24px] border border-[#d9d9d2] bg-white p-5 shadow-[0_12px_35px_rgba(30,30,20,0.04)]">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#171717]">
                  Publishing checklist
                </h2>
                <span className="font-mono text-[10px] text-[#aaa9a1]">
                  {[Boolean(title.trim()), Boolean(description.trim()), Boolean(content.trim()), Boolean(category.trim()), getTags().length > 0].filter(Boolean).length}/5
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {[
                  ["Title", Boolean(title.trim())],
                  ["Description", Boolean(description.trim())],
                  ["Content", Boolean(content.trim())],
                  ["Category", Boolean(category.trim())],
                  ["Tags", getTags().length > 0],
                ].map(([label, complete]) => (
                  <div
                    key={String(label)}
                    className="flex items-center gap-2.5 text-xs"
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        complete
                          ? "bg-[#e8f0ff] text-[#3568e8]"
                          : "bg-[#f0f0eb] text-[#aaa9a1]"
                      }`}
                    >
                      {complete ? "✓" : "○"}
                    </span>
                    <span
                      className={
                        complete ? "text-[#44443e]" : "text-[#999991]"
                      }
                    >
                      {String(label)}
                    </span>
                  </div>
                ))}
              </div>
              </div>
            </ScrollReveal>

            {/* Shortcuts */}
            <ScrollReveal delay={290} distance={18}>
              <div className="rounded-[24px] border border-[#d9d9d2] bg-[#fafaf8] p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#777770]">
                Shortcuts
              </h2>

              <div className="mt-4 space-y-2.5 text-[10px] text-[#777770]">
                <div className="flex items-center justify-between gap-4">
                  <code className="rounded-md bg-white px-2 py-1 font-mono text-[#55554f] shadow-sm">Ctrl/Cmd + B</code>
                  <span>Bold</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <code className="rounded-md bg-white px-2 py-1 font-mono text-[#55554f] shadow-sm">Ctrl/Cmd + I</code>
                  <span>Italic</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <code className="rounded-md bg-white px-2 py-1 font-mono text-[#55554f] shadow-sm">Ctrl/Cmd + K</code>
                  <span>Link</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <code className="rounded-md bg-white px-2 py-1 font-mono text-[#55554f] shadow-sm">Ctrl/Cmd + Shift + C</code>
                  <span>Code</span>
                </div>
              </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={360} distance={18}>
              <div className="rounded-[24px] border border-[#d9d9d2] bg-[#171717] p-5 text-white shadow-[0_16px_50px_rgba(20,20,20,0.12)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8eaafc]">
                    Publish
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">
                    Ready when you are.
                  </h2>
                </div>

                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-white/60">
                  {status}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveArticle("draft")}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  {saving && status === "draft" ? "Saving..." : "Save draft"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveArticle("published")}
                  className="rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-[#171717] transition hover:bg-[#e8e8e3] disabled:opacity-50"
                >
                  {saving && status === "published" ? "Publishing..." : "Publish"}
                </button>
              </div>
              </div>
            </ScrollReveal>

          </aside>
        </div>
      </main>
      {/* CodeMirror modal */}
      {showCodeEditor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setShowCodeEditor(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="code-editor-title"
            className="flex w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2
                  id="code-editor-title"
                  className="font-semibold text-gray-950"
                >
                  Insert Code Block
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Write your code here, choose the
                  language, then insert it into the
                  Markdown article.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCodeEditor(false)
                }
                className="rounded-md px-2 py-1 text-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close code editor"
              >
                ×
              </button>
            </div>

            {/* Language selector */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
              <label
                htmlFor="code-language"
                className="text-sm font-medium text-gray-700"
              >
                Language
              </label>

              <select
                id="code-language"
                value={codeLanguage}
                onChange={(event) =>
                  setCodeLanguage(
                    event.target
                      .value as CodeLanguage,
                  )
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-950"
              >
                {(
                  Object.keys(
                    languageLabels,
                  ) as CodeLanguage[]
                ).map((language) => (
                  <option
                    key={language}
                    value={language}
                  >
                    {languageLabels[language]}
                  </option>
                ))}
              </select>
            </div>

            {/* CodeMirror */}
            <div className="bg-white p-4">
              <div className="overflow-hidden rounded-lg border border-gray-300">
                <CodeMirror
                  value={codeDraft}
                  height="440px"
                  theme="light"
                  extensions={codeExtensions}
                  onChange={(value) =>
                    setCodeDraft(value)
                  }
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

            {/* Modal footer */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-4">
              <div className="text-xs text-gray-500">
                The code will be stored as a Markdown
                fenced code block.
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowCodeEditor(false)
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!codeDraft.trim()}
                  onClick={insertCodeBlock}
                  className="rounded-lg bg-gray-950 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Insert code block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}