import type { Metadata } from "next";
import { cachedBills, cachedEntries } from "@/lib/ads/cached";
import { today } from "@/lib/ads/roster";
import { categoriesOfKind } from "@/lib/books/categories";
import { ACCOUNTS } from "@/lib/books/kinds";
import { formatCents, monthName } from "@/lib/books/money";
import { expectedBills } from "@/lib/books/recurring";
import { addBillAction } from "../../actions";
import { BillsTable, BOOKS } from "../../../../_components/books";
import { PageHeader } from "../../../../_components/shell";
import { SubmitButton } from "../../../../_components/submit-button";
import { Card, Disclosure, Field, btnPrimary, labelClass, selectClass } from "../../../../_components/ui";
import { Shell } from "../../../shell";

export const metadata: Metadata = { title: "Bills" };

const PAGE = `${BOOKS}/recurring`;

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string; detail?: string }>;
}) {
  const asOf = today();
  const month = asOf.slice(0, 7);
  const [params, bills, entries] = await Promise.all([searchParams, cachedBills(), cachedEntries(month)]);
  const expected = expectedBills(bills, entries, month, asOf);
  const monthly = bills.filter((b) => b.active).reduce((s, b) => s + b.cents, 0);
  const due = expected.filter((e) => e.status === "due").length;

  return (
    <Shell active="recurring" banner={params}>
      <PageHeader
        eyebrow={`Bills · ${monthName(month)}`}
        title={bills.length ? `${formatCents(monthly, { whole: true })} a month, before anything else.` : "The bills that come every month."}
        action={
          <a href="#add-bill" className={btnPrimary}>
            + Add a bill
          </a>
        }
      />

      <Card
        title={due ? `${due} due, not yet paid` : "This month"}
        lede="Each bill shows on Today on its day. Tap Paid when the charge has come out and it's logged for the month; change the amount on the ledger if it differed."
        padding="px-5 sm:px-6 pt-5 pb-2"
      >
        <BillsTable bills={bills} expected={expected} month={month} returnTo={PAGE} />
      </Card>

      <div className="mt-5">
        <Disclosure id="add-bill" summary={<span className="text-white/60">Add a monthly bill</span>} hint="Vercel, Twilio, the domain" open={Boolean(params.err)}>
          <form action={addBillAction} className="flex flex-col gap-4 pt-3">
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="From" name="vendor" id="bill-vendor" placeholder="Vercel" required />
              <Field label="Usual amount" name="amount" id="bill-amount" placeholder="20.00" inputMode="decimal" required />
              <Field label="Day of the month" name="day" id="bill-day" placeholder="1" inputMode="numeric" required hint="1 to 31. The 31st becomes the last day in shorter months." />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass} htmlFor="bill-category">Category</label>
                <select id="bill-category" name="category" defaultValue="software" className={selectClass}>
                  {categoriesOfKind("expense").map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="bill-account">Comes out of</label>
                <select id="bill-account" name="account" defaultValue="checking" className={selectClass}>
                  {ACCOUNTS.map((a) => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </div>
              <Field label="Note" name="note" id="bill-note" placeholder="Pro plan, the main site" />
            </div>
            <SubmitButton className={`${btnPrimary} self-start`} pendingLabel="Adding">
              Add the bill
            </SubmitButton>
          </form>
        </Disclosure>
      </div>
    </Shell>
  );
}
