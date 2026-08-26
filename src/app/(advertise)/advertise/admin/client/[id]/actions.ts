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
import { getAdvertiser, saveAdvertiser } from "@/lib/ads/roster";
import {
  countersignAgreement,
  getAgreement,
  markSent as markAgreementSent,
  prepareAgreement,
  voidAgreement,
} from "@/lib/ads/agreements";
import { agreementEmail, isEmailConfigured, sendEmail } from "@/lib/ads/email";
import { agreementUrl } from "@/lib/ads/links";

const profilePath = (id: string) => `/advertise/admin/client/${id}`;

const field = (data: FormData, name: string) =>
  String(data.get(name) ?? "").trim();

/** Every mutation re-checks the session — an action is a public endpoint. */
async function requireAdmin() {
  if (!(await isSignedIn())) redirect("/advertise/admin");
}

/**
 * Back to the profile that was being edited, carrying the result. Errors carry
 * their own detail because these actions fail for reasons a generic "couldn't
 * save" wouldn't explain — a file too large, a code already printed elsewhere.
 */
function back(id: string, params: Record<string, string>): never {
  // Without an id there is no profile to go back to, and inventing one would
  // land the reader on a 404 instead of the message.
  const target = id ? profilePath(id) : "/advertise/admin";
  redirect(`${target}?${new URLSearchParams(params)}`);
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
  revalidatePath(profilePath(id));
  back(id, { msg: "notesSaved" });
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

  revalidatePath(profilePath(id));
  back(id, { msg: "artworkSaved" });
}

export async function deleteArtworkAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const artworkId = field(data, "artworkId");
  if (!id || !artworkId) back(id, { err: "missing" });
  if (!(await deleteArtwork(id, artworkId))) back(id, { err: "save" });
  revalidatePath(profilePath(id));
  back(id, { msg: "artworkRemoved" });
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

  revalidatePath(profilePath(id));
  back(id, { msg: "linkAdded", detail: code });
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
  revalidatePath(profilePath(id));
  back(id, { msg: "linkSaved", detail: code });
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
  revalidatePath(profilePath(id));
  back(id, { msg: "agreementPrepared" });
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

  revalidatePath(profilePath(id));
  back(id, { msg: "agreementSent", detail: agreement.terms.email });
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

  revalidatePath(profilePath(id));
  back(id, { msg: "agreementDone" });
}

export async function voidAgreementAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const agreementId = field(data, "agreementId");
  if (!id || !agreementId) back(id, { err: "missing" });
  if (!(await voidAgreement(agreementId, field(data, "reason")))) {
    back(id, { err: "save" });
  }
  revalidatePath(profilePath(id));
  back(id, { msg: "agreementVoided" });
}
