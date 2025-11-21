"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Configure GSAP defaults for smooth, premium animations
gsap.config({
  nullTargetWarn: false,
  force3D: true,
});

// Set default ease for all animations
gsap.defaults({
  ease: "power2.out",
  duration: 0.8,
});

export function useGSAPAnimations() {
  const initializedRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (initializedRef.current) return;
    initializedRef.current = true;

    // DISABLED: All scroll animations disabled to prevent content disappearing issues
    // Make all content visible immediately without any animations
    console.log('GSAP scroll animations disabled - making all content visible');
    
    const makeContentVisible = () => {
      const allElements = document.querySelectorAll(".scroll-reveal, .scroll-reveal-fade, .scroll-reveal-slide, .scroll-reveal-stagger > *, .hero-content > *, .service-card, .portfolio-item, .cta-button, .request-estimate");
      allElements.forEach((el: any) => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0) translateX(0) scale(1)';
        el.style.visibility = 'visible';
      });
    };
    
    // Make content visible immediately
    makeContentVisible();
    
    // Also make content visible after DOM loads and after a delay for dynamic content
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", makeContentVisible);
    }
    
    const timeoutId = setTimeout(makeContentVisible, 1000);
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      initializedRef.current = false;
    };
  }, []);

  return null;
}

