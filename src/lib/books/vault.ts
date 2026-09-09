/**
 * The vault: the papers that make Smart Scale a company.
 *
 * Formation papers, the EIN letter, the operating agreement, insurance,
 * licences, W-9s, contracts, tax returns. Every file is sealed before it
 * reaches storage and only comes back out through a route that checks the
 * passkey session. A document with a renewal date lands on the Today list
 * when that date is near.
 */

import { createHash, randomUUID } from "crypto";
import { redisPipeline, redisWrite } from "@/lib/ads/redis";
import { getBlob, isBlobConfigured, putBlob, removeBlob } from "@/lib/ads/blob";
import { isFileKeyConfigured, openBytes, sealBytes } from "./crypto";
import { isIsoDate } from "./money";

export const VAULT_MAX_BYTES = 4 * 1024 * 1024;
export const VAULT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const VAULT_KINDS: { id: string; label: string; hint: string }[] = [
  { id: "formation", label: "Formation", hint: "Certificate of formation, articles of organization" },
  { id: "ein", label: "EIN letter", hint: "The IRS CP 575 notice" },
  { id: "operating-agreement", label: "Operating agreement", hint: "And any amendments" },
  { id: "tax-return", label: "Tax return", hint: "Form 1065 and the K-1s, by year" },
  { id: "filing", label: "State filing", hint: "Franchise tax report, public information report" },
  { id: "insurance", label: "Insurance", hint: "Policies and certificates" },
  { id: "license", label: "License or permit", hint: "Anything with an expiry" },
  { id: "w9", label: "W-9", hint: "Yours, and every contractor's" },
  { id: "contract", label: "Contract", hint: "Client agreements, vendor terms" },
  { id: "bank", label: "Bank", hint: "Account opening papers, resolutions" },
  { id: "other", label: "Other", hint: "Anything else worth keeping" },
];

export type VaultDoc = {
  id: string;
  kind: string;
  label: string;
  filename: string;
  contentType: string;
  /** Plaintext size, for the list. */
  size: number;
  /** SHA-256 of the plaintext, so a file can be shown to be unchanged. */
  sha256: string;
  /** Server-side only. Read through /api/books/vault/<id>. */
  blobUrl: string;
  sealed: boolean;
  /** YYYY-MM-DD, when it applies. */
  issuedOn?: string;
  /** YYYY-MM-DD. Lands on Today as it approaches. */
  renewsOn?: string;
  note: string;
  who: string;
  uploadedAt: string;
};

const KEY = (id: string) => `books:vault:${id}`;
const INDEX = "books:vault";

export function isVaultConfigured(): { storage: boolean; key: boolean } {
  return { storage: isBlobConfigured(), key: isFileKeyConfigured() };
}

export function isVaultKind(id: string): boolean {
  return VAULT_KINDS.some((k) => k.id === id);
}

export function vaultKindLabel(id: string): string {
  return VAULT_KINDS.find((k) => k.id === id)?.label ?? "Other";
}

export function validateVaultFile(file: File): string | null {
  if (!VAULT_TYPES.includes(file.type)) return "Use a PDF, an image, a Word or an Excel file.";
  if (file.size > VAULT_MAX_BYTES) {
    return `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 4 MB. Scan it smaller or split it.`;
  }
  return null;
}

function parse(raw: unknown): VaultDoc | null {
  try {
    return raw ? (JSON.parse(String(raw)) as VaultDoc) : null;
  } catch {
    return null;
  }
}

export async function listVault(): Promise<VaultDoc[]> {
  const [ids] = await redisPipeline([["SMEMBERS", INDEX]]);
  const list = Array.isArray(ids) ? ids.map(String) : [];
  if (list.length === 0) return [];
  const [values] = await redisPipeline([["MGET", ...list.map(KEY)]]);
  return (Array.isArray(values) ? values : [])
    .map(parse)
    .filter((d): d is VaultDoc => d !== null)
    .sort((a, b) => a.kind.localeCompare(b.kind) || b.uploadedAt.localeCompare(a.uploadedAt));
}

export async function getVaultDoc(id: string): Promise<VaultDoc | null> {
  if (!id) return null;
  const [raw] = await redisPipeline([["GET", KEY(id)]]);
  return parse(raw);
}

export type VaultUpload = { ok: true; doc: VaultDoc } | { ok: false; error: string };

/**
 * Seals and keeps a document. Refuses without the key: a vault that stores
 * plaintext when the key is missing is not a vault.
 */
