"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

gsap.config({
  nullTargetWarn: false,
  force3D: true,
});

gsap.defaults({
  ease: "power2.out",
  duration: 0.8,
});

export function useGSAPAnimations() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const setupAnimations = () => {
      // Set initial states via GSAP (not CSS) to prevent flash-of-invisible-content
      const revealElements = document.querySelectorAll(
        ".scroll-reveal, .scroll-reveal-fade, .scroll-reveal-slide"
      );

      if (revealElements.length > 0) {
        gsap.set(revealElements, { opacity: 0, y: 30 });

        ScrollTrigger.batch(revealElements, {
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power2.out",
              stagger: 0.15,
            });
          },
          start: "top 85%",
          once: true,
        });
      }

      // Stagger children of stagger containers
      const staggerContainers = document.querySelectorAll(
        ".scroll-reveal-stagger"
      );
      staggerContainers.forEach((container) => {
        const children = container.children;
        if (children.length === 0) return;

        gsap.set(children, { opacity: 0, y: 30 });

        ScrollTrigger.create({
          trigger: container,
          start: "top 85%",
          once: true,
          onEnter: () => {
            gsap.to(children, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power2.out",
              stagger: 0.12,
            });
          },
        });
      });

      // Service cards and portfolio items
      const cards = document.querySelectorAll(
        ".service-card, .portfolio-item"
      );
      if (cards.length > 0) {
        gsap.set(cards, { opacity: 0, y: 20 });

        ScrollTrigger.batch(cards, {
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
              stagger: 0.1,
            });
          },
          start: "top 85%",
          once: true,
        });
      }

      ScrollTrigger.refresh();
    };

    // Run after a frame to ensure DOM is painted
    requestAnimationFrame(() => {
      setupAnimations();
    });

    // Refresh when all assets load
    const handleLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", handleLoad);

    return () => {
      window.removeEventListener("load", handleLoad);
      ScrollTrigger.getAll().forEach((t) => t.kill());
      initializedRef.current = false;
    };
  }, []);

  return null;
}
