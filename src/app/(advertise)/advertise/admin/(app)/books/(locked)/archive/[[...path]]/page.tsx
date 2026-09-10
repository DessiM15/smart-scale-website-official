import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate, today } from "@/lib/ads/roster";
import { bareRowsFor, fileReceipts, filesFor, foldersFor, isYear, yearSummary, yearsOf, type Folder } from "@/lib/books/archive";
import { categoryOf, isCategoryId } from "@/lib/books/categories";
import { listAllEntries, type Entry } from "@/lib/books/ledger";
import { formatCents } from "@/lib/books/money";
import { listAllReceipts, receiptHref } from "@/lib/books/receipts";
import { BOOKS } from "../../../../../_components/books";
import { Icon, PageHeader } from "../../../../../_components/shell";
import { Badge, Card, Empty, FilterPill, Note, bebas, btnGhost, btnSm, cardClass, labelClass, numClass, type Tone } from "../../../../../_components/ui";
import { Shell } from "../../../../shell";

export const metadata: Metadata = { title: "Filed receipts" };

const PAGE = `${BOOKS}/archive`;

const KIND_LABEL = { expense: "Out", income: "In", capital: "Owner", transfer: "Transfer" } as const;
const KIND_TONE: Record<keyof typeof KIND_LABEL, Tone> = { expense: "neutral", income: "ok", capital: "brand", transfer: "neutral" };

const rowHref = (e: Entry) => `${BOOKS}/ledger?month=${e.date.slice(0, 7)}&open=${e.id}#entry-${e.id}`;

/**
 * One folder on the shelf. A link; the whole card is the target so a thumb
 * on a phone lands anywhere on it.
 */
function FolderCard({ year, folder }: { year: string; folder: Folder }) {
  const c = folder.category;
  return (
    <li>
      <a href={`${PAGE}/${year}/${c.id}`} className={`${cardClass} flex flex-col gap-3 px-5 py-5 h-full hover:bg-white/[0.05] transition-colors`}>
        <div className="flex items-start justify-between gap-3">
          <Icon name="archive" size={22} className="text-[#DC2626] shrink-0" />
          <Badge tone={KIND_TONE[c.kind]} dot={false}>{KIND_LABEL[c.kind]}</Badge>
        </div>
        <div className="min-w-0">
          <p className="text-[15px] text-white leading-snug">{c.label}</p>
          <p className="text-xs text-white/40 leading-snug mt-0.5">{c.line}</p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="text-xs text-white/45 leading-snug">
            <p>
              {folder.files} {folder.files === 1 ? "file" : "files"} · {folder.rows} {folder.rows === 1 ? "row" : "rows"}
            </p>
            {folder.missing > 0 && <p className="text-[#E0B36A]">{folder.missing} with no receipt</p>}
          </div>
          <p className={`${numClass} text-lg text-white tabular-nums leading-none`}>{formatCents(folder.cents, { whole: true })}</p>
        </div>
      </a>
    </li>
  );
}

