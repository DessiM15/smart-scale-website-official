/**
 * The pieces the Books pages share: the money tiles, a ledger row with its
 * edit panel, the bills table, and the camera card.
 */

import {
  attachReceiptAction,
  bringBackAdPaymentAction,
  deleteBillAction,
  deleteEntryAction,
  importAdPaymentsAction,
  leaveOutAdPaymentAction,
  logBillAction,
  postAdPaymentAction,
  snapReceiptAction,
  toggleBillAction,
  updateEntryAction,
} from "../(app)/books/actions";
import type { AdPaymentState } from "@/lib/books/ads-bridge";
import { categoryOf } from "@/lib/books/categories";
import { ACCOUNTS, accountLabel, type Account, type Entry, type Totals } from "@/lib/books/ledger";
import { centsToInput, formatCents } from "@/lib/books/money";
import { receiptHref } from "@/lib/books/receipts";
import type { ExpectedBill, RecurringBill } from "@/lib/books/recurring";
import { formatDate } from "@/lib/ads/roster";
import { EntryForm } from "./entry-form";
import { ReceiptPicker } from "./receipt-picker";
import { SubmitButton } from "./submit-button";
import { Icon } from "./shell";
import { ADMIN } from "./types";
import {
  Badge,
  Card,
  Empty,
  Tile,
  bebas,
  btnDanger,
  btnGhost,
  btnPrimary,
  btnSm,
  inputClass,
  labelClass,
  linkLine,
  numClass,
  type Tone,
} from "./ui";

export const BOOKS = `${ADMIN}/books`;

/* ---------------------------------- tiles --------------------------------- */

export function MoneyTiles({ totals, pending, label }: { totals: Totals; pending: number; label: string }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <Tile label={`In · ${label}`} value={formatCents(totals.income, { whole: true })} hint={totals.income ? "income, before expenses" : "nothing in yet"} tone={totals.income ? "ok" : "plain"} />
      <Tile label={`Out · ${label}`} value={formatCents(totals.expense, { whole: true })} hint={totals.expense ? "expenses logged" : "nothing out yet"} />
      <Tile
        label="Net"
        value={formatCents(totals.net, { whole: true })}
        hint={totals.contributions ? `plus ${formatCents(totals.contributions, { whole: true })} owner money, kept separate` : "income less expenses"}
        tone={totals.net < 0 ? "warn" : totals.net > 0 ? "ok" : "plain"}
      />
      <Tile label="Receipts waiting" value={String(pending)} hint={pending ? "snapped, not yet confirmed" : "every photo is confirmed"} tone={pending ? "alert" : "plain"} />
    </div>
  );
}

/* ---------------------------------- rows ---------------------------------- */

const KIND_TONE: Record<Entry["kind"], Tone> = {
  income: "ok",
  expense: "neutral",
  contribution: "brand",
  draw: "warn",
  transfer: "neutral",
};

const KIND_SHORT: Record<Entry["kind"], string> = {
  income: "In",
  expense: "Out",
  contribution: "Put in",
  draw: "Draw",
  transfer: "Transfer",
};

function Amount({ entry, className = "" }: { entry: Entry; className?: string }) {
  const colour = entry.kind === "income" || entry.kind === "contribution" ? "text-[#7FBF8E]" : entry.kind === "draw" ? "text-[#E0B36A]" : "text-white";
  return (
    <span className={`${numClass} ${colour} tabular-nums ${className}`}>
      {entry.direction === "in" ? "+" : "−"}
      {formatCents(entry.cents)}
    </span>
  );
}

function ReceiptMark({ entry }: { entry: Entry }) {
  if (entry.receiptId) {
    return (
      <a href={receiptHref(entry.receiptId)} target="_blank" rel="noreferrer" className={`${bebas} text-[10px] tracking-[0.2em] text-[#7FBF8E] hover:text-white transition-colors`} title="Open the receipt">
        Receipt
      </a>
    );
  }
  if (entry.kind !== "expense" || entry.noReceipt) return null;
  return <span className={`${bebas} text-[10px] tracking-[0.2em] text-[#E0B36A]`}>No receipt</span>;
}

