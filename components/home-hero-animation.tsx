"use client";

import { ReactNode, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type HomeHeroAnimationProps = {
  children: ReactNode;
};

export default function HomeHeroAnimation({
  children,
}: HomeHeroAnimationProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const columns = scope.current?.children;

      if (!columns?.length) {
        return;
      }

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion) {
        return;
      }

      gsap.from(columns, {
        y: 28,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.12,
      });
    },
    { scope },
  );

  return <div ref={scope}>{children}</div>;
}
