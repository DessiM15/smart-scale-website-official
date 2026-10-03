import type { Metadata } from "next";
import Link from "next/link";
import { BOOKING_URL } from "@/lib/business";
import { CLEAN_NOTE, NOT_LEGAL_LINE, RATING_LABEL, countLine, siteName, type LeadFinding, type Rating, type Severity } from "@/lib/wb/report";
import { getReport } from "@/lib/wb/store";
import { fixFromReportAction } from "../../actions";
import { FixButton } from "../../_components/fix-button";
import { buttonPrimary, buttonSecondary, eyebrow, lede, panel } from "../../_components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Website Report",
  robots: { index: false, follow: false },
};

const RATING_TONE: Record<Rating, string> = {
  good: "text-[#86EFAC]",
  fair: "text-[#FCD34D]",
  "needs-work": "text-[#FCA5A5]",
};

const SEVERITY: Record<Severity, { label: string; tone: string }> = {
  critical: { label: "Serious", tone: "border-[#F87171]/60 text-[#FCA5A5]" },
  serious: { label: "Serious", tone: "border-[#F87171]/60 text-[#FCA5A5]" },
  moderate: { label: "Moderate", tone: "border-[#FCD34D]/50 text-[#FCD34D]" },
  minor: { label: "Minor", tone: "border-white/30 text-white/80" },
};

const longDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric", year: "numeric" }).format(new Date(iso));

function Finding({ finding }: { finding: LeadFinding }) {
  const severity = SEVERITY[finding.severity] ?? SEVERITY.minor;
  return (
    <li className={panel}>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] ${severity.tone}`}>{severity.label}</span>
        <h3 className="text-lg font-semibold text-white [font-family:inherit]">{finding.title}</h3>
        {finding.count && <span className="text-sm text-white/65">{finding.count}</span>}
      </div>
      <p className="mt-3 leading-relaxed text-white/65">{finding.plain}</p>
      {finding.pages.length > 0 && (
        <p className="mt-3 text-sm text-white/65">
          Found on: <span className="break-words font-mono text-[13px] text-white/80">{finding.pages.join("  ")}</span>
        </p>
      )}
    </li>
  );
}

/**
 * The full report a visitor is sent to from the summary and from the email.
 * Every problem in plain words, and nothing about how to fix it: that is the
 * work we are offering to do. The address is unguessable and stops working
 * after 90 days.
 */
export default async function ReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const stored = await getReport(reportId);

  if (!stored) {
    return (
      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className={eyebrow}>Website report</p>
          <h1 className="mt-4 text-[clamp(32px,5vw,52px)] leading-[1.08]">This report is no longer here.</h1>
          <p className={`mt-6 ${lede}`}>Reports are kept for 90 days. Run the check again and you will have a fresh one in about a minute.</p>
          <div className="mt-10">
            <Link href="/check" className={buttonPrimary}>
              Check my website again
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { report } = stored;
  const clean = report.totals.problems === 0;

  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className={eyebrow}>Website report: {siteName(report)}</p>
        <h1 className="mt-4 text-[clamp(32px,5vw,52px)] leading-[1.08]">{countLine(report.totals)}.</h1>
        <p className={`mt-6 ${lede}`}>
          Checked on {longDate(report.scannedAt)}
          {report.pagesChecked.length > 0 && `, across ${report.pagesChecked.length} page${report.pagesChecked.length === 1 ? "" : "s"}`}, on a
          computer and at phone width. {clean && CLEAN_NOTE}
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {report.sections.map((section) => (
            <li key={section.id} className={panel}>
              <p className="text-sm text-white/65">{section.title}</p>
              <p className={`mt-2 text-2xl font-semibold ${RATING_TONE[section.rating]}`}>{RATING_LABEL[section.rating]}</p>
              <p className="mt-1 text-sm text-white/65">
                {section.problems === 0 ? "No problems found" : `${section.problems} problem${section.problems === 1 ? "" : "s"}`}
              </p>
            </li>
          ))}
        </ul>

        {report.sections.map((section) => (
          <section key={section.id} className="mt-14">
            <h2 className="text-2xl">{section.title}</h2>
            {section.findings.length === 0 ? (
              <p className="mt-4 leading-relaxed text-white/65">The automated check found nothing to report here.</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {section.findings.map((finding) => (
                  <Finding key={finding.id} finding={finding} />
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="mt-14 rounded-2xl border border-white/[0.09] border-t-[3px] border-t-[#DC2626] bg-[#131211] p-6 sm:p-8">
          <h2 className="text-2xl">{clean ? "Want a person to look?" : "Want us to fix these?"}</h2>
          <p className="mt-4 leading-relaxed text-white/65">
            {clean
              ? "A short call is free. We will look at how your business shows up on Google and tell you what we would do next."
              : "Press the button and we will call you within one business day. The call is free. If we can work in your site's code we fix it, and if we cannot we will tell you plainly what your options are."}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            {clean ? (
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" data-track="book_call" className={buttonPrimary}>
                Book a free call<span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <form action={fixFromReportAction}>
                <input type="hidden" name="reportId" value={reportId} />
                <FixButton from="report" />
              </form>
            )}
            <Link href="/check" className={buttonSecondary}>
              Check another site
            </Link>
          </div>
        </section>

        {report.pagesChecked.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl">Pages we checked</h2>
            <ul className="mt-4 space-y-2 text-white/65">
              {report.pagesChecked.map((page) => (
                <li key={page.path}>
                  <span className="font-mono text-[13px] text-white/80">{page.path}</span>
                  {page.title && <span> · {page.title}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-14 border-t border-white/[0.09] pt-6 text-sm leading-relaxed text-white/65">
          {NOT_LEGAL_LINE} An automated check finds the problems a machine can see, which is about a third of what a real visitor can run into.
          This report is kept for 90 days.
        </p>
      </div>
    </section>
  );
}
