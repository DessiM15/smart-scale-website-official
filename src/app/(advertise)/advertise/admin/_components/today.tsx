/**
 * The Today page: one list of everything due, with Done on every row it makes
 * sense on, the Board beside it, and a strip of what got done today.
 */

import {
  addTaskAction,
  clearResponseAction,
  completeFollowUpAction,
  completeTaskAction,
  markDoneAction,
  markPaidAction,
} from "../actions";
import type { Board, BoardSlot, SlotState } from "@/lib/ads/board";
import type { HistoryEntry, TodayAction, TodayItem, TodayKind } from "@/lib/ads/tasks";
import { formatDate, type AdvertiserView } from "@/lib/ads/roster";
import { PAYMENT_METHODS } from "@/lib/ads/payments";
import { SubmitButton } from "./submit-button";
import { ADMIN, clientHref } from "./types";
import {
  Badge,
  Card,
  Disclosure,
  Empty,
  Field,
  bebas,
  btnGhost,
  btnPrimary,
  btnSm,
  btnSolid,
  cardClass,
  clock,
  inputClass,
  labelClass,
  linkLine,
  numClass,
  selectClass,
  serif,
  type Tone,
} from "./ui";

const KIND: Record<TodayKind, { label: string; tone: Tone }> = {
  lead: { label: "Lead", tone: "bad" },
  reply: { label: "Reply", tone: "bad" },
  payment: { label: "Payment", tone: "bad" },
  followup: { label: "Follow-up", tone: "warn" },
  renewal: { label: "Renewal", tone: "warn" },
  paperwork: { label: "Paperwork", tone: "neutral" },
  task: { label: "Task", tone: "neutral" },
  report: { label: "Report", tone: "neutral" },
};

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12l5 5L20 7" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z" />
  </svg>
);

/* --------------------------------- actions -------------------------------- */

function ItemActions({ item, returnTo }: { item: TodayItem; returnTo: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      {item.actions.map((a, i) => (
        <ItemAction key={i} action={a} item={item} returnTo={returnTo} />
      ))}
    </div>
  );
}

