import type { AdLinkRecord } from "@/lib/ads/link-store";

/**
 * A registry link with its all-time scan count attached, net of any scans
 * marked as testing — and how many those were, so the registry can say so.
 */
export type LinkView = AdLinkRecord & { scans: number; testScans: number };

export const TAB_IDS = [
  "overview",
  "advertisers",
  "categories",
  "reports",
  "qr",
  "prospects",
  "venue",
  "setup",
] as const;

export type TabId = (typeof TAB_IDS)[number];

/** Builds an admin URL that keeps the reader on the tab they are looking at. */
export function tabHref(tab: TabId, extra?: Record<string, string>): string {
  const params = new URLSearchParams({ tab, ...extra });
  return `/advertise/admin?${params}`;
}
