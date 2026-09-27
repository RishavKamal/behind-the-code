"use client";

import { useEffect, useState } from "react";

export default function ArticleBackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(window.scrollY > 200);
    };

    updateVisibility();

    window.addEventListener("scroll", updateVisibility, {
      passive: true,
    });

    return () => {
      window.removeEventListener(
        "scroll",
        updateVisibility,
      );
    };
  }, []);

  function handleBackToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <button
      type="button"
      onClick={handleBackToTop}
      aria-label="Back to top"
      className={`fixed bottom-6 right-6 z-40 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#deded9] bg-white text-[#777771] shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 hover:border-[#cfcfc9] hover:bg-[#f8f8f6] hover:text-[#171717] active:scale-[0.96] ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ArrowUpIcon />
    </button>
  );
}

function ArrowUpIcon() {
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
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
  );
}