/**
 * The Today list, and what happens when something on it is done.
 *
 * Most of what is due on a given morning is not a record anyone typed: a term
 * winding down, a lead that arrived overnight, a payment that has not landed.
 * Those are computed from the roster. What this module adds is the part that
 * was missing: a way to say "handled" that sticks, a dated history of who
 * handled what, and a place for the odd task that belongs to nobody's record
 * ("print the new flyers").
 *
 * Done markers are keyed by the thing they dismiss, so a renewal marked done
 * at 30 days out stays done for that term and comes back when the next term
 * ends, and a follow-up marked done clears the date on the prospect itself.
 */

import { randomUUID } from "crypto";
import { redisPipeline, redisWrite } from "./redis";
import type { ExpectedPayment } from "./expected";
import type { RenewalResponse } from "./responses";
import {
  formatDate,
  isOpenProspect,
  type AdvertiserView,
  type Prospect,
  type RosterSummary,
} from "./roster";

/* --------------------------------- history -------------------------------- */

const HISTORY_KEY = "ads:history";
const HISTORY_KEEP = 500;

export type HistoryKind =
  | "followup"
  | "renewal"
  | "paperwork"
  | "payment"
  | "task"
  | "reply"
  | "lead"
  | "artwork"
  | "prospect"
  | "advertiser"
  | "report"
  | "other";

export type HistoryEntry = {
  /** ISO timestamp. */
  at: string;
  who: string;
  kind: HistoryKind;
  text: string;
  /** Where to go to see the thing this was about. */
  href?: string;
};

export async function recordHistory(entry: Omit<HistoryEntry, "at">): Promise<void> {
  const record: HistoryEntry = { ...entry, at: new Date().toISOString() };
  await redisWrite([
    ["LPUSH", HISTORY_KEY, JSON.stringify(record)],
    ["LTRIM", HISTORY_KEY, 0, HISTORY_KEEP - 1],
  ]);
}

export async function listHistory(limit = 100): Promise<HistoryEntry[]> {
  const [raw] = await redisPipeline([["LRANGE", HISTORY_KEY, 0, limit - 1]]);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      try {
        return JSON.parse(String(r)) as HistoryEntry;
      } catch {
        return null;
      }
    })
    .filter((e): e is HistoryEntry => e !== null);
}

/** Entries written today, restaurant time, for the strip under the Today list. */
export function historyOn(entries: HistoryEntry[], date: string): HistoryEntry[] {
  return entries.filter((e) => localDate(e.at) === date);
}

function localDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/* ------------------------------ done markers ------------------------------ */

const DONE_KEY = (key: string) => `ads:done:${key}`;
const DONE_TTL_SECONDS = 400 * 24 * 60 * 60;

export type DoneMarker = { at: string; who: string };

export async function markDone(key: string, who: string): Promise<boolean> {
  const marker: DoneMarker = { at: new Date().toISOString(), who };
  return redisWrite([["SET", DONE_KEY(key), JSON.stringify(marker), "EX", DONE_TTL_SECONDS]]);
}

export async function clearDone(key: string): Promise<boolean> {
  return redisWrite([["DEL", DONE_KEY(key)]]);
}

/** Which of these keys have been marked done. */
export async function doneSet(keys: string[]): Promise<Set<string>> {
  if (keys.length === 0) return new Set();
  const [values] = await redisPipeline([["MGET", ...keys.map(DONE_KEY)]]);
  const done = new Set<string>();
  if (Array.isArray(values)) {
    values.forEach((v, i) => {
      if (v) done.add(keys[i]);
    });
  }
  return done;
}

/* -------------------------------- own tasks ------------------------------- */

const TASK_KEY = (id: string) => `ads:task:${id}`;
const TASK_INDEX = "ads:tasks";

export type Task = {
  id: string;
  title: string;
  detail: string;
  /** YYYY-MM-DD. Blank means "whenever", which sorts last. */
  dueDate: string;
  advertiserId?: string;
  prospectId?: string;
  createdAt: string;
  createdBy: string;
  doneAt?: string;
  doneBy?: string;
};

