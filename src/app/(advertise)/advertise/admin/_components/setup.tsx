/**
 * What's switched on, what isn't, and what to do about it.
 *
 * Everything in this system fails quietly when its credentials are missing —
 * correct for a cron job, useless for the person running the business. This
 * tab is the answer to "why didn't that send?", and it carries the test button
 * so email can be proven against your own inbox instead of a client's.
 */

import { runBackupAction, sendTestEmailAction } from "../actions";
import { SubmitButton } from "./submit-button";
import type { SetupItem } from "@/lib/ads/setup";
import { setupProgress } from "@/lib/ads/setup";
import type { BackupEntry } from "@/lib/ads/backup";
import { describeBlobEnv } from "@/lib/ads/blob";
import {
  Card,
  Empty,
  Note,
  Pill,
  SubHead,
  btnPrimary,
  inputClass,
  labelClass,
  linkQuiet,
  selectClass,
  stamp,
  type Tone,
} from "./ui";

const STATUS: Record<SetupItem["status"], { label: string; tone: Tone }> = {
  on: { label: "On", tone: "ok" },
  partial: { label: "Half done", tone: "warn" },
  off: { label: "Off", tone: "neutral" },
};

function Item({ item }: { item: SetupItem }) {
  const status = STATUS[item.status];
  const done = item.status === "on";

  return (
    <details
      // Anything still switched off is opened, because that's what the reader
      // came here to fix.
      open={!done}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
    >
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-4 list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors">
        <span className="flex flex-wrap items-center gap-2.5">
          <span className="text-sm font-semibold text-white">{item.name}</span>
          <Pill tone={status.tone}>{status.label}</Pill>
          {item.essential && item.status !== "on" && <Pill tone="bad">Required</Pill>}
        </span>
        <span className="text-xs text-white/35">{done ? "details" : "how to fix"}</span>
      </summary>

      <div className="px-5 pb-5 pt-1 space-y-4">
        <p className="text-sm text-white/55 leading-relaxed">{item.unlocks}</p>

        {item.detail && (
          <p className="text-sm text-emerald-300/80 tabular-nums">{item.detail}</p>
        )}

        {!done && (
          <div>
            <SubHead>What to do</SubHead>
            <ol className="space-y-2">
              {item.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-white/70">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-white/[0.07] text-[11px] font-semibold text-white/50 flex items-center justify-center tabular-nums">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {item.caution && (
          <Note tone="warn">
            <p className="text-sm text-white/75 leading-relaxed">{item.caution}</p>
          </Note>
        )}

        <p className="text-[11px] text-white/25 font-mono break-words">
          {item.vars.join(" · ")}
        </p>
      </div>
    </details>
  );
}

/* ------------------------------- test email ------------------------------- */

/**
 * The outcome, shown where the button is.
 *
 * There is a banner at the top of the page too, but this form sits well below
 * the fold — reloading to a restored scroll position put the reader back in
 * front of an unchanged form, which reads as nothing having happened at all.
 */
function TestResult({
  msg,
  err,
  detail,
  sent,
}: {
  msg?: string;
  err?: string;
  detail?: string;
  sent?: string;
}) {
  if (err === "testsend" || err === "testaddress" || err === "testunconfigured") {
    return (
      <div className="mb-5">
        <Note tone="bad">
          <p className="text-sm font-semibold text-white">That didn&apos;t send.</p>
          <p className="mt-1.5 text-sm text-white/70 break-words">
            {err === "testaddress"
              ? "That doesn't look like an email address."
              : err === "testunconfigured"
                ? "Email isn't connected yet."
                : detail || "No reason came back."}
          </p>
          {err === "testsend" && (
            <p className="mt-2 text-xs text-white/40 leading-relaxed">
              That wording is Plunk&apos;s, not ours. A 401 means the key was
              refused — check for a stray space on the value in Vercel, and that
              it&apos;s the secret sk_ key.
            </p>
          )}
        </Note>
      </div>
    );
  }

  if (msg !== "testSent") return null;

  return (
    <div className="mb-5">
      <Note tone="ok">
        <p className="text-sm font-semibold text-white">
          Sent to {detail}
          {sent ? ` — ${sent}` : ""}.
        </p>
        <p className="mt-1.5 text-sm text-white/70 leading-relaxed">
          Plunk accepted it. If it hasn&apos;t landed within a minute, check spam,
          then find that address in Plunk&apos;s own log — accepted and delivered
          are different things, and only the log tells them apart.
        </p>
      </Note>
    </div>
  );
}

function TestEmail({
  configured,
  msg,
  err,
  detail,
  sent,
}: {
  configured: boolean;
  msg?: string;
  err?: string;
  detail?: string;
  sent?: string;
}) {
  return (
    <Card
      id="test-email"
      title="Send yourself a test"
      lede="Prove email works against your own inbox before a client is on the other end of it."
      className="mb-5"
    >
      <TestResult msg={msg} err={err} detail={detail} sent={sent} />
      {!configured ? (
        <Empty>
          Email isn&apos;t connected yet. Finish the Advertiser email steps below,
          then come back here.
        </Empty>
      ) : (
        <form action={sendTestEmailAction} className="space-y-4">
          <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <label className={labelClass} htmlFor="testTo">
                Send to
              </label>
              <input
                id="testTo"
                name="to"
                type="email"
                required
                placeholder="you@smartscaleagent.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="testKind">
                Which one
              </label>
              <select id="testKind" name="kind" className={selectClass} defaultValue="delivery">
                <option value="delivery">Plain check — did it arrive?</option>
                <option value="renewal">Full renewal notice, with sample figures</option>
              </select>
            </div>
          </div>
          <SubmitButton className={btnPrimary} pendingLabel="Sending…">
            Send test
          </SubmitButton>
          <p className="text-xs text-white/30 leading-relaxed">
            Both are marked as tests in the subject and the first line, and the
            sample renewal&apos;s buttons are inert — no client record can be touched
            by one.
          </p>
        </form>
      )}
    </Card>
  );
}

/* -------------------------------- backups --------------------------------- */

function Backups({
  entries,
  configured,
}: {
  entries: BackupEntry[];
  configured: boolean;
}) {
  const last = entries[0];

  return (
    <Card
      title="Backups"
      lede="A copy of every advertiser, prospect and QR code, written nightly. This is the only thing here that can't be rebuilt from something else."
      action={
        configured ? (
          <form action={runBackupAction}>
            <SubmitButton className={linkQuiet} pendingLabel="Backing up…">
              Back up now
            </SubmitButton>
          </form>
        ) : undefined
      }
    >
      {!configured ? (
        <Note tone="warn">
          <p className="text-sm font-semibold text-white">
            Nothing is being backed up.
          </p>
          <p className="mt-1.5 text-sm text-white/55">{describeBlobEnv()}</p>
        </Note>
      ) : !last ? (
        <Empty>
          No backup has run yet. It goes out with the nightly job, or run one now.
        </Empty>
      ) : (
        <ul className="divide-y divide-white/[0.06] -my-2">
          {entries.map((entry) => (
            <li
              key={entry.at}
              className="flex flex-wrap items-baseline justify-between gap-3 py-2.5 text-sm"
            >
              <span className="text-white/70 tabular-nums">{stamp(entry.at)}</span>
              <span className="text-white/35 tabular-nums text-xs">
                {entry.advertisers} advertisers · {entry.prospects} prospects ·{" "}
                {entry.links} codes
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------------------------------- tab ----------------------------------- */

export function SetupTab({
  items,
  backups,
  emailConfigured,
  storageConfigured,
  result,
}: {
  items: SetupItem[];
  backups: BackupEntry[];
  emailConfigured: boolean;
  storageConfigured: boolean;
  result: { msg?: string; err?: string; detail?: string; sent?: string };
}) {
  const { on, total, blocked } = setupProgress(items);

  return (
    <>
      <Card
        title="Setup"
        lede={`${on} of ${total} switched on. Each one below says what it unlocks and exactly what to do — every change means adding a variable in Vercel and redeploying.`}
        className="mb-5"
      >
        {blocked.length > 0 && (
          <div className="mb-5">
            <Note tone="bad">
              <p className="text-sm font-semibold text-white">
                {blocked.map((b) => b.name).join(" and ")}{" "}
                {blocked.length === 1 ? "is" : "are"} off, so nothing automatic is
                running.
              </p>
              <p className="mt-1.5 text-sm text-white/55">
                Start there — the rest can&apos;t work until they do.
              </p>
            </Note>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <Item key={item.id} item={item} />
          ))}
        </div>
      </Card>

      <TestEmail
        configured={emailConfigured}
        msg={result.msg}
        err={result.err}
        detail={result.detail}
        sent={result.sent}
      />
      <Backups entries={backups} configured={storageConfigured} />
    </>
  );
}
