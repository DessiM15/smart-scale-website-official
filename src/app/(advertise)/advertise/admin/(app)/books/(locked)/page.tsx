import type { Metadata } from "next";
import { cachedClients, cachedEntries } from "@/lib/ads/cached";
import { TEAM } from "@/lib/ads/who";
import { booksAccess } from "@/lib/books/passkeys";
import { isFileKeyConfigured } from "@/lib/books/crypto";
import { adPaymentStates } from "@/lib/books/ads-bridge";
import { accountBalances, capitalByPartner, listAllEntries, totals } from "@/lib/books/ledger";
import { monthName } from "@/lib/books/money";
import { isReaderConfigured } from "@/lib/books/reader";
import { isReceiptStoreConfigured } from "@/lib/books/receipts";
import { addEntryAction, lockBooksAction } from "../actions";
import { AdMoneyCard, BalancesCard, BigButton, BOOKS, CapitalCard, MoneyTiles, RecentLine, SnapCard } from "../../../_components/books";
import { EntryForm } from "../../../_components/entry-form";
import { PageHeader } from "../../../_components/shell";
import { TodayRow } from "../../../_components/today";
import { Icon } from "../../../_components/shell";
import { Card, Empty, Note, btnGhost, linkLine } from "../../../_components/ui";
import { Shell } from "../../shell";
import { todayData } from "../../nav-counts";

export const metadata: Metadata = { title: "Books" };
/** Reading a receipt waits on the model; give the snap action room. */
export const maxDuration = 60;

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string; detail?: string; sent?: string }>;
}) {
  const [params, data, access, clients] = await Promise.all([searchParams, todayData(), booksAccess(), cachedClients()]);
  const who = access.who;
  const month = data.asOf.slice(0, 7);
  const [entries, everything] = await Promise.all([cachedEntries(month), listAllEntries()]);
  const sums = totals(entries);
  const capital = capitalByPartner(everything, TEAM);
  const adStates = await adPaymentStates([...data.payments.values()].flat());
  const balances = accountBalances(everything);
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
          {access.via === "open" ? (
            <Note tone="warn">
              <div className="flex items-start gap-3">
                <Icon name="key" size={18} className="text-[#E0B36A] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white">The books are open to anyone with the shared key.</p>
                  <p className="mt-1 text-sm text-white/55">
                    Add a passkey on each of your phones and they lock behind Face ID.{" "}
                    <a href={`${BOOKS}/passkeys`} className={linkLine}>
                      Set up passkeys
                    </a>
                  </p>
                </div>
              </div>
            </Note>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 border border-white/[0.08] px-4 py-3 text-xs text-white/50">
              <span className="flex items-center gap-2">
                <Icon name="lock" size={14} className="text-[#7FBF8E]" />
                Unlocked as {who} with a passkey
              </span>
              <span className="flex items-center gap-3">
                <a href={`${BOOKS}/passkeys`} className="hover:text-white transition-colors">Passkeys</a>
                <a href={`${BOOKS}/audit`} className="hover:text-white transition-colors">Audit log</a>
                <form action={lockBooksAction}>
                  <button type="submit" className="hover:text-white transition-colors">Lock</button>
                </form>
              </span>
            </div>
          )}
          {!isFileKeyConfigured() && (
            <Note tone="warn">
              <p className="text-sm text-white">BOOKS_FILE_KEY isn&apos;t set. Receipts are stored unsealed and the vault is closed until it is. See Setup.</p>
            </Note>
          )}
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

          <BalancesCard balances={balances} />
          <CapitalCard rows={capital} />
          <AdMoneyCard states={adStates} returnTo={BOOKS} />
        </div>
      </div>
    </Shell>
  );
}
