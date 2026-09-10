import type { Metadata } from "next";
import { cachedPendingReceipts } from "@/lib/ads/cached";
import { formatDate } from "@/lib/ads/roster";
import { formatCents } from "@/lib/books/money";
import { isReaderConfigured } from "@/lib/books/reader";
import { isReceiptStoreConfigured, receiptHref } from "@/lib/books/receipts";
import { discardReceiptAction } from "../../actions";
import { BOOKS, SnapCard } from "../../../../_components/books";
import { PageHeader } from "../../../../_components/shell";
import { Badge, Card, Empty, btnDanger, btnGhost, btnPrimary, btnSm } from "../../../../_components/ui";
import { Shell } from "../../../shell";

export const metadata: Metadata = { title: "Receipts" };
export const maxDuration = 60;

const PAGE = `${BOOKS}/receipts`;

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string; detail?: string }>;
}) {
  const [params, pending] = await Promise.all([searchParams, cachedPendingReceipts()]);

  return (
    <Shell active="receipts" banner={params}>
      <PageHeader
        eyebrow="Receipts"
        title="Snap it now, sort it later."
        action={
          <a href={`${BOOKS}/archive`} className={btnGhost}>
            Filed by year
          </a>
        }
      />

      <div className="grid lg:grid-cols-[1fr_1.25fr] gap-5 items-start">
        <SnapCard configured={isReceiptStoreConfigured()} returnTo={PAGE} reader={isReaderConfigured()} />

        <Card title={`Waiting · ${pending.length}`} padding="px-5 sm:px-6 pt-5 pb-2" lede="Photos taken but not yet checked and saved. Each one is also on Today.">
          {pending.length === 0 ? (
            <div className="pb-4">
              <Empty>Every receipt is confirmed. Confirmed ones live on their ledger rows.</Empty>
            </div>
          ) : (
            <ul>
              {pending.map((r) => (
                <li key={r.id} className="flex items-center gap-4 py-4 border-b border-white/[0.06] last:border-b-0">
                  <a href={receiptHref(r.id)} target="_blank" rel="noreferrer" className="shrink-0 block w-16 h-20 border border-white/[0.1] overflow-hidden bg-white/[0.03]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={receiptHref(r.id)} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </a>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-white leading-snug truncate">
                      {r.read?.vendor || "Unread receipt"}
                      {r.read?.total != null ? ` · ${formatCents(r.read.total)}` : ""}
                    </p>
                    <p className="text-xs text-white/45 leading-snug">
                      Snapped {formatDate(r.capturedAt.slice(0, 10))}
                      {r.who ? ` by ${r.who}` : ""}
                      {r.read?.date ? ` · dated ${formatDate(r.read.date)}` : ""}
                    </p>
                    <div className="mt-1.5">
                      {r.readError ? (
                        <Badge tone="warn">Not read</Badge>
                      ) : r.read ? (
                        <Badge tone={r.read.confidence === "high" ? "ok" : r.read.confidence === "medium" ? "neutral" : "warn"}>
                          {r.read.confidence} confidence
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <a href={`${PAGE}/${r.id}`} className={`${btnPrimary} ${btnSm}`}>
                      Confirm
                    </a>
                    <form action={discardReceiptAction}>
                      <input type="hidden" name="receiptId" value={r.id} />
                      <input type="hidden" name="returnTo" value={PAGE} />
                      <button type="submit" className={`${btnDanger} ${btnSm} w-full`}>
                        Discard
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Shell>
  );
}
