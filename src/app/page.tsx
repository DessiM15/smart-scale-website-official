import Hero from "@/components/sections/Hero";
import WhySmartScale from "@/components/sections/WhySmartScale";
import WhyChooseSmartScale from "@/components/sections/WhyChooseSmartScale";
import ProcessVisualization from "@/components/sections/ProcessVisualization";
import IndustriesWeServe from "@/components/sections/IndustriesWeServe";
import OurClients from "@/components/sections/OurClients";
import UrgencyCTA from "@/components/sections/UrgencyCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <WhySmartScale />
      <WhyChooseSmartScale />
      <ProcessVisualization />
      <IndustriesWeServe />
      <OurClients />
      <UrgencyCTA />
    </>
  );
}

