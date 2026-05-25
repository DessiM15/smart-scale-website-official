"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Link from "next/link";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const content = contentRef.current;
    if (!video || !content) return;

    const handleEnded = () => {
      setVideoEnded(true);
      gsap.to(video, {
        opacity: 0.15,
        duration: 1.5,
        ease: "power3.out",
      });
      gsap.to(content, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.3,
      });
    };

    video.addEventListener("ended", handleEnded);

    // Fallback: if video doesn't play (autoplay blocked), show content after delay
    const fallbackTimer = setTimeout(() => {
      if (!videoEnded) {
        handleEnded();
      }
    }, 8000);

    return () => {
      video.removeEventListener("ended", handleEnded);
      clearTimeout(fallbackTimer);
    };
  }, [videoEnded]);

  // Reveal content on scroll even if video hasn't ended
  useEffect(() => {
    const content = contentRef.current;
    const video = videoRef.current;
    if (!content || !video) return;

    const handleScroll = () => {
      if (videoEnded) return;
      if (window.scrollY > 80) {
        setVideoEnded(true);
        gsap.to(video, {
          opacity: 0.15,
          duration: 1.0,
          ease: "power3.out",
        });
        gsap.to(content, {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: "power3.out",
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [videoEnded]);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen overflow-hidden"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Solid black background layer — prevents alpha-channel grid bleed */}
      <div className="absolute inset-0 bg-black z-0" />

      {/* Logo video — centered, no stretch, black behind */}
      <div className="absolute inset-0 z-[1] flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain"
        >
          <source src="/assets/smart-scale-logo-vid.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Content overlay — revealed after video ends or on scroll */}
      <div
        ref={contentRef}
        className="absolute inset-0 z-[3] flex flex-col items-center justify-center px-6"
        style={{ opacity: 0, transform: "translateY(20px)" }}
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white text-center leading-tight tracking-tight max-w-4xl">
          Precision Software for Enterprise
        </h1>
        <p className="mt-6 text-base md:text-lg text-white/60 text-center max-w-xl">
          Architected for growth. Built without compromise.
        </p>
        <Link
          href="#work"
          className="mt-10 inline-flex items-center gap-3 px-8 py-3.5 border border-white/20 rounded-full text-sm uppercase tracking-widest text-white/80 hover:text-white hover:border-white/40 transition-all duration-500"
        >
          Explore Our Work
          <svg
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="none"
            className="w-4 h-4"
          >
            <path
              d="M19 9l-7 7-7-7"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}
