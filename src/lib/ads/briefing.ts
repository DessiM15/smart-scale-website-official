/**
 * The line at the top of the tracker that says what today is about.
 *
 * Same rule as the monthly reports and for the same reason: **the model never
 * produces a number.** Every figure is computed here, handed over as the only
 * ones it may use, and any draft citing something it wasn't shown is thrown
 * away for the templated version. A briefing that invents a figure about your
 * own business is worse than no briefing, because you would act on it.
 *
 * It is also cached. The overview is the page you land on, and calling an API
 * on every load would be slow, expensive and pointless — the underlying facts
 * change a few times a day at most. The cache key is a fingerprint of the facts
 * themselves, so it refreshes exactly when something changes and not otherwise.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import { redisPipeline, redisWrite } from "./redis";
import { numbersIn, unsupportedNumbers } from "./narrative";
import { formatDate, type AdvertiserView, type RosterSummary } from "./roster";

const MODEL = "claude-opus-5";
const CACHE_KEY = (fingerprint: string) => `ads:briefing:${fingerprint}`;
/** Long enough to stop repeat loads paying for it, short enough to stay current. */
const CACHE_TTL_SECONDS = 6 * 60 * 60;

export function isBriefingConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export type BriefingFacts = {
  activeCount: number;
  openSlots: number;
  monthlyRevenue: number;
  /** Active terms ending within 60 days, soonest first. */
  expiring: { business: string; category: string; days: number; endDate: string }[];
  overdue: { business: string; category: string; daysAgo: number }[];
  unsignedCount: number;
  newLeadCount: number;
  repliesWaiting: number;
  /** Every number above, flattened — the only figures a draft may contain. */
  allowedNumbers: number[];
};

export type Briefing = {
  text: string;
  /** True when this came from the model rather than the fallback. */
  written: boolean;
  rejectedReason?: string;
};

/* --------------------------------- facts ---------------------------------- */

export function collectFacts(
  summary: RosterSummary,
  extras: { newLeads: number; replies: number; unsigned: number },
): BriefingFacts {
  const expiring = summary.expiring.map((v: AdvertiserView) => ({
    business: v.business,
    category: v.category,
    days: v.daysRemaining,
    endDate: formatDate(v.endDate),
  }));

  const overdue = summary.overdue.map((v: AdvertiserView) => ({
    business: v.business,
    category: v.category,
    daysAgo: Math.abs(v.daysRemaining),
  }));

  const facts: Omit<BriefingFacts, "allowedNumbers"> = {
    activeCount: summary.active,
    openSlots: summary.openSlots,
    monthlyRevenue: summary.monthlyRevenue,
    expiring,
    overdue,
    unsignedCount: extras.unsigned,
    newLeadCount: extras.newLeads,
    repliesWaiting: extras.replies,
  };

  // Numbers inside the words the model is shown count as permitted — a business
  // called "911 Repo" or a date like "Dec 28, 2026" is not an invented statistic.
  // The test is "was it shown this number", not "is it a figure".
  const fromWords = [
    ...expiring.flatMap((e) => [...numbersIn(e.business), ...numbersIn(e.category), ...numbersIn(e.endDate)]),
    ...overdue.flatMap((o) => [...numbersIn(o.business), ...numbersIn(o.category)]),
  ];

  return {
    ...facts,
    allowedNumbers: [
      ...new Set([
        facts.activeCount,
        facts.openSlots,
        facts.monthlyRevenue,
        facts.unsignedCount,
        facts.newLeadCount,
        facts.repliesWaiting,
        ...expiring.map((e) => e.days),
        ...overdue.map((o) => o.daysAgo),
        ...fromWords,
      ]),
    ],
  };
}

/** Nothing worth saying — used to skip the call entirely. */
export function isQuiet(facts: BriefingFacts): boolean {
  return (
    facts.expiring.length === 0 &&
    facts.overdue.length === 0 &&
    facts.newLeadCount === 0 &&
    facts.repliesWaiting === 0 &&
    facts.unsignedCount === 0
  );
}

/* ------------------------------- the fallback ------------------------------ */

/**
 * What gets shown when the model is unavailable, declines, or invents a figure.
 * Plain, correct, and assembled from the same facts — never an apology.
 */
