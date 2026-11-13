"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import CallToAction from "@/components/landing/CallToAction";
import Footer from "@/components/landing/Footer";

const InteractiveLab = dynamic(
  () => import("@/components/landing/InteractiveLab"),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        Loading preview...
      </div>
    ),
  }
);

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-[#ffdf27]/25 selection:text-[#ffee72]">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <InteractiveLab />
        <Features />
        <HowItWorks />
        <Pricing />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