export async function listTasks(): Promise<Task[]> {
  const [ids] = await redisPipeline([["SMEMBERS", TASK_INDEX]]);
  const list = Array.isArray(ids) ? ids.map(String) : [];
  if (list.length === 0) return [];
  const [values] = await redisPipeline([["MGET", ...list.map(TASK_KEY)]]);
  if (!Array.isArray(values)) return [];
  return values
    .map((v) => {
      try {
        return v ? (JSON.parse(String(v)) as Task) : null;
      } catch {
        return null;
      }
    })
    .filter((t): t is Task => t !== null)
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999") || a.createdAt.localeCompare(b.createdAt));
}

export async function getTask(id: string): Promise<Task | null> {
  const [raw] = await redisPipeline([["GET", TASK_KEY(id)]]);
  try {
    return raw ? (JSON.parse(String(raw)) as Task) : null;
  } catch {
    return null;
  }
}

export async function addTask(input: {
  title: string;
  detail: string;
  dueDate: string;
  who: string;
  advertiserId?: string;
  prospectId?: string;
}): Promise<{ ok: boolean; id: string }> {
  const task: Task = {
    id: randomUUID().slice(0, 8),
    title: input.title.slice(0, 160),
    detail: input.detail.slice(0, 600),
    dueDate: input.dueDate,
    advertiserId: input.advertiserId,
    prospectId: input.prospectId,
    createdAt: new Date().toISOString(),
    createdBy: input.who,
  };
  const ok = await redisWrite([
    ["SET", TASK_KEY(task.id), JSON.stringify(task)],
    ["SADD", TASK_INDEX, task.id],
  ]);
  return { ok, id: task.id };
}

export async function completeTask(id: string, who: string): Promise<Task | null> {
  const task = await getTask(id);
  if (!task) return null;
  const done: Task = { ...task, doneAt: new Date().toISOString(), doneBy: who };
  const ok = await redisWrite([["SET", TASK_KEY(id), JSON.stringify(done)]]);
  return ok ? done : null;
}

export async function deleteTask(id: string): Promise<boolean> {
  return redisWrite([
    ["DEL", TASK_KEY(id)],
    ["SREM", TASK_INDEX, id],
  ]);
}

/* -------------------------------- the list -------------------------------- */

export type TodayKind =
  | "lead"
  | "followup"
  | "renewal"
  | "reply"
  | "paperwork"
  | "payment"
  | "report"
  | "task";

/**
 * How a row can be acted on. Each becomes a button; the page decides how.
 *
 * `done` is the universal one and carries the key that dismisses the row.
 * The rest are what you would do before pressing it.
 */
export type TodayAction =
  | { type: "done"; key: string }
  | { type: "link"; label: string; href: string }
  | { type: "call"; phone: string }
  | { type: "markPaid"; advertiserId: string; period: string; amount: number }
  | { type: "clearReply"; advertiserId: string; endDate: string }
  | { type: "completeTask"; id: string };

export type TodayItem = {
  key: string;
  kind: TodayKind;
  /** "bad" pulls the eye; "warn" is soon; "" is routine. */
  tone: "bad" | "warn" | "";
  title: string;
  detail: string;
  /** For sorting: earlier is more urgent. */
  order: number;
  actions: TodayAction[];
};

const KIND_ORDER: Record<TodayKind, number> = {
  lead: 0,
  reply: 1,
  payment: 2,
  followup: 3,
  renewal: 4,
  paperwork: 5,
  task: 6,
  report: 7,
};

const ADMIN = "/advertise/admin";

export const todayKeys = {
  followup: (p: Prospect) => `followup:${p.id}:${p.followUpDate}`,
  renewal: (v: AdvertiserView) => `renewal:${v.id}:${v.endDate}`,
  paperwork: (v: AdvertiserView) => `paperwork:${v.id}:${v.endDate}`,
  reply: (r: RenewalResponse) => `reply:${r.advertiserId}:${r.endDate}`,
  reports: (month: string) => `reports:${month}`,
};

