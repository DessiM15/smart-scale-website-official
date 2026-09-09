import type { Metadata } from "next";
import { cachedClients, cachedEntries } from "@/lib/ads/cached";
import { currentWho, TEAM } from "@/lib/ads/who";
import { unpostedAdPayments } from "@/lib/books/ads-bridge";
import { capitalByPartner, listAllEntries, totals } from "@/lib/books/ledger";
import { monthName } from "@/lib/books/money";
import { isReaderConfigured } from "@/lib/books/reader";
import { isReceiptStoreConfigured } from "@/lib/books/receipts";
import { addEntryAction, importAdPaymentsAction } from "./actions";
import { BigButton, BOOKS, CapitalCard, MoneyTiles, RecentLine, SnapCard } from "../../_components/books";
import { EntryForm } from "../../_components/entry-form";
import { PageHeader } from "../../_components/shell";
import { TodayRow } from "../../_components/today";
import { Card, Disclosure, Empty, btnGhost, btnPrimary, btnSm, linkLine } from "../../_components/ui";
import { Shell } from "../shell";
import { todayData } from "../nav-counts";

export const metadata: Metadata = { title: "Books" };
/** Reading a receipt waits on the model; give the snap action room. */
export const maxDuration = 60;

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string; detail?: string; sent?: string }>;
}) {
  const [params, data, who, clients] = await Promise.all([searchParams, todayData(), currentWho(), cachedClients()]);
  const month = data.asOf.slice(0, 7);
  const [entries, everything] = await Promise.all([cachedEntries(month), listAllEntries()]);
  const sums = totals(entries);
  const capital = capitalByPartner(everything, TEAM);
  const unposted = await unpostedAdPayments([...data.payments.values()].flat());
  const storeReady = isReceiptStoreConfigured();

  return (
    <Shell active="books" banner={params}>
      <PageHeader
        eyebrow={`Books · ${monthName(month)}`}
        title={who ? `What came in, what went out, ${who}.` : "What came in, what went out."}
        action={
          <a href={`${BOOKS}/ledger?month=${month}`} className={btnGhost}>
            Open the ledger
          </a>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 lg:hidden">
        <BigButton href="#snap" icon="camera" label="Snap a receipt" hint="Photo first, numbers after" solid />
        <BigButton href="#log" icon="plus" label="Log money" hint="In, out, or money you put in" />
      </div>

      <MoneyTiles totals={sums} pending={data.pendingReceipts.length} label={monthName(month).split(" ")[0]} />

      <div className="grid lg:grid-cols-[1fr_1fr] gap-5 items-start">
        <div className="flex flex-col gap-5">
          <SnapCard configured={storeReady} returnTo={BOOKS} reader={isReaderConfigured()} />

          <Card id="log" title="Log money" lede="Four fields. Money in, money out, or money one of you put in.">
            <EntryForm
              id="log"
              action={addEntryAction}
              hidden={{ returnTo: BOOKS }}
              clients={clients}
              team={TEAM}
              today={data.asOf}
              submitLabel="Log it"
              pendingLabel="Logging"
              showNoReceipt
            />
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card
            title={`Needs you · ${data.books.length}`}
            padding="px-5 sm:px-6 pt-5 pb-2"
            action={
              <a href="/advertise/admin" className={linkLine}>
                Today
              </a>
            }
          >
            {data.books.length === 0 ? (
              <div className="pb-4">
                <Empty>Nothing waiting. Receipts to confirm, bills whose day has come, and expenses missing a receipt show up here and on Today.</Empty>
              </div>
            ) : (
              <ul>
                {data.books.map((item) => (
                  <TodayRow key={item.key} item={item} returnTo={BOOKS} />
                ))}
              </ul>
            )}
          </Card>

          <Card
            title={`Recent · ${monthName(month)}`}
            padding="px-5 sm:px-6 pt-5 pb-3"
            action={
              <a href={`${BOOKS}/ledger?month=${month}`} className={linkLine}>
                All {sums.count}
              </a>
            }
          >
            {entries.length === 0 ? (
              <div className="pb-3">
                <Empty>Nothing logged this month yet. The first receipt you snap lands here.</Empty>
              </div>
            ) : (
              <ul>
                {entries.slice(0, 8).map((e) => (
                  <RecentLine key={e.id} entry={e} clients={clients} />
                ))}
              </ul>
            )}
          </Card>

          <CapitalCard rows={capital} />

          {unposted.length > 0 && (
            <Disclosure summary={<span>{unposted.length} ad {unposted.length === 1 ? "payment" : "payments"} not in the ledger yet</span>} hint="bring them in">
              <p className="text-sm text-white/55 leading-relaxed pt-3 mb-4">
                Payments recorded on the ads side before the books existed. One press posts each as ad revenue, once, keyed to the payment so it can never double up.
              </p>
              <form action={importAdPaymentsAction}>
                <input type="hidden" name="returnTo" value={BOOKS} />
                <button type="submit" className={`${btnPrimary} ${btnSm}`}>
                  Bring them into the ledger
                </button>
              </form>
            </Disclosure>
          )}
        </div>
      </div>
    </Shell>
  );
}
