/**
 * Daily job for the website check: the day 3 and day 10 follow-up emails.
 * Scheduled by vercel.json.
 *
 * Fails closed like the ad-operations job next door: without CRON_SECRET it
 * refuses everything. Vercel attaches `Authorization: Bearer $CRON_SECRET`
 * to scheduled runs.
 *
 * Two query values for trying it by hand, with the same secret:
 *   ?dry=1          lists what would be sent and sends nothing
 *   ?at=2026-10-15  runs as if it were that day
 */

import { NextRequest, NextResponse } from "next/server";
import { runFollowUps } from "@/lib/wb/followups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: secret ? "Unauthorized." : "CRON_SECRET is not set, so this job is disabled." }, { status: 401 });
  }
  const params = req.nextUrl.searchParams;
  const at = params.get("at");
  const now = at ? new Date(at) : new Date();
  if (Number.isNaN(now.getTime())) return NextResponse.json({ ok: false, error: "at must be a date." }, { status: 400 });

  const followUps = await runFollowUps({ now, dry: params.get("dry") === "1" });
  return NextResponse.json({ ok: true, followUps });
}
