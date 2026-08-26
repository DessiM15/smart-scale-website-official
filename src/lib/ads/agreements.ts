/**
 * Advertising agreements: prepared here, signed by the client, countersigned by
 * us, and kept.
 *
 * Two rules shape this file.
 *
 * **A signed agreement is frozen.** The terms are copied onto the record when
 * it is prepared, not read live from the roster — otherwise editing someone's
 * rate next month would silently rewrite what they signed. A SHA-256 of the
 * exact text goes on the signature, so we can always prove the copy on file is
 * the copy that was agreed to.
 *
 * **It never goes near Blob.** Artwork lives there because artwork is a public
 * ad; a contract carries a name, a rate and a signature, and Blob addresses are
 * unguessable but public. Agreements are text, they are small, and they stay in
 * the database, served only through pages that check who is asking.
 */

import { createHash, randomUUID } from "crypto";
import { redisPipeline, redisWrite } from "./redis";
import {
  agreementText,
  TEMPLATE_VERSION,
  type AgreementTerms,
} from "./agreement-template";
import { toView, type Advertiser } from "./roster";

const KEY = (id: string) => `ads:agreement:${id}`;
const INDEX = (advertiserId: string) => `ads:agreements:${advertiserId}`;

/**
 * draft      — prepared, not sent. Still editable by re-preparing.
 * sent       — the client has the link.
 * viewed     — they opened it. Useful when chasing.
 * signed     — they signed; waiting on us.
 * countersigned — done. This is the only state that counts as paperwork complete.
 * void       — cancelled before completion. Kept, never deleted.
 */
export type AgreementStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "signed"
  | "countersigned"
  | "void";

export type Signature = {
  /** Typed by the signer. Their intent, in their own words. */
  name: string;
  email: string;
  /** Evidence, captured at the moment of signing. */
  ip: string;
  userAgent: string;
  at: string;
  /** The hash of the exact text they were shown. */
  bodyHash: string;
};

export type Countersignature = {
  name: string;
  at: string;
};

export type Agreement = {
  id: string;
  advertiserId: string;
  status: AgreementStatus;
  /** Frozen at preparation. Never re-read from the roster. */
  terms: AgreementTerms;
  templateVersion: string;
  /** SHA-256 of the rendered text, computed once at preparation. */
  bodyHash: string;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  signature?: Signature;
  countersignature?: Countersignature;
  voidedAt?: string;
  voidReason?: string;
};

