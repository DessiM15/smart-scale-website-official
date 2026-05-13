"use client";

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

const methodologySteps = [
  {
    title: "Discovery & Strategy",
    description: "Deep understanding of your business, goals, and technical requirements.",
  },
  {
    title: "AI-Accelerated Development",
    description: "Leveraging our partnership with BotMakers.ai for rapid, intelligent development.",
  },
  {
    title: "Direct Founder Oversight",
    description: "Every project receives hands-on attention from company leadership.",
  },
  {
    title: "Rapid Iteration",
    description: "7-day MVP cycles with continuous feedback and refinement.",
  },
  {
    title: "Enterprise Deployment",
    description: "Production-ready systems with ongoing support and optimization.",
  },
];

export default function Company() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6 hero-headline">
            New Energy. Real Results.
          </h1>
          <p className="text-xl sm:text-2xl text-white/60 max-w-3xl mx-auto mb-8 hero-subheadline">
            We&apos;re not jaded by years of &apos;how things are done.&apos; We&apos;re hungry founders using AI to revolutionize how software gets built.
          </p>
          <div className="flex justify-center">
            <HeroCTA href="#methodology" variant="primary" className="hero-cta">
              Why We&apos;re Different
            </HeroCTA>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold mb-8 text-white">
            Direct Founder Involvement
          </h2>
          <div className="space-y-6 text-lg text-white/60 leading-relaxed">
            <p>
              At Smart Scale, every project is led directly by the company&apos;s founders. This isn&apos;t a sales pitch — it&apos;s our core operating model. When you work with us, you get direct access to decision-makers who understand both the technical and business sides of your project.
            </p>
            <p>
              No account managers, no middle layers, no bureaucracy. Just founders who code, strategize, and deliver. This means faster decisions, clearer communication, and solutions that actually solve your problems.
            </p>
            <p className="font-semibold text-white">
              Enterprise quality. Boutique service. Founder-led execution.
            </p>
          </div>
        </div>
      </section>

      {/* BotMakers.ai Partnership */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#DC2626]/10 rounded-full mb-6 border border-[#DC2626]/20">
                <span className="text-sm font-semibold text-[#DC2626]">
                  Strategic Partnership
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
                Powered by BotMakers.ai
              </h2>
              <p className="text-lg text-white/60 leading-relaxed mb-6">
                Our exclusive partnership with BotMakers.ai gives us access to cutting-edge AI development capabilities. This isn&apos;t just about using AI tools — it&apos;s about leveraging advanced AI workflows and automation to accelerate development while maintaining enterprise-grade quality.
              </p>
              <p className="text-lg text-white/60 leading-relaxed">
                This partnership enables our 7-day MVP delivery model, allowing us to build faster, smarter, and more efficiently than traditional development agencies.
              </p>
            </div>
            <div className="relative">
              <div className="relative w-full aspect-square rounded-3xl bg-[#161616] border border-white/[0.08] p-12 flex items-center justify-center">
                <div className="text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#DC2626] text-white mb-6">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">AI-Accelerated</h3>
                  <p className="text-white/50">Development Workflows</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section id="methodology" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              Our Methodology
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              A proven process that delivers results in record time.
            </p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#DC2626] via-[#DC2626]/30 to-[#DC2626] transform -translate-y-1/2" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
              {methodologySteps.map((step, index) => (
                <GlowCard key={index} className="p-6 relative">
                  <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-[#DC2626] flex items-center justify-center text-white font-bold text-sm border-2 border-[#111111] z-20">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-bold mb-3 mt-2 text-white">{step.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{step.description}</p>
                </GlowCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
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

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
            Ready to Work with Founders?
          </h2>
          <p className="text-xl text-white/60 mb-8">
            Get direct access, enterprise quality, and 7-day MVPs — without the agency overhead.
          </p>
          <div className="flex justify-center">
            <HeroCTA href="/contact" variant="primary">
              Request Estimate
            </HeroCTA>
          </div>
        </div>
      </section>
    </div>
  );
}
