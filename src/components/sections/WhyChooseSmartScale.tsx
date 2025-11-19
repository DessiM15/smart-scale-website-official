"use client";

import { useEffect, useRef, useState } from "react";
import { Zap, Brain, Handshake } from "lucide-react";

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
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const animationStartedRef = useRef(false);

  useEffect(() => {
    const animateCounters = () => {
      // Use ref to prevent duplicate animations
      if (animationStartedRef.current) return;
      animationStartedRef.current = true;
      setHasAnimated(true);
      
      // Animate counters
      metrics.forEach((metric, index) => {
        // For "check" type, don't animate - just set to 1 immediately
        if (metric.type === "check") {
          setCounters((prev) => {
            const newCounters = [...prev];
            newCounters[index] = 1;
            return newCounters;
          });
          return;
        }

        const duration = 2000; // 2 seconds
        const steps = 60;
        const increment = metric.value / steps;
        const stepDuration = duration / steps;
        
        let currentStep = 0;
        const timer = setInterval(() => {
          currentStep++;
          setCounters((prev) => {
            const newCounters = [...prev];
            const newValue = Math.min(
              increment * currentStep,
              metric.value
            );
            newCounters[index] = newValue;
            return newCounters;
          });
          
          if (currentStep >= steps) {
            clearInterval(timer);
          }
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
    
    // Check if section is already visible (for SSR/hydration issues)
    if (currentSection) {
      const rect = currentSection.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (isVisible && !animationStartedRef.current) {
        // Small delay to ensure component is fully mounted
        setTimeout(animateCounters, 100);
      } else {
        observer.observe(currentSection);
      }
    }

    return () => {
      if (currentSection) {
        observer.unobserve(currentSection);
      }
      // Cleanup all timers
      timersRef.current.forEach(timer => clearInterval(timer));
      timersRef.current = [];
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-black">
            Why Choose Smart Scale
          </h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            The perfect balance of speed, intelligence, and reliability. Enterprise quality without the enterprise overhead.
          </p>
        </div>

        {/* 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {advantages.map((advantage, index) => (
            <div
              key={index}
              className="group relative p-8 bg-[#F3F4F6] rounded-lg hover:bg-black transition-all duration-300 hover:shadow-2xl"
            >
              {/* Geometric accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#DC2626]/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                {/* Icon Circle */}
                <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DC2626] text-white group-hover:scale-110 transition-transform duration-300">
                  {advantage.icon}
                </div>
                
                <h3 className="text-2xl font-bold mb-6 text-black group-hover:text-white transition-colors duration-300">
                  {advantage.title}
                </h3>
                
                <ul className="space-y-3">
                  {advantage.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-[#6B7280] group-hover:text-white/80 transition-colors duration-300"
                    >
                      <span className="text-[#DC2626] group-hover:text-white font-bold mt-1 transition-colors duration-300">
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Metrics Bar */}
        <div className="bg-black rounded-lg p-8 md:p-12 relative overflow-hidden">
          {/* Background accent */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {metrics.map((metric, index) => (
                <div
                  key={index}
                  className="text-center group hover:scale-105 transition-transform duration-300"
                >
                  <div className="mb-2">
                    <span className="text-4xl md:text-5xl font-bold text-white">
                      {metric.type === "check" 
                        ? "Always"
                        : metric.suffix === "%"
                        ? `${Math.round(counters[index])}${metric.suffix}`
                        : `${Math.round(counters[index])}${metric.suffix}`
                      }
                    </span>
                  </div>
                  <p className="text-white/70 text-sm md:text-base font-medium">
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

