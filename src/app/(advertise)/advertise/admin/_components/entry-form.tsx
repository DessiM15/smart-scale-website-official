"use client";

/**
 * The one form for a ledger row, used to log, to edit, and to confirm a
 * receipt. It runs in the browser only so the category list can follow the
 * kind: pick "Owner put money in" and the categories become the two owner
 * ones, the partner picker appears, and the party box goes away.
 */

import { useState } from "react";
import { CATEGORIES, type CategoryKind } from "@/lib/books/categories";
import { ACCOUNTS, KINDS, type EntryKind } from "@/lib/books/kinds";
import { SubmitButton } from "./submit-button";
import { Field, btnSolid, inputClass, labelClass, selectClass } from "./ui";

export type EntryDefaults = {
  kind?: EntryKind;
  amount?: string;
  date?: string;
  category?: string;
  account?: string;
  party?: string;
  clientId?: string;
  partner?: string;
  memo?: string;
  direction?: "in" | "out";
  toAccount?: string;
  noReceipt?: boolean;
};

export function EntryForm({
  action,
  defaults = {},
  hidden = {},
  clients,
  team,
  today,
  submitLabel,
  pendingLabel = "Saving",
  lockKind,
  kinds,
  showNoReceipt,
  id = "entry",
  submitClass = btnSolid,
  children,
}: {
  action: (data: FormData) => void | Promise<void>;
  defaults?: EntryDefaults;
  hidden?: Record<string, string>;
  clients: { id: string; name: string }[];
  team: readonly string[];
  today: string;
  submitLabel: string;
  pendingLabel?: string;
  /** For a receipt: it is an expense, full stop. */
  lockKind?: EntryKind;
  /** Offer only these kinds. A receipt is a purchase or a cash withdrawal, never income. */
  kinds?: EntryKind[];
  showNoReceipt?: boolean;
  id?: string;
  submitClass?: string;
  children?: React.ReactNode;
}) {
  const [kind, setKind] = useState<EntryKind>(lockKind ?? defaults.kind ?? "expense");
  const meta = KINDS.find((k) => k.id === kind)!;
  const offered = kinds ? KINDS.filter((k) => kinds.includes(k.id)) : KINDS;
  const categories = CATEGORIES.filter((c) => c.kind === (meta.category as CategoryKind));
  const owner = kind === "contribution" || kind === "draw";
  const transfer = kind === "transfer";
  const defaultCategory =
    defaults.category && categories.some((c) => c.id === defaults.category)
      ? defaults.category
      : kind === "contribution"
        ? "owner-contribution"
        : kind === "draw"
          ? "owner-draw"
          : categories[0]?.id;
  const f = (name: string) => `${id}-${name}`;

  return (
    <form action={action} className="flex flex-col gap-4">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor={f("kind")}>What kind</label>
          {lockKind ? (
            <>
              <input type="hidden" name="kind" value={lockKind} />
              <p className={`${inputClass} text-white/70`}>{meta.label}</p>
            </>
          ) : (
            <select
              id={f("kind")}
              name="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as EntryKind)}
              className={selectClass}
            >
              {offered.map((k) => (
                <option key={k.id} value={k.id}>{k.label}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className={labelClass} htmlFor={f("amount")}>
            Amount <span className="text-[#DC2626]">*</span>
          </label>
          <input
            id={f("amount")}
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            required
            defaultValue={defaults.amount}
            className={`${inputClass} text-lg tabular-nums`}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor={f("category")}>Category</label>
          <select id={f("category")} name="category" key={kind} defaultValue={defaultCategory} className={selectClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor={f("date")}>When</label>
          <input id={f("date")} name="date" type="date" defaultValue={defaults.date ?? today} className={inputClass} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor={f("account")}>{transfer ? "Account it left" : "Account"}</label>
          <select id={f("account")} name="account" defaultValue={defaults.account ?? "checking"} className={selectClass}>
            {ACCOUNTS.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </div>
        {owner ? (
          <div>
            <label className={labelClass} htmlFor={f("partner")}>
              Whose money <span className="text-[#DC2626]">*</span>
            </label>
            <select id={f("partner")} name="partner" defaultValue={defaults.partner ?? ""} required className={selectClass}>
              <option value="" disabled>Pick one</option>
              {team.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        ) : transfer ? (
          <div>
            <label className={labelClass} htmlFor={f("toAccount")}>Account it went to</label>
            <select id={f("toAccount")} name="toAccount" defaultValue={defaults.toAccount ?? "cash"} className={selectClass}>
              {ACCOUNTS.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>
        ) : kind === "income" ? (
          <div>
            <label className={labelClass} htmlFor={f("clientId")}>Client</label>
            <select id={f("clientId")} name="clientId" defaultValue={defaults.clientId ?? ""} className={selectClass}>
              <option value="">Not a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <Field
            label="Paid to"
            name="party"
            id={f("party")}
            defaultValue={defaults.party}
            placeholder="Home Depot, Vercel, the printer"
            required
          />
        )}
      </div>

      {kind === "income" && (
        <Field label="From" name="party" id={f("party-in")} defaultValue={defaults.party} placeholder="Who paid" required />
      )}
      {owner && <input type="hidden" name="party" value="" />}
      {transfer && (
        <Field label="What it was" name="party" id={f("party-tr")} defaultValue={defaults.party} placeholder="ATM withdrawal, Stripe payout" />
      )}

      <Field label="Memo" name="memo" id={f("memo")} defaultValue={defaults.memo} placeholder="What it was for" />

      {showNoReceipt && kind === "expense" && (
        <label className="flex items-center gap-2.5 text-sm text-white/60 cursor-pointer">
          <input type="checkbox" name="noReceipt" defaultChecked={defaults.noReceipt} className="accent-[#DC2626]" />
          There is no receipt for this
        </label>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <SubmitButton className={submitClass} pendingLabel={pendingLabel}>
          {submitLabel}
        </SubmitButton>
        {children}
      </div>
    </form>
  );
}
