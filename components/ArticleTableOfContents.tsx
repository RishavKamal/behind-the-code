"use client";

import { useEffect, useState } from "react";

export type ArticleHeading = {
  id: string;
  text: string;
  level: 1 | 2 | 3;
};

type ArticleTableOfContentsProps = {
  headings: ArticleHeading[];
};

export default function ArticleTableOfContents({
  headings,
}: ArticleTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  /*
   * ---------------------------------------------------------------
   * Entrance animation
   * ---------------------------------------------------------------
   */
  useEffect(() => {
    setMounted(true);
  }, []);

  /*
   * ---------------------------------------------------------------
   * Active heading tracking
   * ---------------------------------------------------------------
   *
   * We determine the active heading based on its position relative
   * to the viewport rather than relying on IntersectionObserver.
   *
   * This gives us predictable behaviour for long articles where
   * sections can have very different heights.
   * ---------------------------------------------------------------
   */
  useEffect(() => {
    if (headings.length === 0) {
      return;
    }

    const headingElements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (headingElements.length === 0) {
      return;
    }

    let animationFrameId: number | null = null;

    const updateActiveHeading = () => {
      /*
       * Prevent multiple calculations during one browser frame.
       */
      if (animationFrameId !== null) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(() => {
        /*
         * The article navbar occupies approximately 100px.
         *
         * A heading becomes active once it reaches this reading
         * position.
         */
        const activationLine = 140;

        let currentHeading = headingElements[0];

        for (const heading of headingElements) {
          const top = heading.getBoundingClientRect().top;

          if (top <= activationLine) {
            currentHeading = heading;
          } else {
            break;
          }
        }

        setActiveId((previousId) => {
          if (previousId === currentHeading.id) {
            return previousId;
          }

          return currentHeading.id;
        });

        animationFrameId = null;
      });
    };

    /*
     * Set initial active section.
     */
    updateActiveHeading();

    /*
     * Update while scrolling.
     */
    window.addEventListener("scroll", updateActiveHeading, {
      passive: true,
    });

    /*
     * Recalculate if viewport size changes.
     */
    window.addEventListener("resize", updateActiveHeading);

    /*
     * -----------------------------------------------------------
     * Browser navigation
     * -----------------------------------------------------------
     *
     * Handles:
     *
     * Back
     * Forward
     * Direct hash navigation
     * -----------------------------------------------------------
     */
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");

      if (!hash) {
        updateActiveHeading();
        return;
      }

      const matchingHeading = headingElements.find(
        (heading) => heading.id === hash,
      );

      if (matchingHeading) {
        setActiveId(matchingHeading.id);
      }
    };

    window.addEventListener("hashchange", handleHashChange);

    /*
     * Cleanup
     */
    return () => {
      window.removeEventListener("scroll", updateActiveHeading);
      window.removeEventListener("resize", updateActiveHeading);
      window.removeEventListener("hashchange", handleHashChange);

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [headings]);

  /*
   * ---------------------------------------------------------------
   * No TOC when there are no headings.
   * ---------------------------------------------------------------
   */
  if (headings.length === 0) {
    return null;
  }

  /*
   * ---------------------------------------------------------------
   * Smooth scroll to heading
   * ---------------------------------------------------------------
   */
  function handleClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) {
    event.preventDefault();

    const element = document.getElementById(id);

    if (!element) {
      return;
    }

    /*
     * Space required below the fixed navbar.
     */
    const headerOffset = 100;

    const targetPosition =
      element.getBoundingClientRect().top +
      window.scrollY -
      headerOffset;

    /*
     * Update URL without triggering the browser's default jump.
     */
    window.history.pushState(null, "", `#${id}`);

    /*
     * Immediately update the TOC.
     */
    setActiveId(id);

    /*
     * Smooth scroll.
     */
    window.scrollTo({
      top: Math.max(0, targetPosition),
      behavior: "smooth",
    });
  }

  return (
    <>
      {/* ============================================================
          DESKTOP TABLE OF CONTENTS
          ============================================================ */}

      <aside
        className={`
          fixed
          left-[max(24px,calc(50vw-512px))]
          top-[160px]
          z-30
          hidden
          w-[190px]
          lg:block
        `}
      >
        <nav
          aria-label="Table of contents"
          className={`
            max-h-[calc(100vh-184px)]
            overflow-y-auto
            rounded-2xl
            border
            border-[#deded9]
            bg-white
            p-5
            shadow-[0_8px_30px_rgba(20,20,20,0.025)]
            transition-all
            duration-500
            ease-out
            ${
              mounted
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0"
            }
          `}
        >
          {/* --------------------------------------------------------
              TOC HEADER
              -------------------------------------------------------- */}

          <div className="mb-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#3568e8]">
              On this page
            </p>

            <p className="mt-1 text-sm font-semibold text-[#333330]">
              Contents
            </p>
          </div>

          {/* --------------------------------------------------------
              TOC ITEMS
              -------------------------------------------------------- */}

          <div className="space-y-1">
            {headings.map((heading, index) => {
              const isActive = activeId === heading.id;

              return (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  onClick={(event) =>
                    handleClick(event, heading.id)
                  }
                  aria-current={isActive ? "location" : undefined}
                  className={`
                    group
                    relative
                    flex
                    items-start
                    gap-3
                    overflow-hidden
                    rounded-lg
                    px-3
                    py-2
                    text-left
                    text-xs
                    leading-5
                    transition-all
                    duration-300
                    ease-out

                    ${
                      heading.level === 3
                        ? "ml-3"
                        : heading.level === 2
                          ? "ml-1"
                          : ""
                    }

                    ${
                      isActive
                        ? "bg-[#f0f3ff] text-[#3568e8]"
                        : "text-[#777771] hover:bg-[#f7f7f4] hover:text-[#333330]"
                    }
                  `}
                >
                  {/* ------------------------------------------------
                      Active indicator
                      ------------------------------------------------ */}

                  <span
                    aria-hidden="true"
                    className={`
                      absolute
                      left-0
                      top-1/2
                      h-5
                      w-0.5
                      -translate-y-1/2
                      rounded-full
                      bg-[#3568e8]
                      transition-all
                      duration-300
                      ease-out

                      ${
                        isActive
                          ? "scale-y-100 opacity-100"
                          : "scale-y-0 opacity-0"
                      }
                    `}
                  />

                  {/* ------------------------------------------------
                      Number
                      ------------------------------------------------ */}

                  <span
                    className={`
                      mt-0.5
                      shrink-0
                      font-mono
                      text-[9px]
                      transition-colors
                      duration-300

                      ${
                        isActive
                          ? "text-[#3568e8]"
                          : "text-[#aaa9a1]"
                      }
                    `}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {/* ------------------------------------------------
                      Heading text
                      ------------------------------------------------ */}

                  <span className="line-clamp-2 transition-colors duration-300">
                    {heading.text}
                  </span>
                </a>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* ============================================================
          MOBILE TABLE OF CONTENTS
          ============================================================ */}

      <div className="mb-10 lg:hidden">
        <details className="group overflow-hidden rounded-2xl border border-[#deded9] bg-white shadow-[0_8px_30px_rgba(20,20,20,0.025)]">
          {/* --------------------------------------------------------
              MOBILE HEADER
              -------------------------------------------------------- */}

          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 [&::-webkit-details-marker]:hidden">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#3568e8]">
                On this page
              </p>

              <p className="mt-1 text-sm font-semibold text-[#333330]">
                {headings.length}{" "}
                {headings.length === 1
                  ? "section"
                  : "sections"}
              </p>
            </div>

            {/* Chevron */}

            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5f1] text-[#777771] transition-transform duration-300 group-open:rotate-180">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </summary>

          {/* --------------------------------------------------------
              MOBILE ITEMS
              -------------------------------------------------------- */}

          <div className="border-t border-[#deded9] px-3 py-3">
            {headings.map((heading, index) => {
              const isActive = activeId === heading.id;

              return (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  onClick={(event) =>
                    handleClick(event, heading.id)
                  }
                  aria-current={isActive ? "location" : undefined}
                  className={`
                    flex
                    items-start
                    gap-3
                    rounded-lg
                    px-3
                    py-2.5
                    text-xs
                    leading-5
                    transition-all
                    duration-300
                    ease-out

                    ${
                      heading.level === 3
                        ? "ml-4"
                        : heading.level === 2
                          ? "ml-1"
                          : ""
                    }

                    ${
                      isActive
                        ? "bg-[#f0f3ff] text-[#3568e8]"
                        : "text-[#777771] hover:bg-[#f7f7f4] hover:text-[#333330]"
                    }
                  `}
                >
                  {/* Number */}

                  <span
                    className={`
                      mt-0.5
                      shrink-0
                      font-mono
                      text-[9px]
                      transition-colors
                      duration-300

                      ${
                        isActive
                          ? "text-[#3568e8]"
                          : "text-[#aaa9a1]"
                      }
                    `}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {/* Heading */}

                  <span>{heading.text}</span>
                </a>
              );
            })}
          </div>
        </details>
      </div>
    </>
  );
}