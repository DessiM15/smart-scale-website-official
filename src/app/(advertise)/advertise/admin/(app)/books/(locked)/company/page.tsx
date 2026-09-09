import type { Metadata } from "next";
import { cachedCompany } from "@/lib/ads/cached";
import { formatDate, today } from "@/lib/ads/roster";
import { isEinStorable, maskedEin, nextDue, revealEin, takeRevealToken } from "@/lib/books/company";
import { isFileKeyConfigured } from "@/lib/books/crypto";
import { addFilingAction, deleteFilingAction, revealEinAction, saveCompanyAction, saveEinAction } from "../../actions";
import { PageHeader } from "../../../../_components/shell";
import { SubmitButton } from "../../../../_components/submit-button";
import { Badge, Card, Disclosure, Empty, Field, Note, btnDanger, btnGhost, btnPrimary, btnSm, inputClass, labelClass, numClass, selectClass } from "../../../../_components/ui";
import { Shell } from "../../../shell";

export const metadata: Metadata = { title: "Company" };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default async function CompanyPage({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string; detail?: string; reveal?: string }> }) {
  const [params, company] = await Promise.all([searchParams, cachedCompany()]);
  const asOf = today();
  // A reveal is a one-time token from the action. Used here, then gone.
  const showEin = params.reveal ? await takeRevealToken(params.reveal) : false;
  const ein = showEin ? revealEin(company) : null;
  const shares = company.members.reduce((s, m) => s + m.sharePercent, 0);

  return (
    <Shell active="company" banner={params}>
      <PageHeader
        eyebrow="Books · company"
        title={`${company.legalName}, on one page.`}
        action={
          company.updatedAt ? <span className="text-xs text-white/35">Updated {formatDate(company.updatedAt.slice(0, 10))}{company.updatedBy ? ` by ${company.updatedBy}` : ""}</span> : undefined
        }
      />

      <div className="grid lg:grid-cols-[1fr_1fr] gap-5 items-start">
        <div className="flex flex-col gap-5">
          <Card id="ein" title="EIN" lede="Sealed with the file key. Shown masked; every reveal is written to the audit log.">
            {!isEinStorable() && (
              <div className="mb-4">
                <Note tone="warn">
                  <p className="text-sm text-white">BOOKS_FILE_KEY isn&apos;t set, so the EIN can&apos;t be stored yet. It&apos;s on the Setup page.</p>
                </Note>
              </div>
            )}
            {company.einLast4 ? (
              <div className="flex flex-wrap items-center gap-4">
                <p className={`${numClass} text-3xl text-white tracking-wider tabular-nums`}>{ein ?? maskedEin(company)}</p>
                {ein ? (
                  <Badge tone="warn">Shown once · reload to hide</Badge>
                ) : (
                  <form action={revealEinAction}>
                    <button type="submit" className={`${btnGhost} ${btnSm}`} disabled={!isFileKeyConfigured()}>
                      Reveal
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <p className="text-sm text-white/45">Not stored yet.</p>
            )}
            <Disclosure summary={<span className="text-white/60">{company.einLast4 ? "Replace the EIN" : "Store the EIN"}</span>} className="mt-4" open={params.err === "ein"}>
              <form action={saveEinAction} className="flex flex-col sm:flex-row sm:items-end gap-3 pt-3">
                <Field label="EIN" name="ein" id="ein-input" placeholder="12-3456789" inputMode="numeric" required />
                <SubmitButton className={`${btnPrimary} ${btnSm}`} pendingLabel="Sealing" disabled={!isEinStorable()}>
                  Seal it
                </SubmitButton>
              </form>
            </Disclosure>
          </Card>

          <Card title="Members" lede={shares === 100 ? "Ownership adds up to 100%." : `Ownership adds up to ${shares}%, not 100. Fix the split below.`}>
            <div className="grid grid-cols-2 gap-3">
              {company.members.map((m) => (
                <div key={m.name} className="border border-white/[0.08] px-4 py-4">
                  <p className={`${labelClass} !mb-1`}>{m.role}</p>
                  <p className="text-lg text-white">{m.name}</p>
                  <p className={`${numClass} text-2xl text-white tabular-nums mt-1`}>{m.sharePercent}%</p>
                </div>
              ))}
            </div>
          </Card>

          <Card id="filings" title="Yearly filings" lede="Each lands on Today 45 days out, every year. Mark it done there once it's filed." padding="px-5 sm:px-6 pt-5 pb-2">
            {company.filings.length === 0 ? (
              <div className="pb-4">
                <Empty>No filings yet.</Empty>
              </div>
            ) : (
              <ul>
                {company.filings.map((f) => {
                  const due = nextDue(f, asOf);
                  const days = Math.round((Date.parse(due) - Date.parse(asOf)) / 86_400_000);
                  return (
                    <li key={f.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 py-3.5 border-b border-white/[0.06] last:border-b-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] text-white leading-snug">{f.label}</p>
                        <p className="text-xs text-white/45 leading-snug">
                          Every {MONTHS[f.month - 1]} {f.day}
                          {f.note ? ` · ${f.note}` : ""}
                        </p>
                      </div>
                      <Badge tone={days <= 14 ? "warn" : "neutral"}>{days === 0 ? "Due today" : `${days}d · ${formatDate(due)}`}</Badge>
                      <form action={deleteFilingAction}>
                        <input type="hidden" name="id" value={f.id} />
                        <button type="submit" className={`${btnDanger} ${btnSm}`}>Remove</button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="pt-3 pb-3">
              <Disclosure summary={<span className="text-white/60">Add a yearly filing</span>} hint="franchise tax, an annual report, a license" open={params.err === "filing"}>
                <form action={addFilingAction} className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-end pt-3">
                  <Field label="What" name="label" id="filing-label" placeholder="Sales tax permit renewal" required />
                  <div>
                    <label className={labelClass} htmlFor="filing-month">Month</label>
                    <select id="filing-month" name="month" defaultValue="1" className={`${selectClass} w-36`}>
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="filing-day">Day</label>
                    <input id="filing-day" name="day" inputMode="numeric" defaultValue="15" className={`${inputClass} w-20`} />
                  </div>
                  <SubmitButton className={`${btnGhost} ${btnSm}`} pendingLabel="Adding">
                    Add
                  </SubmitButton>
                  <div className="sm:col-span-4">
                    <Field label="Note" name="note" id="filing-note" placeholder="Where it's filed, what it costs" />
                  </div>
                </form>
              </Disclosure>
            </div>
          </Card>
        </div>

        <Card title="Details" lede="What the bank, the CPA and every form ask for.">
          <form action={saveCompanyAction} className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Legal name" name="legalName" id="c-legal" defaultValue={company.legalName} required />
              <Field label="Doing business as" name="dba" id="c-dba" defaultValue={company.dba} placeholder="Smart Scale" />
              <Field label="Entity type" name="entityType" id="c-type" defaultValue={company.entityType} />
              <Field label="Taxed as" name="taxElection" id="c-tax" defaultValue={company.taxElection} />
              <Field label="State" name="state" id="c-state" defaultValue={company.state} />
              <Field label="Formed on" name="formedOn" id="c-formed" type="date" defaultValue={company.formedOn} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Registered agent" name="agentName" id="c-agent" defaultValue={company.registeredAgent.name} />
              <Field label="Agent address" name="agentAddress" id="c-agent-addr" defaultValue={company.registeredAgent.address} />
              <Field label="Principal address" name="principalAddress" id="c-principal" defaultValue={company.principalAddress} />
              <Field label="Mailing address" name="mailingAddress" id="c-mailing" defaultValue={company.mailingAddress} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Bank" name="bankName" id="c-bank" defaultValue={company.bank.name} />
              <Field label="Account, last four" name="bankLast4" id="c-bank4" defaultValue={company.bank.last4} inputMode="numeric" hint="Only the last four. The full number lives at the bank." />
            </div>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
              {company.members.map((m, i) => (
                <div key={i} className="contents">
                  <Field label={`Member ${i + 1}`} name={`member${i}Name`} id={`c-m${i}`} defaultValue={m.name} />
                  <Field label="Role" name={`member${i}Role`} id={`c-m${i}r`} defaultValue={m.role} />
                  <Field label="Share %" name={`member${i}Share`} id={`c-m${i}s`} defaultValue={String(m.sharePercent)} inputMode="numeric" />
                </div>
              ))}
            </div>
            <div>
              <label className={labelClass} htmlFor="c-notes">Notes</label>
              <textarea id="c-notes" name="notes" defaultValue={company.notes} rows={4} className={inputClass} placeholder="Anything you keep having to look up: the SOS file number, the franchise tax account, the CPA's name" />
            </div>
            <SubmitButton className={`${btnPrimary} self-start`} pendingLabel="Saving">
              Save details
            </SubmitButton>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
