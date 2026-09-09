import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import { redirect } from "next/navigation";
import { isSignedIn } from "@/lib/ads/auth";
import { Grain } from "../_components/shell";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Ad Ops", template: "%s · Ad Ops" },
  robots: { index: false, follow: false },
};

/**
 * Everything under here needs the team key. Checked once, here, so no page
 * can forget. The frame itself (sidebar, tab bar) is rendered by each page
 * through `Shell`, which is how the page tells the frame which item to light.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isSignedIn())) redirect("/advertise/admin/signin");

  return (
    <div className={`${cormorant.variable} min-h-screen bg-[#0A0A0A] text-white`}>
      <Grain />
      {children}
    </div>
  );
}
