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
import { runMonthlyReports } from "@/lib/ads/reports";
import { runBackup } from "@/lib/ads/backup";
import { isStripeConfigured, runStripeSync } from "@/lib/books/stripe";

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

  const renewals = await runRenewalCheck("cron");
  // Only does anything on the first of the month; drafts, never sends.
  const reports = await runMonthlyReports();
  // Stripe into the books, before the backup so the backup has it. A failed
  // pull records itself and shows on Today; it never stops the job.
  const stripe = isStripeConfigured()
    ? await runStripeSync("cron").catch((e: unknown) => ({ ok: false as const, error: e instanceof Error ? e.message : String(e) }))
    : { ok: false as const, error: "STRIPE_RESTRICTED_KEY is not set." };
  // Last, and never allowed to fail the job — the alerts above are the part
  // that has to go out today.
  const backup = await runBackup();

  return NextResponse.json({ ok: true, renewals, reports, stripe: stripe.ok ? stripe.run : stripe, backup });
}