function ItemAction({ action, item, returnTo }: { action: TodayAction; item: TodayItem; returnTo: string }) {
  switch (action.type) {
    case "call":
      return (
        <a href={`tel:${action.phone}`} className={`${btnGhost} ${btnSm}`}>
          <PhoneIcon /> Call
        </a>
      );
    case "link":
      return (
        <a href={action.href} className={`${item.kind === "lead" ? btnSolid : btnGhost} ${btnSm}`}>
          {action.label}
        </a>
      );
    case "done": {
      // A follow-up's Done clears the date on the prospect; everything else
      // is a marker keyed to the thing it dismisses.
      if (item.kind === "followup") {
        const prospectId = action.key.split(":")[1];
        return (
          <form action={completeFollowUpAction}>
            <input type="hidden" name="id" value={prospectId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button type="submit" className={`${btnPrimary} ${btnSm}`}>
              <CheckIcon /> Done
            </button>
          </form>
        );
      }
      return (
        <form action={markDoneAction}>
          <input type="hidden" name="key" value={action.key} />
          <input type="hidden" name="title" value={item.title} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button type="submit" className={`${btnPrimary} ${btnSm}`}>
            <CheckIcon /> Done
          </button>
        </form>
      );
    }
    case "completeTask":
      return (
        <form action={completeTaskAction}>
          <input type="hidden" name="id" value={action.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button type="submit" className={`${btnPrimary} ${btnSm}`}>
            <CheckIcon /> Done
          </button>
        </form>
      );
    case "clearReply":
      return (
        <form action={clearResponseAction}>
          <input type="hidden" name="advertiserId" value={action.advertiserId} />
          <input type="hidden" name="endDate" value={action.endDate} />
          <input type="hidden" name="business" value={item.title} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button type="submit" className={`${btnPrimary} ${btnSm}`}>
            <CheckIcon /> Handled
          </button>
        </form>
      );
    case "markPaid":
      return <MarkPaid advertiserId={action.advertiserId} period={action.period} amount={action.amount} returnTo={returnTo} />;
  }
}

/**
 * Mark paid, with the method asked for in place. Stripe payments will one day
 * mark themselves; until then this is the button, and it wants to know how.
 */
export function MarkPaid({
  advertiserId,
  period,
  amount,
  returnTo,
  compact = true,
}: {
  advertiserId: string;
  period: string;
  amount: number;
  returnTo: string;
  compact?: boolean;
}) {
  return (
    <details className="relative">
      <summary className={`${btnGhost} ${compact ? btnSm : ""} list-none cursor-pointer [&::-webkit-details-marker]:hidden`}>
        Mark paid
      </summary>
      <form
        action={markPaidAction}
        className={`${cardClass} absolute right-0 z-20 mt-2 w-72 p-4 flex flex-col gap-3 bg-[#141414] shadow-2xl shadow-black/60`}
      >
        <input type="hidden" name="advertiserId" value={advertiserId} />
        <input type="hidden" name="period" value={period} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor={`amt-${advertiserId}-${period}`}>Amount</label>
            <input id={`amt-${advertiserId}-${period}`} name="amount" inputMode="decimal" defaultValue={String(amount)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor={`how-${advertiserId}-${period}`}>How</label>
            <select id={`how-${advertiserId}-${period}`} name="method" className={selectClass} defaultValue="stripe">
              {PAYMENT_METHODS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor={`on-${advertiserId}-${period}`}>Arrived on</label>
          <input id={`on-${advertiserId}-${period}`} name="receivedOn" type="date" className={inputClass} />
          <p className="mt-1 text-[11px] text-white/30">Leave blank for today.</p>
        </div>
        <SubmitButton className={`${btnSolid} ${btnSm} w-full`} pendingLabel="Recording">
          Record it
        </SubmitButton>
      </form>
    </details>
  );
}

/* --------------------------------- the list -------------------------------- */

function TodayRow({ item, returnTo }: { item: TodayItem; returnTo: string }) {
  const kind = KIND[item.kind];
  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 py-4 border-b border-white/[0.06] last:border-b-0">
      <div className="sm:w-28 shrink-0">
        <Badge tone={item.tone === "bad" ? "bad" : item.tone === "warn" ? "warn" : kind.tone}>{kind.label}</Badge>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] text-white leading-snug">{item.title}</p>
        <p className="text-xs text-white/45 mt-0.5 leading-snug">{item.detail}</p>
      </div>
      <ItemActions item={item} returnTo={returnTo} />
    </li>
  );
}

export function TodayList({ items, returnTo }: { items: TodayItem[]; returnTo: string }) {
  return (
    <Card
      title={`Today · ${items.length} ${items.length === 1 ? "thing" : "things"}`}
      action={
        <a href={`${ADMIN}/history`} className={linkLine}>
          History
        </a>
      }
      padding="px-5 sm:px-6 pt-5 pb-2"
    >
      {items.length === 0 ? (
        <div className="pb-4">
          <Empty>Nothing needs you right now. New leads, follow-ups, renewals, paperwork and late payments land here as they come due.</Empty>
        </div>
      ) : (
        <ul>
          {items.map((item) => (
            <TodayRow key={item.key} item={item} returnTo={returnTo} />
          ))}
        </ul>
      )}
      <AddTask returnTo={returnTo} />
    </Card>
  );
}

function AddTask({ returnTo }: { returnTo: string }) {
  return (
    <div className="pt-3 pb-3">
      <Disclosure id="add-task" summary={<span className="text-white/60">Add something to the list</span>} hint="a call, an errand, a reminder">
        <form action={addTaskAction} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end pt-3">
          <input type="hidden" name="returnTo" value={returnTo} />
          <Field label="What" name="title" id="task-title" placeholder="Print the new flyers" required />
          <Field label="When" name="dueDate" id="task-due" type="date" hint="Blank means today." />
          <SubmitButton className={`${btnPrimary}`} pendingLabel="Adding">
            Add
          </SubmitButton>
          <div className="sm:col-span-3">
            <Field label="Details" name="detail" id="task-detail" placeholder="Anything the other one of you should know" />
          </div>
        </form>
      </Disclosure>
    </div>
  );
}

/* --------------------------------- the board ------------------------------- */

const SLOT_STYLE: Record<SlotState, { bg: string; fg: string; label: string }> = {
  active: { bg: "bg-white/[0.06]", fg: "text-white", label: "Active" },
  expiring: { bg: "bg-[#E0B36A]/[0.14]", fg: "text-[#E0B36A]", label: "Expiring" },
  pending: { bg: "bg-[#DC2626]/[0.12]", fg: "text-[#f87171]", label: "Pending" },
  house: { bg: "bg-white/[0.03]", fg: "text-white/60", label: "House" },
  open: { bg: "bg-transparent", fg: "text-white/30", label: "Open" },
};

function Slot({ slot }: { slot: BoardSlot }) {
  const style = SLOT_STYLE[slot.state];
  const inner = (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <span className={`${numClass} ${style.fg} text-xl leading-none`}>{String(slot.number).padStart(2, "0")}</span>
        <span className={`${bebas} text-[9px] tracking-[0.2em] ${style.fg} opacity-85`}>
          {slot.artworkPending && slot.state !== "pending" ? "No art" : style.label}
        </span>
      </div>
      <div className="min-w-0">
        <p className={`text-xs truncate ${slot.state === "open" ? "text-white/30" : style.fg}`}>{slot.name}</p>
        <p className="text-[10px] text-white/40 truncate">{slot.detail}</p>
      </div>
    </>
  );
  const className = `${style.bg} flex flex-col justify-between gap-2.5 h-24 px-3.5 py-3 transition-colors hover:bg-white/[0.09]`;
  if (slot.advertiserId) {
    return (
      <a href={clientHref(slot.advertiserId)} className={className}>
        {inner}
      </a>
    );
  }
  if (slot.waitingProspectId) {
    return (
      <a href={`${ADMIN}/pipeline#prospect-${slot.waitingProspectId}`} className={className}>
        {inner}
      </a>
    );
  }
  return <div className={className}>{inner}</div>;
}

export function TheBoard({ board }: { board: Board }) {
  return (
    <Card
      title={`The board · ${board.venue.slides} slides, ${board.venue.sellable} for sale`}
      action={
        <a href={`${ADMIN}/advertisers`} className={linkLine}>
          Advertisers
        </a>
      }
      padding="px-5 sm:px-6 pt-5 pb-0"
      className="overflow-hidden"
    >
      <div className="-mx-5 sm:-mx-6 grid grid-cols-3 gap-px bg-white/[0.08] border-y border-white/[0.08]">
        {board.slots.map((slot) => (
          <Slot key={slot.number} slot={slot} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 py-3.5">
        {(["active", "expiring", "pending", "house", "open"] as SlotState[]).map((s) => (
          <span key={s} className={`${bebas} text-[10px] tracking-[0.22em] ${SLOT_STYLE[s].fg}`}>
            ■ {SLOT_STYLE[s].label}
            <span className="text-white/35 ml-1.5 font-sans tracking-normal">{board.counts[s]}</span>
          </span>
        ))}
      </div>
    </Card>
  );
}

/* -------------------------------- expiring -------------------------------- */

export function ExpiringSoon({ items }: { items: AdvertiserView[] }) {
  return (
    <Card title="Expiring soon" padding="px-5 sm:px-6 pt-5 pb-3">
      {items.length === 0 ? (
        <div className="pb-3">
          <Empty>No term ends in the next sixty days.</Empty>
        </div>
      ) : (
        <ul>
          {items.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 py-3 border-b border-white/[0.06] last:border-b-0">
              <a href={clientHref(v.id)} className="min-w-0 group">
                <p className="text-sm text-white group-hover:text-[#f87171] transition-colors truncate">{v.business}</p>
                <p className="text-xs text-white/40 truncate">
                  {formatDate(v.endDate)} · {v.planName}
                  {v.category ? ` · ${v.category}` : ""}
                </p>
              </a>
              <span className={`${numClass} text-xl leading-none ${v.overdue ? "text-[#f87171]" : v.daysRemaining <= 30 ? "text-[#E0B36A]" : "text-white"}`}>
                {v.overdue ? `${Math.abs(v.daysRemaining)}d over` : `${v.daysRemaining}d`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* -------------------------------- done today ------------------------------- */

export function DoneToday({ entries }: { entries: HistoryEntry[] }) {
  return (
    <div className={`${cardClass} flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 px-5 sm:px-6 py-4`}>
      <span className={labelClass + " !mb-0 shrink-0"}>Done today</span>
      {entries.length === 0 ? (
        <span className="text-xs text-white/35">Nothing yet. Done items show up here with a time and a name.</span>
      ) : (
        <ul className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-white/55 min-w-0">
          {entries.slice(0, 4).map((e, i) => (
            <li key={`${e.at}-${i}`} className="truncate max-w-full">
              <span className="text-white">{clock(e.at)}</span>
              {e.who ? ` · ${e.who}` : ""} · {e.text}
            </li>
          ))}
        </ul>
      )}
      <a href={`${ADMIN}/history`} className={`${linkLine} sm:ml-auto shrink-0`}>
        Full history
      </a>
    </div>
  );
}

/** A quiet line of what the AI made of the morning, when it has something to say. */
export function BriefingLine({ text }: { text: string }) {
  if (!text) return null;
  return <p className={`${serif} text-xl sm:text-2xl text-white/80 leading-snug max-w-3xl -mt-3 mb-8`}>{text}</p>;
}
