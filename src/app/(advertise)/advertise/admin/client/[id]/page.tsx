/**
 * One client, everything about them, on one screen.
 *
 * The tabs on the tracker answer "what's the state of the business?". This
 * answers "what's going on with this client?" — the deal they're actually on,
 * every code they've got and what each one pulls, the artwork currently on the
 * screens, and the paperwork. It reads; contract edits still happen in the
 * roster editor, because there is one form for that and two would drift.
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { isSignedIn } from "@/lib/ads/auth";
import {
  artworkAgeDays,
  artworkHref,
  isArtworkStoreConfigured,
  listArtwork,
  type Artwork,
} from "@/lib/ads/artwork";
import { linksForAdvertiser, listLinks, type AdLinkRecord } from "@/lib/ads/link-store";
import { getCodeStats, type CodeStats } from "@/lib/ads/scan-store";
import {
  formatDate,
  getAdvertiser,
  today,
  toView,
  type AdvertiserView,
} from "@/lib/ads/roster";
import {
  Card,
  Empty,
  Field,
  Note,
  Pill,
  SubHead,
  Tile,
  btnGhost,
  btnPrimary,
  inputClass,
  labelClass,
  linkAction,
  linkQuiet,
  money,
  selectClass,
  stamp,
  type Tone,
} from "../../_components/ui";
import { tabHref } from "../../_components/types";
import {
  addClientLinkAction,
  countersignAgreementAction,
  deleteArtworkAction,
  deleteDocumentAction,
  prepareAgreementAction,
  repointClientLinkAction,
  deletePaymentAction,
  recordPaymentAction,
  saveNotesAction,
  sendAgreementAction,
  uploadAgreementAction,
  uploadArtworkAction,
  uploadDocumentAction,
  voidAgreementAction,
} from "./actions";
import {
  activeAgreement,
  isIntact,
  listAgreements,
  pendingAgreement,
  sourceOf,
  type Agreement,
} from "@/lib/ads/agreements";
import {
  documentHref,
  isDocumentStoreConfigured,
  listDocuments,
  type DocumentRecord,
} from "@/lib/ads/documents";
import { describeBlobEnv } from "@/lib/ads/blob";
import {
  listPayments,
  standing,
  PAYMENT_METHODS,
  type Payment,
} from "@/lib/ads/payments";
import {
  agreementText,
  TEMPLATE_REVIEWED,
  TEMPLATE_VERSION,
} from "@/lib/ads/agreement-template";
import { agreementUrl, isLinkSigningConfigured } from "@/lib/ads/links";
import { isEmailConfigured } from "@/lib/ads/email";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Client",
  robots: { index: false, follow: false },
};

/** Slide refreshes get stale quietly, so the age is called out rather than shown. */
const ARTWORK_STALE_DAYS = 90;

/* --------------------------------- banner --------------------------------- */

const MESSAGES: Record<string, string> = {
  notesSaved: "Notes saved.",
  paymentRecorded: "Payment recorded.",
  paymentRemoved: "Payment removed.",
  agreementPrepared: "Agreement drafted. Read it through, then send it.",
  agreementFiled: "Signed agreement filed. This client's paperwork is covered.",
  documentSaved: "Document saved.",
  documentRemoved: "Document removed.",
  agreementSent: "Agreement sent.",
  agreementDone: "Countersigned. The paperwork is complete.",
  agreementVoided: "Agreement cancelled. It stays on file.",
  artworkSaved: "Artwork uploaded.",
  artworkRemoved: "Artwork removed.",
  linkAdded: "QR code created.",
  linkSaved: "Destination updated — the printed code still works.",
};

const ERRORS: Record<string, string> = {
  missing: "Something didn't come through. Try that again.",
  save: "The database didn't accept that. Check the connection and retry.",
  artwork: "That artwork didn't upload.",
  artworkmissing: "Pick a file first.",
  destination: "That destination isn't right.",
  code: "That code isn't valid.",
  codetaken: "That code already belongs to something else.",
  codemissing: "There's no code by that name.",
  agreementNoEmail: "This client has no email address, so there's nowhere to send it. Add one on the contract editor, or copy the signing link and send it yourself.",
  agreementNoMail: "Email isn't connected yet. Copy the signing link below and send it however you like — the signing page works either way.",
  agreementNoSecret: "ADS_LINK_SECRET isn't set, so no signing link can be made. It's on the Setup tab.",
  agreementSend: "The agreement didn't send.",
  agreementState: "That agreement isn't in a state where that's possible. Reload the page.",
  docmissing: "Pick a file first.",
  docupload: "That file didn't upload.",
  docsigneddate: "When was it signed? Give a date.",
  doccovers: "Which term does it cover? Give the end date.",
  docsigner: "Who signed it? A full name.",
  payment: "That payment didn't record.",
};

function ResultBanner({
  msg,
  err,
  detail,
}: {
  msg?: string;
  err?: string;
  detail?: string;
}) {
  const text = err ? ERRORS[err] : msg ? MESSAGES[msg] : undefined;
  if (!text) return null;

  // A code arrives as a bare name; show it the way it gets printed.
  const isCode = msg === "linkAdded" || msg === "linkSaved" || err === "codetaken";
  const note = detail ? (isCode ? `/go/${detail}` : detail) : "";

  return (
    <div className="mb-6">
      <Note tone={err ? "bad" : "ok"}>
        <p className="text-sm font-semibold text-white">{text}</p>
        {note && <p className="mt-1.5 text-sm text-white/55">{note}</p>}
      </Note>
    </div>
  );
}

