SMART SCALE

Product Requirements Document
Version 1.0

1. Executive Summary

Smart Scale is a boutique software and AI development studio based in Texas. The purpose of the Smart Scale website is to present the company as a corporate-level, highly capable, premium development partner. The website should convey confidence, technical sophistication, and operational excellence through a minimalist, structured, and visually clean design language. Large spacing, bold typography, and a strong red, black, and white palette define the interface.

The site’s role is to convert qualified visitors into estimate requests by providing clear service definitions, strong portfolio credibility, and a full understanding of Smart Scale's capabilities.

The PRD defines all required pages, components, layout rules, responsive behavior, interactions, animations, and design constraints.

2. Branding and Visual Direction
2.1 Color Palette

Primary Black: #000000

Primary Red: #DC2626

White: #FFFFFF

Light Gray for dividers and subtle text: rgba(255,255,255,0.60)

No gradients unless created from black to slightly softer black.
No blue or purple tones anywhere.

2.2 Typography

Typography must be modern, structured, and corporate.
Recommended families (choose one and apply consistently):

Inter

IBM Plex Sans

Satoshi

Space Grotesk

Helvetica Now

Font weight guidelines:

Headings: 600–700

Subheadings: 500

Body Text: 300–400

Buttons: 500–600

2.3 Layout Style

Generous whitespace

Boxy section containers

Strong left-aligned or center-aligned structure

Clear visual hierarchy

Distinct content blocks separated by spacing rather than borders

Red used sparingly for accents and CTA buttons

2.4 Visual Tone

The tone should feel:

Corporate

Modern

Efficient

Futuristic without relying on gradients or bright neon

Minimalistic and clean

High-end and enterprise-ready

3. Website Architecture

The website includes six primary pages:

Home

What We Do

Portfolio

Company (About + Why Smart Scale)

Contact

Request Estimate (button in navbar linking to Contact or a dedicated estimate form)

4. Page Requirements

================================================================

4.1 Home Page
Purpose

Provide a strong first impression, clearly present service offerings, industries served, and client credibility, and guide visitors toward submitting an estimate request.

Sections
1. Hero Section

Large centered or left-aligned headline:
"Enterprise Software. AI Systems. Digital Transformation."

Subheadline:
"Custom-built solutions for businesses requiring precision and performance."

Primary CTA: "Request Estimate"

Secondary CTA: "View Portfolio"

Background: subtle animated black backdrop or micro-motion ribbon effect using red tone

No overlaid decorative gradients

2. Services Overview

Grid of service cards (2–4 per row depending on screen size).
Each card includes:

Icon (white or outlined in red)

Title

One-sentence description

Hover state: slight lift, border in red, or subtle shadow

Services list:

Mobile Development

Web Development

Staff Augmentation

Email Client Development

Enterprise Systems

AI Enhancement / AI Workflows

Web Applications

Integrations and Automation

3. Industries We Serve

Grid or horizontally scrollable block with industry categories:

Law Firms

Restaurants

Hospitality

Medical Practices

Financial Services

Home Services (HVAC, Roofing, Plumbing)

Real Estate Professionals

Insurance

Non-Profits and Charity Organizations

Beauty, Aesthetics, and Salon Industry

Each card includes:

Icon

Label

One-sentence description

4. Our Clients

Logo strip containing:

Arbor Cove Funding

Law Office of Sylvester R. Jamie

Mex Taco House

Angels Churros N’ Chocolate

5. Have Questions / Contact Strip

Simple form: Name, Email, Phone, Message

Black background with white text

Red button

Contact details displayed clearly

================================================================

4.2 What We Do Page
Purpose

Provide a structured overview of all capabilities and processes.

Sections
1. Header

Title: "What We Do"

Short paragraph defining capabilities

2. Capabilities Grid

Each capability card matches styling from Services on the Home page.

Capabilities:

Mobile Development

Web Development

Cross-Platform Apps

Staff Augmentation

AI Workflow Automation

Enterprise Systems

Web Applications

Integrations and API Workflows

3. Technologies Used

Icon row or grid featuring:

JavaScript

React

Next.js

Node.js

Python

Postgres

Vercel
(Actual icons depend on your stack)

4. Process Overview

Box-style layout with 3–5 steps:

