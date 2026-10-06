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
  /**
   * The title tag, when it should differ from the headline. Used exactly as
   * written, without the site-name suffix, so it can be held to 60 characters.
   */
  metaTitle?: string;
  /**
   * Replaces the closing "Book a call" box, for a post that is selling
   * something other than a website. The link is a path on this site.
   */
  cta?: { heading: string; body: string; label: string; href: string };
}

/**
 * Posts are written for the Houston-metro market first, because that is
 * where the search demand is. The 2024 posts about offshore development
 * and MVPs were retired on 2026-09-21; their URLs redirect to /blog.
 *
 * House rules: no prices in copy (Dessi's call, 2026-09-21), no em dashes,
 * and every claim about a client project must match its case study.
 *
 * The one exception on prices is the Mex Taco House ad rates post, which
 * Dessi asked for on 2026-10-05. Its numbers are a copy of PLANS in
 * src/lib/ads/roster.ts and have to change with them.
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "mex-taco-house-advertising-rates",
    title: "NEW Ad Rates at Mex Taco House: Now From $175 a Month!",
    metaTitle: "New Mex Taco House Ad Rates: From $175 a Month",
    excerpt:
      "We updated our prices! Put your business on the screens at Mex Taco House in Cypress from $175 a month, with no setup fee and $100 off when you pay in full. Here are the new rates and why restaurant ads work.",
    author: "Smart Scale",
    date: "2026-10-05",
    coverImage: "/assets/mex-taco-house-advertising-rates",
    coverImageAlt: "A full dining room at Mex Taco House in Cypress, TX, with a client's ad playing on the wall screens",
    category: "Advertising",
    readTime: "2 min read",
    metaDescription:
      "New advertising rates at Mex Taco House in Cypress, TX: $175 a month on 12 months, $200 on 6, $225 on 3. No setup fee, and $100 off when you pay in full.",
    cta: {
      heading: "Want your business on the screens?",
      body: "Tell us about your business and we will send you a free mockup of your ad within 24 hours. No obligation.",
      label: "See the ad packages",
      href: "/advertise",
    },
    content: `
Big news from the taco line: **we updated our prices!** Putting your business on the screens at Mex Taco House in Cypress just got a whole lot easier on the budget.

And no, this is not a flash sale. These are the new everyday rates.

## The new rates

- **12 months: $175 a month** (was $250). Best value!
- **6 months: $200 a month** (was $275)
- **3 months: $225 a month** (was $300)

**No setup fee on any plan.** Want to save even more? Pay your full package upfront and take **$100 off**.

Every plan gets the same screens and the same perks. The longer you run, the less you pay each month, and your rate is locked in for your whole term.

[See the packages and claim your spot](/advertise)

![An event venue's ad playing on a screen at Mex Taco House in Cypress](/images/screen-events.jpg)

## Why restaurant ads work

- **Nobody can scroll past you.** People waiting on tacos look up. On a busy Saturday the wait can run up to 45 minutes, and your ad is on the wall the whole time.
- **Your ad plays 20 times an hour.** Every three minutes, every day the restaurant is open. That adds up to 10,000+ impressions a month.
- **These are your neighbors.** The room is full of Cypress locals, the people most likely to walk through your door next.
- **You are the only one in your category.** One business per category. Take the spot and your competitor can't have it.
- **We design the ad for you.** No designer, no stress. Send us your details and we make it look good.

![A packed dining room at Mex Taco House with the ad screens on the far wall](/images/dining-room.jpg)

## Spots are limited

There are only so many spots in the rotation, and it is first come, first serve. Once your category is taken, it's taken.

Ready to see your business up there? [Check out the ad packages](/advertise) and we will send you a free mockup of your ad within 24 hours.
`,
  },
  {
    slug: "what-is-seo-katy-houston",
    title: "What Is SEO? A Plain-English Guide for Katy & Houston Businesses",
    metaTitle: "What Is SEO? A Plain-English Guide for Katy & Houston",
    excerpt:
      "SEO is everything you do to help Google pick your business when someone searches for what you offer. The three things Google looks at, how the map pack works for Katy and Houston businesses, and a quick checklist for your own site.",
    author: "Smart Scale",
    date: "2026-10-01",
    coverImage: "/assets/what-is-seo-katy-houston",
    coverImageAlt: "Dark cover reading Get into Google's top 3, part 1 of the SEO series, with a red map pin for the Google map pack",
    category: "SEO",
    readTime: "5 min read",
    metaDescription:
      "SEO explained in plain English: the 3 things Google uses to rank websites, plus how Katy and Houston businesses get into the Google map pack.",
    content: `
## What is SEO, really?

SEO (search engine optimization) is everything you do to help Google pick your business when someone searches for what you offer. That's it.

Think of Google as a librarian. Someone walks up and asks, "Who does roof repair near me?" The librarian has a split second to pick the best answer out of millions of websites. SEO is making sure your website is the one the librarian hands over.

If you own a business in [Katy](/web-design/katy), [Cypress](/web-design/cypress), or [Houston](/web-design/houston), this matters more than most marketing you can pay for. People searching Google are already looking for what you sell. You just need to be the business they find.

## The 3 things Google looks at

There are hundreds of small ranking signals, but nearly all of them fall into three buckets. Miss any one, and you lose customers to the business that has it.

### 1. Relevance: does your site answer the search?

Google can only match you to a search if your website actually says the words people search for. If someone searches "wedding cakes in Houston" and your site never mentions wedding cakes or Houston, Google won't connect the two.

What helps:

- A main headline (H1) that says exactly what you do and where, like "Roof Repair in Katy, TX" instead of "Welcome to Our Website"
- One page for each service you offer, not one page listing everything
- Being known for something specific. "Custom wedding cakes in Houston" ranks. "Bakery" is too vague to win.

### 2. Technical: can Google actually read your site?

Even great content gets pushed down if the site behind it is slow, broken, or hard to use on a phone. Most local searches happen on mobile, so Google pays close attention to how your site performs there.

What helps:

- Pages that load fast on a phone
- No broken links or error pages
- Clean page titles and descriptions so Google knows what each page is about
- A site that's accessible to everyone, including people using screen readers

### 3. Authority: does anyone vouch for you?

Google trusts businesses that other people trust. Reviews, links from other websites, and accurate listings in directories all act like references on a job application.

What helps:

- Steady Google reviews, ideally ones that mention the service and city ("they fixed our roof in Katy fast")
- Links from local organizations, partners, or news sites
- The same business name, address, and phone number everywhere you're listed

## The Google map pack: the spot local businesses want most

Search "coffee shop near me" and you'll see a map with three businesses under it. That's the map pack, and for a local business it's often worth more than the regular results below it.

Google says local results are based on three factors: relevance, distance, and prominence. In plain terms, that's the same three things above, plus how close you are to the person searching. You can't move your building, but you can control the rest.

To give yourself the best shot:

- Claim and fully fill out your Google Business Profile
- Pick the main category that matches what your homepage is about
- Make sure your name, address, and phone number match your website exactly
- Link your profile to your website, and post updates regularly
- Keep reviews coming in and reply to them

When your website and your Google profile tell the same story, Google trusts you more. That trust is what moves you into the top three.

## Quick SEO checklist for your website

- My homepage headline says what I do and what city I serve
- Each service has its own page
- My site loads fast and works well on a phone
- My name, address, and phone match on my site and Google profile
- My Google Business Profile links to my website
- I'm getting new Google reviews every month

Couldn't check every box? That's normal, and it's fixable.

## Want someone to look at yours?

At Smart Scale, we build websites for Katy, Cypress, and Houston businesses with local SEO built in from day one: page titles, city pages, schema, and your Google Business Profile matched to the site. It's part of the build, not an add-on. If budget is the question, start with [how much a website costs in Katy and Houston](/blog/how-much-does-a-website-cost-katy-houston).

[Book a free call](https://calendar.app.google/b1gQXqqNLL9CsJjr6) and we'll walk through where your site stands and what would move the needle. Or call us at [832.790.5001](tel:+18327905001).

This is part 1 of our SEO series for small business owners. Next up: how to set up your website and Google profile to land in the map pack.

## Frequently asked questions

### What does SEO stand for?

SEO stands for search engine optimization. It's the work of making your website easy for Google to understand, trust, and show to the right people.

### How long does SEO take to work?

Most businesses start seeing movement in a few months, depending on competition in their area and how much needs fixing. Local SEO for a specific city usually moves faster than ranking nationally.

### What is the Google map pack?

It's the map and the top three local businesses Google shows for searches like "plumber near me." Google ranks those businesses on relevance, distance, and prominence.

### Do I need a website if I have a Google Business Profile?

Yes. Your profile and your website work together. The website gives Google the detail it needs to understand what you do, and a matching profile and site builds trust.

### Can I do SEO myself?

You can handle the basics, like the checklist above. The technical side and building authority take more time and know-how, which is where an agency helps.
`,
  },
  {
    slug: "ada-website-compliance-houston-business",
    title: "Does Your Houston Business Website Need to Be ADA Compliant?",
    excerpt:
      "A business website is open to the public the way a front door is, and the same lawsuits that hit restaurants, law firms, and shops in other states reach Houston too. What the standard actually requires, the six things that fail most often, and a five-minute check you can do yourself.",
    author: "Smart Scale",
    date: "2026-09-25",
    coverImage: "/assets/ada-website-compliance-houston",
    coverImageAlt: "Dark cover reading Is your website ADA compliant, with the WCAG 2.2 Level AA standard and the 4.5 to 1 minimum text contrast",
    category: "Compliance",
    readTime: "5 min read",
    metaDescription:
      "Does a Houston business website have to be ADA compliant? What WCAG 2.2 AA actually requires, who gets sued and why, the six failures we see most on local sites, and a five-minute self-check.",
    content: `
If you own a restaurant, a law office, a salon, or a shop in the Houston area, your website is open to the public the same way your front door is. The Americans with Disabilities Act says places open to the public have to be usable by people with disabilities, and courts and the Department of Justice have treated business websites as part of that for years. This guide explains what that means, who actually gets sued, and how to check your own site in five minutes.

This is not legal advice. It is what we have learned building and checking local business websites, written so you can decide what to do without hiring anyone first.

## What "compliant" actually means

The ADA does not mention websites, so there is no government checklist. Instead, courts and settlement agreements point to a technical standard called WCAG, the Web Content Accessibility Guidelines, published by the same group that maintains the rules of the web itself. It comes in three levels, and Level AA is the one that counts. The current version is WCAG 2.2.

In practice, a site meets that standard when four things are true. A blind person using a screen reader can hear everything a sighted person can see, including what is in the pictures. Someone who cannot use a mouse can reach every link, button, and form field with the keyboard and can see where they are. Text is readable for people with low vision, which mostly means enough contrast between the text and its background. And nothing moves, flashes, or times out in a way the visitor cannot control.

## Who gets sued, and why it is rarely personal

A few thousand of these lawsuits are filed in federal court every year, plus many more demand letters that never become a public case. Most come from a small number of law firms that use automated scanners to find sites that fail the basics, then send the same letter to hundreds of businesses at a time. Restaurants, retail, hotels, and professional services are the most common targets, because they are open to the public and easy to find.

Texas sees fewer of these than New York, California, or Florida, but the letters are not limited by state. The realistic risk for a small local business is not a courtroom. It is a letter demanding a settlement that costs less than fighting it. The way to avoid that is to not be the easy target.

## The six things that fail most often

We ran the same kind of scan those firms use against a set of Houston-area business websites this month. The same handful of problems came up every time.

- **Text that is too faint.** Light gray on white, or dim gray on black, especially in footers, captions, and small labels. This is the single most common failure, and it is almost always a design choice that a slightly darker shade corrects.
- **Buttons and links with no name.** A search icon, a slider arrow, or a social media logo with nothing behind it for a screen reader to read. The visitor hears "button" and nothing else.
- **Invisible keyboard focus.** Many templates remove the outline that shows a keyboard user where they are on the page. Without it, the site cannot be used without a mouse.
- **Pictures with no description.** Menu photos, product shots, and team portraits with no alt text, or alt text that is just the file name.
- **Headings out of order.** Screen reader users skim a page by its headings the way sighted users skim by eye. A page with two titles, or with levels that skip, is a page they cannot skim.
- **Things that move on their own.** Auto-playing video, scrolling promo bars, and slideshows with no pause button. Anything that moves for more than five seconds needs a way to stop it.

## A five-minute check you can do yourself

- **Put your mouse away.** Press Tab repeatedly on your home page. You should see a visible outline move from link to link, and you should be able to reach your menu, your contact form, and your order button. If the outline disappears, or you get stuck, that is a failure.
- **Look at your footer and your smallest text.** If you have to squint, so does everyone else.
- **Ask about your pictures.** Whoever built your site should be able to tell you whether every image has a written description behind it.
- **Watch your home page for ten seconds without touching it.** If something is still moving, look for a pause button.
- **Open the site on your phone and tap the small things.** Social icons, slider dots, close buttons. If you miss, the target is too small.

If you fail two or more of these, a scanner will find more. Our [free website check](/check?source=ada-blog) runs one on your site in about a minute.

## What about those accessibility widgets

You have probably seen the small accessibility icon in the corner of some sites. Those overlay widgets promise compliance for a monthly fee and do not deliver it. They cannot fix missing image descriptions or unnamed buttons, screen reader users turn them off because they get in the way, and sites running them are named in lawsuits every month. The problems have to be fixed in the site itself.

## What fixing it involves

Less than most owners expect. On a well-built site it is a color pass to darken faint text, names for icon buttons, a visible focus style, descriptions on images, and a pause control for anything that moves. That is a day or two of careful work, not a rebuild. An older template site can take more, but even then the scan says exactly what to change. Either way you end up with a site that is easier for everyone to use.

A short accessibility statement page, saying what standard you aim for and how to report a problem, is also worth adding. It costs nothing, and it shows good faith to anyone looking.

## Find out where your site stands

Run the free check on your own site. It takes about a minute, and the report comes to your inbox in plain words: what gets in a visitor's way and what makes you harder to find on Google. No cost and no obligation.

{{website-check}}
`,
  },
  {
    slug: "how-much-does-a-website-cost-katy-houston",
    title: "How Much Does a Website Cost in Katy and Houston?",
    excerpt:
      "Nobody local answers this honestly, so here is how the price of a website is actually decided: the three kinds of projects we quote, what moves the number up, what should never cost extra, and what to watch for in someone else's quote.",
    author: "Smart Scale",
    date: "2026-09-21",
    coverImage: "/assets/website-cost-katy-houston",
    coverImageAlt: "Andre Thomas Law website homepage, built by Smart Scale",
    category: "Pricing",
    readTime: "7 min read",
    metaDescription:
      "How much does a website cost in Katy or Houston? What actually sets the price of a landing page, a business website, or an app, what should be included, and what to watch for in a quote.",
    content: `
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

