import type { Tone } from "../../_components/ui";
import type { EventType, Lead, LeadStatus } from "@/lib/wb/store";

export const STATUS_LABEL: Record<LeadStatus, string> = {
  mailed: "Mailed",
  visited: "Visited",
  scanned: "Scanned",
  hot: "Hot",
  contacted: "Contacted",
  won: "Won",
  lost: "Lost",
};

export const STATUS_TONE: Record<LeadStatus, Tone> = {
  mailed: "neutral",
  visited: "neutral",
  scanned: "warn",
  hot: "brand",
  contacted: "ok",
  won: "ok",
  lost: "neutral",
};

export const SOURCE_LABEL: Record<string, string> = {
  nav: "Header button",
  homepage: "Homepage",
  footer: "Footer",
  "ada-blog": "ADA blog post",
  postcard: "Postcard",
  email: "Email",
  direct: "Direct",
  other: "Other",
};

export const EVENT_LABEL: Record<EventType, string> = {
  mailed: "Postcard mailed",
  delivered: "Postcard delivered",
  returned: "Postcard returned",
  visited: "Visited the check page",
  scan_started: "Scan started",
  scan_completed: "Scan completed",
  scan_failed: "Scan failed",
  fix_requested: "Asked us to fix the site",
  no_website_interested: "Has no website, wants one",
  email_sent: "Email sent",
  email_held: "Email held",
  email_unsubscribed: "Unsubscribed from email",
  mail_opted_out: "Opted out of mail",
  contacted: "Marked contacted",
  won: "Marked won",
  lost: "Marked lost",
};

/** What to call a lead in a list: the business, else the site, else the person. */
export function leadName(lead: Lead): string {
  const site = (lead.website ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  return lead.businessName || site || lead.contactName || lead.email || "Unnamed lead";
}

export function scanLine(lead: Lead): string {
  const scan = lead.scan;
  if (!scan) return lead.hotReason === "no_website" ? "No website yet" : "No scan";
  if (scan.state === "running") return "Scan running";
  if (scan.state === "failed") return "Scan failed, check by hand";
  const problems = scan.problems ?? 0;
  if (problems === 0) return "No problems found";
  return `${problems} problem${problems === 1 ? "" : "s"}${scan.serious ? `, ${scan.serious} serious` : ""}`;
}
