"use client";

import ServiceCard from "@/components/ServiceCard";
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

// Icon mapping for services
const iconMap: Record<string, React.ReactNode> = {
  "mobile-development": <Smartphone className="w-8 h-8" />,
  "web-development": <Globe className="w-8 h-8" />,
  "email-client-development": <Mail className="w-8 h-8" />,
  "enterprise-systems": <Building2 className="w-8 h-8" />,
  "ai-enhancement-ai-workflows": <Brain className="w-8 h-8" />,
  "web-applications": <Layout className="w-8 h-8" />,
  "integrations-and-automation": <Zap className="w-8 h-8" />,
};

export default function ServicesOverview() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="scroll-reveal text-4xl sm:text-5xl font-bold mb-16 text-center text-black">
          Services Overview
        </h2>
        <div className="scroll-reveal-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {SERVICES.map((service) => (
            <ServiceCard
              key={service.slug}
              title={service.title}
              description={service.shortDescription}
              icon={iconMap[service.slug]}
              slug={service.slug}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

