/**
 * QR redirect: smartscaleagent.com/go/<code>
 *
 * Counts the scan, then forwards the phone to the advertiser. Two rules govern
 * everything here:
 *   1. The guest always lands somewhere. Unknown code, retired ad, database
 *      outage — they still get a page, never an error.
 *   2. Counting never delays the hop. The write is time-boxed; if the database
 *      is slow we drop the count rather than make someone stare at a white
 *      screen.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  FALLBACK_DESTINATION,
  getLink,
  getSeedLink,
  resolveDestination,
  type AdLinkRecord,
} from "@/lib/ads/link-store";
import { recordScan } from "@/lib/ads/scan-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Link previewers and crawlers fetch URLs without a human ever scanning. */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|slackbot|whatsapp|telegram|discord|embedly|curl|wget|python-requests|headless|lighthouse|monitor|uptime/i;

/**
 * Successful lookups are cached briefly per instance so a busy lunch rush isn't
 * a database round trip per scan. Only hits are cached — a code created a
 * moment ago still resolves immediately.
 */
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { link: AdLinkRecord; at: number }>();

async function lookup(code: string): Promise<AdLinkRecord | null> {
  const hit = cache.get(code);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.link;

  const link = await getLink(code);
  if (link) {
    cache.set(code, { link, at: Date.now() });
    return link;
  }
  // Database unreachable or code unknown — the built-in list still answers.
  return getSeedLink(code);
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  let link: AdLinkRecord | null = null;
  try {
    link = await lookup(code);
  } catch {
    link = getSeedLink(code);
  }

  const target =
    link && link.active ? resolveDestination(link) : FALLBACK_DESTINATION;

  const userAgent = req.headers.get("user-agent") ?? "";
  const skipLogging =
    !link ||
    BOT_PATTERN.test(userAgent) ||
    req.nextUrl.searchParams.get("nolog") === "1";

  if (!skipLogging && link) {
    try {
      await recordScan({
        code: link.code,
        userAgent,
        ip: clientIp(req),
        city: req.headers.get("x-vercel-ip-city") ?? undefined,
        region: req.headers.get("x-vercel-ip-country-region") ?? undefined,
      });
    } catch {
      // Analytics is never allowed to break the redirect.
    }
  }

  const res = NextResponse.redirect(target, 302);
  // A cached redirect is an uncounted scan.
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
