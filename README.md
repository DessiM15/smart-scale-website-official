# Smart Scale Website

Marketing site for **Smart Scale**, a boutique software and AI development studio based in Texas. Live at [smartscaleagent.com](https://smartscaleagent.com).

Built with Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · GSAP · Vercel.

---

## Running it

```bash
npm install
npm run dev     # http://localhost:3004
npm run build   # production build
npm start       # serve the build on http://localhost:3001
```

### Environment variables

Only the SMS verification flow needs configuration. Create `.env.local`:

```env
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15551234567
```

Everything else runs without secrets. See [SMS_SETUP.md](./SMS_SETUP.md) for the full Twilio walkthrough.

---

## Route structure

The app uses **two route groups**, and the distinction matters:

```
src/app/
  (main)/          → every public page. Wrapped by (main)/layout.tsx, which renders Navbar + Footer.
  (advertise)/     → /advertise. Standalone landing page, deliberately WITHOUT Smart Scale nav.
  api/sms/         → send-verification, verify-code (Twilio)
  layout.tsx       → fonts, global metadata, SmoothScrollProvider, SchemaOrg. No Navbar/Footer.
  globals.css      → Tailwind v4 config, theme tokens, animation classes
  sitemap.ts       → generated from projects + blog posts
  robots.ts

src/
  components/      → sections/, portfolio/, ui/, booking/, hero-backgrounds/
  data/            → projects.ts
  lib/             → blog.ts, constants.ts, verification-storage.ts
  hooks/           → useGSAPAnimations.ts, useScrollReveal.ts
```

> **Every new public page belongs in `src/app/(main)/`.** Creating `src/app/<route>/page.tsx` instead produces a route that resolves to the same path as its `(main)` twin — Next.js rejects this as parallel pages and the build fails with *"You cannot have two parallel pages that resolve to the same path."* It also silently drops the Navbar and Footer, since those live only in `(main)/layout.tsx`.

Public routes: `/`, `/what-we-do`, `/why-us`, `/services/[slug]`, `/portfolio`, `/portfolio/[slug]`, `/industries`, `/process`, `/company`, `/blog`, `/blog/[slug]`, `/contact`, `/toll-free-verification`, plus `/advertise`.

---

## Where the content lives

There is no CMS. All content is typed data in the repo:

| What | File |
|---|---|
| Portfolio projects | `src/data/projects.ts` |
| Blog posts | `src/lib/blog.ts` |
| Services (drives `/services/[slug]`) | `src/lib/constants.ts` |

### Adding a portfolio project

1. Add a `Project` object to the `projects` array in `src/data/projects.ts`. Array order is display order on `/portfolio`.
2. Drop a **1600×1000 `.webp`** at `public/assets/portfolio/<slug>/thumbnail.webp` — cards and detail heroes are `aspect-[16/10]`, so off-ratio images get cropped.
3. Optionally set `featured: true` with a `featuredOrder`. Featured projects appear in the homepage **Selected Work** grid and the hero gallery.

Both `/portfolio/[slug]` and `sitemap.xml` generate from this array — no other registration needed.

> Selected Work is a **two-column** grid. Keep the featured count **even** or the last row renders a single half-width orphan card.

Concept and spec pieces (work built to pitch, not sold) are labeled as such in their `description` and use `clientName: "<Name> (Concept)"`. Keep that convention — it prevents the portfolio from implying client relationships that don't exist.

---

## Design system

**Palette:** red `#DC2626`, near-black `#0A0A0A` / `#111111`, white. Defined in `BRAND_COLORS` (`src/lib/constants.ts`).

**Light/dark sections.** Pages alternate light and dark bands rather than committing to one mode. Mark each section with `data-theme="light"` or `data-theme="dark"`; `globals.css` keys off that attribute. Components that render on both backgrounds take a theme prop — `GlowCard` uses `theme="light" | "dark"` (note: `theme`, not `variant`), and `Badge` has a `default-light` variant.

**Fonts:** Inter (body), Playfair Display (display headings), Bebas Neue, Shadows Into Light — all loaded via `next/font/google` in the root layout.

**Motion:** GSAP with ScrollTrigger drives scroll reveals. Tag an element with `data-animate="fade-up" | "stagger" | "slide-left" | "slide-right" | "scale-reveal"` and the hooks in `src/hooks/` (`useGSAPAnimations`, `useScrollReveal`) wire it up — the initial hidden state lives in `globals.css`. Lenis handles smooth scrolling via `SmoothScrollProvider`, with `lenis.on("scroll", ScrollTrigger.update)` keeping the two in sync. See [GSAP_IMPLEMENTATION_REPORT.md](./GSAP_IMPLEMENTATION_REPORT.md).

Because reveals start at `opacity: 0`, content is invisible until ScrollTrigger fires — worth knowing when a section looks blank in a screenshot or headless browser.

---

## SEO

Per-page metadata via the App Router `metadata` export, `metadataBase` set to the production domain in the root layout. `sitemap.ts` and `robots.ts` generate at build time; `SchemaOrg.tsx` emits Organization structured data. Portfolio and blog detail pages are statically generated through `generateStaticParams`.

---

## Deployment

Vercel, deployed from `main`. `.vercelignore` excludes `legacy-template/` — the pre-Next.js scaffold, kept for reference only. Don't delete that ignore file or the dead template ships with every deploy.

---

## Other docs

- [PRD.md](./PRD.md) — product requirements: page specs, layout rules, interaction and animation constraints
- [SMS_SETUP.md](./SMS_SETUP.md) — Twilio configuration
- [BLOG_IMAGES_SETUP.md](./BLOG_IMAGES_SETUP.md) — blog cover image placement
- [GSAP_IMPLEMENTATION_REPORT.md](./GSAP_IMPLEMENTATION_REPORT.md) — scroll animation implementation notes
