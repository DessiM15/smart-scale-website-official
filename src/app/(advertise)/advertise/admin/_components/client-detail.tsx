/**
 * One client, opened in place on the advertisers page.
 *
 * Six panels: the deal, their codes, the artwork, the agreement and other
 * paperwork, payments, notes. Each is a `?panel=` so the URL says what is
 * open and every action lands back on the panel it came from.
 */

import type { ReactNode } from "react";
import {
  addClientLinkAction,
  countersignAgreementAction,
  deleteArtworkAction,
  deleteDocumentAction,
  deletePaymentAction,
  prepareAgreementAction,
  recordPaymentAction,
  repointClientLinkAction,
  saveNotesAction,
  sendAgreementAction,
  uploadAgreementAction,
  uploadArtworkAction,
  uploadDocumentAction,
  voidAgreementAction,
} from "../client/[id]/actions";
import { setArtworkStatusAction } from "../actions";
import { artworkAgeDays, artworkHref, type Artwork } from "@/lib/ads/artwork";
import type { AdLinkRecord } from "@/lib/ads/link-store";
import type { CodeStats } from "@/lib/ads/scan-store";
import {
  ARTWORK_STATUSES,
  artworkStatusOf,
  formatDate,
  today,
  type AdvertiserView,
} from "@/lib/ads/roster";
import { activeAgreement, isIntact, pendingAgreement, sourceOf, type Agreement } from "@/lib/ads/agreements";
import { documentHref, type DocumentRecord } from "@/lib/ads/documents";
import { describeBlobEnv } from "@/lib/ads/blob";
import { PAYMENT_METHODS, standing, type Payment } from "@/lib/ads/payments";
import { expectedFor } from "@/lib/ads/expected";
import { agreementText, TEMPLATE_REVIEWED, TEMPLATE_VERSION } from "@/lib/ads/agreement-template";
import { SubmitButton } from "./submit-button";
import { ADMIN, clientHref, tabHref } from "./types";
import {
  Badge,
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
  btnSolid,
  cardClass,
  inputClass,
  labelClass,
  linkAction,
  linkQuiet,
  money,
  numClass,
  selectClass,
  stamp,
  type Tone,
} from "./ui";

export type ClientPanel = "deal" | "codes" | "artwork" | "agreement" | "payments" | "notes";
export const CLIENT_PANELS: { id: ClientPanel; label: string }[] = [
  { id: "deal", label: "Deal" },
  { id: "codes", label: "QR codes" },
  { id: "artwork", label: "Artwork" },
  { id: "agreement", label: "Agreement" },
  { id: "payments", label: "Payments" },
  { id: "notes", label: "Notes" },
];

export type ClientData = {
  view: AdvertiserView;
  codes: { link: AdLinkRecord; stats: CodeStats }[];
  artwork: Artwork[];
  agreements: Agreement[];
  documents: DocumentRecord[];
  payments: Payment[];
  signUrls: Record<string, string | null>;
  emailConfigured: boolean;
  signingConfigured: boolean;
  storageConfigured: boolean;
};

const ARTWORK_STALE_DAYS = 90;

const fileSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 py-2.5 border-b border-white/[0.06] last:border-b-0">
      <dt className={`${labelClass} !mb-0`}>{label}</dt>
      <dd className="text-sm text-white/80 tabular-nums text-right">{children}</dd>
    </div>
  );
}

/* --------------------------------- the deal -------------------------------- */

