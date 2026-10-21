"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  ShoppingCart,
  Video,
  ShieldAlert,
  Workflow,
  Sparkles,
} from "lucide-react";

type Template = {
  id: string;
  title: string;
  category: string;
  icon: any;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  qps: string;
  sla: string;
  description: string;
  nodes: string[];
  tradeoffs: string;
};

const templates: Template[] = [
  {
    id: "ride-hailing",
    title: "Real-Time Ride Hailing & Dispatch (Uber Style)",
    category: "Geospatial & Low Latency",
    icon: Car,
    colorClass: "text-teal-600 dark:text-teal-400",
    bgClass: "bg-teal-500/10",
    borderClass: "border-teal-500/30",
    qps: "150,000 updates/sec",
    sla: "99.999% Availability",
    description:
      "Processes million concurrent driver GPS pings using H3/QuadTree geospatial indexing, WebSocket gateways, and distributed trip matchmakers.",
    nodes: ["WebSocket Ingress", "H3 Spatial Shard", "Redis Cluster", "Kafka Streams", "Trip Matcher Worker", "Cassandra DB"],
    tradeoffs: "Eventual consistency on driver locations vs instant dispatch matching.",
  },
  {
    id: "ecommerce-flash-sale",
    title: "High-Concurrency Flash Sale (Amazon Style)",
    category: "E-Commerce & High Volume",
    icon: ShoppingCart,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    qps: "300,000 req/sec peak",
    sla: "Zero Overselling Guarantee",
    description:
      "Prevents inventory overselling using Redis distributed locks, rate-limiting queues, asynchronous saga payment orchestration, and CQRS.",
    nodes: ["Envoy WAF / Shield", "Token Bucket Limiter", "Redis Redlock", "Kafka Order Pipeline", "PostgreSQL Shards", "Saga Coordinator"],
    tradeoffs: "Strong consistency on inventory deduction via atomic Redis Lua scripts.",
  },
  {
    id: "video-streaming",
    title: "Global Video On-Demand & Live Streaming",
    category: "Media & Edge Distribution",
    icon: Video,
    colorClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/10",
    borderClass: "border-violet-500/30",
    qps: "500 Gbps egress",
    sla: "<1.5s First Frame Playback",
    description:
      "Multi-region video ingest with GPU transcoding workers, adaptive HLS/DASH chunking, multi-tier CDN edge caching, and user playback sync.",
    nodes: ["Multi-CDN Edge", "Transcoding Fleet", "Amazon S3 Storage", "Metadata Cache", "ScyllaDB Watch History", "Kafka Telemetry"],
    tradeoffs: "High bandwidth storage costs balanced with dynamic 2-tier CDN caching.",
  },
  {
    id: "rate-limiter",
    title: "Distributed Rate Limiter & DDoS Firewall",
    category: "Infrastructure & Security",
    icon: ShieldAlert,
    colorClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-500/10",
    borderClass: "border-rose-500/30",
    qps: "1,000,000 req/sec",
    sla: "< 1ms Evaluation Latency",
    description:
      "Enforces sliding window and token bucket rate limits across hundreds of microservices using centralized memory clusters and localized edge memory.",
    nodes: ["eBPF / Envoy Filter", "Local Memory L1", "Redis Cluster L2", "Metrics Exporter", "Sliding Log Engine", "Alert Webhook"],
    tradeoffs: "Local edge cache provides sub-millisecond evaluation with near-perfect accuracy.",
  },
];

export default function ArchitectureTemplates() {
  const [activeTab, setActiveTab] = useState(templates[0].id);
  const current = templates.find((t) => t.id === activeTab) || templates[0];

  return (
    <section id="templates" className="py-24 border-t border-white/10 bg-black">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono">
            Production Templates
          </Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Explore System Architectures
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Jumpstart your design interview prep or system RFCs with industry standard templates.
            Every template includes components, data flow lines, trade-off notes, and QPS estimations.
          </p>
        </div>

        {/* Template Selector Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto mb-8">
          {templates.map((t) => {
            const Icon = t.icon;
            const isSelected = t.id === activeTab;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`p-4 rounded-lg border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-emerald-500 bg-[#0c0d10] shadow-sm ring-1 ring-emerald-500/30"
                    : "border-white/10 bg-[#0c0d10]/60 hover:bg-[#0c0d10] hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`h-8 w-8 rounded flex items-center justify-center border ${t.bgClass} ${t.borderClass} ${t.colorClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">{t.category}</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold line-clamp-2 text-foreground">{t.title}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Template Detail Card */}
        <div className="max-w-5xl mx-auto rounded-xl border border-white/10 p-6 sm:p-8 bg-[#0c0d10] shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-mono">
                  {current.category}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">Target SLA: {current.sla}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">{current.title}</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-muted-foreground font-mono">Throughput</div>
                <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{current.qps}</div>
              </div>
              <Link href="/dashboard">
                <Button size="sm" className="gap-1.5 font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 hover:shadow-md hover:shadow-[#ffc507]/20 border-none transition-all">
                  <Workflow className="h-4 w-4 text-zinc-950" />
                  <span>Open in Canvas</span>
                </Button>
              </Link>
            </div>
          </div>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {current.description}
          </p>

          {/* Core Topology Components */}
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Core Topology Components
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {current.nodes.map((node, idx) => (
                <React.Fragment key={node}>
                  <div className="px-3.5 py-2 rounded-md bg-[#14151a] border border-white/10 text-xs font-medium font-mono text-foreground flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    <span>{node}</span>
                  </div>
                  {idx < current.nodes.length - 1 && (
                    <span className="text-muted-foreground text-xs font-bold">➔</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Trade-off summary */}
          <div className="p-4 rounded-lg bg-[#14151a]/60 border border-white/10 flex items-start gap-3">
            <div className="h-6 w-6 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/20">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">Trade-off & Architecture Analysis</div>
              <div className="text-xs text-muted-foreground mt-0.5">{current.tradeoffs}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
