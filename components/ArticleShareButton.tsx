"use client";

import { useState } from "react";

type ArticleShareButtonProps = {
  title: string;
};

export default function ArticleShareButton({
  title,
}: ArticleShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(url);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      /*
       * Ignore the error when the user closes/cancels
       * the native share dialog.
       */
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error("Share failed:", error);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={
        copied ? "Article link copied" : "Share article"
      }
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#deded9] bg-white px-3.5 text-sm font-medium text-[#555550] transition-all duration-200 hover:border-[#cfcfc9] hover:bg-[#f8f8f6] hover:text-[#171717] active:scale-[0.98]"
    >
      {copied ? (
        <>
          <CheckIcon />
          <span>Copied</span>
        </>
      ) : (
        <>
          <ShareIcon />
          <span>Share</span>
        </>
      )}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4" />
      <path d="m15.4 6.5-6.8 4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}