export type ServiceType = "Website" | "Landing Page" | "Platform/CRM" | "Mobile App";

export type FilterCategory = "All" | "Websites" | "Landing Pages" | "Platforms/CRM" | "Mobile Apps";

export interface Project {
  slug: string;
  title: string;
  clientName: string;
  serviceType: ServiceType;
  industry: string;
  techStack: string[];
  description: string;
  shortDescription: string;
  thumbnailImage: string;
  vercelUrl?: string;
  secondaryVercelUrl?: string;
  githubUrl: string;
  isAIPowered?: boolean;
  featured?: boolean;
  featuredOrder?: number;
  caseStudy?: {
    challenge: string;
    solution: string;
    results: string[];
  };
}

export const FILTER_CATEGORIES: FilterCategory[] = [
  "All",
  "Websites",
  "Landing Pages",
  "Platforms/CRM",
  "Mobile Apps",
];

const SERVICE_TO_FILTER: Record<ServiceType, FilterCategory> = {
  "Website": "Websites",
  "Landing Page": "Landing Pages",
  "Platform/CRM": "Platforms/CRM",
  "Mobile App": "Mobile Apps",
};

export function filterByCategory(
  projects: Project[],
  category: FilterCategory
): Project[] {
  if (category === "All") return projects;
  return projects.filter(
    (p) => SERVICE_TO_FILTER[p.serviceType] === category
  );
}

export function getFeaturedProjects(): Project[] {
  return projects
    .filter((p) => p.featured)
    .sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99));
}

