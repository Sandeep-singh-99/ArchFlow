"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
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
    <section id="pricing" className="py-24 border-t border-white/10 bg-black">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center space-y-4 mb-16 max-w-3xl mx-auto">
          <Badge variant="outline" className="text-[#ffee72] border-[#ffdf27]/30 bg-[#ffc507]/10 px-3 py-1 text-xs font-mono">
            Pricing Plans
          </Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Predictable Plans for Every Developer & DBA
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Start designing database flows for free. Upgrade when you need deep AI schema generation, cascade simulations, and team collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Tier */}
          <Card className="flex flex-col border border-border bg-card shadow-2xs hover:border-foreground/30 transition-colors">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-bold">Developer</CardTitle>
              <CardDescription className="text-xs">
                Perfect for individual developers & schema prototyping.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="text-3xl font-extrabold font-mono">
                $0{" "}
                <span className="text-sm font-normal text-muted-foreground font-sans">
                  /month
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span>3 Active Database Flow Projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span>Interactive React Flow Schema Canvas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span>SQL & NoSQL Table Entity Nodes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span>PK & FK Column Relationship Wiring</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span>Export to PostgreSQL & MySQL DDL</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span>Mermaid ER Diagram Export</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard" className="w-full">
                <Button variant="outline" className="w-full text-xs font-semibold">
                  Start Modeling Free
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Pro Tier - High contrast gradient highlight */}
          <Card className="flex flex-col border-2 border-[#ffdf27]/70 bg-card shadow-lg shadow-[#ffc507]/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 text-[10px] font-mono px-3 py-1 rounded-bl uppercase tracking-wider font-bold">
              Most Popular
            </div>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-bold text-[#ffdf27]">Database Architect Pro</CardTitle>
              <CardDescription className="text-xs">
                For senior engineers, DBAs & startup founders.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="text-3xl font-extrabold font-mono text-foreground">
                $19{" "}
                <span className="text-sm font-normal text-muted-foreground font-sans">
                  /month
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span className="font-semibold">Unlimited Database Flow Projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span className="font-semibold">AI Schema Copilot (Unlimited Prompts)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span className="font-semibold">React Flow CASCADE Drop Simulator</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span>Automated Index & Normalization Audits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span>Export to PostgreSQL, MySQL, SQLite & Prisma</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span>Domain Grouping & Multi-Schema Containers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span>SQL DDL Reverse Engineering & Import</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard" className="w-full">
                <Button className="w-full text-xs font-bold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 hover:shadow-md hover:shadow-[#ffc507]/20 border-none transition-all">
                  Upgrade to Pro
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Team Tier */}
          <Card className="flex flex-col border border-border bg-card shadow-2xs hover:border-foreground/30 transition-colors">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-bold">Data Engineering Team</CardTitle>
              <CardDescription className="text-xs">
                For engineering squads & database platform teams.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="text-3xl font-extrabold font-mono">
                $49{" "}
                <span className="text-sm font-normal text-muted-foreground font-sans">
                  /month
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span>Everything in Architect Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span>Real-Time Multiplayer Schema Editing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span>Custom Domain Themes & Data Dictionaries</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span>Migration Diffing & Schema Change Reviews</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span>Team Role Access & Workspace Permissions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#ffee72] shrink-0" />
                  <span>Priority Support for Database Architects</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard" className="w-full">
                <Button variant="outline" className="w-full text-xs font-semibold">
                  Contact Team Sales
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
