// Brand Colors
export const BRAND_COLORS = {
  red: "#DC2626",
  redMuted: "#B91C1C",
  black: "#000000",
  white: "#FFFFFF",
  lightGray: "rgba(255, 255, 255, 0.60)",
} as const;

// Service Data Structure
export interface Service {
  slug: string;
  title: string;
  shortDescription: string;
  extendedDescription: string;
  keyFeatures: string[];
  benefits: string[];
  useCases: string[];
}

export const SERVICES: Service[] = [
  {
    slug: "web-development",
    title: "Website Design & Development",
    shortDescription:
      "Fast, mobile-first websites for local businesses, built to turn a Google search into a phone call.",
    extendedDescription:
      "Most of our clients are small businesses across Katy, Cypress, and Houston who need a site that looks credible, loads fast on a phone, and makes it obvious how to get in touch. We design and build it from scratch on Next.js, write the copy with you, set up the pages Google needs to find you locally, and launch on your own domain. Most sites go live in one to two weeks.",
    keyFeatures: [
      "Custom design, not a template, matched to your brand and your customer",
      "Built mobile-first, since most local searches happen on a phone",
      "Contact forms, click-to-call, and booking links wired to your inbox",
      "Local SEO foundation: page titles, service and city pages, schema, sitemap",
      "Google Business Profile connected and consistent with the site",
      "Fast hosting on Vercel with your own domain and SSL",
      "Landing pages for a single offer, event, or ad campaign",
      "Edits and updates after launch, without a retainer",
    ],
    benefits: [
      "Show up for the searches your customers actually type",
      "Look like the established business you are",
      "Turn visitors into calls, forms, and bookings",
      "Launch in days, not months",
      "Own the site outright, including the code and the domain",
      "One point of contact from first call to launch",
    ],
    useCases: [
      "A first website for a business that has run on referrals",
      "Replacing a slow or dated site that stopped bringing in leads",
      "A bilingual site for a business serving Spanish-speaking customers",
      "A landing page for one service, one location, or one campaign",
      "A booking-ready site for a salon, barbershop, or mobile service",
      "A restaurant or food business site with menu, hours, and ordering",
    ],
  },
  {
    slug: "mobile-development",
    title: "Mobile App Development",
    shortDescription:
      "iOS and Android apps for when a website isn't enough, built and shipped to the app stores.",
    extendedDescription:
      "Some ideas need an app: a game, a loyalty program, a tool your customers open every day. We build cross-platform apps with React Native and Expo, so one codebase ships to both stores, and we handle the parts that usually stall a first app: accounts, payments, push notifications, store review, and updates after launch.",
    keyFeatures: [
      "One codebase for iOS and Android with React Native and Expo",
      "Accounts, subscriptions, and in-app purchases",
      "Push notifications and offline support",
      "App Store and Google Play submission and review",
      "Over-the-air updates so fixes ship without a new store release",
      "A landing page for the app, so it has somewhere to be found",
      "Analytics on what people actually do inside the app",
      "Maintenance after launch as the platforms change",
    ],
    benefits: [
      "Be on your customer's home screen, not just in a browser tab",
      "Reach both platforms without paying for two builds",
      "Recurring revenue through subscriptions and purchases",
      "Ship fixes and features in days with over-the-air updates",
      "A real product you own, with the source code",
      "One team for the app, the backend, and the landing page",
    ],
    useCases: [
      "A mobile game with levels, seasons, and a subscription",
      "A loyalty or rewards app for a local business",
      "A booking or scheduling app for a service business",
      "An internal app for a field team",
      "A companion app for an existing website or platform",
      "A prototype to test an idea before a bigger investment",
    ],
  },
  {
    slug: "ai-enhancement-ai-workflows",
    title: "Automation & AI",
    shortDescription:
      "Systems that handle the busywork: follow-ups, review requests, lead routing, and answering the same questions again and again.",
    extendedDescription:
      "The hours a small business loses are rarely to hard problems. They go to chasing reviews, re-typing the same reply, moving a lead from one inbox to another. We build automations that do that work, and where it earns its place, we add AI: a chat assistant that answers customer questions from your own material, a screener that qualifies a lead before you call, a summary that lands in your inbox instead of a raw form. Practical, scoped, and measured.",
    keyFeatures: [
      "Review requests sent automatically after a job, visit, or sale",
      "Lead routing: the right inquiry to the right person, with the context attached",
      "Chat assistants that answer from your own content and hand off to a human",
      "Intake screening that qualifies a lead before it reaches you",
      "Follow-up sequences by email and text",
      "Connections between the tools you already use",
      "Document and case analysis where the volume justifies it",
      "Guardrails so an assistant never says something it shouldn't",
    ],
    benefits: [
      "Get hours back every week without hiring",
      "Reply to every lead in minutes, even after hours",
      "More reviews, because asking becomes automatic",
      "Fewer leads lost between inboxes",
      "AI where it helps, skipped where it doesn't",
      "Everything logged, so you can see what it did",
    ],
    useCases: [
      "A law firm that needs leads screened before the first call",
      "A restaurant or salon asking every customer for a review",
      "A service business routing quotes to the right crew",
      "A bilingual assistant for customers who prefer Spanish",
      "A case management platform with AI-assisted document review",
      "An agency automating client onboarding and reporting",
    ],
  },
  {
    slug: "enterprise-systems",
    title: "Custom Software & CRM",
    shortDescription:
      "Tools built around how your business actually runs: scheduling, quoting, customer tracking, and reporting.",
    extendedDescription:
      "Off-the-shelf software makes you work its way. When a spreadsheet has become the business, or three subscriptions still don't fit together, we build the one tool that does: a CRM shaped around your pipeline, a portal your customers log in to, a dashboard that shows the numbers you actually check. Built on the same modern stack as our websites, hosted for you, and yours to keep.",
    keyFeatures: [
      "CRM and pipeline tracking shaped around your sales process",
      "Customer and client portals with secure login",
      "Scheduling, quoting, and invoicing in one place",
      "Dashboards and reports on the numbers you run the business by",
      "Role-based access for staff, contractors, and clients",
      "Integrations with payments, email, and the tools you keep",
      "Import from the spreadsheets and systems you're replacing",
      "Hosting, backups, and support after launch",
    ],
    benefits: [
      "Stop paying for three tools that almost fit",
      "Everyone works from the same, current information",
      "See where every lead, job, and payment stands",
      "Scale the process without scaling the admin",
      "Own the software and the data",
      "Change it as the business changes, without starting over",
    ],
    useCases: [
      "A CRM for an agency tracking leads, projects, and invoices",
      "A case management platform for a legal or claims business",
      "A client portal for reports, documents, and approvals",
      "A scheduling and dispatch tool for a service business",
      "An advertising or inventory tracker with payments and reminders",
      "Replacing a spreadsheet the whole team depends on",
    ],
  },
];
