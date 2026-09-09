import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminConfigured, isSignedIn } from "@/lib/ads/auth";
import { LockScreen } from "../_components/lock-screen";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in · Ad Ops",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  if (await isSignedIn()) redirect("/advertise/admin");
  const { err } = await searchParams;
  return <LockScreen configured={isAdminConfigured()} wrong={err === "badkey"} />;
}
