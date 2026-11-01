"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Users,
  DollarSign,
  Workflow,
  MessageSquareHeart,
  TrendingUp,
  Shield,
  ArrowUpRight,
  Database,
  Boxes,
  Sparkles,
  CreditCard,
  Star,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOverviewPage() {
  const metrics = useQuery(api.admin.GetAdminOverviewMetrics, {});

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const { users, earnings, schemas, feedback, recentUsers, recentSchemas } = metrics;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-card via-card to-amber-500/10 border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">System Control Tower</h1>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] font-mono">
              Live Realtime
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Realtime monitoring of ArchFlow platform growth, schema engineering, subscriptions, and customer sentiment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="h-8 text-xs font-semibold gap-1.5">
            <Link href="/admin/users">
              <Users className="h-3.5 w-3.5" />
              <span>User Directory</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="h-8 text-xs font-semibold gap-1.5 shadow-xs">
            <Link href="/admin/feedback">
              <MessageSquareHeart className="h-3.5 w-3.5" />
              <span>Feedback Inbox ({feedback.newCount})</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Users */}
        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Registered Users
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-bold">{users.total}</div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{users.paidCount} paying ({users.conversionRate}% conv.)</span>
              <span className="font-mono text-amber-400 font-semibold">{users.adminCount} admin</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Monthly Recurring Revenue */}
        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Estimated MRR
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              ${earnings.mrr.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>ARR: ${earnings.arr.toLocaleString()}</span>
              <span className="text-emerald-400 font-medium">Pro & AI Plans</span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Total Architectures */}
        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Engineered Schemas
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-[#ffc507]/10 text-[#ffdf27] flex items-center justify-center">
              <Workflow className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-bold">{schemas.total}</div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{schemas.sql} SQL Relational</span>
              <span>{schemas.nosql} NoSQL Document</span>
            </div>
          </CardContent>
        </Card>

        {/* 4. Customer Satisfaction */}
        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Customer Sentiment
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center">
              <MessageSquareHeart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{feedback.avgRating}</span>
              <div className="flex items-center text-amber-400">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{feedback.total} total reviews</span>
              <Badge variant="outline" className="text-[10px] text-rose-400 border-rose-500/30">
                {feedback.newCount} new
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution & Ratios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engine Breakdown */}
        <Card className="border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <span>Database Engine Split</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Relational schemas vs NoSQL collections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-[#ffdf27]" />
                  <span>SQL Relational</span>
                </span>
                <span className="font-mono font-semibold">
                  {schemas.total > 0 ? Math.round((schemas.sql / schemas.total) * 100) : 0}% ({schemas.sql})
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-[#ffdf27] rounded-full"
                  style={{ width: `${schemas.total > 0 ? (schemas.sql / schemas.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <Boxes className="h-3.5 w-3.5 text-emerald-400" />
                  <span>NoSQL Document</span>
                </span>
                <span className="font-mono font-semibold">
                  {schemas.total > 0 ? Math.round((schemas.nosql / schemas.total) * 100) : 0}% ({schemas.nosql})
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${schemas.total > 0 ? (schemas.nosql / schemas.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plan Mix */}
        <Card className="border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-400" />
              <span>Subscription Plan Mix</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of free vs paid user tiers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40">
              <span className="text-muted-foreground">AI Architect ($49/mo)</span>
              <span className="font-mono font-bold text-primary">{users.aiCount} users</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40">
              <span className="text-muted-foreground">Pro Architect ($19/mo)</span>
              <span className="font-mono font-bold text-emerald-400">{users.proCount} users</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40">
              <span className="text-muted-foreground">Free Starter Tier</span>
              <span className="font-mono font-bold text-muted-foreground">{users.freeCount} users</span>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Summary */}
        <Card className="border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquareHeart className="h-4 w-4 text-pink-400" />
              <span>Feedback Pipeline</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Status of reported issues & suggestions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <span className="text-rose-400 font-medium">New / Unaddressed</span>
              <Badge className="bg-rose-500 text-white font-mono">{feedback.newCount}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-400 font-medium">In Review</span>
              <Badge className="bg-amber-500 text-white font-mono">{feedback.inReviewCount}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 font-medium">Resolved</span>
              <Badge className="bg-emerald-500 text-white font-mono">{feedback.resolvedCount}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users & Recent Schemas Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card className="border-border bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">Recent User Signups</CardTitle>
              <CardDescription className="text-xs">Latest registered developers</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href="/admin/users" className="gap-1">
                <span>View all</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {recentUsers.map((u) => (
                <div key={String(u.id)} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {u.imageUrl ? (
                      <img src={u.imageUrl} alt={u.name} className="h-7 w-7 rounded-full border border-border" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        {u.name.charAt(0) || "U"}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">{u.name}</span>
                      <span className="text-[11px] text-muted-foreground">{u.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono ${
                        u.role === "admin"
                          ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {u.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Schemas */}
        <Card className="border-border bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">Recent Schemas</CardTitle>
              <CardDescription className="text-xs">Latest database models created</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href="/admin/analytics" className="gap-1">
                <span>Analytics</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {recentSchemas.map((s) => (
                <div key={String(s.id)} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-primary">
                      {s.schemaType === "nosql" ? (
                        <Boxes className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Database className="h-3.5 w-3.5 text-[#ffdf27]" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">{s.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {s.tableCount} {s.schemaType === "nosql" ? "collections" : "tables"}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono ${
                      s.schemaType === "nosql"
                        ? "border-emerald-500/30 text-emerald-400"
                        : "border-[#ffdf27]/30 text-[#ffee72]"
                    }`}
                  >
                    {s.schemaType === "nosql" ? "NoSQL" : "SQL"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
