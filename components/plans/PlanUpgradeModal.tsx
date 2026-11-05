"use client";

import React from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Sparkles,
  Zap,
  ArrowRight,
  Check,
  ShieldAlert,
  AlertCircle,
  X,
} from "lucide-react";
import {
  FeatureKey,
  PlanCode,
  CANONICAL_FEATURES,
  PLAN_NAMES,
} from "@/lib/planAccess";

interface PlanUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureKey?: FeatureKey;
  customTitle?: string;
  customDescription?: string;
  currentPlan?: PlanCode;
  projectCount?: number;
  projectQuota?: number;
  isQuotaModal?: boolean;
}

export default function PlanUpgradeModal({
  open,
  onOpenChange,
  featureKey,
  customTitle,
  customDescription,
  currentPlan = "free",
  projectCount,
  projectQuota,
  isQuotaModal = false,
}: PlanUpgradeModalProps) {
  const featureMeta = featureKey ? CANONICAL_FEATURES[featureKey] : undefined;
  const targetRequiredPlan: "pro" | "ai" =
    featureMeta?.requiredPlan === "ai" ? "ai" : "pro";

  const title =
    customTitle ||
    (isQuotaModal
      ? `Project Limit Reached (${projectCount || 1}/${projectQuota || 1})`
      : `Unlock ${featureMeta?.shortName || featureMeta?.label || "Feature"}`);

  const description =
    customDescription ||
    (isQuotaModal
      ? currentPlan === "free"
        ? "Your Free plan includes 1 schema project. Upgrade to create more projects and unlock CASCADE simulators, domain boundaries, and AI co-pilots."
        : "Your Pro plan includes 15 schema projects. Upgrade to AI Architect for unlimited database projects and live agent co-piloting."
      : targetRequiredPlan === "ai"
      ? `"${featureMeta?.label}" requires the AI Architect Pro tier.`
      : `"${featureMeta?.label}" requires the Pro Architect tier.`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg border border-border bg-[#0c0d12]/98 backdrop-blur-2xl shadow-2xl text-foreground p-6"
      >
        <DialogHeader className="space-y-3 pb-3 border-b border-border/60">
          {/* Top Toolbar: Badges on left, Close button on right */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {isQuotaModal ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertCircle className="size-3 text-amber-400" />
                  <span>
                    {currentPlan === "pro"
                      ? `Pro Limit (${projectCount || 15}/15)`
                      : `Free Limit (${projectCount || 1}/1)`}
                  </span>
                </span>
              ) : targetRequiredPlan === "ai" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#ffdf27]/10 text-[#ffee72] border border-[#ffdf27]/20">
                  <Sparkles className="size-3 text-[#ffdf27]" />
                  <span>AI Architect Required</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Lock className="size-3 text-sky-400" />
                  <span>Pro Architect Required</span>
                </span>
              )}

              <span className="text-[11px] font-mono text-zinc-400">
                Plan: <strong className="text-zinc-200">{PLAN_NAMES[currentPlan] || "Free Plan"}</strong>
              </span>
            </div>

            {/* Dedicated Minimal Close (X) Icon */}
            <DialogClose asChild>
              <button
                type="button"
                className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-transparent hover:border-border transition-all cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X className="size-4" />
              </button>
            </DialogClose>
          </div>

          <div className="space-y-1">
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
              {isQuotaModal ? (
                <AlertCircle className="size-4 text-amber-400 shrink-0" />
              ) : targetRequiredPlan === "ai" ? (
                <Sparkles className="size-4 text-[#ffee72] shrink-0" />
              ) : (
                <ShieldAlert className="size-4 text-amber-400 shrink-0" />
              )}
              <span>{title}</span>
            </DialogTitle>

            <DialogDescription className="text-xs text-zinc-400 leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Upgrade Plan Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3">
          {/* Pro Architect Card */}
          {targetRequiredPlan !== "ai" && (
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                targetRequiredPlan === "pro"
                  ? "border-sky-500/50 bg-sky-500/5 ring-1 ring-sky-500/20"
                  : "border-border/80 bg-card/60"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-sky-400">
                    Pro Architect
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    ₹1,499/mo
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Up to 15 projects, Multi-Domain grouping, CASCADE Drop Simulator, and Mermaid sync.
                </p>
                <ul className="text-[10px] space-y-1 text-zinc-300 pt-1">
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-sky-400" />
                    <span>15 Schema Projects</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-sky-400" />
                    <span>CASCADE Drop Simulator</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-sky-400" />
                    <span>Multi-Domain Grouping</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/dashboard/pricing"
                onClick={() => onOpenChange(false)}
                className="mt-4 block"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold h-8 border-sky-500/40 hover:bg-sky-500/20 text-sky-300 cursor-pointer"
                >
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          )}

          {/* AI Architect Pro Card */}
          <div
            className={`p-4 rounded-xl border-2 border-[#ffdf27] bg-[#14151c] flex flex-col justify-between relative overflow-hidden ${
              targetRequiredPlan === "ai" ? "sm:col-span-2" : ""
            }`}
          >
            <div className="absolute top-0 right-0 bg-gradient-to-l from-[#ffc507] to-[#ffee72] text-zinc-950 text-[9px] font-mono px-2 py-0.5 rounded-bl font-extrabold">
              ULTIMATE
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-[#ffee72] flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-[#ffdf27]" />
                  AI Architect Pro
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  ₹3,999/mo
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Full AI natural language prompt-to-schema copilot, live agent execution, and unlimited schemas.
              </p>
              <ul className="text-[10px] space-y-1 text-zinc-300 pt-1">
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-[#ffee72]" />
                  <span>Unlimited Schema Projects</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-[#ffee72]" />
                  <span>AI Prompt-to-Schema Copilot</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-[#ffee72]" />
                  <span>AI Agent Chat & Tool Execution</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-[#ffee72]" />
                  <span>All Pro Features Included</span>
                </li>
              </ul>
            </div>

            <Link
              href="/dashboard/pricing"
              onClick={() => onOpenChange(false)}
              className="mt-4 block"
            >
              <Button
                size="sm"
                className="w-full text-xs font-bold h-8 bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Upgrade to AI Architect</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center pt-2 border-t border-zinc-800/80">
          <Link
            href="/dashboard/pricing"
            onClick={() => onOpenChange(false)}
            className="text-[11px] text-[#ffee72] hover:underline font-mono"
          >
            View Full Feature Comparison Table &rarr;
          </Link>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
