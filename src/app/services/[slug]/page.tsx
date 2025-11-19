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
import type { Metadata } from "next";
import ServiceNavigation from "@/components/ServiceNavigation";

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

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return SERVICES.map((service) => ({
    slug: service.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);

  if (!service) {
    return {
      title: "Service Not Found",
    };
  }

  return {
    title: `${service.title} | Smart Scale`,
    description: service.shortDescription,
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);

  if (!service) {
    notFound();
  }

  const icon = iconMap[service.slug];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center">
            {icon && (
              <div className="mb-8 flex justify-center items-center">
                <div className="w-24 h-24 rounded-full bg-[#DC2626] flex items-center justify-center text-white shadow-lg p-6">
                  <div className="flex items-center justify-center w-full h-full">
                    {icon}
                  </div>
                </div>
              </div>
            )}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              {service.title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl">
              {service.shortDescription}
            </p>
          </div>
        </div>
      </section>

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

