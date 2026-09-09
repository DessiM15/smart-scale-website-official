import type { Metadata } from "next";
import { cachedStripeState } from "@/lib/ads/cached";
import { formatDate } from "@/lib/ads/roster";
import { accountBalances, listAllEntries } from "@/lib/books/ledger";
import { formatCents } from "@/lib/books/money";
import { describeStripeKey, describeType, isStripeConfigured, stripeBalance, stripeTxnViews, syncFrom, type StripeRun, type StripeTxnView } from "@/lib/books/stripe";
import { bringBackStripeAction, syncStripeAction } from "../../actions";
import { BOOKS } from "../../../../_components/books";
import { PageHeader } from "../../../../_components/shell";
import { SubmitButton } from "../../../../_components/submit-button";
import { Badge, Card, Empty, Note, btnGhost, btnPrimary, btnSm, labelClass, numClass, stamp, type Tone } from "../../../../_components/ui";
import { Shell } from "../../../shell";

export const metadata: Metadata = { title: "Stripe" };
/** A first pull reads every transaction since the books opened. */
export const maxDuration = 60;

const PAGE = `${BOOKS}/stripe`;

const STATE_LABEL: Record<StripeTxnView["now"], string> = { posted: "In the ledger", matched: "Matched", "left-out": "Left out", skipped: "Skipped" };
const STATE_TONE: Record<StripeTxnView["now"], Tone> = { posted: "ok", matched: "ok", "left-out": "neutral", skipped: "warn" };

function entryHref(t: StripeTxnView): string | null {
  if (!t.entryId) return null;
  return `${BOOKS}/ledger?month=${t.date.slice(0, 7)}&open=${t.entryId}#entry-${t.entryId}`;
}

function Amount({ cents, className = "" }: { cents: number; className?: string }) {
  const colour = cents > 0 ? "text-[#7FBF8E]" : "text-white";
  return (
    <span className={`${numClass} ${colour} tabular-nums ${className}`}>
      {cents > 0 ? "+" : "−"}
      {formatCents(Math.abs(cents))}
    </span>
  );
}

function RunLine({ run }: { run: StripeRun }) {
  const parts = [run.posted ? `${run.posted} posted` : "", run.matched ? `${run.matched} matched` : "", run.known ? `${run.known} already in` : "", run.leftOut ? `${run.leftOut} left out` : "", run.skipped ? `${run.skipped} skipped` : ""].filter(Boolean);
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-3 py-2.5 text-sm border-b border-white/[0.06] last:border-b-0">
      <span className="text-white/70 tabular-nums">
        {stamp(run.at)} <span className="text-white/35">· {run.who}</span>
      </span>
      {run.ok ? (
        <span className="text-white/35 text-xs">{parts.length ? parts.join(" · ") : "nothing new"}</span>
      ) : (
        <span className="text-[#f87171] text-xs break-words">{run.error}</span>
      )}
    </li>
  );
}

