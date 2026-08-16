"use server";

import { revalidatePath } from "next/cache";
import { isSignedIn, signIn } from "@/lib/ads/auth";
import {
  hasBeenAsked,
  recordRequest,
  forgetRequest,
  isRedisConfigured,
} from "@/lib/reviews/store";
import { sendReviewRequest, toE164, isSmsConfigured } from "@/lib/reviews/send";

export interface ActionState {
  error?: string;
  success?: string;
}

export async function authenticate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const key = String(formData.get("key") ?? "");
  const ok = await signIn(key);
  if (!ok) return { error: "Incorrect passphrase." };
  revalidatePath("/review-requests");
  return {};
}

export async function requestReview(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await isSignedIn())) return { error: "Session expired. Sign in again." };

  const name = String(formData.get("name") ?? "").trim();
  const rawPhone = String(formData.get("phone") ?? "").trim();
  const context = String(formData.get("context") ?? "").trim();

  if (!name || !rawPhone) return { error: "Name and phone are both required." };
  if (!isSmsConfigured()) return { error: "Twilio is not configured here." };

  const phone = toE164(rawPhone);
  if (!phone) return { error: `"${rawPhone}" isn't a valid US mobile number.` };

  // Fail closed: without the log we cannot guarantee we won't double-text.
  if (!isRedisConfigured()) {
    return {
      error:
        "The request log is unavailable, so sending is blocked — we can't verify this client hasn't already been asked.",
    };
  }
  if (await hasBeenAsked(phone)) {
    return {
      error: `${name} has already been asked. Clear the entry below to ask again.`,
    };
  }

  const firstName = name.split(/\s+/)[0];
  const result = await sendReviewRequest(phone, firstName);
  if (!result.ok) return { error: result.error ?? "Failed to send." };

  await recordRequest({
    phone,
    name,
    context: context || undefined,
    sentAt: new Date().toISOString(),
    messageSid: result.messageSid,
  });

  revalidatePath("/review-requests");
  return { success: `Review request sent to ${name}.` };
}

export async function clearRequest(formData: FormData): Promise<void> {
  if (!(await isSignedIn())) return;
  const phone = String(formData.get("phone") ?? "");
  if (phone) await forgetRequest(phone);
  revalidatePath("/review-requests");
}
