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
  ease: "power3.out",
  duration: 1.0,
});

export function useGSAPAnimations() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const setupAnimations = () => {
      // Legacy scroll-reveal classes
      const revealElements = document.querySelectorAll(
        ".scroll-reveal, .scroll-reveal-fade, .scroll-reveal-slide"
      );

      if (revealElements.length > 0) {
        gsap.set(revealElements, { opacity: 0, y: 20 });

        ScrollTrigger.batch(revealElements, {
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 1.0,
              ease: "power3.out",
              stagger: 0.15,
            });
          },
          start: "top 88%",
          once: true,
        });
      }

      // New data-animate="fade-up" pattern
      const fadeUpElements = document.querySelectorAll(
        '[data-animate="fade-up"]'
      );
      if (fadeUpElements.length > 0) {
        gsap.set(fadeUpElements, { opacity: 0, y: 20 });

        ScrollTrigger.batch(fadeUpElements, {
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 1.0,
              ease: "power3.out",
              stagger: 0.1,
            });
          },
          start: "top 88%",
          once: true,
        });
      }

      // Stagger containers (legacy + new)
      const staggerContainers = document.querySelectorAll(
        '.scroll-reveal-stagger, [data-animate="stagger"]'
      );
      staggerContainers.forEach((container) => {
        const children = container.children;
        if (children.length === 0) return;

        gsap.set(children, { opacity: 0, y: 20 });

        ScrollTrigger.create({
          trigger: container,
          start: "top 88%",
          once: true,
          onEnter: () => {
            gsap.to(children, {
              opacity: 1,
              y: 0,
              duration: 1.0,
              ease: "power3.out",
              stagger: 0.1,
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
              duration: 0.8,
              ease: "power3.out",
              stagger: 0.1,
            });
          },
          start: "top 88%",
          once: true,
        });
      }

      ScrollTrigger.refresh();
    };

    requestAnimationFrame(() => {
      setupAnimations();
    });

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