export async function addVaultDoc(
  file: File,
  input: { kind: string; label: string; issuedOn?: string; renewsOn?: string; note: string; who: string },
): Promise<VaultUpload> {
  const invalid = validateVaultFile(file);
  if (invalid) return { ok: false, error: invalid };
  if (!isBlobConfigured()) return { ok: false, error: "No file storage is connected, so the file has nowhere to go." };
  if (!isFileKeyConfigured()) return { ok: false, error: "BOOKS_FILE_KEY isn't set, so the file can't be sealed. It's on the Setup page." };
  if (!isVaultKind(input.kind)) return { ok: false, error: "Pick what kind of document it is." };
  if (input.issuedOn && !isIsoDate(input.issuedOn)) return { ok: false, error: "That issued date didn't make sense." };
  if (input.renewsOn && !isIsoDate(input.renewsOn)) return { ok: false, error: "That renewal date didn't make sense." };

  const plain = Buffer.from(await file.arrayBuffer());
  const sealed = sealBytes(plain);
  const id = randomUUID();
  const stored = await putBlob(`ads/private/books/vault/${id}.bin`, sealed, "application/octet-stream", { randomSuffix: true });
  if (!stored.ok) return { ok: false, error: stored.error };

  const doc: VaultDoc = {
    id,
    kind: input.kind,
    label: (input.label || file.name).slice(0, 160),
    filename: file.name.slice(0, 160),
    contentType: file.type,
    size: plain.byteLength,
    sha256: createHash("sha256").update(plain).digest("hex"),
    blobUrl: stored.url,
    sealed: true,
    issuedOn: input.issuedOn || undefined,
    renewsOn: input.renewsOn || undefined,
    note: input.note.slice(0, 400),
    who: input.who,
    uploadedAt: new Date().toISOString(),
  };
  const ok = await redisWrite([
    ["SET", KEY(id), JSON.stringify(doc)],
    ["SADD", INDEX, id],
  ]);
  if (!ok) {
    await removeBlob(stored.url);
    return { ok: false, error: "Sealed the file but couldn't record it. Try again." };
  }
  return { ok: true, doc };
}

export async function updateVaultDoc(
  id: string,
  patch: { label?: string; kind?: string; issuedOn?: string; renewsOn?: string; note?: string },
): Promise<VaultDoc | null> {
  const doc = await getVaultDoc(id);
  if (!doc) return null;
  const next: VaultDoc = {
    ...doc,
    label: patch.label !== undefined ? patch.label.slice(0, 160) || doc.label : doc.label,
    kind: patch.kind && isVaultKind(patch.kind) ? patch.kind : doc.kind,
    issuedOn: patch.issuedOn !== undefined ? (isIsoDate(patch.issuedOn) ? patch.issuedOn : undefined) : doc.issuedOn,
    renewsOn: patch.renewsOn !== undefined ? (isIsoDate(patch.renewsOn) ? patch.renewsOn : undefined) : doc.renewsOn,
    note: patch.note !== undefined ? patch.note.slice(0, 400) : doc.note,
  };
  const ok = await redisWrite([["SET", KEY(id), JSON.stringify(next)]]);
  return ok ? next : null;
}

export async function deleteVaultDoc(id: string): Promise<VaultDoc | null> {
  const doc = await getVaultDoc(id);
  if (!doc) return null;
  const ok = await redisWrite([
    ["DEL", KEY(id)],
    ["SREM", INDEX, id],
  ]);
  if (ok) await removeBlob(doc.blobUrl);
  return ok ? doc : null;
}

/** The plaintext bytes, for the gated route. */
export async function readVaultDoc(id: string): Promise<{ doc: VaultDoc; bytes: Buffer } | null> {
  const doc = await getVaultDoc(id);
  if (!doc) return null;
  const file = await getBlob(doc.blobUrl);
  if (!file) return null;
  const raw = Buffer.from(await new Response(file.stream).arrayBuffer());
  const bytes = doc.sealed ? openBytes(raw) : raw;
  return { doc, bytes };
}

export function vaultHref(id: string): string {
  return `/api/books/vault/${encodeURIComponent(id)}`;
}

/** Documents whose renewal is within the window, or already past. */
export function renewalsDue(docs: VaultDoc[], today: string, windowDays = 30): { doc: VaultDoc; daysLeft: number }[] {
  return docs
    .filter((d) => d.renewsOn)
    .map((doc) => ({ doc, daysLeft: Math.round((Date.parse(doc.renewsOn!) - Date.parse(today)) / 86_400_000) }))
    .filter((r) => r.daysLeft <= windowDays)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
