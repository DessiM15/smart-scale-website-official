"use client";

import {
  Globe,
  Smartphone,
  Brain,
  Building2,
  Zap,
  Compass,
} from "lucide-react";

const capabilities = [
  {
    title: "Web Applications",
    description:
      "Full-stack platforms built for performance, security, and scale.",
    icon: Globe,
  },
  {
    title: "Mobile",
    description:
      "Native and cross-platform apps that deliver seamless experiences.",
    icon: Smartphone,
  },
  {
    title: "AI Systems",
    description:
      "Intelligent automation, NLP, and machine learning solutions.",
    icon: Brain,
  },
  {
    title: "Enterprise Platforms",
    description:
      "Mission-critical systems engineered for reliability at scale.",
    icon: Building2,
  },
  {
    title: "Integrations",
    description:
      "Seamless API connections and automated data workflows.",
    icon: Zap,
  },
  {
    title: "Digital Strategy",
    description:
      "Technical architecture and roadmap consulting for growth.",
    icon: Compass,
  },
];

export default function Capabilities() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-[#0F0F0F]">
      <div className="max-w-7xl mx-auto">
        <h2
          className="text-4xl sm:text-5xl md:text-6xl text-white text-center mb-4"
          data-animate="fade-up"
        >
          Capabilities
        </h2>
        <p
          className="text-center text-white/50 text-lg mb-20 max-w-2xl mx-auto"
          data-animate="fade-up"
        >
          End-to-end engineering for businesses that demand excellence.
        </p>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          data-animate="stagger"
        >
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="group p-8 rounded-2xl bg-[#161616] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-400"
              >
                <Icon className="w-6 h-6 text-white/40 mb-6 group-hover:text-white/70 transition-colors duration-300" />
                <h3 className="text-xl text-white mb-3">{cap.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">
                  {cap.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