/* -------------------------------- the deal -------------------------------- */

function statusTone(view: AdvertiserView): { label: string; tone: Tone } {
  if (view.overdue) return { label: "Term ended", tone: "brand" };
  if (view.expiringSoon) return { label: `${view.daysRemaining} days left`, tone: "warn" };
  if (view.status === "active") return { label: "Running", tone: "ok" };
  if (view.status === "pending") return { label: "Signed, not live", tone: "neutral" };
  return { label: "Ended", tone: "neutral" };
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 py-3 border-t border-white/[0.06] first:border-t-0">
      <dt className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-semibold">
        {label}
      </dt>
      <dd className="text-sm text-white/75 tabular-nums text-right">{children}</dd>
    </div>
  );
}

function TheDeal({ view }: { view: AdvertiserView }) {
  return (
    <Card
      title="The deal"
      lede={
        view.isCustom
          ? "This client is on a rate of their own — every figure below is what they actually pay."
          : "Package pricing, straight off the rate card."
      }
      action={
        <a href={`${tabHref("advertisers", { edit: view.id })}#editor`} className={btnGhost}>
          Edit contract
        </a>
      }
      className="mb-5"
    >
      <dl>
        <Row label="Package">
          {view.planName}
          {view.isCustom && (
            <span className="ml-2">
              <Pill tone="warn">custom</Pill>
            </span>
          )}
        </Row>
        <Row label="Monthly">
          {view.monthly ? `${money(view.monthly)}/mo` : "no charge"}
          {view.monthly !== view.listMonthly && (
            <span className="ml-2 text-white/30 line-through">
              {money(view.listMonthly)}
            </span>
          )}
        </Row>
        <Row label="Setup">
          {view.setup ? money(view.setup) : "waived"}
          {view.setup !== view.listSetup && (
            <span className="ml-2 text-white/30 line-through">
              {view.listSetup ? money(view.listSetup) : "waived"}
            </span>
          )}
        </Row>
        <Row label="Term">
          {view.months} months
          {view.months !== view.listMonths && (
            <span className="ml-2 text-white/30 line-through">{view.listMonths}</span>
          )}
        </Row>
        <Row label="Runs">
          {formatDate(view.startDate)} → {formatDate(view.endDate)}
        </Row>
        <Row label="Whole term">
          {money(view.termValue)}
          {view.termValue !== view.listTermValue && (
            <span className="ml-2 text-white/30 line-through">
              {money(view.listTermValue)}
            </span>
          )}
        </Row>
        <Row label="Category">{view.category || "—"}</Row>
      </dl>

      {view.isCustom && (
        <div className="mt-5">
          <Note tone="warn">
            <p className="text-[10px] uppercase tracking-[0.16em] text-amber-300/70 font-semibold">
              Why they're not on list price
            </p>
            <p className="mt-1.5 text-sm text-white/75">
              {view.dealNote || "No reason recorded — add one on the contract editor."}
            </p>
            {view.monthlyDiscount !== 0 && (
              <p className="mt-2 text-sm text-white/45 tabular-nums">
                {view.monthlyDiscount > 0
                  ? `${money(view.monthlyDiscount)}/mo under list — ${money(
                      view.monthlyDiscount * view.months,
                    )} across the term.`
                  : `${money(-view.monthlyDiscount)}/mo over list.`}
              </p>
            )}
          </Note>
        </div>
      )}
    </Card>
  );
}

/* -------------------------------- QR codes -------------------------------- */

