import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ArchitectureTemplates from "@/components/landing/ArchitectureTemplates";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import CallToAction from "@/components/landing/CallToAction";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-800 dark:selection:text-emerald-300">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ArchitectureTemplates />
        <Features />
        <HowItWorks />
        <Pricing />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
