import type { Metadata } from "next";
import { isAdminConfigured, isSignedIn } from "@/lib/ads/auth";
import { isRedisConfigured } from "@/lib/ads/redis";
import { AD_LINKS } from "@/lib/ads/advertisers";
import {
  formatDate,
  listAdvertisers,
  listProspects,
  summarize,
  today,
  PLAN_LIST,
  SELLABLE_SLOTS,
  type AdvertiserView,
  type Prospect,
} from "@/lib/ads/roster";
import {
  deleteAdvertiserAction,
  deleteProspectAction,
  saveAdvertiserAction,
  saveProspectAction,
  signInAction,
  signOutAction,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ad Tracker",
  robots: { index: false, follow: false },
};

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const STATUS_LABEL = {
  active: "Running",
  pending: "Signed, not live",
  ended: "Ended",
} as const;

const PROSPECT_LABEL = {
  hot: "Hot",
  contacted: "Contacted",
  new: "New",
  passed: "Passed",
} as const;

/* ------------------------------- primitives ------------------------------- */

const inputClass =
  "w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2 text-sm text-[#1a1210] placeholder:text-[#b3a698] focus:outline-none focus:border-[#DC2626]";
const labelClass =
  "block text-[11px] uppercase tracking-[0.12em] text-[#9a8b7d] font-semibold mb-1.5";

