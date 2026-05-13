"use client";

import { useEffect, useRef, useState } from "react";
import { Zap, Brain, Handshake } from "lucide-react";
import GlowCard from "@/components/ui/GlowCard";
import SectionHeading from "@/components/ui/SectionHeading";

const advantages = [
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Faster Than Agencies",
    features: [
      "7-day MVP guarantee",
      "Direct founder communication",
      "No bureaucracy or red tape",
    ],
  },
  {
    icon: <Brain className="w-8 h-8" />,
    title: "Smarter Than Freelancers",
    features: [
      "AI-accelerated development",
      "Enterprise-grade security",
      "Scalable architecture",
    ],
  },
  {
    icon: <Handshake className="w-8 h-8" />,
    title: "Better Than Offshore",
    features: [
      "Texas-based team",
      "Same timezone collaboration",
      "Protected IP & full NDA",
    ],
  },
];

const metrics = [
  { label: "2-Week Average Delivery", value: 2, suffix: " Weeks", type: "number" },
  { label: "100% On-Time Delivery", value: 100, suffix: "%", type: "number" },
  { label: "24-Hour Response Time", value: 24, suffix: " Hours", type: "number" },
  { label: "Direct Founder Access", value: 1, suffix: "", type: "check" },
];

export default function WhyChooseSmartScale() {
  const [counters, setCounters] = useState(metrics.map(() => 0));
  const sectionRef = useRef<HTMLElement>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const animationStartedRef = useRef(false);

  useEffect(() => {
    const animateCounters = () => {
      if (animationStartedRef.current) return;
      animationStartedRef.current = true;

      metrics.forEach((metric, index) => {
        if (metric.type === "check") {
          setCounters((prev) => {
            const n = [...prev];
            n[index] = 1;
            return n;
          });
          return;
        }

        const duration = 2000;
        const steps = 60;
        const increment = metric.value / steps;
        const stepDuration = duration / steps;

        let currentStep = 0;
        const timer = setInterval(() => {
          currentStep++;
          setCounters((prev) => {
            const n = [...prev];
            n[index] = Math.min(increment * currentStep, metric.value);
            return n;
          });
          if (currentStep >= steps) clearInterval(timer);
        }, stepDuration);
        timersRef.current.push(timer);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animationStartedRef.current) {
            animateCounters();
          }
        });
      },
      { threshold: 0.3 }
    );

    const currentSection = sectionRef.current;
    if (currentSection) {
      const rect = currentSection.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (isVisible && !animationStartedRef.current) {
        setTimeout(animateCounters, 100);
      } else {
        observer.observe(currentSection);
      }
    }

    return () => {
      if (currentSection) observer.unobserve(currentSection);
      timersRef.current.forEach((timer) => clearInterval(timer));
      timersRef.current = [];
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-[#111111]">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          title="Why Choose Smart Scale"
          subtitle="The perfect balance of speed, intelligence, and reliability. Enterprise quality without the enterprise overhead."
        />

        {/* 3 Column Grid */}
        <div className="scroll-reveal-stagger grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {advantages.map((advantage, index) => (
            <GlowCard key={index} className="p-8">
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DC2626] text-white">
                {advantage.icon}
              </div>
              <h3 className="text-2xl font-bold mb-6 text-white">
                {advantage.title}
              </h3>
              <ul className="space-y-3">
                {advantage.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-white/60"
                  >
                    <span className="text-[#DC2626] font-bold mt-0.5">
                      &#10003;
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </GlowCard>
          ))}
        </div>

        {/* Metrics Bar */}
        <div className="rounded-3xl bg-[#161616] border border-white/[0.08] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {metrics.map((metric, index) => (
                <div key={index} className="text-center">
                  <div className="mb-2">
                    <span className="text-4xl md:text-5xl font-bold text-white">
                      {metric.type === "check"
                        ? "Always"
                        : `${Math.round(counters[index])}${metric.suffix}`}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm md:text-base font-medium">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
