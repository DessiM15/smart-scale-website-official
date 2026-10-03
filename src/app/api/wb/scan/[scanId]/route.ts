/**
 * Where a check stands: GET /api/wb/scan/{scanId}
 *
 * Polled every two seconds by the progress page. It says only what that page
 * shows: the step, or the counts, or that we will check by hand. The report
 * itself is read from its own page.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkStatus } from "@/lib/wb/check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;
  const headers = { "Cache-Control": "no-store" };
  try {
    return NextResponse.json(await checkStatus(scanId), { headers });
  } catch {
    // A hiccup here should not end a scan that is still running.
    return NextResponse.json({ state: "running", step: "load", stepIndex: 1, stepCount: 5 }, { headers });
  }
}
