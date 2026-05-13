"use client";

import ServiceCard from "@/components/ServiceCard";
import Link from "next/link";
import {
  Smartphone,
  Globe,
  Layers,
  Brain,
  Building2,
  Layout,
  Zap,
} from "lucide-react";
import GlowCard from "@/components/ui/GlowCard";
import HeroCTA from "@/components/HeroCTA";

const capabilities = [
  {
    title: "Mobile Development",
    description: "Native and cross-platform mobile applications for iOS and Android.",
    icon: <Smartphone className="w-8 h-8" />,
  },
  {
    title: "Web Development",
    description: "Modern, responsive web applications using cutting-edge technologies.",
    icon: <Globe className="w-8 h-8" />,
  },
  {
    title: "Cross-Platform Apps",
    description: "Unified applications that work seamlessly across all platforms.",
    icon: <Layers className="w-8 h-8" />,
  },
  {
    title: "AI Workflow Automation",
    description: "Intelligent automation and AI-powered workflows to streamline operations.",
    icon: <Brain className="w-8 h-8" />,
  },
  {
    title: "Enterprise Systems",
    description: "Scalable enterprise software solutions for complex business requirements.",
    icon: <Building2 className="w-8 h-8" />,
  },
  {
    title: "Web Applications",
    description: "Full-stack web applications with robust architecture and performance.",
    icon: <Layout className="w-8 h-8" />,
  },
  {
    title: "Integrations & APIs",
    description: "Seamless integrations and automated workflows to connect your systems.",
    icon: <Zap className="w-8 h-8" />,
  },
];

const technologies = [
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Postgres",
  "Vercel",
];

const processSteps = [
  { step: "Discovery", description: "Understanding your business needs, goals, and technical requirements." },
  { step: "Planning", description: "Creating detailed project plans, architecture, and timelines." },
  { step: "Development", description: "Building your solution with clean, maintainable, and scalable code." },
  { step: "Testing", description: "Comprehensive testing to ensure quality and reliability." },
  { step: "Deployment", description: "Smooth deployment and ongoing support for your solution." },
];

export default function WhatWeDo() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 hero-headline">
            Your MVP in 7 Days.
          </h1>
          <p className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto mb-8 hero-subheadline">
            While others are still writing proposals, we&apos;re already delivering your first working prototype.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <HeroCTA href="/contact" variant="primary">
              Schedule Consultation
            </HeroCTA>
            <HeroCTA href="/company" variant="secondary">
              See Our Process
            </HeroCTA>
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center text-white">
            Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <h2 className="text-4xl font-bold mb-12 text-center text-white">
            Technologies Used
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {technologies.map((tech, index) => (
              <span
                key={index}
                className="px-6 py-3 rounded-full text-lg font-medium bg-[#161616] text-white/70 border border-white/[0.08] hover:border-[#DC2626]/30 hover:text-white transition-all duration-300"
                style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
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
          <h2 className="text-4xl font-bold mb-12 text-center text-white">
            Our Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {processSteps.map((item, index) => (
              <GlowCard key={index} className="p-6">
                <div className="text-2xl font-bold text-[#DC2626] mb-2">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">
                  {item.step}
                </h3>
                <p className="text-white/50">{item.description}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/60 mb-8">
            Let&apos;s discuss how we can help transform your business.
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
