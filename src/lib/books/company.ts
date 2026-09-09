/**
 * The company record: the facts about Smart Scale LLC you are asked for at
 * the bank, by the CPA, on every form.
 *
 * One record. The EIN is sealed with the file key and shown masked; a
 * reveal is a deliberate act that goes in the audit log. Annual filings are
 * kept as a month and a day, so the next one is always computed and lands
 * on Today as it approaches without anyone bumping a year by hand.
 */

import { randomBytes } from "crypto";
import { redisPipeline, redisWrite } from "@/lib/ads/redis";
import { isFileKeyConfigured, openText, sealText } from "./crypto";

const KEY = "books:company";
const REVEAL = (token: string) => `books:reveal:${token}`;
const REVEAL_SECONDS = 90;

export type Member = { name: string; role: string; sharePercent: number };
export type Filing = { id: string; label: string; month: number; day: number; note: string };

export type Company = {
  legalName: string;
  dba: string;
  entityType: string;
  taxElection: string;
  state: string;
  formedOn: string;
  /** Sealed with BOOKS_FILE_KEY. Never rendered as-is. */
  einSealed?: string;
  einLast4?: string;
  registeredAgent: { name: string; address: string };
  principalAddress: string;
  mailingAddress: string;
  members: Member[];
  bank: { name: string; last4: string };
  filings: Filing[];
  notes: string;
  updatedAt?: string;
  updatedBy?: string;
};

export const EMPTY_COMPANY: Company = {
  legalName: "Smart Scale LLC",
  dba: "",
  entityType: "Limited liability company",
  taxElection: "Partnership (Form 1065)",
  state: "Texas",
  formedOn: "",
  registeredAgent: { name: "", address: "" },
  principalAddress: "",
  mailingAddress: "",
  members: [
    { name: "Dessi", role: "Member", sharePercent: 50 },
    { name: "Jay", role: "Member", sharePercent: 50 },
  ],
  bank: { name: "First Convenience Bank", last4: "" },
  filings: [
    { id: "f1065", label: "Federal partnership return (Form 1065)", month: 3, day: 15, note: "K-1s to each member" },
    { id: "tx-franchise", label: "Texas franchise tax report", month: 5, day: 15, note: "Public information report with it" },
  ],
  notes: "",
};

export async function getCompany(): Promise<Company> {
  const [raw] = await redisPipeline([["GET", KEY]]);
  try {
    return raw ? { ...EMPTY_COMPANY, ...(JSON.parse(String(raw)) as Partial<Company>) } : EMPTY_COMPANY;
  } catch {
    return EMPTY_COMPANY;
  }
}

export async function saveCompany(company: Company): Promise<boolean> {
  return redisWrite([["SET", KEY, JSON.stringify(company)]]);
}

/* ----------------------------------- EIN ----------------------------------- */

export function isEinStorable(): boolean {
  return isFileKeyConfigured();
}

/** "12-3456789" or "123456789" → stored sealed, last four kept for the mask. */
export function sealEin(raw: string): { einSealed: string; einLast4: string } | { error: string } {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 9) return { error: "An EIN is nine digits, like 12-3456789." };
  if (!isFileKeyConfigured()) return { error: "BOOKS_FILE_KEY isn't set, so the EIN can't be sealed. It's on the Setup page." };
  return { einSealed: sealText(`${digits.slice(0, 2)}-${digits.slice(2)}`), einLast4: digits.slice(-4) };
}

export function maskedEin(company: Company): string {
  return company.einLast4 ? `••-•••${company.einLast4}` : "";
}

export function revealEin(company: Company): string | null {
  if (!company.einSealed || !isFileKeyConfigured()) return null;
  try {
    return openText(company.einSealed);
  } catch {
    return null;
  }
}

/** A one-time token so a reveal cannot be bookmarked or replayed. */
export async function issueRevealToken(): Promise<string> {
  const token = randomBytes(12).toString("hex");
  await redisWrite([["SET", REVEAL(token), "1", "EX", REVEAL_SECONDS]]);
  return token;
}

export async function takeRevealToken(token: string | undefined): Promise<boolean> {
  if (!token || !/^[a-f0-9]{24}$/.test(token)) return false;
  const [hit] = await redisPipeline([["GET", REVEAL(token)]]);
  if (!hit) return false;
  await redisWrite([["DEL", REVEAL(token)]]);
  return true;
}

/* --------------------------------- filings --------------------------------- */

/** The next YYYY-MM-DD this filing falls on, from today. */
export function nextDue(filing: Filing, today: string): string {
  const [y] = today.split("-").map(Number);
  const candidate = (year: number) => `${year}-${String(filing.month).padStart(2, "0")}-${String(filing.day).padStart(2, "0")}`;
  return candidate(y) >= today ? candidate(y) : candidate(y + 1);
}

/** Filings within the window, with the key a Done marker uses for that year. */
export function filingsDue(filings: Filing[], today: string, windowDays = 45): { filing: Filing; dueOn: string; daysLeft: number; key: string }[] {
  return filings
    .map((filing) => {
      const dueOn = nextDue(filing, today);
      return {
        filing,
        dueOn,
        daysLeft: Math.round((Date.parse(dueOn) - Date.parse(today)) / 86_400_000),
        key: `filing:${filing.id}:${dueOn.slice(0, 4)}`,
      };
    })
    .filter((f) => f.daysLeft <= windowDays)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
