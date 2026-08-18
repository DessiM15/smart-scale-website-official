import type { Metadata } from "next";
import { isAdminConfigured, isSignedIn } from "@/lib/ads/auth";
import { isRedisConfigured, isRedisReachable } from "@/lib/ads/redis";
import { listLinks } from "@/lib/ads/link-store";
import { getCodeStats } from "@/lib/ads/scan-store";
import { listAdvertisers, listProspects, summarize } from "@/lib/ads/roster";
import { recentRuns } from "@/lib/ads/notify";
import { findDueNotices, upcomingSchedule } from "@/lib/ads/renewals";
import { listResponses } from "@/lib/ads/responses";
import { listReports } from "@/lib/ads/reports";
import { signOutAction } from "./actions";
import { Banner } from "./_components/banner";
import { LockScreen } from "./_components/lock-screen";
import { OverviewTab } from "./_components/overview";
import { AdvertisersTab } from "./_components/advertisers";
import { ReportsTab } from "./_components/reports";
import { QrTab } from "./_components/qr-codes";
import { ProspectsTab } from "./_components/prospects";
import { TAB_IDS, tabHref, type LinkView, type TabId } from "./_components/types";
import { Note, btnGhost } from "./_components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ad Tracker",
  robots: { index: false, follow: false },
};

/**
 * Server actions redirect back with only a result code, so the tab is inferred
 * from what just happened — saving a QR code shouldn't drop you on Overview.
 */
const TAB_FOR_RESULT: Record<string, TabId> = {
  added: "advertisers",
  updated: "advertisers",
  removed: "advertisers",
  category: "advertisers",
  business: "advertisers",
  plan: "advertisers",
  startdate: "advertisers",
  linkAdded: "qr",
  linkSaved: "qr",
  linkOn: "qr",
  linkOff: "qr",
  code: "qr",
  codetaken: "qr",
  codemissing: "qr",
  destination: "qr",
  logotype: "qr",
  logosize: "qr",
  reportsDrafted: "reports",
  reportSent: "reports",
  reportSkipped: "reports",
  reportEdited: "reports",
  reportsend: "reports",
  prospect: "prospects",
  prospectRemoved: "prospects",
};

const TAB_LABEL: Record<TabId, string> = {
  overview: "Overview",
  advertisers: "Advertisers",
  reports: "Reports",
  qr: "QR codes",
  prospects: "Prospects",
};

function isTab(value: string | undefined): value is TabId {
  return TAB_IDS.includes(value as TabId);
}