/** A plain area chart of the last 30 days. No axis — it's a shape, not a table. */
function Sparkline({ series }: { series: { date: string; count: number }[] }) {
  if (series.length < 2) return null;
  const peak = Math.max(1, ...series.map((p) => p.count));
  const step = 100 / (series.length - 1);
  const points = series.map((p, i) => `${i * step},${30 - (p.count / peak) * 30}`);

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className="w-full h-8"
      aria-hidden
    >
      <polygon points={`0,30 ${points.join(" ")} 100,30`} fill="rgba(220,38,38,0.16)" />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="#DC2626"
        strokeWidth="1.2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function CodeCard({
  link,
  stats,
  advertiserId,
}: {
  link: AdLinkRecord;
  stats: CodeStats;
  advertiserId: string;
}) {
  return (
    <li className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm text-[#f87171]">/go/{link.code}</p>
          <p className="text-xs text-white/35 mt-0.5">{link.label}</p>
        </div>
        {link.active ? <Pill tone="ok">Live</Pill> : <Pill>Retired</Pill>}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        {[
          { label: "All time", value: stats.total },
          { label: "Last 7", value: stats.last7 },
          { label: "Today", value: stats.today },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-2xl font-semibold text-white tabular-nums">{s.value}</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/30 font-semibold mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Sparkline series={stats.series} />
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/25 font-semibold mt-1">
          Last 30 days
        </p>
      </div>

      {/* Where the phones were. Only counts from the day this started being
          recorded, so an older code shows nothing rather than a false zero. */}
      {stats.byPlace.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/25 font-semibold mb-1.5">
            Scanned from
          </p>
          <div className="flex flex-wrap gap-1.5">
            {stats.byPlace.slice(0, 5).map((place) => (
              <span
                key={place.name}
                className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/60"
              >
                {place.name}{" "}
                <span className="text-white/35 tabular-nums">{place.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <form action={repointClientLinkAction} className="mt-4 space-y-2">
        <input type="hidden" name="id" value={advertiserId} />
        <input type="hidden" name="code" value={link.code} />
        <label className={labelClass} htmlFor={`dest-${link.code}`}>
          Sends people to
        </label>
        <input
          id={`dest-${link.code}`}
          name="destination"
          type="url"
          defaultValue={link.destination}
          className={inputClass}
        />
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <button type="submit" className={linkAction}>
            Save destination
          </button>
          <a href={`/api/ads/qr/${link.code}?format=png`} className={linkQuiet}>
            PNG
          </a>
          <a href={`/api/ads/qr/${link.code}?format=svg`} className={linkQuiet}>
            SVG
          </a>
          <a href={`${tabHref("qr", { editLink: link.code })}#qr`} className={linkQuiet}>
            Full settings
          </a>
        </div>
      </form>
    </li>
  );
}

function CodesCard({
  view,
  codes,
}: {
  view: AdvertiserView;
  codes: { link: AdLinkRecord; stats: CodeStats }[];
}) {
  const total = codes.reduce((sum, c) => sum + c.stats.total, 0);

  return (
    <Card
      title="QR codes"
      lede={
        codes.length > 1
          ? "Each placement is counted on its own, so you can tell which one is doing the work."
          : "Add a code per placement — flyer, window, table tent — and compare them."
      }
      className="mb-5"
    >
      {codes.length === 0 ? (
        <Empty>No codes yet. Make their first one below.</Empty>
      ) : (
        <>
          <ul className="grid sm:grid-cols-2 gap-4">
            {codes.map(({ link, stats }) => (
              <CodeCard
                key={link.code}
                link={link}
                stats={stats}
                advertiserId={view.id}
              />
            ))}
          </ul>
          {codes.length > 1 && (
            <p className="mt-5 text-sm text-white/45 tabular-nums">
              {total.toLocaleString()} scans across {codes.length} codes.
            </p>
          )}
        </>
      )}

      <details className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-white list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02]">
          Add another code
        </summary>
        <form action={addClientLinkAction} className="px-5 pb-5 pt-1 space-y-4">
          <input type="hidden" name="id" value={view.id} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Where it sends people"
              name="destination"
              id="newDestination"
              type="url"
              placeholder="https://theirsite.com/book"
              required
            />
            <Field
              label="What it's for"
              name="label"
              id="newLabel"
              placeholder="Flyer, window cling, table tent…"
            />
          </div>
          <Field
            label="Code"
            name="code"
            id="newCode"
            placeholder="leave blank and we'll name it"
            hint={`Left blank, it's named from their code and the placement — "flyer" becomes /go/${
              codes[0]?.link.code ?? "them"
            }-flyer. It gets printed, so it can never be changed later.`}
          />
          <button type="submit" className={btnPrimary}>
            Create code
          </button>
        </form>
      </details>
    </Card>
  );
}

/* -------------------------------- artwork --------------------------------- */

const fileSize = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function ArtworkCard({
  view,
  artwork,
  configured,
}: {
  view: AdvertiserView;
  artwork: Artwork[];
  configured: boolean;
}) {
  const current = artwork[0] ?? null;
  const age = artworkAgeDays(current);
  const history = artwork.slice(1);

  return (
    <Card
      title="Ad artwork"
      lede="The slide that's on the screens, and everything we've run for them before."
      className="mb-5"
    >
      {!configured && (
        <div className="mb-5">
          <Note tone="warn">
            <p className="text-sm font-semibold text-white">
              This deployment can&apos;t see the file storage — artwork can&apos;t be
              saved yet.
            </p>
            <p className="mt-1.5 text-sm text-white/55">{describeBlobEnv()}</p>
            <p className="mt-2 text-xs text-white/35">
              Everything else on this page works without it.
            </p>
          </Note>
        </div>
      )}

      {current ? (
        <div className="grid sm:grid-cols-[minmax(0,20rem)_1fr] gap-6 items-start">
          <a
            href={artworkHref(view.id, current.id)}
            target="_blank"
            rel="noreferrer"
            className="block rounded-2xl border border-white/[0.07] overflow-hidden bg-black"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artworkHref(view.id, current.id)}
              alt={`Current ad artwork for ${view.business}`}
              className="w-full h-auto"
            />
          </a>
          <div>
            <SubHead>On the screens now</SubHead>
            <p className="text-sm text-white/70">{current.note || current.filename}</p>
            <p className="mt-1 text-xs text-white/35">
              Uploaded {stamp(current.uploadedAt)} · {fileSize(current.size)}
            </p>
            {age !== null && age >= ARTWORK_STALE_DAYS && (
              <div className="mt-4">
                <Note tone="warn">
                  <p className="text-sm text-white/75">
                    This slide is {age} days old. Worth asking whether they want it
                    refreshed — it&apos;s an easy reason to call.
                  </p>
                </Note>
              </div>
            )}
            <form action={deleteArtworkAction} className="mt-4">
              <input type="hidden" name="id" value={view.id} />
              <input type="hidden" name="artworkId" value={current.id} />
              <button type="submit" className={linkQuiet}>
                Remove this version
              </button>
            </form>
          </div>
        </div>
      ) : (
        <Empty>No artwork on file. Upload their slide below.</Empty>
      )}

      {history.length > 0 && (
        <div className="mt-7 pt-6 border-t border-white/[0.06]">
          <SubHead>Previous versions</SubHead>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {history.map((item) => (
              <li key={item.id}>
                <a
                  href={artworkHref(view.id, item.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-white/[0.07] overflow-hidden bg-black"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={artworkHref(view.id, item.id)}
                    alt={item.note || item.filename}
                    className="w-full h-auto"
                  />
                </a>
                <p className="mt-1.5 text-xs text-white/35 truncate">
                  {item.note || stamp(item.uploadedAt)}
                </p>
                <form action={deleteArtworkAction}>
                  <input type="hidden" name="id" value={view.id} />
                  <input type="hidden" name="artworkId" value={item.id} />
                  <button type="submit" className={linkQuiet}>
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        action={uploadArtworkAction}
        className="mt-7 pt-6 border-t border-white/[0.06] space-y-4"
      >
        <input type="hidden" name="id" value={view.id} />
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="artwork">
              New slide
            </label>
            <input
              id="artwork"
              name="artwork"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white`}
            />
            <p className="mt-1.5 text-xs text-white/30">
              PNG, JPG, WEBP or GIF, up to 4 MB.
            </p>
          </div>
          <Field
            label="What changed"
            name="note"
            id="artworkNote"
            placeholder="Spring menu, new phone number…"
          />
        </div>
        <button type="submit" className={btnPrimary} disabled={!configured}>
          Upload artwork
        </button>
      </form>
    </Card>
  );
}

/* -------------------------------- payments -------------------------------- */

const methodLabel = (id: string) =>
  PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;

/**
 * What this client has actually paid.
 *
 * Compared against the whole term rather than a monthly schedule: a prepaid
 * term settles in one payment and an invoiced one arrives in pieces, and both
 * end at the same number. The venue owner's share is calculated from these
 * records, so a payment left untyped is money the statement will not see.
 */
function PaymentsCard({
  view,
  payments,
}: {
  view: AdvertiserView;
  payments: Payment[];
}) {
  const position = standing(payments, view.termValue);

  return (
    <Card
      title="Payments"
      lede={
        view.soldAsTotal
          ? "This term was sold as one price, so it settles in a single payment."
          : "What has actually arrived, against what the term is worth."
      }
      className="mb-5"
    >
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Tile label="Paid" value={money(position.paid)} hint={
          position.lastPaidOn ? `last ${formatDate(position.lastPaidOn)}` : "nothing yet"
        } />
        <Tile
          label={position.overpaid > 0 ? "Overpaid" : "Outstanding"}
          value={money(position.overpaid > 0 ? position.overpaid : position.outstanding)}
          tone={position.outstanding > 0 ? "alert" : "plain"}
          hint={position.overpaid > 0 ? "more than the term is worth" : "still to collect"}
        />
        <Tile label="Whole term" value={money(view.termValue)} hint={`${view.months} months`} />
      </div>

      {payments.length === 0 ? (
        <Empty>Nothing recorded yet. Add a payment when the money lands.</Empty>
      ) : (
        <ul className="divide-y divide-white/[0.06] mb-6">
          {payments.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span>
                <span className="text-sm font-semibold text-white tabular-nums">
                  {money(p.amount)}
                </span>
                <span className="text-xs text-white/35">
                  {" "}· {formatDate(p.receivedOn)} · {methodLabel(p.method)}
                </span>
                {(p.reference || p.note) && (
                  <span className="block text-xs text-white/30 mt-0.5">
                    {[p.reference, p.note].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
              <form action={deletePaymentAction}>
                <input type="hidden" name="id" value={view.id} />
                <input type="hidden" name="paymentId" value={p.id} />
                <button type="submit" className={linkQuiet}>
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={recordPaymentAction} className="space-y-4 border-t border-white/[0.06] pt-5">
        <input type="hidden" name="id" value={view.id} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field
            label="Amount"
            name="amount"
            id="payAmount"
            inputMode="decimal"
            placeholder={String(Math.round(view.termValue))}
            required
          />
          <Field
            label="Date it arrived"
            name="receivedOn"
            id="payDate"
            type="date"
            defaultValue={today()}
            required
          />
          <div>
            <label className={labelClass} htmlFor="payMethod">
              How
            </label>
            <select id="payMethod" name="method" className={selectClass} defaultValue="stripe">
              {PAYMENT_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Reference"
            name="reference"
            id="payRef"
            placeholder="Stripe id, cheque no."
          />
        </div>
        <button type="submit" className={btnPrimary}>
          Record payment
        </button>
        <p className="text-xs text-white/30 leading-relaxed">
          The venue owner&apos;s share is calculated from these records, so a payment
          that isn&apos;t here is money the monthly statement won&apos;t see.
        </p>
      </form>
    </Card>
  );
}

/* ------------------------------- agreements ------------------------------- */

const AGREEMENT_STATUS: Record<Agreement["status"], { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  filed: { label: "On file", tone: "ok" },
  sent: { label: "Sent", tone: "warn" },
  viewed: { label: "Opened", tone: "warn" },
  signed: { label: "Signed — needs you", tone: "brand" },
  countersigned: { label: "Complete", tone: "ok" },
  void: { label: "Cancelled", tone: "neutral" },
};

/** The signature and the evidence behind it, laid out so it can be read back. */
function SignatureBlock({ agreement }: { agreement: Agreement }) {
  const sig = agreement.signature;
  if (!sig) return null;
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4">
      <SubHead>Signature on file</SubHead>
      <p className="text-sm text-white/75">
        {sig.name} · {stamp(sig.at)}
      </p>
      <p className="mt-1 text-xs text-white/35 break-words">
        {[sig.email, sig.ip && `from ${sig.ip}`].filter(Boolean).join(" · ")}
      </p>
      <p className="mt-2 text-[11px] text-white/25 font-mono break-all">
        {sig.bodyHash.slice(0, 32)}…
      </p>
      <p className="mt-1 text-xs text-white/30">
        {isIntact(agreement)
          ? "The copy on file still matches what they signed."
          : "WARNING — the copy on file no longer matches what was signed."}
      </p>
      {agreement.countersignature && (
        <p className="mt-3 pt-3 border-t border-white/[0.06] text-sm text-white/75">
          Countersigned by {agreement.countersignature.name} ·{" "}
          {stamp(agreement.countersignature.at)}
        </p>
      )}
    </div>
  );
}

function FiledAgreementRow({
  agreement,
  advertiserId,
  document,
}: {
  agreement: Agreement;
  advertiserId: string;
  document?: DocumentRecord;
}) {
  return (
    <details className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-4 list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors">
        <span className="flex flex-wrap items-center gap-2.5">
          <span className="text-sm font-semibold text-white">
            {agreement.filedNote || "Signed agreement"}
          </span>
          <Pill tone="ok">On file</Pill>
          <span className="text-xs text-white/30">signed elsewhere</span>
        </span>
        <span className="text-xs text-white/35 tabular-nums">
          {agreement.filedSignedOn ? formatDate(agreement.filedSignedOn) : ""}
        </span>
      </summary>

      <div className="px-5 pb-5 pt-1 space-y-4">
        <dl>
          {(
            [
              ["Signed by", agreement.filedSignerName || "—"],
              [
                "Signed on",
                agreement.filedSignedOn ? formatDate(agreement.filedSignedOn) : "—",
              ],
              [
                "Covers the term ending",
                agreement.coversEndDate ? formatDate(agreement.coversEndDate) : "—",
              ],
              ["File", document ? `${document.filename} · ${fileSize(document.size)}` : "missing"],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div
              key={label}
              className="flex flex-wrap items-baseline justify-between gap-3 py-2 border-b border-white/[0.05]"
            >
              <dt className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-semibold">
                {label}
              </dt>
              <dd className="text-sm text-white/75 text-right">{value}</dd>
            </div>
          ))}
        </dl>

        {document && (
          <div>
            <a
              href={documentHref(document.id)}
              target="_blank"
              rel="noreferrer"
              className={btnGhost}
            >
              Open the signed copy
            </a>
            <p className="mt-2 text-[11px] text-white/25 font-mono break-all">
              sha256 {document.sha256.slice(0, 32)}…
            </p>
            <p className="mt-1 text-xs text-white/30">
              Signed outside this portal, so the details above are what you recorded
              rather than anything read from the file itself.
            </p>
          </div>
        )}

        <form action={voidAgreementAction} className="flex items-center gap-3 pt-1">
          <input type="hidden" name="id" value={advertiserId} />
          <input type="hidden" name="agreementId" value={agreement.id} />
          <input
            name="reason"
            placeholder="why?"
            className={`${inputClass} w-40 py-1.5 text-xs`}
          />
          <button type="submit" className={linkQuiet}>
            Mark it void
          </button>
        </form>
      </div>
    </details>
  );
}

function AgreementRow({
  agreement,
  advertiserId,
  signUrl,
  emailConfigured,
}: {
  agreement: Agreement;
  advertiserId: string;
  signUrl: string | null;
  emailConfigured: boolean;
}) {
  const status = AGREEMENT_STATUS[agreement.status];
  const open = agreement.status !== "void" && agreement.status !== "countersigned";

  return (
    <details
      open={open}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
    >
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-4 list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors">
        <span className="flex flex-wrap items-center gap-2.5">
          <span className="text-sm font-semibold text-white">
            Advertising agreement
          </span>
          <Pill tone={status.tone}>{status.label}</Pill>
          <span className="text-xs text-white/30">{agreement.templateVersion}</span>
        </span>
        <span className="text-xs text-white/35 tabular-nums">
          {stamp(agreement.createdAt)}
        </span>
      </summary>

      <div className="px-5 pb-5 pt-1 space-y-4">
        <dl className="grid sm:grid-cols-2 gap-x-6">
          {(
            [
              ["Rate", agreement.terms.monthly > 0 ? `${money(agreement.terms.monthly)}/mo` : "no charge"],
              ["Setup", agreement.terms.setup > 0 ? money(agreement.terms.setup) : "waived"],
              ["Term", `${agreement.terms.months} months`],
              [
                "Runs",
                `${formatDate(agreement.terms.startDate)} → ${formatDate(agreement.terms.endDate)}`,
              ],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-3 py-2 border-b border-white/[0.05]"
            >
              <dt className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-semibold">
                {label}
              </dt>
              <dd className="text-sm text-white/75 tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <SignatureBlock agreement={agreement} />

        {agreement.voidReason && (
          <p className="text-sm text-white/45">Cancelled: {agreement.voidReason}</p>
        )}

        <details className="rounded-xl border border-white/[0.07] bg-black/20 overflow-hidden">
          <summary className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/40 list-none [&::-webkit-details-marker]:hidden hover:text-white/70">
            Read the full terms
          </summary>
          <pre className="px-4 pb-4 text-[11px] leading-relaxed text-white/55 whitespace-pre-wrap break-words font-mono">
            {agreementText(agreement.terms)}
          </pre>
        </details>

        {/* The signing link is always shown, not just when email works — it is
            the thing that actually lets a client sign, and it must not be
            gated behind an integration that isn't switched on yet. */}
        {signUrl && agreement.status !== "void" && !agreement.signature && (
          <div>
            <SubHead>Signing link</SubHead>
            <p className="text-[11px] text-[#f87171] font-mono break-all leading-relaxed">
              {signUrl}
            </p>
            <p className="mt-1.5 text-xs text-white/30">
              Anyone with this link can sign. Send it to the client however you
              like — it works whether or not email is connected.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 pt-1">
          {agreement.status === "draft" && (
            <form action={sendAgreementAction}>
              <input type="hidden" name="id" value={advertiserId} />
              <input type="hidden" name="agreementId" value={agreement.id} />
              <button type="submit" className={btnPrimary} disabled={!emailConfigured}>
                Email it to the client
              </button>
            </form>
          )}

          {agreement.status === "signed" && (
            <form action={countersignAgreementAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={advertiserId} />
              <input type="hidden" name="agreementId" value={agreement.id} />
              <div>
                <label className={labelClass} htmlFor={`cs-${agreement.id}`}>
                  Countersign as
                </label>
                <input
                  id={`cs-${agreement.id}`}
                  name="name"
                  defaultValue="Smart Scale"
                  className={inputClass}
                />
              </div>
              <button type="submit" className={btnPrimary}>
                Countersign
              </button>
            </form>
          )}

          {agreement.status !== "void" && agreement.status !== "countersigned" && (
            <form action={voidAgreementAction} className="flex items-center gap-3">
              <input type="hidden" name="id" value={advertiserId} />
              <input type="hidden" name="agreementId" value={agreement.id} />
              <input
                name="reason"
                placeholder="why?"
                className={`${inputClass} w-40 py-1.5 text-xs`}
              />
              <button type="submit" className={linkQuiet}>
                Cancel it
              </button>
            </form>
          )}
        </div>
      </div>
    </details>
  );
}

/**
 * Filing something signed elsewhere. Deliberately asks for the signer, the date
 * and the term it covers instead of guessing any of them — nothing here reads
 * the file, and a wrong guess on a contract is worse than an empty box.
 */
function UploadAgreement({
  view,
  configured,
}: {
  view: AdvertiserView;
  configured: boolean;
}) {
  return (
    <details className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-4 list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors">
        <span className="text-sm font-semibold text-white">
          Already signed one elsewhere? File it here
        </span>
        <span className="text-xs text-white/35">upload</span>
      </summary>

      <div className="px-5 pb-5 pt-1">
        {!configured ? (
          <Note tone="warn">
            <p className="text-sm font-semibold text-white">
              This deployment can&apos;t see the file storage.
            </p>
            <p className="mt-1.5 text-sm text-white/55">
              {describeBlobEnv()}
            </p>
            <p className="mt-2 text-xs text-white/35 leading-relaxed">
              If Vercel shows a Blob store connected and this still says otherwise,
              it is one of two things: the store was connected after this deployment
              was built, or it was attached with an environment-variable prefix. A
              redeploy fixes the first, and the line above names what was found for
              the second.
            </p>
          </Note>
        ) : (
          <form action={uploadAgreementAction} className="space-y-4">
            <input type="hidden" name="id" value={view.id} />

            <div>
              <label className={labelClass} htmlFor="agreementFile">
                The signed agreement <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="agreementFile"
                name="document"
                type="file"
                required
                accept="application/pdf,image/png,image/jpeg,image/webp,.doc,.docx"
                className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white`}
              />
              <p className="mt-1.5 text-xs text-white/30">
                PDF, Word or a photo of the signed pages, up to 4 MB.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Field
                label="Who signed it"
                name="signerName"
                id="filedSigner"
                defaultValue={view.contactName}
                required
              />
              <Field
                label="Signed on"
                name="signedOn"
                id="filedSignedOn"
                type="date"
                defaultValue={today()}
                required
              />
              <Field
                label="Covers term ending"
                name="coversEndDate"
                id="filedCovers"
                type="date"
                defaultValue={view.endDate}
                required
                hint="Their current term ends here."
              />
            </div>

            <Field
              label="What it is"
              name="note"
              id="filedNote"
              placeholder="Signed agreement, countersigned copy, amendment…"
            />

            <button type="submit" className={btnPrimary}>
              File this agreement
            </button>
            <p className="text-xs text-white/30 leading-relaxed">
              Filing it counts as covered paperwork for the term you name, and the
              client stops showing as unsigned. Stored privately — it is only
              readable while signed in here, never from a public address.
            </p>
          </form>
        )}
      </div>
    </details>
  );
}

/** Anything else worth keeping — a W-9, a certificate, a scan of something. */
function OtherDocuments({
  view,
  documents,
  configured,
}: {
  view: AdvertiserView;
  documents: DocumentRecord[];
  configured: boolean;
}) {
  return (
    <div className="mt-7 pt-6 border-t border-white/[0.06]">
      <SubHead>Other documents</SubHead>

      {documents.length === 0 ? (
        <p className="text-sm text-white/35 mb-4">
          Nothing else on file for this client.
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.06] mb-4">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-3 py-2.5"
            >
              <a
                href={documentHref(doc.id)}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-white hover:text-[#f87171] transition-colors"
              >
                {doc.label}
              </a>
              <span className="flex items-center gap-4">
                <span className="text-xs text-white/30 tabular-nums">
                  {fileSize(doc.size)} · {stamp(doc.uploadedAt)}
                </span>
                <form action={deleteDocumentAction}>
                  <input type="hidden" name="id" value={view.id} />
                  <input type="hidden" name="documentId" value={doc.id} />
                  <button type="submit" className={linkQuiet}>
                    Remove
                  </button>
                </form>
              </span>
            </li>
          ))}
        </ul>
      )}

      {configured && (
        <form action={uploadDocumentAction} className="grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <input type="hidden" name="id" value={view.id} />
          <div>
            <label className={labelClass} htmlFor="otherDoc">
              Add a document
            </label>
            <input
              id="otherDoc"
              name="document"
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp,.doc,.docx"
              className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white`}
            />
          </div>
          <Field label="What it is" name="label" id="otherDocLabel" placeholder="W-9, insurance certificate…" />
          <button type="submit" className={btnGhost}>
            Save
          </button>
        </form>
      )}
    </div>
  );
}

function DocumentsCard({
  view,
  agreements,
  documents,
  signUrls,
  emailConfigured,
  signingConfigured,
  storageConfigured,
}: {
  view: AdvertiserView;
  agreements: Agreement[];
  documents: DocumentRecord[];
  signUrls: Record<string, string | null>;
  emailConfigured: boolean;
  signingConfigured: boolean;
  storageConfigured: boolean;
}) {
  const complete = activeAgreement(agreements);
  const pending = pendingAgreement(agreements);
  const draft = agreements.find((a) => a.status === "draft");

  return (
    <Card
      title="Documents"
      lede="The advertising agreement, and the record of who signed what and when."
      action={
        !draft && !pending ? (
          <form action={prepareAgreementAction}>
            <input type="hidden" name="id" value={view.id} />
            <button type="submit" className={btnGhost}>
              {complete ? "Prepare a new one" : "Prepare agreement"}
            </button>
          </form>
        ) : undefined
      }
    >
      {!TEMPLATE_REVIEWED && (
        <div className="mb-5">
          <Note tone="warn">
            <p className="text-sm font-semibold text-white">
              The agreement wording ({TEMPLATE_VERSION}) hasn&apos;t been checked
              against the original yet.
            </p>
            <p className="mt-1.5 text-sm text-white/55">
              This is Smart Scale&apos;s own text, transcribed from the signed PDF —
              which is exactly the kind of thing that looks right until the one
              clause that matters is wrong. Open &ldquo;Read the full terms&rdquo;
              on any agreement below and compare it against the original once, then
              set TEMPLATE_REVIEWED to true in agreement-template.ts to clear this.
              Every signature records which version it was, so replacing the wording
              later never changes what someone already signed.
            </p>
          </Note>
        </div>
      )}

      {!signingConfigured && (
        <div className="mb-5">
          <Note tone="bad">
            <p className="text-sm font-semibold text-white">
              No signing links can be made yet.
            </p>
            <p className="mt-1.5 text-sm text-white/55">
              ADS_LINK_SECRET isn&apos;t set. It&apos;s on the Setup tab, and it&apos;s
              the same secret the renewal buttons use.
            </p>
          </Note>
        </div>
      )}

      {view.status === "active" && !complete && (
        <div className="mb-5">
          <Note tone="warn">
            <p className="text-sm font-semibold text-white">
              This client is running with no signed agreement.
            </p>
            <p className="mt-1.5 text-sm text-white/55">
              {pending
                ? "One is out with them — chase it before the term gets much further along."
                : "Prepare one and send it. Nothing here blocks you from running the ad, but the paperwork should catch up."}
            </p>
          </Note>
        </div>
      )}

      {agreements.length === 0 ? (
        <Empty>
          No agreement yet. Prepare one here — the rate, term and dates come
          straight off their contract — or file a copy you signed elsewhere.
        </Empty>
      ) : (
        <div className="space-y-3">
          {agreements.map((agreement) =>
            sourceOf(agreement) === "uploaded" ? (
              <FiledAgreementRow
                key={agreement.id}
                agreement={agreement}
                advertiserId={view.id}
                document={documents.find((d) => d.id === agreement.documentId)}
              />
            ) : (
              <AgreementRow
                key={agreement.id}
                agreement={agreement}
                advertiserId={view.id}
                signUrl={signUrls[agreement.id] ?? null}
                emailConfigured={emailConfigured}
              />
            ),
          )}
        </div>
      )}

      <div className="mt-3">
        <UploadAgreement view={view} configured={storageConfigured} />
      </div>

      <OtherDocuments
        view={view}
        documents={documents.filter((d) => d.kind === "other")}
        configured={storageConfigured}
      />
    </Card>
  );
}

/* --------------------------------- page ----------------------------------- */

export default async function ClientProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; err?: string; detail?: string }>;
}) {
  if (!(await isSignedIn())) redirect("/advertise/admin");

  const [{ id }, query] = await Promise.all([params, searchParams]);

  const advertiser = await getAdvertiser(id);
  if (!advertiser) notFound();

  const view = toView(advertiser);
  const allLinks = await listLinks();
  const theirLinks = linksForAdvertiser(allLinks, id, advertiser.qrCode);

  const [codes, artwork, agreements, documents, payments] = await Promise.all([
    Promise.all(
      theirLinks.map(async (link) => ({
        link,
        stats: await getCodeStats(link.code, 30),
      })),
    ),
    listArtwork(id),
    listAgreements(id),
    listDocuments(id),
    listPayments(id),
  ]);

  // Built here rather than in the component: the token is derived from a
  // server-only secret, and a client component should never be handed one.
  const signUrls: Record<string, string | null> = {};
  for (const agreement of agreements) {
    signUrls[agreement.id] = agreementUrl(agreement.id);
  }

  const totalScans = codes.reduce((sum, c) => sum + c.stats.total, 0);
  const status = statusTone(view);

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
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 pb-5">
          <a href={tabHref("advertisers")} className={`${linkQuiet} inline-block mb-3`}>
            ← All advertisers
          </a>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl sm:text-4xl text-white tracking-tight">
                  {view.business}
                </h1>
                <Pill tone={status.tone}>{status.label}</Pill>
              </div>
              <p className="mt-2 text-sm text-white/40">
                {[view.category, view.contactName, view.email, view.phone]
                  .filter(Boolean)
                  .join(" · ") || "No contact details yet"}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              {view.phone && (
                <a href={`tel:${view.phone.replace(/[^\d+]/g, "")}`} className={btnGhost}>
                  Call
                </a>
              )}
              {view.email && (
                <a href={`mailto:${view.email}`} className={btnGhost}>
                  Email
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
        <ResultBanner msg={query.msg} err={query.err} detail={query.detail} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
          <Tile
            label="Their rate"
            value={view.monthly ? `${money(view.monthly)}/mo` : "Free"}
            hint={view.isCustom ? `list is ${money(view.listMonthly)}/mo` : "list price"}
          />
          <Tile
            label="Whole term"
            value={money(view.termValue)}
            hint={`${view.months} months${view.setup ? ` + ${money(view.setup)} setup` : ""}`}
          />
          <Tile
            label={view.daysRemaining >= 0 ? "Days left" : "Days overdue"}
            value={`${Math.abs(view.daysRemaining)}`}
            hint={`ends ${formatDate(view.endDate)}`}
            tone={view.overdue || view.expiringSoon ? "alert" : "plain"}
          />
          <Tile
            label="Total scans"
            value={totalScans.toLocaleString()}
            hint={codes.length === 1 ? "on their code" : `across ${codes.length} codes`}
          />
        </div>

        <TheDeal view={view} />
        <CodesCard view={view} codes={codes} />
        <ArtworkCard
          view={view}
          artwork={artwork}
          configured={isArtworkStoreConfigured()}
        />

        <Card
          title="Notes"
          lede="Anything you'd want to remember before you call them."
          className="mb-5"
        >
          <form action={saveNotesAction} className="space-y-4">
            <input type="hidden" name="id" value={view.id} />
            <textarea
              name="notes"
              rows={4}
              defaultValue={view.notes}
              placeholder="Artwork due, renewal conversation, billing quirks…"
              className={inputClass}
            />
            <button type="submit" className={btnPrimary}>
              Save notes
            </button>
          </form>
        </Card>

        <PaymentsCard view={view} payments={payments} />

        <DocumentsCard
          view={view}
          agreements={agreements}
          documents={documents}
          signUrls={signUrls}
          emailConfigured={isEmailConfigured()}
          signingConfigured={isLinkSigningConfigured()}
          storageConfigured={isDocumentStoreConfigured()}
        />

        <p className="mt-12 text-xs text-white/25 max-w-2xl leading-relaxed">
          A QR code&apos;s name is permanent because it gets printed, but where it sends
          people can be changed at any time and takes effect on the next scan.
        </p>
      </div>
    </main>
  );
}
