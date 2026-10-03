"use server";

/**
 * The buttons on the check pages that record something. Each is a button
 * press on a page, never a link, because mail scanners and link previewers
 * open links on their own and must not be able to create a hot lead or
 * unsubscribe somebody.
 */

import { redirect } from "next/navigation";
import { requestFix, unsubscribeLead } from "@/lib/wb/check";
import { leadFromUnsubToken, verifyFixToken } from "@/lib/wb/links";
import { getReport, getScan } from "@/lib/wb/store";

const field = (data: FormData, name: string) => String(data.get(name) ?? "").trim();

/** "Fix my website for me" on the summary a visitor sees after their scan. */
export async function fixFromScanAction(data: FormData) {
  const scan = await getScan(field(data, "scanId"));
  if (scan) await requestFix(scan.leadId, "summary");
  redirect("/check/thanks?for=fix");
}

/** The same button on the full report. */
export async function fixFromReportAction(data: FormData) {
  const stored = await getReport(field(data, "reportId"));
  if (stored) await requestFix(stored.leadId, "report");
  redirect("/check/thanks?for=fix");
}

/** The confirmation page an email's "Fix my website for me" link opens. */
export async function fixFromEmailAction(data: FormData) {
  const leadId = field(data, "leadId");
  if (verifyFixToken(leadId, field(data, "t"))) await requestFix(leadId, "email");
  redirect("/check/thanks?for=fix");
}

export async function unsubscribeAction(data: FormData) {
  const token = field(data, "t");
  const leadId = leadFromUnsubToken(token);
  if (leadId) await unsubscribeLead(leadId);
  redirect(`/check/unsubscribe?t=${encodeURIComponent(token)}&done=1`);
}
