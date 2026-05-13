"use client";

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

    video.loop = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isVisible = entry.isIntersecting;

          if (!isVisible) {
            hasScrolledPastRef.current = true;
            video.loop = false;
            setShouldLoop(false);
          } else if (hasScrolledPastRef.current) {
            video.loop = true;
            setShouldLoop(true);
            if (video.ended) {
              video.play().catch(() => {});
            }
          }
        });
      },
      { threshold: 0.5 }
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

      {/* Overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/50 -z-10 hero-bg-fade" />

      {/* Unicorn globe */}
      <div
        style={{
          maskImage:
            "linear-gradient(black 0%, black 60%, transparent 100%)",
        }}
        className="hero-bg-fade"
      >
        <div
          className="absolute top-0 left-0 -z-10 w-full h-full"
          data-us-project="BhoqrigscYbD7NN1fwcp"
        />
      </div>

      {/* Floating Particles */}
      <FloatingParticles count={60} />

      {/* Hero Content */}
      <div className="md:px-8 md:pt-0 md:pb-0 max-w-7xl mr-auto mb-20 ml-auto pt-6 pr-6 pb-28 pl-6 relative z-10">
        <div
          className="hero-content grid place-items-center relative"
          style={parallaxStyle}
        >
          <h1 className="md:mt-10 text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight select-none font-semibold text-white tracking-tight mt-10 text-center px-4 hero-headline">
            Enterprise Software. AI Systems. Digital Transformation.
          </h1>
          <p className="md:text-lg text-base text-white/70 text-center max-w-2xl mt-6 hero-subheadline">
            Custom-built solutions for businesses requiring precision and
            performance.
          </p>

          {/* CTA Buttons — reduced to 2 */}
          <div className="flex flex-col sm:flex-row gap-4 z-10 max-w-3xl mt-10 mr-auto ml-auto relative px-4">
            <HeroCTA href="/contact" variant="primary" className="hero-cta">
              Request Estimate
            </HeroCTA>
            <HeroCTA
              href="/portfolio"
              variant="secondary"
              className="hero-cta"
            >
              View Portfolio
            </HeroCTA>
          </div>
        </div>
      </div>
      <ScrollIndicator />
    </section>
  );
}
