"use client";

/**
 * The contract editor.
 *
 * A client component for one reason: when a save is refused, everything typed
 * has to still be there. A server action that redirects on a validation failure
 * discards the whole form, closes it, and leaves the reason in a banner above
 * the fold — which is indistinguishable from a button that does nothing, and
 * was.
 *
 * `useActionState` keeps the page put, so the browser keeps the values and the
 * refusal is shown against the field it belongs to.
 *
 * Everything it needs about plans and dates arrives as props. Importing them
 * from the roster would drag Redis and node crypto into the browser bundle.
 */

import { useActionState } from "react";
import { saveAdvertiserAction, type AdvertiserFormState } from "../actions";
import { SubmitButton } from "./submit-button";
import type { LinkView } from "./types";
import { tabHref } from "./types";
import {
  Field,
  Note,
  Pill,
  bebas,
  btnPrimary,
  inputClass,
  labelClass,
  linkQuiet,
  selectClass,
} from "./ui";

const ARTWORK_OPTIONS = [
  { id: "requested", label: "Requested" },
  { id: "received", label: "Received" },
  { id: "approved", label: "Approved" },
  { id: "on-screen", label: "On screen" },
];

/** Plan facts, flattened to the few strings the form actually renders. */
export type PlanOption = {
  id: string;
  label: string;
};

/** Only the fields the form reads back, so the server can pass a plain object. */
export type EditingAdvertiser = {
  id: string;
  business: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  qrCode: string;
  plan: string;
  startDate: string;
  status: string;
  paymentType?: string;
  notes: string;
  customMonthly?: number | null;
  customSetup?: number | null;
  customMonths?: number | null;
  customTotal?: number | null;
  dealNote?: string;
  isCustom: boolean;
  endDateLabel: string;
  slot?: number | null;
  artworkStatus?: string;
};

/**
 * A prospect who has said yes, carried into this form.
 *
 * Kept separate from `editing` because they are opposites: editing has an id
 * and must not create anything, this has no id and must create exactly one
 * advertiser. Sharing one prop would mean an `id` that is sometimes a prospect
 * and sometimes a client, which is the sort of thing that ends with a
 * conversion overwriting somebody else's contract.
 */
export type ConversionPrefill = {
  prospectId: string;
  business: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  notes: string;
  campaign: string;
  source: string;
  /** Another active advertiser already holds the category they asked for. */
  categoryHeldBy?: string;
  openSlots: number;
};

const numberValue = (v: number | null | undefined) =>
  v === null || v === undefined ? "" : String(v);

/**
 * Refusals, said where they can be acted on. The wording names the field rather
 * than the rule — "say why" beats "dealNote is required".
 */
function refusal(state: NonNullable<AdvertiserFormState>): string {
  switch (state.err) {
    case "business":
      return "Give the business a name.";
    case "plan":
      return "Pick a package.";
    case "startdate":
      return "Give a start date — the end date is worked out from it.";
    case "category":
      return `${state.clash ?? "Another advertiser"} already owns that category. End their run first, or use a different category.`;
    case "dealnote":
      return "You've set a price of their own, so say why. Six months from now it's the only record of the reason.";
    case "dealnumber":
      return `"${state.detail}" isn't a number I can use. Enter the amount in dollars, like 275.`;
    case "dealmonths":
      return "A custom term has to be at least one whole month.";
    case "destination":
      return state.detail ?? "That web address isn't valid.";
    case "code":
      return state.detail ?? "That QR code name isn't valid.";
    case "codetaken":
      return `"${state.detail}" is already in use. A printed code can never be reassigned — pick a different name.`;
    case "slot":
      return "A slot is a number from 1 to 16.";
    case "save":
      return "The database didn't accept that. Check the connection and try again.";
    default:
      return "That didn't save.";
  }
}

