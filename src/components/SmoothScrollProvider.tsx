"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  /** Skips the reset below on first paint, so a reload or a #anchor lands where it should. */
  const mountedRef = useRef(false);
  /** Set by popstate, so Back can restore its position instead of being yanked to the top. */
  const poppedRef = useRef(false);

  useGSAPAnimations();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onPop = () => {
      poppedRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /**
   * Opening a page should show its top.
   *
   * Lenis keeps its own idea of the scroll position and writes it back to the
   * window on its next frame. Across a client-side navigation that means the
   * offset from the page you just left can be re-applied to the page you just
   * opened, dropping you partway down a page you have never seen. Next's own
   * scroll reset does not touch Lenis, so the two have to be told together.
   *
   * Back and forward are left alone: returning to the portfolio should put the
   * visitor back at the card they clicked, not at the top of the grid.
   */
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (poppedRef.current) {
      poppedRef.current = false;
      return;
    }
    // A hash is an explicit request for somewhere other than the top.
    if (window.location.hash) return;

    const lenis = lenisRef.current;
    // The new page is a different height, so the old scroll bounds are wrong.
    lenis?.resize();
    lenis?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return <>{children}</>;
}
