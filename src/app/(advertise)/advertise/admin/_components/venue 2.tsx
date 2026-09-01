/**
 * The venue side of the business: what the owner is owed, and the statements
 * that say so.
 *
 * Kept apart from the advertiser tabs because it answers a different question.
 * Everything else here is about selling and running ads; this is about settling
 * up with the person whose screens they run on.
 */

import { saveVenueSettingsAction } from "../actions";
import type { Settings } from "@/lib/ads/settings";
import { monthLabel } from "@/lib/ads/statement";
import {
  Card,
  Field,
  Note,
  Tile,
  btnGhost,
  btnPrimary,
  labelClass,
  inputClass,
  money,
  stamp,
} from "./ui";

/** The last twelve complete months, newest first. */
function recentMonths(from: Date, count = 12): string[] {
  const months: string[] = [];
  for (let i = 1; i <= count; i += 1) {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - i, 1));
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

export function VenueTab({
  settings,
  collectedThisMonth,
  currentMonth,
}: {
  settings: Settings;
  collectedThisMonth: number;
  currentMonth: string;
}) {
  const share = settings.venueSharePercent;
  const months = recentMonths(new Date(`${currentMonth}-01T12:00:00Z`));

  return (
    <>
      <Card
        title="The split"
        lede="What the venue owner takes of what advertisers actually pay. Changing it here takes effect on the next statement — it never rewrites one already issued."
        className="mb-5"
      >
        {share === 0 && (
          <div className="mb-5">
            <Note tone="warn">
              <p className="text-sm font-semibold text-white">
                No revenue share is set.
              </p>
              <p className="mt-1.5 text-sm text-white/55">
                Statements will report what was collected without splitting it.
                Set the percentage you agreed and they&apos;ll resolve.
              </p>
            </Note>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Tile
            label="Their share"
            value={share > 0 ? `${share}%` : "—"}
            hint="of collected revenue"
          />
          <Tile
            label="Collected this month"
            value={money(collectedThisMonth)}
            hint={monthLabel(currentMonth)}
          />
          <Tile
            label="Owed so far"
            value={money(Math.round(collectedThisMonth * (share / 100) * 100) / 100)}
            hint="month to date"
            tone={share > 0 ? "alert" : "plain"}
          />
        </div>

        <form action={saveVenueSettingsAction} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass} htmlFor="venueSharePercent">
                Their percentage
              </label>
              <input
                id="venueSharePercent"
                name="venueSharePercent"
                inputMode="decimal"
                defaultValue={share ? String(share) : ""}
                placeholder="30"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-white/30">
                Of money collected, not money invoiced.
              </p>
            </div>
            <Field
              label="Owner's name"
              name="venueOwnerName"
              id="venueOwnerName"
              defaultValue={settings.venueOwnerName}
              placeholder="Who the statement is addressed to"
            />
            <Field
              label="Owner's email"
              name="venueOwnerEmail"
              id="venueOwnerEmail"
              type="email"
              defaultValue={settings.venueOwnerEmail}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className={btnPrimary}>
              Save
            </button>
            {settings.updatedAt && (
              <span className="text-xs text-white/30">
                Last changed {stamp(settings.updatedAt)}
              </span>
            )}
          </div>
        </form>
      </Card>

      <Card
        title="Monthly statements"
        lede="One per month, showing every payment received, what each advertiser did, and the share owed. Open one and print it to PDF."
      >
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {months.map((month) => (
            <li key={month}>
              <a
                href={`/advertise/admin/statement/${month}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 hover:border-white/25 hover:bg-white/[0.04] transition-colors"
              >
                <span className="text-sm font-semibold text-white">
                  {monthLabel(month)}
                </span>
                <span className="text-xs text-white/30">open →</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs text-white/30 leading-relaxed">
          A statement is built when you open it, from the payments and scans on
          record at that moment. Record payments on each client&apos;s profile —
          anything not recorded there is money the statement cannot count.
        </p>
        <div className="mt-5">
          <a href={`/advertise/admin/statement/${currentMonth}`} className={btnGhost}>
            This month so far
          </a>
        </div>
      </Card>
    </>
  );
}
