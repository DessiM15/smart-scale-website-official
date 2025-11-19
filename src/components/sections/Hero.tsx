"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [shouldLoop, setShouldLoop] = useState(false);
  const hasScrolledPastRef = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;

    if (!section || !video) return;

    // Initially set loop to false
    video.loop = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isVisible = entry.isIntersecting;

          if (!isVisible) {
            // When section goes out of view, mark that we've scrolled past
            hasScrolledPastRef.current = true;
            video.loop = false;
            setShouldLoop(false);
          } else if (hasScrolledPastRef.current) {
            // Only enable looping if we've scrolled past and come back
            video.loop = true;
            setShouldLoop(true);
            // If video has ended, restart it
            if (video.ended) {
              video.play().catch(() => {
                // Ignore autoplay errors
              });
            }
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of the section is visible
      }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} className="min-h-screen overflow-hidden z-10 relative bg-black">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        loop={shouldLoop}
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      >
        <source src="/assets/smart-scale-hero.mp4" type="video/mp4" />
      </video>

      {/* Overlay for better text readability */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/40 -z-10"></div>

      {/* Unicorn Background Component with mask wrapper - This provides the animated glowing globe */}
      <div style={{ maskImage: "linear-gradient(black 0%, black 60%, transparent 100%)" }}>
        <div className="absolute top-0 left-0 -z-10 w-full h-full" data-us-project="BhoqrigscYbD7NN1fwcp"></div>
      </div>

      {/* Hero Content */}
      <div className="md:px-8 md:pt-0 md:pb-0 max-w-7xl mr-auto mb-20 ml-auto pt-6 pr-6 pb-28 pl-6 relative z-10">
        <div className="grid place-items-center relative">
          {/* Brand title */}
          <h1 className="md:mt-10 text-[14vw] leading-none md:text-[8rem] select-none font-semibold text-white tracking-tight mt-10">
            SMART<span className="text-[#DC2626]">SCALE</span>
          </h1>
          <p className="md:text-lg text-base text-white/70 text-center max-w-xl mt-4">
            Enterprise software and AI systems designed for precision, performance, and scale.
          </p>

          {/* CTA */}
          <div className="flex flex-col gap-6 z-10 max-w-sm mt-6 mr-auto ml-auto relative">
            <Link
              href="/contact"
              className="group hover:shadow-[#DC2626]/30 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 active:scale-95 transition-all duration-500 ease-out cursor-pointer hover:border-[#DC2626]/60 overflow-hidden bg-gradient-to-br from-[#DC2626]/40 via-black/60 to-black/80 border-[#DC2626]/30 border-2 rounded-full pt-3 pr-4 pb-3 pl-6 relative shadow-2xl backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#DC2626]/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              <div className="group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-[#DC2626]/10 via-[#DC2626]/20 to-[#DC2626]/10 opacity-0 rounded-2xl absolute top-0 right-0 bottom-0 left-0"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="flex-1 text-left">
                  <p className="group-hover:text-white transition-colors duration-300 text-base font-bold text-white drop-shadow-sm">
                    Request Estimate
                  </p>
                </div>
                <div className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                  <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="w-5 h-5 text-white">
                    <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"></path>
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
