"use client";

import { ReactNode, useRef } from "react";

interface AnimatedHeroProps {
  children: ReactNode;
  backgroundElement?: ReactNode;
  className?: string;
}

export default function AnimatedHero({
  children,
  backgroundElement,
  className = "min-h-screen overflow-hidden z-10 relative bg-[#0A0A0A]"
}: AnimatedHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className={className}
    >
      {backgroundElement}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}
