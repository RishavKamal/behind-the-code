"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function ArticleCompletion() {
  const [completed, setCompleted] = useState(false);

  const sentinelRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCompleted(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "0px 0px -80px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* End-of-article trigger */}
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="h-px w-full"
      />

      {/* Completion Card */}
      <div
        className={`mt-10 overflow-hidden rounded-2xl border border-[#deded9] bg-[#fafaf8] transition-all duration-500 ${
          completed
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <div className="px-6 py-7 md:px-8 md:py-8">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#deded9] bg-white text-[#3568e8]">
              <CheckIcon />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#333330]">
                You&apos;ve reached the end
              </p>

              <p className="mt-1.5 text-sm leading-6 text-[#777771]">
                Thanks for reading. Explore more
                articles to keep learning and
                building.
              </p>

              <Link
                href="/articles"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#3568e8] transition-colors hover:text-[#214fbf]"
              >
                <span>Browse more articles</span>
                <ArrowRightIcon />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
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

function ArrowRightIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}