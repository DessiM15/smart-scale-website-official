/**
 * Campaigns: everything printed with a QR on it, grouped by client, with
 * what each placement cost and what it brought back.
 *
 * The list page shows every campaign with its totals. A campaign's own page
 * holds its placements, one per code: the artwork to download, the scans,
 * the leads that followed a scan, and the cost per scan those make.
 */

import type { ReactNode } from "react";
import {
  addPlacementAction,
  removePlacementAction,
  saveCampaignAction,
  saveCampaignClientAction,
  setCampaignStatusAction,
  updatePlacementAction,
} from "../actions";
import { logCampaignCostAction } from "../(app)/books/actions";
import {
  CAMPAIGN_STATUSES,
  MEDIA,
  SMART_SCALE_CLIENT_ID,
  campaignTotals,
  mediumOf,
  type Campaign,
  type CampaignClient,
  type CampaignStatus,
  type PlacementFigures,
} from "@/lib/ads/campaigns";
import type { ConversionEvent } from "@/lib/ads/conversions";
import type { AdLinkRecord } from "@/lib/ads/link-store";
import { formatDate } from "@/lib/ads/roster";
import { SubmitButton } from "./submit-button";
import { ADMIN } from "./types";
import {
  Badge,
  Card,
  Disclosure,
  Empty,
  Field,
  Note,
  bebas,
  btnDanger,
  btnGhost,
  btnPrimary,
  btnSm,
  cardClass,
  inputClass,
  labelClass,
  linkAction,
  money,
  numClass,
  selectClass,
  serif,
  stamp,
  tdClass,
  thClass,
  type Tone,
} from "./ui";

export const CAMPAIGNS = `${ADMIN}/campaigns`;

const STATUS_TONE: Record<CampaignStatus, Tone> = { live: "ok", draft: "warn", ended: "neutral" };

const statusLabel = (id: CampaignStatus) => CAMPAIGN_STATUSES.find((s) => s.id === id)?.label ?? id;

/* ---------------------------------- list ---------------------------------- */

export type CampaignSummary = {
  campaign: Campaign;
  client: CampaignClient;
  placements: number;
  scans: number;
  leads: number;
  cost: number;
  costPerScan: number | null;
};

function SummaryRow({ row }: { row: CampaignSummary }) {
  const c = row.campaign;
  return (
    <tr className="hover:bg-white/[0.02] transition-colors">
      <td className={tdClass}>
        <a href={`${CAMPAIGNS}/${c.id}`} className="group">
          <span className={`${serif} text-[19px] leading-none text-white group-hover:text-[#f87171] transition-colors`}>{c.name}</span>
        </a>
        <p className="text-xs text-white/40 mt-1">
          {row.client.name} · {mediumOf(c.medium).label}
        </p>
      </td>
      <td className={tdClass}>
        <Badge tone={STATUS_TONE[c.status]}>{statusLabel(c.status)}</Badge>
      </td>
      <td className={`${tdClass} text-sm text-white/80 whitespace-nowrap`}>
        {formatDate(c.startDate)}
        {c.endDate ? ` – ${formatDate(c.endDate)}` : ""}
      </td>
      <td className={`${tdClass} text-sm text-white/80 tabular-nums`}>{row.placements}</td>
      <td className={`${tdClass} ${numClass} text-[19px] text-white tabular-nums`}>{row.scans.toLocaleString()}</td>
      <td className={`${tdClass} ${numClass} text-[19px] text-white tabular-nums`}>{row.leads.toLocaleString()}</td>
      <td className={`${tdClass} text-sm text-white/80 tabular-nums whitespace-nowrap`}>
        {row.cost > 0 ? money(row.cost) : "—"}
        {row.costPerScan !== null && <span className="text-white/40"> · {money(row.costPerScan)}/scan</span>}
      </td>
      <td className={`${tdClass} text-right`}>
        <a href={`${CAMPAIGNS}/${c.id}`} className={linkAction}>
          Open
        </a>
      </td>
    </tr>
  );
}

