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
    <section id="pricing" className="py-24 border-t border-border bg-muted/20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center space-y-4 mb-16 max-w-3xl mx-auto">
          <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono">
            Pricing Plans
          </Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Predictable Plans for Every Engineer
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Start designing for free. Upgrade when you need deep AI audits, traffic simulations, and team collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Tier */}
          <Card className="flex flex-col border border-border bg-card shadow-2xs hover:border-foreground/30 transition-colors">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-bold">Developer</CardTitle>
              <CardDescription className="text-xs">
                Perfect for students and interview practice.
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
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>3 Active System Design Projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>50+ Cloud & Microservice Components</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Interactive Flow Canvas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Export to Mermaid.js Code</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Standard Community Templates</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard" className="w-full">
                <Button variant="outline" className="w-full text-xs font-semibold">
                  Start Designing Free
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
              <CardTitle className="text-xl font-bold text-[#ffdf27]">Architect Pro</CardTitle>
              <CardDescription className="text-xs">
                For senior engineers, tech leads & founders.
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
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold">Unlimited System Architecture Projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold">AI Architecture Copilot (Unlimited Prompts)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold">Real-Time Traffic & Latency Simulator</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>SPOF & Reliability Audit Tool</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Export to Terraform IaC & 4K SVG/PNG</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Senior System Design Interview Kit</span>
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
              <CardTitle className="text-xl font-bold">Engineering Team</CardTitle>
              <CardDescription className="text-xs">
                For engineering organizations & squads.
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
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Everything in Architect Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Multiplayer Real-time Collaboration</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Custom Internal Component Library</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Architecture RFC Review Workflows</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Dedicated Architectural Support</span>
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
