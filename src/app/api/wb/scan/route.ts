/**
 * Start a free website check: POST /api/wb/scan
 *
 * Public by necessity. A real mistake in the form (no website, no email) is
 * said plainly so the visitor can fix it. Everything else answers with a scan
 * id: a bot, a flood and a scanner outage all look the same from outside, and
 * the progress page tells the visitor we will check by hand.
 */

import { NextRequest, NextResponse } from "next/server";
import { readCheckInput, startCheck } from "@/lib/wb/check";
import { newScanId } from "@/lib/wb/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Waking the scan worker from a stop can take most of twenty seconds.
export const maxDuration = 60;

/** The client's address as the proxy saw it, for rate limiting only. */
function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "";
}

export async function POST(req: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const result = await startCheck(readCheckInput(body), clientIp(req));
    return NextResponse.json(result, { status: result.ok ? 200 : 400, headers });
  } catch {
    return NextResponse.json({ ok: true, scanId: newScanId() }, { headers });
  }
}
