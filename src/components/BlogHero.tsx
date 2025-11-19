"use client";

import TechBackground from "@/components/TechBackground";
import { useHeroAnimations } from "@/hooks/useHeroAnimations";
import FloatingParticles from "@/components/hero-backgrounds/FloatingParticles";
import HeroCTA from "@/components/HeroCTA";
import ScrollIndicator from "@/components/hero-backgrounds/ScrollIndicator";

export default function BlogHero() {
  const { sectionRef, parallaxStyle, scrollStyle } = useHeroAnimations();

  return (
    <section 
      ref={sectionRef}
      className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-black text-white relative overflow-hidden min-h-[60vh] flex items-center"
      style={scrollStyle}
    >
      <TechBackground />
      <FloatingParticles count={40} />
      <div className="max-w-7xl mx-auto text-center relative z-10" style={parallaxStyle}>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight hero-headline">
          Building in Public. Learning in Real-Time.
        </h1>
        <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto mb-8 hero-subheadline">
          Follow our journey as we revolutionize development with AI and radical transparency.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <HeroCTA href="/company" variant="primary">
            Read Our Story
          </HeroCTA>
          <HeroCTA href="/contact" variant="secondary">
            Get Updates
          </HeroCTA>
        </div>
      </div>
      <ScrollIndicator />
    </section>
  );
}

