import ServiceCard from "@/components/ServiceCard";
import Link from "next/link";
import {
  Smartphone,
  Globe,
  Layers,
  Users,
  Brain,
  Building2,
  Layout,
  Zap,
} from "lucide-react";

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
    title: "Staff Augmentation",
    description: "Expert developers to augment your team and accelerate delivery.",
    icon: <Users className="w-8 h-8" />,
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
    title: "Integrations and API Workflows",
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
  {
    step: "Discovery",
    description: "Understanding your business needs, goals, and technical requirements.",
  },
  {
    step: "Planning",
    description: "Creating detailed project plans, architecture, and timelines.",
  },
  {
    step: "Development",
    description: "Building your solution with clean, maintainable, and scalable code.",
  },
  {
    step: "Testing",
    description: "Comprehensive testing to ensure quality and reliability.",
  },
  {
    step: "Deployment",
    description: "Smooth deployment and ongoing support for your solution.",
  },
];

export default function WhatWeDo() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            What We Do
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            We provide structured, reliable, and scalable solutions that support
            long-term growth for businesses across multiple industries.
          </p>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center text-black">
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
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center text-black">
            Technologies Used
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {technologies.map((tech, index) => (
              <div
                key={index}
                className="px-6 py-3 bg-white border border-gray-200 rounded-lg text-lg font-medium text-black"
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Overview */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center text-black">
            Our Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {processSteps.map((item, index) => (
              <div
                key={index}
                className="p-6 border border-gray-200 rounded-lg bg-white"
              >
                <div className="text-2xl font-bold text-[#DC2626] mb-2">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-black">
                  {item.step}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Let's discuss how we can help transform your business.
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

