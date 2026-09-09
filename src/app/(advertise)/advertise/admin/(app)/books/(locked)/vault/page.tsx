import type { Metadata } from "next";
import { cachedVault } from "@/lib/ads/cached";
import { formatDate, today } from "@/lib/ads/roster";
import { VAULT_KINDS, isVaultConfigured, vaultHref, type VaultDoc } from "@/lib/books/vault";
import { deleteVaultAction, updateVaultAction, uploadVaultAction } from "../../actions";
import { PageHeader } from "../../../../_components/shell";
import { SubmitButton } from "../../../../_components/submit-button";
import { Badge, Card, Disclosure, Empty, Field, Note, btnDanger, btnGhost, btnPrimary, btnSm, inputClass, labelClass, selectClass, type Tone } from "../../../../_components/ui";
import { Shell } from "../../../shell";

export const metadata: Metadata = { title: "Vault" };

function renewalTone(doc: VaultDoc, asOf: string): { tone: Tone; text: string } | null {
  if (!doc.renewsOn) return null;
  const days = Math.round((Date.parse(doc.renewsOn) - Date.parse(asOf)) / 86_400_000);
  if (days < 0) return { tone: "bad", text: `Lapsed ${-days}d ago` };
  if (days <= 30) return { tone: "warn", text: `Renews in ${days}d` };
  return { tone: "neutral", text: `Renews ${formatDate(doc.renewsOn)}` };
}

function sizeOf(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function VaultPage({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string; detail?: string }> }) {
  const [params, docs] = await Promise.all([searchParams, cachedVault()]);
  const asOf = today();
  const ready = isVaultConfigured();
  const groups = VAULT_KINDS.map((k) => ({ kind: k, docs: docs.filter((d) => d.kind === k.id) })).filter((g) => g.docs.length > 0);

  return (
    <Shell active="vault" banner={params}>
      <PageHeader
        eyebrow="Books · vault"
        title={docs.length ? `${docs.length} ${docs.length === 1 ? "document" : "documents"}, sealed.` : "The papers that make this a company."}
        action={
          <a href="#add-doc" className={btnPrimary}>
            + Add a document
          </a>
        }
      />

      {(!ready.key || !ready.storage) && (
        <div className="mb-5">
          <Note tone="warn">
            <p className="text-sm text-white">
              {!ready.storage ? "No file storage is connected." : "BOOKS_FILE_KEY isn't set, so nothing can be sealed."} The vault won&apos;t accept a file until it is. Both are on the Setup page.
            </p>
          </Note>
        </div>
      )}

      {docs.length === 0 ? (
        <Empty>Nothing filed yet. Start with the certificate of formation, the EIN letter and the operating agreement. Add a renewal date to anything that expires and it will land on Today as it comes up.</Empty>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <Card key={g.kind.id} title={`${g.kind.label} · ${g.docs.length}`} lede={g.kind.hint} padding="px-5 sm:px-6 pt-5 pb-2">
              <ul>
                {g.docs.map((doc) => {
                  const renewal = renewalTone(doc, asOf);
                  return (
                    <li key={doc.id} id={`doc-${doc.id}`} className="scroll-mt-28">
                      <details className="group border-b border-white/[0.06] last:border-b-0">
                        <summary className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] -mx-2 px-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] text-white leading-snug truncate">{doc.label}</p>
                            <p className="text-xs text-white/45 leading-snug truncate">
                              {doc.filename} · {sizeOf(doc.size)}
                              {doc.issuedOn ? ` · issued ${formatDate(doc.issuedOn)}` : ""}
                              {doc.note ? ` · ${doc.note}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {renewal && <Badge tone={renewal.tone}>{renewal.text}</Badge>}
                            {doc.sealed ? <Badge tone="ok" dot={false}>Sealed</Badge> : <Badge tone="warn" dot={false}>Not sealed</Badge>}
                            <a href={vaultHref(doc.id)} target="_blank" rel="noreferrer" className={`${btnGhost} ${btnSm}`}>
                              Open
                            </a>
                          </div>
                        </summary>
                        <div className="pb-5 pt-1 flex flex-col gap-4">
                          <p className="text-xs text-white/35">
                            Filed by {doc.who || "someone"} {formatDate(doc.uploadedAt.slice(0, 10))} · SHA-256 <span className="font-mono">{doc.sha256.slice(0, 16)}…</span> · every open is logged
                          </p>
                          <form action={updateVaultAction} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                            <input type="hidden" name="id" value={doc.id} />
                            <Field label="Label" name="label" id={`label-${doc.id}`} defaultValue={doc.label} />
                            <div>
                              <label className={labelClass} htmlFor={`kind-${doc.id}`}>Kind</label>
                              <select id={`kind-${doc.id}`} name="kind" defaultValue={doc.kind} className={selectClass}>
                                {VAULT_KINDS.map((k) => (
                                  <option key={k.id} value={k.id}>{k.label}</option>
                                ))}
                              </select>
                            </div>
                            <Field label="Issued" name="issuedOn" id={`issued-${doc.id}`} type="date" defaultValue={doc.issuedOn} />
                            <Field label="Renews or expires" name="renewsOn" id={`renews-${doc.id}`} type="date" defaultValue={doc.renewsOn} hint="Blank if it never does." />
                            <div className="sm:col-span-2 lg:col-span-3">
                              <Field label="Note" name="note" id={`note-${doc.id}`} defaultValue={doc.note} />
                            </div>
                            <SubmitButton className={`${btnGhost} ${btnSm}`} pendingLabel="Saving">
                              Save
                            </SubmitButton>
                          </form>
                          <form action={deleteVaultAction} className="self-start">
                            <input type="hidden" name="id" value={doc.id} />
                            <button type="submit" className={`${btnDanger} ${btnSm}`}>Remove from the vault</button>
                          </form>
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-5">
        <Disclosure id="add-doc" summary={<span className="text-white/60">Add a document</span>} hint="sealed before it leaves this server" open={Boolean(params.err) || docs.length === 0}>
          <form action={uploadVaultAction} className="flex flex-col gap-4 pt-3">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="doc-file">
                  The file <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="doc-file"
                  name="file"
                  type="file"
                  required
                  accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx"
                  className={`${inputClass} file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white`}
                />
                <p className="mt-1.5 text-xs text-white/30">PDF, image, Word or Excel, up to 4 MB.</p>
              </div>
              <div>
                <label className={labelClass} htmlFor="doc-kind">Kind</label>
                <select id="doc-kind" name="kind" defaultValue="formation" className={selectClass}>
                  {VAULT_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>{k.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Label" name="label" id="doc-label" placeholder="Certificate of formation" hint="Blank uses the file name." />
              <Field label="Issued" name="issuedOn" id="doc-issued" type="date" />
              <Field label="Renews or expires" name="renewsOn" id="doc-renews" type="date" hint="Lands on Today 30 days out." />
            </div>
            <Field label="Note" name="note" id="doc-note" placeholder="Filed with the Texas SOS, file number 0801234567" />
            <SubmitButton className={`${btnPrimary} self-start`} pendingLabel="Sealing and filing" disabled={!ready.key || !ready.storage}>
              Seal and file it
            </SubmitButton>
          </form>
        </Disclosure>
      </div>

    </Shell>
  );
}
