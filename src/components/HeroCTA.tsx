"use client";

import { useState, useRef, MouseEvent, ReactNode } from "react";
import Link from "next/link";

interface HeroCTAProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  theme?: "dark" | "light";
  className?: string;
}

export default function HeroCTA({
  href,
  children,
  variant = "primary",
  theme = "dark",
  className = ""
}: HeroCTAProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [isClicking, setIsClicking] = useState(false);
  const buttonRef = useRef<HTMLAnchorElement | null>(null);
  const rippleIdRef = useRef(0);
  const isLight = theme === "light";

  const handleClick = (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (isLoading || isSuccess) {
      e.preventDefault();
      return;
    }

    if (variant === "primary" && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleIdRef.current++;

      setRipples(prev => [...prev, { x, y, id }]);

      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }

    if (variant === "secondary") {
      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 300);
    }

    if (href.startsWith('/') && !href.startsWith('tel:') && !href.startsWith('#')) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
        }, 2000);
      }, 1000);
    }
  };

  const baseClasses = "group hero-cta-button transition-all duration-500 ease-out cursor-pointer overflow-hidden rounded-full pt-3 pr-4 pb-3 pl-6 relative shadow-2xl backdrop-blur-xl";

  const primaryClasses = "hover:shadow-[#DC2626]/30 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 active:scale-[1.01] active:shadow-[#DC2626]/40 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/50 hover:border-[#DC2626]/60 bg-gradient-to-br from-[#DC2626]/40 via-black/60 to-black/80 border-[#DC2626]/30 border-2 hero-cta-primary-idle";

  const secondaryClassesDark = `hover:shadow-white/10 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 active:scale-[1.01] active:shadow-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 hover:border-white/40 bg-gradient-to-br from-white/10 via-black/60 to-black/80 border-white/20 border-2 hero-cta-secondary-idle hero-cta-secondary-hover ${isClicking ? "hero-cta-secondary-click" : ""}`;

  const secondaryClassesLight = `hover:shadow-black/10 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 active:scale-[1.01] active:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-black/20 hover:border-black/40 bg-gradient-to-br from-black/5 via-black/10 to-black/15 border-black/20 border-2 ${isClicking ? "hero-cta-secondary-click" : ""}`;

  const secondaryClasses = isLight ? secondaryClassesLight : secondaryClassesDark;

  const combinedClasses = `${baseClasses} ${variant === "primary" ? primaryClasses : secondaryClasses} ${className} ${isLoading ? "hero-cta-loading" : ""} ${isSuccess ? "hero-cta-success" : ""}`;

  const textColor = variant === "secondary" && isLight ? "text-[#111111]" : "text-white";
  const svgColor = variant === "secondary" && isLight ? "text-[#111111]" : "text-white";
  const shineColor = variant === "primary" ? "via-[#DC2626]/30" : (isLight ? "via-black/10" : "via-white/20");
  const hoverOverlay = variant === "primary"
    ? "bg-gradient-to-r from-[#DC2626]/10 via-[#DC2626]/20 to-[#DC2626]/10 opacity-0"
    : isLight
      ? "bg-gradient-to-r from-black/5 via-black/10 to-black/5 opacity-0"
      : "bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-0";

  const renderContent = () => (
    <>
      {variant === "primary" && ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple-effect"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: '20px',
            height: '20px',
          }}
        />
      ))}

      <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${shineColor} to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-0`}></div>

      <div className={`group-hover:opacity-100 transition-opacity duration-500 rounded-2xl absolute top-0 right-0 bottom-0 left-0 z-0 ${hoverOverlay}`}></div>

      <div className={`hero-cta-content relative z-10 flex items-center gap-4`}>
        <div className="flex-1 text-left">
          <p className={`transition-colors duration-300 text-base font-bold ${textColor} drop-shadow-sm`}>
            {children}
          </p>
        </div>
        <div className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
          <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className={`w-5 h-5 ${svgColor}`}>
            <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"></path>
          </svg>
        </div>
      </div>
    </>
  );

  if (href.startsWith('tel:') || href.startsWith('mailto:')) {
    return (
      <a
        ref={buttonRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        onClick={handleClick}
        className={combinedClasses}
      >
        {renderContent()}
      </a>
    );
  }

  return (
    <Link
      ref={buttonRef as React.RefObject<HTMLAnchorElement>}
      href={href}
      onClick={handleClick}
      className={combinedClasses}
    >
      {renderContent()}
    </Link>
  );
}
