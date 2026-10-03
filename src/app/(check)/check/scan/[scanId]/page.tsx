import type { Metadata } from "next";
import { CheckProgress } from "../../_components/progress";

export const metadata: Metadata = {
  title: "Your Website Check",
  robots: { index: false, follow: false },
};

export default async function ScanPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <CheckProgress scanId={scanId} />
      </div>
    </section>
  );
}
