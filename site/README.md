Next.js + TypeScript + Tailwind (v4) + shadcn/ui
================================================

Getting Started
---------------
Install (already done by scaffold), then run the dev server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

What’s Included
---------------
- Next.js App Router (src/app)
- TypeScript
- Tailwind CSS (v4, configless)
- shadcn/ui with base components:
  - Button, Card, Navigation Menu, Tabs

Editing
-------
- Main page: `src/app/page.tsx`
- shadcn components: `src/components/ui/*`
- Globals: `src/app/globals.css`

Adding More UI
--------------
Use the CLI:
```bash
npx shadcn@latest add accordion alert avatar badge breadcrumb calendar dropdown-menu input label modal select skeleton textarea toast tooltip
```

Deployment
----------
```bash
npm run build
npm run start
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
