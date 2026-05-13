import IndustryCard from "@/components/IndustryCard";
import SectionHeading from "@/components/ui/SectionHeading";
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
    name: "Real Estate",
    description: "Property management and client relationship tools.",
    icon: <Home className="w-7 h-7" />,
  },
  {
    name: "Insurance",
    description: "Claims processing and policy management systems.",
    icon: <Shield className="w-7 h-7" />,
  },
  {
    name: "Non-Profits",
    description: "Donor management and fundraising platforms.",
    icon: <HeartHandshake className="w-7 h-7" />,
  },
  {
    name: "Beauty & Aesthetics",
    description: "Appointment booking and client management systems.",
    icon: <Scissors className="w-7 h-7" />,
  },
];

export default function IndustriesWeServe() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#111111]">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          title="Industry Expertise"
          subtitle="Proven solutions across diverse industries. Enterprise quality, boutique service."
        />
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
