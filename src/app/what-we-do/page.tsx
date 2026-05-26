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
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero with gradient mesh */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 20% 60%, rgba(185, 28, 28, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 30%, rgba(220, 38, 38, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 90%, rgba(139, 0, 0, 0.05) 0%, transparent 40%)
            `,
          }}
        />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-6xl md:text-7xl mb-6 hero-headline">
            Engineering Excellence
          </h1>
          <p className="text-lg sm:text-xl text-white/50 max-w-3xl mx-auto mb-8 hero-subheadline">
            End-to-end software development for businesses that demand
            precision, reliability, and long-term value.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 px-8 py-3.5 border border-white/20 rounded-full text-sm uppercase tracking-widest text-white/80 hover:text-white hover:border-white/40 transition-all duration-500"
            >
              Start a Conversation
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-3 px-8 py-3.5 border border-white/10 rounded-full text-sm uppercase tracking-widest text-white/50 hover:text-white/80 hover:border-white/20 transition-all duration-500"
            >
              View Our Work
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#111111]">
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

      {/* Technologies Used */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl mb-12 text-center text-white" data-animate="fade-up">
            Our Stack
          </h2>
          <div className="flex flex-wrap justify-center gap-4" data-animate="stagger">
            {technologies.map((tech, index) => (
              <span
                key={index}
                className="px-6 py-3 rounded-full text-sm font-medium bg-[#161616] text-white/50 border border-white/[0.06] hover:border-white/[0.12] hover:text-white/70 transition-all duration-300 uppercase tracking-widest"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Process Overview */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#111111]">
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

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl mb-6 text-white" data-animate="fade-up">
            Ready to Begin?
          </h2>
          <p className="text-lg text-white/50 mb-8" data-animate="fade-up">
            Let&apos;s discuss how precision engineering can transform your
            business.
          </p>
          <div data-animate="fade-up">
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 px-10 py-4 border border-white/20 rounded-full text-sm uppercase tracking-widest text-white/80 hover:text-white hover:border-white/40 transition-all duration-500"
            >
              Start a Conversation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
