/**
 * The written commentary in a monthly report.
 *
 * Claude writes the prose. It is never allowed to produce a figure: the facts
 * are computed in ./report-data and passed in, and anything the model writes is
 * checked against the exact set of numbers it was given. A draft that mentions
 * a number outside that set is discarded and replaced with a plain templated
 * summary, because a wrong figure in writing to a paying advertiser is a
 * different class of problem from a clumsy sentence.
 */

import Anthropic from "@anthropic-ai/sdk";
import { numbersIn, type ReportFacts } from "./report-data";

const MODEL = "claude-opus-5";

export type Narrative = {
  headline: string;
  body: string;
  /** How it was produced, so the tracker can show it honestly. */
  source: "claude" | "template";
  /** Set when a model draft was rejected, for the run log. */
  rejectedReason?: string;
};

export function isNarrativeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/* ------------------------------ number guard ------------------------------ */

export { numbersIn };

/**
 * Which numbers in the text weren't given to the model. Dates, times and names
 * pass because their digits are part of the facts the model was shown; a figure
 * it calculated for itself does not.
 */
export function unsupportedNumbers(text: string, allowed: number[]): number[] {
  const permitted = new Set(allowed);
  return numbersIn(text).filter((n) => !permitted.has(n));
}

/* -------------------------------- fallback -------------------------------- */

/** A correct, unexciting report. Always available, never wrong. */
export function templateNarrative(facts: ReportFacts): Narrative {
  const parts: string[] = [];

  if (facts.scans > 0) {
    parts.push(
      `Your ad was scanned ${facts.scans} time${facts.scans === 1 ? "" : "s"} in ${facts.monthName}.`,
    );
    if (facts.changePercent !== null) {
      const dir = facts.changePercent >= 0 ? "up" : "down";
      parts.push(
        `That's ${dir} ${Math.abs(facts.changePercent)}% on the month before.`,
      );
    }
    if (facts.bestHourWindow) {
      parts.push(`Scans cluster around ${facts.bestHourWindow}.`);
    }
  } else {
    parts.push(
      `Your ad ran throughout ${facts.monthName} but wasn't scanned during the month.`,
    );
  }

  parts.push(
    `It played ${facts.plays} times across ${facts.openDays} opening days.`,
  );

  return {
    headline: `${facts.business} — ${facts.monthName}`,
    body: parts.join(" "),
    source: "template",
  };
}

/* --------------------------------- Claude --------------------------------- */

const SYSTEM = `You write one short paragraph of commentary for a monthly advertising report sent to a small business owner who advertises on the dining-room screens of a busy taco restaurant.

Rules, in order of importance:
1. Never state a number that was not given to you. Do not calculate, estimate, round, or infer any figure. If you want to make a point you have no number for, make it qualitatively instead.
2. Write for the owner, not for a marketer. Plain words, no jargon, no growth-hacking language, no exclamation marks.
3. Be straight. If a month was quiet, say so plainly and move on — do not spin it. A report the reader trusts is worth more than a flattering one.
4. Three or four sentences. Lead with what happened, then the one detail worth knowing.

Do not mention renewal, pricing, or ask them to do anything — that is handled elsewhere in the email.`;

const SCHEMA = {
  type: "object",
  properties: {
    headline: {
      type: "string",
      description: "Six words or fewer summarising the month. No numbers.",
    },
    body: {
      type: "string",
      description: "Three or four sentences of commentary.",
    },
  },
  required: ["headline", "body"],
  additionalProperties: false,
} as const;

function factSheet(facts: ReportFacts): string {
  const lines = [
    `Business: ${facts.business}`,
    `Category they own: ${facts.category || "not set"}`,
    `Month: ${facts.monthName}`,
    `Scans this month: ${facts.scans}`,
    `Scans the month before: ${facts.previousScans}`,
    facts.changePercent === null
      ? `Change vs last month: no comparable month yet`
      : `Change vs last month: ${facts.changePercent >= 0 ? "up" : "down"} ${Math.abs(facts.changePercent)} percent`,
    `Days in the month with at least one scan: ${facts.daysWithScans}`,
    `Times the ad played: ${facts.plays}`,
    `Days the restaurant was open: ${facts.openDays}`,
    `Scans since they started: ${facts.scansAllTime}`,
    `Distinct phones since they started: ${facts.uniquePhones}`,
  ];
  if (facts.bestDay) {
    lines.push(`Busiest day: ${facts.bestDay.label} with ${facts.bestDay.count} scans`);
  }
  if (facts.bestHourWindow) {
    lines.push(`Scans cluster around: ${facts.bestHourWindow}`);
  }
  return lines.join("\n");
}

export async function writeNarrative(facts: ReportFacts): Promise<Narrative> {
  if (!isNarrativeConfigured()) return templateNarrative(facts);

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      output_config: {
        // Short commentary over a handful of facts — this is not hard work,
        // and low effort keeps the monthly run quick and cheap.
        effort: "low",
        format: { type: "json_schema", schema: SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `Here are the only figures you may use. Write the commentary.\n\n${factSheet(facts)}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return { ...templateNarrative(facts), rejectedReason: "model declined" };
    }

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    const parsed = JSON.parse(text) as { headline?: string; body?: string };
    const headline = (parsed.headline ?? "").trim();
    const body = (parsed.body ?? "").trim();
    if (!headline || !body) {
      return { ...templateNarrative(facts), rejectedReason: "empty draft" };
    }

    const invented = unsupportedNumbers(`${headline} ${body}`, facts.allowedNumbers);
    if (invented.length > 0) {
      return {
        ...templateNarrative(facts),
        rejectedReason: `made up ${invented.join(", ")}`,
      };
    }

    return { headline, body, source: "claude" };
  } catch (err) {
    return {
      ...templateNarrative(facts),
      rejectedReason: err instanceof Error ? err.message : "request failed",
    };
  }
}
