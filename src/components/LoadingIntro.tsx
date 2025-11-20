"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function LoadingIntro() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if intro has already been shown in this session
    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");

    if (hasSeenIntro) {
      return;
    }

    // Show the intro
    setIsVisible(true);

    // GSAP Animation Timeline
    const tl = gsap.timeline({
      onComplete: () => {
        // Mark as seen and hide the intro
        sessionStorage.setItem("hasSeenIntro", "true");

        // Fade out the entire container
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete: () => {
            setIsVisible(false);
          },
        });
      },
    });

    // Animation sequence
    tl.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: "power2.out" }
    )
      .fromTo(
        logoRef.current,
        { scale: 0.5, opacity: 0, rotationY: -180 },
        {
          scale: 1,
          opacity: 1,
          rotationY: 0,
          duration: 1,
          ease: "back.out(1.7)",
        }
      )
      .fromTo(
        lineRef.current,
        { scaleX: 0, opacity: 0 },
        {
          scaleX: 1,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
        },
        "-=0.3"
      )
      .fromTo(
        textRef.current,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.2"
      )
      .to({}, { duration: 0.8 }); // Pause before fade out

    // Prevent scrolling during intro
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      tl.kill();
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
      style={{ opacity: 0 }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-90" />

      {/* Animated particles in background */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo/Brand */}
        <div
          ref={logoRef}
          className="flex flex-col items-center gap-4"
          style={{ opacity: 0 }}
        >
          <div className="text-7xl md:text-8xl font-bold tracking-tight">
            <span className="text-white">Smart</span>
            <span className="text-[#DC2626]"> Scale</span>
          </div>
        </div>

        {/* Animated line */}
        <div
          ref={lineRef}
          className="w-64 h-0.5 bg-gradient-to-r from-transparent via-[#DC2626] to-transparent"
          style={{ opacity: 0, transformOrigin: "center" }}
        />

        {/* Tagline */}
        <div
          ref={textRef}
          className="text-gray-400 text-lg md:text-xl font-light tracking-wide"
          style={{ opacity: 0 }}
        >
          Enterprise Software & AI Development
        </div>

        {/* Loading indicator */}
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-[#DC2626] rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
