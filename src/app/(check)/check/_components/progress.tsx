"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { CLEAN_NOTE, RATING_LABEL, STEP_LABELS, countLine, type Rating } from "@/lib/wb/report";
import { BOOKING_URL } from "@/lib/business";
import { fixFromScanAction } from "../actions";
import { FixButton } from "./fix-button";
import { buttonPrimary, buttonSecondary, eyebrow, lede, panel } from "./ui";
import { WaitFacts } from "./wait-facts";

type Status =
  | { state: "running"; step: string; stepIndex: number; stepCount: number }
  | {
      state: "completed";
      reportId: string;
      site: string;
      totals: { problems: number; serious: number };
      sections: { title: string; rating: Rating }[];
      top: { title: string; plain: string }[];
    }
  | { state: "failed" };

const RATING_TONE: Record<Rating, string> = {
  good: "text-[#86EFAC]",
  fair: "text-[#FCD34D]",
  "needs-work": "text-[#FCA5A5]",
};

/**
 * The page a visitor watches while their site is checked, and the summary it
 * turns into. Asks for the status every two seconds. The email goes out when
 * the scan completes whether or not this page is still open.
 */
export function CheckProgress({ scanId }: { scanId: string }) {
  const [status, setStatus] = useState<Status>({ state: "running", step: "load", stepIndex: 1, stepCount: 5 });
  const heading = useRef<HTMLHeadingElement>(null);
  /** True once a poll has come back "still running": the visitor watched it happen. */
  const watched = useRef(false);
  const done = status.state !== "running";

  useEffect(() => {
    if (done) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const ask = async () => {
      try {
        const res = await fetch(`/api/wb/scan/${scanId}`, { cache: "no-store" });
        const next = (await res.json()) as Status;
        if (stopped) return;
        setStatus(next);
        if (next.state !== "running") return;
        watched.current = true;
      } catch {
        // A dropped request is not news. Ask again.
      }
      if (!stopped) timer = setTimeout(ask, 2000);
    };
    timer = setTimeout(ask, 1000);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [scanId, done]);

  // When the result arrives, a keyboard or screen reader user is taken to it.
  // Opening a check that had already finished leaves focus alone, so the
  // first Tab still reaches the skip link.
  useEffect(() => {
    if (!done) return;
    if (watched.current) heading.current?.focus();
    if (status.state === "completed") track("check_completed", { problems: status.totals.problems });
  }, [done, status]);

  if (status.state === "running") {
    const current = Math.min(status.stepIndex, status.stepCount);
    const percent = Math.round((current / status.stepCount) * 100);
    const steps = Object.values(STEP_LABELS);
    return (
      <div>
        <p className={eyebrow}>Free website check</p>
        <h1 className="mt-4 text-[clamp(32px,5vw,52px)] leading-[1.08]">Checking your site now.</h1>
        <p className={`mt-6 ${lede}`}>This takes about a minute. You can close this page. We&apos;ll email the report.</p>
        <div className={`mt-10 ${panel}`}>
          <p role="status" className="text-lg text-white">
            Step {current} of {status.stepCount}: {STEP_LABELS[status.step] ?? "Working on it"}
          </p>
          <div
            role="progressbar"
            aria-label="Check progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/[0.12]"
          >
            {/* Glides toward the end of the current step, so it is never standing still. */}
            <div
              className="h-full rounded-full bg-[#DC2626] transition-[width] duration-[9000ms] ease-out motion-reduce:transition-none"
              style={{ width: `${percent}%` }}
            />
          </div>
          {/* The same steps as a list to watch. The line above already says it to a screen reader. */}
          {steps.length === status.stepCount && (
            <ol aria-hidden="true" className="mt-6 space-y-3">
              {steps.map((label, i) => {
                const n = i + 1;
                const isDone = n < current;
                const isNow = n === current;
                return (
                  <li key={label} className={`flex items-center gap-3 ${isDone ? "text-white/65" : isNow ? "text-white" : "text-white/55"}`}>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                        isDone ? "border-[#86EFAC] text-[#86EFAC]" : isNow ? "border-[#DC2626] bg-[#DC2626] text-white" : "border-white/25"
                      }`}
                    >
                      {isDone ? "\u2713" : n}
                    </span>
                    <span className={isNow ? "font-semibold" : ""}>{label}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
        <WaitFacts seed={scanId} />
      </div>
    );
  }

  if (status.state === "failed") {
    return (
      <div>
        <p className={eyebrow}>Free website check</p>
        <h1 ref={heading} tabIndex={-1} className="mt-4 text-[clamp(32px,5vw,52px)] leading-[1.08] outline-none">
          We couldn&apos;t reach your site.
        </h1>
        <p className={`mt-6 ${lede}`}>
          We&apos;ll check it by hand and email you. You do not need to do anything else. If you would like to talk it through sooner, pick a time
          and we will call you.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" data-track="book_call" className={buttonPrimary}>
            Book a free call<span className="sr-only"> (opens in a new tab)</span>
          </a>
          <Link href="/check" className={buttonSecondary}>
            Try a different address
          </Link>
        </div>
      </div>
    );
  }

  const clean = status.totals.problems === 0;
  return (
    <div>
      <p className={eyebrow}>Your website check: {status.site}</p>
      <h1 ref={heading} tabIndex={-1} className="mt-4 text-[clamp(32px,5vw,52px)] leading-[1.08] outline-none">
        {countLine(status.totals)}.
      </h1>
      <p className={`mt-6 ${lede}`}>
        {clean
          ? CLEAN_NOTE
          : "Each one is a specific thing on your site that gets in a visitor's way or makes you harder to find. The full report is on its way to your inbox."}
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {status.sections.map((section) => (
          <li key={section.title} className={panel}>
            <p className="text-sm text-white/65">{section.title}</p>
            <p className={`mt-2 text-2xl font-semibold ${RATING_TONE[section.rating]}`}>{RATING_LABEL[section.rating]}</p>
          </li>
        ))}
      </ul>

      {status.top.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl">What matters most</h2>
          <ol className="mt-5 space-y-4">
            {status.top.map((finding, i) => (
              <li key={finding.title} className={panel}>
                <p className="text-lg font-semibold text-white">
                  {i + 1}. {finding.title}
                </p>
                <p className="mt-2 leading-relaxed text-white/65">{finding.plain}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="mt-12 flex flex-wrap gap-4">
        {clean ? (
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" data-track="book_call" className={buttonPrimary}>
            Book a free call<span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <form action={fixFromScanAction}>
            <input type="hidden" name="scanId" value={scanId} />
            <FixButton from="summary" />
          </form>
        )}
        <Link href={`/check/report/${status.reportId}`} className={buttonSecondary}>
          See the full report
        </Link>
      </div>
      {!clean && <p className="mt-5 text-sm text-white/65">Press the button and we will call you within one business day. The call is free.</p>}
    </div>
  );
}
