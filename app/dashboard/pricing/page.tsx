"use client";

import React, { useState, useContext } from "react";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Check,
  Sparkles,
  X,
  HelpCircle,
  CheckCircle2,
  CreditCard,
  Calendar,
  Clock,
  ShieldCheck,
  Receipt,
  Loader2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserDetailContext } from "@/context/UserDetailContext";
import { getActiveSubscription } from "@/lib/subscription";
import { loadRazorpayScript, RazorpayCheckoutOptions } from "@/lib/razorpayClient";

type PaymentResponse = Parameters<RazorpayCheckoutOptions["handler"]>[0];

// Helper to format promotional sunset dates cleanly (e.g. "Nov 5, 2026")
function formatExpiryDate(dateStr: string): string {
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  } catch {
    return dateStr;
  }
}

// Helper to calculate urgency pill label (e.g. "Ends Today", "Ends Tomorrow", "3 days left")
function getExpiryUrgency(dateStr: string): { label: string; isUrgent: boolean } {
  try {
    const target = new Date(`${dateStr}T23:59:59`).getTime();
    const now = Date.now();
    const diffMs = target - now;
    if (diffMs <= 0) return { label: "Expired", isUrgent: false };
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return { label: "Ends Today", isUrgent: true };
    if (diffDays === 2) return { label: "Ends Tomorrow", isUrgent: true };
    if (diffDays <= 7) return { label: `${diffDays} days left`, isUrgent: true };
    return { label: `${diffDays} days left`, isUrgent: false };
  } catch {
    return { label: "Limited Time", isUrgent: false };
  }
}

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
  if (t.includes("share") && f.includes("share")) {
    return true;
  }
  if (t.includes("auto-connect") && (f.includes("auto-connect") || f.includes("copilot") || f.includes("cardinality"))) {
    return true;
  }
  return false;
}

