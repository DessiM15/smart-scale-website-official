Project: Smart Scale Website (Template Framework)
===============================================

Overview
--------
This scaffold bootstraps a new website using the provided design template. It keeps Tailwind via CDN and organizes custom CSS/JS for easy iteration.

Structure
---------
- public/
  - index.html — main page derived from the template with placeholders
  - assets/css/styles.css — custom overrides and future tweaks
  - assets/js/app.js — minimal interactivity (tabs, billing toggle, scroll animation hooks)

Usage
-----
Open the site locally:
1) macOS Finder: open public/index.html in your browser
2) Or via terminal:
   - python3 -m http.server --directory public 5173
   - Then visit http://localhost:5173

Where to Edit
-------------
- Branding: update logo href and background image in the header
- Hero: change heading/subheading and primary CTA label
- Features: update copy and wire feature-specific panels in app.js (feature-tabs)
- Pricing: adjust price points and copy; extend app.js to swap monthly/annual amounts
- Footer: replace links and social targets

Notes
-----
- The Unicorn Studio background is retained for parity; remove its script block if not required.
- Keep Tailwind CDN for speed; a build setup can be added later if needed.



