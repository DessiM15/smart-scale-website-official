/**
 * Lead intake from the advertise page: POST /api/ads/lead
 *
 * Public by necessity — anyone filling in the form has to be able to reach it.
 * That shapes every decision here:
 *
 *   - It always answers 200. The browser calls this alongside Web3Forms, and a
 *     failure on our side must never turn into an error message in front of a
 *     business trying to hire us. What went wrong is recorded, not shown.
 *   - Spam is absorbed rather than argued with: a honeypot field and a per-IP
 *     hourly cap, both of which look like success from the outside.
 *   - It writes nothing that isn't a prospect. No arbitrary keys, no way to
 *     reach the advertiser roster.
 */

import { NextRequest, NextResponse } from "next/server";
import { readLead, recordLead } from "@/lib/ads/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The client's address as the proxy saw it, for rate limiting only. */
function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const result = await recordLead(readLead(form), clientIp(req));

    // `recorded` is honest about whether it landed, without handing a bot a
    // signal it can tune against.
    return NextResponse.json(
      { ok: true, recorded: result.ok && !result.skipped },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: true, recorded: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
