"use client";

import { Eye, Lightbulb, Target, Shield } from "lucide-react";
import GlowCard from "@/components/ui/GlowCard";
import Link from "next/link";

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
    description: "Enterprise-grade quality in every engagement, without compromise.",
  },
];

const methodologySteps = [
  {
    title: "Discovery & Strategy",
    description: "Deep understanding of your business, goals, and technical landscape.",
  },
  {
    title: "Architecture & Design",
    description: "Thoughtful system design that balances performance, scalability, and maintainability.",
  },
  {
    title: "Precision Engineering",
    description: "Meticulous development with rigorous code review and quality standards.",
  },
  {
    title: "Iterative Refinement",
    description: "Continuous feedback loops ensuring alignment with your evolving vision.",
  },
  {
    title: "Launch & Partnership",
    description: "Production deployment with ongoing optimization and strategic support.",
  },
];

export default function Company() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-6xl md:text-7xl leading-tight mb-6 hero-headline">
            Built on Principle
          </h1>
          <p className="text-xl sm:text-2xl text-white/50 max-w-3xl mx-auto mb-8 hero-subheadline">
            A boutique consultancy where every project receives founder-level
            attention and enterprise-grade engineering.
          </p>
          <div className="flex justify-center">
            <Link
              href="#methodology"
              className="inline-flex items-center gap-3 px-8 py-3.5 border border-white/20 rounded-full text-sm uppercase tracking-widest text-white/80 hover:text-white hover:border-white/40 transition-all duration-500"
            >
              Our Approach
            </Link>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0F0F0F]">
        <div className="max-w-4xl mx-auto" data-animate="fade-up">
          <h2 className="text-4xl sm:text-5xl mb-8 text-white">
            Direct Founder Involvement
          </h2>
          <div className="space-y-6 text-lg text-white/50 leading-relaxed">
            <p>
              At Smart Scale, every project is led directly by the company&apos;s
              founders. This isn&apos;t a sales pitch — it&apos;s our core
              operating model. When you work with us, you get direct access to
              decision-makers who understand both the technical and business
              sides of your project.
            </p>
            <p>
              No account managers, no middle layers. Just experienced engineers
              who architect, build, and deliver. This means faster decisions,
              clearer communication, and solutions that truly solve your
              problems.
            </p>
            <p className="text-white/70">
              Enterprise quality. Boutique attention. Founder-led execution.
            </p>
          </div>
        </div>
      </section>

      {/* Strategic Partnership */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div data-animate="fade-up">
              <span className="text-xs uppercase tracking-widest text-white/30 mb-6 block">
                Strategic Partnership
              </span>
              <h2 className="text-4xl sm:text-5xl mb-6 text-white">
                Powered by BotMakers.ai
              </h2>
              <p className="text-lg text-white/50 leading-relaxed mb-6">
                Our partnership with BotMakers.ai gives us access to
                cutting-edge AI development capabilities. This isn&apos;t just
                about using AI tools — it&apos;s about leveraging advanced AI
                workflows to engineer solutions with greater precision and
                efficiency.
              </p>
              <p className="text-lg text-white/50 leading-relaxed">
                This partnership enables us to deliver architecturally sound
                solutions faster, without sacrificing the quality standards our
                clients expect.
              </p>
            </div>
            <div className="relative" data-animate="fade-up">
              <div className="relative w-full aspect-square rounded-2xl bg-[#161616] border border-white/[0.06] p-12 flex items-center justify-center">
                <div className="text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border border-white/10 text-white/40 mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl text-white mb-2">AI-Enhanced</h3>
                  <p className="text-white/40 text-sm">Engineering Workflows</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section id="methodology" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16" data-animate="fade-up">
            <h2 className="text-4xl sm:text-5xl mb-4 text-white">
              Our Methodology
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              A deliberate process that prioritizes quality at every stage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10" data-animate="stagger">
            {methodologySteps.map((step, index) => (
              <GlowCard key={index} className="p-6 relative">
                <div className="text-sm font-medium text-white/30 mb-2">
                  0{index + 1}
                </div>
                <h3 className="text-lg mb-3 text-white">{step.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{step.description}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16" data-animate="fade-up">
            <h2 className="text-4xl sm:text-5xl mb-4 text-white">
              Our Values
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              The principles that guide every engagement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-animate="stagger">
            {values.map((value, index) => (
              <GlowCard key={index} className="p-8">
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl mb-4 text-white">{value.title}</h3>
                <p className="text-white/45 leading-relaxed">{value.description}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0F0F0F]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl mb-6 text-white" data-animate="fade-up">
            Let&apos;s Work Together
          </h2>
          <p className="text-lg text-white/50 mb-8" data-animate="fade-up">
            Direct access to founders, enterprise-grade engineering, and a
            genuine commitment to your success.
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
