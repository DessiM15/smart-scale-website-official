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
import { alertRecipients, isSmsConfigured } from "./notify";
import { isLinkSigningConfigured } from "./links";
import { isArtworkStoreConfigured } from "./artwork";
import { TEMPLATE_REVIEWED, TEMPLATE_VERSION } from "./agreement-template";

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
      id: "cron",
      name: "Daily job",
      unlocks:
        "The renewal watch, the monthly report drafts, and the nightly backup. Nothing automatic happens without this.",
      status: flag(isCronConfigured()),
      vars: ["CRON_SECRET"],
      essential: true,
      steps: [
        "In Vercel: Settings → Environment Variables.",
        "Add CRON_SECRET with any long random string — you never type it again.",
        "Redeploy. Vercel attaches it to the scheduled run automatically.",
      ],
      caution:
        "The job refuses to run without this, on purpose — an open URL that sends texts is an open URL that can run up a bill.",
    },
    {
      id: "email",
      name: "Advertiser email",
      unlocks:
        "Renewal notices and monthly reports to your clients. Drafts still generate without it; they just can't be sent.",
      status: flag(isEmailConfigured()),
      detail: isEmailConfigured()
        ? `Sending as ${fromAddress()}${
            replyToAddress() ? `, replies to ${replyToAddress()}` : ""
          }`
        : undefined,
      vars: ["RESEND_API_KEY", "ADS_FROM_EMAIL", "ADS_REPLY_TO"],
      steps: [
        "Make a Resend account and add smartscaleagent.com as a domain.",
        "Paste the DKIM and SPF records it gives you at your domain registrar, then click Verify. DNS can take an hour.",
        "In Vercel, set RESEND_API_KEY to a Resend API key.",
        "Set ADS_FROM_EMAIL to an address on the verified domain, e.g. Smart Scale <ads@smartscaleagent.com>.",
        "Set ADS_REPLY_TO to the inbox you actually read.",
        "Redeploy, then send yourself a test below before it ever reaches a client.",
      ],
      caution:
        "Sending from ads@smartscaleagent.com does not create an inbox at that address. Every email tells the client to reply — make sure something receives at it, or those replies bounce.",
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
      id: "sms",
      name: "Team texts",
      unlocks:
        "Texts to you when a term is running down, and when a new lead comes in from the advertise page.",
      status:
        isSmsConfigured() && recipients.length > 0
          ? "on"
          : isSmsConfigured()
            ? "partial"
            : "off",
      detail: isSmsConfigured()
        ? recipients.length > 0
          ? `Texting ${recipients.length} number${recipients.length === 1 ? "" : "s"}`
          : "Twilio is connected but nobody is listed to receive the texts"
        : undefined,
      vars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER", "ADS_ALERT_PHONES"],
      steps: [
        "Twilio is already connected from the contact form.",
        "Set ADS_ALERT_PHONES to the numbers that should get alerts, comma-separated — 10 digits or +1 form.",
        "Redeploy.",
      ],
    },
    {
      id: "storage",
      name: "File storage",
      unlocks:
        "Ad artwork on client profiles, and the nightly backup of your whole roster.",
      status: flag(isArtworkStoreConfigured()),
      vars: ["BLOB_READ_WRITE_TOKEN"],
      steps: [
        "In Vercel: Storage → Create → Blob.",
        "Connect it to this project. Vercel sets the token for you.",
        "Redeploy.",
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
        "Open any client's Documents section and read the drafted terms end to end.",
        "Send the wording you want to Claude, or edit src/lib/ads/agreement-template.ts directly.",
        "Set TEMPLATE_REVIEWED to true and bump TEMPLATE_VERSION in that file.",
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