function DealPanel({ view }: { view: AdvertiserView }) {
  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <SubHead>The deal</SubHead>
          <a href={`${tabHref("advertisers", { edit: view.id })}#editor`} className={`${btnGhost} ${btnSm}`}>
            Edit contract
          </a>
        </div>
        <dl>
          <Row label="Package">
            {view.planName}
            {view.isCustom && (
              <span className="ml-2">
                <Badge tone="warn" dot={false}>custom</Badge>
              </span>
            )}
          </Row>
          <Row label="Monthly">
            {view.monthly ? `${money(view.monthly)}/mo` : "no charge"}
            {view.monthly !== view.listMonthly && <span className="ml-2 text-white/30 line-through">{money(view.listMonthly)}</span>}
          </Row>
          <Row label="Setup">
            {view.setup ? money(view.setup) : "waived"}
            {view.setup !== view.listSetup && (
              <span className="ml-2 text-white/30 line-through">{view.listSetup ? money(view.listSetup) : "waived"}</span>
            )}
          </Row>
          <Row label="Term">
            {view.months} months
            {view.months !== view.listMonths && <span className="ml-2 text-white/30 line-through">{view.listMonths}</span>}
          </Row>
          <Row label="Runs">
            {formatDate(view.startDate)} → {formatDate(view.endDate)}
          </Row>
          <Row label="Whole term">
            {money(view.termValue)}
            {view.termValue !== view.listTermValue && <span className="ml-2 text-white/30 line-through">{money(view.listTermValue)}</span>}
          </Row>
          <Row label="Pays">{view.paymentType === "prepaid" ? "whole term up front" : "monthly"}</Row>
          <Row label="Category">{view.category || "—"}</Row>
          <Row label="Slot">{view.slot ? `#${view.slot}` : "unassigned"}</Row>
        </dl>
        {view.isCustom && (
          <div className="mt-4">
            <Note tone="warn">
              <p className={`${labelClass} !text-[#E0B36A]/70`}>Why they&apos;re not on list price</p>
              <p className="text-sm text-white/80">{view.dealNote || "No reason recorded. Add one on the contract editor."}</p>
              {view.monthlyDiscount !== 0 && (
                <p className="mt-2 text-sm text-white/45 tabular-nums">
                  {view.monthlyDiscount > 0
                    ? `${money(view.monthlyDiscount)}/mo under list, ${money(view.monthlyDiscount * view.months)} across the term.`
                    : `${money(-view.monthlyDiscount)}/mo over list.`}
                </p>
              )}
            </Note>
          </div>
        )}
      </div>
      <div>
        <SubHead>Contact</SubHead>
        <dl>
          <Row label="Name">{view.contactName || "—"}</Row>
          <Row label="Email">
            {view.email ? (
              <a href={`mailto:${view.email}`} className="hover:text-[#f87171] transition-colors">
                {view.email}
              </a>
            ) : (
              "—"
            )}
          </Row>
          <Row label="Phone">
            {view.phone ? (
              <a href={`tel:${view.phone.replace(/[^\d+]/g, "")}`} className="hover:text-[#f87171] transition-colors">
                {view.phone}
              </a>
            ) : (
              "—"
            )}
          </Row>
          {view.source && <Row label="Came from">{[view.source, view.campaign && `flyer: ${view.campaign}`].filter(Boolean).join(" · ")}</Row>}
        </dl>
        <div className="mt-5">
          <SubHead>Since they started</SubHead>
          <ClientFigures view={view} />
        </div>
      </div>
    </div>
  );
}

/**
 * Days on screen and plays, prorated for today by the hours actually
 * elapsed. Plays are a shape of the rotation (20 an hour while the room is
 * open) and are only claimed once the slide is on the screens.
 */
function ClientFigures({ view }: { view: AdvertiserView }) {
  const asOf = today();
  const started = view.startDate <= asOf;
  const onScreen = artworkStatusOf(view) === "on-screen";
  const end = view.endDate < asOf ? view.endDate : asOf;
  const days = started ? Math.max(0, daysOpenBetween(view.startDate, end)) : 0;
  return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <p className={`${numClass} text-2xl text-white`}>{started ? days : 0}</p>
        <p className="text-[11px] text-white/40">days open so far</p>
      </div>
      <div>
        <p className={`${numClass} text-2xl text-white`}>{onScreen && started ? (days * 160).toLocaleString() : "—"}</p>
        <p className="text-[11px] text-white/40">{onScreen ? "plays, about" : "no slide on screen"}</p>
      </div>
      <div>
        <p className={`${numClass} text-2xl text-white`}>{view.daysRemaining >= 0 ? view.daysRemaining : 0}</p>
        <p className="text-[11px] text-white/40">days left</p>
      </div>
    </div>
  );
}

/** Opening days between two dates: closed Mondays. */
function daysOpenBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  let count = 0;
  for (let t = Date.UTC(fy, fm - 1, fd); t <= Date.UTC(ty, tm - 1, td); t += 86_400_000) {
    if (new Date(t).getUTCDay() !== 1) count += 1;
  }
  return count;
}

/* --------------------------------- QR codes -------------------------------- */

