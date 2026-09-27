"use client";

import { useEffect, useState } from "react";

export default function ArticleReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const article = document.getElementById(
        "article-reading-content",
      );

      if (!article) {
        setProgress(0);
        return;
      }

      const articleTop =
        article.getBoundingClientRect().top +
        window.scrollY;

      const articleHeight = article.offsetHeight;
      const viewportHeight = window.innerHeight;

      const scrollableDistance =
        articleHeight - viewportHeight;

      if (scrollableDistance <= 0) {
        setProgress(100);
        return;
      }

      const currentScroll =
        window.scrollY - articleTop;

      const percentage =
        (currentScroll / scrollableDistance) * 100;

      setProgress(
        Math.min(
          100,
          Math.max(0, percentage),
        ),
      );
    };

    let animationFrameId: number | null = null;

    const handleScroll = () => {
      if (animationFrameId !== null) {
        return;
      }

      animationFrameId =
        window.requestAnimationFrame(() => {
          updateProgress();
          animationFrameId = null;
        });
    };

    updateProgress();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    window.addEventListener(
      "resize",
      updateProgress,
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
      );

      window.removeEventListener(
        "resize",
        updateProgress,
      );

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(
          animationFrameId,
        );
      }
    };
  }, []);

  const visibleWidth =
    progress <= 0
      ? "3px"
      : `${progress}%`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[60] h-[3px] w-full"
    >
      <div
        className="h-full bg-[#3568e8] transition-[width] duration-100 ease-out"
        style={{
          width: visibleWidth,
        }}
      />
    </div>
  );
}