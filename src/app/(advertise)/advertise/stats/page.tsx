import type { Metadata } from "next";
import {
  AD_LINKS,
  type AdLink,
} from "@/lib/ads/advertisers";
import {
  getStatsForCodes,
  isScanStoreConfigured,
  localStamp,
  type CodeStats,
  type ScanEvent,
} from "@/lib/ads/scan-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scan Report",
  robots: { index: false, follow: false },
};

const SITE = "https://smartscaleagent.com";
const RANGES = [7, 30, 90] as const;

/* ------------------------------- primitives ------------------------------- */

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white border border-black/[0.06] px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[#9a8b7d] font-semibold">
        {label}
      </p>
      <p className="mt-1.5 text-3xl font-semibold text-[#1a1210] tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-[#9a8b7d]">{hint}</p>}
    </div>
  );
}

function shortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

/**
 * Daily scans. One series, so one hue and no legend — the heading names it.
 * Days with no scans keep their slot as a hairline so gaps stay visible
 * instead of silently collapsing the timeline.
 */
function DailyScans({ series }: { series: { date: string; count: number }[] }) {
  const max = Math.max(1, ...series.map((p) => p.count));
  const tickEvery = Math.ceil(series.length / 6);

  return (
    <figure className="mt-1">
      <div
        role="img"
        aria-label={`Daily scans from ${series[0]?.date} to ${series[series.length - 1]?.date}. Peak of ${max} in a single day.`}
      >
        <div className="flex items-end gap-[2px] h-36">
          {series.map((point) => {
            const pct = point.count === 0 ? 0 : Math.max(6, (point.count / max) * 100);
            return (
              <div key={point.date} className="relative flex-1 h-full flex items-end group">
                {point.count === 0 ? (
                  <div className="w-full h-[2px] rounded-full bg-black/[0.06]" />
                ) : (
                  <div
                    className="w-full rounded-t-[4px] bg-[#DC2626]/80 group-hover:bg-[#DC2626] transition-colors duration-150"
                    style={{ height: `${pct}%` }}
                  />
                )}
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <span className="block whitespace-nowrap rounded-lg bg-[#1a1210] text-white text-xs px-2.5 py-1.5 shadow-lg">
                    <span className="font-semibold">{point.count}</span>
                    <span className="text-white/50"> scan{point.count === 1 ? "" : "s"} · </span>
                    {shortDate(point.date)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-[2px] mt-2">
          {series.map((point, i) => (
            <span
              key={point.date}
              className="flex-1 text-center text-[10px] text-[#9a8b7d] tabular-nums"
            >
              {i % tickEvery === 0 ? shortDate(point.date) : " "}
            </span>
          ))}
        </div>
      </div>

      <details className="mt-3 group">
        <summary className="text-xs text-[#7a6a5d] cursor-pointer hover:text-[#1a1210] select-none">
          View as table
        </summary>
        <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-black/[0.06]">
          <table className="w-full text-xs">
            <thead className="bg-[#faf6f0] sticky top-0">
              <tr>
                <th className="text-left font-semibold text-[#7a6a5d] px-3 py-2">Date</th>
                <th className="text-right font-semibold text-[#7a6a5d] px-3 py-2">Scans</th>
              </tr>
            </thead>
            <tbody>
              {[...series].reverse().map((p) => (
                <tr key={p.date} className="border-t border-black/[0.05]">
                  <td className="px-3 py-1.5 text-[#5c4f45]">{p.date}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[#1a1210]">
                    {p.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

const OPEN_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14];
const HOUR_LABELS = ["6a", "7a", "8a", "9a", "10a", "11a", "12p", "1p", "2p"];

/** Scans by hour, on the same 6a–2p axis as the popular-times chart. */
function ScansByHour({ byHour }: { byHour: number[] }) {
  const inHours = OPEN_HOURS.map((h) => byHour[h] ?? 0);
  const outOfHours = byHour.reduce(
    (sum, v, h) => (OPEN_HOURS.includes(h) ? sum : sum + v),
    0,
  );
  const max = Math.max(1, ...inHours);

  return (
    <div>
      <div
        role="img"
        aria-label={`Scans by hour of day, 6 AM to 2 PM. Busiest hour: ${HOUR_LABELS[inHours.indexOf(max)]}.`}
      >
        <div className="grid grid-cols-9 gap-[3px] items-end h-24">
          {inHours.map((count, i) => (
            <div key={i} className="relative h-full flex items-end group">
              {count === 0 ? (
                <div className="w-full h-[2px] rounded-full bg-black/[0.06]" />
              ) : (
                <div
                  className="w-full rounded-t-[4px] bg-[#f0c674] group-hover:bg-[#e0b45a] transition-colors duration-150"
                  style={{ height: `${Math.max(8, (count / max) * 100)}%` }}
                />
              )}
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <span className="block whitespace-nowrap rounded-lg bg-[#1a1210] text-white text-xs px-2.5 py-1.5 shadow-lg">
                  <span className="font-semibold">{count}</span>
                  <span className="text-white/50"> · </span>
                  {HOUR_LABELS[i]}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-9 gap-[3px] mt-2">
          {HOUR_LABELS.map((h) => (
            <span key={h} className="text-center text-[10px] text-[#9a8b7d]">
              {h}
            </span>
          ))}
        </div>
      </div>
      {outOfHours > 0 && (
        <p className="mt-2 text-[11px] text-[#9a8b7d]">
          Plus {outOfHours} scan{outOfHours === 1 ? "" : "s"} outside opening hours —
          people revisiting the link later.
        </p>
      )}
    </div>
  );
}

function DeviceSplit({ byDevice }: { byDevice: CodeStats["byDevice"] }) {
  const rows = [
    { label: "iPhone", value: byDevice.ios },
    { label: "Android", value: byDevice.android },
    { label: "Other", value: byDevice.other },
  ];
  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <dl className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <dt className="w-16 text-xs text-[#7a6a5d]">{row.label}</dt>
          <dd className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-black/[0.05] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#DC2626]/70"
                style={{ width: `${total ? (row.value / total) * 100 : 0}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs tabular-nums text-[#1a1210]">
              {row.value}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function RecentScans({ events }: { events: ScanEvent[] }) {
  if (events.length === 0) {
    return <p className="text-xs text-[#9a8b7d]">No scans recorded yet.</p>;
  }
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
      {events.slice(0, 20).map((e, i) => (
        <li key={`${e.t}-${i}`} className="flex items-baseline justify-between gap-3 text-xs">
          <span className="text-[#5c4f45]">{fmt.format(new Date(e.t))}</span>
          <span className="text-[#9a8b7d]">
            {[e.city, e.region].filter(Boolean).join(", ") || "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ advertiser card ---------------------------- */

function AdvertiserCard({
  link,
  stats,
  days,
}: {
  link: AdLink;
  stats: CodeStats;
  days: number;
}) {
  const scanUrl = `${SITE}/go/${link.code}`;
  return (
    <section className="rounded-3xl bg-white border border-black/[0.06] shadow-lg shadow-black/[0.04] p-6 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-black/[0.06]">
        <div>
          <h2 className="text-xl font-semibold text-[#1a1210]">{link.advertiser}</h2>
          <p className="mt-1 text-sm text-[#7a6a5d]">
            {link.category}
            {link.startedOn && ` · live since ${link.startedOn}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#9a8b7d]">QR points to</p>
          <p className="text-sm font-mono text-[#DC2626]">{scanUrl.replace("https://", "")}</p>
          <p className="mt-0.5 text-xs text-[#9a8b7d] truncate max-w-[16rem]">
            → {link.destination.replace(/^https?:\/\//, "")}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        <Tile label={`Last ${days} days`} value={stats.windowTotal.toLocaleString()} hint="scans" />
        <Tile label="Last 7 days" value={stats.last7.toLocaleString()} hint="scans" />
        <Tile label="Today" value={stats.today.toLocaleString()} hint="so far" />
        <Tile
          label="All time"
          value={stats.total.toLocaleString()}
          hint={`${stats.uniqueDevices.toLocaleString()} unique phones`}
        />
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-[#1a1210] mb-3">
          Scans per day — last {days} days
        </h3>
        <DailyScans series={stats.series} />
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-8 pt-6 border-t border-black/[0.06]">
        <div className="md:col-span-1">
          <h3 className="text-sm font-semibold text-[#1a1210] mb-3">When people scan</h3>
          <ScansByHour byHour={stats.byHour} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#1a1210] mb-3">Phone type</h3>
          <DeviceSplit byDevice={stats.byDevice} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#1a1210] mb-3">Latest scans</h3>
          <RecentScans events={stats.recent} />
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- the page -------------------------------- */

function LockScreen({ wrong }: { wrong: boolean }) {
  return (
    <main className="min-h-screen bg-[#faf6f0] flex items-center justify-center px-6">
      <form className="w-full max-w-sm rounded-3xl bg-white border border-black/[0.06] shadow-lg shadow-black/[0.04] p-8">
        <h1 className="text-2xl font-semibold text-[#1a1210]">Scan Report</h1>
        <p className="mt-2 text-sm text-[#7a6a5d]">
          Mex Taco House screen advertising. Enter the access key to continue.
        </p>
        <input
          type="password"
          name="key"
          autoFocus
          placeholder="Access key"
          className="mt-6 w-full rounded-xl border border-black/[0.1] bg-[#faf6f0] px-4 py-3 text-[#1a1210] placeholder:text-[#9a8b7d] focus:outline-none focus:border-[#DC2626]"
        />
        {wrong && <p className="mt-2 text-xs text-[#DC2626]">That key didn&apos;t work.</p>}
        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-[#DC2626] text-white font-semibold py-3 hover:bg-[#b91c1c] transition-colors"
        >
          View report
        </button>
      </form>
    </main>
  );
}

function SetupNotice() {
  return (
    <div className="rounded-2xl border border-[#f0c674] bg-[#fdf6e6] px-5 py-4 mb-8">
      <p className="text-sm font-semibold text-[#1a1210]">Scan counting is not switched on yet.</p>
      <p className="mt-1 text-sm text-[#5c4f45]">
        The redirects work and guests reach the advertisers, but nothing is being counted
        until <code className="font-mono text-xs">UPSTASH_REDIS_REST_URL</code> and{" "}
        <code className="font-mono text-xs">UPSTASH_REDIS_REST_TOKEN</code> are set in the
        Vercel project.
      </p>
    </div>
  );
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; days?: string }>;
}) {
  const params = await searchParams;
  const expected = process.env.ADS_STATS_KEY;

  if (!expected || !params.key || params.key !== expected) {
    return <LockScreen wrong={Boolean(params.key)} />;
  }

  const days = RANGES.includes(Number(params.days) as (typeof RANGES)[number])
    ? Number(params.days)
    : 30;

  const active = AD_LINKS.filter((l) => l.active);
  const retired = AD_LINKS.filter((l) => !l.active);
  const configured = isScanStoreConfigured();
  // Fetched unconditionally: with no database wired up the store returns zeroed
  // stats, which still renders every advertiser card. An empty page would look
  // like "no ads" rather than "not counting yet".
  const stats = await getStatsForCodes(
    [...active, ...retired].map((l) => l.code),
    days,
  );
  const byCode = new Map(stats.map((s) => [s.code, s]));

  const windowTotal = stats.reduce((sum, s) => sum + s.windowTotal, 0);
  const todayTotal = stats.reduce((sum, s) => sum + s.today, 0);
  const allTime = stats.reduce((sum, s) => sum + s.total, 0);
  const generatedAt = localStamp();

  const rangeHref = (d: number) =>
    `/advertise/stats?key=${encodeURIComponent(params.key!)}&days=${d}`;

  return (
    <main className="min-h-screen bg-[#faf6f0] px-5 sm:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-wrap items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#DC2626] font-semibold">
              Mex Taco House · Screen Advertising
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-[#1a1210]">
              Scan Report
            </h1>
            <p className="mt-2 text-sm text-[#7a6a5d]">
              Every QR scan from the dining-room screens. Updated live · {generatedAt.date}{" "}
              (restaurant time).
            </p>
          </div>
          <nav className="flex gap-2" aria-label="Date range">
            {RANGES.map((r) => (
              <a
                key={r}
                href={rangeHref(r)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  r === days
                    ? "bg-[#DC2626] text-white shadow-md shadow-red-900/20"
                    : "bg-white text-[#7a6a5d] border border-black/[0.06] hover:border-[#DC2626]/30 hover:text-[#1a1210]"
                }`}
              >
                {r} days
              </a>
            ))}
          </nav>
        </header>

        {!configured && <SetupNotice />}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          <Tile
            label={`Scans · last ${days} days`}
            value={windowTotal.toLocaleString()}
            hint="across every ad"
          />
          <Tile label="Scans today" value={todayTotal.toLocaleString()} hint="so far" />
          <Tile label="Scans all time" value={allTime.toLocaleString()} />
          <Tile
            label="Ads in rotation"
            value={`${active.length}`}
            hint={`${Math.max(0, 16 - active.length)} of 16 slots open`}
          />
        </div>

        <div className="space-y-6">
          {active.map((link) => {
            const s = byCode.get(link.code);
            return s ? (
              <AdvertiserCard key={link.code} link={link} stats={s} days={days} />
            ) : null;
          })}
        </div>

        {retired.length > 0 && (
          <details className="mt-10">
            <summary className="cursor-pointer text-sm font-semibold text-[#7a6a5d] hover:text-[#1a1210]">
              Retired ads ({retired.length})
            </summary>
            <div className="space-y-6 mt-4">
              {retired.map((link) => {
                const s = byCode.get(link.code);
                return s ? (
                  <AdvertiserCard key={link.code} link={link} stats={s} days={days} />
                ) : null;
              })}
            </div>
          </details>
        )}

        <p className="mt-12 text-xs text-[#9a8b7d] max-w-2xl">
          A scan is one visit to a{" "}
          <code className="font-mono">smartscaleagent.com/go/…</code> link from the
          restaurant screens. Known crawlers and link previewers are excluded. Unique
          phones is an estimate from a one-way hash of network address and device type —
          no personal data is stored.
        </p>
      </div>
    </main>
  );
}
