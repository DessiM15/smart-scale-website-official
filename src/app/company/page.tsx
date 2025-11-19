"use client";

import Link from "next/link";
import { Zap, Eye, Lightbulb, Target } from "lucide-react";
import TechBackground from "@/components/TechBackground";
import { useHeroAnimations } from "@/hooks/useHeroAnimations";
import NetworkConnections from "@/components/hero-backgrounds/NetworkConnections";
import HeroCTA from "@/components/HeroCTA";
import ScrollIndicator from "@/components/hero-backgrounds/ScrollIndicator";

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
  const { sectionRef, parallaxStyle, scrollStyle } = useHeroAnimations();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section 
        ref={sectionRef}
        className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-black text-white relative overflow-hidden min-h-[60vh] flex items-center"
        style={scrollStyle}
      >
        <TechBackground />
        {/* Animated startup journey timeline */}
        <div className="absolute inset-0 opacity-5 hero-bg-elements" style={{ opacity: 0 }}>
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#DC2626] to-transparent"></div>
          <div className="absolute top-1/2 left-[10%] w-4 h-4 -translate-y-1/2 rounded-full bg-[#DC2626] animate-pulse"></div>
          <div className="absolute top-1/2 left-[30%] w-4 h-4 -translate-y-1/2 rounded-full bg-[#DC2626] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/2 left-[50%] w-4 h-4 -translate-y-1/2 rounded-full bg-[#DC2626] animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-[70%] w-4 h-4 -translate-y-1/2 rounded-full bg-[#DC2626] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/2 left-[90%] w-4 h-4 -translate-y-1/2 rounded-full bg-[#DC2626] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        <NetworkConnections />
        <div className="max-w-7xl mx-auto text-center relative z-10" style={parallaxStyle}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6 hero-headline">
            New Energy. Real Results.
          </h1>
          <p className="text-xl sm:text-2xl text-white/70 max-w-3xl mx-auto mb-8 hero-subheadline">
            We're not jaded by years of 'how things are done.' We're hungry founders using AI to revolutionize how software gets built.
          </p>
          <HeroCTA href="#methodology" variant="primary">
            Why We're Different
          </HeroCTA>
        </div>
      </section>
      <ScrollIndicator />

      {/* Founder Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold mb-8 text-black">
            Direct Founder Involvement
          </h2>
          <div className="space-y-6 text-lg text-[#6B7280] leading-relaxed">
            <p>
              At Smart Scale, every project is led directly by the company's founders. This isn't a sales pitch—it's our core operating model. When you work with us, you get direct access to decision-makers who understand both the technical and business sides of your project.
            </p>
            <p>
              No account managers, no middle layers, no bureaucracy. Just founders who code, strategize, and deliver. This means faster decisions, clearer communication, and solutions that actually solve your problems—not just check boxes on a project plan.
            </p>
            <p className="font-semibold text-black">
              Enterprise quality. Boutique service. Founder-led execution.
            </p>
          </div>
        </div>
      </section>

      {/* BotMakers.ai Partnership */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F3F4F6]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#DC2626]/10 rounded-full mb-6 border border-[#DC2626]/20">
                <span className="text-sm font-semibold text-[#DC2626]">
                  Strategic Partnership
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-black">
                Powered by BotMakers.ai
              </h2>
              <p className="text-lg text-[#6B7280] leading-relaxed mb-6">
                Our exclusive partnership with BotMakers.ai gives us access to cutting-edge AI development capabilities. This isn't just about using AI tools—it's about leveraging advanced AI workflows and automation to accelerate development while maintaining enterprise-grade quality.
              </p>
              <p className="text-lg text-[#6B7280] leading-relaxed">
                This partnership enables our 7-day MVP delivery model, allowing us to build faster, smarter, and more efficiently than traditional development agencies. You get the speed of AI-accelerated development with the quality assurance of experienced founders.
              </p>
            </div>
            <div className="relative">
              {/* Abstract geometric design */}
              <div className="relative w-full aspect-square bg-gradient-to-br from-[#DC2626]/10 via-black/5 to-[#DC2626]/10 rounded-lg p-12 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-[#DC2626]/20 rounded-lg"></div>
                <div className="text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#DC2626] text-white mb-6">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-2">AI-Accelerated</h3>
                  <p className="text-[#6B7280]">Development Workflows</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Diagram */}
      <section id="methodology" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-black">
              Our Methodology
            </h2>
            <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
              A proven process that delivers results in record time.
            </p>
          </div>

          <div className="relative">
            {/* Connection Line - Hidden on mobile */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#DC2626] via-[#DC2626]/30 to-[#DC2626] transform -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
              {methodologySteps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="bg-[#1F2937] text-white p-6 rounded-lg hover:bg-black transition-all duration-300 h-full">
                    <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-[#DC2626] flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-bold mb-3 mt-2">{step.title}</h3>
                    <p className="text-white/80 text-sm leading-relaxed">{step.description}</p>
                  </div>
                  
                  {/* Arrow - Hidden on mobile */}
                  {index < methodologySteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-6 text-[#DC2626] z-20">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F3F4F6]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-black">
              Our Values
            </h2>
            <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
              The principles that guide every project and every interaction.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-full bg-[#DC2626] flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-black">{value.title}</h3>
                <p className="text-[#6B7280] leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Work with Founders?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Get direct access, enterprise quality, and 7-day MVPs—without the agency overhead.
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
