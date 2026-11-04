"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Receipt,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminEarningsPage() {
  const metrics = useQuery(api.admin.GetAdminOverviewMetrics, {});
  const users = useQuery(api.admin.GetAllUsers, {});
  const payments = useQuery(api.payments.GetAllPayments, {});

  if (!metrics || !users) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const { users: userStats, earnings } = metrics;
  const payingUsers = users.filter(
    (u) => u.subscription === "pro" || u.subscription === "active" || u.subscription === "ai"
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <span>Earnings & Subscription Revenue</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Financial metrics, Monthly Recurring Revenue (MRR), subscription tier conversions, and active subscribers.
          </p>
        </div>
        <Link href="/admin/plans">
          <Button size="sm" variant="outline" className="text-xs font-semibold border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
            <Layers className="h-3.5 w-3.5 mr-1.5" />
            Manage Plans & Tiers
          </Button>
        </Link>
      </div>

      {/* Top 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimated MRR */}
        <Card className="border-border bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Estimated MRR
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              ${earnings.mrr.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Monthly Recurring Revenue
            </p>
          </CardContent>
        </Card>

        {/* Estimated ARR */}
        <Card className="border-border bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Annualized Run Rate (ARR)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono text-foreground">
              ${earnings.arr.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Annual projected gross
            </p>
          </CardContent>
        </Card>

        {/* Paying Customers */}
        <Card className="border-border bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Paying Subscribers
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono text-foreground">
              {userStats.paidCount}
            </div>
            <p className="text-[11px] text-muted-foreground">
              <span className="text-emerald-400 font-semibold">{userStats.conversionRate}%</span> conversion rate
            </p>
          </CardContent>
        </Card>

        {/* ARPU */}
        <Card className="border-border bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Avg Revenue Per User (ARPU)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono text-amber-400">
              ${userStats.paidCount > 0 ? (earnings.mrr / userStats.paidCount).toFixed(2) : "0.00"}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Per active paying customer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pro Plan Card */}
        <Card className="border-border bg-card/60 border-l-4 border-l-emerald-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-mono text-[10px]">
                $19 / Month
              </Badge>
              <span className="text-xs font-mono font-bold text-emerald-400">${earnings.proRevenue}/mo</span>
            </div>
            <CardTitle className="text-sm font-semibold pt-1">Pro Architect Plan</CardTitle>
            <CardDescription className="text-xs">Unlimited SQL/NoSQL schemas & DDL migrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Subscribers</span>
              <span className="font-mono font-bold">{userStats.proCount} users</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Annual Gross</span>
              <span className="font-mono font-bold">${(earnings.proRevenue * 12).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* AI Unlimited Plan Card */}
        <Card className="border-border bg-card/60 border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 font-mono text-[10px]">
                $49 / Month
              </Badge>
              <span className="text-xs font-mono font-bold text-primary">${earnings.aiRevenue}/mo</span>
            </div>
            <CardTitle className="text-sm font-semibold pt-1">AI Architect Unlimited</CardTitle>
            <CardDescription className="text-xs">Unlimited Gemini AI canvas generation & tokens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Subscribers</span>
              <span className="font-mono font-bold">{userStats.aiCount} users</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Annual Gross</span>
              <span className="font-mono font-bold">${(earnings.aiRevenue * 12).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Free Tier Card */}
        <Card className="border-border bg-card/60 border-l-4 border-l-muted-foreground/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-muted-foreground font-mono text-[10px]">
                $0 / Free
              </Badge>
              <span className="text-xs font-mono font-bold text-muted-foreground">$0/mo</span>
            </div>
            <CardTitle className="text-sm font-semibold pt-1">Free Starter Tier</CardTitle>
            <CardDescription className="text-xs">3 free architecture creations & 5,000 tokens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Free Users</span>
              <span className="font-mono font-bold">{userStats.freeCount} users</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Conversion Potential</span>
              <span className="font-mono text-emerald-400 font-semibold">{userStats.freeCount} leads</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Paid Subscribers Table */}
      <Card className="border-border bg-card/60">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Active Paying Subscribers ({payingUsers.length})</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Customers with active Pro Architect or AI Unlimited subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payingUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No active paying subscribers yet. Users can upgrade via the Pricing page.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {payingUsers.map((u) => (
                <div key={String(u._id)} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {u.imageUrl ? (
                      <img src={u.imageUrl} alt={u.name} className="h-8 w-8 rounded-full border border-border" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                        {u.name.charAt(0) || "U"}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{u.name}</span>
                      <span className="text-[11px] text-muted-foreground">{u.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`font-mono text-[10px] ${
                        u.subscription === "ai"
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {u.subscription === "ai" ? "AI Unlimited ($49)" : "Pro ($19)"}
                    </Badge>
                    <span className="font-mono text-[11px] text-muted-foreground hidden sm:inline">
                      {u.schemaCount} architectures
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Razorpay Transaction History */}
      <Card className="border-border bg-card/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-amber-400" />
              <span>Razorpay Payment Transactions ({payments?.length || 0})</span>
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono text-sky-400 border-sky-500/30">
              Gateway: Razorpay
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Live log of verified subscriber transactions, order IDs, and payment references
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No Razorpay transactions recorded yet. They will automatically appear here when customers complete checkout.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground font-mono">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Plan</th>
                    <th className="py-2.5 px-3">Cycle</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Razorpay Payment ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {payments.map((p) => (
                    <tr key={String(p._id)}>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-foreground font-sans font-medium">{p.userEmail}</td>
                      <td className="py-2.5 px-3 font-medium text-foreground">{p.planName}</td>
                      <td className="py-2.5 px-3 capitalize">{p.billingCycle}</td>
                      <td className="py-2.5 px-3 text-amber-400 font-bold">
                        ₹{p.amount.toLocaleString()}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
