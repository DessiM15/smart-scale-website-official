"use client";

import { Eye, Lightbulb, Target, Shield } from "lucide-react";
import GlowCard from "@/components/ui/GlowCard";
import Link from "next/link";
import RedSeparator from "@/components/ui/RedSeparator";

const values = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Precision",
    description: "Every line of code is intentional. We engineer systems built to endure.",
  },
  {
    icon: <Eye className="w-6 h-6" />,
    title: "Transparency",
    description: "Clear communication, honest timelines, and direct access to leadership.",
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    title: "Innovation",
    description: "Leveraging AI and modern architecture to solve complex problems elegantly.",
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Excellence",
    description: "The same standard of work on a barbershop site as on a platform build.",
  },
];

export default function Company() {
  return (
    <div className="min-h-screen">
      {/* Hero - Light */}
      <section data-theme="light" className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-6xl md:text-7xl leading-tight mb-6 text-[#111111]" data-animate="word-reveal">
            A Web Design Agency Built for Local Businesses
          </h1>
          <p className="text-xl sm:text-2xl text-black/50 max-w-3xl mx-auto mb-8 hero-subheadline">
            A small team in Katy, TX. Every project gets founder-level
            attention. You talk to the people who build your site.
          </p>
          <div className="flex justify-center">
            <Link
              href="/portfolio"
              className="btn-hover-enhanced inline-flex items-center gap-3 px-8 py-3.5 bg-[#DC2626] text-white rounded-full text-sm uppercase tracking-widest hover:bg-red-700 transition-all duration-500"
            >
              See the work
            </Link>
          </div>
        </div>
      </section>

      <RedSeparator />

      {/* Founder Section - Dark */}
      <section data-theme="light" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16" data-animate="fade-up">
            <h2 className="text-4xl sm:text-5xl mb-4 text-[#111111]">
              Our Values
            </h2>
            <p className="text-lg text-black/50 max-w-2xl mx-auto">
              The principles that guide every engagement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-animate="stagger">
            {values.map((value, index) => (
              <GlowCard key={index} theme="light" className="p-8">
                <div className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center text-[#DC2626] mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl mb-4 text-[#111111]">{value.title}</h3>
                <p className="text-black/50 leading-relaxed">{value.description}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      <RedSeparator />

      {/* CTA - Dark */}
      <section data-theme="dark" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-[#111111] noise-overlay">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl mb-6 text-white" data-animate="fade-up">
            Let&apos;s Work Together
          </h2>
          <p className="text-lg text-white/50 mb-8" data-animate="fade-up">
            One call, a fixed price in writing, and a site most clients see
            live within two weeks.
          </p>
          <div data-animate="fade-up">
            <Link
              href="/contact"
              className="btn-hover-enhanced inline-flex items-center gap-3 px-10 py-4 bg-[#DC2626] text-white rounded-full text-sm uppercase tracking-widest hover:bg-red-700 transition-all duration-500"
            >
              Start a Conversation
              <svg
                viewBox="0 0 24 24"
                stroke="currentColor"
                fill="none"
                className="w-4 h-4"
              >
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
