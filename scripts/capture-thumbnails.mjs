/**
 * Portfolio Thumbnail Capture Script
 * Usage: node scripts/capture-thumbnails.mjs
 */

import puppeteer from "puppeteer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECTS = [
  { slug: "bloxify-landing", url: "https://bloxify.app" },
  { slug: "lomeli-financial", url: "https://jorge-lomeli-financial.vercel.app" },
  { slug: "teachers-pension", url: "https://teachers-retirement-three.vercel.app" },
  { slug: "gulf-coast-alloys", url: "https://gca-2-blond.vercel.app" },
  { slug: "botmakers-crm", url: "https://botmakers-crm.vercel.app" },
  { slug: "botmakers-website", url: "https://botmakers.ai" },
  { slug: "taylor-made-esthetics", url: "https://taylor-made-esthetics.vercel.app" },
  { slug: "fight-my-repo", url: "https://fight-my-repo.vercel.app" },
  { slug: "repo911", url: "https://repo-911.vercel.app" },
  { slug: "valor-financial", url: "https://phil-valor-recruitment.vercel.app" },
  { slug: "apex-affinity-group", url: "https://apexpulsemarket.com" },
  { slug: "mex-taco-house", url: "https://mextacohouse.com" },
  { slug: "the-houston-barber", url: "https://barber-website-mock.vercel.app" },
];

const OUTPUT_DIR = path.resolve(__dirname, "../public/assets/portfolio");

/**
 * Portfolio images have descriptive filenames (e.g.
 * houston-barbershop-website-design.webp) because Google reads the image path
 * as a relevance signal. Those names live in src/data/projects.ts, so read
 * them from there rather than hardcoding one — otherwise a capture run
 * reintroduces thumbnail.webp and orphans the real file.
 */
const THUMBNAIL_PATHS = (() => {
  const src = fs.readFileSync(
    path.resolve(__dirname, "../src/data/projects.ts"),
    "utf8",
  );
  const map = {};
  const re = /slug:\s*"([^"]+)"[\s\S]*?thumbnailImage:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src)) !== null) map[m[1]] = m[2];
  return map;
})();

function outputPathFor(slug) {
  const known = THUMBNAIL_PATHS[slug];
  if (!known) {
    // Skip rather than throw: one stale slug shouldn't abort a whole run.
    console.warn(
      `  [skip] "${slug}" has no thumbnailImage in src/data/projects.ts — ` +
        `add it there first so the filename stays in sync.`,
    );
    return null;
  }
  // thumbnailImage is a public-relative URL like /assets/portfolio/x/y.webp
  return path.resolve(__dirname, "../public", known.replace(/^\//, ""));
}

async function generatePlaceholder(slug, title) {
  const outputPath = outputPathFor(slug);
  if (!outputPath) return;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const safeName = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const svg = `
    <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      <rect width="1920" height="1080" fill="#111111"/>
      <text x="960" y="540" font-family="Arial, sans-serif" font-size="64"
        fill="#333333" text-anchor="middle" dominant-baseline="middle">
        ${safeName}
      </text>
    </svg>
  `;

  await sharp(Buffer.from(svg)).webp({ quality: 85 }).toFile(outputPath);
  console.log(`  [placeholder] ${slug}`);
}

async function captureScreenshot(browser, slug, url) {
  const outputPath = outputPathFor(slug);
  if (!outputPath) return;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    console.log(`  [loading] ${slug} -> ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    // Wait for animations to settle
    await new Promise((r) => setTimeout(r, 3000));

    const pngBuffer = await page.screenshot({ type: "png" });
    await sharp(pngBuffer).webp({ quality: 85 }).toFile(outputPath);
    console.log(`  [captured] ${slug}`);
  } catch (error) {
    console.error(`  [error] ${slug}: ${error.message}`);
    await generatePlaceholder(slug, slug.replace(/-/g, " "));
  } finally {
    await page.close();
  }
}

async function main() {
  console.log("Starting thumbnail capture...\n");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // Generate placeholder for bloxify (no live URL)
  await generatePlaceholder("bloxify", "Bloxify");

  // Capture all projects
  for (const project of PROJECTS) {
    await captureScreenshot(browser, project.slug, project.url);
  }

  await browser.close();
  console.log("\nDone! All thumbnails saved to public/assets/portfolio/");
}

main().catch(console.error);
