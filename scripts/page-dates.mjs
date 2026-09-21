/**
 * Writes src/data/page-dates.json: the date each public page last changed,
 * read from git, keyed by path.
 *
 *   npm run page-dates
 *
 * Why this exists: the sitemap used to stamp every URL with the build date,
 * so each deploy told Google the whole site had changed. Google learns to
 * ignore a lastmod like that within weeks, and then it is no help getting a
 * genuinely updated page recrawled. This gives each page its own honest
 * date instead.
 *
 * Run it locally and commit the JSON. It is deliberately not part of the
 * build: Vercel clones with limited history, so `git blame` there would
 * report the wrong dates, and a wrong date is worse than none.
 *
 * A page's date is the newest change to any file that produces it: a data
 * entry (one project, one city, one service), plus the template that
 * renders it. Changing a template really does change every page it
 * renders, so that is the honest answer.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src/data/page-dates.json");

const git = (...args) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();

/** Newest commit date (YYYY-MM-DD) touching any of these files. */
function fileDate(files) {
  let best = "";
  for (const f of files) {
    const d = git("log", "-1", "--format=%cs", "--", f);
    if (d > best) best = d;
  }
  return best;
}

/**
 * Newest commit date for lines [from, to] of a file, via blame. Uncommitted
 * edits blame to a zero hash with today's date, which is the right answer
 * for something about to ship.
 */
function rangeDate(file, from, to) {
  const out = git("blame", "--line-porcelain", `-L${from},${to}`, file);
  let best = 0;
  for (const line of out.split("\n")) {
    if (line.startsWith("committer-time ")) {
      best = Math.max(best, Number(line.slice("committer-time ".length)));
    }
  }
  return best ? new Date(best * 1000).toISOString().slice(0, 10) : "";
}

/**
 * Line ranges of each `slug: "..."` entry in a data file: from that line to
 * just before the next slug (or the end of the array).
 */
function entryRanges(file) {
  const lines = readFileSync(path.join(ROOT, file), "utf8").split("\n");
  const starts = [];
  lines.forEach((l, i) => {
    const m = l.match(/^\s+slug:\s*"([^"]+)"/);
    if (m) starts.push({ slug: m[1], line: i + 1 });
  });
  const end = lines.length;
  return starts.map((s, i) => ({
    slug: s.slug,
    from: s.line,
    to: (starts[i + 1]?.line ?? end + 1) - 1,
  }));
}

const later = (a, b) => (a > b ? a : b);

const dates = {};

// Static pages: the route file plus whatever it composes.
const STATIC = {
  "/": ["src/app/(main)/page.tsx", "src/components/sections", "src/data/reviews.ts"],
  "/portfolio": ["src/app/(main)/portfolio/page.tsx", "src/components/portfolio/PortfolioGrid.tsx", "src/data/projects.ts"],
  "/services": ["src/app/(main)/services/page.tsx", "src/lib/constants.ts"],
  "/contact": ["src/app/(main)/contact"],
  "/about": ["src/app/(main)/about"],
  "/blog": ["src/app/(main)/blog/page.tsx", "src/lib/blog.ts"],
};
for (const [p, files] of Object.entries(STATIC)) dates[p] = fileDate(files);

// One entry per page, plus the template that renders it.
const PER_ENTRY = [
  { file: "src/data/projects.ts", prefix: "/portfolio/", template: ["src/app/(main)/portfolio/[slug]", "src/components/portfolio/ProjectDetail.tsx"] },
  { file: "src/lib/constants.ts", prefix: "/services/", template: ["src/app/(main)/services/[slug]", "src/components/ServicePageClient.tsx"] },
  { file: "src/lib/cities.ts", prefix: "/web-design/", template: ["src/app/(main)/web-design/[city]"] },
];
for (const { file, prefix, template } of PER_ENTRY) {
  const templateDate = fileDate(template);
  for (const r of entryRanges(file)) {
    dates[prefix + r.slug] = later(rangeDate(file, r.from, r.to), templateDate);
  }
}

const sorted = Object.fromEntries(Object.entries(dates).sort());
writeFileSync(OUT, JSON.stringify(sorted, null, 2) + "\n");
console.log(`${Object.keys(sorted).length} pages -> ${path.relative(ROOT, OUT)}`);
for (const [p, d] of Object.entries(sorted)) console.log(`  ${d}  ${p}`);
