/**
 * Receipt photos.
 *
 * A receipt arrives as a phone photo, is straightened and shrunk to something
 * a browser and a model can both handle, and is kept in the private store
 * under an unguessable path that only ever comes back out through a route
 * that checks the session. The photo is the record; the paper can go.
 *
 * A receipt is "pending" until somebody has confirmed what it says. Pending
 * receipts sit on the Today list, so a snap at the counter that never got
 * confirmed is not forgotten.
 */

import { createHash, randomUUID } from "crypto";
import sharp from "sharp";
import { redisPipeline, redisWrite } from "@/lib/ads/redis";
import { getBlob, isBlobConfigured, putBlob, removeBlob } from "@/lib/ads/blob";
import { isFileKeyConfigured, openBytes, sealBytes } from "./crypto";
import { readReceiptImage, type ReceiptRead } from "./reader";

/** The server action body limit is 4.5 MB; the phone shrinks before sending. */
export const RECEIPT_MAX_BYTES = 4 * 1024 * 1024;
export const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/** Long side after normalising. Plenty for a receipt, small enough to read fast. */
const MAX_SIDE = 2000;

export type ReceiptStatus = "pending" | "confirmed";

export type Receipt = {
  id: string;
  /** Server-side only. Read the file through /api/ads/receipt/<id>. */
  blobUrl: string;
  contentType: "image/jpeg";
  size: number;
  width: number;
  height: number;
  sha256: string;
  /** Encrypted with BOOKS_FILE_KEY before upload. Older photos may not be. */
  sealed?: boolean;
  capturedAt: string;
  who: string;
  status: ReceiptStatus;
  read?: ReceiptRead;
  readError?: string;
  entryId?: string;
};

const KEY = (id: string) => `books:receipt:${id}`;
const ALL = "books:receipts";
const PENDING = "books:receipts:pending";
const BY_SHA = (sha: string) => `books:receipt:sha:${sha}`;

export function isReceiptStoreConfigured(): boolean {
  return isBlobConfigured();
}

export function validateReceiptFile(file: File): string | null {
  if (!RECEIPT_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
    return "Use a photo: JPG, PNG, WEBP or HEIC.";
  }
  if (file.size > RECEIPT_MAX_BYTES) {
    return `That photo is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 4 MB; the phone should have shrunk it. Try again.`;
  }
  return null;
}

/* --------------------------------- storage -------------------------------- */

function parse(raw: unknown): Receipt | null {
  try {
    return raw ? (JSON.parse(String(raw)) as Receipt) : null;
  } catch {
    return null;
  }
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  if (!id) return null;
  const [raw] = await redisPipeline([["GET", KEY(id)]]);
  return parse(raw);
}

