"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSignedIn } from "@/lib/ads/auth";
import { currentWho } from "@/lib/ads/who";
import { recordHistory } from "@/lib/ads/tasks";
import { WB_ADMIN } from "@/lib/wb/paths";
import { addEvent, getLead, getWbSettings, patchLead, saveWbSettings, type LeadStatus } from "@/lib/wb/store";

const field = (data: FormData, name: string) => String(data.get(name) ?? "").trim();

/** Every mutation re-checks the session. An action is a public endpoint. */
async function requireAdmin() {
  if (!(await isSignedIn())) redirect("/advertise/admin/signin");
}

function back(path: string, params: Record<string, string>): never {
  revalidatePath(path);
  redirect(`${path}?${new URLSearchParams(params)}`);
}

const HAND_STATUSES: LeadStatus[] = ["contacted", "won", "lost"];

/** Contacted, Won, Lost: the three a person sets. */
export async function setLeadStatusAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const status = field(data, "status") as LeadStatus;
  const path = `${WB_ADMIN}/${id}`;
  const lead = await getLead(id);
  if (!lead || !HAND_STATUSES.includes(status)) back(WB_ADMIN, { err: "wb", detail: "That lead could not be found." });

  const saved = await patchLead(id, () => ({ status }));
  if (!saved) back(path, { err: "wb" });
  const who = await currentWho();
  // Keyed by the minute, so a double click records once and a real change of
  // mind later still shows on the timeline.
  await addEvent(id, status as "contacted" | "won" | "lost", new Date().toISOString().slice(0, 16), undefined, who || undefined);
  await recordHistory({ who, kind: "lead", text: `Website lead ${lead!.businessName || lead!.email || id} marked ${status}.`, href: path });
  back(path, { msg: "wbStatus", detail: status });
}

export async function addLeadNoteAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const text = field(data, "note").slice(0, 2000);
  const path = `${WB_ADMIN}/${id}`;
  if (!text) back(path, { err: "wb", detail: "Write the note first." });
  const who = await currentWho();
  const saved = await patchLead(id, (lead) => ({ notes: [{ at: new Date().toISOString(), by: who, text }, ...lead.notes] }));
  if (!saved) back(path, { err: "wb" });
  back(path, { msg: "wbNote" });
}

export async function saveWbSettingsAction(data: FormData) {
  await requireAdmin();
  const path = `${WB_ADMIN}/settings`;
  const current = await getWbSettings();
  const ok = await saveWbSettings({
    ...current,
    postalAddress: field(data, "postalAddress").replace(/\s+/g, " ").slice(0, 200),
    scannerPaused: data.get("scannerPaused") === "on",
  });
  if (!ok) back(path, { err: "wb" });
  await recordHistory({ who: await currentWho(), kind: "other", text: "Website Business settings changed.", href: path });
  back(path, { msg: "wbSettings" });
}
