import Hero from "@/components/sections/Hero";
import SelectedWork from "@/components/sections/SelectedWork";
import Capabilities from "@/components/sections/Capabilities";
import SocialProof from "@/components/sections/SocialProof";
import Reviews from "@/components/sections/Reviews";
import ContactCTA from "@/components/sections/ContactCTA";

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
