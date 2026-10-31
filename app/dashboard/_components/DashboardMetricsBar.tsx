"use client";

import React, { useMemo } from "react";
import { Agent } from "@/types/AgentTypes";
import {
  Database,
  Layers,
  GitFork,
  Cpu,
} from "lucide-react";

interface DashboardMetricsBarProps {
  agents: Agent[];
  isPaidUser: boolean;
  hasAiPlan: boolean;
  projectCount: number;
}

export default function DashboardMetricsBar({
  agents,
  isPaidUser,
  hasAiPlan,
  projectCount,
}: DashboardMetricsBarProps) {
  const metrics = useMemo(() => {
    let totalTables = 0;
    let totalRelations = 0;
    let totalViews = 0;

    agents.forEach((agent) => {
      const nodes = Array.isArray(agent.nodes) ? agent.nodes : [];
      const edges = Array.isArray(agent.edges) ? agent.edges : [];

      totalRelations += edges.length;

      nodes.forEach((node: Record<string, unknown>) => {
        const type = (node?.type as string) || "";
        if (
          type === "SqlTableNode" ||
          type === "NosqlCollectionNode" ||
          type === "Table" ||
          type === "Collection"
        ) {
          totalTables += 1;
        } else if (type === "SqlViewNode" || type === "View") {
          totalViews += 1;
        }
      });
    });

    const maxSlots = hasAiPlan ? "Unlimited" : isPaidUser ? "15" : "1";

    return {
      totalSchemas: agents.length,
      maxSlots,
      totalTables,
      totalRelations,
      totalViews,
    };
  }, [agents, isPaidUser, hasAiPlan]);

  const cards = [
    {
      title: "Active Schemas",
      value: metrics.totalSchemas,
      caption: `Plan Quota: ${projectCount} / ${metrics.maxSlots}`,
      icon: Database,
      accentColor: "text-[#ffee72]",
      bgAccent: "bg-[#ffc507]/10",
      borderAccent: "border-[#ffdf27]/20",
    },
    {
      title: "Tables & Collections",
      value: metrics.totalTables,
      caption: `${metrics.totalViews} views & queries`,
      icon: Layers,
      accentColor: "text-emerald-400",
      bgAccent: "bg-emerald-500/10",
      borderAccent: "border-emerald-500/20",
    },
    {
      title: "Mapped Relations",
      value: metrics.totalRelations,
      caption: "Foreign keys & links",
      icon: GitFork,
      accentColor: "text-sky-400",
      bgAccent: "bg-sky-500/10",
      borderAccent: "border-sky-500/20",
    },
    {
      title: "Target Dialects",
      value: "Postgres & MySQL",
      caption: "Native SQL DDL export",
      icon: Cpu,
      accentColor: "text-purple-400",
      bgAccent: "bg-purple-500/10",
      borderAccent: "border-purple-500/20",
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-4 transition-all duration-200 hover:border-zinc-700 hover:shadow-md shadow-xs flex flex-col justify-between"
        >
          {/* Subtle top ambient glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {card.title}
            </span>
            <div
              className={`h-7 w-7 rounded-lg ${card.bgAccent} ${card.borderAccent} border flex items-center justify-center shrink-0`}
            >
              <card.icon className={`h-3.5 w-3.5 ${card.accentColor}`} />
            </div>
          </div>

          <div className="mt-3">
            <div
              className={`font-bold tracking-tight text-foreground ${
                card.isText ? "text-base font-mono" : "text-2xl"
              }`}
            >
              {card.value}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground/80">
              <span>{card.caption}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
