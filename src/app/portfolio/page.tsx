"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import TechBackground from "@/components/TechBackground";
import { useHeroAnimations } from "@/hooks/useHeroAnimations";
import GeometricShapes from "@/components/hero-backgrounds/GeometricShapes";
import HeroCTA from "@/components/HeroCTA";

interface PortfolioItem {
  id: number;
  title: string;
  subtitle: string;
  industry: string;
  description: string;
  backgroundImage?: string;
  backgroundColor: string;
  isConcept?: boolean;
  technologies?: string[];
  heroImage?: string;
  screenshot?: string;
  projectDetails?: string;
  hidden?: boolean;
  interactiveDemo?: string;
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
    backgroundColor: "#000000",
    backgroundImage: "url(/assets/casino-ss-portfolio.jpg)",
    technologies: ["React", "Node.js", "PostgreSQL", "AWS", "WebRTC"],
    heroImage: "url(/assets/casino-ss-portfolio.jpg)",
    hidden: true,
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
    backgroundColor: "#1F2937",
    backgroundImage: "url(/assets/law-ss-portfolio.jpg)",
    technologies: ["Next.js", "TypeScript", "MongoDB", "Stripe", "Vercel"],
    heroImage: "url(/assets/law-ss-portfolio.jpg)",
    screenshot: "/assets/sylvester-screenshot.png",
    projectDetails: "We overhauled their website, creating a simple informational page that effectively communicates their legal services and expertise.",
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
    backgroundColor: "#FFFFFF",
    backgroundImage: "url(/assets/mex-taco-ss-portfolio.webp)",
    technologies: ["React Native", "Node.js", "Firebase", "Stripe", "AWS"],
    heroImage: "url(/assets/mex-taco-ss-portfolio.webp)",
    screenshot: "/assets/mex-taco-screenshot.png",
    projectDetails: "We completed a full website overhaul, integrated Uber Eats and Grubhub so that customers can order from their website. Added analytics tracking to see the value of the website and usage.",
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
    backgroundColor: "#DC2626",
    backgroundImage: "url(/assets/angels-churros-ss-portfolio.webp)",
    technologies: ["Next.js", "Shopify", "Stripe", "Vercel", "Sanity CMS"],
    heroImage: "url(/assets/angels-churros-ss-portfolio.webp)",
    screenshot: "/assets/angels-screenshot.png",
    projectDetails: "We completed a full website overhaul consistent with their branding. We integrated their social media and their POS so that customers can order from the website and their store directly.",
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
    backgroundColor: "#1F2937",
    backgroundImage: "url(/assets/finance-ss-portfolio.jpg)",
    isConcept: true,
    technologies: ["React", "Node.js", "AWS", "TensorFlow", "PostgreSQL"],
    heroImage: "url(/assets/finance-ss-portfolio.jpg)",
    hidden: false,
    interactiveDemo: "/financeflo-dashboard.html",
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
    backgroundColor: "#000000",
    backgroundImage: "url(/assets/doctors-office-ss-portfolio.jpg)",
    isConcept: true,
    technologies: ["Next.js", "Python", "Azure Health", "MongoDB", "Twilio"],
    heroImage: "url(/assets/doctors-office-ss-portfolio.jpg)",
    hidden: true,
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
    backgroundColor: "#DC2626",
    backgroundImage: "url(/assets/logistics-ss-portfolio.jpg)",
    isConcept: true,
    technologies: ["Vue.js", "Go", "AWS IoT", "Redis", "PostgreSQL"],
    heroImage: "url(/assets/logistics-ss-portfolio.jpg)",
    hidden: true,
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
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const { sectionRef, parallaxStyle, scrollStyle } = useHeroAnimations();

  const visibleItems = portfolioItems.filter(item => !item.hidden);

  const openModal = (item: PortfolioItem) => {
    const index = visibleItems.findIndex((p) => p.id === item.id);
    setSelectedIndex(index);
    setSelectedItem(item);
    setIframeLoaded(false); // Reset iframe loaded state when opening modal
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setSelectedItem(null);
    document.body.style.overflow = "unset";
  };

