import ServiceCard from "@/components/ServiceCard";
import {
  Smartphone,
  Globe,
  Users,
  Mail,
  Building2,
  Brain,
  Layout,
  Zap,
} from "lucide-react";

const services = [
  {
    title: "Mobile Development",
    description: "Native and cross-platform mobile applications built for iOS and Android.",
    icon: <Smartphone className="w-8 h-8" />,
  },
  {
    title: "Web Development",
    description: "Modern, responsive web applications using the latest technologies.",
    icon: <Globe className="w-8 h-8" />,
  },
  {
    title: "Staff Augmentation",
    description: "Expert developers to augment your team and accelerate delivery.",
    icon: <Users className="w-8 h-8" />,
  },
  {
    title: "Email Client Development",
    description: "Custom email solutions tailored to your business needs.",
    icon: <Mail className="w-8 h-8" />,
  },
  {
    title: "Enterprise Systems",
    description: "Scalable enterprise software solutions for complex business requirements.",
    icon: <Building2 className="w-8 h-8" />,
  },
  {
    title: "AI Enhancement / AI Workflows",
    description: "Intelligent automation and AI-powered workflows to streamline operations.",
    icon: <Brain className="w-8 h-8" />,
  },
  {
    title: "Web Applications",
    description: "Full-stack web applications with robust architecture and performance.",
    icon: <Layout className="w-8 h-8" />,
  },
  {
    title: "Integrations and Automation",
    description: "Seamless integrations and automated workflows to connect your systems.",
    icon: <Zap className="w-8 h-8" />,
  },
];

export default function ServicesOverview() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl sm:text-5xl font-bold mb-12 text-center text-black">
          Services Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              title={service.title}
              description={service.description}
              icon={service.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

