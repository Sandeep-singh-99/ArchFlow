"use client";

import React from "react";
import { toast } from "sonner";
import { Lock, Sparkles, X } from "lucide-react";
import { FeatureKey, getFeatureMeta, PlanCode } from "@/lib/planAccess";

interface LockedFeatureToastProps {
  id: string | number;
  featureKey: FeatureKey;
  currentPlan?: PlanCode;
}

export function LockedFeatureToast({
  id,
  featureKey,
}: LockedFeatureToastProps) {
  const meta = getFeatureMeta(featureKey);
  const isAi = meta.requiredPlan === "ai";

  return (
    <div className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-[#0c0d12]/95 backdrop-blur-xl border border-zinc-800 shadow-2xl text-zinc-100 text-xs font-sans pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-2 duration-150">
      {/* Icon */}
      {isAi ? (
        <Sparkles className="size-3.5 text-[#ffdf27] shrink-0" />
      ) : (
        <Lock className="size-3.5 text-amber-400 shrink-0" />
      )}

      {/* Feature Name */}
      <span className="font-semibold text-white whitespace-nowrap">
        {meta.shortName}
      </span>

      <span className="text-zinc-600 text-[10px] select-none">•</span>

      {/* Tier Tag */}
      <span
        className={`text-[10px] font-mono font-bold tracking-wider uppercase whitespace-nowrap ${
          isAi ? "text-[#ffee72]" : "text-amber-400"
        }`}
      >
        {isAi ? "AI Tier" : "Pro Tier"}
      </span>

      {/* Inline Minimal CTA */}
      <a
        href="/dashboard/pricing"
        onClick={() => toast.dismiss(id)}
        className="ml-1 px-3 py-1 rounded-full bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 font-bold text-[11px] transition-all cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
      >
        Upgrade
      </a>

      {/* Quick Dismiss */}
      <button
        type="button"
        onClick={() => toast.dismiss(id)}
        className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors rounded-full shrink-0 cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
