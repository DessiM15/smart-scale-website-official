/**
 * The sales pipeline: who has asked about the screens and how far along they
 * are.
 *
 * Laid out as the three stages the work actually has, rather than one list
 * sorted by a status nobody can change. A lead arrives in New, moves to
 * Contacted the moment somebody speaks to them, and reaches Under review once
 * they have said yes and are waiting on a mockup, a signature and a payment.
 * Past that they stop being a prospect and become an advertiser, which happens
 * on the advertisers tab because that is where the record that makes it true
 * gets written.
 */

import {
  deleteProspectAction,
  logProspectUpdateAction,
  saveProspectAction,
  toggleProspectGateAction,
} from "../actions";
import {
  reviewComplete,
  stageOf,
  type Prospect,
  type ProspectStage,
  type ProspectStatus,
  type ProspectUpdate,
} from "@/lib/ads/roster";
import { tabHref } from "./types";
import {
  Card,
  Empty,
  Field,
  Note,
  Pill,
  btnPrimary,
  inputClass,
  labelClass,
  linkQuiet,
  selectClass,
  stamp,
  type Tone,
} from "./ui";

const STATUS: Record<ProspectStatus, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "neutral" },
  contacted: { label: "Contacted", tone: "warn" },
  hot: { label: "Hot", tone: "brand" },
  review: { label: "Under review", tone: "ok" },
  won: { label: "Advertiser", tone: "ok" },
  passed: { label: "Passed", tone: "neutral" },
};

const STAGES: Record<
  ProspectStage,
  { title: string; lede: string; empty: string }
> = {
  new: {
    title: "New prospects",
    lede: "They have asked about the screens and nobody has spoken to them yet.",
    empty:
      "Nothing new. Leads from the advertise page land here on their own, and you can add a walk-in below.",
  },
  contacted: {
    title: "Contacted",
    lede: "You have reached them. Log what they said and when to come back to them.",
    empty: "Nobody in conversation right now.",
  },
  review: {
    title: "Under review",
    lede: "They have agreed. Waiting on the mockup, the signature and the money.",
    empty:
      "Nobody at this stage. Move a prospect here once they have said yes and you are building their ad.",
  },
};

/** The three things standing between a yes and a client on the books. */
const GATES = [
  { key: "mockupApproved", label: "Mockup approved" },
  { key: "agreementSigned", label: "Agreement signed" },
  { key: "paymentReceived", label: "Payment received" },
] as const;

/** YYYY-MM-DD, written the way the rest of the tracker writes dates. */
function shortDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

function detailLine(p: Prospect): string {
  return (
    [
      p.category,
      p.contactName,
      p.phone,
      p.email,
      p.budget && `budget ${p.budget}`,
      p.campaign && `via ${p.campaign}`,
      p.source,
    ]
      .filter(Boolean)
      .join(" · ") || "no details"
  );
}

/* ------------------------------- the timeline ------------------------------ */

