"use client";

import { useRef, useState, MouseEvent, ReactNode } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  theme?: "light" | "dark";
}

export default function GlowCard({ children, className = "", theme = "dark" }: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [glowPosition, setGlowPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setGlowPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const isDark = theme === "dark";

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative overflow-hidden rounded-3xl ${
        isDark
          ? "bg-[#161616] border border-white/[0.08] hover:border-white/[0.15]"
          : "bg-[#F5F5F5] border border-black/[0.08] hover:border-black/[0.15]"
      } transition-all duration-300 ${className}`}
    >
      {/* Radial glow that follows cursor */}
      {isHovering && (
        <div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${glowPosition.x}px ${glowPosition.y}px, ${
              isDark ? "rgba(220, 38, 38, 0.12)" : "rgba(220, 38, 38, 0.08)"
            }, transparent 60%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
