"use client";

import { useState } from "react";

type CodeCopyButtonProps = {
  code: string;
};

export default function CodeCopyButton({
  code,
}: CodeCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyText(text: string) {
    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    document.execCommand("copy");

    textarea.remove();
  }

  async function handleCopy() {
    try {
      await copyText(code);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={
        copied ? "Code copied" : "Copy code"
      }
      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[#deded9] bg-white px-2.5 text-[10px] font-medium text-[#777771] transition-colors hover:border-[#cfcfc9] hover:bg-[#f8f8f6] hover:text-[#333330] active:scale-[0.98]"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}

      <span>
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
      />

      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
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