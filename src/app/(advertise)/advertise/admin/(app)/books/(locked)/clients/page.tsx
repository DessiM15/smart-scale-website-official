import type { Metadata } from "next";
import { cachedClients } from "@/lib/ads/cached";
import { listAllEntries } from "@/lib/books/ledger";
import { formatCents } from "@/lib/books/money";
import { addClientAction, deleteClientAction } from "../../actions";
import { BOOKS } from "../../../../_components/books";
import { PageHeader } from "../../../../_components/shell";
import { SubmitButton } from "../../../../_components/submit-button";
import { clientHref } from "../../../../_components/types";
import { Badge, Card, Disclosure, Empty, Field, btnDanger, btnPrimary, btnSm, numClass } from "../../../../_components/ui";
import { Shell } from "../../../shell";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string; detail?: string }>;
}) {
  const [params, clients, entries] = await Promise.all([searchParams, cachedClients(), listAllEntries()]);
  const year = new Date().getFullYear().toString();
  const incomeFor = (id: string, all: boolean) =>
    entries
      .filter((e) => e.kind === "income" && e.clientId === id && (all || e.date.startsWith(year)))
      .reduce((s, e) => s + e.cents, 0);

  return (
    <Shell active="clients" banner={params}>
      <PageHeader
        eyebrow="Clients"
        title="Who the money comes from."
        action={
          <a href="#add-client" className={btnPrimary}>
            + Add a client
          </a>
        }
      />

      <Card title={`${clients.length} ${clients.length === 1 ? "client" : "clients"}`} padding="px-5 sm:px-6 pt-5 pb-2" lede="Advertisers appear here on their own the first time a payment posts, and Stripe customers the first time the sync sees them. Add anyone else by hand.">
        {clients.length === 0 ? (
          <div className="pb-4">
            <Empty>No clients yet. Add one, or record an ad payment and the advertiser shows up here.</Empty>
          </div>
        ) : (
          <ul>
            {clients.map((c) => {
              const ytd = incomeFor(c.id, false);
              const all = incomeFor(c.id, true);
              return (
                <li key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 py-4 border-b border-white/[0.06] last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-white leading-snug flex items-center gap-2.5 flex-wrap">
                      {c.name}
                      {c.advertiserId && (
                        <a href={clientHref(c.advertiserId)}>
                          <Badge tone="brand" dot={false}>Advertiser</Badge>
                        </a>
                      )}
                      {c.stripeCustomerId && (
                        <Badge tone="neutral" dot={false}>Stripe</Badge>
                      )}
                    </p>
                    <p className="text-xs text-white/45 leading-snug">
                      {c.note || (c.advertiserId ? "On the screens" : c.stripeCustomerId ? "Pays through Stripe" : "Web or app client")}
                      {all !== ytd ? ` · ${formatCents(all, { whole: true })} all time` : ""}
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className={`${numClass} text-xl text-white tabular-nums leading-none`}>{formatCents(ytd, { whole: true })}</p>
                    <p className="text-[11px] text-white/35 mt-1">this year</p>
                  </div>
                  <a href={`${BOOKS}/ledger?show=in`} className="text-xs text-white/40 hover:text-white transition-colors shrink-0">
                    Ledger
                  </a>
                  {!c.advertiserId && (
                    <form action={deleteClientAction} className="shrink-0">
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className={`${btnDanger} ${btnSm}`}>Remove</button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="mt-5">
        <Disclosure id="add-client" summary={<span className="text-white/60">Add a client</span>} hint="a name is enough" open={Boolean(params.err)}>
          <form action={addClientAction} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end pt-3">
            <Field label="Name" name="name" id="client-name" placeholder="Arbor Cove Funding" required />
            <Field label="Note" name="note" id="client-note" placeholder="Website, monthly on Stripe" />
            <SubmitButton className={btnPrimary} pendingLabel="Adding">
              Add
            </SubmitButton>
          </form>
        </Disclosure>
      </div>
    </Shell>
  );
}
