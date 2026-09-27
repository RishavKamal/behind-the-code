import type { Metadata } from "next";
import Link from "next/link";
import ArticleLikeButton from "./article-like-button";
import ArticleBookmarkButton from "./article-bookmark-button";
import ArticleComments from "./article-comments";
import { notFound } from "next/navigation";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

import { createClient } from "@/components/lib/supabase/server";
import ScrollReveal from "@/components/scroll-reveal";
import ArticleTableOfContents, {
  type ArticleHeading,
} from "@/components/ArticleTableOfContents";
import ArticleReadingProgress from "@/components/ArticleReadingProgress";
import ArticleShareButton from "@/components/ArticleShareButton";
import CodeCopyButton from "@/components/CodeCopyButton";
import ArticleBackToTop from "@/components/ArticleBackToTop";
import ArticleCompletion from "@/components/ArticleCompletion";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const siteUrl = "https://blog.rishavkamal.com";

/* -------------------------------------------------------------------------- */
/* SEO Metadata                                                               */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("title, description, category, slug")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!article) {
    return {
      title: "Article Not Found",
      description:
        "The requested article could not be found.",
    };
  }

  const title = `${article.title} | Behind the Code`;

  const description =
    article.description ||
    `Read ${article.title} on Behind the Code, a developer publishing platform for developers to build, learn, and share.`;

  const canonicalUrl = `${siteUrl}/articles/${article.slug}`;

  return {
    title,
    description,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      type: "article",
      url: canonicalUrl,
      siteName: "Behind the Code",
      title,
      description,
      locale: "en_US",
    },

    twitter: {
      card: "summary",
      title,
      description,
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function calculateReadTime(content: string) {
  const wordCount = content.trim()
    ? content.trim().split(/\s+/).length
    : 0;

  const minutes = Math.max(
    1,
    Math.ceil(wordCount / 200),
  );

  return `${minutes} min read`;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function slugifyHeading(text: string) {
  const slug = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(
      /[`~!@#$%^&*()+=[\]{};:'",.<>/?\\|]/g,
      "",
    )
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "section";
}

/* -------------------------------------------------------------------------- */
/* Inline Markdown                                                            */
/* -------------------------------------------------------------------------- */

type InlinePart =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "bold";
      value: string;
    }
  | {
      type: "italic";
      value: string;
    }
  | {
      type: "boldItalic";
      value: string;
    }
  | {
      type: "strike";
      value: string;
    }
  | {
      type: "code";
      value: string;
    }
  | {
      type: "link";
      value: string;
      href: string;
    };

type ContentBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "heading";
      text: string;
      level: 1 | 2 | 3;
      id?: string;
    }
  | {
      type: "code";
      text: string;
      language: string;
    }
  | {
      type: "quote";
      text: string;
    }
  | {
      type: "list";
      items: string[];
      ordered: boolean;
    }
  | {
      type: "hr";
    }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
    };

function renderInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];

  const pattern =
    /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|_(.+?)_|~~(.+?)~~|`(.+?)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;

  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push({
        type: "text",
        value: text.slice(lastIndex, index),
      });
    }

    if (match[2]) {
      parts.push({
        type: "boldItalic",
        value: match[2],
      });
    } else if (match[3] || match[4]) {
      parts.push({
        type: "bold",
        value: match[3] ?? match[4],
      });
    } else if (match[5] || match[6]) {
      parts.push({
        type: "italic",
        value: match[5] ?? match[6],
      });
    } else if (match[7]) {
      parts.push({
        type: "strike",
        value: match[7],
      });
    } else if (match[8]) {
      parts.push({
        type: "code",
        value: match[8],
      });
    } else if (match[9] && match[10]) {
      parts.push({
        type: "link",
        value: match[9],
        href: match[10],
      });
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      value: text.slice(lastIndex),
    });
  }

  return parts;
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = renderInline(text);

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "bold") {
          return (
            <strong
              key={index}
              className="font-semibold text-[#333330]"
            >
              {part.value}
            </strong>
          );
        }

        if (part.type === "boldItalic") {
          return (
            <strong
              key={index}
              className="font-semibold italic text-[#333330]"
            >
              {part.value}
            </strong>
          );
        }

        if (part.type === "italic") {
          return (
            <em
              key={index}
              className="italic"
            >
              {part.value}
            </em>
          );
        }

        if (part.type === "strike") {
          return (
            <del
              key={index}
              className="text-[#777771]"
            >
              {part.value}
            </del>
          );
        }

        if (part.type === "code") {
          return (
            <code
              key={index}
              className="rounded-md border border-[#deded9] bg-[#f1f1ed] px-1.5 py-0.5 font-mono text-[0.9em] text-[#333330]"
            >
              {part.value}
            </code>
          );
        }

        if (part.type === "link") {
          return (
            <a
              key={index}
              href={part.href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#3568e8] underline decoration-[#3568e8]/30 underline-offset-4 transition-colors hover:text-[#214fbf] hover:decoration-[#214fbf]/50"
            >
              {part.value}
            </a>
          );
        }

        return (
          <span key={index}>
            {part.value}
          </span>
        );
      })}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Code                                                                       */