export default async function StripePage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string; detail?: string }>;
}) {
  const configured = isStripeConfigured();
  const [params, state, txns, everything, balance] = await Promise.all([
    searchParams,
    cachedStripeState(),
    configured ? stripeTxnViews(100) : Promise.resolve([] as StripeTxnView[]),
    listAllEntries(),
    configured ? stripeBalance() : Promise.resolve(null),
  ]);
  const books = accountBalances(everything).stripe;
  const stripeTotal = balance?.ok ? balance.data.available + balance.data.pending : null;
  const gap = stripeTotal === null ? null : stripeTotal - books;
  const unusual = txns.filter((t) => t.unusual && t.now !== "left-out");
  const last = state.runs[0];

  const title = !configured
    ? "Stripe isn't connected."
    : !last
      ? "Nothing pulled yet."
      : last.ok
        ? `Up to date as of ${stamp(last.at)}.`
        : "The last pull failed.";

  return (
    <Shell active="stripe" banner={params}>
      <PageHeader
        eyebrow="Books · Stripe"
        title={title}
        action={
          configured ? (
            <form action={syncStripeAction}>
              <input type="hidden" name="returnTo" value={PAGE} />
              <SubmitButton className={btnPrimary} pendingLabel="Pulling from Stripe">
                Sync now
              </SubmitButton>
            </form>
          ) : undefined
        }
      />

      {!configured && (
        <div className="mb-5">
          <Note tone="warn">
            <p className="text-sm text-white">No Stripe key is set, so nothing here can run.</p>
            <p className="mt-1.5 text-sm text-white/55">
              STRIPE_RESTRICTED_KEY goes in Vercel; the steps are on the{" "}
              <a href="/advertise/admin/setup" className="text-white underline underline-offset-4">
                Setup page
              </a>
              . A read-only key: it can look at Stripe and never touch the money.
            </p>
          </Note>
        </div>
      )}

      {configured && state.lastOk === false && (
        <div className="mb-5">
          <Note tone="bad">
            <p className="text-sm font-semibold text-white">Stripe said: {state.lastError}</p>
            <p className="mt-1.5 text-sm text-white/70 leading-relaxed">
              A 401 means the key was refused: check for a stray space on the value in Vercel, and that it is the rk_live_ key, not the publishable pk_ one. A permission error means the key can&apos;t read that part of Stripe; make a new one from the Reporting template.
            </p>
          </Note>
        </div>
      )}

      {unusual.length > 0 && (
        <div className="mb-5">
          <Note tone="warn">
            <p className="text-sm text-white">
              {unusual.length} transaction{unusual.length === 1 ? "" : "s"} worth a look: not a plain payment, refund, fee or payout.
            </p>
            <p className="mt-1.5 text-sm text-white/55">Each is in the ledger under other income or other expense with the reason underneath. Recategorise it on its row if that is wrong.</p>
          </Note>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_1fr] gap-5 items-start mb-5">
        <Card title="Stripe against the books" lede="What Stripe says it is holding, beside what the ledger adds up to for the Stripe account. They should agree once everything since the books opened is in.">
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-white/[0.08] px-4 py-4 min-w-0">
              <p className={`${labelClass} !mb-1`}>Stripe holds</p>
              <p className={`${numClass} text-2xl text-white tabular-nums`}>{stripeTotal === null ? "—" : formatCents(stripeTotal, { whole: true })}</p>
              {balance?.ok && (
                <p className="text-xs text-white/40 mt-1">
                  {formatCents(balance.data.available)} available{balance.data.pending ? ` · ${formatCents(balance.data.pending)} on its way` : ""}
                </p>
              )}
              {balance && !balance.ok && <p className="text-xs text-[#f87171] mt-1 break-words">{balance.error}</p>}
            </div>
            <div className="border border-white/[0.08] px-4 py-4 min-w-0">
              <p className={`${labelClass} !mb-1`}>The books say</p>
              <p className={`${numClass} text-2xl tabular-nums ${books < 0 ? "text-[#f87171]" : "text-white"}`}>{formatCents(books, { whole: true })}</p>
              <p className="text-xs text-white/40 mt-1">every Stripe row, less payouts</p>
            </div>
          </div>
          {gap !== null && (
            <p className={`mt-4 text-sm ${gap === 0 ? "text-[#7FBF8E]" : "text-[#E0B36A]"}`}>
              {gap === 0
                ? "They agree."
                : `Off by ${formatCents(Math.abs(gap))}. ${
                    gap > 0
                      ? `Stripe has more than the books know about. Usually money that was in Stripe before ${formatDate(syncFrom())}, or a payout the bank hasn't seen yet. Log the opening amount as other income if it's the first.`
                      : "The books have more than Stripe. A payment typed in by hand that Stripe never saw, or the same one twice. Check the ledger's Stripe rows."
                  }`}
            </p>
          )}
        </Card>

        <Card title="Pulls" lede={configured ? `${describeStripeKey()} Reads everything since ${formatDate(syncFrom())}, every night with the daily job, and whenever you press Sync now.` : "Nothing has run."} padding="px-5 sm:px-6 pt-5 pb-3">
          {state.runs.length === 0 ? (
            <div className="pb-2">
              <Empty>{configured ? "No pull yet. Press Sync now, or wait for tonight's job." : "Connect Stripe first."}</Empty>
            </div>
          ) : (
            <ul>
              {state.runs.map((run) => (
                <RunLine key={run.at} run={run} />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        title={`Transactions · ${txns.length}`}
        lede="Every Stripe movement the pull has seen, newest first, and what the ledger did with it. A payment posts at the full amount with Stripe's fee as its own row; a payout is the balance moving to the bank. Remove a row from the ledger and it stays out until you bring it back here."
        padding="px-5 sm:px-6 pt-5 pb-2"
      >
        {txns.length === 0 ? (
          <div className="pb-4">
            <Empty>{configured ? "Nothing seen yet." : "Nothing to show until Stripe is connected."}</Empty>
          </div>
        ) : (
          <ul>
            {txns.map((t) => {
              const href = entryHref(t);
              return (
                <li key={t.id} id={`txn-${t.id}`} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 py-3.5 border-b border-white/[0.06] last:border-b-0 scroll-mt-28">
                  <span className={`text-[11px] tracking-[0.18em] text-white/40 w-14 shrink-0 tabular-nums`}>{formatDate(t.date).replace(/, \d{4}$/, "")}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-white leading-snug truncate">
                      {t.party || describeType(t.type)}
                      {t.unusual && t.now !== "left-out" ? <span className="ml-2 text-[#E0B36A] text-xs">look at this</span> : null}
                    </p>
                    <p className="text-xs text-white/45 leading-snug truncate">
                      {describeType(t.type)}
                      {t.fee ? ` · fee ${formatCents(Math.abs(t.fee))}` : ""}
                      {t.description ? ` · ${t.description}` : ""}
                      {t.now === "matched" && t.note ? ` · ${t.note}` : ""}
                      {t.now === "left-out" && t.reason ? ` · ${t.reason}` : ""}
                      {t.now === "skipped" && t.reason ? ` · ${t.reason}` : ""}
                      {t.unusual && t.note && t.now === "posted" ? ` · ${t.note}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge tone={STATE_TONE[t.now]} dot={false}>{STATE_LABEL[t.now]}</Badge>
                    <Amount cents={t.amount} className="text-lg sm:text-xl leading-none" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {href && (t.now === "posted" || t.now === "matched") && (
                      <a href={href} className={`${btnGhost} ${btnSm}`}>
                        Open
                      </a>
                    )}
                    {t.now === "left-out" && (
                      <form action={bringBackStripeAction}>
                        <input type="hidden" name="id" value={t.id} />
                        <SubmitButton className={`${btnGhost} ${btnSm}`} pendingLabel="Posting">
                          Bring back
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </Shell>
  );
}
