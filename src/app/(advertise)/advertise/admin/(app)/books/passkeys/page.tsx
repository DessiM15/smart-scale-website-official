import type { Metadata } from "next";
import { cachedPasskeys } from "@/lib/ads/cached";
import { formatDate } from "@/lib/ads/roster";
import { currentWho, TEAM } from "@/lib/ads/who";
import { booksAccess } from "@/lib/books/passkeys";
import { deletePasskeyAction, lockBooksAction, renamePasskeyAction } from "../actions";
import { PasskeyEnrol } from "../../../_components/passkey-enrol";
import { PageHeader } from "../../../_components/shell";
import { Badge, Card, Empty, Note, btnDanger, btnGhost, btnSm, inputClass, labelClass } from "../../../_components/ui";
import { Shell } from "../../shell";

export const metadata: Metadata = { title: "Passkeys" };

const PAGE = "/advertise/admin/books/passkeys";

/**
 * Enrol and manage passkeys. Behind the shared key only, on purpose: this
 * is how a new phone gets in, and how a lost one is removed.
 */
export default async function PasskeysPage({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string; detail?: string }> }) {
  const [params, passkeys, who, access] = await Promise.all([searchParams, cachedPasskeys(), currentWho(), booksAccess()]);
  const locked = passkeys.length > 0;

  return (
    <Shell active="books" banner={params}>
      <PageHeader
        eyebrow="Books · passkeys"
        title={locked ? `${passkeys.length} ${passkeys.length === 1 ? "device opens" : "devices open"} the books.` : "Nobody has a passkey yet."}
        action={
          access.ok && access.via === "passkey" ? (
            <form action={lockBooksAction}>
              <button type="submit" className={btnGhost}>Lock the books on this browser</button>
            </form>
          ) : undefined
        }
      />

      {!locked && (
        <div className="mb-5">
          <Note tone="warn">
            <p className="text-sm text-white">Until a passkey is enrolled, the books are open to anyone with the shared key.</p>
            <p className="mt-1.5 text-sm text-white/55">The moment one exists, every Books page needs a passkey. Enrol both phones, then the laptops.</p>
          </Note>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <Card title="Add this device" lede="Do this on each phone and laptop you use. Each passkey is one person on one device.">
          <PasskeyEnrol team={TEAM} defaultWho={who} returnTo={PAGE} />
        </Card>

        <Card title="Enrolled" padding="px-5 sm:px-6 pt-5 pb-2">
          {passkeys.length === 0 ? (
            <div className="pb-4">
              <Empty>Nothing yet.</Empty>
            </div>
          ) : (
            <ul>
              {passkeys.map((p) => (
                <li key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-white/[0.06] last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-white leading-snug flex items-center gap-2.5 flex-wrap">
                      {p.label}
                      <Badge tone="brand" dot={false}>{p.who}</Badge>
                      {p.backedUp && <Badge tone="neutral" dot={false} title="Synced by the device's password manager">Synced</Badge>}
                    </p>
                    <p className="text-xs text-white/45 leading-snug">
                      Added {formatDate(p.createdAt.slice(0, 10))}
                      {p.lastUsedAt ? ` · last used ${formatDate(p.lastUsedAt.slice(0, 10))}` : " · not used yet"}
                    </p>
                  </div>
                  <form action={renamePasskeyAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <label className={`${labelClass} sr-only`} htmlFor={`label-${p.id.slice(0, 8)}`}>Name</label>
                    <input id={`label-${p.id.slice(0, 8)}`} name="label" defaultValue={p.label} className={`${inputClass} w-40 py-2`} maxLength={60} />
                    <button type="submit" className={`${btnGhost} ${btnSm}`}>Rename</button>
                  </form>
                  <form action={deletePasskeyAction}>
                    <input type="hidden" name="id" value={p.id} />
                    {passkeys.length === 1 && <input type="hidden" name="confirm" value="" />}
                    <button type="submit" className={`${btnDanger} ${btnSm}`}>Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Shell>
  );
}
