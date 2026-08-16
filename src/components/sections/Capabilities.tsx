import Image from "next/image";
import Link from "next/link";

/**
 * "What We Build" — the homepage service grid.
 *
 * Rendered from a single markup block. The previous version shipped two
 * copies of every card (a desktop flex row and a mobile grid), so each
 * heading appeared twice in the DOM. Layout now switches with CSS only,
 * which also lets this be a server component: the hover-to-expand effect
 * is pure CSS, so it needs no client JS.
 */
const capabilities = [
  {
    title: "Business Websites",
    description:
      "Fast, mobile-first sites that turn visitors into phone calls. Most builds go live in under two weeks.",
    href: "/services/web-development",
    image: "/assets/portfolio/taylor-made-esthetics/taylor-made-esthetician-website-design.webp",
    logo: "/assets/client-logos/taylor-made-esthetics.png",
    alt: "Taylor Made Esthetics website homepage, built by Smart Scale",
  },
  {
    title: "Local Visibility",
    description:
      "Google Business Profile management, local SEO, and monthly optimization so customers find you first.",
    href: "/services",
    image: "/assets/portfolio/mex-taco-house/mex-taco-house-restaurant-website-design.webp",
    logo: "/assets/client-logos/mex-taco-house.png",
    alt: "Mex Taco House restaurant website, built by Smart Scale in Houston",
  },
  {
    title: "Custom Software & CRM",
    description:
      "Tools built around how your business actually runs: scheduling, quoting, customer tracking.",
    href: "/services/enterprise-systems",
    image: "/assets/portfolio/botmakers-crm/botmakers-custom-crm-platform.webp",
    logo: "/assets/client-logos/botmakers.png",
    alt: "Botmakers CRM dashboard showing client pipeline and invoicing",
  },
  {
    title: "Mobile Apps",
    description:
      "iOS and Android apps for when a website isn't enough.",
    href: "/services/mobile-development",
    image: "/assets/portfolio/bloxify-landing/bloxify-app-landing-page-design.webp",
    logo: "/assets/client-logos/bloxify.png",
    alt: "Bloxify mobile app landing page with app store download links",
  },
  {
    title: "Automation & AI",
    description:
      "Systems that handle the busywork: follow-ups, review requests, lead routing.",
    href: "/services/ai-enhancement-ai-workflows",
    image: "/assets/portfolio/repo911/repo911-case-management-platform.webp",
    logo: "/assets/client-logos/repo911.svg",
    alt: "Repo911 case management platform with AI-powered document analysis",
  },
];

export default function Capabilities() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white" data-theme="light">
      <div className="max-w-7xl mx-auto">
        <h2
          className="text-4xl sm:text-5xl md:text-6xl text-[#111111] text-center mb-4"
          data-animate="word-reveal"
        >
          What We Build
        </h2>
        <p
          className="text-center text-black/50 text-lg mb-20 max-w-2xl mx-auto"
          data-animate="fade-up"
        >
          Everything a local business needs to get found, look credible, and
          win the customer.
        </p>

        {/*
          One list, two layouts. Below lg it is a stacked grid of fixed-height
          cards. At lg and up it becomes a row where each panel expands on
          hover — driven entirely by `flex-grow` transitions and the
          `group-hover`/`hover` pair, no state required.
        */}
        <div
          className="group grid grid-cols-1 sm:grid-cols-2 gap-4 lg:flex lg:h-[520px] lg:gap-[2px] lg:rounded-2xl lg:overflow-hidden"
          data-animate="fade-up"
        >
          {capabilities.map((cap) => (
            <Link
              key={cap.title}
              href={cap.href}
              className="cap-panel relative block h-52 overflow-hidden rounded-2xl lg:h-auto lg:rounded-none lg:flex-1 lg:[transition:flex-grow_0.6s_cubic-bezier(0.4,0,0.2,1)] lg:group-hover:flex-grow-[0.6] lg:hover:!flex-grow-[4]"
            >
              <Image
                src={cap.image}
                alt={cap.alt}
                fill
                className="object-cover transition-all duration-700 ease-out lg:opacity-0 lg:[.cap-panel:hover_&]:opacity-100 lg:[.cap-panel:hover_&]:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
              />

              {/* Light plate shown at rest on desktop; hidden on mobile where
                  the screenshot is always visible. */}
              <div className="hidden lg:block absolute inset-0 bg-[#F0F0F0] transition-opacity duration-700 [.cap-panel:hover_&]:opacity-0" />

              {/* Readability scrim over the screenshot. */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 lg:opacity-0 lg:transition-opacity lg:duration-700 lg:[.cap-panel:hover_&]:opacity-100" />

              {/* Red accent, desktop hover only. */}
              <div className="hidden lg:block absolute bottom-0 inset-x-0 h-[2px] bg-[#DC2626] opacity-0 transition-opacity duration-500 [.cap-panel:hover_&]:opacity-100" />

              {/* Resting state on desktop: client logo above the label. */}
              <div className="hidden lg:flex absolute inset-0 flex-col items-center justify-center p-6 transition-opacity duration-500 [.cap-panel:hover_&]:opacity-0">
                <div className="flex-1 flex items-center justify-center">
                  <Image
                    src={cap.logo}
                    alt=""
                    aria-hidden="true"
                    width={120}
                    height={60}
                    className="object-contain max-h-16 w-auto brightness-0 opacity-40"
                  />
                </div>
                <span className="text-[#111111]/40 text-xs uppercase tracking-widest font-medium pb-4">
                  {cap.title}
                </span>
              </div>

              {/* The single copy of each heading in the DOM. */}
              <div className="absolute inset-0 flex flex-col justify-end p-5 lg:p-6">
                <h3 className="text-lg lg:text-2xl xl:text-[1.75rem] text-white mb-1 lg:mb-3 lg:whitespace-nowrap lg:opacity-0 lg:transition-opacity lg:duration-500 lg:[.cap-panel:hover_&]:opacity-100">
                  {cap.title}
                </h3>
                <p className="text-xs lg:text-sm text-white/60 leading-relaxed lg:opacity-0 lg:transition-opacity lg:duration-500 lg:[.cap-panel:hover_&]:opacity-100">
                  {cap.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