/** One ledger row, with its edit panel folded underneath. */
export function LedgerRow({
  entry,
  clients,
  team,
  today,
  open,
  returnTo,
}: {
  entry: Entry;
  clients: { id: string; name: string }[];
  team: readonly string[];
  today: string;
  open: boolean;
  returnTo: string;
}) {
  const category = categoryOf(entry.category);
  const client = entry.clientId ? clients.find((c) => c.id === entry.clientId) : undefined;
  const who =
    entry.kind === "contribution" || entry.kind === "draw"
      ? entry.partner
      : entry.kind === "transfer"
        ? `${accountLabel(entry.account)} → ${entry.toAccount ? accountLabel(entry.toAccount) : entry.direction === "in" ? "in" : "out"}${entry.party ? ` · ${entry.party}` : ""}`
        : client?.name ?? entry.party;
  return (
    <li id={`entry-${entry.id}`} className="scroll-mt-28">
      <details open={open} className="group border-b border-white/[0.06] last:border-b-0">
        <summary className="flex items-center gap-3 sm:gap-5 py-3.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors -mx-2 px-2">
          <span className={`${bebas} text-[11px] tracking-[0.18em] text-white/40 w-14 shrink-0 tabular-nums`}>{formatDate(entry.date).replace(/, \d{4}$/, "")}</span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] text-white leading-snug truncate">{who || category.label}</span>
            <span className="block text-xs text-white/45 leading-snug truncate">
              {category.label} · {accountLabel(entry.account)}
              {entry.memo ? ` · ${entry.memo}` : ""}
            </span>
          </span>
          <span className="hidden sm:flex items-center gap-2 shrink-0">
            <ReceiptMark entry={entry} />
            <Badge tone={KIND_TONE[entry.kind]} dot={false}>{KIND_SHORT[entry.kind]}</Badge>
          </span>
          <Amount entry={entry} className="text-lg sm:text-xl leading-none shrink-0" />
        </summary>

        <div className="pb-5 pt-2 px-1 flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40 sm:hidden">
            <ReceiptMark entry={entry} />
            <Badge tone={KIND_TONE[entry.kind]} dot={false}>{KIND_SHORT[entry.kind]}</Badge>
          </div>
          <p className="text-xs text-white/35">
            Logged {entry.who ? `by ${entry.who} ` : ""}
            {formatDate(entry.createdAt.slice(0, 10))}
            {entry.source !== "manual" ? ` · came from ${entry.source === "ads" ? "an ad payment" : entry.source === "recurring" ? "a monthly bill" : entry.source === "stripe" ? "Stripe" : entry.source}` : ""}
            {entry.stripeRef && entry.source !== "stripe" ? " · matched to a Stripe payment" : ""}
            {entry.updatedAt !== entry.createdAt ? ` · edited ${formatDate(entry.updatedAt.slice(0, 10))}` : ""}
          </p>

          <EntryForm
            id={`edit-${entry.id}`}
            action={updateEntryAction}
            hidden={{ id: entry.id, returnTo }}
            defaults={{
              kind: entry.kind,
              amount: centsToInput(entry.cents),
              date: entry.date,
              category: entry.category,
              account: entry.account,
              party: entry.party,
              clientId: entry.clientId,
              partner: entry.partner,
              memo: entry.memo,
              direction: entry.direction,
              toAccount: entry.toAccount,
              noReceipt: entry.noReceipt,
            }}
            clients={clients}
            team={team}
            today={today}
            submitLabel="Save changes"
            submitClass={`${btnGhost} ${btnSm}`}
            showNoReceipt
            lockKind={entry.source === "ads" ? "income" : entry.source === "stripe" ? entry.kind : undefined}
          />

          {entry.kind === "expense" && !entry.receiptId && (
            <form action={attachReceiptAction} className="flex flex-col sm:flex-row sm:items-end gap-3">
              <input type="hidden" name="id" value={entry.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <div className="flex-1">
                <label className={labelClass} htmlFor={`attach-${entry.id}`}>Attach the receipt</label>
                <input
                  id={`attach-${entry.id}`}
                  name="photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className={`${inputClass} file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white`}
                />
              </div>
              <SubmitButton className={`${btnGhost} ${btnSm}`} pendingLabel="Attaching">
                Attach
              </SubmitButton>
            </form>
          )}

          <form action={deleteEntryAction} className="self-start">
            <input type="hidden" name="id" value={entry.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button type="submit" className={`${btnDanger} ${btnSm}`}>
              Remove from the ledger
            </button>
          </form>
        </div>
      </details>
    </li>
  );
}

/** A compact line for the home page's recent list. */
export function RecentLine({ entry, clients }: { entry: Entry; clients: { id: string; name: string }[] }) {
  const category = categoryOf(entry.category);
  const client = entry.clientId ? clients.find((c) => c.id === entry.clientId) : undefined;
  const who =
    entry.kind === "contribution" || entry.kind === "draw"
      ? `${entry.partner} ${entry.kind === "draw" ? "took out" : "put in"}`
      : entry.kind === "transfer"
        ? `${accountLabel(entry.account)} → ${entry.toAccount ? accountLabel(entry.toAccount) : "out"}`
        : client?.name ?? entry.party;
  return (
    <li className="flex items-center gap-3 py-3 border-b border-white/[0.06] last:border-b-0">
      <a href={`${BOOKS}/ledger?month=${entry.date.slice(0, 7)}&open=${entry.id}#entry-${entry.id}`} className="flex-1 min-w-0 group">
        <p className="text-sm text-white group-hover:text-[#f87171] transition-colors truncate">{who || category.label}</p>
        <p className="text-xs text-white/40 truncate">
          {formatDate(entry.date).replace(/, \d{4}$/, "")} · {category.label}
        </p>
      </a>
      <Amount entry={entry} className="text-lg leading-none shrink-0" />
    </li>
  );
}

/* --------------------------------- camera --------------------------------- */

export function SnapCard({ configured, returnTo, reader }: { configured: boolean; returnTo: string; reader: boolean }) {
  return (
    <Card id="snap" title="Snap a receipt" lede={reader ? "Take the photo, and the numbers get read for you to check." : "Take the photo. Reading isn't switched on, so you'll type the numbers."}>
      {!configured && (
        <p className="mb-4 text-sm text-[#E0B36A]">No file storage is connected, so photos have nowhere to go. It's on the Setup page.</p>
      )}
      <form action={snapReceiptAction}>
        <input type="hidden" name="returnTo" value={returnTo} />
        <ReceiptPicker disabled={!configured} />
      </form>
    </Card>
  );
}

/* ---------------------------------- bills --------------------------------- */

export function BillsTable({ bills, expected, month, returnTo }: { bills: RecurringBill[]; expected: ExpectedBill[]; month: string; returnTo: string }) {
  if (bills.length === 0) {
    return <Empty>No monthly bills yet. Add Vercel, Twilio, the domain, the phone: anything that comes every month and should be noticed if it doesn't.</Empty>;
  }
  const byId = new Map(expected.map((e) => [e.bill.id, e]));
  return (
    <ul>
      {bills.map((bill) => {
        const e = byId.get(bill.id);
        const status = !bill.active ? "paused" : e?.status ?? "upcoming";
        const tone: Tone = status === "logged" ? "ok" : status === "due" ? (e && e.daysLate > 3 ? "bad" : "warn") : "neutral";
        return (
          <li key={bill.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 py-4 border-b border-white/[0.06] last:border-b-0">
            <span className="sm:w-24 shrink-0">
              <Badge tone={tone}>{status === "logged" ? "Paid" : status === "due" ? "Due" : status === "paused" ? "Paused" : "Upcoming"}</Badge>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] text-white leading-snug">
                {bill.vendor} · <span className="tabular-nums">{formatCents(bill.cents)}</span>
              </p>
              <p className="text-xs text-white/45 leading-snug">
                On the {bill.day}
                {ordinalSuffix(bill.day)} · {categoryOf(bill.category).label} · {accountLabel(bill.account)}
                {bill.note ? ` · ${bill.note}` : ""}
                {e?.entry ? ` · paid ${formatDate(e.entry.date)}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {bill.active && e && e.status !== "logged" && (
                <form action={logBillAction}>
                  <input type="hidden" name="id" value={bill.id} />
                  <input type="hidden" name="month" value={month} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button type="submit" className={`${btnGhost} ${btnSm}`}>Paid this month</button>
                </form>
              )}
              <form action={toggleBillAction}>
                <input type="hidden" name="id" value={bill.id} />
                <button type="submit" className={`${btnGhost} ${btnSm}`}>{bill.active ? "Pause" : "Resume"}</button>
              </form>
              <form action={deleteBillAction}>
                <input type="hidden" name="id" value={bill.id} />
                <button type="submit" className={`${btnDanger} ${btnSm}`}>Remove</button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ordinalSuffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  return ["th", "st", "nd", "rd"][n % 10] ?? "th";
}

/* --------------------------------- capital -------------------------------- */

export function CapitalCard({ rows }: { rows: { partner: string; contributed: number; drawn: number; net: number }[] }) {
  return (
    <Card title="Owner money" lede="What each of you has put in, less what you have taken out. This is your capital account, and the K-1 wants it.">
      <div className="grid grid-cols-2 gap-3">
        {rows.map((r) => (
          <div key={r.partner} className="border border-white/[0.08] px-4 py-4">
            <p className={`${labelClass} !mb-1`}>{r.partner}</p>
            <p className={`${numClass} text-2xl text-white tabular-nums`}>{formatCents(r.net, { whole: true })}</p>
            <p className="text-xs text-white/40 mt-1">
              {formatCents(r.contributed, { whole: true })} in{r.drawn ? ` · ${formatCents(r.drawn, { whole: true })} out` : ""}
            </p>
          </div>
        ))}
      </div>
      <a href={`${BOOKS}#log`} className={`${linkLine} inline-block mt-4`}>
        Log money you put in
      </a>
    </Card>
  );
}

/** A tiny icon-led link used on the phone home. */
export function BigButton({ href, icon, label, hint, solid }: { href: string; icon: string; label: string; hint: string; solid?: boolean }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-4 border px-5 py-5 transition-colors ${
        solid ? "border-[#DC2626] bg-[#DC2626] text-white hover:bg-[#b91c1c]" : "border-white/[0.14] text-white hover:border-white/40 hover:bg-white/[0.03]"
      }`}
    >
      <Icon name={icon} size={26} className={solid ? "text-white" : "text-[#DC2626]"} />
      <span className="min-w-0">
        <span className={`${bebas} block text-[16px] tracking-[0.22em] leading-none`}>{label}</span>
        <span className={`block text-xs mt-1.5 ${solid ? "text-white/80" : "text-white/45"}`}>{hint}</span>
      </span>
    </a>
  );
}

/* -------------------------------- balances -------------------------------- */

/** Bank, Stripe, cash: what each holds, from everything logged. */
export function BalancesCard({ balances }: { balances: Record<Account, number> }) {
  const total = balances.checking + balances.stripe + balances.cash;
  return (
    <Card title="Where the money is" lede="From every row logged since the account opened. Cash out of the ATM sits in Cash until you spend it; a Stripe payout moves Stripe to the bank.">
      <div className="grid grid-cols-3 gap-3">
        {ACCOUNTS.map((a) => (
          <div key={a.id} className="border border-white/[0.08] px-4 py-4 min-w-0">
            <p className={`${labelClass} !mb-1`}>{a.short}</p>
            <p className={`${numClass} text-xl sm:text-2xl tabular-nums ${balances[a.id] < 0 ? "text-[#f87171]" : "text-white"}`}>{formatCents(balances[a.id], { whole: true })}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-white/40">
        {formatCents(total, { whole: true })} in all
        {balances.cash > 0 ? ` · ${formatCents(balances.cash)} cash on hand not yet spent` : ""}
        {balances.stripe > 0 ? ` · ${formatCents(balances.stripe)} still in Stripe, not paid out` : ""}
      </p>
      <a href={`${BOOKS}/stripe`} className={`${linkLine} inline-block mt-4`}>
        Check against Stripe
      </a>
    </Card>
  );
}

/* --------------------------------- ad money ------------------------------- */

const STATE_LABEL = { posted: "In the ledger", waiting: "Waiting", "left-out": "Left out" } as const;
const STATE_TONE: Record<AdPaymentState["state"], Tone> = { posted: "ok", waiting: "warn", "left-out": "neutral" };

/** Every ad payment and what the books did with it, with the buttons to change that. */
export function AdMoneyCard({ states, returnTo }: { states: AdPaymentState[]; returnTo: string }) {
  const waiting = states.filter((s) => s.state === "waiting").length;
  return (
    <Card
      id="ad-money"
      title={`Ad payments · ${waiting ? `${waiting} waiting` : "all handled"}`}
      lede="Payments recorded on the ads side. Bring one in and it posts as ad revenue in the month it arrived, keyed to the payment so it can never double up. Leave one out if it was never the LLC's money."
      padding="px-5 sm:px-6 pt-5 pb-2"
      action={
        waiting > 1 ? (
          <form action={importAdPaymentsAction}>
            <input type="hidden" name="returnTo" value={returnTo} />
            <button type="submit" className={`${btnGhost} ${btnSm}`}>Bring in all {waiting}</button>
          </form>
        ) : undefined
      }
    >
      {states.length === 0 ? (
        <div className="pb-4">
          <Empty>No ad payments recorded yet. Mark one paid on the Payments page and it lands here and in the ledger.</Empty>
        </div>
      ) : (
        <ul>
          {states.map((s) => (
            <li key={s.payment.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3.5 border-b border-white/[0.06] last:border-b-0">
              <span className="sm:w-28 shrink-0">
                <Badge tone={STATE_TONE[s.state]}>{STATE_LABEL[s.state]}</Badge>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-white leading-snug">
                  {formatCents(Math.round(s.payment.amount * 100))} from {s.payment.business}
                </p>
                <p className="text-xs text-white/45 leading-snug">
                  Arrived {formatDate(s.payment.receivedOn)} by {s.payment.method}
                  {s.payment.period ? ` · for ${s.payment.period}` : ""}
                  {s.state === "left-out" ? ` · ${s.reason}` : ""}
                  {s.state === "posted" ? ` · in ${accountLabel(s.entry.account)}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {s.state === "waiting" && (
                  <>
                    <form action={postAdPaymentAction}>
                      <input type="hidden" name="paymentId" value={s.payment.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <SubmitButton className={`${btnPrimary} ${btnSm}`} pendingLabel="Posting">Bring in</SubmitButton>
                    </form>
                    <form action={leaveOutAdPaymentAction} className="flex items-center gap-2">
                      <input type="hidden" name="paymentId" value={s.payment.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input name="reason" placeholder="why: paid before the LLC" className={`${inputClass} w-44 py-2 text-xs`} />
                      <button type="submit" className={`${btnGhost} ${btnSm}`}>Leave out</button>
                    </form>
                  </>
                )}
                {s.state === "left-out" && (
                  <form action={bringBackAdPaymentAction}>
                    <input type="hidden" name="paymentId" value={s.payment.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button type="submit" className={`${btnGhost} ${btnSm}`}>Bring back</button>
                  </form>
                )}
                {s.state === "posted" && (
                  <a href={`${BOOKS}/ledger?month=${s.entry.date.slice(0, 7)}&open=${s.entry.id}#entry-${s.entry.id}`} className={`${btnGhost} ${btnSm}`}>
                    Open
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