export const projects: Project[] = [
  {
    slug: "bloxify",
    title: "Bloxify",
    clientName: "Bloxify",
    serviceType: "Mobile App",
    industry: "Gaming",
    techStack: ["Expo", "React Native", "TypeScript", "Supabase", "Zustand", "RevenueCat", "Google AdMob", "Skia", "Reanimated", "EAS Build & Update"],
    description:
      "Bloxify is a premium mobile block-puzzle game built around fair play — satisfying drop-and-clear gameplay, fair RNG (no rigged piece bags), and no forced ads. It pairs a relaxing core loop with a full 360-level adventure campaign, a live seasonal system, and an original soundtrack. Available on Android (Google Play), with iOS in development.",
    shortDescription: "Premium block-puzzle game — Drop. Clear. Climb.",
    thumbnailImage: "/assets/portfolio/bloxify/thumbnail.webp",
    githubUrl: "https://github.com/DessiM15/Bloxify",
    caseStudy: {
      challenge:
        "The mobile puzzle market is saturated with ad-heavy clones and rigged mechanics. Players deserved a premium block-puzzle experience with fair RNG, no forced ads, and real depth beyond endless mode.",
      solution:
        "Solo-developed a full-featured mobile game with Expo and React Native, featuring three game modes (Zen, Blitz, and a 360-level Adventure campaign across 6 themed realms with boss cinematics), server-authoritative progress via Supabase with offline sync, a monthly Season Pass subscription through RevenueCat, rewarded-ads-only monetization via Google AdMob, leaderboards and a social/friends system, daily login and streak rewards, seasonal content tied to the real-world calendar, an original soundtrack, and over-the-air updates via EAS Update.",
      results: [
        "Three game modes: Zen (endless), Blitz (timed), and Adventure (360 levels across 6 themed realms)",
        "Server-authoritative progress and rewards via Supabase (Postgres + Row-Level Security) with offline sync",
        "Rewarded-ads-only monetization — no banners, no interstitials",
        "Monthly Season Pass subscription (RevenueCat) — cosmetic and fully optional",
        "Leaderboards, social/friends system, daily login streaks, and seasonal content",
        "Original soundtrack, push notifications, in-app review prompts, and OTA updates (EAS Update)",
      ],
    },
  },
  {
    slug: "bloxify-landing",
    title: "Bloxify Landing Page",
    clientName: "Bloxify",
    serviceType: "Landing Page",
    industry: "Gaming",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "Vercel"],
    description:
      "A high-converting landing page for the Bloxify mobile game, designed to drive Google Play downloads and communicate the game's core value: fair-play block-puzzle gameplay with no forced ads.",
    shortDescription: "Landing page for the Bloxify block-puzzle game.",
    thumbnailImage: "/assets/portfolio/bloxify-landing/thumbnail.webp",
    vercelUrl: "https://bloxify.app",
    githubUrl: "https://github.com/DessiM15/bloxify-landing",
    caseStudy: {
      challenge:
        "Bloxify needed a web presence that could clearly communicate the game's differentiators — fair RNG, no forced ads, and a full adventure campaign — to mobile gamers browsing from search or social.",
      solution:
        "Designed and built a conversion-optimized landing page with animated hero sections, gameplay feature showcases, Google Play download links, and a visual style that matches the game's premium identity.",
      results: [
        "Clean, modern design matching the game's visual identity",
        "Clear messaging focused on fair-play and no-ads differentiators",
        "Optimized for mobile-first experience",
        "Google Play Store integration with direct download link",
      ],
    },
  },
  {
    slug: "lomeli-financial",
    title: "Lomeli Financial Group",
    clientName: "Jorge Lomeli",
    serviceType: "Landing Page",
    industry: "Financial Services",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    description:
      "A professional landing page for a financial advisory group, designed to build trust and generate qualified leads from high-net-worth individuals seeking financial guidance.",
    shortDescription: "Professional financial advisory landing page.",
    thumbnailImage: "/assets/portfolio/lomeli-financial/thumbnail.webp",
    vercelUrl: "https://jorge-lomeli-financial.vercel.app",
    githubUrl: "https://github.com/DessiM15/jorge-lomeli-financial",
    caseStudy: {
      challenge:
        "A growing financial advisory practice needed a professional digital presence that conveys trust and expertise to prospective high-net-worth clients.",
      solution:
        "Created a clean, trust-building landing page with professional design, clear service descriptions, credentials showcase, and streamlined contact forms for lead generation.",
      results: [
        "Professional design that conveys financial expertise",
        "Streamlined lead capture with contact forms",
        "Mobile-responsive for on-the-go prospects",
        "SEO-optimized for local financial advisor searches",
      ],
    },
  },
  {
    slug: "gulf-coast-alloys",
    title: "Gulf Coast Alloys",
    clientName: "Gulf Coast Alloys",
    serviceType: "Website",
    industry: "Manufacturing / Industrial",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    description:
      "A corporate website for a specialty metals and alloys distributor, showcasing their product catalog, capabilities, and industry expertise to B2B buyers.",
    shortDescription: "Industrial metals distributor corporate website.",
    thumbnailImage: "/assets/portfolio/gulf-coast-alloys/thumbnail.webp",
    vercelUrl: "https://gca-2-blond.vercel.app",
    githubUrl: "https://github.com/DessiM15/GCA2",
    featured: true,
    featuredOrder: 3,
    caseStudy: {
      challenge:
        "A specialty metals distributor needed a modern web presence that could effectively communicate their product range and capabilities to industrial B2B buyers.",
      solution:
        "Developed a professional corporate website with detailed product catalogs, material specifications, request-for-quote workflows, and industry certification showcases.",
      results: [
        "Professional B2B website reflecting industrial expertise",
        "Detailed product catalog with material specifications",
        "Request-for-quote workflow for sales team",
        "Improved online visibility for industrial searches",
      ],
    },
  },
  {
    slug: "botmakers-crm",
    title: "Botmakers CRM",
    clientName: "Botmakers",
    serviceType: "Platform/CRM",
    industry: "Technology / AI",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "PostgreSQL", "Stripe"],
    description:
      "A full-featured CRM platform built for Botmakers.ai, managing client relationships, project pipelines, invoicing, and team collaboration for an AI development agency.",
    shortDescription: "Full-featured CRM for an AI development agency.",
    thumbnailImage: "/assets/portfolio/botmakers-crm/thumbnail.webp",
    vercelUrl: "https://botmakers-crm.vercel.app",
    githubUrl: "https://github.com/DessiM15/botmakers-crm",
    caseStudy: {
      challenge:
        "An AI development agency needed a custom CRM that could handle their unique workflow: managing AI project pipelines, tracking client communications, and integrating invoicing.",
      solution:
        "Built a bespoke CRM from scratch with client management, project pipeline tracking, automated invoicing via Stripe, team collaboration tools, and analytics dashboards.",
      results: [
        "Custom CRM tailored to AI agency workflows",
        "Integrated invoicing and payment processing via Stripe",
        "Project pipeline with stage tracking and notifications",
        "Team collaboration with role-based access control",
      ],
    },
  },
  {
    slug: "botmakers-website",
    title: "Botmakers Website",
    clientName: "Botmakers",
    serviceType: "Website",
    industry: "Technology / AI",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "OpenAI", "Vercel"],
    description:
      "The corporate website for Botmakers.ai, an AI development agency. Features AI-powered chatbot integration, service showcases, and conversion-optimized design for enterprise clients.",
    shortDescription: "AI development agency website with chatbot integration.",
    thumbnailImage: "/assets/portfolio/botmakers-website/thumbnail.webp",
    vercelUrl: "https://botmakers.ai",
    githubUrl: "https://github.com/DessiM15/botmakers-website",
    isAIPowered: true,
    caseStudy: {
      challenge:
        "An AI development agency needed a website that practices what they preach: demonstrating AI capabilities while generating enterprise leads.",
      solution:
        "Created a sophisticated website with live AI chatbot powered by OpenAI, interactive service showcases, case study presentations, and conversion-optimized contact flows for enterprise clients.",
      results: [
        "AI chatbot handling initial client inquiries 24/7",
        "Interactive service showcases demonstrating AI capabilities",
        "Enterprise-focused design building credibility",
        "Conversion-optimized lead generation flow",
      ],
    },
  },
  {
    slug: "taylor-made-esthetics",
    title: "Taylor Made Esthetics",
    clientName: "Taylor Made Esthetics",
    serviceType: "Website",
    industry: "Beauty / Aesthetics",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    description:
      "A premium website for an esthetics studio, featuring service menus, online booking integration, before/after galleries, and a design aesthetic that matches the luxury brand experience.",
    shortDescription: "Premium esthetics studio website with booking integration.",
    thumbnailImage: "/assets/portfolio/taylor-made-esthetics/thumbnail.webp",
    vercelUrl: "https://taylor-made-esthetics.vercel.app",
    githubUrl: "https://github.com/DessiM15/taylor-made-esthetics",
    featured: true,
    featuredOrder: 4,
    caseStudy: {
      challenge:
        "A growing esthetics studio needed a premium web presence that reflects their luxury brand positioning and makes it easy for clients to book services online.",
      solution:
        "Designed a visually stunning website with elegant service menus, integrated booking system, before/after galleries, and a design language that reinforces the studio's premium brand identity.",
      results: [
        "Luxury design aesthetic matching brand positioning",
        "Integrated online booking reducing phone call volume",
        "Service menu with detailed treatment descriptions",
        "Mobile-optimized for on-the-go booking",
      ],
    },
  },
  {
    slug: "fight-my-repo",
    title: "Fight My Repo",
    clientName: "Fight My Repo",
    serviceType: "Landing Page",
    industry: "Legal Tech / AI",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "OpenAI", "Vercel"],
    description:
      "An AI-powered landing page for a vehicle repossession dispute service, using artificial intelligence to help consumers understand their rights and fight wrongful repossessions.",
    shortDescription: "AI-powered repossession dispute landing page.",
    thumbnailImage: "/assets/portfolio/fight-my-repo/thumbnail.webp",
    vercelUrl: "https://fight-my-repo.vercel.app",
    githubUrl: "https://github.com/DessiM15/fight-my-repo",
    isAIPowered: true,
    caseStudy: {
      challenge:
        "Consumers facing vehicle repossession often don't know their legal rights. Existing services are expensive and opaque. There was a need for an accessible, AI-powered solution.",
      solution:
        "Built a conversion-focused landing page with AI-powered case evaluation tools, educational content about repossession rights, and streamlined intake forms for qualified leads.",
      results: [
        "AI case evaluation tool for instant preliminary assessment",
        "Educational content building trust and authority",
        "Streamlined intake form for qualified leads",
        "Mobile-first design for users in urgent situations",
      ],
    },
  },
  {
    slug: "repo911",
    title: "Repo911",
    clientName: "Repo911",
    serviceType: "Platform/CRM",
    industry: "Legal Tech / AI",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "OpenAI", "Supabase", "PostgreSQL", "Vercel"],
    description:
      "A full platform for managing vehicle repossession disputes at scale, with AI-powered case analysis, document management, client portals, and automated workflow processing.",
    shortDescription: "AI-powered repossession dispute management platform.",
    thumbnailImage: "/assets/portfolio/repo911/thumbnail.webp",
    vercelUrl: "https://repo-911.vercel.app",
    githubUrl: "https://github.com/DessiM15/repo911",
    isAIPowered: true,
    featured: true,
    featuredOrder: 2,
    caseStudy: {
      challenge:
        "The repossession dispute space needed a comprehensive platform that could handle case management, document processing, and client communication at scale while leveraging AI for case analysis.",
      solution:
        "Built a full-stack platform with AI-powered case analysis using OpenAI, automated document processing, client self-service portals, case tracking dashboards, and workflow automation.",
      results: [
        "AI-powered case analysis reducing review time significantly",
        "Automated document processing and management",
        "Client self-service portal for case tracking",
        "Scalable architecture handling growing case volume",
      ],
    },
  },
  {
    slug: "valor-financial",
    title: "Valor Financial Advisors",
    clientName: "Phil Valor",
    serviceType: "Website",
    industry: "Financial Services",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    description:
      "A professional website for a financial advisory firm, with a recruitment-focused design to attract top financial advisors while also serving as an informational resource for prospective clients.",
    shortDescription: "Financial advisory firm website with recruitment focus.",
    thumbnailImage: "/assets/portfolio/valor-financial/thumbnail.webp",
    vercelUrl: "https://phil-valor-recruitment.vercel.app",
    githubUrl: "https://github.com/DessiM15/phil-valor-recruitment",
    caseStudy: {
      challenge:
        "A financial advisory firm needed a dual-purpose website: attracting qualified financial advisors for recruitment while also generating client leads.",
      solution:
        "Created a professional website with separate recruitment and client-facing sections, showcasing firm culture, advisor benefits, client services, and credentialing.",
      results: [
        "Dual-purpose site serving recruitment and client acquisition",
        "Professional design conveying financial credibility",
        "Recruitment section with advisor benefits and application flow",
        "Client-facing content with service descriptions",
      ],
    },
  },
  {
    slug: "apex-affinity-group",
    title: "APEX Affinity Group",
    clientName: "APEX Affinity Group",
    serviceType: "Website",
    industry: "Business Services",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    description:
      "A corporate website for APEX Affinity Group, a business services and market solutions company providing consulting, analytics, and strategic partnership services.",
    shortDescription: "Business services and market solutions corporate website.",
    thumbnailImage: "/assets/portfolio/apex-affinity-group/thumbnail.webp",
    vercelUrl: "https://apexpulsemarket.com",
    githubUrl: "https://github.com/DessiM15/apex-demos",
    caseStudy: {
      challenge:
        "A business services company needed a polished corporate website to establish credibility and showcase their consulting and market solutions offerings.",
      solution:
        "Developed a clean corporate website with service showcases, team profiles, client testimonials, and contact workflows designed for B2B lead generation.",
      results: [
        "Professional corporate presence establishing credibility",
        "Service showcase with detailed offerings",
        "B2B-optimized contact and lead generation flow",
        "Responsive design for executive audiences",
      ],
    },
  },
  {
    slug: "mex-taco-house",
    title: "Mex Taco House",
    clientName: "Mex Taco House",
    serviceType: "Website",
    industry: "Food Service",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    description:
      "A complete digital presence for a popular Houston taco restaurant, featuring online ordering integration with Uber Eats and Grubhub, menu showcase, and location information.",
    shortDescription: "Houston restaurant website with delivery integrations.",
    thumbnailImage: "/assets/portfolio/mex-taco-house/thumbnail.webp",
    vercelUrl: "https://mextacohouse.com",
    githubUrl: "https://github.com/DessiM15/mex-taco-house-website",
    caseStudy: {
      challenge:
        "A growing Houston restaurant needed a modern website that could drive online orders and integrate seamlessly with third-party delivery platforms.",
      solution:
        "Built a vibrant restaurant website with integrated Uber Eats and Grubhub ordering, full menu showcase, location information, analytics tracking, and mobile-first design.",
      results: [
        "30% increase in online orders within first quarter",
        "Integrated Uber Eats and Grubhub ordering from website",
        "Analytics tracking to measure website ROI",
        "Mobile-optimized for the majority of restaurant traffic",
      ],
    },
  },
  {
    slug: "gin-and-jack",
    title: "Gin & Jack",
    clientName: "Emily & Corey",
    serviceType: "Website",
    industry: "Hospitality / Events",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    description:
      "A sophisticated website for Gin & Jack, a Houston-based mobile bartending service specializing in weddings, engagements, and private events. Features elegant design with serif typography, event gallery, service packages, and a booking inquiry flow — all crafted to match the brand's upscale, celebratory identity.",
    shortDescription: "Mobile bartending service website for weddings and events.",
    thumbnailImage: "/assets/portfolio/gin-and-jack/thumbnail.webp",
    vercelUrl: "https://www.ginandjackbar.com",
    githubUrl: "https://github.com/DessiM15/Gin-Jack-Emily",
    featured: true,
    featuredOrder: 1,
    caseStudy: {
      challenge:
        "A growing mobile bartending business needed a premium web presence that conveys the sophistication and celebratory energy of their brand while making it easy for couples and event planners to explore packages and book services.",
      solution:
        "Designed and built an elegant, conversion-focused website with refined serif typography, warm gold and cream color palette, event-type showcases for weddings, engagements, and private parties, a detailed service packages section, a curated event gallery, and a streamlined booking inquiry form.",
      results: [
        "Elegant design that captures the brand's upscale identity",
        "Service package showcase driving qualified inquiries",
        "Event gallery building trust with prospective clients",
        "Mobile-optimized booking flow for on-the-go event planners",
      ],
    },
  },
  {
    slug: "the-houston-barber",
    title: "The Houston Barber",
    clientName: "The Houston Barber",
    serviceType: "Website",
    industry: "Barbershop / Grooming",
    techStack: ["Next.js", "React", "Tailwind CSS", "Framer Motion", "StyleSeat", "Vercel"],
    description:
      "A concept website built for a high-end barbershop, showing how a grooming business can let clients book services directly on their own site. Built in a cinematic black-and-gold theme with an embedded StyleSeat booking flow — clients view real availability and book appointments without leaving the site, and the booking page integrates with the shop's existing StyleSeat system rather than replacing it.",
    shortDescription: "Concept barbershop website with direct in-site booking.",
    thumbnailImage: "/assets/portfolio/the-houston-barber/thumbnail.webp",
    vercelUrl: "https://barber-website-mock.vercel.app",
    githubUrl: "https://github.com/DessiM15/barber-website-mock",
    caseStudy: {
      challenge:
        "Many barbershops rely on a third-party booking platform like StyleSeat but have no branded website of their own, sending clients off-site to book and losing the chance to build their own identity. The goal was to design a premium web presence that keeps booking on the shop's own site while integrating with the booking system they already use.",
      solution:
        "Designed and built a cinematic, multi-page barbershop website in a luxe black-and-gold theme, with an embedded StyleSeat booking flow on a dedicated Book page. Clients can view availability and book services directly through the website; when a browser or plan blocks the inline calendar, an always-working \"Open StyleSeat\" fallback guarantees the booking can still be completed. Rounded out with services and pricing, team, gallery with lightbox, reviews, shop, about, and a contact page with map and hours.",
      results: [
        "Direct in-site booking via an embedded StyleSeat flow — no separate system to manage",
        "Integrates with the shop's existing StyleSeat account instead of replacing it",
        "Always-working \"Open StyleSeat\" fallback so clients can always complete a booking",
        "Cinematic black-and-gold design with scroll animations across a full multi-page site",
        "Fully responsive, statically generated, with per-page SEO metadata",
      ],
    },
  },
];
