import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import Ticker from "@/components/home/Ticker";
import Work from "@/components/home/Work";
import Process from "@/components/home/Process";
import Reviews from "@/components/sections/Reviews";
import Advertising from "@/components/home/Advertising";
import Closing from "@/components/home/Closing";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <Hero />
      <Ticker />
      <Work />
      <Process />
      <Reviews />
      <Advertising />
      <Closing />
    </>
  );
}
