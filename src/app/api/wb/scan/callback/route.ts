/**
 * The scan worker reporting back: POST /api/wb/scan/callback
 *
 * Signed with the shared secret, checked against the raw body before
 * anything is parsed. An unsigned or stale request is refused and changes
 * nothing. The worker retries a failed callback, and the same news twice is
 * handled once.
 */

import { NextRequest, NextResponse } from "next/server";
import { applyWorkerEvent } from "@/lib/wb/check";
import { verifyWorkerSignature, type WorkerEvent } from "@/lib/wb/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const EVENTS = ["started", "progress", "completed", "failed"];

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const refused = verifyWorkerSignature(req.headers.get("x-ssa-timestamp"), req.headers.get("x-ssa-signature"), raw);
  if (refused) return NextResponse.json({ ok: false, error: refused }, { status: 401 });

  let event: WorkerEvent;
  try {
    event = JSON.parse(raw) as WorkerEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "not json" }, { status: 400 });
  }
  if (typeof event.scanId !== "string" || !EVENTS.includes(event.event)) {
    return NextResponse.json({ ok: false, error: "not a scan event" }, { status: 400 });
  }

  try {
    await applyWorkerEvent(event);
    return NextResponse.json({ ok: true });
  } catch {
    // A 500 asks the worker to try again, and the status page asks it too.
    return NextResponse.json({ ok: false, error: "not recorded" }, { status: 500 });
  }
}
