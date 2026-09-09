import type { Metadata } from "next";
import { auditCount, listAudit } from "@/lib/books/audit";
import { formatDate } from "@/lib/ads/roster";
import { PageHeader } from "../../../../_components/shell";
import { Badge, Card, Empty, btnGhost, btnSm, clock, labelClass } from "../../../../_components/ui";
import { Shell } from "../../../shell";

export const metadata: Metadata = { title: "Audit log" };

const PAGE = 200;

function dayOf(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

const TONE = (action: string) =>
  action.endsWith(".delete") || action.endsWith(".remove") || action.endsWith(".discard")
    ? "bad"
    : action.endsWith(".reveal") || action.endsWith(".open") || action.endsWith(".unlock")
      ? "warn"
      : "neutral";

/** Every write to the books, oldest at the bottom, never trimmed. */
export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(0, Number(params.page ?? 0) || 0);
  const [entries, total] = await Promise.all([listAudit(PAGE, page * PAGE), auditCount()]);
  const groups = new Map<string, typeof entries>();
  for (const e of entries) {
    const day = dayOf(e.at);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(e);
  }

  return (
    <Shell active="books">
      <PageHeader
        eyebrow={`Books · audit log · ${total} ${total === 1 ? "entry" : "entries"}`}
        title="Who changed what, and when."
        action={
          <div className="flex items-center gap-2">
            {page > 0 && <a href={`?page=${page - 1}`} className={`${btnGhost} ${btnSm}`}>Newer</a>}
            {(page + 1) * PAGE < total && <a href={`?page=${page + 1}`} className={`${btnGhost} ${btnSm}`}>Older</a>}
          </div>
        }
      />
      {entries.length === 0 ? (
        <Empty>Nothing yet. Every entry, receipt, document, reveal and unlock will be here with a name and a time.</Empty>
      ) : (
        <div className="flex flex-col gap-5">
          {[...groups.entries()].map(([day, list]) => (
            <Card key={day} title={formatDate(day)} padding="px-5 sm:px-6 pt-5 pb-2">
              <ul>
                {list.map((e, i) => (
                  <li key={`${e.at}-${i}`} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-5 py-3 border-b border-white/[0.06] last:border-b-0">
                    <span className={`${labelClass} !mb-0 sm:w-20 shrink-0 tabular-nums pt-0.5`}>{clock(e.at)}</span>
                    <span className="sm:w-40 shrink-0">
                      <Badge tone={TONE(e.action)} dot={false}>{e.action}</Badge>
                    </span>
                    <span className="flex-1 text-sm text-white/85 leading-snug">
                      {e.summary}
                      {(e.before !== undefined || e.after !== undefined) && (
                        <details className="mt-1.5">
                          <summary className="text-[11px] text-white/35 cursor-pointer">what changed</summary>
                          <pre className="mt-1.5 text-[11px] text-white/50 whitespace-pre-wrap break-all font-mono max-h-64 overflow-auto border border-white/[0.06] p-3">
                            {JSON.stringify({ before: e.before, after: e.after }, null, 1)}
                          </pre>
                        </details>
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
