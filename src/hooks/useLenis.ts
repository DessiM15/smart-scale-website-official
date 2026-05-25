"use client";

import { useCallback } from "react";

export function useLenis() {
  const scrollTo = useCallback(
    (target: string | number, options?: { offset?: number; duration?: number }) => {
      const lenis = (window as unknown as { lenis?: { scrollTo: (target: string | number, options?: object) => void } }).lenis;
      if (lenis) {
        lenis.scrollTo(target, {
          offset: options?.offset ?? 0,
          duration: options?.duration ?? 1.2,
        });
      } else {
        // Fallback for when Lenis isn't available
        if (typeof target === "string") {
          const el = document.querySelector(target);
          el?.scrollIntoView({ behavior: "smooth" });
        } else {
          window.scrollTo({ top: target, behavior: "smooth" });
        }
      }
    },
    []
  );

  return { scrollTo };
}
