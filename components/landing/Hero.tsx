"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Workflow, CheckCircle2, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="isolate relative flex flex-col items-center justify-center pt-20 pb-20 md:pt-28 md:pb-28 overflow-hidden">
      {/* Targeted Hero Grid Background using the uploaded pattern */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Base dark canvas */}
        <div className="absolute inset-0 bg-black" />

        {/* User's uploaded grid pattern image */}
        <div 
          className="absolute inset-0 bg-repeat opacity-85"
          style={{
            backgroundImage: "url('/grid-pattern.png')",
            backgroundSize: "168px 358px",
            backgroundRepeat: "repeat",
          }}
        />

        {/* High-visibility crisp architectural grid lines */}
        <div 
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.12) 1px, transparent 1px)
            `,
            backgroundSize: "42px 42px",
          }}
        />

        {/* Smooth bottom fade-out into the rest of the dark page */}
        <div 
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, transparent 60%, var(--background) 100%)",
          }}
        />

        {/* Subtle warm center radial accent to complement the golden buttons */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 35%, rgba(255, 223, 39, 0.05) 0%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center space-y-8 max-w-4xl">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3.5 py-1 text-xs font-mono text-muted-foreground backdrop-blur-sm shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-[#ffdf27]" />
          <span className="text-foreground font-medium">AI System Design</span>
          <span className="h-1 w-1 rounded-full bg-[#ffc507]"></span>
          <span className="text-[#ffdf27] font-semibold">v2.0</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.14]">
          Design Scalable{" "}
          <span className="bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] bg-clip-text text-transparent">
            Systems & Flows
          </span>{" "}
          with AI
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Generate, simulate, and export production-ready architecture diagrams in seconds.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="h-12 px-8 text-base rounded-lg font-bold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 hover:shadow-lg hover:shadow-[#ffc507]/25 border-none transition-all shadow-sm"
            >
              <Workflow className="mr-2 h-5 w-5 text-zinc-950" />
              Launch Architecture Canvas
              <ArrowRight className="ml-2 h-4 w-4 text-zinc-950" />
            </Button>
          </Link>
          <Link href="#features">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-7 text-base rounded-lg border-border hover:bg-muted font-medium"
            >
              Explore Studio Features
            </Button>
          </Link>
        </div>

        {/* Feature Highlights List */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs md:text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#ffdf27]" />
            <span>50+ Cloud & Microservice Nodes</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#ffdf27]" />
            <span>Live Traffic & Latency Simulation</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#ffdf27]" />
            <span>Mermaid & Terraform Export</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#ffdf27]" />
            <span>System Design Interview Prep</span>
          </div>
        </div>
      </div>
    </section>
  );
}