function Timeline({ log }: { log: ProspectUpdate[] }) {
  return (
    <ol className="space-y-2.5">
      {[...log].reverse().map((entry, i) => (
        <li key={`${entry.at}-${i}`} className="text-xs leading-relaxed">
          <span className="text-white/35">{stamp(entry.at)}</span>
          {entry.from && (
            <span className="ml-2">
              <Pill tone={STATUS[entry.to].tone}>
                {STATUS[entry.from].label} → {STATUS[entry.to].label}
              </Pill>
            </span>
          )}
          {entry.text && <span className="ml-2 text-white/70">{entry.text}</span>}
          {entry.followUp && (
            <span className="ml-2 text-white/35">
              (follow up {shortDate(entry.followUp)})
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------- one card -------------------------------- */

function ProspectCard({
  prospect,
  today,
}: {
  prospect: Prospect;
  today: string;
}) {
  const p = prospect;
  const log = p.log ?? [];
  const last = log[log.length - 1];
  const due = Boolean(p.followUpDate && p.followUpDate <= today);
  const stage = stageOf(p);
  const ready = reviewComplete(p);

  return (
    <li
      id={`prospect-${p.id}`}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 scroll-mt-32"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">{p.business}</span>
            {p.status === "hot" && <Pill tone="brand">Hot</Pill>}
            {p.followUpDate && (
              <Pill tone={due ? "bad" : "neutral"}>
                {due ? "Follow up due " : "Follow up "}
                {shortDate(p.followUpDate)}
              </Pill>
            )}
          </p>
          <p className="text-xs text-white/35 mt-1">{detailLine(p)}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {p.phone && (
            <a
              href={`tel:${p.phone.replace(/[^\d+]/g, "")}`}
              className="rounded-full border border-[#DC2626]/40 px-3 py-1 text-xs font-semibold text-[#f87171] hover:bg-[#DC2626] hover:text-white hover:border-transparent transition-colors"
            >
              Call
            </a>
          )}
          <form action={deleteProspectAction}>
            <input type="hidden" name="id" value={p.id} />
            <button type="submit" className={linkQuiet}>
              Remove
            </button>
          </form>
        </div>
      </div>

      {/* Everything typed in before this existed still lives in one note. */}
      {p.notes && (
        <p className="text-xs text-white/50 mt-2.5 whitespace-pre-line">{p.notes}</p>
      )}

      {last && (
        <p className="text-xs text-white/60 mt-2.5">
          <span className="text-white/30">{stamp(last.at)}</span>{" "}
          {last.text || `Moved to ${STATUS[last.to].label.toLowerCase()}.`}
        </p>
      )}

      {/* The review checklist. Only at the stage it means anything. */}
      {stage === "review" && (
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {GATES.map((gate) => {
            const on = Boolean(p[gate.key]);
            return (
              <form key={gate.key} action={toggleProspectGateAction}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="gate" value={gate.key} />
                <input type="hidden" name="on" value={on ? "0" : "1"} />
                <button
                  type="submit"
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    on
                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                      : "border-white/10 bg-white/[0.03] text-white/45 hover:text-white hover:border-white/25"
                  }`}
                >
                  <span aria-hidden>{on ? "✓" : "○"}</span>
                  {gate.label}
                </button>
              </form>
            );
          })}
          {ready && (
            <a
              href={`${tabHref("advertisers", { from: p.id })}#editor`}
              className="inline-flex items-center rounded-full bg-[#DC2626] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#b91c1c] transition-colors"
            >
              Sign them up
            </a>
          )}
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap gap-x-5 gap-y-2">
        <details className="group/update w-full">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden text-xs font-semibold text-white/45 hover:text-white transition-colors">
            <span className="group-open/update:hidden">Log an update</span>
            <span className="hidden group-open/update:inline">Close</span>
          </summary>
          <form
            action={logProspectUpdateAction}
            className="mt-3 grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end"
          >
            <input type="hidden" name="id" value={p.id} />
            <div>
              <label className={labelClass} htmlFor={`note-${p.id}`}>
                What happened
              </label>
              <input
                id={`note-${p.id}`}
                name="note"
                className={inputClass}
                placeholder="Spoke to the owner, wants to see a mockup…"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={`status-${p.id}`}>
                Move them to
              </label>
              <select
                id={`status-${p.id}`}
                name="status"
                defaultValue={p.status}
                className={selectClass}
              >
                <option value="new">New prospect</option>
                <option value="contacted">Contacted</option>
                <option value="hot">Contacted · hot</option>
                <option value="review">Under review</option>
                <option value="convert">Advertiser — sign them up</option>
                <option value="passed">Passed</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor={`followup-${p.id}`}>
                Follow up on
              </label>
              <input
                id={`followup-${p.id}`}
                name="followUp"
                type="date"
                defaultValue={p.followUpDate ?? ""}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" className={`${btnPrimary} px-5 py-2.5`}>
                Save update
              </button>
              <span className="ml-3 text-xs text-white/30">
                Choosing “Advertiser” opens their contract already filled in.
                Nothing changes here until you save it.
              </span>
            </div>
          </form>
        </details>

        <details className="group/edit w-full">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden text-xs font-semibold text-white/45 hover:text-white transition-colors">
            <span className="group-open/edit:hidden">Edit details</span>
            <span className="hidden group-open/edit:inline">Close</span>
          </summary>
          <form
            action={saveProspectAction}
            className="mt-3 grid sm:grid-cols-3 gap-3"
          >
            <input type="hidden" name="id" value={p.id} />
            <Field
              label="Business"
              name="business"
              id={`edit-business-${p.id}`}
              defaultValue={p.business}
              required
            />
            <Field
              label="Category wanted"
              name="category"
              id={`edit-category-${p.id}`}
              defaultValue={p.category}
            />
            <Field
              label="Contact name"
              name="contactName"
              id={`edit-contact-${p.id}`}
              defaultValue={p.contactName}
            />
            <Field
              label="Phone"
              name="phone"
              id={`edit-phone-${p.id}`}
              type="tel"
              defaultValue={p.phone}
            />
            <Field
              label="Email"
              name="email"
              id={`edit-email-${p.id}`}
              type="email"
              defaultValue={p.email}
            />
            <Field
              label="Budget"
              name="budget"
              id={`edit-budget-${p.id}`}
              defaultValue={p.budget ?? ""}
            />
            <Field
              label="Source"
              name="source"
              id={`edit-source-${p.id}`}
              defaultValue={p.source}
            />
            <Field
              label="Campaign"
              name="campaign"
              id={`edit-campaign-${p.id}`}
              defaultValue={p.campaign ?? ""}
              hint="Which flyer or drop sent them."
            />
            <div className="sm:col-span-3">
              <label className={labelClass} htmlFor={`edit-notes-${p.id}`}>
                Notes
              </label>
              {/* A textarea, not an input: leads arrive with their answers on
                  separate lines, and a single-line box flattens them into one
                  on the first save without ever saying so. */}
              <textarea
                id={`edit-notes-${p.id}`}
                name="notes"
                rows={3}
                defaultValue={p.notes}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
              <button type="submit" className={`${btnPrimary} px-5 py-2.5`}>
                Save details
              </button>
              <span className="text-xs text-white/30">
                Corrections only. Moving them along the pipeline is an update, so
                there is a record of it.
              </span>
            </div>
          </form>
        </details>

        {log.length > 0 && (
          <details className="group/log w-full">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden text-xs font-semibold text-white/45 hover:text-white transition-colors">
              <span className="group-open/log:hidden">
                History ({log.length})
              </span>
              <span className="hidden group-open/log:inline">Close history</span>
            </summary>
            <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3.5">
              <Timeline log={log} />
            </div>
          </details>
        )}
      </div>
    </li>
  );
}

/* -------------------------------- the stages ------------------------------- */

function Stage({
  stage,
  prospects,
  today,
}: {
  stage: ProspectStage;
  prospects: Prospect[];
  today: string;
}) {
  const copy = STAGES[stage];
  return (
    <Card
      title={`${copy.title}${prospects.length ? ` (${prospects.length})` : ""}`}
      lede={copy.lede}
      className="mb-5"
      surface={stage === "new" && prospects.length > 0 ? "warn" : "plain"}
    >
      {prospects.length === 0 ? (
        <Empty>{copy.empty}</Empty>
      ) : (
        <ul className="space-y-3">
          {prospects.map((p) => (
            <ProspectCard key={p.id} prospect={p} today={today} />
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Closed by default: done is done, but the record stays reachable. */
function Closed({
  title,
  lede,
  prospects,
}: {
  title: string;
  lede: string;
  prospects: Prospect[];
}) {
  if (prospects.length === 0) return null;
  return (
    <details className="group mb-5 rounded-3xl border border-white/[0.07] bg-[#131313] overflow-hidden">
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 sm:px-8 py-5 list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors">
        <span className="text-white font-semibold">
          {title} ({prospects.length})
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35 group-open:hidden">
          Open
        </span>
        <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-white/35 group-open:inline">
          Close
        </span>
      </summary>
      <div className="px-6 sm:px-8 pb-7 pt-5 border-t border-white/[0.06]">
        <p className="text-sm text-white/45 mb-4">{lede}</p>
        <ul className="divide-y divide-white/[0.06]">
          {prospects.map((p) => (
            <li
              key={p.id}
              id={`prospect-${p.id}`}
              className="py-3 flex flex-wrap items-center justify-between gap-3 scroll-mt-32"
            >
              <span className="text-sm">
                <span className="font-semibold text-white">{p.business}</span>
                <span className="text-white/35"> · {detailLine(p)}</span>
              </span>
              <span className="flex items-center gap-4">
                {p.advertiserId && (
                  <a
                    href={`/advertise/admin/client/${p.advertiserId}`}
                    className={linkQuiet}
                  >
                    Their profile
                  </a>
                )}
                {p.status === "passed" && (
                  <form action={logProspectUpdateAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value="contacted" />
                    <input
                      type="hidden"
                      name="note"
                      value="Put back on the list."
                    />
                    <button type="submit" className={linkQuiet}>
                      Put back on the list
                    </button>
                  </form>
                )}
                <form action={deleteProspectAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className={linkQuiet}>
                    Remove
                  </button>
                </form>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

export function ProspectsTab({
  prospects,
  today,
}: {
  prospects: Prospect[];
  today: string;
}) {
  const byStage = (stage: ProspectStage) =>
    prospects.filter((p) => stageOf(p) === stage);

  const open = prospects.filter((p) => stageOf(p) !== null);
  const won = prospects.filter((p) => p.status === "won");
  const passed = prospects.filter((p) => p.status === "passed");

  return (
    <>
      {open.length === 0 && won.length === 0 && passed.length === 0 && (
        <div className="mb-5">
          <Note>
            <p className="text-sm text-white/70">
              Nobody on the list yet. Leads from the advertise page arrive here on
              their own; add a walk-in or a referral at the bottom of this page.
            </p>
          </Note>
        </div>
      )}

      <Stage stage="new" prospects={byStage("new")} today={today} />
      <Stage stage="contacted" prospects={byStage("contacted")} today={today} />
      <Stage stage="review" prospects={byStage("review")} today={today} />

      <Closed
        title="Signed up"
        lede="They became advertisers. Kept so you can see where a client came from."
        prospects={won}
      />
      <Closed
        title="Passed"
        lede="Not going anywhere for now. They come back to the top of the list if they fill the form in again."
        prospects={passed}
      />

      <details
        id="prospect-add"
        open={open.length === 0}
        className="group rounded-3xl border border-white/[0.07] bg-[#131313] overflow-hidden scroll-mt-32"
      >
        <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 sm:px-8 py-5 list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors">
          <span className="text-white font-semibold">Add to the list</span>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35 group-open:hidden">
            Open
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-white/35 group-open:inline">
            Close
          </span>
        </summary>

        <div className="px-6 sm:px-8 pb-8 pt-6 border-t border-white/[0.06]">
          <form action={saveProspectAction} className="grid sm:grid-cols-3 gap-4">
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
                Stage
              </label>
              <select
                id="prospect-status"
                name="status"
                defaultValue="new"
                className={selectClass}
              >
                <option value="new">New prospect</option>
                <option value="contacted">Contacted</option>
                <option value="hot">Contacted · hot</option>
                <option value="review">Under review</option>
                <option value="passed">Passed</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <button type="submit" className={`${btnPrimary} px-6 py-3`}>
                Add to list
              </button>
            </div>
          </form>
        </div>
      </details>
    </>
  );
}
