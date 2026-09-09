import type { Metadata } from "next";
import { setArtworkStatusAction } from "../../actions";
import { artworkHref, currentArtwork, isArtworkStoreConfigured } from "@/lib/ads/artwork";
import { cachedAdvertisers } from "@/lib/ads/cached";
import { ARTWORK_STATUSES, artworkStatusOf, formatDate, type ArtworkStatus, type AdvertiserView } from "@/lib/ads/roster";
import { PageHeader } from "../../_components/shell";
import { SubmitButton } from "../../_components/submit-button";
import { clientHref } from "../../_components/types";
import { Badge, Empty, Note, bebas, btnGhost, btnPrimary, btnSm, cardClass, labelClass, serif, stamp, type Tone } from "../../_components/ui";
import { Shell } from "../shell";

export const metadata: Metadata = { title: "Artwork" };

const PAGE = "/advertise/admin/artwork";

const TONE: Record<ArtworkStatus, Tone> = {
  requested: "bad",
  received: "warn",
  approved: "warn",
  "on-screen": "ok",
};

function StepButtons({ view, status }: { view: AdvertiserView; status: ArtworkStatus }) {
  const step = ARTWORK_STATUSES.find((s) => s.id === status);
  const index = ARTWORK_STATUSES.findIndex((s) => s.id === status);
  const previous = index > 0 ? ARTWORK_STATUSES[index - 1] : null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {previous && (
        <form action={setArtworkStatusAction}>
          <input type="hidden" name="id" value={view.id} />
          <input type="hidden" name="status" value={previous.id} />
          <input type="hidden" name="returnTo" value={PAGE} />
          <SubmitButton className={`${btnGhost} ${btnSm}`} pendingLabel="Saving">
            {`Back to ${previous.label.toLowerCase()}`}
          </SubmitButton>
        </form>
      )}
      {step?.next && (
        <form action={setArtworkStatusAction}>
          <input type="hidden" name="id" value={view.id} />
          <input type="hidden" name="status" value={step.next} />
          <input type="hidden" name="returnTo" value={PAGE} />
          <SubmitButton className={`${btnPrimary} ${btnSm}`} pendingLabel="Saving">
            {step.nextLabel ?? "Next"}
          </SubmitButton>
        </form>
      )}
    </div>
  );
}

export default async function ArtworkPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string; detail?: string }>;
}) {
  const [params, advertisers] = await Promise.all([searchParams, cachedAdvertisers()]);
  const live = advertisers.filter((a) => a.status !== "ended");
  const current = await Promise.all(live.map((a) => currentArtwork(a.id)));
  const configured = isArtworkStoreConfigured();

  const rows = live
    .map((view, i) => ({ view, status: artworkStatusOf(view), art: current[i] }))
    .sort((a, b) => {
      const order = (s: ArtworkStatus) => ARTWORK_STATUSES.findIndex((x) => x.id === s);
      return order(a.status) - order(b.status) || a.view.business.localeCompare(b.view.business);
    });

  const pending = rows.filter((r) => r.status !== "on-screen");
  const playing = rows.filter((r) => r.status === "on-screen");

  return (
    <Shell active="artwork" banner={params}>
      <PageHeader eyebrow="Artwork" title="Whose ad is actually playing." />

      {!configured && (
        <div className="mb-6">
          <Note tone="warn">
            <p className="text-sm text-white">File storage isn&apos;t connected, so slides can&apos;t be uploaded yet. The statuses still work.</p>
          </Note>
        </div>
      )}

      <div className="grid sm:grid-cols-4 gap-2 mb-8">
        {ARTWORK_STATUSES.map((s) => (
          <div key={s.id} className={`${cardClass} px-4 py-3.5 flex items-center justify-between gap-3`}>
            <Badge tone={TONE[s.id]}>{s.label}</Badge>
            <span className={`${serif} text-2xl text-white`}>{rows.filter((r) => r.status === s.id).length}</span>
          </div>
        ))}
      </div>

      <section className="mb-10">
        <h2 className={`${labelClass} !text-[#DC2626]`}>Not on the screens yet · {pending.length}</h2>
        {pending.length === 0 ? (
          <Empty>Every running client&apos;s slide is on the screens.</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map(({ view, status, art }) => (
              <li key={view.id} id={`client-${view.id}`} className={`${cardClass} p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4`}>
                <div className="w-full sm:w-32 aspect-video bg-black border border-white/[0.08] shrink-0 overflow-hidden flex items-center justify-center">
                  {art ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artworkHref(view.id, art.id)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className={`${bebas} text-[10px] tracking-[0.2em] text-white/25`}>No file</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <a href={clientHref(view.id, "artwork")} className={`${serif} text-[20px] leading-none text-white hover:text-[#f87171] transition-colors`}>
                      {view.business}
                    </a>
                    <Badge tone={TONE[status]}>{ARTWORK_STATUSES.find((s) => s.id === status)?.label}</Badge>
                    {view.status === "pending" && <Badge>Starts {formatDate(view.startDate)}</Badge>}
                  </div>
                  <p className="text-xs text-white/45 mt-1.5">
                    {view.category || "no category"}
                    {art ? ` · file uploaded ${stamp(art.uploadedAt)}${art.note ? ` · ${art.note}` : ""}` : " · nothing on file"}
                    {view.status === "active" ? " · running, so plays are being counted without a slide" : ""}
                  </p>
                </div>
                <StepButtons view={view} status={status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className={`${labelClass} !text-[#DC2626]`}>On the screens · {playing.length}</h2>
        {playing.length === 0 ? (
          <Empty>Nothing marked as on screen yet.</Empty>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {playing.map(({ view, art }) => (
              <li key={view.id} id={`client-${view.id}`} className={`${cardClass} overflow-hidden`}>
                <a href={clientHref(view.id, "artwork")} className="block aspect-video bg-black border-b border-white/[0.08] overflow-hidden">
                  {art ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artworkHref(view.id, art.id)} alt={`${view.business} slide`} className="w-full h-full object-cover" />
                  ) : (
                    <span className={`${bebas} h-full flex items-center justify-center text-[10px] tracking-[0.2em] text-white/25`}>No file on record</span>
                  )}
                </a>
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{view.business}</p>
                    <p className="text-xs text-white/40 truncate">{art ? `since ${formatDate(art.uploadedAt.slice(0, 10))}` : view.category || ""}</p>
                  </div>
                  <StepButtons view={view} status="on-screen" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Shell>
  );
}
