/**
 * A scan turned into a lead: POST /api/ads/conversion
 *
 * Called by the site's forms after they submit, with the code from the
 * cookie the redirect set. Public by necessity and shaped like the lead
 * endpoint: always 200, records a count and a timestamp and nothing else,
 * and can never make a form look broken.
 */

import { NextRequest, NextResponse } from "next/server";
import { cleanSource, recordConversion } from "@/lib/ads/conversions";
import { redisPipeline } from "@/lib/ads/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Per-IP conversions allowed in a rolling hour. A person fills a form once. */
const RATE_LIMIT = 10;

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "";
}

async function withinRateLimit(ip: string): Promise<boolean> {
  if (!ip) return true;
  const key = `ads:conv:rate:${ip}`;
  const [count] = await redisPipeline([
    ["INCR", key],
    ["EXPIRE", key, 3600],
  ]);
  if (count === undefined || count === null) return true;
  return Number(count) <= RATE_LIMIT;
}

export async function POST(req: NextRequest) {
  const ok = { ok: true } as const;
  try {
    const body = (await req.json().catch(() => ({}))) as { code?: unknown; form?: unknown };
    const code = cleanSource(body.code);
    if (!code) return NextResponse.json(ok, { headers: { "Cache-Control": "no-store" } });
    if (!(await withinRateLimit(clientIp(req)))) return NextResponse.json(ok, { headers: { "Cache-Control": "no-store" } });
    await recordConversion({ code, form: String(body.form ?? "site").slice(0, 20) });
  } catch {
    // Counting is never allowed to fail a form.
  }
  return NextResponse.json(ok, { headers: { "Cache-Control": "no-store" } });
}
