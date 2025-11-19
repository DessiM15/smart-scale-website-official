"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

interface PortfolioItem {
  id: number;
  title: string;
  subtitle: string;
  industry: string;
  description: string;
  logo?: string;
  logoType: "image" | "text";
  backgroundImage?: string;
  backgroundColor: string;
  isConcept?: boolean;
  technologies?: string[];
  heroImage?: string;
  caseStudy?: {
    challenge: string;
    solution: string;
    results: string[];
    testimonial?: {
      quote: string;
      author: string;
      role: string;
    };
  };
}

const portfolioItems: PortfolioItem[] = [
  {
    id: 1,
    title: "DealerPro",
    subtitle: "Casino Training Platform",
    industry: "ENTERPRISE SYSTEMS",
    description: "Comprehensive training and certification platform for casino dealers with real-time progress tracking and automated assessments.",
    logoType: "text" as const,
    backgroundColor: "#000000",
    backgroundImage: "linear-gradient(135deg, #1F2937 0%, #000000 100%)",
    technologies: ["React", "Node.js", "PostgreSQL", "AWS", "WebRTC"],
    heroImage: "linear-gradient(135deg, #1F2937 0%, #000000 100%)",
    caseStudy: {
      challenge: "Casino training programs required manual tracking, inconsistent certification processes, and lacked real-time performance analytics.",
      solution: "Built a comprehensive training platform with automated certification workflows, real-time progress tracking, interactive video lessons, and AI-powered assessment tools.",
      results: [
        "90% reduction in certification processing time",
        "Real-time analytics dashboard for training managers",
        "Interactive video training with progress tracking",
        "Automated compliance and certification workflows",
      ],
      testimonial: {
        quote: "DealerPro transformed our training operations. The platform is intuitive, comprehensive, and has significantly improved our certification efficiency.",
        author: "Training Director",
        role: "Major Casino Group",
      },
    },
  },
  {
    id: 2,
    title: "Law Office of Sylvester R. Jaime",
    subtitle: "Legal Services Website",
    industry: "LEGAL",
    description: "Modern legal practice website with case management integration, client portal, and streamlined communication workflows.",
    logoType: "text" as const,
    backgroundColor: "#1F2937",
    backgroundImage: "linear-gradient(135deg, #1F2937 0%, #000000 100%)",
    technologies: ["Next.js", "TypeScript", "MongoDB", "Stripe", "Vercel"],
    heroImage: "linear-gradient(135deg, #1F2937 0%, #000000 100%)",
    caseStudy: {
      challenge: "Streamline case management and client communication for a growing legal practice while maintaining professional online presence.",
      solution: "Developed a custom practice management system with case tracking, document management, client portal, and integrated website with modern design.",
      results: [
        "40% improvement in case organization efficiency",
        "Automated client communication workflows",
        "Secure document management system",
        "Increased client engagement through portal access",
      ],
    },
  },
  {
    id: 3,
    title: "Mex Taco House",
    subtitle: "Restaurant Digital Presence",
    industry: "FOOD SERVICE",
    description: "Complete digital transformation including online ordering, POS integration, and delivery management for a growing restaurant chain.",
    logo: "/assets/mex-taco-logo-ss.jpg",
    logoType: "image" as const,
    backgroundColor: "#FFFFFF",
    backgroundImage: "linear-gradient(135deg, #F3F4F6 0%, #FFFFFF 100%)",
    technologies: ["React Native", "Node.js", "Firebase", "Stripe", "AWS"],
    heroImage: "linear-gradient(135deg, #F3F4F6 0%, #FFFFFF 100%)",
    caseStudy: {
      challenge: "Modernize ordering system and streamline restaurant operations across multiple locations with integrated payment and delivery tracking.",
      solution: "Built a mobile-first ordering platform with POS integration, real-time kitchen management, delivery tracking, and comprehensive analytics dashboard.",
      results: [
        "30% increase in online orders within first quarter",
        "Reduced order processing time by 25%",
        "Integrated payment and delivery systems",
        "Real-time inventory and kitchen management",
      ],
      testimonial: {
        quote: "The new system has revolutionized our operations. Orders flow seamlessly from customer to kitchen to delivery, and our team loves the intuitive interface.",
        author: "Operations Manager",
        role: "Mex Taco House",
      },
    },
  },
  {
    id: 4,
    title: "Angels Churros N Chocolate",
    subtitle: "Houston's First Churrería",
    industry: "FOOD SERVICE",
    description: "E-commerce platform and ordering system for Houston's premier churrería, featuring custom ordering flows and inventory management.",
    logo: "/assets/angels-churros-logo-ss.webp",
    logoType: "image" as const,
    backgroundColor: "#DC2626",
    backgroundImage: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
    technologies: ["Next.js", "Shopify", "Stripe", "Vercel", "Sanity CMS"],
    heroImage: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
    caseStudy: {
      challenge: "Launch an online presence with e-commerce capabilities for a specialty dessert business, integrating online ordering with in-store operations.",
      solution: "Created a beautiful e-commerce platform with custom ordering system, inventory management, seamless payment processing, and mobile-optimized experience.",
      results: [
        "Launched in 7 days from concept to production",
        "Integrated online ordering with in-store pickup",
        "Mobile-optimized for maximum conversions",
        "Real-time inventory synchronization",
      ],
      testimonial: {
        quote: "Smart Scale delivered exactly what we needed in record time. The platform is beautiful, easy to use, and has significantly increased our online orders.",
        author: "Founder",
        role: "Angels Churros N Chocolate",
      },
    },
  },
  {
    id: 5,
    title: "FinanceFlow",
    subtitle: "Enterprise Financial Dashboard",
    industry: "FINANCE",
    description: "AI-powered financial analytics platform with real-time reporting, predictive insights, and comprehensive data visualization across 50+ accounts.",
    logoType: "text" as const,
    backgroundColor: "#1F2937",
    backgroundImage: "linear-gradient(135deg, #1F2937 0%, #000000 100%)",
    isConcept: true,
    technologies: ["React", "Node.js", "AWS", "TensorFlow", "PostgreSQL"],
    heroImage: "linear-gradient(135deg, #1F2937 0%, #000000 100%)",
    caseStudy: {
      challenge: "Enterprise needed real-time financial monitoring across 50+ accounts with manual reporting processes causing delays and errors in decision-making.",
      solution: "AI-powered dashboard with predictive analytics and automated reporting, featuring real-time data integration, machine learning models for forecasting, and customizable KPI visualization with dark theme and red accent highlights.",
      results: [
        "Conceptual: 60% reduction in report generation time",
        "Real-time monitoring across 50+ financial accounts",
        "AI-powered predictive analytics for financial forecasting",
        "Automated report generation with customizable dashboards",
        "Dark theme interface with red accent highlights for key metrics",
      ],
    },
  },
  {
    id: 6,
    title: "MediCare+",
    subtitle: "Patient Portal System",
    industry: "HEALTHCARE",
    description: "HIPAA-compliant patient portal with telemedicine, scheduling, and billing integration for seamless healthcare management.",
    logoType: "text" as const,
    backgroundColor: "#000000",
    backgroundImage: "linear-gradient(135deg, #000000 0%, #1F2937 100%)",
    isConcept: true,
    technologies: ["Next.js", "Python", "Azure Health", "MongoDB", "Twilio"],
    heroImage: "linear-gradient(135deg, #000000 0%, #1F2937 100%)",
    caseStudy: {
      challenge: "Medical practice needed HIPAA-compliant patient management with integrated telemedicine, appointment scheduling, and billing workflows to improve patient experience and operational efficiency.",
      solution: "Secure portal with telemedicine integration, intelligent appointment scheduling system, automated billing workflows, and clean medical interface featuring appointment calendar and comprehensive patient dashboard with real-time access to medical records.",
      results: [
        "Conceptual: 40% improvement in patient satisfaction scores",
        "HIPAA-compliant secure architecture with end-to-end encryption",
        "Integrated telemedicine capabilities with Twilio video",
        "Streamlined appointment scheduling with automated reminders",
        "Clean medical interface with appointment calendar and patient dashboard",
      ],
    },
  },
  {
    id: 7,
    title: "Logistics Pro",
    subtitle: "Supply Chain Management",
    industry: "SUPPLY CHAIN",
    description: "IoT-integrated supply chain system with predictive restocking, route optimization, and real-time inventory tracking across multiple warehouses.",
    logoType: "text" as const,
    backgroundColor: "#DC2626",
    backgroundImage: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
    isConcept: true,
    technologies: ["Vue.js", "Go", "AWS IoT", "Redis", "PostgreSQL"],
    heroImage: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
    caseStudy: {
      challenge: "Distributor needed real-time inventory tracking across warehouses with manual processes causing stockouts, overstocking, and inefficient route planning leading to increased logistics costs.",
      solution: "IoT-integrated system with predictive restocking algorithms, intelligent route optimization, and comprehensive map interface showing real-time tracking, inventory levels across warehouses, and advanced analytics dashboard for supply chain insights.",
      results: [
        "Conceptual: 30% reduction in logistics costs",
        "Real-time inventory tracking across multiple warehouse locations",
        "IoT sensor integration for automated inventory monitoring",
        "Predictive restocking algorithms reducing stockouts by 45%",
        "Route optimization reducing delivery times by 25%",
        "Interactive map interface with live tracking and analytics",
      ],
    },
  },
];

