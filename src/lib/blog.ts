export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  coverImage: string;
  coverImageAlt: string;
  category: string;
  readTime: string;
  content: string;
  metaDescription: string;
}

/**
 * Posts are written for the Houston-metro market first, because that is
 * where the search demand is. The 2024 posts about offshore development
 * and MVPs were retired on 2026-09-21; their URLs redirect to /blog.
 *
 * House rules: no prices in copy (Dessi's call, 2026-09-21), no em dashes,
 * and every claim about a client project must match its case study.
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-much-does-a-website-cost-katy-houston",
    title: "How Much Does a Website Cost in Katy and Houston?",
    excerpt:
      "Nobody local answers this honestly, so here is how the price of a website is actually decided: the three kinds of projects we quote, what moves the number up, what should never cost extra, and what to watch for in someone else's quote.",
    author: "Smart Scale",
    date: "2026-09-21",
    coverImage: "/assets/website-cost-katy-houston",
    coverImageAlt: "Dining room at Mex Taco House in Cypress, TX, with a client's ad playing on the wall TVs",
    category: "Pricing",
    readTime: "7 min read",
    metaDescription:
      "How much does a website cost in Katy or Houston? What actually sets the price of a landing page, a business website, or an app, what should be included, and what to watch for in a quote.",
    content: `
# How Much Does a Website Cost in Katy and Houston?

If you have asked three web designers in the Houston area for a price, you probably got three numbers that had nothing to do with each other, and no explanation of why. This is the explanation.

We do not publish a price list, and this guide will not give you one. Not because the numbers are secret, but because a price without a scope is a guess, and a guess is how projects go wrong. What we can do is show you exactly how we decide the number, so that when you get a quote from us or from anyone else, you know what you are looking at.

## The three kinds of projects we quote

Almost every request we get from a Katy, Cypress, or Houston business is one of these.

### A landing page

One page, one offer, one action. A landing page exists to get a visitor to call, book, or fill out a form. It is what you want for a single service, a launch, an event, or an ad campaign, and it is the fastest thing to build.

Two of ours: [Lomeli Financial](/portfolio/lomeli-financial), a financial advisory practice that needed a credible page and a way to reach out, and [Ascension Athlete Group](/portfolio/ascension-athlete-group), an athlete development company that launched with a single page explaining its three programs and taking inquiries.

### A business website

Five to ten pages: home, services, about, contact, and whatever your customers need to see before they trust you, such as a gallery, a menu, reviews, or a booking flow. This is what most local businesses actually need, and it is where most of our work is.

[Taylor Made Esthetics](/portfolio/taylor-made-esthetics), [Gulf Coast Alloys](/portfolio/gulf-coast-alloys), and [Andre Thomas Law](/portfolio/andre-thomas-law) are all business websites, and they are very different sizes. The law firm's site has sixteen practice-area pages and every page in both English and Spanish. That is why two "business websites" can have very different prices.

### An app or custom software

A mobile app, a customer portal, a CRM shaped around your pipeline, a tool that replaces the spreadsheet your whole team depends on. These are bigger projects with more moving parts, and they are quoted after a longer conversation than a website needs.

[Bloxify](/portfolio/bloxify) is a full mobile game with a subscription. [Botmakers CRM](/portfolio/botmakers-crm) is an agency's pipeline and invoicing tool. [Repo911](/portfolio/repo911) is a case management platform. None of those is a website, and none of them is priced like one.

## What moves the price up

Within each of those, the number is decided by a short list of things. If you want to know why one quote is higher than another, it is almost always one of these.

- **How many pages, and how different they are.** Ten pages with the same layout cost less than five pages that each need their own design.
- **Features beyond information.** Online booking, ordering, payments, a customer login, a quote calculator. Each one is real software inside the site.
- **A second language.** A bilingual site is not a translation pasted in. Every page exists twice and has to be found twice.
- **Content.** If you have your copy, photos, and logo ready, the project is faster. If we are writing your copy and sourcing your photography, that is work, and it is in the quote.
- **Connections to other tools.** Your booking system, your point of sale, your email list, your CRM. Each connection is built and tested.
- **Timeline.** Most of our sites go live in one to two weeks. A site that has to launch by Friday costs more than one that launches when it is ready.

## What should never cost extra

Some things are the job, not an upgrade. If a quote lists any of these as add-ons, ask why.

- **A site that works on a phone.** Most local searches in Houston happen on one. Mobile-first is the baseline, not a feature.
- **The basics of being found on Google.** Page titles that say what you do and where, a sitemap, the structured data Google reads, and your Google Business Profile matched to the site. Every site we build ships with this.
- **Contact that actually reaches you.** A form that lands in your inbox, a phone number that dials on tap.
- **Your own domain and hosting set up in your name.** You should own the address people type in.
- **Ownership of the site.** When we are done, the code and the content are yours. No monthly fee to keep what you paid for.
- **Fixes after launch.** Something will need adjusting in the first weeks. That is part of delivering the site, not a support contract.

## What to watch for in a quote

A few things we see Houston-area businesses get caught by.

- **A low price with a monthly platform fee.** Some quotes are cheap because you are renting the site. Add up three years of the monthly fee before you compare.
- **"SEO included."** Ask what that means, specifically. If the answer is vague, it means the page titles were filled in.
- **A template described as custom.** There is nothing wrong with a template if you know that is what you are buying. There is something wrong with paying custom prices for one.
- **The domain registered in someone else's name.** If you ever leave, you should be able to take your address with you. Check whose name is on it.
- **No live examples.** Anyone can show a mockup. Ask for sites that are live today, for real businesses, and click through them on your phone.

## How long it takes

A landing page is usually days. A business website is one to two weeks from the first call to launch, if the content is ready. One client had two sites done in eight days from the first conversation; another had theirs live in under a week. Both are [reviews on our Google profile](/#reviews-heading), in their words. Apps and custom software take longer and are scoped before we commit to a date.

## How to get a number

One call, usually thirty minutes. Bring what you have: your current site if there is one, a couple of sites you like, and a clear idea of what you want a visitor to do when they land. You will leave the call with a scope and a price, in writing, and no obligation.

[Start the conversation](/contact), or see what we have built for businesses in [Katy](/web-design/katy), [Cypress](/web-design/cypress), and [Houston](/web-design/houston) first.
`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getAllBlogPosts(): BlogPost[] {
  return BLOG_POSTS.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

