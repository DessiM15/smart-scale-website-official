/**
 * Generates print-ready QR codes for the SEED links only.
 *
 *   npm run qr
 *
 * This is no longer the main way to make a QR code. Codes are created in the
 * tracker at /advertise/admin, which generates the artwork on demand and
 * supports a logo in the middle. This script covers only the fallback links
 * committed in src/lib/ads/advertisers.ts, and is kept for offline use.
 *
 * Writes assets/qr/<code>.svg (vector — use this for the slide artwork) and
 * assets/qr/<code>.png (2000px — for anything that can't take an SVG).
 *
 * Codes are encoded at error-correction level M with a wide quiet zone. These
 * get scanned off a TV from across a dining room, so the priorities are: short
 * URL, few modules, maximum contrast, and plenty of white space around it.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

const SITE = "https://smartscaleagent.com";
const OUT_DIR = path.join(process.cwd(), "assets", "qr");
const REGISTRY = path.join(process.cwd(), "src", "lib", "ads", "advertisers.ts");

const OPTIONS = {
  errorCorrectionLevel: "M",
  margin: 4,
  color: { dark: "#000000", light: "#FFFFFF" },
};

/**
 * Reads the codes straight out of the registry file rather than importing it,
 * so this stays a plain node script with no TypeScript build step.
 */
async function readLinks() {
  const source = await readFile(REGISTRY, "utf8");
  const links = [];
  const blocks = source.split(/\{\s*\n/).slice(1);
  for (const block of blocks) {
    const code = block.match(/^\s*code:\s*"([^"]+)"/m)?.[1];
    const advertiser = block.match(/^\s*advertiser:\s*"([^"]+)"/m)?.[1];
    const active = block.match(/^\s*active:\s*(true|false)/m)?.[1];
    if (code && advertiser && active === "true") links.push({ code, advertiser });
  }
  return links;
}

const links = await readLinks();

if (links.length === 0) {
  console.error("No active links found in src/lib/ads/advertisers.ts");
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

console.log(`\nGenerating ${links.length} QR code${links.length === 1 ? "" : "s"} → assets/qr/\n`);

for (const link of links) {
  const url = `${SITE}/go/${link.code}`;
  const svg = await QRCode.toString(url, { ...OPTIONS, type: "svg" });
  await writeFile(path.join(OUT_DIR, `${link.code}.svg`), svg);
  await QRCode.toFile(path.join(OUT_DIR, `${link.code}.png`), url, {
    ...OPTIONS,
    type: "png",
    width: 2000,
  });
  console.log(`  ${link.code.padEnd(12)} ${url.padEnd(42)} ${link.advertiser}`);
}

console.log(`
These are the seed links only — create real advertiser codes in the tracker at
/advertise/admin, where you can also add a logo and download the artwork.

Before printing or loading a slide:
  1. Scan the PNG off your own screen with your phone — confirm it lands right.
  2. On the slide, keep the QR at least 15% of the frame width and leave the
     white border intact. Never place it on a photo or a colored panel.
  3. Add a line of text next to it — "Scan for the offer" — codes with no
     instruction get ignored.
`);