export type TodayInput = {
  today: string;
  newLeads: Prospect[];
  followUps: Prospect[];
  summary: RosterSummary;
  replies: RenewalResponse[];
  overduePayments: ExpectedPayment[];
  draftReports: { count: number; month: string } | null;
  tasks: Task[];
  done: Set<string>;
};

/** Every key the list could show, so the page can ask which are done. */
export function candidateKeys(input: Omit<TodayInput, "done">): string[] {
  const keys: string[] = [];
  for (const p of input.followUps) keys.push(todayKeys.followup(p));
  for (const v of [...input.summary.overdue, ...input.summary.expiring]) keys.push(todayKeys.renewal(v));
  for (const v of input.summary.unsigned) keys.push(todayKeys.paperwork(v));
  return keys;
}

const tel = (phone: string) => phone.replace(/[^\d+]/g, "");

/**
 * The Today list.
 *
 * Pure: everything it needs is handed in, so it can be tested against a
 * roster without a database. Rows already marked done are left out; a lead
 * leaves when it is worked, a payment when it is paid, a task when completed.
 */
export function buildToday(input: TodayInput): TodayItem[] {
  const items: TodayItem[] = [];
  const { done, today } = input;

  for (const lead of input.newLeads) {
    items.push({
      key: `lead:${lead.id}`,
      kind: "lead",
      tone: "bad",
      title: `${lead.business}${lead.category ? ` · ${lead.category}` : ""}`,
      detail: [
        `Came in ${relative(lead.addedAt, today)}`,
        lead.source && `from the ${lead.source.toLowerCase()}`,
        lead.campaign && `flyer: ${lead.campaign}`,
      ]
        .filter(Boolean)
        .join(" · "),
      order: 0,
      actions: [
        { type: "link", label: "Review", href: `${ADMIN}/pipeline#prospect-${lead.id}` },
        ...(lead.phone ? [{ type: "call", phone: tel(lead.phone) } as TodayAction] : []),
      ],
    });
  }

  for (const r of input.replies) {
    const wants =
      r.choice === "renew" ? "wants to renew" : r.choice === "change" ? "wants to change package" : "wants to end their run";
    items.push({
      key: todayKeys.reply(r),
      kind: "reply",
      tone: "bad",
      title: `${r.business} ${wants}`,
      detail: `Replied to the renewal notice for the term ending ${formatDate(r.endDate)}${r.note ? ` · "${r.note}"` : ""}`,
      order: 0,
      actions: [
        { type: "link", label: "Open", href: `${ADMIN}/advertisers?open=${r.advertiserId}` },
        { type: "clearReply", advertiserId: r.advertiserId, endDate: r.endDate },
      ],
    });
  }

  for (const e of input.overduePayments) {
    items.push({
      key: `payment:${e.advertiserId}:${e.period}`,
      kind: "payment",
      tone: e.status === "late" ? "bad" : "warn",
      title: `${e.business} · $${e.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${e.status}`,
      detail: `${e.label} · due ${formatDate(e.dueDate)}${e.daysLate > 0 ? ` · ${e.daysLate} days ago` : ""}`,
      order: -e.daysLate,
      actions: [{ type: "markPaid", advertiserId: e.advertiserId, period: e.period, amount: e.amount }],
    });
  }

  for (const p of input.followUps) {
    const key = todayKeys.followup(p);
    if (done.has(key)) continue;
    const overdue = (p.followUpDate ?? "") < today;
    const last = p.log?.[p.log.length - 1];
    items.push({
      key,
      kind: "followup",
      tone: overdue ? "bad" : "warn",
      title: p.business,
      detail: [
        overdue ? `Overdue since ${formatDate(p.followUpDate ?? "")}` : "Due today",
        last?.text && `${last.who ? `${last.who} said: ` : ""}${last.text}`,
      ]
        .filter(Boolean)
        .join(" · "),
      order: overdue ? -1 : 0,
      actions: [
        ...(p.phone ? [{ type: "call", phone: tel(p.phone) } as TodayAction] : []),
        { type: "link", label: "Open", href: `${ADMIN}/pipeline#prospect-${p.id}` },
        { type: "done", key },
      ],
    });
  }

  for (const v of [...input.summary.overdue, ...input.summary.expiring]) {
    const key = todayKeys.renewal(v);
    if (done.has(key)) continue;
    // Sixty days is when the roster starts counting it as expiring; the Today
    // list waits until thirty so a whole quarter of "expiring" does not sit
    // on the front page for two months.
    if (!v.overdue && v.daysRemaining > 30) continue;
    items.push({
      key,
      kind: "renewal",
      tone: v.overdue || v.daysRemaining <= 7 ? "bad" : "warn",
      title: v.business,
      detail: v.overdue
        ? `Term ended ${formatDate(v.endDate)} · ${Math.abs(v.daysRemaining)} days ago · still on the screens`
        : `Ends ${formatDate(v.endDate)} · ${v.daysRemaining} days · ${v.category || "no category"}`,
      order: v.daysRemaining,
      actions: [
        ...(v.phone ? [{ type: "call", phone: tel(v.phone) } as TodayAction] : []),
        { type: "link", label: "Open", href: `${ADMIN}/advertisers?open=${v.id}` },
        { type: "done", key },
      ],
    });
  }

  for (const v of input.summary.unsigned) {
    const key = todayKeys.paperwork(v);
    if (done.has(key)) continue;
    items.push({
      key,
      kind: "paperwork",
      tone: "",
      title: v.business,
      detail: `Running with no signed agreement for the term ending ${formatDate(v.endDate)}`,
      order: v.daysRemaining,
      actions: [
        { type: "link", label: "Paperwork", href: `${ADMIN}/advertisers?open=${v.id}&panel=agreement` },
        { type: "done", key },
      ],
    });
  }

  for (const t of input.tasks) {
    if (t.doneAt) continue;
    if (t.dueDate && t.dueDate > today) continue;
    const overdue = Boolean(t.dueDate && t.dueDate < today);
    items.push({
      key: `task:${t.id}`,
      kind: "task",
      tone: overdue ? "warn" : "",
      title: t.title,
      detail: [t.detail, t.dueDate && (overdue ? `was due ${formatDate(t.dueDate)}` : "due today"), t.createdBy && `added by ${t.createdBy}`]
        .filter(Boolean)
        .join(" · "),
      order: overdue ? -1 : 0,
      actions: [{ type: "completeTask", id: t.id }],
    });
  }

  if (input.draftReports && input.draftReports.count > 0) {
    const { count, month } = input.draftReports;
    items.push({
      key: todayKeys.reports(month),
      kind: "report",
      tone: "",
      title: `${count} report ${count === 1 ? "draft" : "drafts"} waiting`,
      detail: "Read each one, then send or skip it. Nothing goes out until you do.",
      order: 0,
      actions: [{ type: "link", label: "Open drafts", href: `${ADMIN}/reports` }],
    });
  }

  return items.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.order - b.order);
}

/** Tasks not yet done whose date is still ahead, for the "coming up" strip. */
export function upcomingTasks(tasks: Task[], today: string): Task[] {
  return tasks.filter((t) => !t.doneAt && t.dueDate && t.dueDate > today);
}

/** Open prospects who were promised a call on a date still ahead. */
export function upcomingFollowUps(prospects: Prospect[], today: string): Prospect[] {
  return prospects
    .filter((p) => isOpenProspect(p) && p.followUpDate && p.followUpDate > today)
    .sort((a, b) => (a.followUpDate ?? "").localeCompare(b.followUpDate ?? ""));
}

function relative(iso: string, today: string): string {
  const date = localDate(iso);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
  if (date === today) return `${time} today`;
  return `${formatDate(date)} ${time}`;
}
