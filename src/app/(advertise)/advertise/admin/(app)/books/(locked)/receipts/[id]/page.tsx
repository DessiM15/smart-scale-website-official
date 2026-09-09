import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cachedClients } from "@/lib/ads/cached";
import { formatDate, today } from "@/lib/ads/roster";
import { TEAM } from "@/lib/ads/who";
import { getEntry } from "@/lib/books/ledger";
import { centsToInput, formatCents } from "@/lib/books/money";
import { getReceipt, receiptHref } from "@/lib/books/receipts";
import { confirmReceiptAction, discardReceiptAction } from "../../../actions";
import { BOOKS } from "../../../../../_components/books";
import { EntryForm } from "../../../../../_components/entry-form";
import { PageHeader } from "../../../../../_components/shell";
import { Badge, Card, Note, btnDanger, btnGhost, btnSm } from "../../../../../_components/ui";
import { Shell } from "../../../../shell";

export const metadata: Metadata = { title: "Confirm receipt" };
export const maxDuration = 60;

const PAGE = `${BOOKS}/receipts`;

export default async function ConfirmReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; err?: string; detail?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const receipt = await getReceipt(id);
  if (!receipt) notFound();
  const [clients, entry] = await Promise.all([cachedClients(), receipt.entryId ? getEntry(receipt.entryId) : null]);
  const read = receipt.read;
  const confirmed = receipt.status === "confirmed" && entry;

  return (
    <Shell active="receipts" banner={query}>
      <PageHeader
        eyebrow={`Receipt · snapped ${formatDate(receipt.capturedAt.slice(0, 10))}${receipt.who ? ` by ${receipt.who}` : ""}`}
        title={confirmed ? "Already in the ledger." : read?.vendor ? `${read.vendor}. Check it, then save.` : "Check the photo, fill in the numbers."}
        action={
          <a href={PAGE} className={btnGhost}>
            All receipts
          </a>
        }
      />

      <div className="grid lg:grid-cols-[1fr_1fr] gap-5 items-start">
        <Card padding="p-3" className="lg:sticky lg:top-6">
          <a href={receiptHref(receipt.id)} target="_blank" rel="noreferrer" title="Open full size">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptHref(receipt.id)}
              alt="The receipt"
              width={receipt.width || undefined}
              height={receipt.height || undefined}
              className="w-full h-auto max-h-[75vh] object-contain bg-black"
            />
          </a>
        </Card>

        <div className="flex flex-col gap-5">
          {confirmed ? (
            <Card title="On the ledger">
              <p className="text-sm text-white/70 leading-relaxed">
                This photo is filed against {formatCents(entry.cents)} to {entry.party}, dated {formatDate(entry.date)}.
              </p>
              <a href={`${BOOKS}/ledger?month=${entry.date.slice(0, 7)}&open=${entry.id}#entry-${entry.id}`} className={`${btnGhost} ${btnSm} mt-4 inline-flex`}>
                Open that entry
              </a>
            </Card>
          ) : (
            <>
              <Card title="What it says" lede="Read from the photo. Nothing is saved until you press the button.">
                <div className="mb-5">
                  {receipt.readError ? (
                    <Note tone="warn">
                      <p className="text-sm text-white/80">The photo was kept but couldn&apos;t be read: {receipt.readError}. Fill the form in from the picture.</p>
                    </Note>
                  ) : read ? (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
                      <Badge tone={read.confidence === "high" ? "ok" : read.confidence === "medium" ? "neutral" : "warn"}>{read.confidence} confidence</Badge>
                      {read.total != null && <span>Total {formatCents(read.total)}</span>}
                      {read.tax != null && read.tax > 0 && <span className="text-white/45">incl. {formatCents(read.tax)} tax</span>}
                      {read.summary && <span className="text-white/45">{read.summary}</span>}
                    </div>
                  ) : (
                    <p className="text-sm text-white/50">Reading isn&apos;t switched on, so type what the receipt says.</p>
                  )}
                  {read && read.confidence !== "high" && !receipt.readError && (
                    <p className="mt-3 text-xs text-[#E0B36A]">Look twice at the total before saving. The read wasn&apos;t sure.</p>
                  )}
                </div>

                <EntryForm
                  id="confirm"
                  action={confirmReceiptAction}
                  hidden={{ receiptId: receipt.id, returnTo: BOOKS }}
                  lockKind="expense"
                  defaults={{
                    amount: read?.total != null ? centsToInput(read.total) : "",
                    date: read?.date || undefined,
                    category: read?.category,
                    party: read?.vendor,
                    memo: read?.summary,
                  }}
                  clients={clients}
                  team={TEAM}
                  today={today()}
                  submitLabel="Save to the ledger"
                />
              </Card>

              <form action={discardReceiptAction} className="self-start">
                <input type="hidden" name="receiptId" value={receipt.id} />
                <input type="hidden" name="returnTo" value={PAGE} />
                <button type="submit" className={`${btnDanger} ${btnSm}`}>
                  Discard this photo
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}
