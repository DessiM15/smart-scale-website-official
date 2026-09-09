import type { Metadata } from "next";
import { PageHeader } from "../../_components/shell";
import { Card, Empty, labelClass } from "../../_components/ui";
import { Shell } from "../shell";

export const metadata: Metadata = { title: "Flyers" };

/**
 * The flyer product has a home in the navigation before it has code behind
 * it, so the shape of the portal is right on day one. What it will be was
 * agreed in August; this page says so, in plain words, until it is built.
 */
export default async function FlyersPage() {
  return (
    <Shell active="flyers">
      <PageHeader eyebrow="Flyers · coming soon" title="Every drop, counted." />
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5 items-start">
        <Card title="What this will be">
          <p className="text-sm text-white/70 leading-relaxed max-w-2xl">
            A flyer client gets a campaign, a campaign gets drops, and every drop gets its own QR code. Each code rides
            the same short links the screens use, so scans are counted, phones are de-duplicated and test scans can be
            held back. Quantity printed and cost per drop turn the scan counts into cost per scan, which is the number
            that says whether a zone is worth doing again.
          </p>
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            {[
              ["Client", "Name, contact, notes. Lighter than an advertiser, because a flyer client has no slot or category."],
              ["Campaign", "One print run: a name, dates, and the page the flyer sends people to."],
              ["Drops", "A zone, an event or a batch, each with its own code, quantity and cost."],
            ].map(([title, text]) => (
              <div key={title} className="border border-white/[0.08] px-4 py-4">
                <p className={labelClass}>{title}</p>
                <p className="text-xs text-white/55 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Also planned">
          <ul className="text-sm text-white/65 leading-relaxed flex flex-col gap-2.5">
            <li>A contact sheet of every code in a campaign, labelled, so the right QR goes on the right batch.</li>
            <li>A shareable, Smart Scale branded stats page per campaign that needs no login and can be revoked.</li>
            <li>Town-level scan counts per code, already being recorded today.</li>
          </ul>
          <div className="mt-5">
            <Empty>Nothing to show yet. When the first flyer client signs, this page becomes their campaign list.</Empty>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
