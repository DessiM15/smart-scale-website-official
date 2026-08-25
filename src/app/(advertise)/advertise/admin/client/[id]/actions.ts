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