export function templateBriefing(facts: BriefingFacts): string {
  if (isQuiet(facts)) {
    return `Nothing needs you today. ${facts.activeCount} advertiser${
      facts.activeCount === 1 ? "" : "s"
    } running, ${facts.openSlots} slot${facts.openSlots === 1 ? "" : "s"} open.`;
  }

  const parts: string[] = [];

  if (facts.overdue.length > 0) {
    const first = facts.overdue[0];
    parts.push(
      facts.overdue.length === 1
        ? `${first.business} is ${first.daysAgo} days past the end of their term and still marked running.`
        : `${facts.overdue.length} terms have ended without being closed out, the longest ${first.daysAgo} days ago.`,
    );
  }

  if (facts.expiring.length > 0) {
    const soonest = facts.expiring[0];
    parts.push(
      facts.expiring.length === 1
        ? `${soonest.business} ends in ${soonest.days} days.`
        : `${facts.expiring.length} terms end within 60 days, the soonest ${soonest.business} in ${soonest.days} days.`,
    );
  }

  if (facts.repliesWaiting > 0) {
    parts.push(
      `${facts.repliesWaiting} advertiser${facts.repliesWaiting === 1 ? " has" : "s have"} replied and ${facts.repliesWaiting === 1 ? "is" : "are"} waiting on you.`,
    );
  }

  if (facts.newLeadCount > 0) {
    parts.push(
      `${facts.newLeadCount} new lead${facts.newLeadCount === 1 ? "" : "s"} from the advertise page.`,
    );
  }

  if (facts.unsignedCount > 0) {
    parts.push(
      `${facts.unsignedCount} client${facts.unsignedCount === 1 ? " is" : "s are"} running without signed paperwork.`,
    );
  }

  return parts.join(" ");
}

/* --------------------------------- writing -------------------------------- */

const SYSTEM = `You write the two-or-three sentence briefing at the top of an internal dashboard, read each morning by the person who runs a small screen-advertising business inside one restaurant. They sell one advertiser per category, on fixed terms, and a term that lapses costs them the category.

You are writing for the owner, not for a client. Be direct and specific. Name businesses. Lead with whatever would cost them most to ignore — a term that has already ended outranks one ending soon, which outranks a new lead, which outranks missing paperwork.

Rules that matter more than style:
- Use ONLY the figures given to you. Never calculate, estimate, total, or infer a number. If a figure is not in the facts, do not state it.
- Do not invent urgency that the facts do not support, and do not soften something that is genuinely overdue.
- No greeting, no sign-off, no "here's your summary". Start with the thing that matters.
- Two or three sentences. Never more.
- Plain words. No "leverage", no "actionable", no exclamation marks.

Reply with the briefing text and nothing else.`;

function factSheet(facts: BriefingFacts): string {
  const lines = [
    `Advertisers running: ${facts.activeCount}`,
    `Slots open: ${facts.openSlots}`,
    `Monthly revenue: ${facts.monthlyRevenue} dollars`,
  ];

  if (facts.overdue.length > 0) {
    lines.push("Terms that have ENDED but are still marked running:");
    for (const o of facts.overdue) {
      lines.push(`  - ${o.business} (${o.category || "no category"}), ended ${o.daysAgo} days ago`);
    }
  }

  if (facts.expiring.length > 0) {
    lines.push("Terms ending within 60 days:");
    for (const e of facts.expiring) {
      lines.push(`  - ${e.business} (${e.category || "no category"}), ${e.days} days left, ends ${e.endDate}`);
    }
  }

  if (facts.repliesWaiting > 0) lines.push(`Advertiser replies waiting: ${facts.repliesWaiting}`);
  if (facts.newLeadCount > 0) lines.push(`New leads not yet worked: ${facts.newLeadCount}`);
  if (facts.unsignedCount > 0) lines.push(`Clients running with no signed agreement: ${facts.unsignedCount}`);

  return lines.join("\n");
}

/** A stable fingerprint of the facts, so the cache turns over when they do. */
function fingerprint(facts: BriefingFacts): string {
  return createHash("sha256")
    .update(JSON.stringify(facts))
    .digest("hex")
    .slice(0, 24);
}

export async function writeBriefing(facts: BriefingFacts): Promise<Briefing> {
  const fallback: Briefing = { text: templateBriefing(facts), written: false };

  // A quiet day says so in one line. Paying an API to write "nothing needs you"
  // would be a waste of money and a slower page.
  if (isQuiet(facts) || !isBriefingConfigured()) return fallback;

  const key = CACHE_KEY(fingerprint(facts));
  const [cached] = await redisPipeline([["GET", key]]);
  if (cached) return { text: String(cached), written: true };

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      output_config: {
        // A few sentences over a short fact sheet. Low effort keeps the page
        // quick and the bill negligible.
        effort: "low",
      },
      messages: [
        {
          role: "user",
          content: `Today's facts. These are the only figures you may use.\n\n${factSheet(facts)}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return { ...fallback, rejectedReason: "model declined" };
    }

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (!text) return { ...fallback, rejectedReason: "empty draft" };

    const invented = unsupportedNumbers(text, facts.allowedNumbers);
    if (invented.length > 0) {
      return {
        ...fallback,
        rejectedReason: `draft cited ${invented.join(", ")}, which wasn't in the facts`,
      };
    }

    await redisWrite([
      ["SET", key, text],
      ["EXPIRE", key, CACHE_TTL_SECONDS],
    ]);

    return { text, written: true };
  } catch {
    // A briefing is a convenience. It must never be the reason the page
    // the business runs on fails to load.
    return fallback;
  }
}
