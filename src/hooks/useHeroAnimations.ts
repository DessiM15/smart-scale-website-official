"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";

interface UseHeroAnimationsOptions {
  enableParallax?: boolean;
  enableScroll?: boolean;
}

export function useHeroAnimations(options: UseHeroAnimationsOptions = {}) {
  const { enableParallax = true, enableScroll = true } = options;
  const sectionRef = useRef<HTMLElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (!enableParallax) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
      
      setMousePosition(prev => {
        // Only update if change is significant to avoid excessive re-renders
        if (Math.abs(prev.x - x) < 0.1 && Math.abs(prev.y - y) < 0.1) {
          return prev;
        }
        return { x, y };
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [enableParallax]);

  useEffect(() => {
    if (!enableScroll) return;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / rect.height));
      
      setScrollProgress(prev => {
        // Only update if change is significant
        if (Math.abs(prev - progress) < 0.01) {
          return prev;
        }
        return progress;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enableScroll]);

  const parallaxStyle = useMemo(() => {
    if (!enableParallax) return {};
    return {
      transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
      transition: "transform 0.1s ease-out",
    };
  }, [enableParallax, mousePosition.x, mousePosition.y]);

  const scrollStyle = useMemo(() => {
    if (!enableScroll) return {};
    return {
      transform: `scale(${1 - scrollProgress * 0.05})`,
      transition: "transform 0.1s ease-out",
    };
  }, [enableScroll, scrollProgress]);

  return {
    sectionRef,
    mousePosition,
    scrollProgress,
    parallaxStyle,
    scrollStyle,
  };
}

