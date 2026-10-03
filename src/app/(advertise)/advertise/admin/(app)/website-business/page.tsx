import type { Metadata } from "next";
import { isEmailConfigured } from "@/lib/ads/email";
import { isLinkSigningConfigured } from "@/lib/ads/links";
import { cachedWbLeads } from "@/lib/wb/cached";
import { WB_ADMIN } from "@/lib/wb/paths";
import { getWbSettings, LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/wb/store";
import { isTurnstileConfigured } from "@/lib/wb/turnstile";
import { isWorkerConfigured } from "@/lib/wb/worker";
import { PageHeader } from "../../_components/shell";
import { Badge, Empty, FilterPill, Note, btnGhost, cardClass, stamp } from "../../_components/ui";
import { Shell } from "../shell";
import { SOURCE_LABEL, STATUS_LABEL, STATUS_TONE, leadName, scanLine } from "./labels";

export const metadata: Metadata = { title: "Website leads" };

/** What is not set up yet, said once at the top instead of failing quietly. */
function SetupWarnings({ postalAddress, paused }: { postalAddress: string; paused: boolean }) {
  const missing = [
    !isWorkerConfigured() && "The scan worker is not connected (SSA_WORKER_URL, SSA_WORKER_SECRET). Every check is recorded as a lead to look at by hand.",
    !postalAddress && "No postal address is set, so emails to business owners are held. Add it in Settings.",
    !isEmailConfigured() && "Email is not configured (RESEND_API_KEY). No report or alert can be sent.",
    !isLinkSigningConfigured() && "ADS_LINK_SECRET is not set, so emails go out without the fix and unsubscribe links.",
    !isTurnstileConfigured() && "The bot check is off (Turnstile keys). The honeypot and rate limits still apply.",
    paused && "The public scanner is paused in Settings. Visitors are told we will check by hand.",
  ].filter(Boolean) as string[];
  if (missing.length === 0) return null;
  return (
    <div className="mb-6">
      <Note tone="warn">
        <p className="text-sm font-semibold text-white">Not everything is switched on yet.</p>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm text-white/60">
          {missing.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Note>
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  return (
    <li>
      <a href={`${WB_ADMIN}/${lead.id}`} className={`${cardClass} flex flex-col gap-3 px-5 py-4 hover:bg-white/[0.05] transition-colors sm:flex-row sm:items-center sm:gap-5`}>
        <span className="sm:w-28 shrink-0">
          <Badge tone={STATUS_TONE[lead.status]}>{STATUS_LABEL[lead.status]}</Badge>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">{leadName(lead)}</span>
          <span className="mt-0.5 block truncate text-xs text-white/45">{[lead.contactName, lead.email, lead.phone].filter(Boolean).join(" · ")}</span>
        </span>
        <span className="text-xs text-white/60 sm:w-52 shrink-0">{scanLine(lead)}</span>
        <span className="text-xs text-white/40 sm:w-28 shrink-0">{SOURCE_LABEL[lead.source] ?? lead.source}</span>
        <span className="text-xs text-white/40 sm:w-32 shrink-0 sm:text-right tabular-nums">{stamp(lead.createdAt)}</span>
      </a>
    </li>
  );
}

/**
 * Every lead from the free website check, newest first, with the hot ones
 * pinned to the top: those are people who asked for a call.
 */
export default async function WebsiteLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string; msg?: string; err?: string; detail?: string }>;
}) {
  const [params, leads, settings] = await Promise.all([searchParams, cachedWbLeads(), getWbSettings()]);
  const status = LEAD_STATUSES.includes(params.status as LeadStatus) ? (params.status as LeadStatus) : undefined;
  const sources = [...new Set(leads.map((l) => l.source))].sort();
  const source = sources.includes(params.source ?? "") ? params.source : undefined;

  const shown = leads
    .filter((l) => (!status || l.status === status) && (!source || l.source === source))
    .sort((a, b) => Number(b.status === "hot") - Number(a.status === "hot"));
  const hot = leads.filter((l) => l.status === "hot").length;

  const href = (next: { status?: string; source?: string }) => {
    const query = new URLSearchParams();
    const s = "status" in next ? next.status : status;
    const from = "source" in next ? next.source : source;
    if (s) query.set("status", s);
    if (from) query.set("source", from);
    const text = query.toString();
    return text ? `${WB_ADMIN}?${text}` : WB_ADMIN;
  };

  return (
    <Shell active="wbleads" banner={params}>
      <PageHeader
        eyebrow="Website Business · Leads"
        title={hot > 0 ? `${hot} waiting for a call.` : "Who checked their site."}
        action={
          <a href="/check" target="_blank" rel="noopener noreferrer" className={btnGhost}>
            Open the check page
          </a>
        }
      />
      <SetupWarnings postalAddress={settings.postalAddress} paused={settings.scannerPaused} />

      <div className="flex flex-wrap gap-2 mb-3">
        <FilterPill href={href({ status: undefined })} on={!status} count={leads.length}>
          All
        </FilterPill>
        {LEAD_STATUSES.filter((s) => leads.some((l) => l.status === s)).map((s) => (
          <FilterPill key={s} href={href({ status: s })} on={status === s} count={leads.filter((l) => l.status === s).length}>
            {STATUS_LABEL[s]}
          </FilterPill>
        ))}
      </div>
      {sources.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterPill href={href({ source: undefined })} on={!source}>
            Any source
          </FilterPill>
          {sources.map((s) => (
            <FilterPill key={s} href={href({ source: s })} on={source === s}>
              {SOURCE_LABEL[s] ?? s}
            </FilterPill>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="mt-6">
          <Empty>
            {leads.length === 0
              ? "No leads yet. Everyone who runs the free website check, or fills in the no-website form, lands here."
              : "No leads match that filter."}
          </Empty>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {shown.map((lead) => (
            <LeadRow key={lead.id} lead={lead} />
          ))}
        </ul>
      )}
    </Shell>
  );
}