function SummaryCard({ row }: { row: CampaignSummary }) {
  const c = row.campaign;
  return (
    <li className={`${cardClass} p-4 flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a href={`${CAMPAIGNS}/${c.id}`} className={`${serif} text-[20px] leading-none text-white`}>{c.name}</a>
          <p className="text-xs text-white/40 mt-1">
            {row.client.name} · {mediumOf(c.medium).label} · {formatDate(c.startDate)}
          </p>
        </div>
        <Badge tone={STATUS_TONE[c.status]}>{statusLabel(c.status)}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/55 tabular-nums">
        <span>{row.placements} {row.placements === 1 ? "placement" : "placements"}</span>
        <span className="text-white">{row.scans.toLocaleString()} scans</span>
        <span>{row.leads} leads</span>
        {row.cost > 0 && <span>{money(row.cost)}{row.costPerScan !== null ? ` · ${money(row.costPerScan)}/scan` : ""}</span>}
      </div>
    </li>
  );
}

export function CampaignList({ rows, filter }: { rows: CampaignSummary[]; filter: string }) {
  if (rows.length === 0) {
    return (
      <Empty>
        {filter === "all"
          ? "No campaigns yet. Start with the car magnets below: one campaign, one placement per car, and the QR artwork is ready to send to the printer."
          : `Nothing ${filter} right now.`}
      </Empty>
    );
  }
  return (
    <>
      <div className={`${cardClass} hidden md:block overflow-x-auto`}>
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr>
              <th className={thClass}>Campaign</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Out since</th>
              <th className={thClass}>Placements</th>
              <th className={thClass}>Scans</th>
              <th className={thClass}>Leads</th>
              <th className={thClass}>Cost</th>
              <th className={thClass} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <SummaryRow key={row.campaign.id} row={row} />
            ))}
          </tbody>
        </table>
      </div>
      <ul className="md:hidden flex flex-col gap-3">
        {rows.map((row) => (
          <SummaryCard key={row.campaign.id} row={row} />
        ))}
      </ul>
    </>
  );
}

/* ------------------------------ campaign form ------------------------------ */

export function CampaignForm({
  clients,
  editing,
  today,
  error,
  open,
}: {
  clients: CampaignClient[];
  editing?: Campaign;
  today: string;
  error?: string;
  open?: boolean;
}) {
  const c = editing;
  return (
    <Disclosure
      id="campaign-form"
      open={open || Boolean(editing) || Boolean(error)}
      summary={<span className={`${bebas} text-[13px] tracking-[0.24em]`}>{editing ? `Edit ${editing.name}` : "New campaign"}</span>}
      hint="a magnet, a flyer run, a stack of cards"
      className="mt-2"
    >
      {error && (
        <div className="my-4">
          <Note tone="bad">
            <p className="text-sm text-white">{error}</p>
          </Note>
        </div>
      )}
      <form action={saveCampaignAction} className="flex flex-col gap-4 pt-3">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" name="name" defaultValue={c?.name} placeholder="Car magnets, fall 2026" required />
          <div>
            <label className={labelClass} htmlFor="campaign-client">Whose</label>
            <select id="campaign-client" name="clientId" defaultValue={c?.clientId ?? SMART_SCALE_CLIENT_ID} className={selectClass}>
              {clients.map((cl) => (
                <option key={cl.id} value={cl.id}>{cl.name}{cl.builtIn ? " (us)" : ""}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-white/30">Smart Scale for our own marketing. Add a client below to run one for them.</p>
          </div>
          <div>
            <label className={labelClass} htmlFor="campaign-medium">Printed on</label>
            <select id="campaign-medium" name="medium" defaultValue={c?.medium ?? "car-magnet"} className={selectClass}>
              {MEDIA.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="campaign-status">Status</label>
            <select id="campaign-status" name="status" defaultValue={c?.status ?? "draft"} className={selectClass}>
              {CAMPAIGN_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <Field label="Goes out" name="startDate" type="date" defaultValue={c?.startDate ?? today} required />
          <Field label="Comes back in" name="endDate" type="date" defaultValue={c?.endDate ?? ""} hint="Leave blank while it's still out there. A magnet is out for years." />
        </div>
        <Field
          label="Where a scan lands"
          name="destination"
          type="url"
          defaultValue={c?.destination}
          placeholder="https://smartscaleagent.com/contact"
          required
          hint="Every code in the campaign sends people here. Change it any time; the printed codes keep working."
        />
        <label className="flex items-center gap-2.5 text-sm text-white/55">
          <input type="checkbox" name="tagDestination" value="1" defaultChecked={c ? c.tagDestination : true} className="accent-[#DC2626]" />
          Tag the link (utm_source, utm_medium, utm_campaign) so the traffic shows in analytics
        </label>
        <div>
          <label className={labelClass} htmlFor="campaign-notes">Notes</label>
          <textarea id="campaign-notes" name="notes" rows={2} defaultValue={c?.notes} placeholder="Printer, sizes, who has the magnets" className={inputClass} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton className={`${btnPrimary} px-6 py-3`} pendingLabel="Saving">
            {editing ? "Save changes" : "Create campaign"}
          </SubmitButton>
          {!editing && <span className="text-xs text-white/30">Next: add a placement per car or per batch, and download its QR.</span>}
        </div>
      </form>
    </Disclosure>
  );
}

export function ClientForm() {
  return (
    <Disclosure id="campaign-client-form" summary={<span className="text-white/60">Add a campaign client</span>} hint="someone we print for" className="mt-3">
      <form action={saveCampaignClientAction} className="grid sm:grid-cols-4 gap-4 pt-3">
        <Field label="Business" name="name" id="cclient-name" required />
        <Field label="Contact" name="contactName" id="cclient-contact" />
        <Field label="Email" name="email" id="cclient-email" type="email" />
        <Field label="Phone" name="phone" id="cclient-phone" type="tel" />
        <div className="sm:col-span-3">
          <Field label="Notes" name="notes" id="cclient-notes" />
        </div>
        <div className="flex items-end">
          <SubmitButton className={`${btnGhost} ${btnSm}`} pendingLabel="Adding">
            Add client
          </SubmitButton>
        </div>
      </form>
      <p className="mt-3 text-xs text-white/30 leading-relaxed">
        Lighter than an advertiser on purpose: a flyer client has no slot, category or rotation. If they also go on the
        screens, they get an advertiser record for that.
      </p>
    </Disclosure>
  );
}

/* --------------------------------- detail --------------------------------- */

export type PlacementRow = PlacementFigures & {
  link: AdLinkRecord | null;
  testScans: number;
  recentLeads: ConversionEvent[];
};

function Artwork({ code }: { code: string }) {
  return (
    <span className="whitespace-nowrap">
      <a href={`/api/ads/qr/${code}?format=svg`} className={linkAction}>SVG</a>
      <a href={`/api/ads/qr/${code}?format=png&size=2000`} className={`ml-3 ${linkAction}`}>PNG</a>
    </span>
  );
}

function PlacementCard({ row, campaignId }: { row: PlacementRow; campaignId: string }) {
  const p = row.placement;
  return (
    <li id={`placement-${p.id}`} className={`${cardClass} p-4 sm:p-5 flex flex-col gap-4 scroll-mt-28`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`${serif} text-[20px] leading-none text-white`}>{p.label}</p>
          <p className="text-xs text-white/40 mt-1.5">
            <span className="font-mono text-[#f87171]">/go/{p.code}</span>
            {row.link && !row.link.active && <span className="ml-2"><Badge>Retired</Badge></span>}
            {row.link?.logoDataUri && <span className="ml-2">logo in the middle</span>}
            {p.note ? ` · ${p.note}` : ""}
          </p>
        </div>
        <Artwork code={p.code} />
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Stat label="Scans" value={row.scans.toLocaleString()} hint={row.testScans > 0 ? `${row.testScans} tests held back` : undefined} />
        <Stat label="Phones" value={row.uniquePhones.toLocaleString()} hint="distinct" />
        <Stat label="Leads" value={row.leads.toLocaleString()} hint="filled in a form after scanning" />
        <Stat label="Printed" value={p.quantity !== null ? p.quantity.toLocaleString() : "—"} hint={row.scanRate !== null ? `${row.scanRate}% scanned` : undefined} />
        <Stat label="Cost" value={p.cost !== null ? money(p.cost) : "—"} hint={row.costPerScan !== null ? `${money(row.costPerScan)} per scan` : undefined} />
      </dl>

      {row.recentLeads.length > 0 && (
        <p className="text-xs text-white/45">
          Last lead {stamp(row.recentLeads[0].at)} via the {row.recentLeads[0].form} form
          {row.recentLeads.length > 1 ? `, ${row.recentLeads.length} in the last ${row.recentLeads.length === 40 ? "40+" : String(row.recentLeads.length)}` : ""}.
        </p>
      )}

      <details className="group/edit">
        <summary className={`${bebas} cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[11px] tracking-[0.22em] text-white/45 hover:text-white transition-colors`}>
          <span className="group-open/edit:hidden">Edit placement</span>
          <span className="hidden group-open/edit:inline">Close</span>
        </summary>
        <form action={updatePlacementAction} className="mt-4 grid sm:grid-cols-4 gap-3 items-end">
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="campaignId" value={campaignId} />
          <Field label="Label" name="label" id={`pl-label-${p.id}`} defaultValue={p.label} required />
          <Field label="Printed" name="quantity" id={`pl-qty-${p.id}`} defaultValue={p.quantity !== null ? String(p.quantity) : ""} inputMode="numeric" />
          <Field label="Cost" name="cost" id={`pl-cost-${p.id}`} defaultValue={p.cost !== null ? String(p.cost) : ""} inputMode="decimal" />
          <Field label="Note" name="note" id={`pl-note-${p.id}`} defaultValue={p.note} />
          <div className="sm:col-span-4 flex flex-wrap items-center gap-3">
            <SubmitButton className={`${btnPrimary} ${btnSm}`} pendingLabel="Saving">
              Save
            </SubmitButton>
            <span className="text-xs text-white/30">The code can&apos;t change: it&apos;s printed. Repoint or retire it on the QR codes page.</span>
          </div>
        </form>
        <form action={removePlacementAction} className="mt-3 flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="campaignId" value={campaignId} />
          <span className="text-xs text-white/40">Take it off this campaign. The code and its scans stay in the registry.</span>
          <SubmitButton className={`${btnDanger} ${btnSm}`} pendingLabel="Removing">
            Remove
          </SubmitButton>
        </form>
      </details>
    </li>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className={`${labelClass} !mb-0.5`}>{label}</dt>
      <dd className={`${numClass} text-xl text-white leading-none`}>{value}</dd>
      {hint && <dd className="text-[11px] text-white/40 mt-1">{hint}</dd>}
    </div>
  );
}

export function CampaignHeader({ campaign, client, rows, spentInBooks }: { campaign: Campaign; client: CampaignClient; rows: PlacementRow[]; spentInBooks: number }) {
  const totals = campaignTotals(rows);
  const cost = spentInBooks > 0 ? spentInBooks : totals.cost;
  const costPerScan = cost > 0 && totals.scans > 0 ? Math.round((cost / totals.scans) * 100) / 100 : null;
  const costPerLead = cost > 0 && totals.leads > 0 ? Math.round((cost / totals.leads) * 100) / 100 : null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <Tile label="Scans" value={totals.scans.toLocaleString()} hint={`${rows.length} ${rows.length === 1 ? "placement" : "placements"}${totals.printed ? ` · ${totals.printed.toLocaleString()} printed` : ""}`} />
      <Tile label="Leads" value={totals.leads.toLocaleString()} hint={totals.leads ? "forms filled in after a scan" : "none yet"} tone={totals.leads ? "ok" : "plain"} />
      <Tile label="Cost" value={cost > 0 ? money(cost) : "—"} hint={spentInBooks > 0 ? "from the books" : cost > 0 ? "from the placements" : "log it in the books, or per placement"} />
      <Tile label="Per scan" value={costPerScan !== null ? money(costPerScan) : "—"} hint={costPerLead !== null ? `${money(costPerLead)} per lead` : "needs a cost and a scan"} />
    </div>
  );
}

function Tile({ label, value, hint, tone = "plain" }: { label: string; value: string; hint?: string; tone?: "plain" | "ok" }) {
  return (
    <div className={`${cardClass} px-4 py-3.5 ${tone === "ok" ? "border-[#7FBF8E]/25" : ""}`}>
      <p className={labelClass}>{label}</p>
      <p className={`${numClass} text-2xl text-white leading-none`}>{value}</p>
      {hint && <p className="text-[11px] text-white/40 mt-1.5 leading-snug">{hint}</p>}
    </div>
  );
}

export function CampaignDetail({
  campaign,
  client,
  rows,
  freeCodes,
  msg,
}: {
  campaign: Campaign;
  client: CampaignClient;
  rows: PlacementRow[];
  /** Codes in the registry not yet in any campaign, offered for attaching. */
  freeCodes: AdLinkRecord[];
  msg?: string;
}) {
  const noun = mediumOf(campaign.medium).placementNoun;
  return (
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
      <Card
        title={`Placements · ${rows.length}`}
        lede={`One per ${noun}: its own code, so you can tell which ${noun} the scans came from.`}
        action={
          rows.length > 0 ? (
            <a href={`${ADMIN}/sheet/${campaign.id}`} className={`${btnGhost} ${btnSm}`}>
              Contact sheet
            </a>
          ) : undefined
        }
      >
        {rows.length === 0 ? (
          <Empty>No placements yet. Add one per {noun} on the right; each gets its own QR the moment it is saved.</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <PlacementCard key={row.placement.id} row={row} campaignId={campaign.id} />
            ))}
          </ul>
        )}
        {msg === "placementAdded" && rows.length > 0 && (
          <div className="mt-4">
            <Note tone="ok">
              <p className="text-sm text-white">
                Scan the artwork with your own phone before it goes to the printer, then press &ldquo;These were tests&rdquo; on the QR codes page so the count starts at zero on the day it goes out.
              </p>
            </Note>
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-5">
        <Card title={`Add a ${noun}`} lede="Makes the code and the artwork. Print the short address under the QR too, for a camera that won't read it.">
          <form action={addPlacementAction} encType="multipart/form-data" className="flex flex-col gap-4">
            <input type="hidden" name="campaignId" value={campaign.id} />
            <Field label="Label" name="label" id="pl-new-label" placeholder="Dessi's car" required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Printed" name="quantity" id="pl-new-qty" inputMode="numeric" placeholder="1" hint="How many, or how many cars." />
              <Field label="Cost" name="cost" id="pl-new-cost" inputMode="decimal" placeholder="45" hint="Dollars. Or log it in the books instead." />
            </div>
            <Field label="Code" name="code" id="pl-new-code" placeholder="left blank, named from the campaign" hint="The bit after /go/. Short, permanent, gets printed." />
            {freeCodes.length > 0 && (
              <div>
                <label className={labelClass} htmlFor="pl-new-existing">Or attach a code that already exists</label>
                <select id="pl-new-existing" name="existingCode" defaultValue="" className={selectClass}>
                  <option value="">Make a new one</option>
                  {freeCodes.map((l) => (
                    <option key={l.code} value={l.code}>/go/{l.code} · {l.label}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-white/30">For something already printed, like the first Mex Taco flyer. Its history comes with it.</p>
              </div>
            )}
            <div>
              <label className={labelClass} htmlFor="pl-new-logo">Logo in the middle (optional)</label>
              <input id="pl-new-logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="w-full text-sm text-white/55 file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white" />
              <p className="mt-1.5 text-xs text-white/30">Under 200KB. A logo makes the code denser, so print it larger.</p>
            </div>
            <Field label="Note" name="note" id="pl-new-note" placeholder="Rear window, driver side" />
            <SubmitButton className={`${btnPrimary}`} pendingLabel="Adding">
              Add and make the QR
            </SubmitButton>
          </form>
        </Card>

        <Card title="The campaign" action={<a href={`${CAMPAIGNS}?edit=${campaign.id}#campaign-form`} className={`${btnGhost} ${btnSm}`}>Edit</a>}>
          <dl className="text-sm">
            <Line label="Whose">{client.name}</Line>
            <Line label="Printed on">{mediumOf(campaign.medium).label}</Line>
            <Line label="Status"><Badge tone={STATUS_TONE[campaign.status]}>{statusLabel(campaign.status)}</Badge></Line>
            <Line label="Out">{formatDate(campaign.startDate)}{campaign.endDate ? ` to ${formatDate(campaign.endDate)}` : ", still out"}</Line>
            <Line label="Lands on"><span className="break-all">{campaign.destination.replace(/^https?:\/\//, "")}</span></Line>
          </dl>
          {campaign.notes && <p className="mt-3 text-xs text-white/50 whitespace-pre-line">{campaign.notes}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {CAMPAIGN_STATUSES.filter((s) => s.id !== campaign.status).map((s) => (
              <form key={s.id} action={setCampaignStatusAction}>
                <input type="hidden" name="id" value={campaign.id} />
                <input type="hidden" name="status" value={s.id} />
                <button type="submit" className={`${btnGhost} ${btnSm}`}>
                  {s.id === "live" ? "It's out" : s.id === "ended" ? "Ended" : "Back to draft"}
                </button>
              </form>
            ))}
          </div>
        </Card>

        <Card title="What it cost" lede="Log the printer's invoice once, in the books, tagged with this campaign. Cost per scan reads it back.">
          <form action={logCampaignCostAction} className="grid grid-cols-2 gap-3 items-end">
            <input type="hidden" name="campaignId" value={campaign.id} />
            <input type="hidden" name="returnTo" value={`${CAMPAIGNS}/${campaign.id}`} />
            <Field label="Paid to" name="party" id="cost-party" placeholder="Vistaprint" required />
            <Field label="Amount" name="amount" id="cost-amount" inputMode="decimal" placeholder="89.00" required />
            <Field label="When" name="date" id="cost-date" type="date" />
            <Field label="Memo" name="memo" id="cost-memo" placeholder="2 magnets, 12x18" />
            <div className="col-span-2">
              <SubmitButton className={`${btnGhost} ${btnSm}`} pendingLabel="Logging">
                Log the expense
              </SubmitButton>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-white/[0.06] last:border-b-0">
      <dt className={`${labelClass} !mb-0`}>{label}</dt>
      <dd className="text-white/80 text-right">{children}</dd>
    </div>
  );
}

/** Filter pills on the list page. */
export function CampaignFilters({ filter, counts }: { filter: string; counts: Record<string, number> }) {
  const href = (f: string) => (f === "all" ? CAMPAIGNS : `${CAMPAIGNS}?show=${f}`);
  const pill = (f: string, label: string) => (
    <a
      href={href(f)}
      aria-current={filter === f ? "page" : undefined}
      className={`${bebas} inline-flex items-center gap-2 border px-3.5 py-2.5 text-[12px] tracking-[0.2em] leading-none transition-colors ${
        filter === f ? "border-white text-white" : "border-white/[0.12] text-white/55 hover:text-white hover:border-white/40"
      }`}
    >
      {label}
      {typeof counts[f] === "number" && <span className="text-white/40 tracking-normal font-sans text-[11px]">({counts[f]})</span>}
    </a>
  );
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {pill("all", "All")}
      {pill("live", "Out now")}
      {pill("draft", "Getting ready")}
      {pill("ended", "Ended")}
      {pill("ours", "Smart Scale's")}
      {pill("clients", "Clients'")}
    </div>
  );
}