function TabRail({
  active,
  counts,
}: {
  active: TabId;
  counts: Partial<Record<TabId, { value: number; urgent?: boolean }>>;
}) {
  return (
    <nav className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-px">
      {TAB_IDS.map((id) => {
        const on = id === active;
        const count = counts[id];
        return (
          <a
            key={id}
            href={tabHref(id)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              on
                ? "bg-white text-[#0A0A0A]"
                : "text-white/50 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            {TAB_LABEL[id]}
            {count && count.value > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums leading-none ${
                  count.urgent
                    ? "bg-[#DC2626] text-white"
                    : on
                      ? "bg-black/10 text-[#0A0A0A]"
                      : "bg-white/10 text-white/60"
                }`}
              >
                {count.value}
              </span>
            )}
          </a>
        );
      })}
    </nav>
  );
}

function DatabaseWarning({ reachable }: { reachable: boolean }) {
  if (!isRedisConfigured()) {
    return (
      <div className="mb-6">
        <Note tone="warn">
          <p className="text-sm font-semibold text-white">
            No database connected — nothing you enter here will save.
          </p>
          <p className="mt-1.5 text-sm text-white/55">
            In Vercel: Storage → Create Database → Upstash Redis, connect it to this
            project, then redeploy.
          </p>
        </Note>
      </div>
    );
  }
  if (reachable) return null;
  return (
    <div className="mb-6">
      <Note tone="bad">
        <p className="text-sm font-semibold text-white">
          The database is configured but isn&apos;t responding — nothing will save.
        </p>
        <p className="mt-1.5 text-sm text-white/55">
          Usually this means the token was rotated in Upstash but Vercel still has the
          old one. In Vercel: Storage → your database → reveal the current values, make
          sure <code className="font-mono text-xs text-white/75">KV_REST_API_TOKEN</code>{" "}
          matches, then redeploy.
        </p>
      </Note>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    msg?: string;
    err?: string;
    clash?: string;
    edit?: string;
    sent?: string;
    checked?: string;
    detail?: string;
    editLink?: string;
  }>;
}) {
  const params = await searchParams;

  if (!(await isSignedIn())) {
    return (
      <LockScreen configured={isAdminConfigured()} wrong={params.err === "badkey"} />
    );
  }

  const [advertisers, prospects, dueNotices, schedule, runs, replies, databaseReachable, rawLinks] =
    await Promise.all([
      listAdvertisers(),
      listProspects(),
      findDueNotices(),
      upcomingSchedule(),
      recentRuns(),
      listResponses(),
      isRedisReachable(),
      listLinks(),
    ]);
  const reports = await listReports();

  const links: LinkView[] = await Promise.all(
    rawLinks.map(async (link) => ({
      ...link,
      scans: (await getCodeStats(link.code, 1)).total,
    })),
  );

  const editingLink = params.editLink
    ? links.find((l) => l.code === params.editLink)
    : undefined;
  const editing = params.edit
    ? advertisers.find((a) => a.id === params.edit)
    : undefined;

  const knownCodeSet = new Set(links.map((l) => l.code));
  const summary = summarize(advertisers);
  const needsAttention = [...summary.overdue, ...summary.expiring];
  const draftReports = reports.filter((r) => r.status === "draft").length;

  // An explicit tab wins; otherwise follow whatever the last action touched.
  const tab: TabId = isTab(params.tab)
    ? params.tab
    : params.edit
      ? "advertisers"
      : params.editLink
        ? "qr"
        : (TAB_FOR_RESULT[params.err ?? ""] ??
          TAB_FOR_RESULT[params.msg ?? ""] ??
          "overview");

  const openItems = needsAttention.length + replies.length;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-96"
        style={{
          background:
            "radial-gradient(70rem 30rem at 50% -8rem, rgba(220,38,38,0.10), transparent 70%)",
        }}
      />

      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#0A0A0A]/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 pt-7 pb-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#DC2626] font-semibold">
                Mex Taco House · Screen Advertising
              </p>
              <h1 className="mt-2 text-3xl sm:text-4xl text-white tracking-tight">
                Ad Tracker
              </h1>
            </div>
            <div className="flex items-center gap-2.5">
              <a href="/advertise/stats" className={btnGhost}>
                Scan report
              </a>
              <form action={signOutAction}>
                <button type="submit" className={btnGhost}>
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <div className="pb-3">
            <TabRail
              active={tab}
              counts={{
                overview: { value: openItems, urgent: true },
                advertisers: { value: advertisers.length },
                reports: { value: draftReports, urgent: draftReports > 0 },
                qr: { value: links.length },
                prospects: { value: prospects.length },
              }}
            />
          </div>
        </div>
      </header>

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
        <DatabaseWarning reachable={databaseReachable} />

        <Banner
          msg={params.msg}
          err={params.err}
          clash={params.clash}
          sent={params.sent}
          checked={params.checked}
          detail={params.detail}
        />

        {tab === "overview" && (
          <OverviewTab
            summary={summary}
            needsAttention={needsAttention}
            due={dueNotices}
            schedule={schedule}
            runs={runs}
            replies={replies}
          />
        )}

        {tab === "advertisers" && (
          <AdvertisersTab
            advertisers={advertisers}
            summary={summary}
            knownCodes={knownCodeSet}
            links={links}
            editing={editing}
          />
        )}

        {tab === "reports" && <ReportsTab reports={reports} />}

        {tab === "qr" && <QrTab links={links} editing={editingLink} />}

        {tab === "prospects" && <ProspectsTab prospects={prospects} />}

        <p className="mt-12 text-xs text-white/25 max-w-2xl leading-relaxed">
          End dates are calculated from each package term, in Houston time. QR codes are
          managed on the QR codes tab — a code shown in red on an advertiser exists on
          that record but not in the registry, so scanning it would fall through to the
          advertise page.
        </p>
      </div>
    </main>
  );
}
