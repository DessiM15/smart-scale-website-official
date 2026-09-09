import type { Metadata } from "next";
import { Suspense } from "react";
import { buildBoard } from "@/lib/ads/board";
import { collectFacts, writeBriefing } from "@/lib/ads/briefing";
import { monthBook } from "@/lib/ads/expected";
import { currentWho } from "@/lib/ads/who";
import { historyOn, listHistory } from "@/lib/ads/tasks";
import { venueOf } from "@/lib/ads/venues";
import { PageHeader } from "../_components/shell";
import { BriefingLine, DoneToday, ExpiringSoon, TheBoard, TodayList } from "../_components/today";
import { ADMIN } from "../_components/types";
import { btnPrimary, money, Tile } from "../_components/ui";
import { Shell } from "./shell";
import { todayData } from "./nav-counts";

export const metadata: Metadata = { title: "Today" };

function greeting(who: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", hour12: false }).format(new Date()),
  );
  const part = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return who ? `${part}, ${who}.` : `${part}.`;
}

function todayLine(): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

/**
 * Streamed in after the page paints. The model never writes a number; the
 * facts are computed here and only the wording is its own.
 */
async function Briefing() {
  const data = await todayData();
  const briefing = await writeBriefing(
    collectFacts(data.summary, {
      newLeads: data.newLeads.length,
      replies: data.replies.length,
      unsigned: data.summary.unsigned.length,
      followUps: data.followUps.length,
    }),
  );
  return <BriefingLine text={briefing.text} />;
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string; detail?: string; sent?: string; checked?: string }>;
}) {
  const [params, data, who, history] = await Promise.all([searchParams, todayData(), currentWho(), listHistory(60)]);
  const venue = venueOf();
  const board = buildBoard(data.advertisers, data.prospects, venue.id);
  const month = monthBook(data.advertisers, data.payments, data.asOf.slice(0, 7), data.asOf);
  const expiringSoon = [...data.summary.overdue, ...data.summary.expiring].slice(0, 5);
  const within30 = data.summary.expiring.filter((v) => v.daysRemaining <= 30);
  const onTheLine = within30.reduce((sum, v) => sum + v.monthly, 0);
  const followUpsJay = data.followUps.filter((p) => p.log?.[p.log.length - 1]?.who === "Jay").length;

  return (
    <Shell active="today" banner={params}>
      <PageHeader
        eyebrow={`${todayLine()} · ${venue.name}`}
        title={greeting(who)}
        action={
          <a href={`${ADMIN}/pipeline#prospect-add`} className={btnPrimary}>
            + New prospect
          </a>
        }
      />

      <Suspense fallback={null}>
        <Briefing />
      </Suspense>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Tile
          label="New leads"
          value={String(data.newLeads.length)}
          hint={data.newLeads.length ? "from the advertise page, not yet worked" : "nothing new from the advertise page"}
          tone={data.newLeads.length ? "alert" : "plain"}
        />
        <Tile
          label="Expiring within 30 days"
          value={String(within30.length + data.summary.overdue.length)}
          hint={
            within30.length + data.summary.overdue.length
              ? `${money(onTheLine)} a month on the line${data.summary.overdue.length ? ` · ${data.summary.overdue.length} already ended` : ""}`
              : "every term has more than a month left"
          }
          tone={data.summary.overdue.length ? "alert" : within30.length ? "warn" : "plain"}
        />
        <Tile
          label="Follow-ups due"
          value={String(data.followUps.length)}
          hint={
            data.followUps.length
              ? `${data.followUps.filter((p) => (p.followUpDate ?? "") < data.asOf).length} overdue${followUpsJay ? ` · ${followUpsJay} last touched by Jay` : ""}`
              : "nobody waiting on a call"
          }
          tone={data.followUps.some((p) => (p.followUpDate ?? "") < data.asOf) ? "warn" : "plain"}
        />
        <Tile
          label="Collected this month"
          value={money(month.collected)}
          hint={`of ${money(month.expected)} expected${month.outstanding > 0 ? ` · ${money(month.outstanding)} outstanding` : ""}`}
          tone={month.counts.late > 0 ? "alert" : month.collected > 0 ? "ok" : "plain"}
        />
      </div>

      <div className="grid lg:grid-cols-[1.25fr_1fr] gap-5 items-start">
        <TodayList items={data.items} returnTo={ADMIN} />
        <div className="flex flex-col gap-5">
          <TheBoard board={board} />
          <ExpiringSoon items={expiringSoon} />
        </div>
      </div>

      <div className="mt-5">
        <DoneToday entries={historyOn(history, data.asOf)} />
      </div>
    </Shell>
  );
}
