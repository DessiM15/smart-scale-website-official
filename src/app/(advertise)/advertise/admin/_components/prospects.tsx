/**
 * The sales pipeline: who has asked about the screens and how far along they
 * are.
 *
 * Three stages, the way the work actually goes. A lead arrives in New, moves
 * to Contacted the moment somebody speaks to them, and reaches Under review
 * once they have said yes and are waiting on a mockup, a signature and a
 * payment. Past that they become an advertiser, which happens on the
 * advertisers page because that is where the record that makes it true gets
 * written.
 */

import {
  completeFollowUpAction,
  deleteProspectAction,
  logProspectUpdateAction,
  rescheduleFollowUpAction,
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
import { SubmitButton } from "./submit-button";
import { ADMIN, clientHref, tabHref } from "./types";
import {
  Badge,
  Disclosure,
  Empty,
  Field,
  FilterPill,
  Note,
  bebas,
  btnDanger,
  btnGhost,
  btnPrimary,
  btnSm,
  btnSolid,
  cardClass,
  inputClass,
  labelClass,
  linkQuiet,
  selectClass,
  serif,
  stamp,
  type Tone,
} from "./ui";

const PAGE = `${ADMIN}/pipeline`;

const STATUS: Record<ProspectStatus, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "bad" },
  contacted: { label: "Contacted", tone: "warn" },
  hot: { label: "Hot", tone: "brand" },
  review: { label: "Under review", tone: "ok" },
  won: { label: "Advertiser", tone: "ok" },
  passed: { label: "Passed", tone: "neutral" },
};

/** Where a stage sits on the three-segment bar under the picker. */
const STAGE_INDEX: Record<ProspectStage, number> = { new: 0, contacted: 1, review: 2 };

const STAGES: Record<ProspectStage, { title: string; empty: string }> = {
  new: {
    title: "New prospects",
    empty: "Nothing new. Leads from the advertise page land here on their own, and you can add a walk-in below.",
  },
  contacted: { title: "Contacted", empty: "Nobody in conversation right now." },
  review: {
    title: "Under review",
    empty: "Nobody at this stage. Move a prospect here once they have said yes and you are building their ad.",
  },
};

const GATES = [
  { key: "mockupApproved", label: "Mockup approved" },
  { key: "agreementSigned", label: "Agreement signed" },
  { key: "paymentReceived", label: "Payment received" },
] as const;

function shortDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

const tel = (phone: string) => phone.replace(/[^\d+]/g, "");

const MailIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <rect x="3" y="5" width="18" height="14" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z" />
  </svg>
);
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12l5 5L20 7" />
  </svg>
);

/* ------------------------------- the timeline ------------------------------ */

