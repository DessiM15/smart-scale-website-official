"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSignedIn, signIn, signOut } from "@/lib/ads/auth";
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
  normalizeCode,
  saveLink,
  setLinkActive,
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

/** Every mutation re-checks the session — an action is a public endpoint. */
async function requireAdmin() {
  if (!(await isSignedIn())) redirect(PAGE);
}

function back(params: Record<string, string>): never {
  redirect(`${PAGE}?${new URLSearchParams(params)}`);
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
      qrCode: field(data, "qrCode").toLowerCase(),
      notes: field(data, "notes"),
    },
    id,
  );

  if (!ok) back({ err: "save" });
  revalidatePath(PAGE);
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
