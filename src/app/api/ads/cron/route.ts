/**
 * Daily ad-operations job. Scheduled by vercel.json.
 *
 * Fails closed: without CRON_SECRET set this endpoint refuses everything,
 * because an open URL that sends SMS is an open URL that can run up a Twilio
 * bill. Vercel attaches `Authorization: Bearer $CRON_SECRET` to scheduled
 * invocations automatically once the variable exists.
 */

import { NextRequest, NextResponse } from "next/server";
import { runRenewalCheck } from "@/lib/ads/renewals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json(
      {
        ok: false,
        error: process.env.CRON_SECRET
          ? "Unauthorized."
          : "CRON_SECRET is not set, so this job is disabled. Add it in Vercel and redeploy.",
      },
      { status: 401 },
    );
  }

  const result = await runRenewalCheck("cron");
  return NextResponse.json({ ok: true, ...result });
}
