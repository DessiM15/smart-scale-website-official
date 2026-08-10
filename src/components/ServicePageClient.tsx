"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { SERVICES } from "@/lib/constants";
import {
  Smartphone,
  Globe,
  Mail,
  Building2,
  Brain,
  Layout,
  Zap,
} from "lucide-react";
import ServiceNavigation from "@/components/ServiceNavigation";
import GlowCard from "@/components/ui/GlowCard";

const iconMap: Record<string, React.ReactNode> = {
  "mobile-development": <Smartphone className="w-12 h-12" />,
  "web-development": <Globe className="w-12 h-12" />,
  "email-client-development": <Mail className="w-12 h-12" />,
  "enterprise-systems": <Building2 className="w-12 h-12" />,
  "ai-enhancement-ai-workflows": <Brain className="w-12 h-12" />,
  "web-applications": <Layout className="w-12 h-12" />,
  "integrations-and-automation": <Zap className="w-12 h-12" />,
};

interface ServicePageClientProps {
  slug: string;
}

export default function ServicePageClient({ slug }: ServicePageClientProps) {
  const service = SERVICES.find((s) => s.slug === slug);

  if (!service) {
    notFound();
  }

  const icon = iconMap[service.slug];

  return (
    <div className="min-h-screen">
      {/* Hero — LIGHT */}
      <section data-theme="light" className="bg-white min-h-[70vh] flex items-center pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="flex flex-col items-center text-center">
            {icon && (
              <div className="mb-8 flex justify-center items-center">
                <div className="w-24 h-24 rounded-full bg-[#DC2626] flex items-center justify-center text-white shadow-lg p-6">
                  {icon}
                </div>
              </div>
            )}
            <h1 className="subpage-hero-title text-[#111111] mb-6 hero-headline">
              {service.title}
            </h1>
            <p className="text-lg text-black/50 max-w-3xl mb-8 hero-subheadline">
              Precision-engineered {service.title.toLowerCase()} built for performance, reliability, and scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-3 px-8 py-3.5 border border-black/20 rounded-full text-sm uppercase tracking-widest text-[#111111]/80 hover:text-[#111111] hover:border-black/40 transition-all duration-500"
              >
                Start a Conversation
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-3 px-8 py-3.5 border border-black/10 rounded-full text-sm uppercase tracking-widest text-black/50 hover:text-[#111111]/80 hover:border-black/20 transition-all duration-500"
              >
                View Our Work
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Extended Description — DARK */}
      <section data-theme="dark" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <p className="text-lg text-white/60 leading-relaxed">
            {service.extendedDescription}
          </p>
        </div>
      </section>

      <ServiceNavigation />

      {/* Key Features — LIGHT */}
      <section id="key-features" data-theme="light" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center text-[#111111]">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {service.keyFeatures.map((feature, index) => (
              <GlowCard key={index} theme="light" className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#DC2626] flex items-center justify-center mr-4 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <p className="text-black/60 text-lg">{feature}</p>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits — DARK */}
      <section id="benefits" data-theme="dark" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center text-white">
            Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.benefits.map((benefit, index) => (
              <GlowCard key={index} className="p-6">
                <p className="text-white/70 text-lg">{benefit}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases — LIGHT */}
      <section id="use-cases" data-theme="light" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center text-[#111111]">
            Use Cases
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {service.useCases.map((useCase, index) => (
              <GlowCard key={index} theme="light" className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-[#DC2626] font-bold text-xl mr-4">
                    {index + 1}.
                  </div>
                  <p className="text-black/60 text-lg">{useCase}</p>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — DARK */}
      <section data-theme="dark" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl mb-6 text-white">
            Ready to Begin?
          </h2>
          <p className="text-lg text-white/50 mb-8">
            Let&apos;s discuss how {service.title.toLowerCase()} can elevate your business.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 px-10 py-4 border border-white/20 rounded-full text-sm uppercase tracking-widest text-white/80 hover:text-white hover:border-white/40 transition-all duration-500"
          >
            Start a Conversation
          </Link>
        </div>
      </section>
    </div>
  );
}