export default function PricingPage() {
  const { user } = useUser();
  const { userDetails, setUserDetails } = useContext(UserDetailContext);

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<{ response: PaymentResponse; planName: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    planName: string;
    paymentId: string;
    validUntil?: number;
  } | null>(null);

  // Convex Queries & Mutations
  const activePlans = useQuery(api.plans.GetActivePlans, {});
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const userPayments = useQuery(
    api.payments.GetUserPayments,
    userEmail ? { email: userEmail } : "skip"
  );

  const savedUser = useQuery(api.user.GetUserByEmail, userEmail ? { email: userEmail } : "skip");
  const subscription = savedUser && paymentSuccessData &&
    savedUser.lastPaymentId !== paymentSuccessData.paymentId && userDetails?.lastPaymentId === paymentSuccessData.paymentId
    ? userDetails
    : savedUser ?? userDetails;
  const currentSub = getActiveSubscription(subscription);
  const hasPaidPlan = currentSub !== "free";
  const checkoutDisabled = hasPaidPlan || processingPlanId !== null || !!pendingPayment || !savedUser || !activePlans;

  const verifyPayment = async (response: PaymentResponse, planName: string) => {
    setIsVerifying(true);
    try {
      // 4. Verify payment signature on backend
      const verifyRes = await fetch("/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.verified) {
        toast.error(verifyData.error || "Payment verification failed!");
        return;
      }

      // 5. Update userDetails React context from server-verified subscription
      const activeSubscription = verifyData.subscription;
      if (setUserDetails && userDetails) {
        setUserDetails({
          ...userDetails,
          subscription: activeSubscription,
          lastPaymentId: response.razorpay_payment_id,
          subscriptionBillingCycle: verifyData.billingCycle,
          subscriptionExpiresAt: verifyData.validUntil,
          token: verifyData.token,
        });
      }

      setPendingPayment(null);
      setPaymentSuccessData({
        planName: planName,
        paymentId: response.razorpay_payment_id,
        validUntil: verifyData.validUntil,
      });

      toast.success(`${planName} is active.`);
    } catch (err: unknown) {
      console.error("Payment confirmation error:", err);
      toast.error("Could not confirm the payment. Check payment status to try again.");
    } finally {
      setIsVerifying(false);
      setProcessingPlanId(null);
    }
  };

  const handleSubscribe = async (plan: { planCode: string; name: string }, price: number) => {
    if (checkoutDisabled || selectedPlanCode !== plan.planCode) return;

    if (!user) {
      toast.error("Please sign in to subscribe to a plan");
      return;
    }

    try {
      setProcessingPlanId(plan.planCode);

      // 1. Ensure Razorpay client SDK is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay checkout SDK. Check internet connection.");
        setProcessingPlanId(null);
        return;
      }

      // 2. Call backend route to create Razorpay Order
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode: plan.planCode,
          billingCycle,
          amount: price,
        }),
      });

      const orderData = await res.json();

      if (!res.ok || !orderData.success) {
        if (orderData.isConfigurationError) {
          toast.error(
            "Razorpay API Keys missing. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables."
          );
        } else {
          toast.error(orderData.error || "Failed to initiate Razorpay order");
        }
        setProcessingPlanId(null);
        return;
      }

      // 3. Open Razorpay Checkout modal
      let paymentSubmitted = false;
      const options: RazorpayCheckoutOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ArchFlow Studio",
        description: `${plan.name} (${billingCycle.toUpperCase()} Billing)`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.user.name,
          email: orderData.user.email,
          contact: orderData.user.phone,
        },
        notes: {
          planName: plan.name,
          planCode: plan.planCode,
          billingCycle,
        },
        theme: {
          color: "#ffc507",
          backdrop_color: "rgba(0,0,0,0.85)",
        },
        handler: (response) => {
          paymentSubmitted = true;
          setPendingPayment({ response, planName: orderData.planName });
          void verifyPayment(response, orderData.planName);
        },
        modal: {
          ondismiss: () => {
            if (paymentSubmitted) return;
            setProcessingPlanId(null);
            toast.info("Payment cancelled");
          },
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.error("Razorpay instance not available");
        setProcessingPlanId(null);
      }
    } catch (err: unknown) {
      console.error("Checkout initiation error:", err);
      toast.error("An error occurred during checkout initiation");
      setProcessingPlanId(null);
    }
  };

  // Canonical features that appear in the Detailed Plan Comparison table
  const COMPARISON_FEATURES: { label: string; ai?: boolean }[] = [
    { label: "React Flow Visual Canvas" },
    { label: "Export SQL & NoSQL DDL" },
    { label: "Multi-Domain Grouping" },
    { label: "CASCADE Drop Simulator" },
    { label: "Import & Export Mermaid" },
    { label: "Share Architecture Preview" },
    { label: "AI Auto-Connect & Cardinality", ai: true },
  ];

  // Fallback plans if none seeded in database yet
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
            validityDays: 365,
            features: [
              "React Flow Visual Canvas",
              "Export SQL & NoSQL DDL",
            ],
            tokenQuota: 5000,
            projectQuota: 1,
            isActive: true,
            discountPercent: undefined as number | undefined,
            originalMonthlyPrice: undefined as number | undefined,
            originalYearlyPrice: undefined as number | undefined,
            expiryDate: undefined as string | undefined,
          },
          {
            _id: "default-pro",
            name: "Pro Architect",
            planCode: "pro",
            description: "For power architects managing multi-domain schemas and team collaboration.",
            monthlyPrice: 1499,
            yearlyPrice: 14999,
            currency: "INR",
            validityDays: 30,
            badge: "POPULAR",
            features: [
              "React Flow Visual Canvas",
              "Export SQL & NoSQL DDL",
              "Multi-Domain Grouping",
              "CASCADE Drop Simulator",
              "Import & Export Mermaid",
              "Share Architecture Preview",
            ],
            tokenQuota: 50000,
            projectQuota: 15,
            isActive: true,
            discountPercent: undefined as number | undefined,
            originalMonthlyPrice: undefined as number | undefined,
            originalYearlyPrice: undefined as number | undefined,
            expiryDate: undefined as string | undefined,
          },
          {
            _id: "default-ai",
            name: "AI Architect Pro",
            planCode: "ai",
            description: "Unlimited schema projects, multi-domain containers, and architecture sharing.",
            monthlyPrice: 3999,
            yearlyPrice: 39999,
            currency: "INR",
            validityDays: 30,
            badge: "ULTIMATE",
            features: [
              "React Flow Visual Canvas",
              "Export SQL & NoSQL DDL",
              "Multi-Domain Grouping",
              "CASCADE Drop Simulator",
              "Import & Export Mermaid",
              "Share Architecture Preview",
            ],
            tokenQuota: 999999,
            projectQuota: 9999,
            isActive: true,
            discountPercent: undefined as number | undefined,
            originalMonthlyPrice: undefined as number | undefined,
            originalYearlyPrice: undefined as number | undefined,
            expiryDate: undefined as string | undefined,
          },
        ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* Payment Success Celebration Banner */}
      {paymentSuccessData && (
        <div role="status" className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.15)] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-emerald-300">
                Payment Confirmed! {paymentSuccessData.planName} is now active.
              </p>
              <p className="text-[11px] text-emerald-400/80">
                Razorpay ID: {paymentSuccessData.paymentId}
                {paymentSuccessData.validUntil && (
                  <span>
                    {" "}
                    • Valid until: {new Date(paymentSuccessData.validUntil).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button
              size="sm"
              className="h-8 text-xs bg-emerald-400 text-black hover:bg-emerald-300 font-bold shrink-0"
            >
              Open Studio Canvas
            </Button>
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge
          variant="outline"
          className="text-[#ffee72] border-[#ffdf27]/30 bg-[#ffc507]/10 text-xs font-mono px-3.5 py-1"
        >
          Subscription Plans & Pricing
        </Badge>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Subscription plans
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {hasPaidPlan
            ? "Your paid plan is active. You can choose a different plan when it expires."
            : "Select a plan and billing period, then pay with Razorpay."}
        </p>

        {/* Monthly / Yearly Billing Toggle */}
        {!hasPaidPlan && (
        <div role="group" aria-label="Billing period" className="inline-flex items-center gap-3 p-1 rounded-full bg-card/80 border border-border mt-4 shadow-inner">
          <button
            type="button"
            aria-pressed={billingCycle === "monthly"}
            disabled={processingPlanId !== null || !!pendingPayment}
            onClick={() => setBillingCycle("monthly")}
            className={`min-h-11 px-4 rounded-full text-xs font-medium transition-all ${
              billingCycle === "monthly"
                ? "bg-amber-400 text-black font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            aria-pressed={billingCycle === "yearly"}
            disabled={processingPlanId !== null || !!pendingPayment}
            onClick={() => setBillingCycle("yearly")}
            className={`min-h-11 px-4 rounded-full text-xs font-medium transition-all ${
              billingCycle === "yearly"
                ? "bg-amber-400 text-black font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Yearly Billing
          </button>
        </div>
        )}
        <p role="status" className="text-sm text-muted-foreground">
          {isVerifying ? "Verifying your payment…" : processingPlanId ? "Razorpay checkout in progress…" : ""}
        </p>
      </div>

      {/* Razorpay Plans Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${displayPlans.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-8 max-w-6xl mx-auto items-stretch`}>
        {displayPlans.map((plan) => {
          const isCurrent = currentSub === plan.planCode;
          const isSelected = !hasPaidPlan && selectedPlanCode === plan.planCode;
          const shownCycle = hasPaidPlan
            ? subscription?.subscriptionBillingCycle ?? "monthly"
            : billingCycle;

          const isDiscountExpired = Boolean(
            plan.expiryDate && new Date(`${plan.expiryDate}T23:59:59`).getTime() < Date.now()
          );
          const hasActiveDiscount = Boolean(plan.discountPercent && plan.discountPercent > 0 && !isDiscountExpired);

          const price = shownCycle === "yearly"
            ? (hasActiveDiscount ? plan.yearlyPrice : (plan.originalYearlyPrice ?? plan.yearlyPrice))
            : (hasActiveDiscount ? plan.monthlyPrice : (plan.originalMonthlyPrice ?? plan.monthlyPrice));

          const originalPrice = shownCycle === "yearly" ? plan.originalYearlyPrice : plan.originalMonthlyPrice;
          const isProcessing = processingPlanId === plan.planCode;

          return (
            <Card
              key={String(plan._id || plan.planCode)}
              className={`flex flex-col border transition-all duration-300 rounded-2xl relative ${
                isCurrent
                  ? "border-emerald-500/70 bg-card"
                  : isSelected
                  ? "border-primary ring-1 ring-primary bg-card"
                  : plan.badge
                  ? "border-amber-400/50 bg-card/95 shadow-lg shadow-amber-500/5"
                  : "border-border bg-card/80 shadow-sm hover:border-border/80"
              }`}
            >
              {/* Highlight Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-400 text-black font-mono text-[10px] uppercase font-bold px-3 py-0.5 shadow-md">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="space-y-1.5 pb-6 border-b border-border/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  {isCurrent && (
                    <Badge
                      variant="outline"
                      className="text-xs font-mono text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                    >
                      Active Plan
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-6 pt-6">
                {/* Price Display */}
                <div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <div className="text-3xl font-extrabold font-mono text-foreground flex items-baseline gap-1">
                      ₹{price.toLocaleString()}
                      <span className="text-xs font-normal text-muted-foreground font-sans">
                        /{shownCycle === "yearly" ? "year" : "month"}
                      </span>
                    </div>
                    {hasActiveDiscount && plan.discountPercent && (
                      <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold px-2 py-0.5">
                        {plan.discountPercent}% OFF
                      </Badge>
                    )}
                  </div>
                  {hasActiveDiscount && originalPrice && (
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>Original: <span className="line-through">₹{originalPrice.toLocaleString()}</span></span>
                      {plan.expiryDate && (
                        <span className="text-amber-400/90 font-medium">
                          • Discount ends {plan.expiryDate}
                        </span>
                      )}
                    </div>
                  )}
                  {isDiscountExpired && plan.expiryDate && (
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      Promotional discount ended on {plan.expiryDate}
                    </p>
                  )}
                  {shownCycle === "yearly" && price > 0 && (
                    <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                      Equivalent to ₹{Math.round(price / 12).toLocaleString()}/month
                    </p>
                  )}
                </div>

                {/* Quotas & Validity */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-muted-foreground">
                  <div className="p-2 rounded-lg bg-muted/20 border border-border/40 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>
                      {billingCycle === "yearly" ? "365" : plan.validityDays || 30} Days
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/20 border border-border/40 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    <span className="font-semibold text-foreground">
                      {plan.projectQuota >= 999 || plan.projectQuota === 0 || plan.planCode === "ai"
                        ? "Unlimited Projects"
                        : plan.projectQuota === 1
                        ? "1 Project"
                        : `${plan.projectQuota} Projects`}
                    </span>
                  </div>
                </div>

                {/* Features List — Only displays included features */}
                <ul className="space-y-2.5 text-xs">
                  {COMPARISON_FEATURES.filter(({ label }) =>
                    plan.features.some((f) => matchFeature(f, label))
                  ).map(({ label, ai }) => (
                    <li key={label} className="flex items-start gap-2.5 text-foreground/90">
                      {ai ? (
                        <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      <span className={`leading-tight ${ai ? "font-medium text-[#ffee72]" : ""}`}>
                        {label}
                        {ai && (
                          <span className="ml-1.5 text-[10px] font-mono text-amber-400/80 not-italic">
                            (Full Access)
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="flex flex-col gap-2 pt-4 border-t border-border/40">
                <Button
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className="w-full min-h-11"
                  aria-pressed={plan.planCode === "free" || hasPaidPlan ? undefined : isSelected}
                  disabled={checkoutDisabled || plan.planCode === "free" || price <= 0}
                  onClick={() => setSelectedPlanCode(plan.planCode)}
                >
                  {isCurrent ? "Current plan" : hasPaidPlan ? "Unavailable while subscribed" : isSelected ? "Selected" : "Select plan"}
                </Button>
                {isSelected && (
                  <Button
                    type="button"
                    className="w-full min-h-11"
                    disabled={pendingPayment ? isVerifying : checkoutDisabled || price <= 0}
                    onClick={() => pendingPayment
                      ? verifyPayment(pendingPayment.response, pendingPayment.planName)
                      : handleSubscribe(plan, price)}
                  >
                    {(isProcessing || isVerifying) ? (
                      <Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" />
                    ) : (
                      <CreditCard aria-hidden="true" className="h-4 w-4" />
                    )}
                    {isVerifying ? "Verifying payment…" : isProcessing ? "Checkout in progress…" : pendingPayment ? "Check payment status" : "Pay with Razorpay"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* User Razorpay Billing History */}
      {userPayments && userPayments.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/60 p-6 space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <Receipt className="h-5 w-5 text-amber-400" />
            <h2 className="text-base font-bold">Your Razorpay Payment History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground font-mono">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Billing Cycle</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Valid Until</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Razorpay Payment ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {userPayments.map((p) => (
                  <tr key={p._id}>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground">{p.planName}</td>
                    <td className="py-2.5 px-3 capitalize">{p.billingCycle}</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">
                      ₹{p.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {new Date(p.validUntil).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-muted-foreground">
                      {p.razorpayPaymentId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feature Comparison Matrix */}
      <div className="rounded-2xl border border-border bg-card/60 p-6 md:p-8 space-y-6">
        <h2 className="text-xl font-bold text-foreground">Detailed Plan Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border/80 text-muted-foreground font-mono">
                <th className="py-3 px-4">Feature</th>
                {displayPlans.map((plan) => {
                  const isTopTier =
                    plan.planCode === "ai" ||
                    (plan.badge && plan.badge.toUpperCase().includes("ULTIMATE")) ||
                    (plan.projectQuota >= 999);
                  return (
                    <th
                      key={String(plan._id || plan.planCode)}
                      className={`py-3 px-4 text-center ${isTopTier ? "text-[#ffee72]" : ""}`}
                    >
                      {plan.name}{" "}
                      <span className="font-normal opacity-80">
                        ({plan.monthlyPrice === 0 ? "Free" : `₹${plan.monthlyPrice.toLocaleString()}`})
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr>
                <td className="py-3 px-4 font-medium text-foreground">Active Projects Quota</td>
                {displayPlans.map((plan) => {
                  const isUnlimited =
                    (plan.projectQuota ?? 1) >= 999 ||
                    (plan.projectQuota ?? 1) === 0 ||
                    plan.planCode === "ai";
                  return (
                    <td
                      key={String(plan._id || plan.planCode)}
                      className={`py-3 px-4 text-center font-mono ${
                        isUnlimited ? "font-bold text-[#ffee72]" : ""
                      }`}
                    >
                      {isUnlimited
                        ? "Unlimited"
                        : plan.projectQuota === 1
                        ? "1 Project"
                        : `${plan.projectQuota} Projects`}
                    </td>
                  );
                })}
              </tr>
              {COMPARISON_FEATURES.map(({ label, ai }) => (
                <tr
                  key={label}
                  className={ai ? "bg-amber-500/[0.04]" : undefined}
                >
                  <td
                    className={`py-3 px-4 ${
                      ai
                        ? "font-bold text-white flex items-center gap-1.5"
                        : "font-medium text-foreground"
                    }`}
                  >
                    {ai && <Sparkles className="h-3.5 w-3.5 text-[#ffdf27]" />}
                    <span>{label}</span>
                  </td>
                  {displayPlans.map((plan) => {
                    const included = plan.features.some(
                      (f) => matchFeature(f, label)
                    );
                    return (
                      <td
                        key={String(plan._id || plan.planCode)}
                        className={`py-3 px-4 text-center ${
                          ai && included ? "font-bold text-[#ffee72]" : ""
                        }`}
                      >
                        {included ? (
                          ai ? (
                            "Full Access"
                          ) : (
                            <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                          )
                        ) : (
                          <X className="h-4 w-4 text-zinc-600 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
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
            <h4 className="font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              How does Razorpay checkout work?
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              When you click Pay with Razorpay, Razorpay&apos;s encrypted checkout modal opens directly supporting UPI, Credit/Debit Cards, NetBanking, and Wallets. Once verified, your subscription is activated immediately.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card/40 space-y-1.5">
            <h4 className="font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-sky-400" />
              What are the plan validity and renewal terms?
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Monthly plans last 30 days and yearly plans last 365 days. Each term is paid for once. You can review your transaction receipts in the billing history table above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