function Sparkline({ series }: { series: { date: string; count: number }[] }) {
  if (series.length < 2) return null;
  const peak = Math.max(1, ...series.map((p) => p.count));
  const step = 100 / (series.length - 1);
  const points = series.map((p, i) => `${i * step},${30 - (p.count / peak) * 30}`);
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-8" aria-hidden>
      <polygon points={`0,30 ${points.join(" ")} 100,30`} fill="rgba(220,38,38,0.16)" />
      <polyline points={points.join(" ")} fill="none" stroke="#DC2626" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function CodeCard({ link, stats, advertiserId }: { link: AdLinkRecord; stats: CodeStats; advertiserId: string }) {
  return (
    <li className={`${cardClass} p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm text-[#f87171]">/go/{link.code}</p>
          <p className="text-xs text-white/35 mt-0.5">{link.label}</p>
        </div>
        {link.active ? <Badge tone="ok">Live</Badge> : <Badge>Retired</Badge>}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        {[
          { label: "All time", value: stats.total },
          { label: "Last 7", value: stats.last7 },
          { label: "Today", value: stats.today },
        ].map((s) => (
          <div key={s.label}>
            <p className={`${numClass} text-2xl text-white`}>{s.value}</p>
            <p className={`${bebas} text-[10px] tracking-[0.2em] text-white/30 mt-0.5`}>{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <Sparkline series={stats.series} />
        <p className={`${bebas} text-[10px] tracking-[0.2em] text-white/25 mt-1`}>Last 30 days</p>
      </div>
      {stats.byPlace.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {stats.byPlace.slice(0, 5).map((place) => (
            <span key={place.name} className="border border-white/10 px-2 py-1 text-[11px] text-white/60">
              {place.name} <span className="text-white/35 tabular-nums">{place.count}</span>
            </span>
          ))}
        </div>
      )}
      <form action={repointClientLinkAction} className="mt-4 flex flex-col gap-2">
        <input type="hidden" name="id" value={advertiserId} />
        <input type="hidden" name="code" value={link.code} />
        <label className={labelClass} htmlFor={`dest-${link.code}`}>Sends people to</label>
        <input id={`dest-${link.code}`} name="destination" type="url" defaultValue={link.destination} className={inputClass} />
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <button type="submit" className={linkAction}>Save destination</button>
          <a href={`/api/ads/qr/${link.code}?format=png`} className={linkQuiet}>PNG</a>
          <a href={`/api/ads/qr/${link.code}?format=svg`} className={linkQuiet}>SVG</a>
          <a href={`${tabHref("qr", { editLink: link.code })}#qr`} className={linkQuiet}>Full settings</a>
        </div>
      </form>
    </li>
  );
}

function CodesPanel({ view, codes }: { view: AdvertiserView; codes: ClientData["codes"] }) {
  const total = codes.reduce((sum, c) => sum + c.stats.total, 0);
  return (
    <>
      {codes.length === 0 ? (
        <Empty>No codes yet. Make their first one below.</Empty>
      ) : (
        <>
          <ul className="grid sm:grid-cols-2 gap-3">
            {codes.map(({ link, stats }) => (
              <CodeCard key={link.code} link={link} stats={stats} advertiserId={view.id} />
            ))}
          </ul>
          {codes.length > 1 && <p className="mt-4 text-sm text-white/45 tabular-nums">{total.toLocaleString()} scans across {codes.length} codes.</p>}
        </>
      )}
      <div className="mt-4">
        <Disclosure summary="Add another code" hint="flyer, window, table tent">
          <form action={addClientLinkAction} className="pt-4 flex flex-col gap-4">
            <input type="hidden" name="id" value={view.id} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Where it sends people" name="destination" id={`newDestination-${view.id}`} type="url" placeholder="https://theirsite.com/book" required />
              <Field label="What it's for" name="label" id={`newLabel-${view.id}`} placeholder="Flyer, window cling, table tent" />
            </div>
            <Field
              label="Code"
              name="code"
              id={`newCode-${view.id}`}
              placeholder="leave blank and we'll name it"
              hint={`Left blank, it's named from their code and the placement. It gets printed, so it can never be changed later.`}
            />
            <SubmitButton className={`${btnPrimary} ${btnSm} self-start`} pendingLabel="Creating">
              Create code
            </SubmitButton>
          </form>
        </Disclosure>
      </div>
    </>
  );
}

/* --------------------------------- artwork --------------------------------- */

const ART_TONE: Record<string, Tone> = { requested: "bad", received: "warn", approved: "warn", "on-screen": "ok" };

function ArtworkPanel({ view, artwork, configured, returnTo }: { view: AdvertiserView; artwork: Artwork[]; configured: boolean; returnTo: string }) {
  const current = artwork[0] ?? null;
  const age = artworkAgeDays(current);
  const history = artwork.slice(1);
  const status = artworkStatusOf(view);
  const step = ARTWORK_STATUSES.find((s) => s.id === status);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Badge tone={ART_TONE[status]}>{step?.label}</Badge>
        <span className="text-xs text-white/45">Requested, received, approved, on screen. Only on screen counts plays.</span>
        <div className="ml-auto flex gap-2">
          {ARTWORK_STATUSES.filter((s) => s.id !== status).map((s) => (
            <form key={s.id} action={setArtworkStatusAction}>
              <input type="hidden" name="id" value={view.id} />
              <input type="hidden" name="status" value={s.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <SubmitButton className={`${s.id === step?.next ? btnPrimary : btnGhost} ${btnSm}`} pendingLabel="Saving">
                {s.id === step?.next ? (step?.nextLabel ?? s.label) : s.label}
              </SubmitButton>
            </form>
          ))}
        </div>
      </div>

      {!configured && (
        <div className="mb-5">
          <Note tone="warn">
            <p className="text-sm text-white">This deployment can&apos;t see the file storage, so slides can&apos;t be saved yet.</p>
            <p className="mt-1.5 text-sm text-white/55">{describeBlobEnv()}</p>
          </Note>
        </div>
      )}

      {current ? (
        <div className="grid sm:grid-cols-[minmax(0,20rem)_1fr] gap-6 items-start">
          <a href={artworkHref(view.id, current.id)} target="_blank" rel="noreferrer" className="block border border-white/[0.08] overflow-hidden bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={artworkHref(view.id, current.id)} alt={`Current slide for ${view.business}`} className="w-full h-auto" />
          </a>
          <div>
            <SubHead>Current slide</SubHead>
            <p className="text-sm text-white/75">{current.note || current.filename}</p>
            <p className="mt-1 text-xs text-white/35">Uploaded {stamp(current.uploadedAt)} · {fileSize(current.size)}</p>
            {age !== null && age >= ARTWORK_STALE_DAYS && (
              <div className="mt-4">
                <Note tone="warn">
                  <p className="text-sm text-white/75">This slide is {age} days old. Worth asking whether they want it refreshed.</p>
                </Note>
              </div>
            )}
            <form action={deleteArtworkAction} className="mt-4">
              <input type="hidden" name="id" value={view.id} />
              <input type="hidden" name="artworkId" value={current.id} />
              <button type="submit" className={linkQuiet}>Remove this version</button>
            </form>
          </div>
        </div>
      ) : (
        <Empty>No slide on file. Upload one below.</Empty>
      )}

      {history.length > 0 && (
        <div className="mt-6 pt-5 border-t border-white/[0.06]">
          <SubHead>Previous versions</SubHead>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {history.map((item) => (
              <li key={item.id}>
                <a href={artworkHref(view.id, item.id)} target="_blank" rel="noreferrer" className="block border border-white/[0.08] overflow-hidden bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={artworkHref(view.id, item.id)} alt={item.note || item.filename} className="w-full h-auto" />
                </a>
                <p className="mt-1.5 text-xs text-white/35 truncate">{item.note || stamp(item.uploadedAt)}</p>
                <form action={deleteArtworkAction}>
                  <input type="hidden" name="id" value={view.id} />
                  <input type="hidden" name="artworkId" value={item.id} />
                  <button type="submit" className={linkQuiet}>Remove</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={uploadArtworkAction} className="mt-6 pt-5 border-t border-white/[0.06] flex flex-col gap-4">
        <input type="hidden" name="id" value={view.id} />
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor={`artwork-${view.id}`}>New slide</label>
            <input
              id={`artwork-${view.id}`}
              name="artwork"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className={`${inputClass} file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white`}
            />
            <p className="mt-1.5 text-xs text-white/30">PNG, JPG, WEBP or GIF, up to 4 MB. Uploading moves a requested slide to received.</p>
          </div>
          <Field label="What changed" name="note" id={`artworkNote-${view.id}`} placeholder="Spring menu, new phone number" />
        </div>
        <SubmitButton className={`${btnPrimary} ${btnSm} self-start`} pendingLabel="Uploading" disabled={!configured}>
          Upload slide
        </SubmitButton>
      </form>
    </>
  );
}

/* -------------------------------- payments --------------------------------- */

const methodLabel = (id: string) => PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;

function PaymentsPanel({ view, payments }: { view: AdvertiserView; payments: Payment[] }) {
  const position = standing(payments, view.termValue);
  const schedule = expectedFor(view, payments);
  const asOf = today();

  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Paid", value: money(position.paid), hint: position.lastPaidOn ? `last ${formatDate(position.lastPaidOn)}` : "nothing yet" },
          {
            label: position.overpaid > 0 ? "Overpaid" : "Outstanding",
            value: money(position.overpaid > 0 ? position.overpaid : position.outstanding),
            hint: position.overpaid > 0 ? "more than the term is worth" : "across the whole term",
          },
          { label: "Whole term", value: money(view.termValue), hint: `${view.months} months` },
        ].map((t) => (
          <div key={t.label} className="border border-white/[0.08] px-4 py-3">
            <p className={`${labelClass} !mb-1`}>{t.label}</p>
            <p className={`${numClass} text-2xl text-white`}>{t.value}</p>
            <p className="text-[11px] text-white/40">{t.hint}</p>
          </div>
        ))}
      </div>

      {schedule.length > 0 && (
        <div className="mb-6">
          <SubHead>The schedule</SubHead>
          <ul className="divide-y divide-white/[0.06]">
            {schedule.map((e) => (
              <li key={e.period} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                <span className="text-white/80">
                  {e.label} <span className="text-white/35">· due {formatDate(e.dueDate)}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums text-white">{money(e.amount)}</span>
                  <Badge tone={e.status === "paid" ? "ok" : e.status === "late" ? "bad" : e.status === "due" ? "warn" : "neutral"}>
                    {e.status === "paid" && e.paidOn ? `Paid ${formatDate(e.paidOn)}` : e.status}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {payments.length > 0 && (
        <div className="mb-6">
          <SubHead>Recorded</SubHead>
          <ul className="divide-y divide-white/[0.06]">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span className="text-sm">
                  <span className="text-white tabular-nums">{money(p.amount)}</span>
                  <span className="text-white/35"> · {formatDate(p.receivedOn)} · {methodLabel(p.method)}{p.period ? ` · for ${p.period}` : ""}</span>
                  {(p.reference || p.note) && <span className="block text-xs text-white/30 mt-0.5">{[p.reference, p.note].filter(Boolean).join(" · ")}</span>}
                </span>
                <details>
                  <summary className={`${linkQuiet} list-none cursor-pointer [&::-webkit-details-marker]:hidden`}>Remove</summary>
                  <form action={deletePaymentAction} className="mt-2 flex items-center gap-2">
                    <input type="hidden" name="id" value={view.id} />
                    <input type="hidden" name="paymentId" value={p.id} />
                    <span className="text-xs text-white/50">Remove this payment?</span>
                    <button type="submit" className={`${btnDanger} ${btnSm}`}>Yes</button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={recordPaymentAction} className="flex flex-col gap-4 border-t border-white/[0.06] pt-5">
        <input type="hidden" name="id" value={view.id} />
        <SubHead>Record a payment</SubHead>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Field label="Amount" name="amount" id={`payAmount-${view.id}`} inputMode="decimal" placeholder={String(Math.round(view.monthly || view.termValue))} required />
          <Field label="Arrived on" name="receivedOn" id={`payDate-${view.id}`} type="date" defaultValue={asOf} required />
          <div>
            <label className={labelClass} htmlFor={`payMethod-${view.id}`}>How</label>
            <select id={`payMethod-${view.id}`} name="method" className={selectClass} defaultValue="stripe">
              {PAYMENT_METHODS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor={`payPeriod-${view.id}`}>For which month</label>
            <select id={`payPeriod-${view.id}`} name="period" className={selectClass} defaultValue="">
              <option value="">Oldest unpaid</option>
              {schedule.map((e) => (
                <option key={e.period} value={e.period}>{e.period} · {e.label}</option>
              ))}
            </select>
          </div>
          <Field label="Reference" name="reference" id={`payRef-${view.id}`} placeholder="Stripe id, cheque no." />
        </div>
        <SubmitButton className={`${btnPrimary} ${btnSm} self-start`} pendingLabel="Recording">
          Record payment
        </SubmitButton>
      </form>
    </>
  );
}

/* ------------------------------- agreements -------------------------------- */

const AGREEMENT_STATUS: Record<Agreement["status"], { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  filed: { label: "On file", tone: "ok" },
  sent: { label: "Sent", tone: "warn" },
  viewed: { label: "Opened", tone: "warn" },
  signed: { label: "Signed, needs you", tone: "brand" },
  countersigned: { label: "Complete", tone: "ok" },
  void: { label: "Cancelled", tone: "neutral" },
};

function SignatureBlock({ agreement }: { agreement: Agreement }) {
  const sig = agreement.signature;
  if (!sig) return null;
  return (
    <div className="border border-white/[0.08] bg-white/[0.02] px-4 py-3.5">
      <SubHead>Signature on file</SubHead>
      <p className="text-sm text-white/75">{sig.name} · {stamp(sig.at)}</p>
      <p className="mt-1 text-xs text-white/35 break-words">{[sig.email, sig.ip && `from ${sig.ip}`].filter(Boolean).join(" · ")}</p>
      <p className="mt-2 text-[11px] text-white/25 font-mono break-all">{sig.bodyHash.slice(0, 32)}…</p>
      <p className="mt-1 text-xs text-white/30">
        {isIntact(agreement) ? "The copy on file still matches what they signed." : "WARNING: the copy on file no longer matches what was signed."}
      </p>
      {agreement.countersignature && (
        <p className="mt-3 pt-3 border-t border-white/[0.06] text-sm text-white/75">
          Countersigned by {agreement.countersignature.name} · {stamp(agreement.countersignature.at)}
        </p>
      )}
    </div>
  );
}

function AgreementRow({ agreement, advertiserId, signUrl, emailConfigured, document }: { agreement: Agreement; advertiserId: string; signUrl: string | null; emailConfigured: boolean; document?: DocumentRecord }) {
  const uploaded = sourceOf(agreement) === "uploaded";
  const status = AGREEMENT_STATUS[agreement.status];
  const open = agreement.status !== "void" && agreement.status !== "countersigned" && agreement.status !== "filed";

  return (
    <Disclosure
      open={open}
      summary={
        <>
          <span>{uploaded ? agreement.filedNote || "Signed agreement" : "Advertising agreement"}</span>
          <Badge tone={status.tone}>{status.label}</Badge>
          <span className="text-xs text-white/30">{uploaded ? "signed elsewhere" : agreement.templateVersion}</span>
        </>
      }
      hint={stamp(agreement.createdAt)}
    >
      <div className="pt-4 flex flex-col gap-4">
        {uploaded ? (
          <dl>
            <Row label="Signed by">{agreement.filedSignerName || "—"}</Row>
            <Row label="Signed on">{agreement.filedSignedOn ? formatDate(agreement.filedSignedOn) : "—"}</Row>
            <Row label="Covers the term ending">{agreement.coversEndDate ? formatDate(agreement.coversEndDate) : "—"}</Row>
            <Row label="File">{document ? `${document.filename} · ${fileSize(document.size)}` : "missing"}</Row>
          </dl>
        ) : (
          <dl className="grid sm:grid-cols-2 gap-x-6">
            <Row label="Rate">{agreement.terms.monthly > 0 ? `${money(agreement.terms.monthly)}/mo` : "no charge"}</Row>
            <Row label="Setup">{agreement.terms.setup > 0 ? money(agreement.terms.setup) : "waived"}</Row>
            <Row label="Term">{agreement.terms.months} months</Row>
            <Row label="Runs">{formatDate(agreement.terms.startDate)} → {formatDate(agreement.terms.endDate)}</Row>
          </dl>
        )}

        {document && uploaded && (
          <div>
            <a href={documentHref(document.id)} target="_blank" rel="noreferrer" className={`${btnGhost} ${btnSm}`}>
              Open the signed copy
            </a>
            <p className="mt-2 text-[11px] text-white/25 font-mono break-all">sha256 {document.sha256.slice(0, 32)}…</p>
          </div>
        )}

        {!uploaded && <SignatureBlock agreement={agreement} />}
        {agreement.voidReason && <p className="text-sm text-white/45">Cancelled: {agreement.voidReason}</p>}

        {!uploaded && (
          <details className="border border-white/[0.08] bg-black/20">
            <summary className={`${bebas} cursor-pointer px-4 py-3 text-[11px] tracking-[0.22em] text-white/40 list-none [&::-webkit-details-marker]:hidden hover:text-white/70`}>
              Read the full terms
            </summary>
            <pre className="px-4 pb-4 text-[11px] leading-relaxed text-white/55 whitespace-pre-wrap break-words font-mono">{agreementText(agreement.terms)}</pre>
          </details>
        )}

        {signUrl && !uploaded && agreement.status !== "void" && !agreement.signature && (
          <div>
            <SubHead>Signing link</SubHead>
            <p className="text-[11px] text-[#f87171] font-mono break-all leading-relaxed">{signUrl}</p>
            <p className="mt-1.5 text-xs text-white/30">Anyone with this link can sign. Send it however you like; it works whether or not email is connected.</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {agreement.status === "draft" && (
            <form action={sendAgreementAction}>
              <input type="hidden" name="id" value={advertiserId} />
              <input type="hidden" name="agreementId" value={agreement.id} />
              <SubmitButton className={`${btnPrimary} ${btnSm}`} pendingLabel="Sending" disabled={!emailConfigured}>
                Email it to the client
              </SubmitButton>
            </form>
          )}
          {agreement.status === "signed" && (
            <form action={countersignAgreementAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={advertiserId} />
              <input type="hidden" name="agreementId" value={agreement.id} />
              <div>
                <label className={labelClass} htmlFor={`cs-${agreement.id}`}>Countersign as</label>
                <input id={`cs-${agreement.id}`} name="name" defaultValue="Smart Scale" className={inputClass} />
              </div>
              <SubmitButton className={`${btnSolid} ${btnSm}`} pendingLabel="Signing">
                Countersign
              </SubmitButton>
            </form>
          )}
          {agreement.status !== "void" && agreement.status !== "countersigned" && (
            <details className="ml-auto">
              <summary className={`${linkQuiet} list-none cursor-pointer [&::-webkit-details-marker]:hidden`}>{uploaded ? "Mark it void" : "Cancel it"}</summary>
              <form action={voidAgreementAction} className="mt-2 flex items-center gap-2">
                <input type="hidden" name="id" value={advertiserId} />
                <input type="hidden" name="agreementId" value={agreement.id} />
                <input name="reason" placeholder="why?" className={`${inputClass} w-40 py-1.5 text-xs`} />
                <button type="submit" className={`${btnDanger} ${btnSm}`}>Void it</button>
              </form>
            </details>
          )}
        </div>
      </div>
    </Disclosure>
  );
}

function AgreementPanel({ data }: { data: ClientData }) {
  const { view, agreements, documents, signUrls, emailConfigured, signingConfigured, storageConfigured } = data;
  const complete = activeAgreement(agreements);
  const pending = pendingAgreement(agreements);
  const draft = agreements.find((a) => a.status === "draft");
  const others = documents.filter((d) => d.kind === "other");

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-sm text-white/55 max-w-xl">The advertising agreement, and the record of who signed what and when.</p>
        {!draft && !pending && (
          <form action={prepareAgreementAction}>
            <input type="hidden" name="id" value={view.id} />
            <SubmitButton className={`${btnPrimary} ${btnSm}`} pendingLabel="Preparing">
              {complete ? "Prepare a new one" : "Prepare agreement"}
            </SubmitButton>
          </form>
        )}
      </div>

      {!TEMPLATE_REVIEWED && (
        <div className="mb-4">
          <Note tone="warn">
            <p className="text-sm text-white">The agreement wording ({TEMPLATE_VERSION}) hasn&apos;t been checked against the original yet.</p>
            <p className="mt-1.5 text-sm text-white/55">
              Open &ldquo;Read the full terms&rdquo; on any agreement and compare it once. Every signature records which version it was, so replacing the wording later never changes what someone already signed.
            </p>
          </Note>
        </div>
      )}
      {!signingConfigured && (
        <div className="mb-4">
          <Note tone="bad">
            <p className="text-sm text-white">No signing links can be made yet. ADS_LINK_SECRET isn&apos;t set; it&apos;s on the Setup page.</p>
          </Note>
        </div>
      )}
      {view.status === "active" && !complete && (
        <div className="mb-4">
          <Note tone="warn">
            <p className="text-sm text-white">
              Running with no signed agreement.{" "}
              <span className="text-white/60">{pending ? "One is out with them. Chase it." : "Prepare one and send it, or file one signed elsewhere."}</span>
            </p>
          </Note>
        </div>
      )}

      {agreements.length === 0 ? (
        <Empty>No agreement yet. Prepare one here, or file a copy you signed elsewhere.</Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {agreements.map((agreement) => (
            <AgreementRow
              key={agreement.id}
              agreement={agreement}
              advertiserId={view.id}
              signUrl={signUrls[agreement.id] ?? null}
              emailConfigured={emailConfigured}
              document={documents.find((d) => d.id === agreement.documentId)}
            />
          ))}
        </div>
      )}

      <div className="mt-3">
        <Disclosure summary="Already signed one elsewhere? File it here" hint="upload">
          {!storageConfigured ? (
            <div className="pt-4">
              <Note tone="warn">
                <p className="text-sm text-white">This deployment can&apos;t see the file storage.</p>
                <p className="mt-1.5 text-sm text-white/55">{describeBlobEnv()}</p>
              </Note>
            </div>
          ) : (
            <form action={uploadAgreementAction} className="pt-4 flex flex-col gap-4">
              <input type="hidden" name="id" value={view.id} />
              <div>
                <label className={labelClass} htmlFor={`agreementFile-${view.id}`}>The signed agreement <span className="text-[#DC2626]">*</span></label>
                <input
                  id={`agreementFile-${view.id}`}
                  name="document"
                  type="file"
                  required
                  accept="application/pdf,image/png,image/jpeg,image/webp,.doc,.docx"
                  className={`${inputClass} file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white`}
                />
                <p className="mt-1.5 text-xs text-white/30">PDF, Word or a photo of the signed pages, up to 4 MB.</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Who signed it" name="signerName" id={`filedSigner-${view.id}`} defaultValue={view.contactName} required />
                <Field label="Signed on" name="signedOn" id={`filedSignedOn-${view.id}`} type="date" defaultValue={today()} required />
                <Field label="Covers term ending" name="coversEndDate" id={`filedCovers-${view.id}`} type="date" defaultValue={view.endDate} required />
              </div>
              <Field label="What it is" name="note" id={`filedNote-${view.id}`} placeholder="Signed agreement, countersigned copy, amendment" />
              <SubmitButton className={`${btnPrimary} ${btnSm} self-start`} pendingLabel="Filing">
                File this agreement
              </SubmitButton>
            </form>
          )}
        </Disclosure>
      </div>

      <div className="mt-6 pt-5 border-t border-white/[0.06]">
        <SubHead>Other documents</SubHead>
        {others.length === 0 ? (
          <p className="text-sm text-white/35 mb-4">Nothing else on file for this client.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06] mb-4">
            {others.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <a href={documentHref(doc.id)} target="_blank" rel="noreferrer" className="text-sm text-white hover:text-[#f87171] transition-colors">
                  {doc.label}
                </a>
                <span className="flex items-center gap-4">
                  <span className="text-xs text-white/30 tabular-nums">{fileSize(doc.size)} · {stamp(doc.uploadedAt)}</span>
                  <form action={deleteDocumentAction}>
                    <input type="hidden" name="id" value={view.id} />
                    <input type="hidden" name="documentId" value={doc.id} />
                    <button type="submit" className={linkQuiet}>Remove</button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
        {storageConfigured && (
          <form action={uploadDocumentAction} className="grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <input type="hidden" name="id" value={view.id} />
            <div>
              <label className={labelClass} htmlFor={`otherDoc-${view.id}`}>Add a document</label>
              <input
                id={`otherDoc-${view.id}`}
                name="document"
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp,.doc,.docx"
                className={`${inputClass} file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white`}
              />
            </div>
            <Field label="What it is" name="label" id={`otherDocLabel-${view.id}`} placeholder="W-9, insurance certificate" />
            <SubmitButton className={`${btnGhost} ${btnSm}`} pendingLabel="Saving">
              Save
            </SubmitButton>
          </form>
        )}
      </div>
    </>
  );
}

/* ---------------------------------- notes ---------------------------------- */

function NotesPanel({ view }: { view: AdvertiserView }) {
  return (
    <form action={saveNotesAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={view.id} />
      <textarea
        name="notes"
        rows={5}
        defaultValue={view.notes}
        placeholder="Artwork due, renewal conversation, billing quirks"
        className={inputClass}
      />
      <SubmitButton className={`${btnPrimary} ${btnSm} self-start`} pendingLabel="Saving">
        Save notes
      </SubmitButton>
    </form>
  );
}

/* ---------------------------------- detail --------------------------------- */

export function ClientDetail({ data, panel }: { data: ClientData; panel: ClientPanel }) {
  const { view } = data;
  const returnTo = clientHref(view.id, panel);
  return (
    <div className="border-t border-white/[0.06] bg-white/[0.015] px-4 sm:px-6 py-5">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {CLIENT_PANELS.map((p) => (
          <a
            key={p.id}
            href={clientHref(view.id, p.id)}
            aria-current={p.id === panel ? "page" : undefined}
            className={`${bebas} inline-flex items-center gap-2 border px-3.5 py-2 text-[12px] tracking-[0.2em] leading-none transition-colors ${
              p.id === panel ? "border-white text-white" : "border-white/[0.12] text-white/55 hover:text-white hover:border-white/40"
            }`}
          >
            {p.label}
          </a>
        ))}
        <a href={`${ADMIN}/advertisers`} className={`${linkQuiet} ml-auto`}>
          Close
        </a>
      </div>

      {panel === "deal" && <DealPanel view={view} />}
      {panel === "codes" && <CodesPanel view={view} codes={data.codes} />}
      {panel === "artwork" && <ArtworkPanel view={view} artwork={data.artwork} configured={data.storageConfigured} returnTo={returnTo} />}
      {panel === "agreement" && <AgreementPanel data={data} />}
      {panel === "payments" && <PaymentsPanel view={view} payments={data.payments} />}
      {panel === "notes" && <NotesPanel view={view} />}
    </div>
  );
}
