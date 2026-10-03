/**
 * The scan worker, as this site sees it.
 *
 * The worker is a separate always-on service (the smart-scale-scanner repo);
 * this app never runs Chrome. Requests in both directions are signed with one
 * shared secret:
 *
 *   X-SSA-Timestamp  unix seconds
 *   X-SSA-Signature  hex HMAC-SHA256 of `${timestamp}.${rawBody}`
 *
 * A signature more than five minutes old is refused, so a captured request
 * cannot be replayed later. Plain `fetch`, no SDK, and a missing setting
 * degrades to a scan that is checked by hand instead of an error page.
 */

import { createHmac, timingSafeEqual } from "crypto";
import { SITE_URL } from "@/lib/business";
import type { LeadReport } from "./report";

const MAX_SKEW_SECONDS = 300;

function settings(): { url: string; secret: string } | null {
  const url = (process.env.SSA_WORKER_URL ?? "").trim().replace(/\/$/, "");
  const secret = (process.env.SSA_WORKER_SECRET ?? "").trim();
  if (!url || !secret) return null;
  return { url, secret };
}

export function isWorkerConfigured(): boolean {
  return settings() !== null;
}

function sign(secret: string, timestamp: number | string, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

function signedHeaders(secret: string, body: string): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000);
  return { "x-ssa-timestamp": String(timestamp), "x-ssa-signature": sign(secret, timestamp, body) };
}

/** Why a callback was refused, or null when it is really from the worker. */
export function verifyWorkerSignature(timestamp: string | null, signature: string | null, body: string): string | null {
  const config = settings();
  if (!config) return "not configured";
  if (!timestamp || !signature) return "missing signature";
  if (!/^\d{1,12}$/.test(timestamp)) return "bad timestamp";
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > MAX_SKEW_SECONDS) return "expired signature";
  const expected = Buffer.from(sign(config.secret, timestamp, body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return "bad signature";
  return null;
}

/** The worker only ever calls back to this host; it refuses any other. */
export const CALLBACK_URL = `${SITE_URL}/api/wb/scan/callback`;

export type WorkerFailure = { reason: string; detail?: string };

/** One state of a scan, whether it arrived by callback or was asked for. */
export type WorkerEvent = {
  scanId: string;
  event: "started" | "progress" | "completed" | "failed";
  step?: string;
  stepIndex?: number;
  stepCount?: number;
  report?: LeadReport;
  failure?: WorkerFailure;
};

export type StartResult =
  | { ok: true }
  /** `reason` is what the lead records: unreachable, queue_full, worker_down. */
  | { ok: false; reason: string };

/** Asks the worker to scan a site. Never throws. */
export async function startScan(input: { scanId: string; url: string; label?: string }): Promise<StartResult> {
  const config = settings();
  if (!config) return { ok: false, reason: "worker_down" };
  const body = JSON.stringify({ ...input, callbackUrl: CALLBACK_URL });
  try {
    const res = await fetch(`${config.url}/scans`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...signedHeaders(config.secret, body) },
      body,
      cache: "no-store",
      // The machine sleeps when idle and takes a few seconds to wake.
      signal: AbortSignal.timeout(20_000),
    });
    if (res.status === 202 || res.status === 200) return { ok: true };
    if (res.status === 429) return { ok: false, reason: "queue_full" };
    if (res.status === 422) return { ok: false, reason: "unreachable" };
    return { ok: false, reason: "worker_down" };
  } catch {
    return { ok: false, reason: "worker_down" };
  }
}

type WorkerJob = {
  scanId: string;
  status: "queued" | "running" | "completed" | "failed";
  step?: string;
  stepIndex?: number;
  stepCount?: number;
  report?: LeadReport;
  failure?: WorkerFailure;
};

/**
 * The worker's own view of a scan, as the same kind of event a callback
 * carries. Null when the worker cannot be reached or no longer knows the scan.
 */
export async function askWorker(scanId: string): Promise<WorkerEvent | null> {
  const config = settings();
  if (!config) return null;
  try {
    const res = await fetch(`${config.url}/scans/${encodeURIComponent(scanId)}`, {
      headers: signedHeaders(config.secret, ""),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const job = (await res.json()) as WorkerJob;
    const event = job.status === "completed" ? "completed" : job.status === "failed" ? "failed" : "progress";
    return { scanId, event, step: job.step, stepIndex: job.stepIndex, stepCount: job.stepCount, report: job.report, failure: job.failure };
  } catch {
    return null;
  }
}
