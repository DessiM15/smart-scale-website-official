/**
 * Sends a single review-request text.
 *
 * Reviews are the strongest lever on Google Business Profile ranking, and the
 * highest-converting moment to ask is right after the work is delivered. This
 * turns that ask into one click instead of a task that never happens.
 *
 * Compliance notes, deliberately conservative:
 *  - Only ever send to a client you have an existing business relationship
 *    with. This is not a marketing blast tool.
 *  - The message identifies the business and includes opt-out language,
 *    which US carriers expect on any non-transactional SMS.
 *  - Never offer anything in exchange for a review. Incentivised reviews
 *    violate Google's policies and can get the whole profile stripped.
 */

import twilio from "twilio";
import { BUSINESS, GBP_URL } from "@/lib/business";

export interface SendResult {
  ok: boolean;
  messageSid?: string;
  error?: string;
}

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER,
  );
}

/** Normalises US input to E.164. Returns null if it clearly isn't a number. */
export function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export function buildMessage(firstName: string): string {
  return (
    `Hi ${firstName}, it's ${BUSINESS.name}. Thanks again for trusting us ` +
    `with your project. If you have a minute, a quick Google review really ` +
    `helps other local businesses find us: ${GBP_URL}\n\n` +
    `Reply STOP to opt out.`
  );
}

export async function sendReviewRequest(
  phoneE164: string,
  firstName: string,
): Promise<SendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { ok: false, error: "SMS is not configured on this deployment." };
  }

  try {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      body: buildMessage(firstName),
      from: fromNumber,
      to: phoneE164,
    });
    return { ok: true, messageSid: message.sid };
  } catch (error) {
    const err = error as { code?: number; message?: string };
    if (err.code === 21211 || err.code === 21614) {
      return { ok: false, error: "That doesn't look like a valid mobile number." };
    }
    if (err.code === 21608) {
      return {
        ok: false,
        error:
          "Twilio trial accounts can only text verified numbers. Verify it in the Twilio console or upgrade the account.",
      };
    }
    return { ok: false, error: err.message || "Twilio rejected the message." };
  }
}