function Timeline({ log }: { log: ProspectUpdate[] }) {
  return (
    <ol className="flex flex-col gap-2.5">
      {[...log].reverse().map((entry, i) => (
        <li key={`${entry.at}-${i}`} className="text-xs leading-relaxed flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-white/35 tabular-nums">{stamp(entry.at)}</span>
          {entry.who && <span className="text-white/50">{entry.who}</span>}
          {entry.from && (
            <Badge tone={STATUS[entry.to].tone} dot={false}>
              {STATUS[entry.from].label} → {STATUS[entry.to].label}
            </Badge>
          )}
          {entry.text && <span className="text-white/75">{entry.text}</span>}
          {entry.followUp && <span className="text-white/35">(follow up {shortDate(entry.followUp)})</span>}
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------- one card -------------------------------- */

function StagePicker({ p }: { p: Prospect }) {
  const stage = stageOf(p);
  const index = stage ? STAGE_INDEX[stage] : 3;
  return (
    <form action={logProspectUpdateAction} className="flex flex-col gap-2 w-full sm:w-44 shrink-0">
      <input type="hidden" name="id" value={p.id} />
      <input type="hidden" name="returnTo" value={PAGE} />
      <label className="sr-only" htmlFor={`stage-${p.id}`}>
        Stage
      </label>
      <select id={`stage-${p.id}`} name="status" defaultValue={p.status} className={`${selectClass} py-2.5`}>
        <option value="new">New prospect</option>
        <option value="contacted">Contacted</option>
        <option value="hot">Contacted · hot</option>
        <option value="review">Under review</option>
        <option value="convert">Advertiser · sign them up</option>
        <option value="passed">Passed</option>
      </select>
      <div className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-[3px] flex-1 ${i <= index ? "bg-[#DC2626]" : "bg-white/10"}`} />
        ))}
      </div>
      <SubmitButton className={`${btnGhost} ${btnSm} w-full`} pendingLabel="Moving">
        Move
      </SubmitButton>
    </form>
  );
}

function FollowUpLine({ p, today }: { p: Prospect; today: string }) {
  if (!p.followUpDate) return null;
  const due = p.followUpDate <= today;
  const overdue = p.followUpDate < today;
  const last = p.log?.[p.log.length - 1];
  return (
    <div className="mt-3 pt-3.5 border-t border-white/[0.07] flex flex-col sm:flex-row sm:items-center gap-3">
      <Badge tone={overdue ? "bad" : due ? "warn" : "neutral"}>Follow-up</Badge>
      <span className="text-sm text-white">
        {overdue ? `Overdue since ${shortDate(p.followUpDate)}` : due ? "Due today" : shortDate(p.followUpDate)}
        {last?.who && <span className="text-white/40"> · {last.who}</span>}
      </span>
      <div className="sm:ml-auto flex flex-wrap items-center gap-2">
        <details className="relative">
          <summary className={`${btnGhost} ${btnSm} list-none cursor-pointer [&::-webkit-details-marker]:hidden`}>Reschedule</summary>
          <form action={rescheduleFollowUpAction} className={`${cardClass} absolute right-0 z-20 mt-2 w-60 p-3 bg-[#141414] flex flex-col gap-2 shadow-2xl shadow-black/60`}>
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="returnTo" value={PAGE} />
            <label className={labelClass} htmlFor={`resched-${p.id}`}>New date</label>
            <input id={`resched-${p.id}`} name="followUp" type="date" required className={inputClass} />
            <SubmitButton className={`${btnSolid} ${btnSm}`} pendingLabel="Moving">
              Move it
            </SubmitButton>
          </form>
        </details>
        <form action={completeFollowUpAction}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="returnTo" value={PAGE} />
          <button type="submit" className={`${btnPrimary} ${btnSm}`}>
            <CheckIcon /> Done
          </button>
        </form>
      </div>
    </div>
  );
}

function ProspectCard({ prospect, today }: { prospect: Prospect; today: string }) {
  const p = prospect;
  const log = p.log ?? [];
  const last = log[log.length - 1];
  const stage = stageOf(p);
  const ready = reviewComplete(p);
  const touched = last?.who;

  return (
    <li id={`prospect-${p.id}`} className={`${cardClass} p-5 sm:p-6 scroll-mt-28`}>
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        <div className="flex-1 min-w-0 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className={`${serif} text-[22px] leading-none text-white`}>{p.business}</span>
            {p.category && <Badge dot={false}>{p.category}</Badge>}
            {p.status === "hot" && <Badge tone="brand" dot={false}>Hot</Badge>}
            <span className="text-xs text-white/40">
              {stamp(p.addedAt)}
              {p.source ? ` · ${p.source}` : ""}
              {p.campaign ? ` · flyer: ${p.campaign}` : ""}
            </span>
            {touched && <Badge dot={false} className="!text-white/50 !border-white/[0.08]">Last touched by {touched}</Badge>}
          </div>

          {(p.notes || last?.text) && (
            <p className="text-sm text-white/65 leading-relaxed whitespace-pre-line max-w-2xl">
              {last?.text ? (
                <>
                  <span className="text-white/35">{stamp(last.at)} · </span>
                  {last.text}
                </>
              ) : (
                p.notes
              )}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-white/55">
            {p.contactName && <span>{p.contactName}</span>}
            {p.email && (
              <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1.5 hover:text-white">
                <MailIcon /> {p.email}
              </a>
            )}
            {p.phone && (
              <a href={`tel:${tel(p.phone)}`} className="inline-flex items-center gap-1.5 hover:text-white">
                <PhoneIcon /> {p.phone}
              </a>
            )}
            {p.budget && <span>budget {p.budget}</span>}
          </div>

          {stage === "review" && (
            <div className="mt-1 pt-3.5 border-t border-white/[0.07] flex flex-wrap items-center gap-x-6 gap-y-2.5">
              {GATES.map((gate) => {
                const on = Boolean(p[gate.key]);
                return (
                  <form key={gate.key} action={toggleProspectGateAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="gate" value={gate.key} />
                    <input type="hidden" name="on" value={on ? "0" : "1"} />
                    <input type="hidden" name="returnTo" value={PAGE} />
                    <button type="submit" className={`inline-flex items-center gap-2.5 text-sm ${on ? "text-white" : "text-white/50 hover:text-white"}`}>
                      <span
                        className={`inline-flex h-4 w-4 items-center justify-center border ${on ? "bg-[#7FBF8E] border-[#7FBF8E] text-[#0A0A0A]" : "border-white/25"}`}
                        aria-hidden
                      >
                        {on && <CheckIcon />}
                      </span>
                      {gate.label}
                    </button>
                  </form>
                );
              })}
              {ready ? (
                <a href={`${tabHref("advertisers", { from: p.id })}#editor`} className={`${btnSolid} ${btnSm} sm:ml-auto`}>
                  Sign them up
                </a>
              ) : (
                <span className="text-xs text-white/35 sm:ml-auto">Tick all three and they can go on the screens.</span>
              )}
            </div>
          )}

          <FollowUpLine p={p} today={today} />
        </div>

        <StagePicker p={p} />
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.07] flex flex-wrap gap-x-5 gap-y-2 items-center">
        <details className="group/update w-full">
          <summary className={`${bebas} cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[11px] tracking-[0.22em] text-white/45 hover:text-white transition-colors`}>
            <span className="group-open/update:hidden">Log an update</span>
            <span className="hidden group-open/update:inline">Close</span>
          </summary>
          <form action={logProspectUpdateAction} className="mt-4 grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="returnTo" value={PAGE} />
            <div>
              <label className={labelClass} htmlFor={`note-${p.id}`}>What happened</label>
              <input id={`note-${p.id}`} name="note" className={inputClass} placeholder="Spoke to the owner, wants to see a mockup" />
            </div>
            <div>
              <label className={labelClass} htmlFor={`followup-${p.id}`}>Follow up on</label>
              {/* Blank by default. Pre-filling the old date is how a follow-up
                  used to re-save itself and never clear. */}
              <input id={`followup-${p.id}`} name="followUp" type="date" className={inputClass} />
            </div>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
              <SubmitButton className={`${btnPrimary} ${btnSm}`} pendingLabel="Saving">
                Save update
              </SubmitButton>
              <span className="text-xs text-white/30">Leave the date blank to keep the follow-up as it is. Moving them along is the picker on the right.</span>
            </div>
          </form>
        </details>

        <details className="group/edit w-full">
          <summary className={`${bebas} cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[11px] tracking-[0.22em] text-white/45 hover:text-white transition-colors`}>
            <span className="group-open/edit:hidden">Edit details</span>
            <span className="hidden group-open/edit:inline">Close</span>
          </summary>
          <form action={saveProspectAction} className="mt-4 grid sm:grid-cols-3 gap-3">
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="returnTo" value={PAGE} />
            <Field label="Business" name="business" id={`edit-business-${p.id}`} defaultValue={p.business} required />
            <Field label="Category wanted" name="category" id={`edit-category-${p.id}`} defaultValue={p.category} />
            <Field label="Contact name" name="contactName" id={`edit-contact-${p.id}`} defaultValue={p.contactName} />
            <Field label="Phone" name="phone" id={`edit-phone-${p.id}`} type="tel" defaultValue={p.phone} />
            <Field label="Email" name="email" id={`edit-email-${p.id}`} type="email" defaultValue={p.email} />
            <Field label="Budget" name="budget" id={`edit-budget-${p.id}`} defaultValue={p.budget ?? ""} />
            <Field label="Source" name="source" id={`edit-source-${p.id}`} defaultValue={p.source} />
            <Field label="Campaign" name="campaign" id={`edit-campaign-${p.id}`} defaultValue={p.campaign ?? ""} hint="Which flyer or drop sent them." />
            <div className="sm:col-span-3">
              <label className={labelClass} htmlFor={`edit-notes-${p.id}`}>Notes</label>
              <textarea id={`edit-notes-${p.id}`} name="notes" rows={3} defaultValue={p.notes} className={inputClass} />
            </div>
            <div className="sm:col-span-3 flex flex-wrap items-center gap-4">
              <SubmitButton className={`${btnPrimary} ${btnSm}`} pendingLabel="Saving">
                Save details
              </SubmitButton>
              <span className="text-xs text-white/30">Corrections only. Moving them along the pipeline is an update, so there is a record of it.</span>
            </div>
          </form>
        </details>

        {log.length > 0 && (
          <details className="group/log w-full">
            <summary className={`${bebas} cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[11px] tracking-[0.22em] text-white/45 hover:text-white transition-colors`}>
              <span className="group-open/log:hidden">History ({log.length})</span>
              <span className="hidden group-open/log:inline">Close history</span>
            </summary>
            <div className="mt-4 border border-white/[0.06] bg-black/20 px-4 py-3.5">
              <Timeline log={log} />
            </div>
          </details>
        )}

        <details className="group/remove ml-auto">
          <summary className={`${bebas} cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[11px] tracking-[0.22em] text-white/30 hover:text-[#f87171] transition-colors`}>
            Remove
          </summary>
          <form action={deleteProspectAction} className="mt-3 flex items-center gap-3">
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="returnTo" value={PAGE} />
            <span className="text-xs text-white/50">Remove {p.business} from the pipeline for good?</span>
            <button type="submit" className={`${btnDanger} ${btnSm}`}>
              Yes, remove
            </button>
          </form>
        </details>
      </div>
    </li>
  );
}

/* -------------------------------- the stages ------------------------------- */

function Stage({ stage, prospects, today }: { stage: ProspectStage; prospects: Prospect[]; today: string }) {
  const copy = STAGES[stage];
  return (
    <section id={`stage-${stage}`} className="mb-8 scroll-mt-28">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <h2 className={labelClass + " !mb-0 !text-[#DC2626]"}>
          {copy.title}
          {prospects.length ? ` · ${prospects.length}` : ""}
        </h2>
      </div>
      {prospects.length === 0 ? (
        <Empty>{copy.empty}</Empty>
      ) : (
        <ul className="flex flex-col gap-4">
          {prospects.map((p) => (
            <ProspectCard key={p.id} prospect={p} today={today} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Closed({ title, lede, prospects }: { title: string; lede: string; prospects: Prospect[] }) {
  if (prospects.length === 0) return null;
  return (
    <div className="mb-5">
      <Disclosure summary={<span>{title} · {prospects.length}</span>}>
        <p className="text-sm text-white/45 my-4">{lede}</p>
        <ul className="divide-y divide-white/[0.06]">
          {prospects.map((p) => (
            <li key={p.id} id={`prospect-${p.id}`} className="py-3 flex flex-wrap items-center justify-between gap-3 scroll-mt-28">
              <span className="text-sm">
                <span className="text-white">{p.business}</span>
                <span className="text-white/35"> · {[p.category, p.contactName, p.phone].filter(Boolean).join(" · ") || "no details"}</span>
              </span>
              <span className="flex items-center gap-4">
                {p.advertiserId && (
                  <a href={clientHref(p.advertiserId)} className={linkQuiet}>
                    Their record
                  </a>
                )}
                {p.status === "passed" && (
                  <form action={logProspectUpdateAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value="contacted" />
                    <input type="hidden" name="note" value="Put back on the list." />
                    <input type="hidden" name="returnTo" value={PAGE} />
                    <button type="submit" className={linkQuiet}>
                      Put back on the list
                    </button>
                  </form>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Disclosure>
    </div>
  );
}

export function AddProspect({ open }: { open: boolean }) {
  return (
    <Disclosure id="prospect-add" open={open} summary={<span>Add to the list</span>} hint="a walk-in, a referral, a cold call">
      <form action={saveProspectAction} className="grid sm:grid-cols-3 gap-4 pt-4">
        <input type="hidden" name="returnTo" value={PAGE} />
        <Field label="Business" name="business" id="prospect-business" required />
        <Field label="Category wanted" name="category" id="prospect-category" />
        <Field label="Contact name" name="contactName" id="prospect-contact" />
        <Field label="Phone" name="phone" id="prospect-phone" type="tel" />
        <Field label="Email" name="email" id="prospect-email" type="email" />
        <Field label="Source" name="source" id="prospect-source" placeholder="Walk-in, referral, QR scan" />
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="prospect-notes">Notes</label>
          <input id="prospect-notes" name="notes" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="prospect-status">Stage</label>
          <select id="prospect-status" name="status" defaultValue="new" className={selectClass}>
            <option value="new">New prospect</option>
            <option value="contacted">Contacted</option>
            <option value="hot">Contacted · hot</option>
            <option value="review">Under review</option>
            <option value="passed">Passed</option>
          </select>
        </div>
        <div className="sm:col-span-3">
          <SubmitButton className={btnPrimary} pendingLabel="Adding">
            Add to list
          </SubmitButton>
        </div>
      </form>
    </Disclosure>
  );
}

export type PipelineFilter = "all" | ProspectStage | "won" | "passed";

export function PipelineFilters({ prospects, filter }: { prospects: Prospect[]; filter: PipelineFilter }) {
  const count = (f: PipelineFilter) =>
    f === "all"
      ? prospects.filter((p) => stageOf(p) !== null).length
      : f === "won" || f === "passed"
        ? prospects.filter((p) => p.status === f).length
        : prospects.filter((p) => stageOf(p) === f).length;
  const href = (f: PipelineFilter) => (f === "all" ? PAGE : `${PAGE}?show=${f}`);
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <FilterPill href={href("all")} on={filter === "all"} count={count("all")}>All open</FilterPill>
      <FilterPill href={href("new")} on={filter === "new"} count={count("new")}>New</FilterPill>
      <FilterPill href={href("contacted")} on={filter === "contacted"} count={count("contacted")}>Contacted</FilterPill>
      <FilterPill href={href("review")} on={filter === "review"} count={count("review")}>Under review</FilterPill>
      <span className="hidden sm:block w-px h-6 bg-white/10 mx-1" />
      <FilterPill href={href("won")} on={filter === "won"} count={count("won")}>Won</FilterPill>
      <FilterPill href={href("passed")} on={filter === "passed"} count={count("passed")}>Passed</FilterPill>
    </div>
  );
}

export function ProspectsTab({ prospects, today, filter = "all" }: { prospects: Prospect[]; today: string; filter?: PipelineFilter }) {
  const byStage = (stage: ProspectStage) => prospects.filter((p) => stageOf(p) === stage);
  const open = prospects.filter((p) => stageOf(p) !== null);
  const won = prospects.filter((p) => p.status === "won");
  const passed = prospects.filter((p) => p.status === "passed");
  const stages: ProspectStage[] = filter === "all" ? ["new", "contacted", "review"] : filter === "won" || filter === "passed" ? [] : [filter];

  return (
    <>
      {prospects.length === 0 && (
        <div className="mb-5">
          <Note>
            <p className="text-sm text-white/70">
              Nobody on the list yet. Leads from the advertise page arrive here on their own; add a walk-in or a referral below.
            </p>
          </Note>
        </div>
      )}

      {stages.map((stage) => (
        <Stage key={stage} stage={stage} prospects={byStage(stage)} today={today} />
      ))}

      {(filter === "all" || filter === "won") && (
        <Closed title="Signed up" lede="They became advertisers. Kept so you can see where a client came from." prospects={won} />
      )}
      {(filter === "all" || filter === "passed") && (
        <Closed
          title="Passed"
          lede="Not going anywhere for now. They come back to the top of the list if they fill the form in again."
          prospects={passed}
        />
      )}

      <AddProspect open={open.length === 0} />
    </>
  );
}
