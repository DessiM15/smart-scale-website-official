"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface UseScrollRevealOptions {
  y?: number;
  duration?: number;
  delay?: number;
  ease?: string;
  start?: string;
}

export function useScrollReveal<T extends HTMLElement>(
  options: UseScrollRevealOptions = {}
) {
  const ref = useRef<T>(null);
  const {
    y = 20,
    duration = 1.0,
    delay = 0,
    ease = "power3.out",
    start = "top 88%",
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { opacity: 0, y });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease,
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, [y, duration, delay, ease, start]);

  return ref;
}
