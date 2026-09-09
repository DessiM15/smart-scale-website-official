"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSignedIn } from "@/lib/ads/auth";
import { deleteArtwork, uploadArtwork } from "@/lib/ads/artwork";
import {
  getLink,
  linksForAdvertiser,
  listLinks,
  normalizeCode,
  saveLink,
  suggestCode,
  suggestPlacementCode,
  validateCode,
  validateDestination,
} from "@/lib/ads/link-store";
import { artworkStatusOf, getAdvertiser, saveAdvertiser } from "@/lib/ads/roster";
import {
  countersignAgreement,
  fileAgreement,
  getAgreement,
  markSent as markAgreementSent,
  prepareAgreement,
  voidAgreement,
} from "@/lib/ads/agreements";
import { deleteDocument, uploadDocument } from "@/lib/ads/documents";
import {
  deletePayment,
  recordPayment,
  type PaymentMethod,
} from "@/lib/ads/payments";
import { agreementEmail, isEmailConfigured, sendEmail } from "@/lib/ads/email";
import { agreementUrl } from "@/lib/ads/links";
import { recordHistory } from "@/lib/ads/tasks";
import { currentWho } from "@/lib/ads/who";

const field = (data: FormData, name: string) =>
  String(data.get(name) ?? "").trim();

/** Every mutation re-checks the session — an action is a public endpoint. */
async function requireAdmin() {
  if (!(await isSignedIn())) redirect("/advertise/admin/signin");
}

/**
 * Back to the profile that was being edited, carrying the result. Errors carry
 * their own detail because these actions fail for reasons a generic "couldn't
 * save" wouldn't explain — a file too large, a code already printed elsewhere.
 */
function back(id: string, params: Record<string, string>, panel?: string): never {
  // Without an id there is no client to go back to, and inventing one would
  // land the reader on a 404 instead of the message.
  if (!id) redirect(`/advertise/admin/advertisers?${new URLSearchParams(params)}`);
  const query = new URLSearchParams({ open: id, ...(panel ? { panel } : {}), ...params });
  revalidatePath("/advertise/admin/advertisers");
  redirect(`/advertise/admin/advertisers?${query}#client-${id}`);
}

/* --------------------------------- notes ---------------------------------- */

export async function saveNotesAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const existing = id ? await getAdvertiser(id) : null;
  if (!existing) back(id, { err: "missing" });

  const { ok } = await saveAdvertiser(
    { ...existing, notes: field(data, "notes") },
    id,
  );
  if (!ok) back(id, { err: "save" });
  back(id, { msg: "notesSaved" }, "notes");
}

/* -------------------------------- artwork --------------------------------- */

export async function uploadArtworkAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  if (!id) back(id, { err: "missing" });

  const file = data.get("artwork");
  if (!(file instanceof File) || file.size === 0) {
    back(id, { err: "artworkmissing" });
  }

  const result = await uploadArtwork(id, file, field(data, "note"));
  if (!result.ok) back(id, { err: "artwork", detail: result.error ?? "" });

  // A slide arriving is what "received" means, so the status follows the
  // upload unless it is already further along.
  const advertiser = await getAdvertiser(id);
  if (advertiser && artworkStatusOf(advertiser) === "requested") {
    await saveAdvertiser({ ...advertiser, artworkStatus: "received" }, id);
  }

  back(id, { msg: "artworkSaved" }, "artwork");
}

export async function deleteArtworkAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const artworkId = field(data, "artworkId");
  if (!id || !artworkId) back(id, { err: "missing" });
  if (!(await deleteArtwork(id, artworkId))) back(id, { err: "save" });
  back(id, { msg: "artworkRemoved" }, "artwork");
}

/* -------------------------------- QR codes -------------------------------- */

/**
 * Another code for a client who already has one — a flyer, a window cling, a
 * table tent. Each is counted separately, which is the whole point: it's how
 * you find out which placement is actually working.
 */