export default function Portfolio() {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const openModal = (item: PortfolioItem) => {
    const index = portfolioItems.findIndex((p) => p.id === item.id);
    setSelectedIndex(index);
    setSelectedItem(item);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setSelectedItem(null);
    document.body.style.overflow = "unset";
  };

  const navigateModal = (direction: "prev" | "next") => {
    let newIndex = selectedIndex;
    if (direction === "next") {
      newIndex = (selectedIndex + 1) % portfolioItems.length;
    } else {
      newIndex = selectedIndex - 1;
      if (newIndex < 0) newIndex = portfolioItems.length - 1;
    }
    setSelectedIndex(newIndex);
    setSelectedItem(portfolioItems[newIndex]);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            Portfolio
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto">
            Enterprise-quality solutions across industries. Built fast. Built right.
          </p>
        </div>
      </section>

      {/* Portfolio Grid - Mercury Dev Style */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolioItems.map((item) => (
              <div
                key={item.id}
                onClick={() => openModal(item)}
                className="group relative aspect-[4/3] overflow-hidden cursor-pointer"
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 transition-transform duration-[400ms] ease-out group-hover:scale-110"
                  style={{
                    background: item.backgroundImage || item.backgroundColor,
                  }}
                >
                  {/* Abstract pattern overlay for texture */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                      backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(220,38,38,0.1) 0%, transparent 50%)",
                    }}></div>
                  </div>
                </div>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/80 transition-opacity duration-[400ms]"></div>

                {/* Content Container */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                  {/* Logo/Icon - Moves up and scales down on hover */}
                  <div className="group-hover:-translate-y-8 group-hover:scale-75 transition-all duration-[400ms] mb-0 group-hover:mb-0">
                    {item.logoType === "image" && item.logo ? (
                      <div className="w-32 h-32 relative">
                        <Image
                          src={item.logo}
                          alt={item.title}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <h2 className="text-4xl md:text-5xl font-bold text-white">
                        {item.title}
                      </h2>
                    )}
                  </div>

                  {/* Hidden Content - Fades in on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-[400ms] mt-4 text-center w-full">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-[#DC2626] text-xs font-semibold uppercase tracking-wider mb-3">
                      {item.industry}
                    </p>
                    <p className="text-white/90 text-sm md:text-base leading-relaxed mb-4 line-clamp-2">
                      {item.description}
                    </p>
                    <span className="inline-flex items-center gap-2 text-[#DC2626] text-sm font-semibold group-hover:gap-3 transition-all">
                      View Project
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                {/* Concept Badge */}
                {item.isConcept && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-[#DC2626] text-white text-xs font-semibold rounded-full">
                    Concept
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors shadow-lg"
            >
              <X className="w-6 h-6 text-black" />
            </button>

            {/* Hero Image */}
            <div
              className="h-64 md:h-96 w-full relative"
              style={{
                background: selectedItem.heroImage || selectedItem.backgroundImage || selectedItem.backgroundColor,
              }}
            >
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                {selectedItem.logoType === "image" && selectedItem.logo ? (
                  <div className="w-48 h-48 relative">
                    <Image
                      src={selectedItem.logo}
                      alt={selectedItem.title}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <h2 className="text-5xl md:text-7xl font-bold text-white">
                    {selectedItem.title}
                  </h2>
                )}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 md:p-12">
              {/* Header Info */}
              <div className="mb-8">
                {selectedItem.isConcept && (
                  <span className="inline-block px-3 py-1 bg-[#DC2626] text-white text-sm font-semibold rounded-full mb-4">
                    Concept Design
                  </span>
                )}
                <h2 className="text-4xl md:text-5xl font-bold mb-2 text-black">
                  {selectedItem.title}
                </h2>
                <p className="text-[#DC2626] text-sm font-semibold uppercase tracking-wider mb-3">
                  {selectedItem.industry}
                </p>
                <p className="text-xl text-[#6B7280] mb-6">
                  {selectedItem.subtitle}
                </p>
              </div>

              {/* Technologies */}
              {selectedItem.technologies && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 text-black">Technology Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-[#F3F4F6] text-[#1F2937] rounded-full text-sm font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Case Study */}
              {selectedItem.caseStudy ? (
                <div className="space-y-8 mb-8">
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-black">Challenge</h3>
                    <p className="text-[#6B7280] leading-relaxed text-lg">
                      {selectedItem.caseStudy.challenge}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-black">Solution</h3>
                    <p className="text-[#6B7280] leading-relaxed text-lg">
                      {selectedItem.caseStudy.solution}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-black">Results</h3>
                    <ul className="space-y-3">
                      {selectedItem.caseStudy.results.map((result, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-[#6B7280] text-lg">
                          <span className="text-[#DC2626] font-bold mt-1">•</span>
                          <span>{result}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 mb-8">
                  <p className="text-[#6B7280] text-lg">
                    {selectedItem.isConcept
                      ? "This is a concept design showcasing our capabilities in this industry. Ready to bring your vision to life?"
                      : "Case study details coming soon."}
                  </p>
                </div>
              )}

              {/* Concept Mockup Description */}
              {selectedItem.isConcept && (
                <div className="mb-8 p-8 bg-gradient-to-br from-[#F3F4F6] to-white rounded-lg border border-gray-200">
                  <h3 className="text-2xl font-bold mb-4 text-black">Design Concept</h3>
                  {selectedItem.id === 5 && (
                    <div className="space-y-4">
                      <p className="text-[#6B7280] leading-relaxed">
                        <strong className="text-black">Dashboard Mockup:</strong> Dark theme interface with sophisticated financial charts and KPIs. 
                        Features include real-time line charts showing account balances across 50+ accounts, 
                        predictive analytics graphs with AI-powered trend forecasting, and key performance indicators 
                        highlighted in red accents. The dashboard includes customizable widgets, interactive data tables, 
                        and automated report generation panels.
                      </p>
                      <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="h-32 bg-[#1F2937] rounded-lg flex items-center justify-center">
                          <span className="text-white/50 text-xs">Chart View</span>
                        </div>
                        <div className="h-32 bg-[#1F2937] rounded-lg flex items-center justify-center border-2 border-[#DC2626]/30">
                          <span className="text-white/50 text-xs">KPI Cards</span>
                        </div>
                        <div className="h-32 bg-[#1F2937] rounded-lg flex items-center justify-center">
                          <span className="text-white/50 text-xs">Analytics</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedItem.id === 6 && (
                    <div className="space-y-4">
                      <p className="text-[#6B7280] leading-relaxed">
                        <strong className="text-black">Medical Interface Mockup:</strong> Clean, professional medical interface 
                        featuring an intuitive appointment calendar with color-coded time slots, comprehensive patient dashboard 
                        with medical history timeline, and telemedicine integration panel. The design emphasizes clarity and 
                        accessibility with large, readable fonts, clear navigation, and HIPAA-compliant security indicators. 
                        Features include patient profile cards, upcoming appointments widget, and quick access to medical records.
                      </p>
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="h-40 bg-white rounded-lg border-2 border-gray-200 flex flex-col items-center justify-center p-4">
                          <div className="w-full h-24 bg-[#F3F4F6] rounded mb-2"></div>
                          <span className="text-[#6B7280] text-xs">Appointment Calendar</span>
                        </div>
                        <div className="h-40 bg-white rounded-lg border-2 border-gray-200 flex flex-col items-center justify-center p-4">
                          <div className="w-full h-24 bg-[#F3F4F6] rounded mb-2"></div>
                          <span className="text-[#6B7280] text-xs">Patient Dashboard</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedItem.id === 7 && (
                    <div className="space-y-4">
                      <p className="text-[#6B7280] leading-relaxed">
                        <strong className="text-black">Map Interface Mockup:</strong> Interactive map interface showing 
                        real-time inventory tracking across multiple warehouse locations. Features include live vehicle 
                        tracking with route visualization, inventory level indicators for each warehouse location, 
                        and comprehensive analytics dashboard with supply chain metrics. The interface includes 
                        predictive restocking alerts, route optimization suggestions, and real-time inventory 
                        status updates with color-coded status indicators.
                      </p>
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="h-40 bg-[#F3F4F6] rounded-lg border-2 border-gray-200 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-[#DC2626]/10 to-transparent"></div>
                          <span className="text-[#6B7280] text-xs z-10">Map View</span>
                        </div>
                        <div className="h-40 bg-[#F3F4F6] rounded-lg border-2 border-gray-200 flex flex-col items-center justify-center p-4">
                          <div className="w-full h-20 bg-white rounded mb-2"></div>
                          <span className="text-[#6B7280] text-xs">Inventory Analytics</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Testimonial */}
              {selectedItem.caseStudy?.testimonial && (
                <div className="mb-8 p-8 bg-[#F3F4F6] rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl text-[#DC2626] font-serif">"</div>
                    <div className="flex-1">
                      <p className="text-lg text-[#1F2937] italic mb-4">
                        {selectedItem.caseStudy.testimonial.quote}
                      </p>
                      <div>
                        <p className="font-semibold text-black">
                          {selectedItem.caseStudy.testimonial.author}
                        </p>
                        <p className="text-sm text-[#6B7280]">
                          {selectedItem.caseStudy.testimonial.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation & CTA */}
              <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                {/* Navigation */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigateModal("prev")}
                    className="w-12 h-12 rounded-full bg-[#F3F4F6] hover:bg-[#DC2626] hover:text-white flex items-center justify-center transition-colors"
                    aria-label="Previous project"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <span className="text-sm text-[#6B7280]">
                    {selectedIndex + 1} / {portfolioItems.length}
                  </span>
                  <button
                    onClick={() => navigateModal("next")}
                    className="w-12 h-12 rounded-full bg-[#F3F4F6] hover:bg-[#DC2626] hover:text-white flex items-center justify-center transition-colors"
                    aria-label="Next project"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                {/* CTA */}
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#DC2626] text-white rounded-full font-semibold hover:bg-red-700 transition-colors"
                >
                  Start Your Project
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
