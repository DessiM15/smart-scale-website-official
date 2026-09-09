/**
 * Nightly snapshot of the book of business.
 *
 * The roster lives on one Upstash database on a free plan, and it now carries
 * contract terms and negotiated rates — the sort of thing that cannot simply be
 * retyped from memory if the database goes away. So every night the whole
 * roster is written back to Blob storage as one JSON file, keyed by date.
 *
 * Deliberately dumb: no diffing, no incremental anything, one file per day
 * kept for a rolling month. Restoring is reading the JSON. A backup you have
 * to reason about is a backup you can't use at 6am.
 */

import { exportRoster } from "./roster";
import { listLinks } from "./link-store";
import { redisPipeline, redisWrite } from "./redis";
import { isBlobConfigured, putBlob } from "./blob";
import { exportBooks } from "@/lib/books/export";

/** Kept for a month — long enough to notice a bad edit, short enough to be free. */
const KEEP_DAYS = 30;
const LOG_KEY = "ads:backups";

export type BackupEntry = {
  at: string;
  /** YYYY-MM-DD in UTC — one backup per calendar day, overwritten if re-run. */
  date: string;
  url: string;
  advertisers: number;
  prospects: number;
  links: number;
  bytes: number;
};

export function isBackupConfigured(): boolean {
  return isBlobConfigured();
}

export type BackupResult = {
  ok: boolean;
  skipped?: string;
  entry?: BackupEntry;
  error?: string;
};

/**
 * Never throws. This runs inside the daily cron alongside renewal texts, and a
 * storage hiccup must not take the alerts down with it.
 */
export async function runBackup(): Promise<BackupResult> {
  if (!isBlobConfigured()) {
    return { ok: false, skipped: "No Blob store is connected to this deployment" };
  }

  try {
    const [roster, links, books] = await Promise.all([exportRoster(), listLinks(), exportBooks()]);

    // The QR logos are data URIs and would dominate the file; the codes and
    // destinations are what actually matter to restore.
    const payload = JSON.stringify({
      ...roster,
      links: links.map((link) => ({
        code: link.code,
        label: link.label,
        destination: link.destination,
        active: link.active,
        tagDestination: link.tagDestination,
        advertiserId: link.advertiserId,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
      })),
      // The books ride along in the same file: one snapshot, one restore.
      books,
    });

    const date = new Date().toISOString().slice(0, 10);
    const body = Buffer.from(payload, "utf8");

    // Same path every day, so re-running the job replaces the day's file rather
    // than littering — which the store refuses unless told to allow it.
    const stored = await putBlob(
      `ads/backup/${date}.json`,
      body,
      "application/json",
      { overwrite: true },
    );
    if (!stored.ok) return { ok: false, error: stored.error };

    const entry: BackupEntry = {
      at: new Date().toISOString(),
      date,
      url: stored.url,
      advertisers: roster.advertisers.length,
      prospects: roster.prospects.length,
      links: links.length,
      bytes: body.byteLength,
    };

    await redisWrite([
      ["LPUSH", LOG_KEY, JSON.stringify(entry)],
      ["LTRIM", LOG_KEY, 0, KEEP_DAYS - 1],
    ]);

    return { ok: true, entry };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "backup failed",
    };
  }
}

/** The most recent backups, newest first — shown on the tracker. */
export async function recentBackups(limit = 5): Promise<BackupEntry[]> {
  const [raw] = await redisPipeline([["LRANGE", LOG_KEY, 0, limit - 1]]);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      try {
        return JSON.parse(String(entry)) as BackupEntry;
      } catch {
        return null;
      }
    })
    .filter((e): e is BackupEntry => e !== null);
}
