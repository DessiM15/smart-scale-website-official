/**
 * What's switched on, what isn't, and exactly how to switch it on.
 *
 * Every feature in this folder degrades quietly when its credentials are
 * missing, which is the right behaviour for a cron job and the wrong one for
 * the person who has to run the business — "the renewal emails aren't sending"
 * and "I never set RESEND_API_KEY" look identical from the outside.
 *
 * So the checks that were scattered across a dozen `isXConfigured()` calls are
 * collected here, each with what it unlocks and the steps to finish it. The
 * Setup tab renders this list; nothing else needs to know the env var names.
 */

import { isRedisConfigured } from "./redis";
import { isEmailConfigured, fromAddress, replyToAddress } from "./email";
import { alertRecipients } from "./notify";
import { isLinkSigningConfigured } from "./links";
import { isArtworkStoreConfigured } from "./artwork";
import { describeBlobEnv } from "./blob";
import { TEMPLATE_REVIEWED, TEMPLATE_VERSION } from "./agreement-template";
import { describeFileKey, isFileKeyConfigured } from "@/lib/books/crypto";
import { describeStripeKey, isStripeConfigured, syncFrom } from "@/lib/books/stripe";

export type SetupStatus = "on" | "off" | "partial";

export type SetupItem = {
  id: string;
  name: string;
  /** What stops working while this is off. Written for the reader, not the dev. */
  unlocks: string;
  status: SetupStatus;
  /** Shown when configured — the value in use, never the secret itself. */
  detail?: string;
  vars: string[];
  steps: string[];
  /** The business cannot run at all without this one. */
  essential?: boolean;
  /** A warning that outlives the setup — worth repeating every time. */
  caution?: string;
};

function isCronConfigured(): boolean {
  return Boolean(process.env.CRON_SECRET);
}

function isNarrativeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function isStatsKeyConfigured(): boolean {
  return Boolean(process.env.ADS_STATS_KEY);
}

const flag = (on: boolean): SetupStatus => (on ? "on" : "off");

