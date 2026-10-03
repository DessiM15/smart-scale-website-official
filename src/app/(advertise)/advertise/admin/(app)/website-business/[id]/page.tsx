import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WB_ADMIN } from "@/lib/wb/paths";
import { getLead, listEvents } from "@/lib/wb/store";
import { PageHeader } from "../../../_components/shell";
import { SubmitButton } from "../../../_components/submit-button";
import { Badge, Card, Empty, Note, btnGhost, btnPrimary, btnSm, inputClass, labelClass, linkAction, stamp } from "../../../_components/ui";
import { Shell } from "../../shell";
import { addLeadNoteAction, setLeadStatusAction } from "../actions";
import { EVENT_LABEL, SOURCE_LABEL, STATUS_LABEL, STATUS_TONE, leadName, scanLine } from "../labels";

export const metadata: Metadata = { title: "Website lead" };

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div className="text-sm text-white/85 break-words">{children}</div>
    </div>
  );
}

const HOT_REASON = { fix_requested: "Asked us to fix their site", no_website: "Has no website and wants one" } as const;

/** One lead: who they are, what the scan found, what has happened, and what you did about it. */
export default async function WebsiteLeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; err?: string; detail?: string }>;
}) {
  const [{ id }, banner] = await Promise.all([params, searchParams]);
  const [lead, events] = await Promise.all([getLead(id), listEvents(id)]);
  if (!lead) notFound();

  const site = (lead.website ?? "").replace(/^https?:\/\//, "");

  return (
    <Shell active="wbleads" banner={banner}>
      <PageHeader
        eyebrow={
          <a href={WB_ADMIN} className="hover:text-white transition-colors">
            Website Business · Leads
          </a>
        }
        title={leadName(lead)}
        action={<Badge tone={STATUS_TONE[lead.status]}>{STATUS_LABEL[lead.status]}</Badge>}
      />

      {lead.status === "hot" && lead.hotReason && (
        <div className="mb-6">
          <Note tone="bad">
            <p className="text-sm font-semibold text-white">{HOT_REASON[lead.hotReason]}.</p>
            <p className="mt-1.5 text-sm text-white/60">They were told we would call within one business day. Mark it contacted once you have.</p>
          </Note>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-5">
          <Card title="Contact">
            <div className="grid gap-5 sm:grid-cols-2">
              <Fact label="Name">{lead.contactName || "Not given"}</Fact>
              <Fact label="Business">{lead.businessName || "Not given"}</Fact>
              <Fact label="Email">
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className={linkAction}>
                    {lead.email}
                  </a>
                ) : (
                  "Not given"
                )}
                {lead.emailOptOut && <span className="block mt-1 text-xs text-[#E0B36A]">Unsubscribed {stamp(lead.emailOptOut)}. Do not email.</span>}
              </Fact>
              <Fact label="Phone">
                {lead.phone ? (
                  <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} className={linkAction}>
                    {lead.phone}
                  </a>
                ) : (
                  "Not given"
                )}
              </Fact>
              <Fact label="Website">
                {lead.website ? (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className={linkAction}>
                    {site}
                  </a>
                ) : (
                  "None yet"
                )}
              </Fact>
              <Fact label="Came from">
                {SOURCE_LABEL[lead.source] ?? lead.source} · {stamp(lead.createdAt)}
              </Fact>
              {lead.needs && lead.needs.length > 0 && <Fact label="Needs">{lead.needs.join(", ")}</Fact>}
              {lead.bestTime && <Fact label="Best time to call">{lead.bestTime}</Fact>}
            </div>
            <p className="mt-5 text-xs text-white/35 leading-relaxed">
              Notice shown when they submitted: &ldquo;{lead.notice.text}&rdquo; ({stamp(lead.notice.at)})
            </p>
          </Card>

          <Card
            title="Scan"
            action={
              lead.scan?.reportId ? (
                <a href={`/check/report/${lead.scan.reportId}`} target="_blank" rel="noopener noreferrer" className={`${btnGhost} ${btnSm}`}>
                  Open the full report
                </a>
              ) : undefined
            }
          >
            <p className="text-sm text-white/85">{scanLine(lead)}</p>
            {lead.scan?.state === "failed" && (
              <p className="mt-2 text-sm text-white/50">
                Reason: {lead.scan.failure ?? "unknown"}. The visitor was told we would look by hand and write back.
              </p>
            )}
            {lead.scan?.reportId && <p className="mt-2 text-xs text-white/35">The report is the same page the visitor sees. It expires 90 days after the scan.</p>}
          </Card>

          <Card title="Notes">
            <form action={addLeadNoteAction} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={lead.id} />
              <label className="sr-only" htmlFor="lead-note">
                Add a note
              </label>
              <textarea id="lead-note" name="note" rows={3} required placeholder="What was said, what happens next." className={inputClass} />
              <div>
                <SubmitButton className={`${btnPrimary} ${btnSm}`} pendingLabel="Saving…">
                  Add note
                </SubmitButton>
              </div>
            </form>
            {lead.notes.length > 0 && (
              <ul className="mt-5">
                {lead.notes.map((note) => (
                  <li key={note.at} className="py-3 border-t border-white/[0.06]">
                    <p className="text-sm text-white/85 whitespace-pre-wrap leading-relaxed">{note.text}</p>
                    <p className="mt-1 text-xs text-white/40">
                      {note.by || "Someone"} · {stamp(note.at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card title="Move it on" lede="Status moves forward on its own up to Hot. These three are yours.">
            <div className="flex flex-wrap gap-2">
              {(["contacted", "won", "lost"] as const).map((status) => (
                <form key={status} action={setLeadStatusAction}>
                  <input type="hidden" name="id" value={lead.id} />
                  <input type="hidden" name="status" value={status} />
                  <SubmitButton className={`${lead.status === status ? btnPrimary : btnGhost} ${btnSm}`} pendingLabel="Saving…" disabled={lead.status === status}>
                    {STATUS_LABEL[status]}
                  </SubmitButton>
                </form>
              ))}
            </div>
          </Card>

          <Card title="Timeline" padding="px-5 sm:px-6 pt-5 pb-2">
            {events.length === 0 ? (
              <div className="pb-4">
                <Empty>Nothing recorded yet.</Empty>
              </div>
            ) : (
              <ul>
                {events.map((event, i) => (
                  <li key={`${event.at}-${i}`} className="py-3 border-b border-white/[0.06] last:border-b-0">
                    <p className="text-sm text-white/85">{EVENT_LABEL[event.type] ?? event.type}</p>
                    {event.detail && <p className="mt-0.5 text-xs text-white/50 leading-snug">{event.detail}</p>}
                    <p className="mt-1 text-xs text-white/35 tabular-nums">
                      {stamp(event.at)}
                      {event.by ? ` · ${event.by}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Shell>
  );
}