async function loadByIds(ids: string[]): Promise<Receipt[]> {
  if (ids.length === 0) return [];
  const [values] = await redisPipeline([["MGET", ...ids.map(KEY)]]);
  return (Array.isArray(values) ? values : [])
    .map(parse)
    .filter((r): r is Receipt => r !== null)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

export async function listPendingReceipts(): Promise<Receipt[]> {
  const [ids] = await redisPipeline([["SMEMBERS", PENDING]]);
  return loadByIds(Array.isArray(ids) ? ids.map(String) : []);
}

export async function listAllReceipts(): Promise<Receipt[]> {
  const [ids] = await redisPipeline([["SMEMBERS", ALL]]);
  return loadByIds(Array.isArray(ids) ? ids.map(String) : []);
}

async function save(receipt: Receipt, extra: (string | number)[][] = []): Promise<boolean> {
  return redisWrite([["SET", KEY(receipt.id), JSON.stringify(receipt)], ...extra]);
}

export type StoreResult =
  | { ok: true; receipt: Receipt; duplicate: boolean }
  | { ok: false; error: string };

/**
 * Keeps a photo. Straightens it, shrinks it, checks it isn't one already on
 * file, uploads it, and, when asked, has it read.
 *
 * `entryId` files the photo straight against an existing ledger row, for a
 * receipt that turns up after the expense was typed. Nothing is read then;
 * the row already says what it was.
 */
export async function storeReceipt(
  file: File,
  who: string,
  options: { read: boolean; entryId?: string },
): Promise<StoreResult> {
  const invalid = validateReceiptFile(file);
  if (invalid) return { ok: false, error: invalid };
  if (!isBlobConfigured()) return { ok: false, error: "No file storage is connected, so the photo has nowhere to go." };

  let image: Buffer;
  let width = 0;
  let height = 0;
  try {
    const out = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    image = out.data;
    width = out.info.width;
    height = out.info.height;
  } catch {
    return { ok: false, error: "That file couldn't be read as a photo. Try taking it again." };
  }

  const sha256 = createHash("sha256").update(image).digest("hex");
  const [dupId] = await redisPipeline([["GET", BY_SHA(sha256)]]);
  if (dupId) {
    const existing = await getReceipt(String(dupId));
    if (existing) return { ok: true, receipt: existing, duplicate: true };
  }

  // Sealed when the key is there. A receipt is not an EIN letter, so a
  // missing key does not stop the snap; the Setup page says it is missing.
  const sealed = isFileKeyConfigured();
  const id = randomUUID();
  const stored = await putBlob(
    `ads/private/books/receipts/${id}.${sealed ? "bin" : "jpg"}`,
    sealed ? sealBytes(image) : image,
    sealed ? "application/octet-stream" : "image/jpeg",
    { randomSuffix: true },
  );
  if (!stored.ok) return { ok: false, error: stored.error };

  const receipt: Receipt = {
    id,
    blobUrl: stored.url,
    contentType: "image/jpeg",
    size: image.byteLength,
    width,
    height,
    sha256,
    sealed,
    capturedAt: new Date().toISOString(),
    who,
    status: options.entryId ? "confirmed" : "pending",
    entryId: options.entryId,
  };

  const ok = await save(receipt, [
    ["SADD", ALL, id],
    ...(receipt.status === "pending" ? [["SADD", PENDING, id] as (string | number)[]] : []),
    ["SET", BY_SHA(sha256), id],
  ]);
  if (!ok) {
    await removeBlob(stored.url);
    return { ok: false, error: "Saved the photo but couldn't record it. Try again." };
  }

  if (options.read) {
    const read = await readReceiptImage(image, "image/jpeg");
    if (read.ok) receipt.read = read.read;
    else receipt.readError = read.error;
    await save(receipt);
  }

  return { ok: true, receipt, duplicate: false };
}

/** Tie a pending receipt to the ledger row made from it. */
export async function confirmReceipt(id: string, entryId: string): Promise<boolean> {
  const receipt = await getReceipt(id);
  if (!receipt) return false;
  const confirmed: Receipt = { ...receipt, status: "confirmed", entryId };
  return save(confirmed, [["SREM", PENDING, id]]);
}

/** Put a receipt back to waiting when the row it was filed on is removed. */
export async function unconfirmReceipt(id: string): Promise<boolean> {
  const receipt = await getReceipt(id);
  if (!receipt) return false;
  const pending: Receipt = { ...receipt, status: "pending", entryId: undefined };
  return save(pending, [["SADD", PENDING, id]]);
}

/** Remove the photo and the record. Used for a bad snap or an unlinked receipt. */
export async function deleteReceipt(id: string): Promise<Receipt | null> {
  const receipt = await getReceipt(id);
  if (!receipt) return null;
  const ok = await redisWrite([
    ["DEL", KEY(id)],
    ["SREM", ALL, id],
    ["SREM", PENDING, id],
    ["DEL", BY_SHA(receipt.sha256)],
  ]);
  if (ok) await removeBlob(receipt.blobUrl);
  return ok ? receipt : null;
}

/** The photo, in the clear, for the gated route. */
export async function readReceiptFile(id: string): Promise<{ receipt: Receipt; bytes: Buffer } | null> {
  const receipt = await getReceipt(id);
  if (!receipt) return null;
  const file = await getBlob(receipt.blobUrl);
  if (!file) return null;
  const raw = Buffer.from(await new Response(file.stream).arrayBuffer());
  try {
    return { receipt, bytes: receipt.sealed ? openBytes(raw) : raw };
  } catch {
    return null;
  }
}

/** Where the portal links to. Never the Blob address. */
export function receiptHref(id: string): string {
  return `/api/ads/receipt/${encodeURIComponent(id)}`;
}
