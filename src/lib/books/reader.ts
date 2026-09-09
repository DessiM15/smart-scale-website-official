/**
 * Reads a receipt photo and proposes what to log.
 *
 * Claude looks at the picture and fills in the form: vendor, date, total,
 * tax, a category. That is all it does. Nothing it says reaches the ledger
 * until one of you has looked at the photo beside the numbers and pressed
 * Save. A misread total is the one mistake this system must not make on its
 * own, so it is not allowed to.
 *
 * When there is no key, or the call fails, the receipt is still kept and the
 * form is simply empty. Losing the photo would be worse than typing.
 */

import Anthropic from "@anthropic-ai/sdk";
import { RECEIPT_CATEGORY_IDS } from "./categories";

const MODEL = "claude-opus-5";

export type ReceiptRead = {
  vendor: string;
  /** YYYY-MM-DD, or "" when it couldn't be read. */
  date: string;
  /** Whole cents, or null when it couldn't be read. */
  total: number | null;
  tax: number | null;
  category: string;
  confidence: "high" | "medium" | "low";
  /** What was bought, in a few words, for the memo. */
  summary: string;
  /** An ATM or teller slip is money moving, not money spent. */
  kind: "purchase" | "cash-withdrawal";
};

export type ReadResult = { ok: true; read: ReceiptRead } | { ok: false; error: string };

export function isReaderConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM = `You read photos of receipts for a two-person web and app studio's bookkeeping.
Report only what is printed on the receipt. If a value is not legible or not present, leave it empty rather than guessing.
The total is the final amount paid, after tax and tip. Dates are YYYY-MM-DD. Amounts are in US dollars.
Pick the category that best fits what was bought from the list you are given. Say "low" confidence when the photo is blurry, cut off, or the total is unclear.
An ATM receipt, a teller withdrawal slip, or a cash-back line is a "cash-withdrawal", not a purchase; everything else is a "purchase".`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["vendor", "date", "total", "tax", "category", "confidence", "summary", "kind"],
  properties: {
    vendor: { type: "string", description: "The business name as printed, or empty." },
    date: { type: "string", description: "YYYY-MM-DD, or empty if not legible." },
    total: { type: ["number", "null"], description: "Final amount paid in dollars, e.g. 43.17, or null." },
    tax: { type: ["number", "null"], description: "Sales tax in dollars, or null if not shown." },
    category: { type: "string", enum: RECEIPT_CATEGORY_IDS },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    summary: { type: "string", description: "What was bought, under ten words." },
    kind: { type: "string", enum: ["purchase", "cash-withdrawal"] },
  },
} as const;

type MediaType = "image/jpeg" | "image/png" | "image/webp";

export async function readReceiptImage(bytes: Buffer, mediaType: MediaType): Promise<ReadResult> {
  if (!isReaderConfigured()) {
    return { ok: false, error: "ANTHROPIC_API_KEY isn't set, so the receipt wasn't read. Fill it in by hand." };
  }
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      // A receipt is a small, well-defined read; low effort keeps the snap
      // quick enough to wait for at the counter.
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: bytes.toString("base64") } },
            {
              type: "text",
              text: `Read this receipt. Categories: ${RECEIPT_CATEGORY_IDS.join(", ")}.`,
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return { ok: false, error: "The model declined to read this one. Fill it in by hand." };
    }
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    const parsed = JSON.parse(text) as {
      vendor?: string;
      date?: string;
      total?: number | null;
      tax?: number | null;
      category?: string;
      confidence?: string;
      summary?: string;
      kind?: string;
    };

    const cents = (n: number | null | undefined) =>
      typeof n === "number" && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(parsed.date ?? "") ? parsed.date! : "";
    const category = RECEIPT_CATEGORY_IDS.includes(parsed.category ?? "") ? parsed.category! : "other-expense";
    const confidence = (["high", "medium", "low"] as const).find((c) => c === parsed.confidence) ?? "low";

    return {
      ok: true,
      read: {
        vendor: (parsed.vendor ?? "").trim().slice(0, 120),
        date,
        total: cents(parsed.total),
        tax: cents(parsed.tax),
        category,
        confidence,
        summary: (parsed.summary ?? "").trim().slice(0, 160),
        kind: parsed.kind === "cash-withdrawal" ? "cash-withdrawal" : "purchase",
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "The read failed." };
  }
}
