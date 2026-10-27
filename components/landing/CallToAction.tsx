"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Workflow, CheckCircle2, Sparkles } from "lucide-react";

export default function CallToAction() {
  return (
    <section className="py-24 border-t border-white/10 bg-black">
      <div className="container mx-auto px-4 md:px-8 text-center space-y-8 max-w-4xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#ffdf27]/30 bg-[#ffc507]/10 px-4 py-1.5 text-xs font-mono text-[#ffee72]">
          <Sparkles className="h-3.5 w-3.5 text-[#ffdf27]" />
          <span>Stop Drawing Static Boxes. Start Architecting with AI.</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
          Ready to Build Battle-Tested <br />
          <span className="bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] bg-clip-text text-transparent">
            System Architectures
          </span>{" "}
          with Confidence?
        </h2>

        <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
          Join thousands of developers, tech leads, and students who design, simulate,
          and document cloud infrastructure and microservice flows with ArchFlow.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="h-12 px-8 text-base rounded-lg font-bold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 hover:shadow-lg hover:shadow-[#ffc507]/25 border-none transition-all shadow-sm"
            >
              <Workflow className="mr-2 h-5 w-5 text-zinc-950" />
              Launch Canvas Free
              <ArrowRight className="ml-2 h-4 w-4 text-zinc-950" />
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg" className="h-12 px-7 text-base rounded-lg border-border hover:bg-muted font-medium">
              Explore Features
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#ffdf27]" />
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#ffdf27]" />
            <span>Instant Interactive Canvas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#ffdf27]" />
            <span>Export to Mermaid & Terraform</span>
          </div>
        </div>
      </div>
    </section>
  );
}
