/**
 * Categories: the thing actually being sold.
 *
 * Exclusivity is the product, so the useful question is not "who is running"
 * but "what can I still sell, and what frees up when". The roster answers the
 * first; this answers the second, and puts the waiting list beside it — a
 * category with people asking for it and a term ending in three weeks is the
 * single most valuable fact in this system, and until now it was spread across
 * two tabs and a date nobody was comparing.
 */

import {
  formatDate,
  isOpenProspect,
  type AdvertiserView,
  type Prospect,
} from "@/lib/ads/roster";
import { tabHref } from "./types";
import { Card, Empty, Pill, SubHead, linkQuiet, money } from "./ui";

const normalise = (value: string) => value.trim().toLowerCase();

export type CategoryRow = {
  /** As typed by whoever entered it first — categories are free text. */
  label: string;
  holder?: AdvertiserView;
  /** Prospects who named this category and haven't been passed on. */
  waiting: Prospect[];
};

/**
 * Every category anybody has named, whether it is held or merely wanted.
 *
 * Free text, so matching is case-insensitive on a trimmed string and the label
 * shown is whichever spelling the current holder used — or the first prospect's,
 * when nobody holds it.
 */
export function buildCategories(
  advertisers: AdvertiserView[],
  prospects: Prospect[],
): CategoryRow[] {
  const rows = new Map<string, CategoryRow>();

  for (const view of advertisers) {
    if (view.status !== "active" || !view.category.trim()) continue;
    rows.set(normalise(view.category), { label: view.category.trim(), waiting: [], holder: view });
  }

  for (const prospect of prospects) {
    // Converted and passed prospects are both finished business: one now holds
    // the category as an advertiser, the other isn't coming. Either one left in
    // here shows the same business as both holding a category and queuing for it.
    if (!isOpenProspect(prospect) || !prospect.category.trim()) continue;
    const key = normalise(prospect.category);
    const existing = rows.get(key);
    if (existing) existing.waiting.push(prospect);
    else rows.set(key, { label: prospect.category.trim(), waiting: [prospect] });
  }

  return [...rows.values()].sort((a, b) => {
    // Held categories first, soonest to free up at the top — that ordering is
    // the sales queue.
    if (a.holder && b.holder) return a.holder.daysRemaining - b.holder.daysRemaining;
    if (a.holder) return -1;
    if (b.holder) return 1;
    return b.waiting.length - a.waiting.length || a.label.localeCompare(b.label);
  });
}

function HeldRow({ row }: { row: CategoryRow }) {
  const holder = row.holder!;
  const soon = holder.daysRemaining <= 60;

  return (
    <li className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-white">{row.label}</p>
          <p className="text-xs text-white/35 mt-0.5">
            held by{" "}
            <a
              href={`/advertise/admin/client/${holder.id}`}
              className="text-white/60 hover:text-[#f87171] transition-colors"
            >
              {holder.business}
            </a>
          </p>
        </div>
        <Pill tone={holder.overdue ? "brand" : soon ? "warn" : "ok"}>
          {holder.overdue
            ? "term ended"
            : `${holder.daysRemaining} days left`}
        </Pill>
      </div>

      <p className="mt-3 text-xs text-white/40 tabular-nums">
        Frees up {formatDate(holder.endDate)} ·{" "}
        {holder.monthly ? `${money(holder.monthly)}/mo` : "no charge"}
      </p>

      {row.waiting.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <SubHead>
            {row.waiting.length} waiting on this category
          </SubHead>
          <ul className="space-y-1">
            {row.waiting.map((p) => (
              <li key={p.id} className="text-sm text-white/60">
                {p.business}
                {p.phone && (
                  <a
                    href={`tel:${p.phone.replace(/[^\d+]/g, "")}`}
                    className="ml-2 text-xs font-semibold text-[#f87171] hover:text-white"
                  >
                    call
                  </a>
                )}
              </li>
            ))}
          </ul>
          {soon && (
            <p className="mt-2 text-xs text-amber-300/80 leading-relaxed">
              This term is nearly up and there are people asking for the
              category. Worth knowing which way {holder.business} is going before
              you promise it to anyone.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function OpenRow({ row }: { row: CategoryRow }) {
  return (
    <li className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="font-semibold text-white">{row.label}</p>
        <Pill tone="ok">open</Pill>
      </div>
      <p className="mt-2 text-xs text-white/45">
        Nobody holds this. {row.waiting.length}{" "}
        {row.waiting.length === 1 ? "business has" : "businesses have"} asked about
        it.
      </p>
      <ul className="mt-3 space-y-1">
        {row.waiting.map((p) => (
          <li key={p.id} className="text-sm text-white/60">
            {p.business}
            {p.phone && (
              <a
                href={`tel:${p.phone.replace(/[^\d+]/g, "")}`}
                className="ml-2 text-xs font-semibold text-[#f87171] hover:text-white"
              >
                call
              </a>
            )}
          </li>
        ))}
      </ul>
    </li>
  );
}

export function CategoriesTab({
  rows,
  openSlots,
}: {
  rows: CategoryRow[];
  openSlots: number;
}) {
  const held = rows.filter((r) => r.holder);
  const open = rows.filter((r) => !r.holder);
  const freeingSoon = held.filter((r) => r.holder!.daysRemaining <= 60);

  return (
    <>
      <Card
        title="Categories held"
        lede="One business per category is the thing being sold. These are locked until the term ends — and the order is soonest to free up, which is the order worth working."
        action={
          <a href={tabHref("prospects")} className={linkQuiet}>
            The waiting list
          </a>
        }
        className="mb-5"
      >
        {held.length === 0 ? (
          <Empty>
            No categories are locked yet. They lock automatically when an
            advertiser goes live with one.
          </Empty>
        ) : (
          <>
            {freeingSoon.length > 0 && (
              <p className="mb-4 text-sm text-amber-300/80 leading-relaxed">
                {freeingSoon.length}{" "}
                {freeingSoon.length === 1 ? "category frees" : "categories free"} up
                within 60 days.
              </p>
            )}
            <ul className="grid sm:grid-cols-2 gap-4">
              {held.map((row) => (
                <HeldRow key={row.label} row={row} />
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card
        title="Asked for, not held"
        lede="Categories prospects have named that nobody currently owns. Each one is a slot you could sell today."
      >
        {open.length === 0 ? (
          <Empty>
            Nothing on the waiting list for a category that&apos;s free. Add a
            category when you log a prospect and they&apos;ll appear here.
          </Empty>
        ) : (
          <>
            <ul className="grid sm:grid-cols-2 gap-4">
              {open.map((row) => (
                <OpenRow key={row.label} row={row} />
              ))}
            </ul>
            {openSlots > 0 && (
              <p className="mt-5 text-sm text-white/45">
                {openSlots} {openSlots === 1 ? "slot is" : "slots are"} free in the
                rotation, so any of these could go live.
              </p>
            )}
          </>
        )}
      </Card>
    </>
  );
}