export function setupItems(): SetupItem[] {
  const recipients = alertRecipients();

  return [
    {
      id: "database",
      name: "Database",
      unlocks:
        "Everything. Advertisers, prospects, QR codes and scan counts all live here.",
      status: flag(isRedisConfigured()),
      vars: ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
      essential: true,
      steps: [
        "In Vercel: Storage → Create Database → Upstash Redis.",
        "Connect it to this project, then redeploy.",
      ],
    },
    {
      id: "books-key",
      name: "Books file key",
      unlocks:
        "Sealing receipts, vault documents and the EIN before they reach storage. Without it the vault refuses uploads and the EIN can't be stored.",
      status: flag(isFileKeyConfigured()),
      detail: isFileKeyConfigured() ? describeFileKey() : undefined,
      vars: ["BOOKS_FILE_KEY"],
      steps: [
        "On a laptop, run: openssl rand -base64 32",
        "In Vercel: Settings → Environment Variables → add BOOKS_FILE_KEY with that value, Production ticked.",
        "Redeploy.",
        "Keep a copy of the key somewhere outside Vercel, such as the password manager you both use.",
      ],
      caution:
        "Everything sealed with this key is unreadable without it. Rotating or losing the key means every vault document and sealed receipt is gone. Never change it casually.",
    },
    {
      id: "stripe",
      name: "Stripe sync",
      unlocks:
        "Every Stripe payment, fee, refund and payout landing in the ledger on its own each night, and the Sync now button on the Stripe page. Without it, Stripe money has to be typed in.",
      status: flag(isStripeConfigured()),
      detail: isStripeConfigured() ? `${describeStripeKey()} Pulling everything since ${syncFrom()}.` : undefined,
      vars: ["STRIPE_RESTRICTED_KEY"],
      steps: [
        "In Stripe: dashboard.stripe.com/apikeys, live mode, Create restricted key, “Powering an integration you built”.",
        "Pick the “Reporting, analytics, and accounting” template. Everything in it is read only.",
        "Name it Smart Scale Books, create it, and copy the rk_live_ value. Stripe shows it once.",
        "In Vercel: Settings → Environment Variables → add STRIPE_RESTRICTED_KEY with that value, Production ticked.",
        "Redeploy, then open Books → Stripe and press Sync now.",
      ],
      caution:
        "Use a restricted key with read access only. This key can look at Stripe; it must never be able to charge, refund or move money, and the code here never asks to.",
    },
    {
      id: "cron",
      name: "Daily job",
      unlocks:
        "The renewal watch, the monthly report drafts, the nightly Stripe pull, and the nightly backup. Nothing automatic happens without this.",
      status: flag(isCronConfigured()),
      vars: ["CRON_SECRET"],
      essential: true,
      steps: [
        "In Vercel: Settings → Environment Variables.",
        "Add CRON_SECRET with any long random string — you never type it again.",
        "Redeploy. Vercel attaches it to the scheduled run automatically.",
      ],
      caution:
        "The job refuses to run without this, on purpose. An open URL that sends email is an open URL somebody else can make send email.",
    },
    {
      id: "email",
      name: "Email",
      unlocks:
        "Every email the system sends: renewal notices and monthly reports to clients, agreements to sign, and the team's own alerts. Drafts still generate without it; they just can't be sent.",
      status: flag(isEmailConfigured()),
      detail: isEmailConfigured()
        ? `Sending as ${fromAddress()}${
            replyToAddress() ? `, replies to ${replyToAddress()}` : ""
          }`
        : undefined,
      vars: ["RESEND_API_KEY", "ADS_FROM_EMAIL", "ADS_REPLY_TO"],
      steps: [
        "In Resend: Domains, Add domain, smartscaleagent.com.",
        "Paste the DKIM and SPF records it gives you at your domain registrar, then verify. DNS can take an hour, sometimes longer.",
        "In Resend: API Keys, Create. Sending access is enough. Copy the value starting re_ (it is shown once).",
        "In Vercel: Settings, Environment Variables, add RESEND_API_KEY with that value, Production ticked.",
        "Set ADS_FROM_EMAIL to an address on the verified domain, e.g. Smart Scale <info@smartscaleagent.com>.",
        "Set ADS_REPLY_TO to the inbox you actually read.",
        "Redeploy, then send yourself a test below before it ever reaches a client.",
      ],
      caution:
        "Sending from an address does not create an inbox at it. Every email tells the client to reply, so make sure something receives at the from or reply-to address, or those replies bounce.",
    },
    {
      id: "links",
      name: "Reply buttons",
      unlocks:
        "The renew / change / cancel buttons inside renewal emails, which work without the client logging in.",
      status: flag(isLinkSigningConfigured()),
      vars: ["ADS_LINK_SECRET"],
      steps: [
        "In Vercel, set ADS_LINK_SECRET to any long random string.",
        "Redeploy.",
      ],
      caution:
        "Set this once and never change it. Changing it invalidates every reply link already sitting in a client's inbox.",
    },
    {
      id: "alerts",
      name: "Team alerts",
      unlocks:
        "An email to you and Jay when a lead comes in, when a term is running down, and when report drafts are waiting. Rides on Email above.",
      status:
        isEmailConfigured() && recipients.length > 0
          ? "on"
          : isEmailConfigured()
            ? "partial"
            : "off",
      detail: isEmailConfigured()
        ? recipients.length > 0
          ? `Emailing ${recipients.join(", ")}`
          : "Email is connected but nobody is listed to receive the alerts"
        : undefined,
      vars: ["ADS_ALERT_EMAILS"],
      steps: [
        "Finish Email above first.",
        "In Vercel, set ADS_ALERT_EMAILS to the addresses that should get alerts, comma-separated.",
        "Redeploy.",
      ],
    },
    {
      id: "storage",
      name: "File storage",
      unlocks:
        "Ad artwork on client profiles, and the nightly backup of your whole roster.",
      status: flag(isArtworkStoreConfigured()),
      detail: isArtworkStoreConfigured() ? undefined : describeBlobEnv(),
      vars: ["BLOB_READ_WRITE_TOKEN"],
      steps: [
        "In Vercel: Storage → Create → Blob.",
        "Connect it to this project. Vercel sets the token for you.",
        "Redeploy — a variable added after the last build is invisible until you do.",
        "If it was connected with an environment-variable prefix, the token arrives under a prefixed name. That is handled automatically, but the line above says what was actually found.",
      ],
      caution:
        "Blob addresses are unguessable but public. Fine for ad artwork; never put a signed contract there.",
    },
    {
      id: "narrative",
      name: "Report commentary",
      unlocks:
        "The written summary at the top of each monthly report. Without it the reports use a plain templated line instead.",
      status: flag(isNarrativeConfigured()),
      vars: ["ANTHROPIC_API_KEY"],
      steps: [
        "Get a key from console.anthropic.com and add billing credit.",
        "Set ANTHROPIC_API_KEY in Vercel and redeploy.",
        "Costs roughly $0.30–$0.65 a month at about 20 reports.",
      ],
      caution:
        "The model never writes a number — every figure is computed here and checked against the draft before it can be sent.",
    },
    {
      id: "agreement",
      name: "Agreement wording",
      unlocks:
        "Sending advertising agreements to clients for signature. The signing flow works either way — this is about whether the words have been checked.",
      status: TEMPLATE_REVIEWED ? "on" : "partial",
      detail: `Currently ${TEMPLATE_VERSION}`,
      vars: [],
      steps: [
        "Open any client's Documents section, expand \u201cRead the full terms\u201d, and compare it line by line against the signed PDF.",
        "Anything that differs: send the correct wording to Claude, or edit src/lib/ads/agreement-template.ts directly.",
        "Once it matches, set TEMPLATE_REVIEWED to true in that file. Bump TEMPLATE_VERSION on any later wording change.",
      ],
      caution:
        "Every signature records which version it was, so changing the wording later never changes what someone already signed. That also means the version must be bumped, not edited in place.",
    },
    {
      id: "stats",
      name: "Shareable scan report",
      unlocks:
        "The /advertise/stats page opening from a link, without an admin sign-in.",
      status: flag(isStatsKeyConfigured()),
      vars: ["ADS_STATS_KEY"],
      steps: [
        "Set ADS_STATS_KEY in Vercel to any word you don't mind sharing.",
        "Redeploy. The page is then at /advertise/stats?key=<that word>.",
      ],
    },
  ];
}

/** How much of the system is switched on — the one line worth showing up top. */
export function setupProgress(items: SetupItem[]) {
  const on = items.filter((i) => i.status === "on").length;
  const blocked = items.filter((i) => i.status !== "on" && i.essential);
  return { on, total: items.length, blocked };
}
