import Hero from "@/components/sections/Hero";
import ServicesOverview from "@/components/sections/ServicesOverview";
import IndustriesWeServe from "@/components/sections/IndustriesWeServe";
import OurClients from "@/components/sections/OurClients";
import ContactStrip from "@/components/sections/ContactStrip";

export default function Home() {
  return (
    <>
      <Hero />
      <ServicesOverview />
      <IndustriesWeServe />
      <OurClients />
      <ContactStrip />
    </>
  );
}

