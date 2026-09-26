"use client";

import { ReactNode, useEffect, useRef } from "react";
import { gsap } from "gsap";

type FeaturedAnimationProps = {
  children: ReactNode;
};

export default function FeaturedAnimation({
  children,
}: FeaturedAnimationProps) {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scope.current;

    if (!container) {
      return;
    }

    const items = Array.from(container.children);

    if (!items.length) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    gsap.set(items, {
      opacity: 0,
      y: 20,
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.1,
          clearProps: "transform,opacity",
        });

        observer.disconnect();
      },
      {
        threshold: 0.15,
      },
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      gsap.killTweensOf(items);
    };
  }, []);

  return <div ref={scope}>{children}</div>;
}
