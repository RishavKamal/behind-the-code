"use client";

import { useEffect, useRef, useState } from "react";

const PULL_THRESHOLD = 90;
const MAX_PULL_DISTANCE = 130;

export default function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      if (window.scrollY !== 0 || isRefreshing) {
        return;
      }

      startY.current = event.touches[0].clientY;
      pulling.current = true;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!pulling.current || isRefreshing) {
        return;
      }

      /*
       * If the user has moved away from the top,
       * cancel the pull gesture.
       */
      if (window.scrollY > 0) {
        pulling.current = false;
        setPullDistance(0);
        return;
      }

      const currentY = event.touches[0].clientY;
      const distance = currentY - startY.current;

      /*
       * Only react when the user is pulling DOWN.
       *
       * Normal upward scrolling produces a negative value
       * and therefore does nothing.
       */
      if (distance <= 0) {
        setPullDistance(0);
        return;
      }

      /*
       * Resistance makes the pull feel natural instead of
       * allowing the indicator to move one-to-one with the finger.
       */
      const resistedDistance = Math.min(
        distance * 0.55,
        MAX_PULL_DISTANCE,
      );

      setPullDistance(resistedDistance);

      /*
       * Prevent the browser's native overscroll while
       * our custom pull interaction is active.
       */
      if (distance > 5) {
        event.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (!pulling.current) {
        return;
      }

      pulling.current = false;

      if (pullDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        setPullDistance(0);

        /*
         * Give the animation a moment to appear before
         * performing the actual refresh.
         */
        window.setTimeout(() => {
          window.location.reload();
        }, 450);

        return;
      }

      setPullDistance(0);
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });

    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    document.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });

    return () => {
      document.removeEventListener(
        "touchstart",
        handleTouchStart,
      );

      document.removeEventListener(
        "touchmove",
        handleTouchMove,
      );

      document.removeEventListener(
        "touchend",
        handleTouchEnd,
      );
    };
  }, [pullDistance, isRefreshing]);

  if (pullDistance === 0 && !isRefreshing) {
    return null;
  }

  const progress = Math.min(
    pullDistance / PULL_THRESHOLD,
    1,
  );

  const ready = pullDistance >= PULL_THRESHOLD;

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-0 z-[100] -translate-x-1/2"
      style={{
        transform: `translateX(-50%) translateY(${Math.max(
          pullDistance - 52,
          -52,
        )}px)`,
      }}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border bg-[#fafaf8]/95 shadow-[0_8px_25px_rgba(23,23,23,0.10)] backdrop-blur-sm transition-colors ${
          ready
            ? "border-[#171717]"
            : "border-[#deded9]"
        }`}
      >
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full ${
            ready ? "bg-[#171717]" : "bg-[#f1f1ee]"
          }`}
          style={{
            transform: `rotate(${progress * 180}deg)`,
          }}
        >
          {isRefreshing ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`h-3.5 w-3.5 ${
                ready
                  ? "text-white"
                  : "text-[#777771]"
              }`}
            >
              <path
                d="M12 5v14"
                strokeLinecap="round"
              />
              <path
                d="m6 13 6 6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}