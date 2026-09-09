import type { Metadata } from "next";
import { listHistory, type HistoryEntry } from "@/lib/ads/tasks";
import { formatDate } from "@/lib/ads/roster";
import { PageHeader } from "../../_components/shell";
import { Badge, Card, Empty, clock, labelClass } from "../../_components/ui";
import { Shell } from "../shell";

export const metadata: Metadata = { title: "History" };

const KIND_LABEL: Record<string, string> = {
  followup: "Follow-up",
  renewal: "Renewal",
  paperwork: "Paperwork",
  payment: "Payment",
  task: "Task",
  reply: "Reply",
  lead: "Lead",
  artwork: "Artwork",
  prospect: "Prospect",
  advertiser: "Advertiser",
  report: "Report",
  books: "Books",
  other: "Note",
};

function dayOf(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function groupByDay(entries: HistoryEntry[]): { day: string; entries: HistoryEntry[] }[] {
  const groups = new Map<string, HistoryEntry[]>();
  for (const e of entries) {
    const day = dayOf(e.at);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(e);
  }
  return [...groups.entries()].map(([day, list]) => ({ day, entries: list }));
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string }>;
}) {
  const [params, entries] = await Promise.all([searchParams, listHistory(300)]);
  const groups = groupByDay(entries);

  return (
    <Shell active="history" banner={params}>
      <PageHeader eyebrow="History" title="What got done, and who did it." />
      {groups.length === 0 ? (
        <Empty>Nothing yet. Every Done, every payment marked, every prospect moved lands here with a time and a name.</Empty>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <Card key={g.day} title={formatDate(g.day)} padding="px-5 sm:px-6 pt-5 pb-2">
              <ul>
                {g.entries.map((e, i) => (
                  <li
                    key={`${e.at}-${i}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 py-3 border-b border-white/[0.06] last:border-b-0"
                  >
                    <span className={`${labelClass} !mb-0 sm:w-20 shrink-0 tabular-nums`}>{clock(e.at)}</span>
                    <span className="sm:w-28 shrink-0">
                      <Badge dot={false}>{KIND_LABEL[e.kind] ?? "Note"}</Badge>
                    </span>
                    <span className="flex-1 text-sm text-white/85 leading-snug">
                      {e.href ? (
                        <a href={e.href} className="hover:text-[#f87171] transition-colors">
                          {e.text}
                        </a>
                      ) : (
                        e.text
                      )}
                    </span>
                    <span className="text-xs text-white/40 shrink-0">{e.who || "Someone"}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}
