"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSignedIn, signIn, signOut } from "@/lib/ads/auth";
import { runRenewalCheck } from "@/lib/ads/renewals";
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
