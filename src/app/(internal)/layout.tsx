import type { Metadata } from "next";

/**
 * Internal operator tooling. Kept out of the (main) group so it inherits
 * neither the marketing navbar nor the footer, and noindex'd because these
 * pages must never appear in search.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[#0A0A0A] text-white">{children}</div>;
}
