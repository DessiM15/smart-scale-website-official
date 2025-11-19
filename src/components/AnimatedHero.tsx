"use client";

import { ReactNode } from "react";
import { useHeroAnimations } from "@/hooks/useHeroAnimations";

interface AnimatedHeroProps {
  children: ReactNode;
  backgroundElement?: ReactNode;
  className?: string;
}

export default function AnimatedHero({ 
  children, 
  backgroundElement,
  className = "min-h-screen overflow-hidden z-10 relative bg-black"
}: AnimatedHeroProps) {
  const { sectionRef, parallaxStyle, scrollStyle } = useHeroAnimations();

  return (
    <section 
      ref={sectionRef} 
      className={className}
      style={scrollStyle}
    >
      {/* Background element */}
      {backgroundElement}
      
      {/* Hero Content with parallax */}
      <div style={parallaxStyle} className="relative z-10">
        {children}
      </div>
    </section>
  );
}

