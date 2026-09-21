/**
 * Locations: every venue whose screens carry ads, and the deal with each.
 *
 * One card per location with the room (screens, slides, hours), the owner,
 * what they are owed and when, the agreement on file, and a way to edit any
 * of it. The add form is the same form with nothing filled in, so a second
 * location is set up in one sitting without a deploy.
 */

import { deleteVenueDocumentAction, saveVenueAction, setVenueStatusAction, uploadVenueDocumentAction } from "../actions";
import { documentHref, type DocumentRecord } from "@/lib/ads/documents";
import { formatDate } from "@/lib/ads/roster";
import { monthLabel } from "@/lib/ads/statement";
import {
  describeHours,
  hasDeal,
  playsOnWeekday,
  VENUE_STATUSES,
  WEEKDAYS,
  type Venue,
  type VenueStatus,
} from "@/lib/ads/venues";
import { SubmitButton } from "./submit-button";
import { ADMIN } from "./types";
import {
  Badge,
  Card,
  Disclosure,
  Empty,
  Field,
  Note,
  SubHead,
  bebas,
  btnDanger,
  btnGhost,
  btnPrimary,
  btnSm,
  cardClass,
  inputClass,
  labelClass,
  linkQuiet,
  money,
  numClass,
  selectClass,
  serif,
  stamp,
  type Tone,
} from "./ui";

const PAGE = `${ADMIN}/locations`;

const STATUS_TONE: Record<VenueStatus, Tone> = { live: "ok", pending: "warn", ended: "neutral" };

/** What one location is owed for one month, worked out by the page. */
export type VenueOwed = {
  month: string;
  /** Collected this month from this location's advertisers. */
  collected: number;
  rent: number;
  share: number;
  total: number;
  /** YYYY-MM-DD the money is due. */
  dueDate: string;
  /** The ledger already holds a payment to the venue for this month. */
  paid: boolean;
};

export type LocationView = {
  venue: Venue;
  running: number;
  pending: number;
  openSlots: number;
  owed: VenueOwed;
  documents: DocumentRecord[];
};

/* ----------------------------------- card ---------------------------------- */

function DealLine({ venue }: { venue: Venue }) {
  const d = venue.deal;
  if (!hasDeal(venue)) return <span className="text-white/40">No rent or share set yet.</span>;
  const parts = [
    d.rentMonthly > 0 && `${money(d.rentMonthly)} rent a month`,
    d.sharePercent > 0 && `${d.sharePercent}% of what its advertisers pay`,
  ].filter(Boolean);
  return (
    <>
      {parts.join(" + ")} · due on the {ordinal(d.dueDay)}
      {d.note ? <span className="text-white/40"> · {d.note}</span> : null}
    </>
  );
}

