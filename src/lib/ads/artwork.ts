/**
 * The ad artwork on file for each client.
 *
 * The slide itself goes to Vercel Blob and only a small record of it goes to
 * Redis — a 1920×1080 slide is orders of magnitude larger than everything else
 * in this database put together, and stuffing it in would make every roster
 * read pay for it.
 *
 * Blob is called over its REST API with `fetch` rather than through
 * `@vercel/blob`, for the same reasons the rest of this folder talks to
 * Upstash, Twilio and Resend that way: no dependency, no lockfile churn, and a
 * send path that can be pointed somewhere else under test. Like those, it
 * degrades to a recorded failure when unconfigured instead of throwing.
 */

import { randomUUID } from "crypto";
import { redisPipeline, redisWrite } from "./redis";
import { isBlobConfigured, putBlob, removeBlob } from "./blob";

/**
 * A server action's whole request body has to fit inside Vercel's 4.5 MB
 * function limit, so the cap is set below it with room for the rest of the
 * form. Still images fit comfortably; video needs a browser-direct upload,
 * which is a different piece of work.
 */
export const ARTWORK_MAX_BYTES = 4 * 1024 * 1024;

export const ARTWORK_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

const KEY = (advertiserId: string) => `ads:artwork:${advertiserId}`;

export type Artwork = {
  id: string;
  advertiserId: string;
  /**
   * The Blob address. Server-side only — the store is private, so this is not
   * loadable by a browser. Render artwork through `artworkHref` instead.
   */
  url: string;
  /** Blob's own path, needed to delete it later. */
  pathname: string;
  filename: string;
  contentType: string;
  size: number;
  /** What this version is, in your words: "spring menu", "new phone number". */
  note: string;
  uploadedAt: string;
};

export function isArtworkStoreConfigured(): boolean {
  return isBlobConfigured();
}

export function validateArtwork(file: File): string | null {
  if (!ARTWORK_TYPES.includes(file.type)) {
    return "Use a PNG, JPG, WEBP or GIF — those are what the screens take.";
  }
  if (file.size > ARTWORK_MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `That file is ${mb} MB. The limit is 4 MB — export it a little smaller.`;
  }
  return null;
}

/* --------------------------------- storage -------------------------------- */

/* --------------------------------- records -------------------------------- */

export async function listArtwork(advertiserId: string): Promise<Artwork[]> {
  const [raw] = await redisPipeline([["LRANGE", KEY(advertiserId), 0, 49]]);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      try {
        return JSON.parse(String(entry)) as Artwork;
      } catch {
        return null;
      }
    })
    .filter((a): a is Artwork => a !== null);
}

/** The slide currently on the screens — the most recent upload. */
export async function currentArtwork(advertiserId: string): Promise<Artwork | null> {
  const [first] = await listArtwork(advertiserId);
  return first ?? null;
}

export async function uploadArtwork(
  advertiserId: string,
  file: File,
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  const invalid = validateArtwork(file);
  if (invalid) return { ok: false, error: invalid };

  const id = randomUUID();
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5)
    : "png";

  const stored = await putBlob(
    `ads/artwork/${advertiserId}/${id}.${extension}`,
    Buffer.from(await file.arrayBuffer()),
    file.type,
  );
  if (!stored.ok) return { ok: false, error: stored.error };

  const record: Artwork = {
    id,
    advertiserId,
    url: stored.url,
    pathname: stored.pathname,
    filename: file.name.slice(0, 120),
    contentType: file.type,
    size: file.size,
    note: note.slice(0, 200),
    uploadedAt: new Date().toISOString(),
  };

  // Newest first, so the head of the list is what's on the screens today.
  const ok = await redisWrite([
    ["LPUSH", KEY(advertiserId), JSON.stringify(record)],
    ["LTRIM", KEY(advertiserId), 0, 49],
  ]);
  if (!ok) {
    // The file landed but the record didn't, which would leave an orphan
    // nothing can ever reach. Take the file back out.
    await removeBlob(stored.url);
    return { ok: false, error: "Saved the file but couldn't record it — try again." };
  }
  return { ok: true };
}

export async function deleteArtwork(
  advertiserId: string,
  id: string,
): Promise<boolean> {
  const all = await listArtwork(advertiserId);
  const target = all.find((a) => a.id === id);
  if (!target) return false;

  const kept = all.filter((a) => a.id !== id);
  const commands: (string | number)[][] = [["DEL", KEY(advertiserId)]];
  // LPUSH prepends, so replaying the kept records in reverse restores the order.
  if (kept.length > 0) {
    commands.push([
      "RPUSH",
      KEY(advertiserId),
      ...kept.map((a) => JSON.stringify(a)),
    ]);
  }

  const ok = await redisWrite(commands);
  if (ok) await removeBlob(target.url);
  return ok;
}

/** How long since the slide was last refreshed. Null when there is no artwork. */
export function artworkAgeDays(artwork: Artwork | null): number | null {
  if (!artwork) return null;
  const then = Date.parse(artwork.uploadedAt);
  if (!Number.isFinite(then)) return null;
  return Math.floor((Date.now() - then) / 86_400_000);
}

/**
 * Where the portal loads artwork from. Never the Blob address.
 *
 * Carries the client id because artwork is stored as a list per client rather
 * than keyed by its own id — cheap to read a client's whole history, and the
 * only lookup anything actually needs.
 */
export function artworkHref(advertiserId: string, id: string): string {
  return `/api/ads/artwork/${encodeURIComponent(advertiserId)}/${encodeURIComponent(id)}`;
}

/** One artwork record, for the serving route. */
export async function findArtwork(
  advertiserId: string,
  id: string,
): Promise<Artwork | null> {
  const all = await listArtwork(advertiserId);
  return all.find((a) => a.id === id) ?? null;
}
