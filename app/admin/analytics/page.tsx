"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  BarChart3,
  Database,
  Boxes,
  Network,
  Workflow,
  Sparkles,
  GitFork,
  Layers,
  Cpu,
  FileCode,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAnalyticsPage() {
  const analytics = useQuery(api.admin.GetPlatformAnalytics, {});

  if (!analytics) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-xl" />
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

  const {
    totalUsers,
    totalSchemas,
    sqlSchemas,
    nosqlSchemas,
    totalNodes,
    totalEdges,
    totalSqlTables,
    totalNoSqlCollections,
    avgNodesPerSchema,
    avgEdgesPerSchema,
    totalFeedbacks,
  } = analytics;

  const sqlPct = totalSchemas > 0 ? Math.round((sqlSchemas / totalSchemas) * 100) : 0;
  const nosqlPct = totalSchemas > 0 ? Math.round((nosqlSchemas / totalSchemas) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span>Platform & Architecture Analytics</span>
        </h1>
        <p className="text-xs text-muted-foreground">
          Deep-dive telemetry into data models, node complexity, database engine preferences, and canvas density.
        </p>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Nodes Placed */}
        <Card className="border-border bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Schema Nodes
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono">{totalNodes}</div>
            <p className="text-[11px] text-muted-foreground">
              Avg. <span className="font-semibold text-foreground">{avgNodesPerSchema}</span> nodes / architecture
            </p>
          </CardContent>
        </Card>

        {/* Foreign Key Edges */}
        <Card className="border-border bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Relational Edges
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Network className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono">{totalEdges}</div>
            <p className="text-[11px] text-muted-foreground">
              Avg. <span className="font-semibold text-foreground">{avgEdgesPerSchema}</span> relationships / architecture
            </p>
          </CardContent>
        </Card>

        {/* SQL Tables */}
        <Card className="border-border bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              SQL Relational Tables
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-[#ffc507]/10 text-[#ffdf27] flex items-center justify-center">
              <Database className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono">{totalSqlTables}</div>
            <p className="text-[11px] text-muted-foreground">
              Across <span className="font-semibold text-foreground">{sqlSchemas}</span> relational projects
            </p>
          </CardContent>
        </Card>

        {/* NoSQL Collections */}
        <Card className="border-border bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              NoSQL Collections
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Boxes className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono">{totalNoSqlCollections}</div>
            <p className="text-[11px] text-muted-foreground">
              Across <span className="font-semibold text-foreground">{nosqlSchemas}</span> document projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Engine & Dialect Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engine Adoption Share */}
        <Card className="border-border bg-card/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Workflow className="h-4 w-4 text-primary" />
              <span>Engine Paradigm Split</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Ratio of Relational (SQL) vs Document-based (NoSQL) project creations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Database className="h-3.5 w-3.5 text-[#ffdf27]" />
                  <span>PostgreSQL & MySQL Relational</span>
                </span>
                <span className="font-mono">{sqlPct}% ({sqlSchemas} projects)</span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-[#ffdf27] rounded-full transition-all"
                  style={{ width: `${sqlPct}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Boxes className="h-3.5 w-3.5 text-emerald-400" />
                  <span>MongoDB Document Collections</span>
                </span>
                <span className="font-mono">{nosqlPct}% ({nosqlSchemas} projects)</span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all"
                  style={{ width: `${nosqlPct}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground">Architect Insight:</span>
              <p>
                {sqlPct >= 50
                  ? "SQL remains the dominant schema architecture, driven by PostgreSQL 16+ DDL generation and foreign-key cascade simulations."
                  : "NoSQL document collections are experiencing higher adoption as teams model flexible JSON schemas."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature Capabilities Breakdown */}
        <Card className="border-border bg-card/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileCode className="h-4 w-4 text-primary" />
              <span>Exporter & Generator Capabilities</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Platform subsystems active in ArchFlow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-[10px]">
                  Mermaid
                </Badge>
                <span>Mermaid ER & Flowchart Engine</span>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[10px]">
                  SQL DDL
                </Badge>
                <span>PostgreSQL & MySQL DDL Exporters</span>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px]">
                  NoSQL
                </Badge>
                <span>MongoDB Schema Validators & Indexes</span>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-pink-500/30 text-pink-400 bg-pink-500/10 text-[10px]">
                  Feedback
                </Badge>
                <span>Customer Sentiment & Review Engine</span>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                {totalFeedbacks} Reviews
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
