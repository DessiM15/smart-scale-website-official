/**
 * Content for the /web-design/[city] landing pages.
 *
 * Every field here is written per city on purpose. Google treats
 * near-identical local landing pages as doorway pages and demotes the whole
 * set, so nothing in this file is templated from a shared string with the
 * city name swapped in — the neighborhoods, industries, and FAQs are
 * genuinely different because the places are genuinely different.
 */

export interface CityIndustry {
  name: string;
  blurb: string;
}

export interface CityFaq {
  question: string;
  answer: string;
}

export interface CityContent {
  slug: string;
  name: string;
  /** Used in metadata + H1. */
  title: string;
  description: string;
  h1: string;
  /** Opening paragraphs. First one must name the city and the service. */
  intro: string[];
  /** Named places locals recognize — the strongest signal of real local content. */
  landmarks: string[];
  industries: CityIndustry[];
  /** A section of honest, city-specific positioning. */
  localAngle: { heading: string; body: string[] };
  faqs: CityFaq[];
  /** Slugs of the other city pages, for internal linking. */
  nearby: string[];
}

export const CITIES: CityContent[] = [
  {
    slug: "katy",
    name: "Katy",
    title: "Website Design in Katy, TX | Smart Scale",
    description:
      "Website design and local SEO for Katy, TX businesses. We're based in Katy and build fast, mobile-first sites that get found on Google. See our work.",
    h1: "Website Design for Katy Businesses",
    intro: [
      "Smart Scale is a web design company based in Katy, Texas. We build websites and manage local SEO for businesses across Katy — from the shops along Mason Road to the service companies working out of Old Katy and the growing corridor west toward Fulshear.",
      "Katy is not one market. A med spa in Cinco Ranch is competing for a completely different customer than an HVAC company running calls out toward Brookshire, and the websites that work for each look nothing alike. We build for the customer you actually want.",
    ],
    landmarks: [
      "Cinco Ranch",
      "LaCenterra",
      "Old Katy & the Katy Boardwalk District",
      "Cross Creek Ranch",
      "Katy Mills",
      "the I-10 Energy Corridor",
    ],
    industries: [
      {
        name: "Home services",
        blurb:
          "Katy's housing stock skews new and large, and it keeps expanding west. HVAC, roofing, pool, lawn, and remodeling companies live or die on how fast they show up when someone searches at 9pm with a broken AC.",
      },
      {
        name: "Med spas & aesthetics",
        blurb:
          "Cinco Ranch and LaCenterra support a dense cluster of med spas, injectors, and estheticians. This is a photo-first, booking-first category — the site has to look premium and take an appointment in two taps.",
      },
      {
        name: "Youth sports & enrichment",
        blurb:
          "Katy ISD is one of the largest districts in Texas, and the tutoring, gymnastics, martial arts, and select-sports businesses around it compete almost entirely on parent word-of-mouth plus Google.",
      },
      {
        name: "Restaurants & food trucks",
        blurb:
          "Menus that load fast on a phone, current hours, and a clickable phone number. Most Katy restaurant sites fail at least one of those.",
      },
    ],
    localAngle: {
      heading: "Why being based in Katy actually matters",
      body: [
        "Google weighs proximity heavily in local results. A business physically in Katy has a structural advantage for Katy searches that an agency in another state cannot buy its way around — and we can meet you in person, which still closes more work than any funnel.",
        "It also means we know the seasonality. We know that Katy home-services searches spike with the first real cold snap and again in July, and that back-to-school timing drives the enrichment businesses. We plan content around that calendar instead of a generic one.",
      ],
    },
    faqs: [
      {
        question: "How much does a website cost for a Katy business?",
        answer:
          "Most small-business sites we build in Katy land in the low four figures, depending on page count and whether you need booking, payments, or a menu system. We quote a fixed price before we start — no hourly surprises.",
      },
      {
        question: "How long until my Katy business shows up on Google?",
        answer:
          "A new site typically gets indexed within a week or two. Ranking in the Katy map pack takes longer — usually two to four months of consistent Google Business Profile work and reviews. Anyone promising page one in 30 days is selling you something.",
      },
      {
        question: "Do you work with businesses outside Katy proper?",
        answer:
          "Yes. We serve the whole western Houston metro, including Fulshear, Brookshire, Richmond, and Sugar Land. Katy is just where we're based.",
      },
      {
        question: "Can you take over a website someone else built?",
        answer:
          "Usually. If it's on a common platform we can often improve what's there. If it's on a locked-down proprietary builder, rebuilding is generally cheaper than fighting it — we'll tell you honestly which one you're in.",
      },
    ],
    nearby: ["cypress", "houston"],
  },
  {
    slug: "cypress",
    name: "Cypress",
    title: "Website Design in Cypress, TX | Smart Scale",
    description:
      "Website design and local SEO for Cypress, TX businesses. Fast, mobile-first sites built for the Cy-Fair market. See our work and get a fixed quote.",
    h1: "Website Design for Cypress Businesses",
    intro: [
      "Smart Scale builds websites and runs local SEO for businesses in Cypress, Texas. We work with companies across the 290 and Grand Parkway corridor — Bridgeland, Towne Lake, Fairfield, Coles Crossing, and the older parts of Cypress closer to Huffmeister.",
      "Cypress is unincorporated, which quietly changes how local search works here. There's no single downtown to anchor to, so customers search by subdivision and by landmark far more than they do in a city with a defined center. Sites that only say \"Cypress\" leave a lot of traffic on the table.",
    ],
    landmarks: [
      "Bridgeland",
      "Towne Lake",
      "Fairfield",
      "Coles Crossing",
      "the US-290 corridor",
      "the Grand Parkway (99)",
    ],
    industries: [
      {
        name: "Home services & new construction trades",
        blurb:
          "Bridgeland and Towne Lake are still actively building out. Fence, landscape, pool, window, and epoxy companies here are selling to homeowners who moved in eighteen months ago and have a list.",
      },
      {
        name: "Boutique fitness & wellness",
        blurb:
          "Cypress supports an unusual density of studios — pilates, cold plunge, recovery, kids' fitness. Class schedules and trial-offer signup are the whole conversion path.",
      },
      {
        name: "Family dental, ortho & pediatrics",
        blurb:
          "Cy-Fair ISD's size makes Cypress a family-practice market. These businesses compete on reviews and on how quickly a parent can request an appointment.",
      },
      {
        name: "Auto & mobile services",
        blurb:
          "Mobile detailing, windshield repair, and mechanic shops along Huffmeister and Barker Cypress. Service-area businesses with no storefront need a specific kind of Google Business Profile setup to rank.",
      },
    ],
    localAngle: {
      heading: "Ranking in a place without a downtown",
      body: [
        "Because Cypress is unincorporated and spread across a wide area, proximity-based ranking scatters. A business near Fairfield and one near Bridgeland can both be \"in Cypress\" and be fifteen minutes apart, and Google will show different results to each of their neighborhoods.",
        "The practical answer is to build out subdivision-level relevance — naming the communities you actually serve in your content and your Google Business Profile — rather than repeating the word \"Cypress\" and hoping. That's how we structure Cypress sites.",
      ],
    },
    faqs: [
      {
        question: "Does being in unincorporated Cypress hurt my Google ranking?",
        answer:
          "Not by itself, but it changes strategy. Without a city center to anchor to, you rank on proximity to each neighborhood plus the strength of your Google Business Profile. Naming the specific communities you serve matters more here than in Katy or Sugar Land.",
      },
      {
        question: "I run a mobile business with no storefront. Can I still rank in Cypress?",
        answer:
          "Yes — you set up as a service-area business, hide your address, and define your service radius. It's a specific configuration and a lot of businesses get it wrong, which leaves them invisible. We set it up as part of the build.",
      },
      {
        question: "How much does a website cost for a Cypress business?",
        answer:
          "Most small-business builds land in the low four figures, quoted at a fixed price up front. Booking systems, online ordering, or a customer portal push it higher — we'll tell you before you commit.",
      },
      {
        question: "Do you handle the Google Business Profile too, or just the website?",
        answer:
          "Both, and they should be done together. The website and the profile feed each other — a great site with a neglected profile won't crack the Cypress map pack.",
      },
    ],
    nearby: ["katy", "houston"],
  },
  {
    slug: "houston",
    name: "Houston",
    title: "Website Design in Houston, TX | Smart Scale",
    description:
      "Website design and local SEO for Houston, TX businesses. We build fast, mobile-first sites for restaurants, shops, and service companies across Houston.",
    h1: "Website Design for Houston Businesses",
    intro: [
      "Smart Scale designs websites and runs local SEO for businesses in Houston, Texas. Our Houston work spans restaurants, barbershops, estheticians, mobile bars, and industrial suppliers — the kind of businesses that need a phone to ring, not a brand deck.",
      "Houston is the fourth-largest city in the country and the hardest local market in Texas to rank in. We'll be straight with you about that below, because the strategy that works here is different from the one that works in Katy or Cypress.",
    ],
    landmarks: [
      "the Heights",
      "Montrose",
      "EaDo",
      "the Galleria / Uptown",
      "the Texas Medical Center",
      "Midtown",
    ],
    industries: [
      {
        name: "Restaurants & bars",
        blurb:
          "Houston's restaurant scene is enormous and genuinely competitive. Fast-loading menus, current hours, reservations, and photography that doesn't look like a stock library are table stakes.",
      },
      {
        name: "Barbershops, salons & estheticians",
        blurb:
          "Appointment-driven and almost entirely mobile-discovered. The gap between a booking flow that takes two taps and one that takes six is most of your revenue.",
      },
      {
        name: "Events & hospitality",
        blurb:
          "Mobile bars, catering, and venue services. These sell on portfolio photography and on how easy it is to request a date.",
      },
      {
        name: "Industrial & B2B suppliers",
        blurb:
          "Houston runs on energy and industrial supply. These sites need product catalogs, spec sheets, and a request-for-quote flow — a different build entirely from a consumer site.",
      },
    ],
    localAngle: {
      heading: "An honest word about ranking in Houston",
      body: [
        "\"Web designer Houston\" and similar city-wide terms are dominated by agencies with years of domain authority and large link budgets. If someone tells you they'll get you to the top of a city-wide Houston term quickly and cheaply, they are not being straight with you.",
        "What does work: neighborhood-level and niche targeting. Ranking for \"barber shop Montrose\" or \"mobile bar rental Houston\" is achievable, and those searches convert far better than a generic city-wide term anyway — the person searching them is closer to booking.",
        "So for Houston clients we build around the neighborhoods you actually serve and the specific service you actually sell, then expand outward as the site earns authority. It's slower to say and faster to work.",
      ],
    },
    faqs: [
      {
        question: "Can you get my business ranking in Houston?",
        answer:
          "For neighborhood and niche searches, yes, and that's where the qualified customers are. For broad city-wide terms like \"web design Houston,\" that's a multi-year, high-budget fight against established agencies. We'll tell you which terms are realistic for your business before you spend anything.",
      },
      {
        question: "How long does local SEO take to work in Houston?",
        answer:
          "Expect three to six months for meaningful movement in a competitive Houston category — longer than in Katy or Cypress, because there's simply more competition per search. Reviews and consistent Google Business Profile activity move it fastest.",
      },
      {
        question: "Do you work with Houston restaurants specifically?",
        answer:
          "Yes. We've built for Mex Taco House and Dos Tacos, among others. Restaurant sites have their own requirements — menu updates you can make yourself, fast mobile loads, and accurate hours everywhere Google reads them.",
      },
      {
        question: "My business is in Houston but I serve the whole metro. How should that be set up?",
        answer:
          "Your Google Business Profile should reflect where you're physically located, with service areas defined around it. Trying to appear headquartered in multiple cities at once is a well-known way to get a listing suspended.",
      },
    ],
    nearby: ["katy", "cypress"],
  },
];

export function getCity(slug: string): CityContent | undefined {
  return CITIES.find((c) => c.slug === slug);
}
