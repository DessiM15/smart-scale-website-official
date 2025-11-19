"use client";

import IndustryCard from "@/components/IndustryCard";
import Link from "next/link";
import {
  Scale,
  UtensilsCrossed,
  Hotel,
  Heart,
  TrendingUp,
  Wrench,
  Home,
  Shield,
  HeartHandshake,
  Scissors,
} from "lucide-react";
import TechBackground from "@/components/TechBackground";
import { useHeroAnimations } from "@/hooks/useHeroAnimations";
import GeometricShapes from "@/components/hero-backgrounds/GeometricShapes";
import HeroCTA from "@/components/HeroCTA";
import ScrollIndicator from "@/components/hero-backgrounds/ScrollIndicator";

const industries = [
  {
    name: "Law Firms",
    description: "Legal practice management and case tracking solutions.",
    icon: <Scale className="w-7 h-7" />,
  },
  {
    name: "Restaurants",
    description: "POS systems, online ordering, and restaurant management tools.",
    icon: <UtensilsCrossed className="w-7 h-7" />,
  },
  {
    name: "Hospitality",
    description: "Booking systems and guest management platforms.",
    icon: <Hotel className="w-7 h-7" />,
  },
  {
    name: "Medical Practices",
    description: "Patient management and healthcare workflow automation.",
    icon: <Heart className="w-7 h-7" />,
  },
  {
    name: "Financial Services",
    description: "Secure financial platforms and transaction processing systems.",
    icon: <TrendingUp className="w-7 h-7" />,
  },
  {
    name: "Home Services",
    description: "HVAC, roofing, plumbing, and service scheduling solutions.",
    icon: <Wrench className="w-7 h-7" />,
  },
  {
    name: "Real Estate Professionals",
    description: "Property management and client relationship tools.",
    icon: <Home className="w-7 h-7" />,
  },
  {
    name: "Insurance",
    description: "Claims processing and policy management systems.",
    icon: <Shield className="w-7 h-7" />,
  },
  {
    name: "Non-Profits and Charity Organizations",
    description: "Donor management and fundraising platforms.",
    icon: <HeartHandshake className="w-7 h-7" />,
  },
  {
    name: "Beauty, Aesthetics, and Salon Industry",
    description: "Appointment booking and client management systems.",
    icon: <Scissors className="w-7 h-7" />,
  },
];

export default function Industries() {
  const { sectionRef, parallaxStyle, scrollStyle } = useHeroAnimations();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section 
        ref={sectionRef}
        className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-black text-white relative overflow-hidden min-h-[60vh] flex items-center"
        style={scrollStyle}
      >
        <TechBackground />
        <GeometricShapes />
        <div className="max-w-7xl mx-auto text-center relative z-10" style={parallaxStyle}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight hero-headline">
            Every Industry Deserves Modern Technology
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto mb-8 hero-subheadline">
            From casino training apps to law firm websites, we bring fresh perspectives to established industries.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <HeroCTA href="/contact" variant="primary">
              Discuss Your Industry
            </HeroCTA>
            <HeroCTA href="/what-we-do" variant="secondary">
              See Our Approach
            </HeroCTA>
          </div>
        </div>
      </section>
      <ScrollIndicator />

      {/* Industries Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-black">
              Industry Expertise
            </h2>
            <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
              Proven solutions across diverse industries. Enterprise quality, boutique service.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {industries.map((industry, index) => (
              <IndustryCard
                key={index}
                name={industry.name}
                description={industry.description}
                icon={industry.icon}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Modernize Your Industry?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Let's discuss how we can bring fresh technology to your established business.
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

