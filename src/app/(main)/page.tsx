import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import SelectedWork from "@/components/sections/SelectedWork";
import Capabilities from "@/components/sections/Capabilities";
import SocialProof from "@/components/sections/SocialProof";
import Reviews from "@/components/sections/Reviews";
import ContactCTA from "@/components/sections/ContactCTA";

// The root layout no longer sets a site-wide canonical (six pages were
// inheriting "/" and telling Google they were the homepage), so every page
// names its own. This one really is the homepage.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <Hero />
      <SelectedWork />
      <Capabilities />
      <SocialProof />
      <Reviews />
      <ContactCTA />
    </>
  );
}
