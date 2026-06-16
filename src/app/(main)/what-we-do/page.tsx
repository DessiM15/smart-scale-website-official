"use client";

import ServiceCard from "@/components/ServiceCard";
import Link from "next/link";
import {
  Smartphone,
  Globe,
  Brain,
  Building2,
  Layout,
  Zap,
} from "lucide-react";
import GlowCard from "@/components/ui/GlowCard";
import RedSeparator from "@/components/ui/RedSeparator";

const capabilities = [
  {
    title: "Web Applications",
    description: "Full-stack platforms built for performance, security, and scale.",
    icon: <Globe className="w-8 h-8" />,
  },
  {
    title: "Mobile Development",
    description: "Native and cross-platform applications for iOS and Android.",
    icon: <Smartphone className="w-8 h-8" />,
  },
  {
    title: "AI Systems",
    description: "Intelligent automation, NLP, and machine learning integrated into your workflows.",
    icon: <Brain className="w-8 h-8" />,
  },
  {
    title: "Enterprise Platforms",
    description: "Mission-critical systems engineered for reliability and scale.",
    icon: <Building2 className="w-8 h-8" />,
  },
  {
    title: "Web Development",
    description: "Modern, responsive websites with meticulous attention to craft.",
    icon: <Layout className="w-8 h-8" />,
  },
  {
    title: "Integrations & Automation",
    description: "Seamless API connections and automated data workflows.",
    icon: <Zap className="w-8 h-8" />,
  },
];

const technologies = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "PostgreSQL",
  "Vercel",
];

const processSteps = [
  { step: "Discovery", description: "Understanding your business, goals, and technical landscape." },
  { step: "Architecture", description: "Designing systems built for longevity and scale." },
  { step: "Engineering", description: "Precision development with rigorous quality standards." },
  { step: "Validation", description: "Comprehensive testing to ensure reliability under load." },
  { step: "Deployment", description: "Smooth launch with ongoing optimization and support." },
];

export default function WhatWeDo() {
  return (
    <div className="min-h-screen">
      {/* Hero - Light */}
      <section data-theme="light" className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-6xl md:text-7xl mb-6 hero-headline text-[#111111]">
            Engineering Excellence
          </h1>
          <p className="text-lg sm:text-xl text-black/50 max-w-3xl mx-auto mb-8 hero-subheadline">
            End-to-end software development for businesses that demand
            precision, reliability, and long-term value.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#DC2626] text-white rounded-full text-sm uppercase tracking-widest hover:bg-red-700 transition-all duration-500"
            >
              Start a Conversation
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-3 px-8 py-3.5 border border-black/20 rounded-full text-sm uppercase tracking-widest text-[#111111]/80 hover:text-[#111111] hover:border-black/40 transition-all duration-500"
            >
              View Our Work
            </Link>
          </div>
        </div>
      </section>

      <RedSeparator />

      {/* Capabilities Grid - Dark */}
      <section data-theme="dark" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl mb-12 text-center text-white" data-animate="fade-up">
            Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-animate="stagger">
            {capabilities.map((capability, index) => (
              <ServiceCard
                key={index}
                title={capability.title}
                description={capability.description}
                icon={capability.icon}
              />
            ))}
          </div>
        </div>
      </section>

      <RedSeparator />

      {/* Technologies Used - Light */}
      <section data-theme="light" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl mb-12 text-center text-[#111111]" data-animate="fade-up">
            Our Stack
          </h2>
          <div className="flex flex-wrap justify-center gap-4" data-animate="stagger">
            {technologies.map((tech, index) => (
              <span
                key={index}
                className="px-6 py-3 rounded-full text-sm font-medium bg-[#F5F5F5] text-[#111111]/60 border border-black/[0.06] hover:border-black/[0.12] hover:text-[#111111]/80 transition-all duration-300 uppercase tracking-widest"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      <RedSeparator />

      {/* Process Overview - Dark */}
      <section data-theme="dark" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl mb-12 text-center text-white" data-animate="fade-up">
            Our Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6" data-animate="stagger">
            {processSteps.map((item, index) => (
              <GlowCard key={index} className="p-6">
                <div className="text-sm font-medium text-white/30 mb-2">
                  0{index + 1}
                </div>
                <h3 className="text-xl mb-3 text-white">
                  {item.step}
                </h3>
                <p className="text-white/45 text-sm">{item.description}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      <RedSeparator />

      {/* CTA - Light */}
      <section data-theme="light" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl mb-6 text-[#111111]" data-animate="fade-up">
            Ready to Begin?
          </h2>
          <p className="text-lg text-black/50 mb-8" data-animate="fade-up">
            Let&apos;s discuss how precision engineering can transform your
            business.
          </p>
          <div data-animate="fade-up">
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 px-10 py-4 bg-[#DC2626] text-white rounded-full text-sm uppercase tracking-widest hover:bg-red-700 transition-all duration-500"
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
