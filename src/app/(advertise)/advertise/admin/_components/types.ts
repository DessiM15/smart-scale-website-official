import type { AdLinkRecord } from "@/lib/ads/link-store";

/** A registry link with its all-time scan count attached. */
export type LinkView = AdLinkRecord & { scans: number };

export const TAB_IDS = [
  "overview",
  "advertisers",
  "reports",
  "qr",
  "prospects",
] as const;

export type TabId = (typeof TAB_IDS)[number];

/** Builds an admin URL that keeps the reader on the tab they are looking at. */
export function tabHref(tab: TabId, extra?: Record<string, string>): string {
  const params = new URLSearchParams({ tab, ...extra });
  return `/advertise/admin?${params}`;
}