export function AdvertiserForm({
  editing,
  prefill,
  codes,
  plans,
  today,
}: {
  editing?: EditingAdvertiser;
  prefill?: ConversionPrefill;
  codes: LinkView[];
  plans: PlanOption[];
  today: string;
}) {
  const [state, formAction] = useActionState<AdvertiserFormState, FormData>(
    saveAdvertiserAction,
    null,
  );

  /** What each field starts as: the client being edited, or the prospect. */
  const start = editing ?? prefill;

  return (
    <details
      id="editor"
      // Open while editing, and open after a refusal — closing it on the reader
      // is how the values looked lost even when they weren't.
      open={Boolean(editing) || Boolean(prefill) || Boolean(state)}
      className="group border border-white/[0.08] bg-white/[0.02] overflow-hidden scroll-mt-28"
    >
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 sm:px-6 py-4 list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors">
        <span className={`${bebas} text-[13px] tracking-[0.24em] text-white`}>
          {editing
            ? `Edit ${editing.business}`
            : prefill
              ? `Sign up ${prefill.business}`
              : "Add an advertiser"}
        </span>
        <span className={`${bebas} text-[11px] tracking-[0.22em] text-white/35`}>
          <span className="group-open:hidden">Open</span>
          <span className="hidden group-open:inline">Close</span>
        </span>
      </summary>

      <div className="px-5 sm:px-6 pb-6 pt-4 border-t border-white/[0.06]">
        {editing && (
          <a href={tabHref("advertisers")} className={`${linkQuiet} inline-block mb-5`}>
            Cancel edit
          </a>
        )}

        {prefill && !state && (
          <div className="mb-5 space-y-3">
            <Note tone="ok">
              <p className="text-sm font-semibold text-white">
                Converting {prefill.business} from the prospect list.
              </p>
              <p className="mt-1.5 text-sm text-white/70">
                Their details are filled in below. They stay on the prospect list
                until you save this, and nothing on their record changes if you
                walk away. Set the package, check the start date, and save.
              </p>
              <a
                href={`${tabHref("prospects")}#prospect-${prefill.prospectId}`}
                className={`${linkQuiet} inline-block mt-2.5`}
              >
                Back to their prospect card
              </a>
            </Note>

            {prefill.categoryHeldBy && (
              <Note tone="bad">
                <p className="text-sm font-semibold text-white">
                  {prefill.categoryHeldBy} already holds “{prefill.category}”.
                </p>
                <p className="mt-1.5 text-sm text-white/70">
                  Exclusivity is what we sell, so this won&apos;t save as Running.
                  End the other run first, give this client a different category,
                  or leave them signed but not live.
                </p>
              </Note>
            )}

            {prefill.openSlots === 0 && (
              <Note tone="warn">
                <p className="text-sm font-semibold text-white">
                  All 16 slots are taken.
                </p>
                <p className="mt-1.5 text-sm text-white/70">
                  Somebody has to come off the rotation before this one can go on
                  it. Signed but not live is the honest state until then.
                </p>
              </Note>
            )}
          </div>
        )}

        {state && (
          <div className="mb-5">
            <Note tone="bad">
              <p className="text-sm font-semibold text-white">That didn&apos;t save.</p>
              <p className="mt-1.5 text-sm text-white/70">{refusal(state)}</p>
              <p className="mt-2 text-xs text-white/35">
                Nothing you typed has been lost — fix the above and submit again.
              </p>
            </Note>
          </div>
        )}

        <form action={formAction} className="space-y-5">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          {prefill && (
            <>
              <input type="hidden" name="prospectId" value={prefill.prospectId} />
              <input
                type="hidden"
                name="prospectCampaign"
                value={prefill.campaign}
              />
              <input type="hidden" name="prospectSource" value={prefill.source} />
            </>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Business" name="business" defaultValue={start?.business} required />
            <Field
              label="Category (locked)"
              name="category"
              defaultValue={start?.category}
              placeholder="Plumbing, Dentistry, Auto Repair…"
            />
            <Field label="Contact name" name="contactName" defaultValue={start?.contactName} />
            <Field label="Phone" name="phone" type="tel" defaultValue={start?.phone} />
            <Field label="Email" name="email" type="email" defaultValue={start?.email} />
            <div>
              <label className={labelClass} htmlFor="qrCode">
                QR code
              </label>
              <select
                id="qrCode"
                name="qrCode"
                defaultValue={editing?.qrCode ?? ""}
                className={selectClass}
              >
                <option value="">— none —</option>
                {codes.map((link) => (
                  <option key={link.code} value={link.code}>
                    /go/{link.code} — {link.label}
                    {link.active ? "" : " (retired)"}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-white/30">
                {editing
                  ? "Add more codes on their profile, where the scan counts are."
                  : "Or make them a new one below — leave this on “none”."}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass} htmlFor="plan">
                Package <span className="text-[#DC2626]">*</span>
              </label>
              <select
                id="plan"
                name="plan"
                defaultValue={editing?.plan ?? "standard"}
                className={selectClass}
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.label}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Start date"
              name="startDate"
              type="date"
              defaultValue={editing?.startDate ?? today}
              required
            />
            <div>
              <label className={labelClass} htmlFor="paymentType">
                How they pay
              </label>
              <select
                id="paymentType"
                name="paymentType"
                defaultValue={editing?.paymentType ?? "monthly"}
                className={selectClass}
              >
                <option value="monthly">Invoiced monthly</option>
                <option value="prepaid">Whole term up front</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                // A conversion starts as signed-but-not-live: they have said yes,
                // but the start date is usually still ahead. Worth knowing that
                // pending does not hold their category — the warning above says so.
                defaultValue={editing?.status ?? (prefill ? "pending" : "active")}
                className={selectClass}
              >
                <option value="active">Running</option>
                <option value="pending">Signed, not live yet</option>
                <option value="ended">Ended</option>
              </select>
            </div>
            <Field
              label="Slot on the board"
              name="slot"
              id="slot"
              inputMode="numeric"
              defaultValue={editing?.slot ? String(editing.slot) : ""}
              placeholder="next free"
              hint="1 to 16. Left blank, they take the lowest free one."
            />
            <div>
              <label className={labelClass} htmlFor="artworkStatus">
                Artwork
              </label>
              <select
                id="artworkStatus"
                name="artworkStatus"
                defaultValue={editing?.artworkStatus ?? "requested"}
                className={selectClass}
              >
                {ARTWORK_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-white/30">Only on screen counts plays.</p>
            </div>
          </div>

          {/* The deal. Blank means list price, so the common case stays a short
              form and only a real exception costs any typing. */}
          <details
            open={Boolean(editing?.isCustom) || state?.err.startsWith("deal")}
            className=" border border-white/[0.07] bg-white/[0.02] overflow-hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors">
              <span className={`${bebas} text-[12px] tracking-[0.22em] text-white`}>
                Custom deal
                {editing?.isCustom && (
                  <span className="ml-2">
                    <Pill tone="warn">in use</Pill>
                  </span>
                )}
              </span>
              <span className="text-xs text-white/35">leave blank for package pricing</span>
            </summary>

            <div className="px-5 pb-5 pt-1 space-y-4">
              <Field
                label="One price for the whole term"
                name="customTotal"
                id="customTotal"
                inputMode="decimal"
                defaultValue={numberValue(editing?.customTotal)}
                placeholder="300"
                hint="For a deal sold as a single figure — $300 for four months, paid once. Set this and it replaces the monthly and setup fields below."
              />

              <div className="grid sm:grid-cols-3 gap-4">
                <Field
                  label="Their monthly"
                  name="customMonthly"
                  id="customMonthly"
                  inputMode="decimal"
                  defaultValue={numberValue(editing?.customMonthly)}
                  placeholder="275"
                  hint="Dollars per month. 0 means free."
                />
                <Field
                  label="Their setup fee"
                  name="customSetup"
                  id="customSetup"
                  inputMode="decimal"
                  defaultValue={numberValue(editing?.customSetup)}
                  placeholder="0"
                  hint="0 waives it."
                />
                <Field
                  label="Their term"
                  name="customMonths"
                  id="customMonths"
                  inputMode="numeric"
                  defaultValue={numberValue(editing?.customMonths)}
                  placeholder="6"
                  hint="Whole months. Moves the end date."
                />
              </div>
              <Field
                label="Why"
                name="dealNote"
                id="dealNote"
                defaultValue={editing?.dealNote ?? ""}
                placeholder="Trade for catering, referral partner, second location…"
                hint="Required whenever you set a price of their own — it's the only record of the reason."
              />
            </div>
          </details>

          {/* Only offered on a new client. An existing one's codes are managed
              on their profile, where the scan counts are. */}
          {!editing && (
            <details
              open={state?.err === "destination" || state?.err === "code" || state?.err === "codetaken"}
              className=" border border-white/[0.07] bg-white/[0.02] overflow-hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors">
                <span className={`${bebas} text-[12px] tracking-[0.22em] text-white`}>
                  Make their QR code now
                </span>
                <span className="text-xs text-white/35">optional</span>
              </summary>
              <div className="px-5 pb-5 pt-1 space-y-4">
                <Field
                  label="Where should their scan go?"
                  name="newLinkDestination"
                  id="newLinkDestination"
                  type="url"
                  placeholder="https://theirsite.com"
                  hint="Their website, booking page, menu, Google profile — anything with a web address."
                />
                <Field
                  label="Code"
                  name="newLinkCode"
                  id="newLinkCode"
                  placeholder="leave blank and we'll name it from the business"
                  hint="This is the bit after /go/ and it gets printed, so it can never be changed afterwards. The destination can."
                />
              </div>
            </details>
          )}

          <div>
            <label className={labelClass} htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={start?.notes}
              placeholder="Artwork due, renewal conversation, billing quirks…"
              className={inputClass}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <SubmitButton className={`${btnPrimary} px-6 py-3`} pendingLabel="Saving…">
              {editing
                ? "Save changes"
                : prefill
                  ? `Sign up ${prefill.business}`
                  : "Add advertiser"}
            </SubmitButton>
            <p className="text-xs text-white/30">
              The end date is calculated from the package term —{" "}
              {editing ? `currently ${editing.endDateLabel}` : "no need to enter it"}.
            </p>
          </div>
        </form>
      </div>
    </details>
  );
}
