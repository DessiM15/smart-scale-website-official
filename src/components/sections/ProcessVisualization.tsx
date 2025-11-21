"use client";

import { Search, Rocket, RefreshCw, CheckCircle } from "lucide-react";

const processSteps = [
  {
    icon: <Search className="w-6 h-6" />,
    title: "Discovery",
    description: "Deep dive into your requirements, goals, and technical needs.",
  },
  {
    icon: <Rocket className="w-6 h-6" />,
    title: "MVP in 7 Days",
    description: "AI-accelerated development delivers your working prototype in one week.",
    highlight: true,
  },
  {
    icon: <RefreshCw className="w-6 h-6" />,
    title: "Iterate",
    description: "Rapid refinement based on feedback and real-world testing.",
  },
  {
    icon: <CheckCircle className="w-6 h-6" />,
    title: "Launch",
    description: "Production-ready deployment with ongoing support and optimization.",
  },
];

export default function ProcessVisualization() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-black text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="scroll-reveal text-4xl sm:text-5xl font-bold mb-4">
            Our Process
          </h2>
          <p className="scroll-reveal text-lg text-white/70 max-w-2xl mx-auto">
            From concept to launch in record time. No bureaucracy, no delays—just results.
          </p>
        </div>

        {/* Process Flow */}
        <div className="relative">
          {/* Connection Line - Hidden on mobile, visible on larger screens */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#DC2626] via-[#DC2626]/50 to-[#DC2626] transform -translate-y-1/2"></div>
          
          <div className="scroll-reveal-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {processSteps.map((step, index) => (
              <div
                key={index}
                className={`relative ${
                  step.highlight
                    ? "lg:scale-110 lg:z-20"
                    : ""
                }`}
              >
                {/* Step Card */}
                <div
                  className="p-8 rounded-lg transition-all duration-300 bg-[#1F2937] hover:bg-[#1F2937]/80 hover:border-[#DC2626] hover:border-2 border-2 border-transparent"
                >
                  {/* Icon Circle */}
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-[#DC2626] text-white"
                  >
                    {step.icon}
                  </div>

                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-[#DC2626] flex items-center justify-center text-white font-bold text-sm border-4 border-black">
                    {index + 1}
                  </div>

                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-white/80 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow - Hidden on mobile, visible on larger screens */}
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-8 text-[#DC2626] z-30">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-full h-full"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-xl text-white/90 mb-6">
            Ready to ship your MVP in 7 days?
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-4 bg-[#DC2626] text-white rounded-full text-lg font-semibold hover:bg-red-700 transition-all duration-300 hover:scale-105"
          >
            Start Your Project →
          </a>
        </div>
      </div>
    </section>
  );
}