  const navigateModal = (direction: "prev" | "next") => {
    let newIndex = selectedIndex;
    if (direction === "next") {
      newIndex = (selectedIndex + 1) % visibleItems.length;
    } else {
      newIndex = selectedIndex - 1;
      if (newIndex < 0) newIndex = visibleItems.length - 1;
    }
    setSelectedIndex(newIndex);
    setSelectedItem(visibleItems[newIndex]);
  };

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
          <div className="hero-content">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight hero-headline">
              Fresh Perspectives. Modern Solutions.
            </h1>
            <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto mb-8 hero-subheadline">
              See how we're applying cutting-edge AI and modern development practices to solve real business challenges.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <HeroCTA href="/contact" variant="primary" className="cta-button">
                Start Your Project
              </HeroCTA>
              <HeroCTA href="#portfolio-grid" variant="secondary" className="cta-button">
                Explore Our Work
              </HeroCTA>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Grid - Fingent Style */}
      <section id="portfolio-grid" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                onClick={() => openModal(item)}
                className="portfolio-item group relative aspect-square overflow-hidden cursor-pointer rounded-lg"
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110"
                  style={{
                    background: item.backgroundImage || item.backgroundColor,
                    backgroundSize: item.backgroundImage?.startsWith('url') ? 'cover' : undefined,
                    backgroundPosition: item.backgroundImage?.startsWith('url') ? 'center' : undefined,
                    backgroundRepeat: item.backgroundImage?.startsWith('url') ? 'no-repeat' : undefined,
                  }}
                >
                  {/* Abstract pattern overlay for texture */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                      backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(220,38,38,0.1) 0%, transparent 50%)",
                    }}></div>
                  </div>
                </div>

                {/* Overlay Gradient - Darker at bottom for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40 group-hover:from-black/95 group-hover:via-black/70 group-hover:to-black/50 transition-opacity duration-500"></div>

                {/* Category Badge - Top Left */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wider rounded">
                    {item.industry}
                  </span>
                </div>

                {/* Concept Badge - Top Right */}
                {item.isConcept && (
                  <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-[#DC2626]/90 backdrop-blur-sm text-white text-[10px] font-semibold rounded">
                    Concept
                  </div>
                )}

                {/* Content Container - Bottom Aligned */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-5">
                  {/* Short Description - Bottom */}
                  <div className="transform group-hover:translate-y-0 translate-y-0 transition-transform duration-500">
                    <h3 className="text-sm md:text-base font-semibold text-white leading-tight mb-1 line-clamp-2" style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      letterSpacing: '-0.01em',
                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
                    }}>
                      {item.subtitle || item.description.split('.')[0]}
                    </h3>
                  </div>
                </div>
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

            {/* Screenshot or Hero Image */}
            {selectedItem.screenshot ? (
              <div className="w-full relative bg-gray-100">
                <div className="relative w-full" style={{ aspectRatio: '16/9', minHeight: '400px' }}>
                  <Image
                    src={selectedItem.screenshot}
                    alt={`${selectedItem.title} website screenshot`}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>
            ) : (
              <div
                className="h-64 md:h-96 w-full relative"
                style={{
                  background: selectedItem.heroImage || selectedItem.backgroundImage || selectedItem.backgroundColor,
                  backgroundSize: (selectedItem.heroImage || selectedItem.backgroundImage)?.startsWith('url') ? 'cover' : undefined,
                  backgroundPosition: (selectedItem.heroImage || selectedItem.backgroundImage)?.startsWith('url') ? 'center' : undefined,
                  backgroundRepeat: (selectedItem.heroImage || selectedItem.backgroundImage)?.startsWith('url') ? 'no-repeat' : undefined,
                }}
              >
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight px-4 text-center" style={{
                    fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", "Fira Code", "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
                    letterSpacing: '-0.02em',
                    textShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                  }}>
                    {selectedItem.title}
                  </h2>
                </div>
              </div>
            )}

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

              {/* Interactive Demo */}
              {selectedItem.interactiveDemo && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h3 className="text-2xl font-bold mb-4 text-black">Interactive Dashboard</h3>
                  <p className="text-[#6B7280] mb-4 leading-relaxed">
                    Explore the FinanceFlow dashboard below. Navigate through different views, interact with charts, and experience the AI-powered features.
                  </p>
                  <div className="w-full rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg bg-gray-100 relative" style={{ minHeight: '800px' }}>
                    {!iframeLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#DC2626] mb-4"></div>
                          <p className="text-gray-600">Loading dashboard...</p>
                        </div>
                      </div>
                    )}
                    <iframe
                      src={selectedItem.interactiveDemo}
                      className="w-full"
                      style={{ height: '800px', border: 'none', opacity: iframeLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
                      title={`${selectedItem.title} Interactive Dashboard`}
                      allow="fullscreen"
                      loading="lazy"
                      onLoad={() => setIframeLoaded(true)}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                    />
                  </div>
                </div>
              )}

              {/* Project Details */}
              {selectedItem.projectDetails && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h3 className="text-2xl font-bold mb-4 text-black">What We Completed</h3>
                  <p className="text-[#6B7280] leading-relaxed text-lg">
                    {selectedItem.projectDetails}
                  </p>
                </div>
              )}

              {/* Technologies */}
              {selectedItem.technologies && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 text-black">Technology Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="group transition-all duration-500 ease-out cursor-default overflow-hidden rounded-full px-4 py-2 relative shadow-2xl backdrop-blur-xl bg-gradient-to-br from-[#DC2626]/40 via-black/60 to-black/80 border-[#DC2626]/30 border-2 text-sm font-medium text-white hover:shadow-[#DC2626]/30 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 hover:border-[#DC2626]/60"
                      >
                        {/* Gradient Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#DC2626]/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-0"></div>
                        
                        {/* Hover Overlay */}
                        <div className="group-hover:opacity-100 transition-opacity duration-500 rounded-2xl absolute top-0 right-0 bottom-0 left-0 z-0 bg-gradient-to-r from-[#DC2626]/10 via-[#DC2626]/20 to-[#DC2626]/10 opacity-0"></div>

                        {/* Content */}
                        <span className="relative z-10 group-hover:text-white transition-colors duration-300 drop-shadow-sm">
                          {tech}
                        </span>
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
                <div className="testimonial mb-8 p-8 bg-[#F3F4F6] rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="quote-mark text-4xl text-[#DC2626] font-serif">"</div>
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
                    {selectedIndex + 1} / {visibleItems.length}
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
