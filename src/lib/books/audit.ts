/**
 * The audit log: every write to the books, who made it, and what changed.
 *
 * The History page says what got done in the day's own words. This is the
 * other record: dry, complete, never trimmed. When a number in the ledger
 * is questioned a year from now, this says who typed it and what it was
 * before. Reveals of the EIN land here too, on purpose.
 */

import { redisPipeline, redisWrite } from "@/lib/ads/redis";

const KEY = "books:audit";

export type AuditEntry = {
  at: string;
  who: string;
  /** "entry.add", "vault.delete", "company.reveal" and so on. */
  action: string;
  /** The record it was about, when there is one. */
  target?: string;
  summary: string;
  before?: unknown;
  after?: unknown;
};

export async function audit(entry: Omit<AuditEntry, "at">): Promise<void> {
  const record: AuditEntry = { ...entry, at: new Date().toISOString() };
  // No trim. The whole point is that it is all still there.
  await redisWrite([["LPUSH", KEY, JSON.stringify(record)]]);
}

export async function listAudit(limit = 200, offset = 0): Promise<AuditEntry[]> {
  const [raw] = await redisPipeline([["LRANGE", KEY, offset, offset + limit - 1]]);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      try {
        return JSON.parse(String(r)) as AuditEntry;
      } catch {
        return null;
      }
    })
    .filter((e): e is AuditEntry => e !== null);
}

export async function auditCount(): Promise<number> {
  const [n] = await redisPipeline([["LLEN", KEY]]);
  return typeof n === "number" ? n : 0;
}
