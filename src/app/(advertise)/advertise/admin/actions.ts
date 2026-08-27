"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSignedIn, signIn, signOut } from "@/lib/ads/auth";
import {
  isEmailConfigured,
  keyFingerprint,
  sendEmail,
  testEmail,
  type TestKind,
} from "@/lib/ads/email";
import { runBackup } from "@/lib/ads/backup";
import {
  getSettings,
  saveSettings,
  validateSharePercent,
} from "@/lib/ads/settings";
import { runRenewalCheck } from "@/lib/ads/renewals";
import { clearResponse } from "@/lib/ads/responses";
import {
  generateReports,
  sendReport,
  skipReport,
  updateNarrative,
} from "@/lib/ads/reports";
import {
  getLink,
  listLinks,
  normalizeCode,
  saveLink,
  setLinkActive,
  suggestCode,
  validateCode,
  validateDestination,
} from "@/lib/ads/link-store";
import {
  categoryConflict,
  deleteAdvertiser,
  deleteProspect,
  listAdvertisers,
  saveAdvertiser,
  saveProspect,
  type AdvertiserStatus,
  type PlanId,
  type ProspectStatus,
  PLANS,
} from "@/lib/ads/roster";

const PAGE = "/advertise/admin";

const field = (data: FormData, name: string) =>
  String(data.get(name) ?? "").trim();

/**
 * A money or term field that is allowed to be left blank.
 *
 * Blank means "use the package price", which is not the same as zero — a free
 * spot is a deliberate $0 override, so an empty box must never become one.
 */
