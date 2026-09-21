/**
 * The handful of business numbers that change without a deploy.
 *
 * The venue owner's revenue share is the reason this exists. It is a negotiated
 * figure between two people, it will be renegotiated, and it appears on a
 * document handed to the other party — none of which describes something that
 * should live in source and wait for a deploy to change.
 */

import { redisPipeline, redisWrite } from "./redis";

const KEY = "ads:settings";

export type Settings = {
  /** The venue owner's cut of collected revenue, as a percentage. */
  venueSharePercent: number;
  /** Who the statement is addressed to. */
  venueOwnerName: string;
  venueOwnerEmail: string;
  /**
   * Monthly reports go to clients on their own. Off: the daily job drafts
   * them on the 1st and someone presses Send on each. On: the drafts still
   * appear on the 1st, a preview of each lands at the team addresses, and
   * the next daily run sends whatever is still a draft, so there is always
   * one day to skip a report that reads wrong.
   */
  autoSendReports: boolean;
  updatedAt: string;
};

export const DEFAULT_SETTINGS: Settings = {
  // Zero rather than a guess: a statement showing a share nobody agreed to is
  // worse than one that plainly says the split hasn't been set yet.
  venueSharePercent: 0,
  venueOwnerName: "",
  venueOwnerEmail: "",
  autoSendReports: false,
  updatedAt: "",
};

export async function getSettings(): Promise<Settings> {
  const [raw] = await redisPipeline([["GET", KEY]]);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(String(raw)) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function validateSharePercent(raw: string): number | null {
  const n = Number(raw.replace(/[%\s]/g, ""));
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  // Two decimal places is finer than any split anyone negotiates out loud, and
  // stops a rounding argument before it starts.
  return Math.round(n * 100) / 100;
}

export async function saveSettings(
  input: Omit<Settings, "updatedAt">,
): Promise<boolean> {
  const record: Settings = { ...input, updatedAt: new Date().toISOString() };
  return redisWrite([["SET", KEY, JSON.stringify(record)]]);
}

export async function setAutoSendReports(on: boolean): Promise<boolean> {
  const current = await getSettings();
  return saveSettings({ ...current, autoSendReports: on });
}

/** The venue owner's cut of a given amount, rounded to the cent. */
export function venueShareOf(amount: number, percent: number): number {
  return Math.round(amount * (percent / 100) * 100) / 100;
}
