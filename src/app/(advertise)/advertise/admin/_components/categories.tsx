/**
 * Categories: the thing actually being sold.
 *
 * Exclusivity is the product, so the useful question is not "who is running"
 * but "what can I still sell, and what frees up when". A category with people
 * asking for it and a term ending in three weeks is the single most valuable
 * fact in this system, and it sits at the bottom of the pipeline because the
 * pipeline is where the people asking are.
 */

import { formatDate, isOpenProspect, type AdvertiserView, type Prospect } from "@/lib/ads/roster";
import { clientHref } from "./types";
import { Badge, Card, Empty, cardClass, labelClass, money } from "./ui";

const normalise = (value: string) => value.trim().toLowerCase();

export type CategoryRow = {
  label: string;
  holder?: AdvertiserView;
  waiting: Prospect[];
};

export function buildCategories(advertisers: AdvertiserView[], prospects: Prospect[]): CategoryRow[] {
  const rows = new Map<string, CategoryRow>();

  for (const view of advertisers) {
    if (view.status !== "active" || !view.category.trim()) continue;
    rows.set(normalise(view.category), { label: view.category.trim(), waiting: [], holder: view });
  }

  for (const prospect of prospects) {
    if (!isOpenProspect(prospect) || !prospect.category.trim()) continue;
    const key = normalise(prospect.category);
    const existing = rows.get(key);
    if (existing) existing.waiting.push(prospect);
    else rows.set(key, { label: prospect.category.trim(), waiting: [prospect] });
  }

  return [...rows.values()].sort((a, b) => {
    if (a.holder && b.holder) return a.holder.daysRemaining - b.holder.daysRemaining;
    if (a.holder) return -1;
    if (b.holder) return 1;
    return b.waiting.length - a.waiting.length || a.label.localeCompare(b.label);
  });
}

function Row({ row }: { row: CategoryRow }) {
  const holder = row.holder;
  const soon = holder ? holder.daysRemaining <= 60 : false;
  return (
    <li className={`${cardClass} p-4 flex flex-col gap-2`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-white">{row.label}</p>
        {holder ? (
          <Badge tone={holder.overdue ? "bad" : soon ? "warn" : "ok"}>
            {holder.overdue ? "ended" : `${holder.daysRemaining}d left`}
          </Badge>
        ) : (
          <Badge tone="ok">Open</Badge>
        )}
      </div>
      {holder ? (
        <p className="text-xs text-white/45">
          <a href={clientHref(holder.id)} className="text-white/70 hover:text-[#f87171] transition-colors">
            {holder.business}
          </a>{" "}
          · frees up {formatDate(holder.endDate)} · {holder.monthly ? `${money(holder.monthly)}/mo` : "no charge"}
        </p>
      ) : (
        <p className="text-xs text-white/45">Nobody holds this.</p>
      )}
      {row.waiting.length > 0 && (
        <p className="text-xs text-white/55 leading-relaxed">
          <span className={`${labelClass} !inline !mb-0 !text-[10px] mr-2`}>Waiting</span>
          {row.waiting.map((p) => p.business).join(", ")}
        </p>
      )}
    </li>
  );
}

export function CategoriesSection({ rows, openSlots }: { rows: CategoryRow[]; openSlots: number }) {
  const held = rows.filter((r) => r.holder);
  const open = rows.filter((r) => !r.holder);
  return (
    <Card
      id="categories"
      title="Categories"
      lede={`One business per category. Held ones are listed soonest to free up, which is the order worth working. ${
        openSlots > 0 ? `${openSlots} ${openSlots === 1 ? "slot is" : "slots are"} free in the rotation.` : "The rotation is full."
      }`}
      className="mt-10 scroll-mt-28"
    >
      {rows.length === 0 ? (
        <Empty>No categories yet. They appear when an advertiser goes live with one, or a prospect names one.</Empty>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...held, ...open].map((row) => (
            <Row key={row.label} row={row} />
          ))}
        </div>
      )}
    </Card>
  );
}
