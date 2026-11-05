"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Sparkles, X, Zap } from "lucide-react";

// Flexible matcher for comparison features with backward compatibility
function matchFeature(feature: string, targetLabel: string): boolean {
  const f = feature.toLowerCase().trim();
  const t = targetLabel.toLowerCase().trim();
  if (f.includes(t) || t.includes(f.replace(" (full access)", ""))) return true;
  if (
    t.includes("sql") &&
    t.includes("nosql") &&
    (f.includes("postgresql") || f.includes("mysql") || (f.includes("sql") && f.includes("nosql")))
  ) {
    return true;
  }
  if (
    t.includes("mermaid") &&
    (f.includes("mermaid") || f.includes("prisma") || f.includes("sqlite"))
  ) {
    return true;
  }
  return false;
}

// Canonical 7 features that map 1-to-1 with schema studio permissions
const COMPARISON_FEATURES: { label: string; ai?: boolean }[] = [
  { label: "React Flow Visual Canvas" },
  { label: "Export SQL & NoSQL DDL" },
  { label: "Multi-Domain Grouping" },
  { label: "CASCADE Drop Simulator" },
  { label: "Import & Export Mermaid" },
  { label: "AI Prompt-to-Schema Copilot", ai: true },
  { label: "AI Agent Chat & Tool Execution", ai: true },
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Fetch real plans dynamically from Convex database
  const activePlans = useQuery(api.plans.GetActivePlans, {});

  // Fallback default plans (same canonical data as in dashboard/pricing)
  const displayPlans =
    activePlans && activePlans.length > 0
      ? activePlans
      : [
          {
            _id: "default-free",
            name: "Hobbyist Free",
            planCode: "free",
            description: "For solo developers prototyping their first database architecture.",
            monthlyPrice: 0,
            yearlyPrice: 0,
            currency: "INR",
            badge: "FREE FOREVER",
            features: [
              "React Flow Visual Canvas",
              "Export SQL & NoSQL DDL",
            ],
            projectQuota: 1,
            isActive: true,
          },
          {
            _id: "default-pro",
            name: "Pro Architect",
            planCode: "pro",
            description: "For power architects managing multi-domain schemas and team collaboration.",
            monthlyPrice: 1499,
            yearlyPrice: 14999,
            currency: "INR",
            badge: "POPULAR",
            features: [
              "React Flow Visual Canvas",
              "Export SQL & NoSQL DDL",
              "Multi-Domain Grouping",
              "CASCADE Drop Simulator",
              "Import & Export Mermaid",
            ],
            projectQuota: 15,
            isActive: true,
          },
          {
            _id: "default-ai",
            name: "AI Architect Pro",
            planCode: "ai",
            description: "Full AI schema co-piloting with natural language generation & optimization.",
            monthlyPrice: 3999,
            yearlyPrice: 39999,
            currency: "INR",
            badge: "MOST POWERFUL",
            features: [
              "React Flow Visual Canvas",
              "Export SQL & NoSQL DDL",
              "Multi-Domain Grouping",
              "CASCADE Drop Simulator",
              "Import & Export Mermaid",
              "AI Prompt-to-Schema Copilot",
              "AI Agent Chat & Tool Execution",
            ],
            projectQuota: 9999,
            isActive: true,
          },
        ];

  return (
    <section id="pricing" className="py-24 border-t border-white/10 bg-black relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] pointer-events-none opacity-20 blur-[130px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255, 223, 39, 0.25) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 80%)",
        }}
      />

      <div className="container mx-auto px-4 md:px-8 relative z-10 space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge
            variant="outline"
            className="text-[#ffee72] border-[#ffdf27]/30 bg-[#ffc507]/10 px-3.5 py-1 text-xs font-mono"
          >
            Pricing &amp; Plans
          </Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Simple, Transparent Plans for Every Team
          </h2>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            Start modeling your first schema for free. Upgrade to Pro for multi-domain containers and CASCADE simulators, or unlock the AI Architect tier for automated prompt-to-database copilots.
          </p>

          {/* Simple Clean Monthly / Yearly Billing Toggle */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-zinc-950 border border-zinc-800 shadow-inner">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-[#ffdf27] text-black font-bold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  billingCycle === "yearly"
                    ? "bg-[#ffdf27] text-black font-bold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Yearly Billing
              </button>
            </div>
          </div>
        </div>

        {/* Real Dynamic Plan Cards Grid */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${
            displayPlans.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
          } gap-8 max-w-6xl mx-auto items-stretch`}
        >
          {displayPlans.map((plan) => {
            const isTopTier =
              plan.planCode === "ai" ||
              (plan.badge && plan.badge.toUpperCase().includes("POWERFUL")) ||
              (plan.badge && plan.badge.toUpperCase().includes("ULTIMATE")) ||
              (plan.projectQuota ?? 0) >= 999;

            const isFree = plan.monthlyPrice === 0;

            const price =
              billingCycle === "yearly"
                ? plan.yearlyPrice ?? 0
                : plan.monthlyPrice ?? 0;

            const isUnlimited =
              (plan.projectQuota ?? 1) >= 999 ||
              (plan.projectQuota ?? 1) === 0 ||
              plan.planCode === "ai";

            return (
              <Card
                key={String(plan._id || plan.planCode)}
                className={`flex flex-col border transition-all duration-300 rounded-2xl relative ${
                  isTopTier
                    ? "border-2 border-[#ffdf27] bg-[#0c0d12]/95 backdrop-blur-xl shadow-2xl shadow-[#ffc507]/15 scale-[1.02]"
                    : "border-border bg-card/90 backdrop-blur-md shadow-2xs hover:border-foreground/30"
                }`}
              >
                {/* Top Highlight Banner for AI Tier */}
                {isTopTier && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 text-[10px] font-mono px-3.5 py-1 rounded-bl-xl uppercase tracking-wider font-extrabold flex items-center gap-1 shadow-sm">
                    <Sparkles className="h-3 w-3" />
                    <span>Most Powerful • AI Tier</span>
                  </div>
                )}

                <CardHeader className="space-y-1.5 pb-6 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <CardTitle
                      className={`text-xl font-bold flex items-center gap-1.5 ${
                        isTopTier ? "text-[#ffdf27]" : "text-foreground"
                      }`}
                    >
                      {isTopTier && <Zap className="h-5 w-5 text-[#ffdf27]" />}
                      <span>{plan.name}</span>
                    </CardTitle>
                    {isFree ? (
                      <Badge
                        variant="outline"
                        className="text-xs font-mono text-zinc-400 border-zinc-800"
                      >
                        Free Forever
                      </Badge>
                    ) : plan.badge && !isTopTier ? (
                      <Badge
                        variant="outline"
                        className="text-xs font-mono text-sky-400 border-sky-500/30 bg-sky-500/10"
                      >
                        {plan.badge}
                      </Badge>
                    ) : null}
                  </div>
                  <CardDescription className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-6 pt-6">
                  {/* Clean Price Display */}
                  <div className="text-3xl font-extrabold font-mono text-foreground flex items-baseline gap-1">
                    ₹{price.toLocaleString()}{" "}
                    <span className="text-sm font-normal text-muted-foreground font-sans">
                      /{billingCycle === "yearly" ? "year" : "month"}
                    </span>
                    {isTopTier && (
                      <span className="ml-2 text-[10px] font-mono text-[#ffdf27] bg-[#ffdf27]/10 px-2 py-0.5 rounded-full border border-[#ffdf27]/30 font-normal">
                        Full AI Access
                      </span>
                    )}
                  </div>

                  {/* Active Projects Quota Tag */}
                  <div
                    className={`text-xs font-mono px-2.5 py-1.5 rounded-lg border ${
                      isTopTier
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                        : "bg-muted/30 border-border/50 text-muted-foreground"
                    }`}
                  >
                    Active Projects:{" "}
                    <span
                      className={`font-bold ${
                        isTopTier ? "text-[#ffee72]" : "text-foreground"
                      }`}
                    >
                      {isUnlimited
                        ? "Unlimited"
                        : plan.projectQuota === 1
                        ? "1"
                        : `${plan.projectQuota}`}
                    </span>
                  </div>

                  {/* Clean Feature List */}
                  <ul className="space-y-2.5 text-xs">
                    {COMPARISON_FEATURES.map(({ label, ai }) => {
                      const has = plan.features.some((f: string) => matchFeature(f, label));
                      return (
                        <li
                          key={label}
                          className={`flex items-start gap-2.5 ${
                            has
                              ? isTopTier
                                ? "text-zinc-100"
                                : "text-foreground/90"
                              : "text-zinc-500"
                          }`}
                        >
                          {has ? (
                            ai ? (
                              <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-[#ffdf27]" />
                            ) : (
                              <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                            )
                          ) : (
                            <X className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={[
                              "leading-tight",
                              !has ? "line-through text-zinc-500" : "",
                              has && ai ? "font-semibold text-[#ffee72]" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {label}
                            {has && ai && (
                              <span className="ml-1.5 text-[10px] font-mono opacity-80 font-normal">
                                (Full Access)
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>

                <CardFooter className="pt-4 border-t border-border/40">
                  {isFree ? (
                    <Link href="/dashboard" className="w-full">
                      <Button
                        variant="outline"
                        className="w-full text-xs font-semibold h-10 rounded-xl cursor-pointer"
                      >
                        Start Free (1 Project)
                      </Button>
                    </Link>
                  ) : isTopTier ? (
                    <Link href="/dashboard/pricing" className="w-full">
                      <Button className="w-full text-xs font-bold h-11 rounded-xl bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 hover:shadow-lg hover:shadow-[#ffc507]/25 border-none transition-all cursor-pointer">
                        Get AI Architect Plan
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/dashboard/pricing" className="w-full">
                      <Button
                        variant="outline"
                        className="w-full text-xs font-semibold h-10 rounded-xl hover:bg-white/10 cursor-pointer"
                      >
                        Upgrade to Pro
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