Discovery

Planning

Development

Testing

Deployment

Each section includes a short description.

5. CTA Banner

Black or white section with strong red button:
"Request Estimate"

================================================================

4.3 Portfolio Page
Purpose

Visually replicate the layout style of MercuryDev’s portfolio while using Smart Scale’s visual identity.

Required Features
1. Category Filter Bar

Horizontal bar with category filters.
Categories include:

All Projects

Mobile

Web

Staff Augmentation

Enterprise Systems

AI / Automation

eCommerce

Healthcare

Finance

Food Service

Legal

Non-Profit

2. Portfolio Grid

3 or 4 columns on desktop

2 columns on tablet

1 column on mobile

Each tile includes:

Client logo

Background image or color block

Optional short description

CTA (Success Story →)

Hover state:

Dark overlay

Client name turns white

CTA becomes visible

3. Case Study Template (optional future enhancement)

Single page design pattern:

Project overview

Process

Results

Technologies used

Screenshots

================================================================

4.4 Company Page
Purpose

Introduce Smart Scale as a corporate-level development partner, moving away from “husband & wife team” framing.

Sections
1. About Smart Scale (Rewrite)

Smart Scale is a Texas-based enterprise development studio specializing in custom software, AI workflows, automation systems, and digital infrastructure. Our approach combines engineering precision with a high-touch client experience. Every project is led directly by the company’s owners to ensure consistent communication, accurate execution, and fast decision-making.

We are committed to delivering structured, reliable, and scalable solutions that support long-term growth for businesses across multiple industries.

2. Why Smart Scale

Key points:

Direct communication with founders

High accountability

No outsourcing, no middle layers

Flexible and resource-efficient

Fast turnaround times

Proven across multiple industries

Corporate reliability with boutique service

3. Core Values

Precision

Communication

Transparency

Innovation

Client Partnership

4. Optional: Team Photos (corporate, clean, neutral backgrounds)

================================================================

4.5 Contact Page
Requirements

Page header: “Contact Smart Scale”

Contact form fields:
Name
Email
Phone
Message

Submit button (red)

Email displayed

Phone displayed

Optional: embedded map

Optional: scheduling link

================================================================

4.6 Request Estimate (Button Behavior)

Always visible in navbar

Desktop: red pill-like button

Mobile: included in mobile menu

Links to Contact page or dedicated estimate form

Form fields must load quickly and be responsive

5. Components

A full component inventory will later be generated for Cursor.
Initial list:

Navbar

Mobile Menu

Hero Section

Service Cards

Industry Cards

Logo Strip

Portfolio Filters

Portfolio Cards

Contact Form

Text Blocks

CTA Blocks

Footer

Animated Loader

Ribbon Background Effect

Page Containers

Section Wrappers

6. Responsive Requirements
Desktop

Full layout grid

Large whitespace

3–4 column portfolio grid

Navigation expanded

Tablet

Navigation collapses

2-column grids

Mobile

Single column everywhere

Full-width buttons

Hamburger menu

Text resized

Section padding reduced

Animations reduced for performance

7. Interaction Requirements

Hover elevation on cards

Red borders on hover states

Smooth scroll

Ribbon animation subtle and lightweight

Loader duration 1.6–2.2 seconds

Portfolio filters animate instantly

Page transitions should be simple fades

8. Performance Requirements

All images optimized

Lazy loading

Preload hero elements

Avoid unnecessary JavaScript

Must score well on Core Web Vitals

9. Technical Specifications (for Cursor)

Framework: Next.js

Styling: TailwindCSS or CSS Modules per your Cursor setup

Deployment: Vercel

Components modular, re-usable

File structure should be clean and predictable

10. SEO Requirements

Semantic HTML

Title tags and meta for each page

Open Graph tags

Alt text

Sitemap.xml

Robots.txt

11. Quality Checklist

No gradients except black variations

No blue or purple tones

All spacing consistent

Buttons consistent

Typography consistent

Responsive on all device sizes

Full accessibility (WCAG AA)

All text free from emojis

The PRD is now ready for final template integration.

When you are ready, provide any of the following and I will integrate them:

Template ID or reference from Cursor

Section screenshots

Updated copywriting

Additional components you want

Any animations to add or refine