/**
 * The contact sheet: every code in a campaign, labelled, on one printable
 * page. So nobody prints the Katy QR on the Sugar Land batch, and the
 * printer gets one file with the right code under the right name.
 */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isSignedIn } from "@/lib/ads/auth";
import { getCampaign, getCampaignClient, listPlacements, mediumOf } from "@/lib/ads/campaigns";
import { getLink } from "@/lib/ads/link-store";
import { renderSvg, scanUrlFor } from "@/lib/ads/qr";
import { formatDate } from "@/lib/ads/roster";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact sheet",
  robots: { index: false, follow: false },
};

export default async function SheetPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isSignedIn())) redirect("/advertise/admin");
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();
  const [client, placements] = await Promise.all([getCampaignClient(campaign.clientId), listPlacements(campaign.id)]);

  const cards = await Promise.all(
    placements.map(async (p) => {
      const link = await getLink(p.code);
      return { placement: p, svg: link ? await renderSvg(link) : null, active: link?.active ?? false };
    }),
  );

  return (
    <main className="min-h-screen bg-[#e8e4de] py-8 print:bg-white print:py-0">
      <div className="max-w-[8.5in] mx-auto px-6 mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <a href={`/advertise/admin/campaigns/${campaign.id}`} className="text-sm font-semibold text-[#5c4f45] hover:text-[#1a1210]">
          ← Back to the campaign
        </a>
        <span className="text-sm text-[#9a8b7d]">Print to PDF from your browser. Each code is the vector master.</span>
      </div>

      <article className="max-w-[8.5in] mx-auto bg-white text-[#1a1210] px-10 py-10 shadow-lg print:shadow-none print:max-w-none print:px-0 print:py-0 font-sans">
        <header className="pb-5 border-b-2 border-[#1a1210] flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#DC2626] font-bold">Smart Scale · Contact sheet</p>
            <h1 className="mt-1.5 text-3xl font-semibold tracking-tight">{campaign.name}</h1>
            <p className="mt-1 text-sm text-[#5c4f45]">
              {client?.name ?? "Smart Scale"} · {mediumOf(campaign.medium).label} · out {formatDate(campaign.startDate)}
            </p>
          </div>
          <p className="text-xs text-[#7a6a5d] max-w-[260px] leading-relaxed">
            Every scan lands on <span className="font-semibold text-[#1a1210] break-all">{campaign.destination.replace(/^https?:\/\//, "")}</span>. The code under each QR is the one to print with it.
          </p>
        </header>

        {cards.length === 0 ? (
          <p className="mt-8 text-sm text-[#7a6a5d]">No placements yet.</p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-6">
            {cards.map(({ placement, svg, active }) => (
              <li key={placement.id} className="border border-black/10 rounded-lg p-5 break-inside-avoid flex flex-col items-center text-center">
                {svg ? (
                  <div className="w-[2.6in] h-[2.6in]" dangerouslySetInnerHTML={{ __html: svg }} />
                ) : (
                  <div className="w-[2.6in] h-[2.6in] flex items-center justify-center text-xs text-[#9a8b7d] border border-dashed border-black/20">
                    code missing from the registry
                  </div>
                )}
                <p className="mt-3 text-lg font-semibold">{placement.label}</p>
                <p className="mt-0.5 font-mono text-sm text-[#DC2626]">{scanUrlFor(placement.code).replace(/^https?:\/\//, "")}</p>
                <p className="mt-1 text-[11px] text-[#7a6a5d]">
                  {placement.quantity !== null ? `${placement.quantity.toLocaleString()} printed` : ""}
                  {placement.quantity !== null && placement.note ? " · " : ""}
                  {placement.note}
                  {!active ? " · RETIRED" : ""}
                </p>
              </li>
            ))}
          </ul>
        )}

        <footer className="mt-10 pt-4 border-t border-black/10 text-[10px] text-[#9a8b7d] flex justify-between">
          <span>Print the short address under the QR too, for a camera that won&apos;t read it.</span>
          <span>{cards.length} {cards.length === 1 ? "code" : "codes"}</span>
        </footer>
      </article>
    </main>
  );
}
