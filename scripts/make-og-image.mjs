/**
 * Generates public/og-image.png — the 1200x630 card shown when a link to the
 * site is shared (Facebook, LinkedIn, iMessage, Slack, X).
 *
 * Every page's `openGraph.images` points at this file. It was referenced but
 * never existed, so every shared link previewed blank.
 *
 * Re-run with:  node scripts/make-og-image.mjs
 */

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOGO = join(root, "public/assets/smart-scale-logo-official.png");
const OUT = join(root, "public/og-image.png");

const W = 1200;
const H = 630;
const LOGO_SIZE = 132;

/**
 * The source logo is dark artwork on transparency; the site renders it with
 * `brightness-0 invert` to get a white mark. Reproduce that here by keeping
 * the alpha channel and replacing the colour with pure white.
 */
async function whiteLogo(size) {
  const fitted = await sharp(LOGO)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const alpha = await sharp(fitted).extractChannel("alpha").toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer();
}

const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

const background = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="18%" cy="12%" r="62%">
      <stop offset="0%" stop-color="#DC2626" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#DC2626" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="#0A0A0A"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Headline -->
  <text x="80" y="330" font-family="${FONT}" font-size="66" font-weight="700"
        fill="#FFFFFF" letter-spacing="-1.5">Websites That Get</text>
  <text x="80" y="404" font-family="${FONT}" font-size="66" font-weight="700"
        fill="#FFFFFF" letter-spacing="-1.5">Houston Businesses Found</text>

  <!-- Supporting line -->
  <text x="80" y="470" font-family="${FONT}" font-size="27" font-weight="400"
        fill="#FFFFFF" fill-opacity="0.55">Web design &amp; local SEO for local businesses</text>

  <!-- Service areas, echoing the site's uppercase tracked style -->
  <text x="80" y="545" font-family="${FONT}" font-size="19" font-weight="500"
        fill="#FFFFFF" fill-opacity="0.38" letter-spacing="3.4">KATY · CYPRESS · HOUSTON · SUGAR LAND</text>

  <!-- Red accent rule -->
  <rect x="80" y="497" width="88" height="3" fill="#DC2626"/>
</svg>
`);

const logo = await whiteLogo(LOGO_SIZE);

await sharp(background)
  .composite([{ input: logo, top: 74, left: 74 }])
  .png()
  .toFile(OUT);

const { width, height, size } = await sharp(OUT).metadata();
console.log(`Wrote ${OUT}`);
console.log(`  ${width}x${height}, ${(size / 1024).toFixed(0)} KB`);
