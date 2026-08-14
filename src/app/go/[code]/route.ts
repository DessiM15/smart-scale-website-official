/**
 * QR redirect: smartscaleagent.com/go/<code>
 *
 * Counts the scan, then forwards the phone to the advertiser. Two rules govern
 * everything here:
 *   1. The guest always lands somewhere. Unknown code, retired ad, analytics
 *      outage — they still get a page, never an error.
 *   2. Counting never delays the hop. The write is time-boxed; if Redis is slow
 *      we drop the count rather than make someone stare at a white screen.
 */

import { NextRequest, NextResponse } from "next/server";
import { findAdLink, resolveDestination, FALLBACK_DESTINATION } from "@/lib/ads/advertisers";
import { recordScan } from "@/lib/ads/scan-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Link previewers and crawlers fetch URLs without a human ever scanning. */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|slackbot|whatsapp|telegram|discord|embedly|curl|wget|python-requests|headless|lighthouse|monitor|uptime/i;

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
  const link = findAdLink(code);

  const target =
    link && link.active ? resolveDestination(link) : FALLBACK_DESTINATION;

  const userAgent = req.headers.get("user-agent") ?? "";
  const skipLogging =
    !link ||
    BOT_PATTERN.test(userAgent) ||
    req.nextUrl.searchParams.get("nolog") === "1";

  if (!skipLogging) {
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