/** The fingerprint of a specific set of words. */
export function hashBody(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** True when the copy on file still matches the text it claims to be. */
export function isIntact(agreement: Agreement): boolean {
  return hashBody(agreementText(agreement.terms)) === agreement.bodyHash;
}

/** The paperwork is only finished when both sides have signed. */
export function isComplete(agreement: Agreement): boolean {
  return agreement.status === "countersigned";
}

/** Whatever is currently in force for this client, if anything. */
export function activeAgreement(list: Agreement[]): Agreement | undefined {
  return list.find(isComplete);
}

/** Anything still moving — sent, opened, or waiting on a countersignature. */
export function pendingAgreement(list: Agreement[]): Agreement | undefined {
  return list.find(
    (a) => a.status === "sent" || a.status === "viewed" || a.status === "signed",
  );
}

/* -------------------------------- building -------------------------------- */

/** Takes a snapshot of what this client is on right now. */
export function termsFromAdvertiser(advertiser: Advertiser): AgreementTerms {
  const view = toView(advertiser);
  return {
    business: view.business,
    contactName: view.contactName,
    email: view.email,
    phone: view.phone,
    category: view.category,
    planName: view.planName,
    monthly: view.monthly,
    setup: view.setup,
    months: view.months,
    startDate: view.startDate,
    endDate: view.endDate,
    dealNote: view.isCustom ? view.dealNote || "" : "",
  };
}

/* -------------------------------- storage --------------------------------- */

function parse(raw: unknown): Agreement | null {
  try {
    return raw ? (JSON.parse(String(raw)) as Agreement) : null;
  } catch {
    return null;
  }
}

export async function getAgreement(id: string): Promise<Agreement | null> {
  if (!id) return null;
  const [raw] = await redisPipeline([["GET", KEY(id)]]);
  return parse(raw);
}

/** Every agreement for one client, newest first. */
export async function listAgreements(advertiserId: string): Promise<Agreement[]> {
  const [ids] = await redisPipeline([["SMEMBERS", INDEX(advertiserId)]]);
  const list = Array.isArray(ids) ? ids.map(String) : [];
  if (list.length === 0) return [];

  const [values] = await redisPipeline([["MGET", ...list.map(KEY)]]);
  const parsed = (Array.isArray(values) ? values : [])
    .map(parse)
    .filter((a): a is Agreement => a !== null);

  return parsed.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function put(agreement: Agreement): Promise<boolean> {
  return redisWrite([
    ["SET", KEY(agreement.id), JSON.stringify(agreement)],
    ["SADD", INDEX(agreement.advertiserId), agreement.id],
  ]);
}

/**
 * Prepares a fresh draft from the client's current contract.
 *
 * Any earlier draft for the same client is voided rather than left lying about
 * — two live drafts with different numbers is exactly how the wrong one gets
 * sent.
 */
export async function prepareAgreement(
  advertiser: Advertiser,
): Promise<{ ok: boolean; agreement?: Agreement }> {
  const existing = await listAgreements(advertiser.id);

  for (const old of existing) {
    if (old.status === "draft") {
      await put({
        ...old,
        status: "void",
        voidedAt: new Date().toISOString(),
        voidReason: "Replaced by a newer draft",
      });
    }
  }

  const terms = termsFromAdvertiser(advertiser);
  const agreement: Agreement = {
    id: randomUUID(),
    advertiserId: advertiser.id,
    status: "draft",
    terms,
    templateVersion: TEMPLATE_VERSION,
    bodyHash: hashBody(agreementText(terms)),
    createdAt: new Date().toISOString(),
  };

  const ok = await put(agreement);
  return { ok, agreement: ok ? agreement : undefined };
}

/* ------------------------------ state changes ----------------------------- */

export async function markSent(id: string): Promise<boolean> {
  const agreement = await getAgreement(id);
  if (!agreement || agreement.status !== "draft") return false;
  return put({ ...agreement, status: "sent", sentAt: new Date().toISOString() });
}

/**
 * Records that the client opened it. Only ever moves `sent` forward, so a
 * signed agreement can't be knocked back by someone revisiting the link.
 */
export async function markViewed(id: string): Promise<void> {
  const agreement = await getAgreement(id);
  if (!agreement || agreement.status !== "sent") return;
  await put({ ...agreement, status: "viewed", viewedAt: new Date().toISOString() });
}

export type SignResult = { ok: boolean; error?: string };

/**
 * The client signs.
 *
 * Refuses if the text has changed since it was prepared — a signature is only
 * worth anything if we can say exactly what was signed, and a mismatch there
 * means we cannot.
 */
export async function signAgreement(
  id: string,
  input: { name: string; ip: string; userAgent: string },
): Promise<SignResult> {
  const agreement = await getAgreement(id);
  if (!agreement) return { ok: false, error: "notfound" };
  if (agreement.status === "void") return { ok: false, error: "void" };
  if (agreement.signature) return { ok: false, error: "alreadysigned" };
  if (agreement.status === "draft") return { ok: false, error: "notsent" };

  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "name" };

  const currentHash = hashBody(agreementText(agreement.terms));
  if (currentHash !== agreement.bodyHash) return { ok: false, error: "changed" };

  const ok = await put({
    ...agreement,
    status: "signed",
    signature: {
      name,
      email: agreement.terms.email,
      ip: input.ip,
      userAgent: input.userAgent.slice(0, 300),
      at: new Date().toISOString(),
      bodyHash: currentHash,
    },
  });

  return ok ? { ok: true } : { ok: false, error: "save" };
}

/** Our half. Only possible once the client has signed. */
export async function countersignAgreement(
  id: string,
  name: string,
): Promise<SignResult> {
  const agreement = await getAgreement(id);
  if (!agreement) return { ok: false, error: "notfound" };
  if (agreement.status !== "signed") return { ok: false, error: "notsigned" };

  const ok = await put({
    ...agreement,
    status: "countersigned",
    countersignature: { name: name.trim() || "Smart Scale", at: new Date().toISOString() },
  });

  return ok ? { ok: true } : { ok: false, error: "save" };
}

/** Cancels one. Kept on file — a voided agreement is part of the history. */
export async function voidAgreement(id: string, reason: string): Promise<boolean> {
  const agreement = await getAgreement(id);
  if (!agreement) return false;
  return put({
    ...agreement,
    status: "void",
    voidedAt: new Date().toISOString(),
    voidReason: reason.trim().slice(0, 200) || "Cancelled",
  });
}