export default async function ArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ msg?: string; err?: string; detail?: string }>;
}) {
  const [{ path = [] }, query] = await Promise.all([params, searchParams]);
  if (path.length > 2) notFound();
  const thisYear = today().slice(0, 4);
  const year = path[0] ?? thisYear;
  const category = path[1];
  if (!isYear(year) || (category && !isCategoryId(category))) notFound();

  const [entries, receipts] = await Promise.all([listAllEntries(), listAllReceipts()]);
  const filed = fileReceipts(entries, receipts);
  const years = yearsOf(entries, thisYear);
  const folders = foldersFor(year, entries, filed);

  /* ------------------------------ one folder ------------------------------ */
  if (category) {
    const c = categoryOf(category);
    const files = filesFor(year, category, filed);
    const bare = bareRowsFor(year, category, entries, filed);
    const total = entries.filter((e) => e.date.startsWith(year) && e.category === category).reduce((s, e) => s + e.cents, 0);
    return (
      <Shell active="archive" banner={query}>
        <PageHeader
          eyebrow={`Filed · ${year} · ${c.label}`}
          title={`${files.length} ${files.length === 1 ? "file" : "files"}, ${formatCents(total, { whole: true })} on the return.`}
          action={
            <a href={`${PAGE}/${year}`} className={btnGhost}>
              All of {year}
            </a>
          }
        />
        <p className="text-sm text-white/45 -mt-3 mb-6">{c.line}.</p>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
          <Card title="Files" padding="px-5 sm:px-6 pt-5 pb-2" lede="Each photo, on the row it was filed against, by the date on the receipt. Open the row to move it or take the photo off.">
            {files.length === 0 ? (
              <div className="pb-4">
                <Empty>Nothing filed here yet. Attach a photo to a {c.label.toLowerCase()} row in the ledger and it lands here.</Empty>
              </div>
            ) : (
              <ul>
                {files.map(({ receipt, entry }) => (
                  <li key={receipt.id} className="flex items-center gap-4 py-4 border-b border-white/[0.06] last:border-b-0">
                    <a href={receiptHref(receipt.id)} target="_blank" rel="noreferrer" className="shrink-0 block w-16 h-20 border border-white/[0.1] overflow-hidden bg-white/[0.03]" title="Open full size">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={receiptHref(receipt.id)} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </a>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] text-white leading-snug truncate">{entry.party || c.label}</p>
                      <p className="text-xs text-white/45 leading-snug truncate">
                        {formatDate(entry.date)}
                        {entry.memo ? ` · ${entry.memo}` : ""}
                        {receipt.who ? ` · snapped by ${receipt.who}` : ""}
                      </p>
                    </div>
                    <span className={`${numClass} text-lg text-white tabular-nums shrink-0`}>{formatCents(entry.cents)}</span>
                    <a href={rowHref(entry)} className={`${btnGhost} ${btnSm} shrink-0`}>
                      Row
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={`Rows with nothing filed · ${bare.length}`} padding="px-5 sm:px-6 pt-5 pb-2" lede="Every row in this folder that has no photo. Some rightly have none: a Stripe fee, a bank charge. The rest want one before the year closes.">
            {bare.length === 0 ? (
              <div className="pb-4">
                <Empty>Every row here has a file. That is what the accountant wants to see.</Empty>
              </div>
            ) : (
              <ul>
                {bare.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-3 border-b border-white/[0.06] last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white leading-snug truncate">{e.party || c.label}</p>
                      <p className="text-xs text-white/40 leading-snug truncate">
                        {formatDate(e.date)} · {formatCents(e.cents)}
                        {e.noReceipt ? " · there isn't one" : e.source === "stripe" ? " · Stripe is the record" : ""}
                      </p>
                    </div>
                    <a href={rowHref(e)} className={`${bebas} text-[11px] tracking-[0.2em] shrink-0 ${e.noReceipt || e.source === "stripe" ? "text-white/35" : "text-[#E0B36A]"} hover:text-white transition-colors`}>
                      {e.noReceipt || e.source === "stripe" ? "Row" : "Attach"}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </Shell>
    );
  }

  /* ------------------------------- one year ------------------------------- */
  const sum = yearSummary(folders);
  const out = folders.filter((f) => f.category.kind === "expense");
  const rest = folders.filter((f) => f.category.kind !== "expense");
  return (
    <Shell active="archive" banner={query}>
      <PageHeader
        eyebrow="Receipts · filed"
        title={sum.rows === 0 ? `Nothing in ${year} yet.` : `${year}: ${sum.files} ${sum.files === 1 ? "file" : "files"} in ${sum.folders} ${sum.folders === 1 ? "folder" : "folders"}.`}
        action={
          <a href={`${BOOKS}/receipts`} className={btnGhost}>
            Waiting to be confirmed
          </a>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {years.map((y) => (
          <FilterPill key={y} href={`${PAGE}/${y}`} on={y === year}>
            {y}
          </FilterPill>
        ))}
      </div>

      {sum.missing > 0 && (
        <div className="mb-5">
          <Note tone="warn">
            <p className="text-sm text-white">
              {sum.missing} {sum.missing === 1 ? "row has" : "rows have"} no receipt and nobody has said there isn&apos;t one.
            </p>
            <p className="mt-1 text-sm text-white/55">Each folder below says how many. Open one and every bare row is listed with an Attach link.</p>
          </Note>
        </div>
      )}

      {folders.length === 0 ? (
        <Card>
          <Empty>No rows dated {year}. Folders appear here as money gets logged, one per category, filed by the date on the receipt.</Empty>
        </Card>
      ) : (
        <>
          <p className={`${labelClass} !text-[#DC2626]`}>Money out</p>
          <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-8">
            {out.map((f) => (
              <FolderCard key={f.category.id} year={year} folder={f} />
            ))}
            {out.length === 0 && (
              <li className="text-sm text-white/40 sm:col-span-2 xl:col-span-3">No expenses logged in {year}.</li>
            )}
          </ul>
          {rest.length > 0 && (
            <>
              <p className={`${labelClass} !text-[#DC2626]`}>Money in, owner money, transfers</p>
              <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {rest.map((f) => (
                  <FolderCard key={f.category.id} year={year} folder={f} />
                ))}
              </ul>
            </>
          )}
          <p className="mt-8 text-xs text-white/35 leading-relaxed max-w-2xl">
            This is the shelf the accountant pack will be built from: one folder per category, each photo named by date, who and how much. Recategorise a row in the ledger and its photo moves folders on its own.
          </p>
        </>
      )}
    </Shell>
  );
}
