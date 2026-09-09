import type { AdLinkRecord } from "@/lib/ads/link-store";

/**
 * A registry link with its all-time scan count attached, net of any scans
 * marked as testing, and how many those were, so the registry can say so.
 */
export type LinkView = AdLinkRecord & { scans: number; testScans: number };

export const ADMIN = "/advertise/admin";

/**
 * The pages of the portal. Each is a real route now; the old `?tab=` names
 * are kept as keys so the existing components' links keep resolving.
 */
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

const TAB_PATH: Record<TabId, string> = {
  overview: ADMIN,
  advertisers: `${ADMIN}/advertisers`,
  // Categories live at the bottom of the pipeline page now.
  categories: `${ADMIN}/pipeline#categories`,
  reports: `${ADMIN}/reports`,
  qr: `${ADMIN}/qr`,
  prospects: `${ADMIN}/pipeline`,
  // The venue split moved onto the payments page.
  venue: `${ADMIN}/payments#venue`,
  setup: `${ADMIN}/setup`,
};

/** The URL of a page, with any query carried along. */
export function tabHref(tab: TabId, extra?: Record<string, string>): string {
  const [path, hash] = TAB_PATH[tab].split("#");
  const query = extra && Object.keys(extra).length ? `?${new URLSearchParams(extra)}` : "";
  return `${path}${query}${hash ? `#${hash}` : ""}`;
}

/** Where one client's details open: their row on the advertisers page. */
export function clientHref(id: string, panel?: string): string {
  const params = new URLSearchParams({ open: id });
  if (panel) params.set("panel", panel);
  return `${ADMIN}/advertisers?${params}#client-${id}`;
}
