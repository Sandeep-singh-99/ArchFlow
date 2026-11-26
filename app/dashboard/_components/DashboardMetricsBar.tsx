"use client";

import { Database, GitFork, Layers } from "lucide-react";
import type { DashboardProject } from "@/app/dashboard/_components/MyAgents";

export default function DashboardMetricsBar({ agents }: { agents: DashboardProject[] }) {
  let totalTables = 0;
  let totalRelations = 0;

  for (const agent of agents) {
    totalTables += agent.tableCount ?? 0;
    totalRelations += agent.relationCount ?? 0;
  }

  const metrics = [
    { label: "Schemas", value: agents.length, icon: Database, color: "bg-[#ffe47a]/10 text-[#ffe47a]" },
    { label: "Tables & collections", value: totalTables, icon: Layers, color: "bg-violet-300/10 text-violet-200" },
    { label: "Relationships", value: totalRelations, icon: GitFork, color: "bg-emerald-300/10 text-emerald-200" },
  ];

  return (
    <dl aria-label="Workspace totals" className="grid divide-y divide-border rounded-2xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {metrics.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="flex min-w-0 items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
          {/* Subtle accent on each metric icon */}
          <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${color}`}>
            <Icon aria-hidden className="size-4" />
          </span>
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
            <dd className="text-xl font-semibold tracking-tight tabular-nums">{value.toLocaleString("en-US")}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
