"use client";

import { useState, useContext, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Check,
  Sparkles,
  ArrowDown,
  ArrowUpRight,
  ChevronDown,
  Database,
  Layers,
  Minus,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Receipt,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserDetailContext } from "@/context/UserDetailContext";
import { getActiveSubscription } from "@/lib/subscription";
import { loadRazorpayScript, RazorpayCheckoutOptions } from "@/lib/razorpayClient";

type PaymentResponse = Parameters<RazorpayCheckoutOptions["handler"]>[0];
type BillingCycle = "monthly" | "yearly";

const dateFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

function formatAmount(amount: number, currency: string) {
  try {
    return amount.toLocaleString("en-IN", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 });
  } catch {
    return `${amount.toLocaleString("en-IN")} ${currency}`;
  }
}

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
function getExpiryUrgency(dateStr: string, asOf: number): { label: string; isUrgent: boolean } {
  try {
    const target = new Date(dateStr + "T23:59:59");
    const now = new Date(asOf);
    if (Number.isNaN(target.getTime())) return { label: "Limited time", isUrgent: false };
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0) return { label: "Expired", isUrgent: false };
    const day = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = (day(target) - day(now)) / 86400000;
    if (diffDays === 0) return { label: "Ends today", isUrgent: true };
    if (diffDays === 1) return { label: "Ends tomorrow", isUrgent: true };
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
  if (!f) return false;
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

  const [asOf, setAsOf] = useState(Date.now);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<{ response: PaymentResponse; planName: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    planName: string;
    paymentId: string;
    validUntil?: number;
  } | null>(null);

  useEffect(() => {
    const refresh = () => setAsOf(Date.now());
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);

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
  const currentSub = getActiveSubscription(subscription, asOf);
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
              "AI Auto-Connect & Cardinality",
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

  const shownCycle = hasPaidPlan ? subscription?.subscriptionBillingCycle ?? "monthly" : billingCycle;
  const period = shownCycle === "yearly" ? "year" : "month";
  const currentPlan = displayPlans.find((plan) => plan.planCode === currentSub);
  const subscriptionReady = savedUser !== undefined;
  const plans = displayPlans.map((plan) => {
    const isDiscountExpired = Boolean(
      plan.expiryDate && new Date(plan.expiryDate + "T23:59:59").getTime() < asOf
    );
    const hasActiveDiscount = Boolean(plan.discountPercent && plan.discountPercent > 0 && !isDiscountExpired);
    const listedPrice = shownCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
    const originalPrice = shownCycle === "yearly" ? plan.originalYearlyPrice : plan.originalMonthlyPrice;
    const price = hasActiveDiscount ? listedPrice : originalPrice ?? listedPrice;
    const quota = plan.projectQuota >= 999 || plan.projectQuota === 0
      ? "Unlimited projects"
      : plan.projectQuota === 1 ? "1 project" : plan.projectQuota.toLocaleString("en-IN") + " projects";

    return { plan, price, originalPrice, quota, hasActiveDiscount, isDiscountExpired };
  });

  return (
    <main className="mx-auto w-full max-w-[90rem] space-y-8 px-4 pt-4 pb-12 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
      {/* Payment success banner */}
      {paymentSuccessData && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-4 sm:px-6">
          <div role="status" className="flex min-w-0 items-start gap-3">
            <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-emerald-300" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-200">{paymentSuccessData.planName} is now active.</p>
              <p className="mt-1 wrap-anywhere text-xs leading-relaxed text-emerald-100/75">
                Payment ID {paymentSuccessData.paymentId}
                {paymentSuccessData.validUntil && (" · Valid until " + dateFormat.format(paymentSuccessData.validUntil))}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="border-emerald-300/25 bg-transparent text-emerald-100 hover:bg-emerald-300/10">
            <Link href="/dashboard">Back to workspace <ArrowUpRight aria-hidden /></Link>
          </Button>
        </div>
      )}

      {/* Header */}
      <header className="relative isolate grid gap-6 overflow-hidden rounded-2xl border border-white/10 bg-[#121018] p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,19rem)] lg:items-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,#34274f,transparent_70%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 bg-[radial-gradient(#d8c1f343_1px,transparent_1px)] bg-size-[16px_16px] mask-[linear-gradient(90deg,transparent,black)] sm:block" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">Plans &amp; billing</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Compare plans for your database workspace and review your payment history.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="border-white/15 bg-white/5 hover:bg-white/10">
              <a href="#plan-comparison">Compare plans <ArrowDown aria-hidden /></a>
            </Button>
            <Button asChild variant="ghost" className="text-muted-foreground">
              <a href="#billing-history">Billing history</a>
            </Button>
          </div>
        </div>
        <section aria-labelledby="current-subscription" className="rounded-xl border border-white/10 bg-[#100e16]/90 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-300/10 text-violet-200">
              <CreditCard aria-hidden className="size-4" />
            </div>
            <div className="min-w-0">
              <h2 id="current-subscription" className="text-xs font-medium text-muted-foreground">Current plan</h2>
              <p className="mt-0.5 wrap-anywhere text-base font-semibold">
                {subscriptionReady ? currentPlan?.name ?? currentSub : "Loading subscription…"}
              </p>
            </div>
          </div>
          {subscriptionReady && (
            <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
              {hasPaidPlan
                ? subscription?.subscriptionExpiresAt
                  ? "Active until " + dateFormat.format(subscription.subscriptionExpiresAt) + ". You can switch plans after it expires."
                  : "Your paid plan is active."
                : "You’re on the free plan. Choose a paid plan below to upgrade."}
            </p>
          )}
        </section>
      </header>

      {/* Razorpay plans grid */}
      <section aria-labelledby="plan-options" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="plan-options" className="text-xl font-semibold tracking-tight sm:text-2xl">Plan options</h2>
            <p className="mt-1 text-sm text-muted-foreground">Paid plans are billed once per term.</p>
          </div>
          {/* Monthly / yearly billing toggle */}
          {!hasPaidPlan && (
            <div role="group" aria-label="Billing period" className="inline-flex gap-1 rounded-xl border border-border bg-card p-1">
              {(["monthly", "yearly"] as const).map((cycle) => (
                <Button
                  key={cycle}
                  type="button"
                  variant="ghost"
                  aria-pressed={billingCycle === cycle}
                  disabled={processingPlanId !== null || !!pendingPayment}
                  onClick={() => setBillingCycle(cycle)}
                  className={cn("h-9 cursor-pointer rounded-lg px-4 capitalize text-muted-foreground", billingCycle === cycle && "bg-violet-300/15 text-violet-100 hover:bg-violet-300/20")}
                >
                  {cycle}
                </Button>
              ))}
            </div>
          )}
        </div>

        {(processingPlanId || isVerifying) && (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 aria-hidden className="size-4 motion-safe:animate-spin" />
            {isVerifying ? "Verifying your payment…" : "Razorpay checkout in progress…"}
          </p>
        )}

        {activePlans === undefined ? (
          <div role="status" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <span className="sr-only">Loading plans</span>
            {[1, 2, 3].map((item) => <Skeleton aria-hidden key={item} className="h-96 rounded-2xl motion-reduce:animate-none" />)}
          </div>
        ) : (
          <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-3", plans.length >= 4 && "2xl:grid-cols-4")}>
            {plans.map(({ plan, price, originalPrice, quota, hasActiveDiscount, isDiscountExpired }) => {
              const isCurrent = subscriptionReady && currentSub === plan.planCode;
              const isSelected = !hasPaidPlan && selectedPlanCode === plan.planCode;
              const isProcessing = processingPlanId === plan.planCode;
              const Icon = plan.planCode === "ai" ? Sparkles : plan.planCode === "free" ? Database : Layers;
              const iconColor = plan.planCode === "ai" ? "bg-violet-300/10 text-violet-200" : plan.planCode === "free" ? "bg-white/8 text-zinc-200" : "bg-[#ffe47a]/10 text-[#ffe47a]";
              const promotion = plan.expiryDate && hasActiveDiscount ? getExpiryUrgency(plan.expiryDate, asOf) : null;
              const featureList = COMPARISON_FEATURES.filter(({ label }) => plan.features.some((feature) => matchFeature(feature, label)));

              return (
                <article
                  key={String(plan._id || plan.planCode)}
                  className={cn(
                    "flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card",
                    isCurrent && "border-emerald-300/35",
                    isSelected && "border-[#ffe47a]/65 ring-1 ring-[#ffe47a]/20"
                  )}
                >
                  <div className="relative isolate border-b border-border p-5 sm:p-6">
                    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br to-transparent", plan.planCode === "ai" ? "from-violet-400/12" : plan.planCode !== "free" && "from-[#ffe47a]/9")} />
                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", iconColor)}>
                        <Icon aria-hidden className="size-5" />
                      </div>
                      {/* Plan badge */}
                      {isCurrent ? (
                        <Badge variant="outline" className="border-emerald-300/20 bg-emerald-300/10 text-emerald-200">Current plan</Badge>
                      ) : plan.badge && (
                        <Badge variant="outline" className="max-w-full whitespace-normal border-white/10 bg-white/5 text-muted-foreground">{plan.badge}</Badge>
                      )}
                    </div>
                    <h3 className="mt-4 wrap-anywhere text-xl font-semibold tracking-tight">{plan.name}</h3>
                    <p className="mt-1 min-h-10 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>

                    {/* Price display */}
                    <div className="mt-4">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                          {price === 0 ? "Free" : formatAmount(price, plan.currency)}
                        </span>
                        {price > 0 && <span className="text-sm text-muted-foreground">/ {period}</span>}
                        {hasActiveDiscount && <Badge className="bg-[#ffe47a]/10 text-[#ffe47a]">{plan.discountPercent}% off</Badge>}
                      </div>
                      {hasActiveDiscount && originalPrice !== undefined && (
                        <p className="mt-1 text-xs text-muted-foreground">Originally <del>{formatAmount(originalPrice, plan.currency)}</del></p>
                      )}
                      {plan.expiryDate && (promotion || isDiscountExpired) && (
                        <p className={cn("mt-1 text-xs text-muted-foreground", promotion?.isUrgent && "text-[#ffe47a]")}>
                          {isDiscountExpired
                            ? "Offer ended " + formatExpiryDate(plan.expiryDate)
                            : promotion?.isUrgent ? promotion.label + " · " + formatExpiryDate(plan.expiryDate) : "Offer ends " + formatExpiryDate(plan.expiryDate)}
                        </p>
                      )}
                      {shownCycle === "yearly" && price > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">About {formatAmount(price / 12, plan.currency)} per month</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                    {/* Quotas and validity */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="font-semibold">{quota}</span>
                      {price > 0 && <span className="text-muted-foreground">{shownCycle === "yearly" ? "365" : "30"} days of access</span>}
                    </div>

                    {/* Features list displays included features */}
                    <ul className="space-y-2.5 text-sm text-muted-foreground">
                      {featureList.map(({ label, ai }) => (
                        <li key={label} className="flex items-start gap-2.5">
                          {ai ? <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0 text-violet-200" /> : <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-300" />}
                          <span className={ai ? "text-violet-100" : undefined}>{label}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto space-y-2 border-t border-border pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className={cn("min-h-11 w-full cursor-pointer whitespace-normal", isSelected && "border-[#ffe47a]/40 bg-[#ffe47a]/5 text-[#ffe47a]")}
                        aria-pressed={plan.planCode !== "free" && !hasPaidPlan ? isSelected : undefined}
                        aria-label={!isSelected && !checkoutDisabled && plan.planCode !== "free" && price > 0 ? "Select " + plan.name : undefined}
                        disabled={checkoutDisabled || plan.planCode === "free" || price <= 0}
                        onClick={() => setSelectedPlanCode(plan.planCode)}
                      >
                        {isCurrent ? "Current plan" : hasPaidPlan ? "Unavailable while subscribed" : isSelected ? "Selected" : plan.planCode === "free" ? "Free plan" : "Select plan"}
                      </Button>
                      {isSelected && (
                        <Button
                          type="button"
                          className="min-h-11 w-full cursor-pointer bg-[#ffe47a] whitespace-normal font-semibold text-zinc-950 hover:bg-[#ffed9d]"
                          disabled={pendingPayment ? isVerifying : checkoutDisabled || price <= 0}
                          onClick={() => pendingPayment
                            ? verifyPayment(pendingPayment.response, pendingPayment.planName)
                            : handleSubscribe(plan, price)}
                        >
                          {isProcessing || isVerifying ? <Loader2 aria-hidden className="motion-safe:animate-spin" /> : <CreditCard aria-hidden />}
                          {isVerifying ? "Verifying payment…" : isProcessing ? "Checkout in progress…" : pendingPayment ? "Check payment status" : "Pay with Razorpay"}
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Feature comparison matrix */}
      <section id="plan-comparison" aria-labelledby="comparison-heading" className="scroll-mt-20 rounded-2xl border border-border bg-card">
        <div className="px-5 py-5 sm:px-6">
          <h2 id="comparison-heading" className="text-xl font-semibold tracking-tight">Compare plans</h2>
          <p className="mt-1 text-sm text-muted-foreground">Project limits and tools included in each plan.</p>
        </div>
        {activePlans === undefined ? (
          <p className="border-t border-border px-5 py-4 text-sm text-muted-foreground sm:px-6">Loading comparison…</p>
        ) : (
          <div role="region" aria-label="Plan comparison table" tabIndex={0} className="overflow-x-auto rounded-b-2xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ffe47a]">
            <table className="w-full min-w-[39rem] border-separate border-spacing-0 text-sm">
              <thead className="text-left text-xs">
                <tr>
                  <th scope="col" className="sticky left-0 min-w-36 border-y border-border bg-[#14151a] px-4 py-3 font-medium text-muted-foreground sm:px-6">Feature</th>
                  {plans.map(({ plan, price }) => (
                    <th key={String(plan._id || plan.planCode)} scope="col" className="min-w-28 border-y border-l border-border bg-muted/80 px-4 py-3 text-center">
                      <span className="block font-semibold">{plan.name}</span>
                      <span className="mt-0.5 block font-normal tabular-nums text-muted-foreground">
                        {price === 0 ? "Free" : formatAmount(price, plan.currency) + " / " + period}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" className="sticky left-0 bg-card px-4 py-3 text-left font-medium sm:px-6">Project limit</th>
                  {plans.map(({ plan, quota }) => (
                    <td key={String(plan._id || plan.planCode)} className="border-l border-border px-4 py-3 text-center text-xs font-medium tabular-nums">{quota}</td>
                  ))}
                </tr>
                {COMPARISON_FEATURES.map(({ label, ai }) => (
                  <tr key={label}>
                    <th scope="row" className={cn("sticky left-0 border-t border-border bg-card px-4 py-3 text-left font-medium sm:px-6", ai && "text-violet-200")}>{label}</th>
                    {plans.map(({ plan }) => {
                      const included = plan.features.some((feature) => matchFeature(feature, label));
                      return (
                        <td key={String(plan._id || plan.planCode)} className="border-t border-l border-border px-4 py-3 text-center">
                          {included ? <Check aria-hidden className="mx-auto size-4 text-emerald-300" /> : <Minus aria-hidden className="mx-auto size-4 text-muted-foreground" />}
                          <span className="sr-only">{included ? "Included" : "Unavailable"}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* User Razorpay billing history */}
      <section id="billing-history" aria-labelledby="billing-history-heading" className="scroll-mt-20 rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 px-5 py-5 sm:px-6">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-300/10 text-violet-200">
            <Receipt aria-hidden className="size-4" />
          </span>
          <div>
            <h2 id="billing-history-heading" className="text-xl font-semibold tracking-tight">Billing history</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Your Razorpay transactions and payment IDs.</p>
          </div>
        </div>
        {userPayments?.length ? (
          <div role="region" aria-label="Payment history table" tabIndex={0} className="overflow-x-auto rounded-b-2xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ffe47a]">
            <table className="w-full min-w-[47rem] text-left text-sm">
              <thead className="border-y border-border bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="py-3 pr-3 pl-5 font-medium sm:pl-6">Date</th>
                  <th scope="col" className="px-3 py-3 font-medium">Plan</th>
                  <th scope="col" className="px-3 py-3 font-medium">Term</th>
                  <th scope="col" className="px-3 py-3 font-medium">Amount</th>
                  <th scope="col" className="px-3 py-3 font-medium">Valid until</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                  <th scope="col" className="py-3 pr-5 pl-3 font-medium sm:pr-6">Payment ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {userPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-muted/30">
                    <td className="py-3 pr-3 pl-5 whitespace-nowrap text-muted-foreground sm:pl-6">{dateFormat.format(payment.createdAt)}</td>
                    <td className="px-3 py-3 font-medium">{payment.planName}</td>
                    <td className="px-3 py-3 text-muted-foreground capitalize">{payment.billingCycle}</td>
                    <td className="px-3 py-3 font-medium whitespace-nowrap tabular-nums">{formatAmount(payment.amount, payment.currency)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{dateFormat.format(payment.validUntil)}</td>
                    <td className="px-3 py-3">
                      <Badge variant="outline" className={cn(
                        "capitalize",
                        payment.status === "success" && "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
                        payment.status === "failed" && "border-rose-300/25 bg-rose-300/10 text-rose-200",
                        payment.status === "pending" && "border-amber-300/25 bg-amber-300/10 text-amber-200",
                      )}>
                        {payment.status === "success" ? "Paid" : payment.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-5 pl-3 font-mono text-xs text-muted-foreground sm:pr-6">{payment.razorpayPaymentId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border-t border-border px-5 py-6 sm:px-6">
            <p className="text-sm font-medium">{userPayments === undefined ? "Loading payments…" : "No payments yet"}</p>
            {userPayments !== undefined && <p className="mt-1 text-sm text-muted-foreground">Your transactions will appear here after your first payment.</p>}
          </div>
        )}
      </section>

      {/* Frequently asked questions */}
      <section aria-labelledby="billing-faq" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-6">
        <div className="flex items-center gap-3 self-start py-1">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-[#ffe47a]">
            <ShieldCheck aria-hidden className="size-4" />
          </span>
          <h2 id="billing-faq" className="text-xl font-semibold tracking-tight">Billing questions</h2>
        </div>
        <div className="divide-y divide-border rounded-2xl border border-border bg-card px-5 sm:px-6">
          {[
            { question: "How do I pay for a plan?", answer: "Select a plan and choose Pay with Razorpay. Your subscription starts after the payment is verified." },
            { question: "How long does a plan last?", answer: "Monthly terms include 30 days of access, and yearly terms include 365 days. Each term is paid for once." },
            { question: "When can I switch plans?", answer: "You can choose another plan after your current paid term ends. Check the current plan panel for your expiry date." },
          ].map(({ question, answer }) => (
            <details key={question} className="group py-1">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-md text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe47a] [&::-webkit-details-marker]:hidden">
                {question} <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground group-open:rotate-180" />
              </summary>
              <p className="max-w-xl pb-4 text-sm leading-relaxed text-muted-foreground">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
