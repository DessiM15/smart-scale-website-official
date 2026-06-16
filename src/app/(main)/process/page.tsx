"use client";

import Link from "next/link";
import GlowCard from "@/components/ui/GlowCard";
import HeroCTA from "@/components/HeroCTA";
import RedSeparator from "@/components/ui/RedSeparator";

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
  return (
    <div className="min-h-screen">
      {/* Hero - Light */}
      <section data-theme="light" className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight hero-headline text-[#111111]">
            Week 1: Your MVP
            <br />
            <span className="text-[#DC2626]">Week 2: Development, Testing, Delivery</span>
          </h1>
          <p className="text-lg sm:text-xl text-black/50 max-w-3xl mx-auto mb-8 hero-subheadline">
            Our AI-accelerated process means you see results while others are still planning meetings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <HeroCTA href="/contact" variant="primary">
              Start Week 1
            </HeroCTA>
            <HeroCTA href="#process-steps" variant="secondary" theme="light">
              Learn the Process
            </HeroCTA>
          </div>
        </div>
      </section>

      <RedSeparator />

      {/* Process Steps - Dark */}
      <section id="process-steps" data-theme="dark" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              Our Process
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              A proven process that delivers results in record time.
            </p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#DC2626] via-[#DC2626]/30 to-[#DC2626] transform -translate-y-1/2" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {processSteps.map((step, index) => (
                <GlowCard key={index} className="p-6 relative">
                  <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-[#DC2626] flex items-center justify-center text-white font-bold text-sm border-2 border-[#111111] z-20">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-bold mb-3 mt-2 text-white">{step.step}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{step.description}</p>
                </GlowCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      <RedSeparator />

      {/* CTA - Light */}
      <section data-theme="light" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-[#111111]">
            Ready to Start Week 1?
          </h2>
          <p className="text-xl text-black/50 mb-8">
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
