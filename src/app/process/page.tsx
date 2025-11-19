"use client";

import Link from "next/link";
import TechBackground from "@/components/TechBackground";
import { useHeroAnimations } from "@/hooks/useHeroAnimations";
import NetworkConnections from "@/components/hero-backgrounds/NetworkConnections";
import HeroCTA from "@/components/HeroCTA";
import ScrollIndicator from "@/components/hero-backgrounds/ScrollIndicator";

const processSteps = [
  {
    step: "Week 1: MVP",
    description: "Your first working prototype delivered in 7 days. Rapid iteration and continuous feedback.",
  },
  {
    step: "Week 2: Development",
    description: "Full development cycle with AI-accelerated workflows and direct founder oversight.",
  },
  {
    step: "Week 2: Testing",
    description: "Comprehensive testing to ensure quality, reliability, and performance.",
  },
  {
    step: "Week 2: Delivery",
    description: "Production-ready deployment with ongoing support and optimization.",
  },
];

export default function Process() {
  const { sectionRef, parallaxStyle, scrollStyle } = useHeroAnimations();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section 
        ref={sectionRef}
        className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-black text-white relative overflow-hidden min-h-[60vh] flex items-center"
        style={scrollStyle}
      >
        <TechBackground />
        <NetworkConnections />
        <div className="max-w-7xl mx-auto text-center relative z-10" style={parallaxStyle}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight hero-headline">
            Week 1: Your MVP
            <br />
            <span className="text-[#DC2626]">Week 2: Development, Testing, Delivery</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto mb-8 hero-subheadline">
            Our AI-accelerated process means you see results while others are still planning meetings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <HeroCTA href="/contact" variant="primary">
              Start Week 1
            </HeroCTA>
            <HeroCTA href="#process-steps" variant="secondary">
              Learn the Process
            </HeroCTA>
          </div>
        </div>
      </section>
      <ScrollIndicator />

      {/* Process Steps */}
      <section id="process-steps" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-black">
              Our Process
            </h2>
            <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
              A proven process that delivers results in record time.
            </p>
          </div>

          <div className="relative">
            {/* Connection Line - Hidden on mobile */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#DC2626] via-[#DC2626]/30 to-[#DC2626] transform -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {processSteps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="bg-[#1F2937] text-white p-6 rounded-lg hover:bg-black transition-all duration-300 h-full">
                    <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-[#DC2626] flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-bold mb-3 mt-2">{step.step}</h3>
                    <p className="text-white/80 text-sm leading-relaxed">{step.description}</p>
                  </div>
                  
                  {/* Arrow - Hidden on mobile */}
                  {index < processSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-6 text-[#DC2626] z-20">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Week 1?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Get your MVP in 7 days. No proposals. No meetings. Just results.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-[#DC2626] text-white rounded-full text-lg font-semibold hover:bg-red-700 transition"
          >
            Request Estimate
          </Link>
        </div>
      </section>
    </div>
  );
}

