import type { Metadata } from "next";
import { cachedLinks } from "@/lib/ads/cached";
import { getCodeStats } from "@/lib/ads/scan-store";
import { PageHeader } from "../../_components/shell";
import { QrTab } from "../../_components/qr-codes";
import type { LinkView } from "../../_components/types";
import { btnGhost, btnPrimary } from "../../_components/ui";
import { Shell } from "../shell";

export const metadata: Metadata = { title: "QR codes" };

export default async function QrPage({
  searchParams,
}: {
  searchParams: Promise<{ editLink?: string; msg?: string; err?: string; detail?: string; sent?: string }>;
}) {
  const [params, rawLinks] = await Promise.all([searchParams, cachedLinks()]);
  const links: LinkView[] = await Promise.all(
    rawLinks.map(async (link) => {
      const stats = await getCodeStats(link.code, 1);
      return { ...link, scans: stats.total, testScans: stats.testScans };
    }),
  );
  const editing = params.editLink ? links.find((l) => l.code === params.editLink) : undefined;

  return (
    <Shell active="qr" banner={params}>
      <PageHeader
        eyebrow={`QR codes · ${links.length}`}
        title="Every code, and where it sends people."
        action={
          <>
            <a href="/advertise/stats" className={btnGhost}>
              Scan report
            </a>
            <a href="#qr" className={btnPrimary}>
              + New code
            </a>
          </>
        }
      />
      <QrTab links={links} editing={editing} />
    </Shell>
  );
}
