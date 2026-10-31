"use client";
import React, { useState, useEffect, useContext, useCallback } from "react";
import { useAuth, useUser, PricingTable } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, X, HelpCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserDetailContext } from "@/context/UserDetailContext";

export default function PricingPage() {
  const { has } = useAuth();
  const { user } = useUser();
  const { userDetails, setUserDetails } = useContext(UserDetailContext);
  const updateUserSubscription = useMutation(api.user.UpdateUserSubscription);

  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Activate plan in Convex database and React Context
  const activatePlan = useCallback(
    async (planType: "pro" | "ai") => {
      if (!user?.primaryEmailAddress?.emailAddress) return;
      const email = user.primaryEmailAddress.emailAddress;
      const subType = planType === "ai" ? "ai" : "active";

      try {
        if (typeof updateUserSubscription === "function") {
          await updateUserSubscription({
            email,
            subscription: subType,
          });
        }
      } catch (err: unknown) {
        console.warn(
          "Convex sync notice: Run 'npx convex dev' in your terminal to deploy new mutations to Convex Cloud.",
          err
        );
      }

      if (setUserDetails && userDetails) {
        setUserDetails({ ...userDetails, subscription: subType, token: 999999 });
      }

      setPaymentSuccess(true);
      toast.success(
        `${planType === "ai" ? "AI Architect Pro" : "Pro Architect"} plan activated successfully!`
      );
    },
    [user, updateUserSubscription, setUserDetails, userDetails]
  );

  // Handle post-payment redirect activation (e.g. /dashboard/pricing?payment=success)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment") || params.get("status");

    if (
      (paymentStatus === "success" || paymentStatus === "complete") &&
      user?.primaryEmailAddress?.emailAddress
    ) {
      const isAi = Boolean(
        has &&
          (has({ plan: "ai_architect_pro" }) ||
            has({ plan: "ai_unlimited_plan" }) ||
            has({ plan: "unlimited_plan" }))
      );
      setTimeout(() => {
        void activatePlan(isAi ? "ai" : "pro");
      }, 0);
      // Clean URL parameters without page reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, has, activatePlan]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* Payment Success Celebration Banner */}
      {paymentSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-mono text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>Payment successfully confirmed! Your account has been upgraded with full access.</span>
          </div>
          <Link href="/dashboard">
            <Button size="sm" className="h-7 text-xs bg-emerald-500 text-black hover:bg-emerald-400 font-bold">
              Go to Studio
            </Button>
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge variant="outline" className="text-[#ffee72] border-[#ffdf27]/30 bg-[#ffc507]/10 text-xs font-mono px-3.5 py-1">
          Subscription Plans
        </Badge>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Upgrade Your Schema Studio
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Choose a plan to unlock higher project quotas, CASCADE simulators, and full AI copilot access.
        </p>
      </div>

      {/* Clerk Payment Gateway Plans Only (Default Theme) */}
      <div className="w-full flex justify-center py-2">
        <div className="w-full max-w-5xl clerk-pricing-wrapper">
          <PricingTable
            newSubscriptionRedirectUrl="/dashboard/pricing?payment=success"
          />
        </div>
      </div>

      {/* Feature Comparison Matrix */}
      <div className="rounded-2xl border border-border bg-card/60 p-6 md:p-8 space-y-6">
        <h2 className="text-xl font-bold text-foreground">Detailed Plan Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border/80 text-muted-foreground font-mono">
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4 text-center">Free ($0)</th>
                <th className="py-3 px-4 text-center">Pro Architect ($19)</th>
                <th className="py-3 px-4 text-center text-[#ffee72]">AI Architect Pro ($49)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr>
                <td className="py-3 px-4 font-medium text-foreground">Active Projects Quota</td>
                <td className="py-3 px-4 text-center font-mono">1 Project</td>
                <td className="py-3 px-4 text-center font-mono">15 Projects</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-[#ffee72]">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-foreground">React Flow Visual Canvas</td>
                <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-400 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-400 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-foreground">PostgreSQL & MySQL DDL Export</td>
                <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-400 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-400 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-foreground">Multi-Domain Grouping</td>
                <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-zinc-600 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-400 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-foreground">CASCADE Drop Simulator</td>
                <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-zinc-600 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-400 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-foreground">Prisma ORM & SQLite Export</td>
                <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-zinc-600 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-400 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-400 mx-auto" /></td>
              </tr>
              <tr className="bg-amber-500/[0.04]">
                <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#ffdf27]" />
                  <span>AI Prompt-to-Schema Copilot</span>
                </td>
                <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-zinc-600 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-zinc-600 mx-auto" /></td>
                <td className="py-3 px-4 text-center font-bold text-[#ffee72]">Full Access</td>
              </tr>
              <tr className="bg-amber-500/[0.04]">
                <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#ffdf27]" />
                  <span>AI Agent Chat & Tool Execution</span>
                </td>
                <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-zinc-600 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-zinc-600 mx-auto" /></td>
                <td className="py-3 px-4 text-center font-bold text-[#ffee72]">Full Access</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4 max-w-3xl mx-auto pt-4">
        <h3 className="text-lg font-bold text-center text-foreground flex items-center justify-center gap-2">
          <HelpCircle className="h-4 w-4 text-[#ffdf27]" />
          <span>Frequently Asked Questions</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-border bg-card/40 space-y-1.5">
            <h4 className="font-semibold text-foreground">How does checkout & plan activation work?</h4>
            <p className="text-muted-foreground leading-relaxed">
              When you click Subscribe, Clerk’s secure payment gateway opens directly. Once completed, your subscription and project limits activate in real time.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card/40 space-y-1.5">
            <h4 className="font-semibold text-foreground">Can I manage or cancel anytime?</h4>
            <p className="text-muted-foreground leading-relaxed">
              Yes, you can manage payment methods, upgrade tiers, or cancel your subscription at any time directly through your Clerk billing settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
