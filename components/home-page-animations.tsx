"use client";

import { ReactNode, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type HomePageAnimationsProps = {
  children: ReactNode;
};

export default function HomePageAnimations({
  children,
}: HomePageAnimationsProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;

      if (!root) {
        return;
      }

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        return;
      }

      const sections = gsap.utils.toArray<HTMLElement>(
        "main > section",
        root,
      );

      if (!sections.length) {
        return;
      }

      /* ------------------------------------------------------------------ */
      /* Hero                                                                */
      /* ------------------------------------------------------------------ */

      const hero = sections[0];

      if (hero) {
        const heroIdentity = hero.querySelector<HTMLElement>(
          ".relative.mx-auto > .flex.items-center.justify-between",
        );

        const heroContent = hero.querySelector<HTMLElement>(
          ".relative.mx-auto > .mt-16",
        );

        const heroTopicBar = hero.querySelector<HTMLElement>(
          ".relative.mx-auto > .mt-24",
        );

        const heroText = heroContent
          ? Array.from(
              heroContent.querySelectorAll<HTMLElement>(
                "p, h1, .mt-8, .mt-9",
              ),
            ).filter((element) => {
              return !element.closest(".relative.mx-auto > .mt-16 > .relative");
            })
          : [];

        const heroCodeWindow =
          heroContent?.querySelector<HTMLElement>(
            ".relative.mx-auto .relative.overflow-hidden.rounded-2xl",
          ) ?? null;

        const heroStatus = heroContent?.querySelector<HTMLElement>(
          ".absolute.-bottom-6",
        );

        const heroDecorations = Array.from(
          hero.querySelectorAll<HTMLElement>(
            ".pointer-events-none.absolute",
          ),
        );

        if (heroIdentity) {
          gsap.fromTo(
            heroIdentity,
            { opacity: 0, y: -12 },
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              ease: "power3.out",
            },
          );
        }

        if (heroText.length) {
          gsap.fromTo(
            heroText,
            {
              opacity: 0,
              y: 32,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.85,
              ease: "power3.out",
              stagger: 0.1,
              delay: 0.08,
              clearProps: "opacity,transform",
            },
          );
        }

        if (heroCodeWindow) {
          gsap.fromTo(
            heroCodeWindow,
            {
              opacity: 0,
              y: 36,
              rotate: 4,
              scale: 0.97,
            },
            {
              opacity: 1,
              y: 0,
              rotate: 1,
              scale: 1,
              duration: 1,
              ease: "power3.out",
              delay: 0.18,
              clearProps: "opacity,transform",
            },
          );
        }

        if (heroStatus) {
          gsap.fromTo(
            heroStatus,
            {
              opacity: 0,
              x: -18,
              y: 10,
            },
            {
              opacity: 1,
              x: 0,
              y: 0,
              duration: 0.65,
              ease: "power3.out",
              delay: 0.6,
              clearProps: "opacity,transform",
            },
          );
        }

        if (heroTopicBar) {
          gsap.fromTo(
            heroTopicBar,
            {
              opacity: 0,
              y: 22,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "power3.out",
              delay: 0.45,
              clearProps: "opacity,transform",
            },
          );
        }

        heroDecorations.forEach((element, index) => {
          gsap.to(element, {
            y: index % 2 === 0 ? -55 : 38,
            x: index % 3 === 0 ? 12 : -8,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: 1.2 + index * 0.15,
            },
          });
        });

        if (heroCodeWindow) {
          gsap.to(heroCodeWindow, {
            y: -24,
            rotate: -1,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: 1.5,
            },
          });
        }
      }

      /* ------------------------------------------------------------------ */
      /* General section reveals                                             */
      /* ------------------------------------------------------------------ */

      sections.slice(1).forEach((section, sectionIndex) => {
        const contentRoot =
          section.querySelector<HTMLElement>(
            ":scope > div:not(.pointer-events-none)",
          ) ?? section;

        const directChildren = Array.from(contentRoot.children).filter(
          (child): child is HTMLElement =>
            child instanceof HTMLElement &&
            !child.classList.contains("pointer-events-none"),
        );

        if (!directChildren.length) {
          return;
        }

        const sectionTargets =
          directChildren.length === 1
            ? Array.from(directChildren[0].children).filter(
                (child): child is HTMLElement =>
                  child instanceof HTMLElement,
              )
            : directChildren;

        const targets = sectionTargets.filter((element) => {
          const text = element.textContent?.trim() ?? "";
          return text.length > 0 || element.querySelector("a, button");
        });

        if (!targets.length) {
          return;
        }

        gsap.fromTo(
          targets,
          {
            opacity: 0,
            y: 34,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.72,
            ease: "power3.out",
            stagger: 0.09,
            clearProps: "opacity,transform",
            scrollTrigger: {
              trigger: section,
              start: "top 82%",
              toggleActions: "play none none none",
              once: true,
            },
          },
        );

        /*
         * Give list/card sections an additional staggered entrance.
         * This is intentionally limited to direct interactive elements so
         * paragraphs and layout wrappers are not over-animated.
         */
        const cards = Array.from(
          section.querySelectorAll<HTMLElement>("a.group"),
        );

        if (cards.length > 0) {
          gsap.fromTo(
            cards,
            {
              opacity: 0,
              y: 26,
              scale: 0.985,
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.65,
              ease: "power2.out",
              stagger: 0.08,
              clearProps: "opacity,transform",
              scrollTrigger: {
                trigger: section,
                start: sectionIndex === 0 ? "top 82%" : "top 76%",
                toggleActions: "play none none none",
                once: true,
              },
            },
          );
        }
      });

      /* ------------------------------------------------------------------ */
      /* Following feed + latest rows                                        */
      /* ------------------------------------------------------------------ */

      const rowSections = sections.filter((section) => {
        const heading = section.querySelector("h2")?.textContent ?? "";

        return (
          heading.includes("people you follow") ||
          heading.includes("Latest notes")
        );
      });

      rowSections.forEach((section) => {
        const rows = Array.from(
          section.querySelectorAll<HTMLElement>(
            "a.group.grid",
          ),
        );

        if (!rows.length) {
          return;
        }

        gsap.fromTo(
          rows,
          {
            opacity: 0,
            x: -24,
          },
          {
            opacity: 1,
            x: 0,
            duration: 0.62,
            ease: "power2.out",
            stagger: 0.1,
            clearProps: "opacity,transform",
            scrollTrigger: {
              trigger: section,
              start: "top 78%",
              toggleActions: "play none none none",
              once: true,
            },
          },
        );

        rows.forEach((row) => {
          const number = row.querySelector<HTMLElement>(
            ".font-mono",
          );

          if (!number) {
            return;
          }

          gsap.to(number, {
            y: -8,
            ease: "none",
            scrollTrigger: {
              trigger: row,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          });
        });
      });

      /* ------------------------------------------------------------------ */
      /* Featured card                                                       */
      /* ------------------------------------------------------------------ */

      const featured = sections.find((section) =>
        (section.querySelector("h2")?.textContent ?? "").includes(
          "Start with",
        ),
      );

      if (featured) {
        const featuredCard = featured.querySelector<HTMLElement>(
          "a.group",
        );

        const largeNumber = featuredCard
          ? Array.from(
              featuredCard.querySelectorAll<HTMLElement>("div"),
            ).find(
              (element) =>
                element.classList.contains("absolute") &&
                element.textContent?.trim() === "01",
            ) ?? null
          : null;

        /*
         * Do not animate the featured card itself with GSAP.
         * The card already has Tailwind hover transforms, so keeping
         * parallax on the decorative number avoids CSS/GSAP transform
         * conflicts on repeated hover.
         */

        if (largeNumber) {
          gsap.to(largeNumber, {
            x: 24,
            y: -18,
            ease: "none",
            scrollTrigger: {
              trigger: featured,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          });
        }
      }

      /* ------------------------------------------------------------------ */
      /* Topics                                                              */
      /* ------------------------------------------------------------------ */

      const topicsSection = sections.find((section) =>
        (section.querySelector("h2")?.textContent ?? "").includes(
          "rabbit hole",
        ),
      );

      if (topicsSection) {
        const topicCards = Array.from(
          topicsSection.querySelectorAll<HTMLElement>("a.group"),
        );

        topicCards.forEach((card, index) => {
          const number = card.querySelector<HTMLElement>(
            ".absolute.right-4.top-2",
          );

          if (!number) {
            return;
          }

          gsap.to(number, {
            y: index % 2 === 0 ? -16 : 12,
            x: index % 2 === 0 ? 8 : -6,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.1,
            },
          });
        });
      }

      /* ------------------------------------------------------------------ */
      /* Final CTA                                                           */
      /* ------------------------------------------------------------------ */

      const cta = sections[sections.length - 1];

      if (cta) {
        const glows = Array.from(
          cta.querySelectorAll<HTMLElement>(
            ".pointer-events-none.absolute",
          ),
        );

        glows.forEach((glow, index) => {
          gsap.to(glow, {
            x: index === 0 ? -55 : 55,
            y: index === 0 ? 35 : -25,
            scale: 1.12,
            ease: "none",
            scrollTrigger: {
              trigger: cta,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.5,
            },
          });
        });

        const ctaHeading = cta.querySelector<HTMLElement>("h2");

        if (ctaHeading) {
          gsap.fromTo(
            ctaHeading,
            {
              opacity: 0,
              y: 42,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.85,
              ease: "power3.out",
              scrollTrigger: {
                trigger: cta,
                start: "top 78%",
                toggleActions: "play none none none",
                once: true,
              },
            },
          );
        }
      }

      /* ------------------------------------------------------------------ */
      /* Interaction feedback                                                */
      /* ------------------------------------------------------------------ */

      /*
       * Important:
       * The Home page already uses Tailwind `hover:-translate-y-*`,
       * `group-hover:translate-x-*`, and transition classes on cards.
       *
       * Those CSS rules and a GSAP transform on the same element would both
       * write to `transform`, which causes repeated hovers to feel weaker or
       * inconsistent.
       *
       * Therefore cards keep their CSS hover transform. GSAP is used only
       * for the press feedback on normal buttons/CTAs.
       */

      const buttons = Array.from(
        root.querySelectorAll<HTMLElement>(
          "button:not(:disabled)",
        ),
      );

      buttons.forEach((button) => {
        const pressIn = () => {
          gsap.killTweensOf(button);

          gsap.to(button, {
            scale: 0.97,
            duration: 0.1,
            ease: "power2.out",
            overwrite: true,
          });
        };

        const pressOut = () => {
          gsap.killTweensOf(button);

          gsap.to(button, {
            scale: 1,
            duration: 0.24,
            ease: "back.out(1.6)",
            overwrite: true,
          });
        };

        button.style.transformOrigin = "center center";
        button.style.willChange = "transform";

        button.addEventListener("pointerdown", pressIn);
        button.addEventListener("pointerup", pressOut);
        button.addEventListener("pointercancel", pressOut);
        button.addEventListener("pointerleave", pressOut);
        button.addEventListener("focus", pressIn);
        button.addEventListener("blur", pressOut);

        button.addEventListener("keydown", (event: KeyboardEvent) => {
          if (
            (event.key === "Enter" || event.key === " ") &&
            !event.repeat
          ) {
            pressIn();
          }
        });

        button.addEventListener("keyup", (event: KeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            pressOut();
          }
        });
      });

      /*
       * Links/cards deliberately do not receive a GSAP transform here.
       * Their existing Tailwind hover transitions remain the single source
       * of truth, making repeated hover interactions perfectly consistent.
       *
       * The CSS already provides:
       * - card lift
       * - border/shadow transition
       * - title color transition
       * - arrow movement
       * - featured number movement
       */

      /*
       * Refresh after the page has settled. This is useful because the Home
       * page contains server-rendered article lists whose heights can differ.
       */
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    },
    {
      scope,
      revertOnUpdate: true,
    },
  );

  return <div ref={scope}>{children}</div>;
}
