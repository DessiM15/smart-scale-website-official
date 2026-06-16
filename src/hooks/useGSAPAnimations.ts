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

    const isMobile = window.innerWidth < 768;
    const duration = isMobile ? 0.6 : 1.0;
    const stagger = isMobile ? 0.05 : 0.1;
    const yDistance = isMobile ? 10 : 20;

    const setupAnimations = () => {
      // Legacy scroll-reveal classes
      const revealElements = document.querySelectorAll(
        ".scroll-reveal, .scroll-reveal-fade, .scroll-reveal-slide"
      );

      if (revealElements.length > 0) {
        gsap.set(revealElements, { opacity: 0, y: yDistance });

        ScrollTrigger.batch(revealElements, {
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration,
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
        gsap.set(fadeUpElements, { opacity: 0, y: yDistance });

        ScrollTrigger.batch(fadeUpElements, {
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration,
              ease: "power3.out",
              stagger,
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

        gsap.set(children, { opacity: 0, y: yDistance });

        ScrollTrigger.create({
          trigger: container,
          start: "top 88%",
          once: true,
          onEnter: () => {
            gsap.to(children, {
              opacity: 1,
              y: 0,
              duration,
              ease: "power3.out",
              stagger,
            });
          },
        });
      });

      // Service cards and portfolio items
      const cards = document.querySelectorAll(
        ".service-card, .portfolio-item"
      );
      if (cards.length > 0) {
        gsap.set(cards, { opacity: 0, y: yDistance });

        ScrollTrigger.batch(cards, {
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: isMobile ? 0.5 : 0.8,
              ease: "power3.out",
              stagger,
            });
          },
          start: "top 88%",
          once: true,
        });
      }

      // --- NEW ANIMATION PATTERNS ---

      // Slide from left
      const slideLeftElements = document.querySelectorAll(
        '[data-animate="slide-left"]'
      );
      if (slideLeftElements.length > 0) {
        gsap.set(slideLeftElements, { opacity: 0, x: isMobile ? -30 : -60 });

        ScrollTrigger.batch(slideLeftElements, {
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              x: 0,
              duration,
              ease: "power3.out",
              stagger,
            });
          },
          start: "top 88%",
          once: true,
        });
      }

      // Slide from right
      const slideRightElements = document.querySelectorAll(
        '[data-animate="slide-right"]'
      );
      if (slideRightElements.length > 0) {
        gsap.set(slideRightElements, { opacity: 0, x: isMobile ? 30 : 60 });

        ScrollTrigger.batch(slideRightElements, {
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              x: 0,
              duration,
              ease: "power3.out",
              stagger,
            });
          },
          start: "top 88%",
          once: true,
        });
      }

      // Scale reveal
      const scaleRevealElements = document.querySelectorAll(
        '[data-animate="scale-reveal"]'
      );
      if (scaleRevealElements.length > 0) {
        gsap.set(scaleRevealElements, { opacity: 0, scale: 0.9 });

        ScrollTrigger.batch(scaleRevealElements, {
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              scale: 1,
              duration,
              ease: "back.out(1.4)",
              stagger,
            });
          },
          start: "top 88%",
          once: true,
        });
      }

      // Word reveal
      const wordRevealElements = document.querySelectorAll(
        '[data-animate="word-reveal"]'
      );
      wordRevealElements.forEach((el) => {
        const text = el.textContent || "";
        const words = text.split(/\s+/).filter(Boolean);
        el.innerHTML = words
          .map(
            (word) =>
              `<span class="word-reveal-inner" style="display:inline-block;overflow:hidden;vertical-align:top"><span style="display:inline-block">${word}</span></span>`
          )
          .join(" ");

        const innerSpans = el.querySelectorAll(
          ".word-reveal-inner > span"
        );
        gsap.set(innerSpans, { y: "100%", opacity: 0 });

        ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          once: true,
          onEnter: () => {
            gsap.to(innerSpans, {
              y: "0%",
              opacity: 1,
              duration: isMobile ? 0.4 : 0.6,
              ease: "power3.out",
              stagger: isMobile ? 0.03 : 0.05,
            });
          },
        });
      });

      // Counter animation
      const counterElements = document.querySelectorAll(
        '[data-animate="counter"]'
      );
      counterElements.forEach((el) => {
        const countTo = parseFloat(
          el.getAttribute("data-count-to") || "0"
        );
        const suffix = el.getAttribute("data-count-suffix") || "";
        const counterObj = { val: 0 };

        ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          once: true,
          onEnter: () => {
            gsap.to(counterObj, {
              val: countTo,
              duration: isMobile ? 1.2 : 2,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent =
                  Math.round(counterObj.val).toString() + suffix;
              },
            });
          },
        });
      });

      // Parallax
      const parallaxElements = document.querySelectorAll("[data-parallax]");
      parallaxElements.forEach((el) => {
        const speed = parseFloat(
          el.getAttribute("data-parallax") || "0.2"
        );

        gsap.to(el, {
          y: () => ScrollTrigger.maxScroll(window) * speed * -0.1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

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
