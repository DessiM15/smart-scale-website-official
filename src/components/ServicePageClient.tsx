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
import TechBackground from "@/components/TechBackground";
import { useHeroAnimations } from "@/hooks/useHeroAnimations";
import CodeSnippets from "@/components/hero-backgrounds/CodeSnippets";
import HeroCTA from "@/components/HeroCTA";
import ScrollIndicator from "@/components/hero-backgrounds/ScrollIndicator";

// Icon mapping for services
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
  const { sectionRef, parallaxStyle, scrollStyle } = useHeroAnimations();

  if (!service) {
    notFound();
  }

  const icon = iconMap[service.slug];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section 
        ref={sectionRef}
        className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-black text-white relative overflow-hidden min-h-[60vh] flex items-center"
        style={scrollStyle}
      >
        <TechBackground />
        <CodeSnippets />
        <div className="max-w-7xl mx-auto relative z-10" style={parallaxStyle}>
          <div className="flex flex-col items-center text-center">
            {icon && (
              <div className="mb-8 flex justify-center items-center hero-headline">
                <div className="w-24 h-24 rounded-full bg-[#DC2626] flex items-center justify-center text-white shadow-lg p-6">
                  <div className="flex items-center justify-center w-full h-full">
                    {icon}
                  </div>
                </div>
              </div>
            )}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight hero-headline">
              {service.title}: Built with AI-Powered Speed
            </h1>
            <p className="text-lg sm:text-xl text-white/70 max-w-3xl mb-8 hero-subheadline">
              See how we deliver {service.title.toLowerCase()} using modern development practices and AI acceleration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <HeroCTA href="/contact" variant="primary">
                Build Something Similar
              </HeroCTA>
              <HeroCTA href="/portfolio" variant="secondary">
                View Next Project
              </HeroCTA>
            </div>
          </div>
        </div>
      </section>
      <ScrollIndicator />

      {/* Extended Description */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-lg text-gray-700 leading-relaxed">
            {service.extendedDescription}
          </p>
        </div>
      </section>

      {/* Navigation Buttons */}
      <ServiceNavigation />

      {/* Key Features */}
      <section id="key-features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center text-black">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {service.keyFeatures.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#DC2626] flex items-center justify-center mr-4 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <p className="text-gray-700 text-lg">{feature}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center text-black">
            Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.benefits.map((benefit, index) => (
              <div
                key={index}
                className="p-6 bg-gray-50 rounded-lg border border-gray-200"
              >
                <p className="text-gray-700 text-lg">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center text-black">
            Use Cases
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {service.useCases.map((useCase, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-[#DC2626] font-bold text-xl mr-4">
                    {index + 1}.
                  </div>
                  <p className="text-gray-700 text-lg">{useCase}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Let's discuss how {service.title.toLowerCase()} can transform your business.
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

