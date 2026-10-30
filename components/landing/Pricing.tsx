"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, X, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 border-t border-white/10 bg-black relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] pointer-events-none opacity-20 blur-[130px] rounded-full"
        style={{
          background: "radial-gradient(ellipse at center, rgba(255, 223, 39, 0.25) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 80%)",
        }}
      />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center space-y-4 mb-16 max-w-3xl mx-auto">
          <Badge variant="outline" className="text-[#ffee72] border-[#ffdf27]/30 bg-[#ffc507]/10 px-3.5 py-1 text-xs font-mono">
            Pricing & Plans
          </Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Simple, Transparent Plans for Every Team
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Start modeling your first schema for free. Upgrade to Pro for advanced database entities, or unlock the AI Architect tier for automated prompt-to-database copilots.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {/* TIER 1: Free Starter (1 Project Only) */}
          <Card className="flex flex-col border border-border bg-card/90 backdrop-blur-md shadow-2xs hover:border-foreground/30 transition-all rounded-2xl">
            <CardHeader className="space-y-1.5 pb-6 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Hobbyist</CardTitle>
                <Badge variant="outline" className="text-xs font-mono text-zinc-400 border-zinc-800">
                  Free Forever
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                For solo developers prototyping their first database architecture.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6 pt-6">
              <div className="text-3xl font-extrabold font-mono">
                $0{" "}
                <span className="text-sm font-normal text-muted-foreground font-sans">
                  /month
                </span>
              </div>
              <ul className="space-y-3 text-xs text-muted-foreground">
                <li className="flex items-start gap-2.5 text-foreground font-semibold">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0 mt-0.5" />
                  <span>Strictly 1 Active Database Project</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0 mt-0.5" />
                  <span>Interactive React Flow Schema Canvas</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0 mt-0.5" />
                  <span>Core SQL Tables & Column Attributes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0 mt-0.5" />
                  <span>PK & FK Column Relationship Wiring</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0 mt-0.5" />
                  <span>Export to PostgreSQL & MySQL DDL</span>
                </li>
                <li className="flex items-start gap-2.5 text-zinc-600 line-through">
                  <X className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                  <span>Multi-Domain & Multi-Schema Groups</span>
                </li>
                <li className="flex items-start gap-2.5 text-zinc-600 line-through">
                  <X className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                  <span>CASCADE Drop Simulator</span>
                </li>
                <li className="flex items-start gap-2.5 text-zinc-600 line-through">
                  <X className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                  <span>AI Schema Copilot & Agent Preview</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pt-4 border-t border-border/40">
              <Link href="/dashboard" className="w-full">
                <Button variant="outline" className="w-full text-xs font-semibold h-10 rounded-xl cursor-pointer">
                  Start Free (1 Project)
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* TIER 2: Pro Architect (15 Projects, Advanced Modeling, No AI) */}
          <Card className="flex flex-col border border-border bg-card/90 backdrop-blur-md shadow-2xs hover:border-foreground/30 transition-all rounded-2xl">
            <CardHeader className="space-y-1.5 pb-6 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Pro Architect</CardTitle>
                <Badge variant="outline" className="text-xs font-mono text-sky-400 border-sky-500/30 bg-sky-500/10">
                  Standard
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                For professional developers & DBAs managing production models.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6 pt-6">
              <div className="text-3xl font-extrabold font-mono text-foreground">
                $19{" "}
                <span className="text-sm font-normal text-muted-foreground font-sans">
                  /month
                </span>
              </div>
              <ul className="space-y-3 text-xs text-foreground">
                <li className="flex items-start gap-2.5 font-semibold text-[#ffee72]">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0 mt-0.5" />
                  <span>Up to 15 Active Database Projects</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0 mt-0.5" />
                  <span>Domain Grouping & Multi-Schema Containers</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0 mt-0.5" />
                  <span>All Nodes: Views, Triggers, Enums & Indexes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0 mt-0.5" />
                  <span>Interactive React Flow CASCADE Drop Simulator</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0 mt-0.5" />
                  <span>Export to PostgreSQL, MySQL, SQLite & Prisma ORM</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0 mt-0.5" />
                  <span>High-Res 4K PNG & SVG Export (Watermark-free)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0 mt-0.5" />
                  <span>SQL DDL Reverse Engineering & Import</span>
                </li>
                <li className="flex items-start gap-2.5 text-zinc-600 line-through">
                  <X className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                  <span>AI Copilot & Live Agent Chat (AI Tier Only)</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pt-4 border-t border-border/40">
              <Link href="/dashboard/pricing" className="w-full">
                <Button variant="outline" className="w-full text-xs font-semibold h-10 rounded-xl hover:bg-white/10 cursor-pointer">
                  Upgrade to Pro
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* TIER 3: AI Architect Pro (Top Tier - Higher Cost, Full AI Features) */}
          <Card className="flex flex-col border-2 border-[#ffdf27] bg-[#0c0d12]/95 backdrop-blur-xl shadow-2xl shadow-[#ffc507]/15 relative overflow-hidden rounded-2xl scale-[1.02]">
            {/* Top highlight banner */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 text-[10px] font-mono px-3.5 py-1 rounded-bl-xl uppercase tracking-wider font-extrabold flex items-center gap-1 shadow-sm">
              <Sparkles className="h-3 w-3" />
              <span>Most Powerful • AI Tier</span>
            </div>

            <CardHeader className="space-y-1.5 pb-6 border-b border-[#23252b]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-extrabold text-[#ffdf27] flex items-center gap-1.5">
                  <Zap className="h-5 w-5 text-[#ffdf27]" />
                  <span>AI Architect Pro</span>
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-zinc-400">
                For teams & builders who want generative AI schema design & agent previews.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6 pt-6">
              <div className="text-3xl font-extrabold font-mono text-white flex items-baseline gap-1">
                $49{" "}
                <span className="text-sm font-normal text-muted-foreground font-sans">
                  /month
                </span>
                <span className="ml-2 text-[10px] font-mono text-[#ffdf27] bg-[#ffdf27]/10 px-2 py-0.5 rounded-full border border-[#ffdf27]/30">
                  Full AI Access
                </span>
              </div>
              <ul className="space-y-3 text-xs text-zinc-100">
                <li className="flex items-start gap-2.5 font-bold text-[#ffee72]">
                  <Check className="h-4 w-4 text-[#ffdf27] shrink-0 mt-0.5" />
                  <span>Unlimited Database Flow Projects</span>
                </li>
                <li className="flex items-start gap-2.5 font-bold text-white bg-white/[0.04] p-1.5 rounded-lg border border-white/10">
                  <Sparkles className="h-4 w-4 text-[#ffdf27] shrink-0 mt-0.5" />
                  <span>AI Schema Copilot (Text-to-Database Flow Engine)</span>
                </li>
                <li className="flex items-start gap-2.5 font-bold text-white bg-white/[0.04] p-1.5 rounded-lg border border-white/10">
                  <Sparkles className="h-4 w-4 text-[#ffdf27] shrink-0 mt-0.5" />
                  <span>AI Agent Chat & Tool Execution Preview (Gemini)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#ffdf27] shrink-0 mt-0.5" />
                  <span>Automated AI Index & Normalization Audits</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#ffdf27] shrink-0 mt-0.5" />
                  <span>Natural Language Schema Migration Diffs</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#ffdf27] shrink-0 mt-0.5" />
                  <span>All Pro Features (Multi-Domain, CASCADE, Prisma DDL)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#ffdf27] shrink-0 mt-0.5" />
                  <span>Priority 1-on-1 Architecture & DBA Support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pt-4 border-t border-[#23252b]">
              <Link href="/dashboard/pricing" className="w-full">
                <Button className="w-full text-xs font-bold h-11 rounded-xl bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 hover:shadow-lg hover:shadow-[#ffc507]/25 border-none transition-all cursor-pointer">
                  Get AI Architect Plan
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}