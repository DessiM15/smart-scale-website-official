"use client";

import { Zap, Award, Handshake } from "lucide-react";
import GlowCard from "@/components/ui/GlowCard";
import SectionHeading from "@/components/ui/SectionHeading";

const benefits = [
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Speed",
    description:
      "MVPs delivered in 7 days using AI-accelerated development. No bureaucracy, no delays — just rapid iteration and deployment.",
  },
  {
    icon: <Award className="w-8 h-8" />,
    title: "Quality",
    description:
      "Enterprise-grade solutions without the enterprise overhead. Every project meets the highest standards of code quality and architecture.",
  },
  {
    icon: <Handshake className="w-8 h-8" />,
    title: "Partnership",
    description:
      "Direct founder involvement on every project. We're not just vendors — we're partners invested in your success.",
  },
];

export default function WhySmartScale() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          title="Why Smart Scale"
          subtitle="Premium boutique development with enterprise capabilities. Built for companies that demand excellence without the agency red tape."
        />

        <div className="scroll-reveal-stagger grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {benefits.map((benefit, index) => (
            <GlowCard key={index} className="p-8">
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DC2626] text-white">
                {benefit.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">
                {benefit.title}
              </h3>
              <p className="text-white/60 leading-relaxed">
                {benefit.description}
              </p>
            </GlowCard>
          ))}
        </div>
      </div>
    </section>
  );
}
