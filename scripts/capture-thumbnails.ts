/**
 * Portfolio Thumbnail Capture Script
 *
 * Usage:
 *   npx ts-node scripts/capture-thumbnails.ts
 *
 * Prerequisites:
 *   npm install -D puppeteer sharp
 *
 * This script captures 1920x1080 screenshots of all portfolio project URLs
 * and converts them to WebP format for optimal loading.
 */

import puppeteer from "puppeteer";
import sharp from "sharp";
import path from "path";
import fs from "fs";

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
];

const OUTPUT_DIR = path.resolve(__dirname, "../public/assets/portfolio");

async function generatePlaceholder(slug: string, title: string) {
  const outputPath = path.join(OUTPUT_DIR, slug, "thumbnail.webp");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Create a simple dark placeholder image with the project name
  const svg = `
    <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      <rect width="1920" height="1080" fill="#111111"/>
      <text x="960" y="540" font-family="Arial, sans-serif" font-size="72"
        fill="#333333" text-anchor="middle" dominant-baseline="middle">
        ${title}
      </text>
    </svg>
  `;

  await sharp(Buffer.from(svg)).webp({ quality: 85 }).toFile(outputPath);
  console.log(`  [placeholder] ${slug}`);
}

async function captureScreenshot(
  browser: puppeteer.Browser,
  slug: string,
  url: string
) {
  const outputPath = path.join(OUTPUT_DIR, slug, "thumbnail.webp");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    // Wait a bit for animations to settle
    await new Promise((r) => setTimeout(r, 2000));

    const pngBuffer = await page.screenshot({ type: "png" });
    await sharp(pngBuffer).webp({ quality: 85 }).toFile(outputPath);
    console.log(`  [captured] ${slug} -> ${url}`);
  } catch (error) {
    console.error(`  [error] ${slug}: ${error}`);
    // Generate placeholder on failure
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

  // Generate placeholder for bloxify (no URL)
  await generatePlaceholder("bloxify", "Bloxify");

  // Capture all other projects
  for (const project of PROJECTS) {
    await captureScreenshot(browser, project.slug, project.url);
  }

  await browser.close();
  console.log("\nDone! All thumbnails saved to public/assets/portfolio/");
}

main().catch(console.error);