export async function addClientLinkAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const advertiser = id ? await getAdvertiser(id) : null;
  if (!advertiser) back(id, { err: "missing" });

  const destination = field(data, "destination");
  const destError = validateDestination(destination);
  if (destError) back(id, { err: "destination", detail: destError });

  const label = field(data, "label");
  const existing = await listLinks();
  const taken = existing.map((l) => l.code);

  // A blank code is named off whatever they already have plus the placement, so
  // a second code reads as "rio-flyer" rather than "rio-2". A client with no
  // code yet just gets named from the business as usual.
  const theirs = linksForAdvertiser(existing, id, advertiser.qrCode);
  // Their main code is the base when there is one — links come back sorted by
  // name, so the first in the list isn't necessarily theirs to build on.
  const base = normalizeCode(advertiser.qrCode) || theirs[0]?.code || "";
  const requested = normalizeCode(field(data, "code"));
  const code =
    requested ||
    (base
      ? suggestPlacementCode(base, label, taken)
      : suggestCode(advertiser.business, taken));

  const codeError = validateCode(code);
  if (codeError) back(id, { err: "code", detail: codeError });
  if (taken.includes(code)) back(id, { err: "codetaken", detail: code });

  const ok = await saveLink({
    code,
    label: label || advertiser.business,
    destination,
    active: true,
    tagDestination: true,
    advertiserId: id,
  });
  if (!ok) back(id, { err: "save" });

  // Their first code doubles as the one the renewal email talks about.
  if (!advertiser.qrCode) {
    await saveAdvertiser({ ...advertiser, qrCode: code }, id);
  }

  back(id, { msg: "linkAdded", detail: code }, "codes");
}

/** Repointing a code is the whole reason we own the redirect. */
export async function repointClientLinkAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const code = normalizeCode(field(data, "code"));
  if (!id || !code) back(id, { err: "missing" });

  const destination = field(data, "destination");
  const destError = validateDestination(destination);
  if (destError) back(id, { err: "destination", detail: destError });

  const link = await getLink(code);
  if (!link) back(id, { err: "codemissing", detail: code });

  const ok = await saveLink({
    ...link,
    destination,
    logoDataUri: link.logoDataUri ?? null,
    advertiserId: id,
  });
  if (!ok) back(id, { err: "save" });
  back(id, { msg: "linkSaved", detail: code }, "codes");
}

/* ------------------------------- agreements ------------------------------- */

/**
 * Builds a fresh draft from whatever the client is on right now.
 *
 * Re-preparing is the way to fix a wrong number: the old draft is voided and a
 * new one takes its place, rather than the terms being edited underneath a
 * document someone may already be reading.
 */
export async function prepareAgreementAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const advertiser = id ? await getAdvertiser(id) : null;
  if (!advertiser) back(id, { err: "missing" });

  const { ok } = await prepareAgreement(advertiser);
  if (!ok) back(id, { err: "save" });
  back(id, { msg: "agreementPrepared" }, "agreement");
}

export async function sendAgreementAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const agreementId = field(data, "agreementId");
  if (!id || !agreementId) back(id, { err: "missing" });

  const agreement = await getAgreement(agreementId);
  if (!agreement) back(id, { err: "missing" });
  if (!agreement.terms.email) back(id, { err: "agreementNoEmail" });
  if (!isEmailConfigured()) back(id, { err: "agreementNoMail" });

  const url = agreementUrl(agreementId);
  if (!url) back(id, { err: "agreementNoSecret" });

  // Marked sent before the send, so a client who receives it can always open
  // it — a record still sitting in `draft` refuses to be signed.
  if (!(await markAgreementSent(agreementId))) back(id, { err: "agreementState" });

  const message = agreementEmail(agreement.terms, url);
  const result = await sendEmail({ to: agreement.terms.email, ...message });
  if (!result.ok) back(id, { err: "agreementSend", detail: result.error ?? "" });

  back(id, { msg: "agreementSent", detail: agreement.terms.email }, "agreement");
}

/**
 * Our half of the signature. Only reachable once the client has signed, which
 * is what makes the countersignature mean anything.
 */
export async function countersignAgreementAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const agreementId = field(data, "agreementId");
  if (!id || !agreementId) back(id, { err: "missing" });

  const agreement = await getAgreement(agreementId);
  if (!agreement) back(id, { err: "missing" });

  const result = await countersignAgreement(agreementId, field(data, "name"));
  if (!result.ok) back(id, { err: "agreementState", detail: result.error ?? "" });

  // Stamp the term this covers onto the client, so the roster can tell at a
  // glance who is running without paperwork — and so a renewal, which moves the
  // end date, correctly starts asking for a fresh agreement.
  const advertiser = await getAdvertiser(id);
  if (advertiser) {
    await saveAdvertiser(
      { ...advertiser, signedAgreementEndDate: agreement.terms.endDate },
      id,
    );
  }

  back(id, { msg: "agreementDone" }, "agreement");
}

