/**
 * The monthly venue statement.
 *
 * The only page in this system printed on paper and handed to somebody who is
 * owed money by it, which decides everything about how it looks: light, quiet,
 * typeset for A4, and readable by someone who has never seen the tracker.
 *
 * It states how each figure was arrived at rather than only the figure. A
 * statement whose arithmetic can't be followed is one the other party has to
 * take on trust, and the point of sending it is that they shouldn't have to.
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { isSignedIn } from "@/lib/ads/auth";
import { buildStatement, monthLabel, type Statement } from "@/lib/ads/statement";
import { PAYMENT_METHODS } from "@/lib/ads/payments";
import { formatDate } from "@/lib/ads/roster";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Venue statement",
  robots: { index: false, follow: false },
};

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const whole = (n: number) => n.toLocaleString("en-US");

const methodLabel = (id: string) =>
  PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;

/* --------------------------------- pieces --------------------------------- */

function Figure({
  label,
  value,
  note,
  emphasis,
}: {
  label: string;
  value: string;
  note?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-5 py-4 ${
        emphasis ? "border-[#DC2626]/30 bg-[#DC2626]/[0.04]" : "border-black/10 bg-white"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.16em] text-[#7a6a5d] font-bold">
        {label}
      </p>
      <p
        className={`mt-1.5 text-2xl font-semibold tabular-nums tracking-tight ${
          emphasis ? "text-[#DC2626]" : "text-[#1a1210]"
        }`}
      >
        {value}
      </p>
      {note && <p className="mt-1 text-xs text-[#9a8b7d] leading-snug">{note}</p>}
    </div>
  );
}

function Section({ title, lede, children }: { title: string; lede?: string; children: ReactNode }) {
  return (
    <section className="mt-9 break-inside-avoid">
      <h2 className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#1a1210] pb-2 border-b border-black/15">
        {title}
      </h2>
      {lede && <p className="mt-2 text-xs text-[#7a6a5d] leading-relaxed">{lede}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

const th = "text-left text-[10px] uppercase tracking-[0.12em] text-[#9a8b7d] font-bold py-2";
const td = "py-2.5 text-[13px] text-[#1a1210] border-t border-black/[0.07]";

/* ---------------------------------- page ---------------------------------- */

function StatementBody({ s }: { s: Statement }) {
  const shareSet = s.settings.venueSharePercent > 0;

  return (
    <>
      {/* -------------------------------- header ------------------------------- */}
      <header className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b-2 border-[#1a1210]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#DC2626] font-bold">
            Smart Scale LLC · Cypress, Texas
          </p>
          <h1 className="mt-1.5 text-3xl font-semibold text-[#1a1210] tracking-tight">
            Venue Statement
          </h1>
          <p className="mt-1 text-sm text-[#5c4f45]">
            Mex Taco House · digital screen advertising
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-[#1a1210]">{s.monthName}</p>
          <p className="text-xs text-[#7a6a5d] tabular-nums mt-0.5">
            {formatDate(s.from)} – {formatDate(s.to)}
          </p>
          {s.settings.venueOwnerName && (
            <p className="mt-3 text-xs text-[#7a6a5d]">
              Prepared for
              <br />
              <span className="text-sm font-semibold text-[#1a1210]">
                {s.settings.venueOwnerName}
              </span>
            </p>
          )}
        </div>
      </header>

      {/* ------------------------------- the money ----------------------------- */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <Figure
          label="Collected this month"
          value={money(s.collected)}
          note="Payments received between the dates above"
        />
        <Figure
          label={`Venue share${shareSet ? ` · ${s.settings.venueSharePercent}%` : ""}`}
          value={shareSet ? money(s.venueShare) : "—"}
          note={shareSet ? "Due to the venue" : "No share percentage set"}
          emphasis={shareSet}
        />
        <Figure
          label="Retained"
          value={shareSet ? money(s.retained) : money(s.collected)}
          note="Smart Scale, after the venue share"
        />
      </div>

      {!shareSet && (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900 leading-relaxed">
          No revenue share has been set, so this statement reports collections
          without splitting them. Set the percentage on the Venue tab and the
          figures above will resolve.
        </p>
      )}

      {/* ------------------------------- payments ------------------------------ */}
      <Section
        title="Payments received"
        lede="Every payment recorded against the period, in the order it arrived. This is the basis for the share above — nothing invoiced but unpaid is counted."
      >
        {s.lines.every((l) => l.payments.length === 0) && s.unattributed.length === 0 ? (
          <p className="text-[13px] text-[#7a6a5d] py-3">
            No payments recorded for this month.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Date</th>
                <th className={th}>Advertiser</th>
                <th className={th}>Method</th>
                <th className={th}>Reference</th>
                <th className={`${th} text-right`}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {[...s.lines.flatMap((l) => l.payments), ...s.unattributed]
                .sort((a, b) => a.receivedOn.localeCompare(b.receivedOn))
                .map((p) => (
                  <tr key={p.id}>
                    <td className={`${td} tabular-nums whitespace-nowrap`}>
                      {formatDate(p.receivedOn)}
                    </td>
                    <td className={`${td} font-medium`}>{p.business}</td>
                    <td className={td}>{methodLabel(p.method)}</td>
                    <td className={`${td} text-[#7a6a5d] font-mono text-[11px]`}>
                      {p.reference || "—"}
                    </td>
                    <td className={`${td} text-right tabular-nums font-semibold`}>
                      {money(p.amount)}
                    </td>
                  </tr>
                ))}
              <tr>
                <td className={`${td} border-t-2 border-black/25`} colSpan={4}>
                  <span className="text-[11px] uppercase tracking-[0.12em] font-bold text-[#1a1210]">
                    Total collected
                  </span>
                </td>
                <td
                  className={`${td} border-t-2 border-black/25 text-right tabular-nums font-bold text-base`}
                >
                  {money(s.collected)}
                </td>
              </tr>
              {shareSet && (
                <tr>
                  <td className={td} colSpan={4}>
                    <span className="text-[11px] uppercase tracking-[0.12em] font-bold text-[#DC2626]">
                      Venue share at {s.settings.venueSharePercent}%
                    </span>
                  </td>
                  <td className={`${td} text-right tabular-nums font-bold text-base text-[#DC2626]`}>
                    {money(s.venueShare)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Section>

      {/* ------------------------------ performance ---------------------------- */}
      <Section
        title="What ran, and how it performed"
        lede="Scans are people pointing a phone at an advertiser's code and opening their page — a measured action, not an impression."
      >
        <table className="w-full">
          <thead>
            <tr>
              <th className={th}>Advertiser</th>
              <th className={th}>Category</th>
              <th className={th}>Plan</th>
              <th className={`${th} text-right`}>Scans</th>
              <th className={`${th} text-right`}>Last month</th>
              <th className={`${th} text-right`}>Collected</th>
            </tr>
          </thead>
          <tbody>
            {s.lines.map((l) => (
              <tr key={l.advertiserId}>
                <td className={`${td} font-medium`}>{l.business}</td>
                <td className={`${td} text-[#5c4f45]`}>{l.category || "—"}</td>
                <td className={`${td} text-[#5c4f45]`}>{l.planName}</td>
                <td className={`${td} text-right tabular-nums`}>{whole(l.scans)}</td>
                <td className={`${td} text-right tabular-nums text-[#9a8b7d]`}>
                  {whole(l.previousScans)}
                </td>
                <td className={`${td} text-right tabular-nums`}>
                  {l.collected > 0 ? money(l.collected) : "—"}
                </td>
              </tr>
            ))}
            <tr>
              <td className={`${td} border-t-2 border-black/25`} colSpan={3}>
                <span className="text-[11px] uppercase tracking-[0.12em] font-bold text-[#1a1210]">
                  Total
                </span>
              </td>
              <td className={`${td} border-t-2 border-black/25 text-right tabular-nums font-bold`}>
                {whole(s.scans)}
              </td>
              <td
                className={`${td} border-t-2 border-black/25 text-right tabular-nums text-[#9a8b7d]`}
              >
                {whole(s.previousScans)}
              </td>
              <td className={`${td} border-t-2 border-black/25 text-right tabular-nums font-bold`}>
                {money(s.collected)}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* ------------------------------ the rotation --------------------------- */}
      <Section title="The rotation">
        <div className="grid grid-cols-4 gap-3">
          <Figure label="Advertisers running" value={String(s.activeCount)} />
          <Figure label="Slots open" value={String(s.openSlots)} />
          <Figure
            label="Days on screen"
            value={String(s.openDays)}
            note="Closed Mondays"
          />
          <Figure
            label="Ad plays"
            value={whole(s.plays)}
            note="Estimated from the loop"
          />
        </div>
        {s.categories.length > 0 && (
          <p className="mt-4 text-xs text-[#7a6a5d] leading-relaxed">
            <span className="font-semibold text-[#1a1210]">Categories held:</span>{" "}
            {s.categories.join(" · ")}
          </p>
        )}
      </Section>

      {/* -------------------------------- upcoming ----------------------------- */}
      {s.upcoming.length > 0 && (
        <Section
          title="Terms ending soon"
          lede="Within 45 days of this period closing. Each is a renewal conversation, and a category that returns to the market if it lapses."
        >
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Advertiser</th>
                <th className={th}>Category</th>
                <th className={`${th} text-right`}>Term ends</th>
              </tr>
            </thead>
            <tbody>
              {s.upcoming.map((a) => (
                <tr key={a.id}>
                  <td className={`${td} font-medium`}>{a.business}</td>
                  <td className={`${td} text-[#5c4f45]`}>{a.category || "—"}</td>
                  <td className={`${td} text-right tabular-nums`}>
                    {formatDate(a.endDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* --------------------------------- notes ------------------------------- */}
      <Section title="How these figures were arrived at">
        <ul className="space-y-1.5 text-xs text-[#5c4f45] leading-relaxed list-disc pl-4">
          <li>
            <span className="font-semibold text-[#1a1210]">Collected</span> is the sum
            of payments recorded as received between {formatDate(s.from)} and{" "}
            {formatDate(s.to)}. Money invoiced but not yet received is not included.
          </li>
          {shareSet && (
            <li>
              <span className="font-semibold text-[#1a1210]">Venue share</span> is{" "}
              {s.settings.venueSharePercent}% of collected revenue, rounded to the
              cent.
            </li>
          )}
          <li>
            <span className="font-semibold text-[#1a1210]">Scans</span> are counted
            when a guest opens an advertiser&apos;s QR link. They are a measured
            action; impressions are not counted and are not claimed.
          </li>
          <li>
            <span className="font-semibold text-[#1a1210]">Ad plays</span> is an
            estimate, not a measurement: {s.openDays} open days against the
            three-minute rotation during posted hours. Mondays are closed.
          </li>
          <li>
            Guest counts are the venue&apos;s own figures and are not warranted by
            Smart Scale.
          </li>
        </ul>
      </Section>

      <footer className="mt-10 pt-4 border-t border-black/10 flex flex-wrap justify-between gap-3 text-[10px] text-[#9a8b7d]">
        <span>
          Smart Scale LLC · Mex Taco House digital advertising · {s.monthName}
        </span>
        <span className="tabular-nums">
          Prepared {formatDate(s.generatedAt.slice(0, 10))}
        </span>
      </footer>
    </>
  );
}

export default async function StatementPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  if (!(await isSignedIn())) redirect("/advertise/admin");

  const { month } = await params;
  if (!/^\d{4}-\d{2}$/.test(month)) notFound();

  const statement = await buildStatement(month);

  return (
    <main className="min-h-screen bg-[#e8e4de] py-8 print:bg-white print:py-0">
      {/* Controls, deliberately not printed. */}
      <div className="max-w-[8.5in] mx-auto px-6 mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <a
          href="/advertise/admin?tab=venue"
          className="text-sm font-semibold text-[#5c4f45] hover:text-[#1a1210]"
        >
          ← Back to the tracker
        </a>
        <div className="flex items-center gap-3">
          <a
            href={`/advertise/admin/statement/${previousOf(month)}`}
            className="text-sm font-semibold text-[#5c4f45] hover:text-[#1a1210]"
          >
            ← {monthLabel(previousOf(month))}
          </a>
          <span className="text-sm text-[#9a8b7d]">
            Print to PDF from your browser
          </span>
        </div>
      </div>

      <article className="max-w-[8.5in] mx-auto bg-white text-[#1a1210] px-10 py-10 shadow-lg print:shadow-none print:max-w-none print:px-0 print:py-0 font-sans">
        <StatementBody s={statement} />
      </article>
    </main>
  );
}

/** Local rather than imported, to keep the client-facing module free of helpers. */
function previousOf(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);
}

