"use client";

import { Zap, Award, Handshake } from "lucide-react";

const benefits = [
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Speed",
    description: "MVPs delivered in 7 days using AI-accelerated development. No bureaucracy, no delays—just rapid iteration and deployment.",
  },
  {
    icon: <Award className="w-8 h-8" />,
    title: "Quality",
    description: "Enterprise-grade solutions without the enterprise overhead. Every project meets the highest standards of code quality and architecture.",
  },
  {
    icon: <Handshake className="w-8 h-8" />,
    title: "Partnership",
    description: "Direct founder involvement on every project. We're not just vendors—we're partners invested in your success.",
  },
];

export default function WhySmartScale() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-black">
            Why Smart Scale
          </h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            Premium boutique development with enterprise capabilities. Built for companies that demand excellence without the agency red tape.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group relative p-8 bg-[#F3F4F6] rounded-lg hover:bg-black transition-all duration-300 hover:shadow-2xl"
            >
              {/* Geometric background accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#DC2626]/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DC2626] text-white group-hover:scale-110 transition-transform duration-300">
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-black group-hover:text-white transition-colors duration-300">
                  {benefit.title}
                </h3>
                <p className="text-[#6B7280] group-hover:text-white/80 leading-relaxed transition-colors duration-300">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

