"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function ScrollIndicator() {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setHasScrolled(true);
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in z-20">
      <p className="text-white/60 text-sm font-medium">Scroll to explore</p>
      <ChevronDown className="w-6 h-6 text-white/60 animate-bounce" />
    </div>
  );
}

