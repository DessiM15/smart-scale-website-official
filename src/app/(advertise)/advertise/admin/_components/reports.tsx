/**
 * Monthly reports. Every figure is measured; the wording is drafted for you,
 * and nothing leaves the building until it is approved here.
 */

import {
  editReportAction,
  generateReportsAction,
  sendReportAction,
  skipReportAction,
} from "../actions";
import { isNarrativeConfigured } from "@/lib/ads/narrative";
import type { MonthlyReport } from "@/lib/ads/reports";
import {
  Card,
  Empty,
  Pill,
  btnPrimary,
  btnSolid,
  inputClass,
  linkQuiet,
} from "./ui";

function ReportCard({ report }: { report: MonthlyReport }) {
  const f = report.facts;
  const sent = report.status === "sent";
  const skipped = report.status === "skipped";

  return (
    <li className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">
            {report.business}
            <span className="font-normal text-white/40"> · {f.monthName}</span>
          </p>
          <p className="text-xs text-white/35 mt-0.5">
            to {report.email}
            {report.narrative.source === "claude"
              ? " · written by Claude"
              : " · plain summary"}
            {report.narrative.rejectedReason
              ? ` (${report.narrative.rejectedReason})`
              : ""}
          </p>
        </div>
        <Pill tone={sent ? "ok" : skipped ? "neutral" : "warn"}>
          {sent ? "Sent" : skipped ? "Skipped" : "Awaiting review"}
        </Pill>
      </div>

      <div className="flex flex-wrap items-baseline gap-6 mt-5">
        <span>
          <span className="text-2xl font-semibold text-white tabular-nums">
            {f.scans.toLocaleString()}
          </span>{" "}
          <span className="text-xs uppercase tracking-[0.14em] text-white/35 font-semibold">
            scans
          </span>
        </span>
        <span>
          <span className="text-2xl font-semibold text-white tabular-nums">
            {f.plays.toLocaleString()}
          </span>{" "}
          <span className="text-xs uppercase tracking-[0.14em] text-white/35 font-semibold">
            plays
          </span>
        </span>
        {f.changePercent !== null && (
          <span
            className={`text-sm ${f.changePercent >= 0 ? "text-emerald-300" : "text-[#f87171]"}`}
          >
            {f.changePercent >= 0 ? "▲" : "▼"} {Math.abs(f.changePercent)}%
            <span className="text-white/35"> on {f.previousScans}</span>
          </span>
        )}
      </div>

      {sent ? (
        <div className="mt-5 text-sm text-white/55">
          <p className="font-semibold text-white">{report.narrative.headline}</p>
          <p className="mt-1.5 leading-relaxed">{report.narrative.body}</p>
        </div>
      ) : (
        <form action={editReportAction} className="mt-5 space-y-3">
          <input type="hidden" name="advertiserId" value={report.advertiserId} />
          <input type="hidden" name="month" value={report.month} />
          <input
            name="headline"
            defaultValue={report.narrative.headline}
            className={inputClass}
            aria-label="Report headline"
          />
          <textarea
            name="body"
            rows={3}
            defaultValue={report.narrative.body}
            className={inputClass}
            aria-label="Report wording"
          />
          <button type="submit" className={linkQuiet}>
            Save wording
          </button>
        </form>
      )}

      {!sent && !skipped && (
        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-white/[0.06] pt-5">
          <form action={sendReportAction}>
            <input type="hidden" name="advertiserId" value={report.advertiserId} />
            <input type="hidden" name="month" value={report.month} />
            <button type="submit" className={btnPrimary}>
              Approve &amp; send
            </button>
          </form>
          <form action={skipReportAction}>
            <input type="hidden" name="advertiserId" value={report.advertiserId} />
            <input type="hidden" name="month" value={report.month} />
            <button type="submit" className={linkQuiet}>
              Skip this one
            </button>
          </form>
          <span className="text-xs text-white/30">
            Read it first — this goes straight to the advertiser.
          </span>
        </div>
      )}
    </li>
  );
}

export function ReportsTab({ reports }: { reports: MonthlyReport[] }) {
  const waiting = reports.filter((r) => r.status === "draft");
  const rest = reports.filter((r) => r.status !== "draft").slice(0, 6);
  const aiOn = isNarrativeConfigured();

  return (
    <Card
      title="Monthly reports"
      lede="Drafted on the first of each month. Every figure is measured — the wording is written for you, and nothing sends until you approve it."
      action={
        <form action={generateReportsAction}>
          <button type="submit" className={btnSolid}>
            Draft last month now
          </button>
        </form>
      }
    >
      <div className="mb-6">
        <Pill tone={aiOn ? "ok" : "neutral"}>
          {aiOn
            ? "Claude is writing the commentary"
            : "Plain summaries (no ANTHROPIC_API_KEY)"}
        </Pill>
      </div>

      {waiting.length === 0 && rest.length === 0 ? (
        <Empty>
          No reports yet. They appear on the first of the month for every active
          advertiser who has an email address and a QR code.
        </Empty>
      ) : (
        <>
          {waiting.length > 0 && (
            <ul className="space-y-4">
              {waiting.map((r) => (
                <ReportCard key={`${r.advertiserId}-${r.month}`} report={r} />
              ))}
            </ul>
          )}
          {rest.length > 0 && (
            <details className={waiting.length > 0 ? "mt-6" : ""}>
              <summary className="cursor-pointer text-sm font-semibold text-white/45 hover:text-white transition-colors">
                Already handled ({rest.length})
              </summary>
              <ul className="space-y-4 mt-4">
                {rest.map((r) => (
                  <ReportCard key={`${r.advertiserId}-${r.month}`} report={r} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </Card>
  );
}
