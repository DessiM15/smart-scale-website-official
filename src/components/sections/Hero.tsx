"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useHeroAnimations } from "@/hooks/useHeroAnimations";
import FloatingParticles from "@/components/hero-backgrounds/FloatingParticles";
import HeroCTA from "@/components/HeroCTA";
import ScrollIndicator from "@/components/hero-backgrounds/ScrollIndicator";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { sectionRef, parallaxStyle, scrollStyle } = useHeroAnimations();
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
    <section 
      ref={sectionRef} 
      className="min-h-screen overflow-hidden z-10 relative bg-black"
      style={scrollStyle}
    >
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        loop={shouldLoop}
        className="absolute top-0 left-0 w-full h-full object-cover -z-10 hero-bg-fade"
      >
        <source src="/assets/smart-scale-hero.mp4" type="video/mp4" />
      </video>

      {/* Overlay for better text readability */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/40 -z-10 hero-bg-fade"></div>

      {/* Unicorn Background Component with mask wrapper - This provides the animated glowing globe */}
      <div style={{ maskImage: "linear-gradient(black 0%, black 60%, transparent 100%)" }} className="hero-bg-fade">
        <div className="absolute top-0 left-0 -z-10 w-full h-full" data-us-project="BhoqrigscYbD7NN1fwcp"></div>
      </div>

      {/* Floating Particles Background */}
      <FloatingParticles count={60} />

      {/* Hero Content */}
      <div className="md:px-8 md:pt-0 md:pb-0 max-w-7xl mr-auto mb-20 ml-auto pt-6 pr-6 pb-28 pl-6 relative z-10">
        <div className="hero-content grid place-items-center relative" style={parallaxStyle}>
          {/* Main headline */}
          <h1 className="md:mt-10 text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight select-none font-semibold text-white tracking-tight mt-10 text-center px-4 hero-headline">
            Enterprise Software. AI Systems. Digital Transformation.
          </h1>
          <p className="md:text-lg text-base text-white/70 text-center max-w-2xl mt-6 hero-subheadline">
            Custom-built solutions for businesses requiring precision and performance.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 z-10 max-w-2xl mt-8 mr-auto ml-auto relative px-4">
            <HeroCTA href="/contact" variant="primary" className="cta-button">
              Request Estimate
            </HeroCTA>
            <HeroCTA href="/portfolio" variant="secondary" className="cta-button">
              View Portfolio
            </HeroCTA>
          </div>
        </div>
      </div>
      <ScrollIndicator />
    </section>
  );
}
