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
        opacity: 0.06,
        duration: 2,
        ease: "power3.out",
      });
      gsap.to(content, {
        opacity: 1,
        y: 0,
        duration: 1.4,
        ease: "power3.out",
        delay: 0.3,
      });
    };

    video.addEventListener("ended", handleEnded);

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

  useEffect(() => {
    const content = contentRef.current;
    const video = videoRef.current;
    if (!content || !video) return;

    const handleScroll = () => {
      if (videoEnded) return;
      if (window.scrollY > 80) {
        setVideoEnded(true);
        gsap.to(video, {
          opacity: 0.06,
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
      className="relative h-screen overflow-hidden bg-black"
    >
      {/* Logo video — full screen on black, very subdued */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 z-[1] w-full h-full object-cover"
        style={{ mixBlendMode: "lighten" }}
      >
        <source src="/assets/use-this-logo.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlays for depth and premium darkness */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Subtle noise texture for premium feel */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      {/* Content overlay — revealed after video ends or on scroll */}
      <div
        ref={contentRef}
        className="absolute inset-0 z-[3] flex flex-col items-center justify-center px-6"
        style={{ opacity: 0, transform: "translateY(20px)" }}
      >
        {/* Thin decorative line */}
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent mb-10" />

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white text-center leading-[1.1] tracking-tight max-w-5xl">
          Precision Software
          <br />
          <span className="text-white/90">for Enterprise</span>
        </h1>

        <p className="mt-8 text-base md:text-lg text-white/50 text-center max-w-lg tracking-wide font-light">
          Architected for growth. Built without compromise.
        </p>

        <Link
          href="#work"
          className="group mt-12 inline-flex items-center gap-3 px-10 py-4 bg-white/[0.04] border border-white/[0.12] rounded-full text-xs uppercase tracking-[0.2em] text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.25] transition-all duration-700 backdrop-blur-sm"
        >
          Explore Our Work
          <svg
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="none"
            className="w-3.5 h-3.5 transition-transform duration-500 group-hover:translate-y-0.5"
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

      {/* Bottom fade to page background */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 z-[4] pointer-events-none"
        style={{
          background: "linear-gradient(to top, #0A0A0A 0%, transparent 100%)",
        }}
      />
    </section>
  );
}