function LocationCard({ row, several }: { row: LocationView; several: boolean }) {
  const { venue, owed } = row;
  const status = VENUE_STATUSES.find((s) => s.id === venue.status)!;
  const perDay = WEEKDAYS.map((_, i) => playsOnWeekday(venue, i));
  const typicalPlays = Math.max(...perDay);
  const months = lastMonths(owed.month, 6);

  return (
    <Card
      id={`venue-${venue.id}`}
      title={
        <span className="flex flex-wrap items-center gap-2.5">
          <span>{venue.name}</span>
          <Badge tone={STATUS_TONE[venue.status]}>{status.label}</Badge>
          {venue.builtIn && <Badge dot={false}>First location</Badge>}
        </span>
      }
      lede={[venue.address || venue.place, describeHours(venue)].filter(Boolean).join(" · ")}
      action={
        <>
          <a href={`${PAGE}?edit=${venue.id}#editor`} className={`${btnGhost} ${btnSm}`}>
            Edit
          </a>
          {venue.status !== "live" && (
            <form action={setVenueStatusAction}>
              <input type="hidden" name="id" value={venue.id} />
              <input type="hidden" name="status" value="live" />
              <SubmitButton className={`${btnPrimary} ${btnSm}`} pendingLabel="Saving">
                Mark live
              </SubmitButton>
            </form>
          )}
          {venue.status === "live" && !venue.builtIn && (
            <form action={setVenueStatusAction}>
              <input type="hidden" name="id" value={venue.id} />
              <input type="hidden" name="status" value="ended" />
              <SubmitButton className={`${btnDanger} ${btnSm}`} pendingLabel="Saving">
                Mark ended
              </SubmitButton>
            </form>
          )}
        </>
      }
      className="mb-5"
    >
      {venue.status === "pending" && (
        <div className="mb-5">
          <Note tone="warn">
            <p className="text-sm text-white/75">
              Not live yet: prospects can be tagged with it, but an advertiser can&apos;t be put on its screens until you mark it live.
            </p>
          </Note>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Stat label="On the screens" value={String(row.running)} hint={`${row.openSlots} of ${venue.sellable} slots open${row.pending ? ` · ${row.pending} signed` : ""}`} />
        <Stat label="The room" value={`${venue.screens} ${venue.screens === 1 ? "screen" : "screens"}`} hint={`${venue.slides} slides at ${venue.slideSeconds}s · ${venue.sellable} for sale`} />
        <Stat label="Plays per open day" value={typicalPlays.toLocaleString()} hint="one slide, on a full day" />
        <Stat
          label={`Owed for ${monthLabel(owed.month)}`}
          value={hasDeal(venue) ? money(owed.total) : "—"}
          hint={
            hasDeal(venue)
              ? owed.paid
                ? "logged as paid in the books"
                : `due ${formatDate(owed.dueDate)}${owed.share > 0 ? ` · ${money(owed.share)} is the share so far` : ""}`
              : "no rent or share set"
          }
          tone={hasDeal(venue) && !owed.paid ? "warn" : "plain"}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <SubHead>The deal</SubHead>
            <p className="text-sm text-white/75 leading-relaxed">
              <DealLine venue={venue} />
            </p>
            <p className="mt-1.5 text-xs text-white/35 leading-relaxed">
              The share is worked out on money actually collected from this location&apos;s advertisers, never on what was invoiced. When it is due, a row appears on Today; logging it there writes the expense into the books.
            </p>
          </div>
          <div>
            <SubHead>Owner</SubHead>
            {venue.ownerName || venue.ownerEmail || venue.ownerPhone ? (
              <p className="text-sm text-white/75">{[venue.ownerName, venue.ownerEmail, venue.ownerPhone].filter(Boolean).join(" · ")}</p>
            ) : (
              <p className="text-sm text-white/40">Nobody on record. Statements are addressed to the owner, so add them.</p>
            )}
          </div>
          {venue.notes && (
            <div>
              <SubHead>Notes</SubHead>
              <p className="text-sm text-white/65 whitespace-pre-line leading-relaxed">{venue.notes}</p>
            </div>
          )}
          <div>
            <SubHead>Statements</SubHead>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {months.map((m) => (
                <li key={m}>
                  <a
                    href={`${ADMIN}/statement/${m}${several ? `?venue=${venue.id}` : ""}`}
                    className="flex items-center justify-between gap-2 border border-white/[0.08] px-3 py-2.5 hover:border-white/30 hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="text-sm text-white">{monthLabel(m)}</span>
                    <span className={`${bebas} text-[10px] tracking-[0.2em] text-white/35`}>{m === owed.month ? "So far" : "Open"}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <SubHead>Agreement with the venue</SubHead>
          {row.documents.length === 0 ? (
            <div className="mb-4">
              <Empty>Nothing on file. Upload the signed agreement with the venue so the terms are where the money is.</Empty>
            </div>
          ) : (
            <ul className="flex flex-col gap-2 mb-4">
              {row.documents.map((doc) => (
                <li key={doc.id} className={`${cardClass} px-4 py-3 flex items-center justify-between gap-3`}>
                  <div className="min-w-0">
                    <a href={documentHref(doc.id)} className={`${serif} text-[18px] leading-none text-white hover:text-[#f87171] transition-colors`}>
                      {doc.label || doc.filename}
                    </a>
                    <p className="text-xs text-white/40 mt-1">
                      {doc.kind === "agreement" ? "Agreement" : "Document"} · {doc.filename} · {stamp(doc.uploadedAt)}
                    </p>
                  </div>
                  <form action={deleteVenueDocumentAction}>
                    <input type="hidden" name="venueId" value={venue.id} />
                    <input type="hidden" name="id" value={doc.id} />
                    <button type="submit" className={linkQuiet}>
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={uploadVenueDocumentAction} encType="multipart/form-data" className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <input type="hidden" name="venueId" value={venue.id} />
            <div className="grid gap-3">
              <Field label="What it is" name="label" id={`doc-label-${venue.id}`} placeholder="Signed venue agreement, 2026" />
              <div>
                <label className={labelClass} htmlFor={`doc-file-${venue.id}`}>File</label>
                <input
                  id={`doc-file-${venue.id}`}
                  name="file"
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp,.doc,.docx"
                  required
                  className="w-full text-sm text-white/55 file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                />
              </div>
            </div>
            <SubmitButton className={`${btnGhost} ${btnSm}`} pendingLabel="Uploading">
              Upload
            </SubmitButton>
          </form>
          <p className="mt-2 text-xs text-white/30">PDF, Word or a photo of the signed pages, up to 4 MB. Kept private and served only through the portal.</p>
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value, hint, tone = "plain" }: { label: string; value: string; hint?: string; tone?: "plain" | "warn" }) {
  return (
    <div className={`${cardClass} px-4 py-3.5 ${tone === "warn" ? "border-[#E0B36A]/25" : ""}`}>
      <p className={labelClass}>{label}</p>
      <p className={`${numClass} text-2xl text-white leading-none`}>{value}</p>
      {hint && <p className="text-[11px] text-white/40 mt-1.5 leading-snug">{hint}</p>}
    </div>
  );
}

export function LocationsList({ rows }: { rows: LocationView[] }) {
  const several = rows.filter((r) => r.venue.status !== "ended").length > 1;
  return (
    <>
      {rows.map((row) => (
        <LocationCard key={row.venue.id} row={row} several={several} />
      ))}
    </>
  );
}

/* ----------------------------------- form ---------------------------------- */

const numberValue = (n: number | null | undefined) => (n === null || n === undefined || n === 0 ? "" : String(n));

export function LocationForm({ editing, blank, error }: { editing?: Venue; blank: Venue; error?: string }) {
  const v = editing ?? blank;
  return (
    <Disclosure
      id="editor"
      open={Boolean(editing) || Boolean(error)}
      summary={<span className={`${bebas} text-[13px] tracking-[0.24em]`}>{editing ? `Edit ${editing.name}` : "Add a location"}</span>}
      hint="everything about the room and the deal"
      className="mt-2"
    >
      {editing && (
        <a href={PAGE} className={`${linkQuiet} inline-block mb-4 mt-3`}>
          Cancel edit
        </a>
      )}
      {error && (
        <div className="mb-4 mt-3">
          <Note tone="bad">
            <p className="text-sm text-white">{error}</p>
          </Note>
        </div>
      )}
      <form action={saveVenueAction} className="flex flex-col gap-5 pt-3">
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" name="name" defaultValue={v.name} placeholder="Mex Taco House" required />
          <Field label="Town" name="place" defaultValue={v.place} placeholder="Cypress, TX" hint="Shown under the name in the switcher." />
          <div className="sm:col-span-2">
            <Field label="Address" name="address" defaultValue={v.address} placeholder="Street, town, ZIP" hint="Goes on the advertiser agreement, so write it the way it should read there." />
          </div>
          <div>
            <label className={labelClass} htmlFor="venue-status">Status</label>
            <select id="venue-status" name="status" defaultValue={v.status} className={selectClass}>
              {VENUE_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-white/30">{VENUE_STATUSES.find((s) => s.id === v.status)?.hint}</p>
          </div>
          <Field label="utm_source on its links" name="utmSource" defaultValue={v.utmSource} placeholder="left blank, made from the name" hint="How the venue is named in an advertiser's own analytics. Lowercase and dashes." />
        </div>

        <div>
          <SubHead>The room</SubHead>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Screens" name="screens" defaultValue={String(v.screens)} inputMode="numeric" required />
            <Field label="Slides in the loop" name="slides" defaultValue={String(v.slides)} inputMode="numeric" required />
            <Field label="Slides for sale" name="sellable" defaultValue={String(v.sellable)} inputMode="numeric" required hint="The rest are the house's own." />
            <Field label="Guests per month" name="monthlyGuests" defaultValue={String(v.monthlyGuests)} inputMode="numeric" hint="From the venue. Behind the &quot;seen by approximately&quot; figure in client reports. Leave 0 if unknown and the report omits it." />
            <Field label="Seconds per slide" name="slideSeconds" defaultValue={String(v.slideSeconds)} inputMode="numeric" required />
          </div>
        </div>

        <div>
          <SubHead>Hours</SubHead>
          <p className="text-xs text-white/35 mb-3 leading-relaxed">Plays are worked out from these: the loop length against the hours the doors are open. Tick closed for a day the venue doesn&apos;t open.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {WEEKDAYS.map((day, i) => {
              const h = v.hours[i];
              return (
                <div key={day} className={`${cardClass} px-3.5 py-3`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`${bebas} text-[11px] tracking-[0.22em] text-white/70`}>{day}</span>
                    <label className="flex items-center gap-1.5 text-[11px] text-white/45">
                      <input type="checkbox" name={`closed_${i}`} value="1" defaultChecked={!h} className="accent-[#DC2626]" />
                      closed
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input name={`open_${i}`} type="time" defaultValue={h?.open ?? "06:00"} className={`${inputClass} !py-2 text-sm`} aria-label={`${day} opens`} />
                    <input name={`close_${i}`} type="time" defaultValue={h?.close ?? "14:00"} className={`${inputClass} !py-2 text-sm`} aria-label={`${day} closes`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <SubHead>The deal with the venue</SubHead>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Rent a month" name="rentMonthly" defaultValue={numberValue(v.deal.rentMonthly)} inputMode="decimal" placeholder="0" hint="Dollars. Blank if there is no fixed rent." />
            <Field label="Their share" name="sharePercent" defaultValue={numberValue(v.deal.sharePercent)} inputMode="decimal" placeholder="0" hint="Percent of money collected from this location's advertisers. Blank for none." />
            <Field label="Due on the" name="dueDay" defaultValue={String(v.deal.dueDay)} inputMode="numeric" placeholder="1" hint="Day of the month, 1 to 28. The share for a month is due this day of the next." />
          </div>
          <div className="mt-4">
            <Field label="The deal in words" name="dealNote" defaultValue={v.deal.note} placeholder="Free for the first 3 months, then 20%. Or: a trade for catering." hint="Anything the two numbers above don't say." />
          </div>
        </div>

        <div>
          <SubHead>Owner</SubHead>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Name" name="ownerName" defaultValue={v.ownerName} hint="Statements are addressed to them." />
            <Field label="Email" name="ownerEmail" type="email" defaultValue={v.ownerEmail} />
            <Field label="Phone" name="ownerPhone" type="tel" defaultValue={v.ownerPhone} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="venue-notes">Notes</label>
          <textarea id="venue-notes" name="notes" rows={2} defaultValue={v.notes} placeholder="Who to talk to, where the screen's cable runs, anything the other one of you should know." className={inputClass} />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <SubmitButton className={`${btnPrimary} px-6 py-3`} pendingLabel="Saving">
            {editing ? "Save changes" : "Add location"}
          </SubmitButton>
          <p className="text-xs text-white/30 max-w-md">Nothing here is public. The advertise page stays as it is until you say otherwise.</p>
        </div>
      </form>
    </Disclosure>
  );
}

/* --------------------------------- helpers --------------------------------- */

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function lastMonths(current: string, count: number): string[] {
  const [y, m] = current.split("-").map(Number);
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}
