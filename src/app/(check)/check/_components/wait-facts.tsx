"use client";

import { useEffect, useState } from "react";
import { WAIT_FACTS } from "./facts";
import { eyebrow, panel } from "./ui";

const EVERY_MS = 9000;

const control =
  "rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/**
 * Something to read while the check runs: one short fact at a time, changing
 * every few seconds. It can be paused, because text that changes on its own
 * is hard to read for some people, and it is not announced by a screen reader
 * each time it changes, because the step above it already is.
 */
export function WaitFacts({ seed }: { seed: string }) {
  // Starts at a different fact for each check, the same on server and browser.
  const start = [...seed].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % WAIT_FACTS.length;
  const [shown, setShown] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => setShown((n) => n + 1), EVERY_MS);
    return () => clearTimeout(timer);
  }, [paused, shown]);

  const fact = WAIT_FACTS[(start + shown) % WAIT_FACTS.length];

  return (
    <section aria-labelledby="wait-facts-heading" className={`mt-6 ${panel}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="wait-facts-heading" className={eyebrow}>
          While you wait
        </h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPaused((p) => !p)} className={control}>
            {paused ? "Resume" : "Pause"}
          </button>
          <button type="button" onClick={() => setShown((n) => n + 1)} className={control}>
            Next<span className="sr-only"> fact</span>
          </button>
        </div>
      </div>
      <div key={shown} className="wait-fact mt-5 min-h-[9.5rem] sm:min-h-[7rem]">
        <p className="text-lg font-semibold text-white">{fact.topic}</p>
        <p className="mt-2 leading-relaxed text-white/65">{fact.text}</p>
      </div>
    </section>
  );
}
