/**
 * "Not yet": a visitor with no website asks for one. POST /api/wb/no-website
 *
 * Same manners as the scan endpoint: a real mistake in the form is said
 * plainly, and a bot or a flood gets a success that records nothing.
 */

import { NextRequest, NextResponse } from "next/server";
import { readNoWebsiteInput, recordNoWebsite } from "@/lib/wb/check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "";
}

export async function POST(req: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const result = await recordNoWebsite(readNoWebsiteInput(body), clientIp(req));
    return NextResponse.json(result, { status: result.ok ? 200 : 400, headers });
  } catch {
    return NextResponse.json({ ok: true }, { headers });
  }
}