function Field({
  label,
  name,
  // Two forms on this page share field names, so ids must be scoped or the
  // waitlist labels focus the advertiser form's inputs.
  id = name,
  defaultValue,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  id?: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
        {required && <span className="text-[#DC2626]"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={inputClass}
      />
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
  tone = "plain",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "plain" | "alert";
}) {
  return (
    <div
      className={`rounded-2xl px-5 py-4 border ${
        tone === "alert"
          ? "bg-[#fdf6e6] border-[#f0c674]"
          : "bg-white border-black/[0.06]"
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.14em] text-[#9a8b7d] font-semibold">
        {label}
      </p>
      <p className="mt-1.5 text-3xl font-semibold text-[#1a1210] tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-[#9a8b7d]">{hint}</p>}
    </div>
  );
}

function Banner({ msg, err, clash }: { msg?: string; err?: string; clash?: string }) {
  const notices: Record<string, string> = {
    added: "Advertiser added.",
    updated: "Changes saved.",
    removed: "Advertiser removed.",
    prospect: "Saved to the interested list.",
    prospectRemoved: "Removed from the interested list.",
  };
  const errors: Record<string, string> = {
    badkey: "That access key didn't work.",
    business: "Business name is required.",
    plan: "Pick a package.",
    startdate: "Start date is required.",
    category: `${clash ?? "Another advertiser"} already owns that category. End their run first, or use a different category.`,
    save: "Could not write to the database. Check that Upstash is connected, then try again.",
    missing: "Nothing to remove.",
  };

  const text = err ? errors[err] : msg ? notices[msg] : undefined;
  if (!text) return null;

  return (
    <div
      role="status"
      className={`rounded-2xl px-5 py-3.5 mb-6 text-sm border ${
        err
          ? "bg-[#fdecec] border-[#DC2626]/30 text-[#8f1d1d]"
          : "bg-[#eef7ee] border-green-600/20 text-[#1f5130]"
      }`}
    >
      {text}
    </div>
  );
}

/* ------------------------------- lock screen ------------------------------ */

function LockScreen({ configured, wrong }: { configured: boolean; wrong: boolean }) {
  return (
    <main className="min-h-screen bg-[#faf6f0] flex items-center justify-center px-6">
      <form
        action={signInAction}
        className="w-full max-w-sm rounded-3xl bg-white border border-black/[0.06] shadow-lg shadow-black/[0.04] p-8"
      >
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#DC2626] font-semibold">
          Mex Taco House
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#1a1210]">Ad Tracker</h1>
        {configured ? (
          <>
            <p className="mt-2 text-sm text-[#7a6a5d]">
              Enter the access key to manage advertisers.
            </p>
            <input
              type="password"
              name="key"
              autoFocus
              placeholder="Access key"
              className="mt-6 w-full rounded-xl border border-black/[0.1] bg-[#faf6f0] px-4 py-3 text-[#1a1210] placeholder:text-[#9a8b7d] focus:outline-none focus:border-[#DC2626]"
            />
            {wrong && (
              <p className="mt-2 text-xs text-[#DC2626]">That key didn&apos;t work.</p>
            )}
            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-[#DC2626] text-white font-semibold py-3 hover:bg-[#b91c1c] transition-colors"
            >
              Sign in
            </button>
          </>
        ) : (
          <p className="mt-3 text-sm text-[#5c4f45]">
            Set <code className="font-mono text-xs">ADS_ADMIN_KEY</code> in the Vercel
            project settings and redeploy to switch this page on.
          </p>
        )}
      </form>
    </main>
  );
}

/* --------------------------------- roster --------------------------------- */

function StatusPill({ view }: { view: AdvertiserView }) {
  const tone =
    view.overdue
      ? "bg-[#DC2626] text-white"
      : view.expiringSoon
        ? "bg-[#f0c674] text-[#1a1210]"
        : view.status === "active"
          ? "bg-[#eef7ee] text-[#1f5130]"
          : view.status === "pending"
            ? "bg-[#f3efe8] text-[#7a6a5d]"
            : "bg-black/[0.05] text-[#9a8b7d]";
  const label = view.overdue
    ? "Term ended"
    : view.expiringSoon
      ? `${view.daysRemaining}d left`
      : STATUS_LABEL[view.status];
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {label}
    </span>
  );
}

function RosterRow({ view, knownCodes }: { view: AdvertiserView; knownCodes: Set<string> }) {
  const qrMissing = view.qrCode && !knownCodes.has(view.qrCode);
  return (
    <tr className="border-t border-black/[0.06] align-top">
      <td className="px-4 py-3">
        <p className="font-semibold text-[#1a1210]">{view.business}</p>
        {view.contactName && (
          <p className="text-xs text-[#9a8b7d]">{view.contactName}</p>
        )}
        {(view.email || view.phone) && (
          <p className="text-xs text-[#9a8b7d]">
            {[view.email, view.phone].filter(Boolean).join(" · ")}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-[#5c4f45]">{view.category || "—"}</td>
      <td className="px-4 py-3">
        <p className="text-[#5c4f45]">{view.planName}</p>
        <p className="text-xs text-[#9a8b7d] tabular-nums">
          {view.monthly ? `${money(view.monthly)}/mo` : "no charge"}
        </p>
      </td>
      <td className="px-4 py-3 text-[#5c4f45] whitespace-nowrap">
        {formatDate(view.startDate)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <p className="text-[#5c4f45]">{formatDate(view.endDate)}</p>
        {view.status === "active" && (
          <p className="text-xs text-[#9a8b7d] tabular-nums">
            {view.daysRemaining >= 0
              ? `${view.daysRemaining} days`
              : `${Math.abs(view.daysRemaining)} days ago`}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusPill view={view} />
      </td>
      <td className="px-4 py-3">
        {view.qrCode ? (
          <>
            <span className="font-mono text-xs text-[#DC2626]">/go/{view.qrCode}</span>
            {qrMissing && (
              <p className="text-xs text-[#DC2626] mt-0.5">not in the link registry</p>
            )}
          </>
        ) : (
          <span className="text-xs text-[#b3a698]">none</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <a
          href={`/advertise/admin?edit=${encodeURIComponent(view.id)}#editor`}
          className="text-xs font-semibold text-[#DC2626] hover:underline"
        >
          Edit
        </a>
        <form action={deleteAdvertiserAction} className="inline">
          <input type="hidden" name="id" value={view.id} />
          <button
            type="submit"
            className="ml-3 text-xs text-[#9a8b7d] hover:text-[#DC2626]"
          >
            Remove
          </button>
        </form>
      </td>
    </tr>
  );
}

function AdvertiserForm({
  editing,
  knownCodes,
}: {
  editing?: AdvertiserView;
  knownCodes: string[];
}) {
  return (
    <section
      id="editor"
      className="rounded-3xl bg-white border border-black/[0.06] shadow-lg shadow-black/[0.04] p-6 sm:p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[#1a1210]">
          {editing ? `Edit ${editing.business}` : "Add an advertiser"}
        </h2>
        {editing && (
          <a href="/advertise/admin" className="text-xs text-[#9a8b7d] hover:text-[#1a1210]">
            Cancel
          </a>
        )}
      </div>

      <form action={saveAdvertiserAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Business" name="business" defaultValue={editing?.business} required />
          <Field
            label="Category (locked)"
            name="category"
            defaultValue={editing?.category}
            placeholder="Plumbing, Dentistry, Auto Repair…"
          />
          <Field label="Contact name" name="contactName" defaultValue={editing?.contactName} />
          <Field label="Phone" name="phone" type="tel" defaultValue={editing?.phone} />
          <Field label="Email" name="email" type="email" defaultValue={editing?.email} />
          <div>
            <label className={labelClass} htmlFor="qrCode">
              QR code
            </label>
            <input
              id="qrCode"
              name="qrCode"
              list="known-codes"
              defaultValue={editing?.qrCode}
              placeholder="plumb"
              className={inputClass}
            />
            <datalist id="known-codes">
              {knownCodes.map((code) => (
                <option key={code} value={code} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="plan">
              Package <span className="text-[#DC2626]">*</span>
            </label>
            <select
              id="plan"
              name="plan"
              defaultValue={editing?.plan ?? "standard"}
              className={inputClass}
            >
              {PLAN_LIST.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — {plan.months} mo
                  {plan.monthly ? ` · ${money(plan.monthly)}/mo` : " · no charge"}
                  {plan.internalOnly ? " (internal)" : ""}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Start date"
            name="startDate"
            type="date"
            defaultValue={editing?.startDate ?? today()}
            required
          />
          <div>
            <label className={labelClass} htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={editing?.status ?? "active"}
              className={inputClass}
            >
              <option value="active">Running</option>
              <option value="pending">Signed, not live yet</option>
              <option value="ended">Ended</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={editing?.notes}
            placeholder="Artwork due, renewal conversation, billing quirks…"
            className={inputClass}
          />
        </div>

        <p className="text-xs text-[#9a8b7d]">
          The end date is calculated from the package term — {editing ? "currently " : ""}
          {editing ? formatDate(editing.endDate) : "no need to enter it"}.
        </p>

        <button
          type="submit"
          className="rounded-xl bg-[#DC2626] text-white font-semibold px-6 py-3 hover:bg-[#b91c1c] transition-colors"
        >
          {editing ? "Save changes" : "Add advertiser"}
        </button>
      </form>
    </section>
  );
}

/* -------------------------------- waitlist -------------------------------- */

function ProspectList({ prospects }: { prospects: Prospect[] }) {
  if (prospects.length === 0) {
    return (
      <p className="text-sm text-[#9a8b7d]">
        Nobody on the list yet. Add businesses that ask about the screens — when a
        category opens up, this is who you call.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-black/[0.06]">
      {prospects.map((p) => (
        <li key={p.id} className="py-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-[#1a1210]">
              {p.business}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  p.status === "hot"
                    ? "bg-[#DC2626] text-white"
                    : p.status === "contacted"
                      ? "bg-[#f0c674] text-[#1a1210]"
                      : p.status === "passed"
                        ? "bg-black/[0.05] text-[#9a8b7d]"
                        : "bg-[#f3efe8] text-[#7a6a5d]"
                }`}
              >
                {PROSPECT_LABEL[p.status]}
              </span>
            </p>
            <p className="text-xs text-[#9a8b7d]">
              {[p.category, p.contactName, p.phone, p.email, p.source]
                .filter(Boolean)
                .join(" · ") || "no details"}
            </p>
            {p.notes && <p className="text-xs text-[#5c4f45] mt-1">{p.notes}</p>}
          </div>
          <form action={deleteProspectAction}>
            <input type="hidden" name="id" value={p.id} />
            <button type="submit" className="text-xs text-[#9a8b7d] hover:text-[#DC2626]">
              Remove
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------- the page -------------------------------- */

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string; clash?: string; edit?: string }>;
}) {
  const params = await searchParams;

  if (!(await isSignedIn())) {
    return (
      <LockScreen configured={isAdminConfigured()} wrong={params.err === "badkey"} />
    );
  }

  const [advertisers, prospects] = await Promise.all([
    listAdvertisers(),
    listProspects(),
  ]);
  const summary = summarize(advertisers);
  const editing = params.edit
    ? advertisers.find((a) => a.id === params.edit)
    : undefined;
  const knownCodes = AD_LINKS.map((l) => l.code);
  const knownCodeSet = new Set(knownCodes);
  const needsAttention = [...summary.overdue, ...summary.expiring];

  return (
    <main className="min-h-screen bg-[#faf6f0] px-5 sm:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-wrap items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#DC2626] font-semibold">
              Mex Taco House · Screen Advertising
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-[#1a1210]">
              Ad Tracker
            </h1>
            <p className="mt-2 text-sm text-[#7a6a5d]">
              Who&apos;s running, what&apos;s open, and what&apos;s coming up for renewal.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/advertise/stats"
              className="px-4 py-2 rounded-full text-sm font-semibold bg-white text-[#7a6a5d] border border-black/[0.06] hover:border-[#DC2626]/30 hover:text-[#1a1210] transition-all"
            >
              Scan report
            </a>
            <form action={signOutAction}>
              <button
                type="submit"
                className="px-4 py-2 rounded-full text-sm font-semibold bg-white text-[#7a6a5d] border border-black/[0.06] hover:text-[#1a1210] transition-all"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        {!isRedisConfigured() && (
          <div className="rounded-2xl border border-[#f0c674] bg-[#fdf6e6] px-5 py-4 mb-6">
            <p className="text-sm font-semibold text-[#1a1210]">
              No database connected — nothing you enter here will save.
            </p>
            <p className="mt-1 text-sm text-[#5c4f45]">
              In Vercel: Storage → Create Database → Upstash Redis, connect it to this
              project, then redeploy.
            </p>
          </div>
        )}

        <Banner msg={params.msg} err={params.err} clash={params.clash} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Tile
            label="Running now"
            value={`${summary.active}`}
            hint={summary.pending ? `+${summary.pending} signed, not live` : "of 16 slots"}
          />
          <Tile
            label="Open slots"
            value={`${summary.openSlots}`}
            hint={`${SELLABLE_SLOTS} sellable in the rotation`}
            tone={summary.openSlots > 0 ? "alert" : "plain"}
          />
          <Tile
            label="Monthly revenue"
            value={money(summary.monthlyRevenue)}
            hint="active advertisers"
          />
          <Tile
            label="Contracted"
            value={money(summary.contractedRemaining)}
            hint="left to invoice on current terms"
          />
        </div>

        {needsAttention.length > 0 && (
          <section className="rounded-3xl border border-[#f0c674] bg-[#fdf6e6] p-6 sm:p-8 mb-6">
            <h2 className="text-lg font-semibold text-[#1a1210]">Needs attention</h2>
            <p className="mt-1 text-sm text-[#5c4f45]">
              Reach out before the term runs out — a lapsed category goes back on the
              market.
            </p>
            <ul className="mt-4 space-y-2">
              {needsAttention.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-3 text-sm"
                >
                  <span className="font-semibold text-[#1a1210]">
                    {v.business}
                    <span className="font-normal text-[#7a6a5d]"> · {v.category || "no category"}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-[#5c4f45]">
                      {v.overdue
                        ? `ended ${formatDate(v.endDate)}`
                        : `ends ${formatDate(v.endDate)} · ${v.daysRemaining} days`}
                    </span>
                    {v.phone && (
                      <a
                        href={`tel:${v.phone.replace(/[^\d+]/g, "")}`}
                        className="font-semibold text-[#DC2626] hover:underline"
                      >
                        Call
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-3xl bg-white border border-black/[0.06] shadow-lg shadow-black/[0.04] p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-semibold text-[#1a1210] mb-4">The rotation</h2>
          {advertisers.length === 0 ? (
            <p className="text-sm text-[#9a8b7d]">
              No advertisers yet. Add the first one below.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
              <table className="w-full text-sm min-w-[54rem]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-[#9a8b7d]">
                    <th className="px-4 py-2 font-semibold">Business</th>
                    <th className="px-4 py-2 font-semibold">Category</th>
                    <th className="px-4 py-2 font-semibold">Package</th>
                    <th className="px-4 py-2 font-semibold">Started</th>
                    <th className="px-4 py-2 font-semibold">Ends</th>
                    <th className="px-4 py-2 font-semibold">Status</th>
                    <th className="px-4 py-2 font-semibold">QR</th>
                    <th className="px-4 py-2 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {advertisers.map((view) => (
                    <RosterRow key={view.id} view={view} knownCodes={knownCodeSet} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {summary.takenCategories.length > 0 && (
            <div className="mt-6 pt-5 border-t border-black/[0.06]">
              <p className={labelClass}>Categories locked</p>
              <div className="flex flex-wrap gap-2">
                {summary.takenCategories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-[#faf6f0] border border-black/[0.06] px-3 py-1 text-xs text-[#5c4f45]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="mb-6">
          <AdvertiserForm editing={editing} knownCodes={knownCodes} />
        </div>

        <section className="rounded-3xl bg-white border border-black/[0.06] shadow-lg shadow-black/[0.04] p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[#1a1210]">Interested list</h2>
          <p className="mt-1 mb-5 text-sm text-[#7a6a5d]">
            Businesses waiting on a slot or a category.
          </p>

          <ProspectList prospects={prospects} />

          <form
            action={saveProspectAction}
            className="mt-6 pt-6 border-t border-black/[0.06] grid sm:grid-cols-3 gap-4"
          >
            <Field label="Business" name="business" id="prospect-business" required />
            <Field label="Category wanted" name="category" id="prospect-category" />
            <Field label="Contact name" name="contactName" id="prospect-contact" />
            <Field label="Phone" name="phone" id="prospect-phone" type="tel" />
            <Field label="Email" name="email" id="prospect-email" type="email" />
            <Field
              label="Source"
              name="source"
              id="prospect-source"
              placeholder="Walk-in, referral, QR scan…"
            />
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="prospect-notes">
                Notes
              </label>
              <input id="prospect-notes" name="notes" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="prospect-status">
                Interest
              </label>
              <select id="prospect-status" name="status" defaultValue="new" className={inputClass}>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="hot">Hot</option>
                <option value="passed">Passed</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="rounded-xl bg-[#1a1210] text-white font-semibold px-6 py-3 hover:bg-black transition-colors"
              >
                Add to list
              </button>
            </div>
          </form>
        </section>

        <p className="mt-10 text-xs text-[#9a8b7d] max-w-2xl">
          End dates are calculated from each package term, in Houston time. QR codes are
          managed separately in the link registry — a code shown here in red exists on
          this record but not in the registry, so scanning it would fall through to the
          advertise page.
        </p>
      </div>
    </main>
  );
}
