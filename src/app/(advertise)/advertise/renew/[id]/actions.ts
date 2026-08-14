"use server";

import { redirect } from "next/navigation";
import { verifyRenewalToken } from "@/lib/ads/links";
import { getAdvertiser, toView, PLANS, type PlanId } from "@/lib/ads/roster";
import { recordResponse, type RenewalChoice } from "@/lib/ads/responses";
import { sendTeamSms } from "@/lib/ads/notify";

const CHOICES: RenewalChoice[] = ["renew", "change", "cancel"];

export async function submitRenewalChoice(data: FormData) {
  const id = String(data.get("id") ?? "");
  const token = String(data.get("token") ?? "");
  const choice = String(data.get("choice") ?? "") as RenewalChoice;
  const requestedPlan = String(data.get("requestedPlan") ?? "") as PlanId;
  const note = String(data.get("note") ?? "").trim().slice(0, 500);

  const base = `/advertise/renew/${encodeURIComponent(id)}?t=${encodeURIComponent(token)}`;

  if (!CHOICES.includes(choice)) redirect(`${base}&err=choice`);

  const advertiser = await getAdvertiser(id);
  if (!advertiser) redirect(`${base}&err=link`);

  const view = toView(advertiser);
  // Re-verified here, not just on the page render — an action is a public
  // endpoint, and the token is the only thing standing in front of it.
  if (!verifyRenewalToken(id, view.endDate, token)) redirect(`${base}&err=link`);

  const plan = choice === "change" && PLANS[requestedPlan] ? requestedPlan : undefined;

  const saved = await recordResponse({
    advertiserId: id,
    business: view.business,
    endDate: view.endDate,
    choice,
    requestedPlan: plan,
    note: note || undefined,
    at: new Date().toISOString(),
  });

  if (!saved) redirect(`${base}&err=save`);

  await sendTeamSms(teamMessage(view.business, view.endDate, choice, plan, note));

  redirect(`${base}&done=${choice}`);
}

function teamMessage(
  business: string,
  endDate: string,
  choice: RenewalChoice,
  plan?: PlanId,
  note?: string,
): string {
  const what =
    choice === "renew"
      ? "wants to RENEW"
      : choice === "change"
        ? `wants to CHANGE to ${plan ? PLANS[plan].name : "a different package"}`
        : "wants to END their run";
  const tail = note ? ` Note: "${note.slice(0, 80)}"` : "";
  return `Mex Taco ads · ${business} ${what} (term ends ${endDate}).${tail} Confirm in the tracker: smartscaleagent.com/advertise/admin`;
}
