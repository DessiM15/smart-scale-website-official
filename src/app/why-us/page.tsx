"use client";

import Link from "next/link";
import { Zap, Eye, Lightbulb, Target } from "lucide-react";
import GlowCard from "@/components/ui/GlowCard";
import HeroCTA from "@/components/HeroCTA";

const values = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Speed",
    description: "7-day MVPs. Rapid iteration. No bureaucracy slowing you down.",
  },
  {
    icon: <Eye className="w-6 h-6" />,
    title: "Transparency",
    description: "Clear communication, honest timelines, and direct access to decision-makers.",
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    title: "Innovation",
    description: "AI-accelerated development and cutting-edge technology to solve complex problems.",
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Results",
    description: "Enterprise-quality solutions that drive measurable business outcomes.",
  },
];

export default function WhyUs() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 hero-headline">
            Hungry. Fast. Obsessed with Your Success.
          </h1>
          <p className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto mb-8 hero-subheadline">
            Your project gets our full energy and latest innovations.
          </p>
          <HeroCTA href="/contact" variant="primary">
            Experience the Difference
          </HeroCTA>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              Our Values
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              The principles that guide every project and every interaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <GlowCard key={index} className="p-8">
                <div className="w-14 h-14 rounded-full bg-[#DC2626] flex items-center justify-center text-white mb-6">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{value.title}</h3>
                <p className="text-white/60 leading-relaxed">{value.description}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Difference */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold mb-8 text-white text-center">
            Direct Founder Involvement
          </h2>
          <div className="space-y-6 text-lg text-white/60 leading-relaxed">
            <p>
              At Smart Scale, every project is led directly by the company&apos;s founders. This isn&apos;t a sales pitch — it&apos;s our core operating model. When you work with us, you get direct access to decision-makers who understand both the technical and business sides of your project.
            </p>
            <p>
              No account managers, no middle layers, no bureaucracy. Just founders who code, strategize, and deliver. This means faster decisions, clearer communication, and solutions that actually solve your problems.
            </p>
            <p className="font-semibold text-white text-center">
              Enterprise quality. Boutique service. Founder-led execution.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
            Ready to Experience the Difference?
          </h2>
          <p className="text-xl text-white/60 mb-8">
            Get direct access, enterprise quality, and 7-day MVPs — without the agency overhead.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-[#DC2626] text-white rounded-full text-lg font-semibold hover:bg-red-700 transition-all duration-300 hover:scale-105"
          >
            Request Estimate
          </Link>
        </div>
      </section>
    </div>
  );
}