export async function voidAgreementAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const agreementId = field(data, "agreementId");
  if (!id || !agreementId) back(id, { err: "missing" });
  if (!(await voidAgreement(agreementId, field(data, "reason")))) {
    back(id, { err: "save" });
  }
  back(id, { msg: "agreementVoided" }, "agreement");
}

/* --------------------------- agreements from elsewhere -------------------- */

/**
 * Files an agreement that was signed somewhere else.
 *
 * The file goes to the private store and the record goes straight to `filed`.
 * Nothing here reads the PDF, so the covered term, the signer and the date are
 * asked for rather than inferred — a guess on a contract is worse than a blank.
 */
export async function uploadAgreementAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const advertiser = id ? await getAdvertiser(id) : null;
  if (!advertiser) back(id, { err: "missing" });

  const file = data.get("document");
  if (!(file instanceof File) || file.size === 0) back(id, { err: "docmissing" });

  const signedOn = field(data, "signedOn");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(signedOn)) back(id, { err: "docsigneddate" });

  const coversEndDate = field(data, "coversEndDate");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(coversEndDate)) back(id, { err: "doccovers" });

  const signerName = field(data, "signerName");
  if (signerName.length < 2) back(id, { err: "docsigner" });

  const stored = await uploadDocument(id, file, {
    kind: "agreement",
    label: field(data, "label") || "Signed agreement",
  });
  if (!stored.ok) back(id, { err: "docupload", detail: stored.error });

  const { ok } = await fileAgreement(advertiser, {
    documentId: stored.document.id,
    bodyHash: stored.document.sha256,
    signerName,
    signedOn,
    coversEndDate,
    note: field(data, "note"),
  });

  if (!ok) {
    // The record is what makes the file reachable; an orphan helps nobody.
    await deleteDocument(stored.document.id);
    back(id, { err: "save" });
  }

  // Same stamp the countersign path writes, so the roster stops flagging them.
  await saveAdvertiser({ ...advertiser, signedAgreementEndDate: coversEndDate }, id);

  back(id, { msg: "agreementFiled" }, "agreement");
}

/** Any other paperwork worth keeping on a client — a W-9, a COI, a scan. */
export async function uploadDocumentAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  if (!id) back(id, { err: "missing" });

  const file = data.get("document");
  if (!(file instanceof File) || file.size === 0) back(id, { err: "docmissing" });

  const stored = await uploadDocument(id, file, {
    kind: "other",
    label: field(data, "label") || file.name,
  });
  if (!stored.ok) back(id, { err: "docupload", detail: stored.error });

  back(id, { msg: "documentSaved" }, "agreement");
}

export async function deleteDocumentAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const documentId = field(data, "documentId");
  if (!id || !documentId) back(id, { err: "missing" });
  if (!(await deleteDocument(documentId))) back(id, { err: "save" });
  back(id, { msg: "documentRemoved" }, "agreement");
}

/* -------------------------------- payments -------------------------------- */

/**
 * Records money that arrived. Not an invoice — Stripe sends those — just the
 * fact of a payment, which is what the venue statement is calculated from.
 */
export async function recordPaymentAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const advertiser = id ? await getAdvertiser(id) : null;
  if (!advertiser) back(id, { err: "missing" });

  const amount = Number(field(data, "amount").replace(/[$,\s]/g, ""));
  const receivedOn = field(data, "receivedOn");

  const result = await recordPayment({
    advertiserId: id,
    business: advertiser.business,
    amount,
    receivedOn,
    method: (field(data, "method") || "stripe") as PaymentMethod,
    reference: field(data, "reference"),
    note: field(data, "note"),
    period: /^\d{4}-\d{2}$/.test(field(data, "period")) ? field(data, "period") : undefined,
    who: await currentWho(),
  });

  if (!result.ok) back(id, { err: "payment", detail: result.error ?? "" });
  await recordHistory({
    who: await currentWho(),
    kind: "payment",
    text: `Recorded $${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })} from ${advertiser.business}.`,
    href: `/advertise/admin/advertisers?open=${id}&panel=payments`,
  });
  back(id, { msg: "paymentRecorded" }, "payments");
}

export async function deletePaymentAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const paymentId = field(data, "paymentId");
  if (!id || !paymentId) back(id, { err: "missing" });
  if (!(await deletePayment(paymentId))) back(id, { err: "save" });
  back(id, { msg: "paymentRemoved" }, "payments");
}