function optionalNumber(data: FormData, name: string): number | null {
  const raw = field(data, name).replace(/[$,\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** True when the box had something in it, whether or not it parsed. */
const wasFilled = (data: FormData, name: string) =>
  field(data, name).replace(/[$,\s]/g, "").length > 0;

/** Every mutation re-checks the session — an action is a public endpoint. */
async function requireAdmin() {
  if (!(await isSignedIn())) redirect(PAGE);
}

/**
 * Back to the tracker with the result.
 *
 * `anchor` matters more than it looks: the result banner sits at the top of the
 * page, and an action taken from a form halfway down reloads to a restored
 * scroll position where nothing appears to have changed. Sending the reader
 * back to the thing they just used is the difference between "it worked" and
 * "nothing happened".
 */
function back(params: Record<string, string>, anchor?: string): never {
  const hash = anchor ? `#${anchor}` : "";
  redirect(`${PAGE}?${new URLSearchParams(params)}${hash}`);
}

export async function signInAction(data: FormData) {
  const ok = await signIn(field(data, "key"));
  if (!ok) back({ err: "badkey" });
  redirect(PAGE);
}

export async function signOutAction() {
  await signOut();
  redirect(PAGE);
}

export async function saveAdvertiserAction(data: FormData) {
  await requireAdmin();

  const id = field(data, "id") || undefined;
  const business = field(data, "business");
  const category = field(data, "category");
  const plan = field(data, "plan") as PlanId;
  const startDate = field(data, "startDate");
  const status = (field(data, "status") || "active") as AdvertiserStatus;

  if (!business) back({ err: "business" });
  if (!PLANS[plan]) back({ err: "plan" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) back({ err: "startdate" });

  // Category exclusivity is the product — verify it rather than trust the form.
  if (status === "active") {
    const clash = categoryConflict(await listAdvertisers(), category, id);
    if (clash) back({ err: "category", clash: clash.business });
  }

  /* ---------------------------- the deal ---------------------------- */

  const customMonthly = optionalNumber(data, "customMonthly");
  const customSetup = optionalNumber(data, "customSetup");
  const customMonths = optionalNumber(data, "customMonths");
  const customTotal = optionalNumber(data, "customTotal");
  const dealNote = field(data, "dealNote");

  // A number that was typed but didn't parse would silently fall back to list
  // price, which is exactly the kind of quiet wrongness this whole change is
  // meant to remove.
  for (const name of ["customMonthly", "customSetup", "customMonths", "customTotal"] as const) {
    if (wasFilled(data, name) && optionalNumber(data, name) === null) {
      back({ err: "dealnumber", detail: field(data, name) });
    }
  }
  if (customMonths !== null && customMonths < 1) back({ err: "dealmonths" });

  // Six months from now nobody remembers why this client pays less. Requiring
  // the reason at the moment of the decision is the only time it's cheap.
  const hasOverride =
    customMonthly !== null ||
    customSetup !== null ||
    customMonths !== null ||
    customTotal !== null;
  if (hasOverride && !dealNote) back({ err: "dealnote" });

  /* ------------------------- their first QR code ------------------------- */

  // Only offered when adding someone, so an existing client's codes are managed
  // from their profile rather than silently multiplying on every edit.
  const chosenCode = normalizeCode(field(data, "qrCode"));
  const newDestination = id ? "" : field(data, "newLinkDestination");
  let autoCode = "";

  if (newDestination) {
    const destError = validateDestination(newDestination);
    if (destError) back({ err: "destination", detail: destError });

    const existingLinks = await listLinks();
    const takenCodes = existingLinks.map((l) => l.code);
    const requested = normalizeCode(field(data, "newLinkCode"));

    autoCode = requested || suggestCode(business, takenCodes);
    const codeError = validateCode(autoCode);
    if (codeError) back({ err: "code", detail: codeError });
    // A printed code can never be reassigned, so a collision is a hard stop
    // rather than something to resolve by guessing.
    if (takenCodes.includes(autoCode)) back({ err: "codetaken", detail: autoCode });
  }

  const { ok, id: savedId } = await saveAdvertiser(
    {
      business,
      contactName: field(data, "contactName"),
      email: field(data, "email"),
      phone: field(data, "phone"),
      category,
      plan,
      startDate,
      status,
      qrCode: autoCode || chosenCode,
      notes: field(data, "notes"),
      customMonthly,
      customSetup,
      customMonths,
      customTotal,
      dealNote: hasOverride ? dealNote : "",
      paymentType: field(data, "paymentType") === "prepaid" ? "prepaid" : "monthly",
    },
    id,
  );

  if (!ok) back({ err: "save" });

  if (autoCode) {
    const linked = await saveLink({
      code: autoCode,
      label: business,
      destination: newDestination,
      active: true,
      tagDestination: true,
      advertiserId: savedId,
    });
    // The client is saved either way; say so plainly rather than pretending
    // the code exists when it doesn't.
    if (!linked) {
      revalidatePath(PAGE);
      back({ msg: "addedNoCode", who: savedId });
    }
  }

  // Picking an existing code from the dropdown claims it for this client, which
  // quietly migrates records made before codes had an owner. It runs even when a
  // code was just generated — a client is allowed more than one, so the pick is
  // kept rather than thrown away.
  if (chosenCode && chosenCode !== autoCode) {
    const link = await getLink(chosenCode);
    if (link && link.advertiserId !== savedId) {
      await saveLink({
        ...link,
        advertiserId: savedId,
        logoDataUri: link.logoDataUri ?? null,
      });
    }
  }

  revalidatePath(PAGE);
  if (autoCode) back({ msg: "addedWithCode", who: savedId, detail: autoCode });
  back({ msg: id ? "updated" : "added", who: savedId });
}

export async function deleteAdvertiserAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  if (!id) back({ err: "missing" });
  if (!(await deleteAdvertiser(id))) back({ err: "save" });
  revalidatePath(PAGE);
  back({ msg: "removed" });
}

export async function saveProspectAction(data: FormData) {
  await requireAdmin();

  const business = field(data, "business");
  if (!business) back({ err: "business" });

  const { ok } = await saveProspect(
    {
      business,
      contactName: field(data, "contactName"),
      email: field(data, "email"),
      phone: field(data, "phone"),
      category: field(data, "category"),
      source: field(data, "source"),
      status: (field(data, "status") || "new") as ProspectStatus,
      notes: field(data, "notes"),
    },
    field(data, "id") || undefined,
  );

  if (!ok) back({ err: "save" });
  revalidatePath(PAGE);
  back({ msg: "prospect" });
}

export async function deleteProspectAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  if (!id) back({ err: "missing" });
  if (!(await deleteProspect(id))) back({ err: "save" });
  revalidatePath(PAGE);
  back({ msg: "prospectRemoved" });
}

export async function runAlertsAction() {
  await requireAdmin();
  const result = await runRenewalCheck("manual");
  revalidatePath(PAGE);
  back({
    msg: "alerts",
    sent: String(result.sent),
    checked: String(result.checked),
    failed: String(result.failed),
  });
}

export async function clearResponseAction(data: FormData) {
  await requireAdmin();
  const advertiserId = field(data, "advertiserId");
  const endDate = field(data, "endDate");
  if (!advertiserId || !endDate) back({ err: "missing" });
  if (!(await clearResponse(advertiserId, endDate))) back({ err: "save" });
  revalidatePath(PAGE);
  back({ msg: "replyCleared" });
}

/* ------------------------------- QR codes -------------------------------- */

const LOGO_MAX_BYTES = 200 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

/**
 * Turns an uploaded logo into a data URI. Kept small deliberately — it is
 * embedded in every generated QR and stored alongside the link.
 */
async function readLogo(
  data: FormData,
): Promise<{ dataUri?: string; error?: string }> {
  const file = data.get("logo");
  if (!(file instanceof File) || file.size === 0) return {};
  if (!LOGO_TYPES.includes(file.type)) {
    return { error: "logotype" };
  }
  if (file.size > LOGO_MAX_BYTES) {
    return { error: "logosize" };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return { dataUri: `data:${file.type};base64,${buffer.toString("base64")}` };
}

export async function saveLinkAction(data: FormData) {
  await requireAdmin();

  const isNew = field(data, "isNew") === "1";
  const code = normalizeCode(field(data, "code"));
  const destination = field(data, "destination");
  const label = field(data, "label");

  const codeError = validateCode(code);
  if (codeError) back({ err: "code", detail: codeError });

  const destError = validateDestination(destination);
  if (destError) back({ err: "destination", detail: destError });

  const existing = await getLink(code);
  // The code is what gets printed, so it can never be reassigned to something
  // else — a new one must be a genuinely new name.
  if (isNew && existing) back({ err: "codetaken", detail: code });
  if (!isNew && !existing) back({ err: "codemissing", detail: code });

  const logo = await readLogo(data);
  if (logo.error) back({ err: logo.error });

  const removeLogo = field(data, "removeLogo") === "1";

  const ok = await saveLink({
    code,
    label: label || code,
    destination,
    active: field(data, "active") !== "0",
    tagDestination: field(data, "tagDestination") !== "0",
    logoDataUri: removeLogo ? null : logo.dataUri,
  });

  if (!ok) back({ err: "save" });
  revalidatePath(PAGE);
  back({ msg: isNew ? "linkAdded" : "linkSaved", who: code });
}

export async function toggleLinkActiveAction(data: FormData) {
  await requireAdmin();
  const code = normalizeCode(field(data, "code"));
  const active = field(data, "active") === "1";
  if (!(await setLinkActive(code, active))) back({ err: "save" });
  revalidatePath(PAGE);
  back({ msg: active ? "linkOn" : "linkOff", who: code });
}

/* ---------------------------- monthly reports ---------------------------- */

export async function generateReportsAction(data: FormData) {
  await requireAdmin();
  const month = field(data, "month") || undefined;
  const result = await generateReports(month);
  revalidatePath(PAGE);
  back({ msg: "reportsDrafted", sent: String(result.created), checked: String(result.skipped) });
}

export async function sendReportAction(data: FormData) {
  await requireAdmin();
  const result = await sendReport(field(data, "advertiserId"), field(data, "month"));
  if (!result.ok) back({ err: "reportsend", detail: result.error ?? "" });
  revalidatePath(PAGE);
  back({ msg: "reportSent" });
}

export async function skipReportAction(data: FormData) {
  await requireAdmin();
  if (!(await skipReport(field(data, "advertiserId"), field(data, "month")))) {
    back({ err: "save" });
  }
  revalidatePath(PAGE);
  back({ msg: "reportSkipped" });
}

export async function editReportAction(data: FormData) {
  await requireAdmin();
  const ok = await updateNarrative(
    field(data, "advertiserId"),
    field(data, "month"),
    field(data, "headline"),
    field(data, "body"),
  );
  if (!ok) back({ err: "save" });
  revalidatePath(PAGE);
  back({ msg: "reportEdited" });
}

/* ------------------------------- test send -------------------------------- */

/** The id on the test-send card, so a result lands back in view. */
const TEST_ANCHOR = "test-email";

/**
 * Sends a sample to whoever asks for it. The only way to find out that email is
 * broken should not be a client not receiving their renewal notice.
 */
export async function sendTestEmailAction(data: FormData) {
  await requireAdmin();

  const to = field(data, "to");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) back({ err: "testaddress" }, TEST_ANCHOR);
  if (!isEmailConfigured()) back({ err: "testunconfigured" }, TEST_ANCHOR);

  const kind = (field(data, "kind") || "delivery") as TestKind;
  const message = testEmail(kind === "renewal" ? "renewal" : "delivery");

  const result = await sendEmail({ to, ...message });
  if (!result.ok) {
    // A refused key looks identical whether it is wrong, truncated, or simply
    // arrived with a newline attached. Describing the key the server is
    // actually holding is the difference between diagnosing that and guessing.
    const note = /401|unauthor|token/i.test(result.error ?? "")
      ? ` — the key this deployment is using: ${keyFingerprint()}`
      : "";
    back({ err: "testsend", detail: `${result.error ?? ""}${note}` }, TEST_ANCHOR);
  }

  // Carry back what the provider said, so a send that claims to have worked can
  // be matched against Plunk's own log rather than taken on trust.
  back({ msg: "testSent", detail: to, sent: result.detail ?? "" }, TEST_ANCHOR);
}

/* -------------------------------- backups --------------------------------- */

/** Runs the nightly snapshot on demand, so it can be proven rather than waited for. */
export async function runBackupAction() {
  await requireAdmin();
  const result = await runBackup();
  if (result.skipped) back({ err: "backupoff" });
  if (!result.ok) back({ err: "backupfailed", detail: result.error ?? "" });
  revalidatePath(PAGE);
  back({
    msg: "backupDone",
    detail: `${result.entry?.advertisers ?? 0} advertisers, ${result.entry?.prospects ?? 0} prospects`,
  });
}

/* ---------------------------------- venue --------------------------------- */

export async function saveVenueSettingsAction(data: FormData) {
  await requireAdmin();

  const raw = field(data, "venueSharePercent");
  // Blank clears the split rather than defaulting to something nobody agreed.
  const percent = raw ? validateSharePercent(raw) : 0;
  if (percent === null) back({ err: "sharepercent" }, "venue-split");

  const current = await getSettings();
  const ok = await saveSettings({
    ...current,
    venueSharePercent: percent,
    venueOwnerName: field(data, "venueOwnerName"),
    venueOwnerEmail: field(data, "venueOwnerEmail"),
  });

  if (!ok) back({ err: "save" }, "venue-split");
  revalidatePath(PAGE);
  back({ msg: "venueSaved" }, "venue-split");
}
