import IndustryCard from "@/components/IndustryCard";
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

export default function IndustriesWeServe() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="scroll-reveal text-4xl sm:text-5xl font-bold mb-4 text-black">
            Industry Expertise
          </h2>
          <p className="scroll-reveal text-lg text-[#6B7280] max-w-2xl mx-auto">
            Proven solutions across diverse industries. Enterprise quality, boutique service.
          </p>
        </div>
        <div className="scroll-reveal-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
  );
}