/* -------------------------------------------------------------------------- */

function normalizeLanguage(language: string) {
  const value = language.trim().toLowerCase();

  const aliases: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    rb: "ruby",
    sh: "bash",
    shell: "bash",
    yml: "yaml",
    md: "markdown",
    c: "c",
    "c++": "cpp",
    cc: "cpp",
    h: "cpp",
    hpp: "cpp",
    cs: "csharp",
    rs: "rust",
    golang: "go",
    text: "text",
    txt: "text",
  };

  return aliases[value] ?? (value || "text");
}

function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const normalizedLanguage =
    normalizeLanguage(language);

  return (
    <div className="my-10 overflow-hidden rounded-xl border border-[#deded9] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.025)]">
      <div className="flex items-center justify-between border-b border-[#deded9] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#d6d6d0]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#d6d6d0]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#d6d6d0]" />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#aaa9a3]">
            {normalizedLanguage}
          </span>

          <CodeCopyButton code={code} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={normalizedLanguage}
          style={oneLight}
          showLineNumbers
          wrapLongLines={false}
          customStyle={{
            margin: 0,
            padding: "1.25rem 0",
            background: "#ffffff",
            fontSize: "0.875rem",
            lineHeight: "1.75",
          }}
          codeTagProps={{
            style: {
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            },
          }}
          lineNumberStyle={{
            minWidth: "3.5em",
            paddingRight: "1em",
            color: "#aaa9a3",
            textAlign: "right",
            userSelect: "none",
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tables                                                                     */
/* -------------------------------------------------------------------------- */

function isTableSeparator(line: string) {
  const cells = line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

  return (
    cells.length > 0 &&
    cells.every((cell) =>
      /^:?-{3,}:?$/.test(cell),
    )
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

/* -------------------------------------------------------------------------- */
/* Markdown Parser                                                            */
/* -------------------------------------------------------------------------- */

function parseMarkdown(
  content: string,
): ContentBlock[] {
  const lines = content.split(/\r?\n/);
  const blocks: ContentBlock[] = [];

  let paragraphLines: string[] = [];

  let listItems: string[] = [];
  let listOrdered = false;

  let codeLines: string[] = [];
  let insideCodeBlock = false;
  let codeLanguage = "";

  function flushParagraph() {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push({
      type: "paragraph",
      text: paragraphLines.join(" "),
    });

    paragraphLines = [];
  }

  function flushList() {
    if (listItems.length === 0) {
      return;
    }

    blocks.push({
      type: "list",
      items: [...listItems],
      ordered: listOrdered,
    });

    listItems = [];
    listOrdered = false;
  }

  function flushCode() {
    blocks.push({
      type: "code",
      text: codeLines.join("\n"),
      language: codeLanguage,
    });

    codeLines = [];
    codeLanguage = "";
  }

  for (
    let index = 0;
    index < lines.length;
    index += 1
  ) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("```")) {
      flushParagraph();
      flushList();

      if (insideCodeBlock) {
        flushCode();
        insideCodeBlock = false;
      } else {
        insideCodeBlock = true;
        codeLanguage =
          trimmedLine.slice(3).trim();
      }

      continue;
    }

    if (insideCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (trimmedLine === "") {
      flushParagraph();
      flushList();
      continue;
    }

    if (
      /^(-{3,}|\*{3,}|_{3,})$/.test(
        trimmedLine,
      )
    ) {
      flushParagraph();
      flushList();

      blocks.push({
        type: "hr",
      });

      continue;
    }

    if (
      index + 1 < lines.length &&
      trimmedLine.includes("|") &&
      isTableSeparator(lines[index + 1])
    ) {
      flushParagraph();
      flushList();

      const headers =
        splitTableRow(trimmedLine);

      const rows: string[][] = [];

      index += 2;

      while (index < lines.length) {
        const tableLine =
          lines[index].trim();

        if (
          !tableLine ||
          !tableLine.includes("|")
        ) {
          index -= 1;
          break;
        }

        rows.push(
          splitTableRow(tableLine),
        );

        index += 1;
      }

      blocks.push({
        type: "table",
        headers,
        rows,
      });

      continue;
    }

    if (trimmedLine.startsWith("### ")) {
      flushParagraph();
      flushList();

      blocks.push({
        type: "heading",
        level: 3,
        text: trimmedLine.slice(4),
      });

      continue;
    }

    if (trimmedLine.startsWith("## ")) {
      flushParagraph();
      flushList();

      blocks.push({
        type: "heading",
        level: 2,
        text: trimmedLine.slice(3),
      });

      continue;
    }

    if (trimmedLine.startsWith("# ")) {
      flushParagraph();
      flushList();

      blocks.push({
        type: "heading",
        level: 1,
        text: trimmedLine.slice(2),
      });

      continue;
    }

    if (trimmedLine.startsWith("> ")) {
      flushParagraph();
      flushList();

      blocks.push({
        type: "quote",
        text: trimmedLine.slice(2),
      });

      continue;
    }

    const orderedMatch =
      trimmedLine.match(
        /^\d+\.\s+(.+)$/,
      );

    if (orderedMatch) {
      flushParagraph();

      if (
        listItems.length > 0 &&
        !listOrdered
      ) {
        flushList();
      }

      listOrdered = true;
      listItems.push(orderedMatch[1]);

      continue;
    }

    const unorderedMatch =
      trimmedLine.match(
        /^[-*+]\s+(.+)$/,
      );

    if (unorderedMatch) {
      flushParagraph();

      if (
        listItems.length > 0 &&
        listOrdered
      ) {
        flushList();
      }

      listOrdered = false;
      listItems.push(unorderedMatch[1]);

      continue;
    }

    paragraphLines.push(trimmedLine);
  }

  flushParagraph();
  flushList();

  if (insideCodeBlock) {
    flushCode();
  }

  return blocks;
}

/* -------------------------------------------------------------------------- */
/* Heading IDs                                                                */
/* -------------------------------------------------------------------------- */

function addHeadingIds(
  blocks: ContentBlock[],
) {
  const usedIds = new Map<
    string,
    number
  >();

  return blocks.map((block) => {
    if (block.type !== "heading") {
      return block;
    }

    const baseId =
      slugifyHeading(block.text);

    const existingCount =
      usedIds.get(baseId) ?? 0;

    usedIds.set(
      baseId,
      existingCount + 1,
    );

    const id =
      existingCount === 0
        ? baseId
        : `${baseId}-${existingCount + 1}`;

    return {
      ...block,
      id,
    };
  });
}

function getArticleHeadings(
  blocks: ContentBlock[],
): ArticleHeading[] {
  return blocks
    .filter(
      (
        block,
      ): block is Extract<
        ContentBlock,
        { type: "heading" }
      > =>
        block.type === "heading" &&
        Boolean(block.id),
    )
    .map((block) => ({
      id: block.id as string,
      text: block.text,
      level: block.level,
    }));
}

/* -------------------------------------------------------------------------- */
/* Markdown Block Renderer                                                    */
/* -------------------------------------------------------------------------- */

function MarkdownBlock({
  block,
  index,
}: {
  block: ContentBlock;
  index: number;
}) {
  if (block.type === "heading") {
    const headingClass =
      block.level === 1
        ? "scroll-mt-28 pt-8 text-3xl font-semibold leading-tight tracking-[-0.035em] text-[#171717] md:text-4xl"
        : block.level === 2
          ? "scroll-mt-28 pt-8 text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#171717] md:text-3xl"
          : "scroll-mt-28 pt-6 text-xl font-semibold leading-tight tracking-[-0.03em] text-[#171717] md:text-2xl";

    if (block.level === 3) {
      return (
        <h3
          id={block.id}
          key={index}
          className={headingClass}
        >
          <InlineMarkdown
            text={block.text}
          />
        </h3>
      );
    }

    return (
      <h2
        id={block.id}
        key={index}
        className={headingClass}
      >
        <InlineMarkdown
          text={block.text}
        />
      </h2>
    );
  }

  if (block.type === "code") {
    return (
      <CodeBlock
        key={index}
        code={block.text}
        language={block.language}
      />
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote
        key={index}
        className="border-l-2 border-[#aaa9a3] pl-5 text-base italic leading-8 text-[#555550] md:text-lg md:leading-[1.9]"
      >
        <InlineMarkdown
          text={block.text}
        />
      </blockquote>
    );
  }

  if (block.type === "list") {
    if (block.ordered) {
      return (
        <ol
          key={index}
          className="list-decimal space-y-2 pl-6 text-base leading-8 text-[#555550] md:text-lg md:leading-[1.9]"
        >
          {block.items.map(
            (item, itemIndex) => (
              <li key={itemIndex}>
                <InlineMarkdown
                  text={item}
                />
              </li>
            ),
          )}
        </ol>
      );
    }

    return (
      <ul
        key={index}
        className="list-disc space-y-2 pl-6 text-base leading-8 text-[#555550] md:text-lg md:leading-[1.9]"
      >
        {block.items.map(
          (item, itemIndex) => (
            <li key={itemIndex}>
              <InlineMarkdown
                text={item}
              />
            </li>
          ),
        )}
      </ul>
    );
  }

  if (block.type === "hr") {
    return (
      <hr
        key={index}
        className="my-10 border-0 border-t border-[#deded9]"
      />
    );
  }

  if (block.type === "table") {
    return (
      <div
        key={index}
        className="my-10 overflow-x-auto rounded-xl border border-[#deded9] bg-white"
      >
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#deded9] bg-[#f8f8f5]">
              {block.headers.map(
                (header, headerIndex) => (
                  <th
                    key={headerIndex}
                    className="px-4 py-3 font-semibold text-[#333330]"
                  >
                    <InlineMarkdown
                      text={header}
                    />
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {block.rows.map(
              (row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-[#edede8] last:border-b-0"
                >
                  {block.headers.map(
                    (_, columnIndex) => (
                      <td
                        key={columnIndex}
                        className="px-4 py-3 leading-6 text-[#555550]"
                      >
                        <InlineMarkdown
                          text={
                            row[
                              columnIndex
                            ] ?? ""
                          }
                        />
                      </td>
                    ),
                  )}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <p
      key={index}
      className="text-base leading-8 text-[#555550] md:text-lg md:leading-[1.9]"
    >
      <InlineMarkdown
        text={block.text}
      />
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function ArticlePage({
  params,
}: ArticlePageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: article, error } =
    await supabase
      .from("articles")
      .select(
        "id, title, description, content, category, created_at, published_at, slug",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

  if (error || !article) {
    notFound();
  }

  const publishedDate =
    article.published_at ??
    article.created_at;

  const readTime = calculateReadTime(
    article.content,
  );

  const parsedContentBlocks =
    parseMarkdown(article.content);

  const contentBlocks =
    addHeadingIds(
      parsedContentBlocks,
    );

  const articleHeadings =
    getArticleHeadings(
      contentBlocks,
    );

  return (
    <main>
      {/* ------------------------------------------------------------------ */}
      {/* Reading Progress + Back to Top                                     */}
      {/* ------------------------------------------------------------------ */}

      <ArticleReadingProgress />
      <ArticleBackToTop />

      {/* ------------------------------------------------------------------ */}
      {/* Article Header                                                     */}
      {/* ------------------------------------------------------------------ */}

      <header className="border-b border-[#deded9]">
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-14 md:pb-20 md:pt-18">
          <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="hidden lg:block" />

            <div className="min-w-0 max-w-3xl">
              <ScrollReveal distance={18}>
                <Link
                  href="/articles"
                  className="inline-flex items-center gap-2 text-sm text-[#777771] transition-colors hover:text-[#171717]"
                >
                  <span aria-hidden="true">
                    ←
                  </span>

                  <span>
                    Back to articles
                  </span>
                </Link>
              </ScrollReveal>

              <ScrollReveal
                delay={100}
                distance={20}
              >
                <div className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#777771]">
                  <span>
                    {article.category}
                  </span>

                  <span aria-hidden="true">
                    ·
                  </span>

                  <span>{readTime}</span>

                  <span aria-hidden="true">
                    ·
                  </span>

                  <time dateTime={publishedDate}>
                    {formatDate(
                      publishedDate,
                    )}
                  </time>
                </div>
              </ScrollReveal>

              <ScrollReveal
                delay={180}
                distance={24}
              >
                <h1 className="mt-5 text-4xl font-bold leading-[0.98] tracking-[-0.05em] text-[#171717] sm:text-5xl md:text-6xl">
                  {article.title}
                </h1>
              </ScrollReveal>

              {article.description && (
                <ScrollReveal
                  delay={260}
                  distance={22}
                >
                  <p className="mt-6 max-w-3xl text-base leading-7 text-[#777771] md:text-lg md:leading-8">
                    {article.description}
                  </p>
                </ScrollReveal>
              )}

              <ScrollReveal
                delay={340}
                distance={20}
              >
                <div className="mt-9 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#171717] text-xs font-semibold tracking-tight text-white">
                    RK
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[#333330]">
                      Rishav Kamal
                    </p>

                    <p className="mt-0.5 text-xs text-[#999992]">
                      Published by Behind the
                      Code
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Article Body                                                       */}
      {/* ------------------------------------------------------------------ */}

      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-14 md:py-20 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        {/* Desktop TOC */}
        <div className="relative hidden lg:block">
          <ArticleTableOfContents
            headings={articleHeadings}
          />
        </div>

        {/* Article */}
        <article
          id="article-reading-content"
          className="min-w-0 max-w-3xl"
        >
          {/* Mobile TOC */}
          <div className="lg:hidden">
            <ArticleTableOfContents
              headings={articleHeadings}
            />
          </div>

          <div className="space-y-8">
            {contentBlocks.map(
              (block, index) => (
                <ScrollReveal
                  key={index}
                  delay={Math.min(
                    index * 35,
                    280,
                  )}
                  distance={20}
                >
                  <MarkdownBlock
                    block={block}
                    index={index}
                  />
                </ScrollReveal>
              ),
            )}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Article Completion                                               */}
          {/* ---------------------------------------------------------------- */}

          <ArticleCompletion />

          {/* ---------------------------------------------------------------- */}
          {/* Article Footer                                                   */}
          {/* ---------------------------------------------------------------- */}

          <ScrollReveal distance={24}>
            <div className="mt-16 border-t border-[#deded9] pt-8 md:mt-20">
              <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/articles"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#777771] transition-colors hover:text-[#171717]"
                >
                  <span aria-hidden="true">
                    ←
                  </span>

                  <span>
                    More articles
                  </span>
                </Link>

                <div className="flex items-center gap-3">
                  <ArticleShareButton
                    title={article.title}
                  />

                  <ArticleLikeButton
                    articleId={article.id}
                  />

                  <ArticleBookmarkButton
                    articleId={article.id}
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ArticleComments
            articleId={article.id}
          />
        </article>
      </div>
    </main>
  );
}