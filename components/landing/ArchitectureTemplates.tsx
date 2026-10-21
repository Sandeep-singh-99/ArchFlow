"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ShoppingCart, Video, ShieldCheck, Database, Server } from "lucide-react";

const templates = [
  {
    title: "Ride Hailing & Real-Time Dispatch",
    category: "Geospatial",
    badge: "150k updates/s",
    description:
      "Processes million concurrent driver GPS pings using H3/QuadTree geospatial indexing, WebSocket gateways, and low-latency ride matchmakers.",
    icon: Zap,
    colorClass: "text-teal-400",
    bgClass: "bg-teal-500/10 border-teal-500/20",
  },
  {
    title: "High-Concurrency Flash Sale",
    category: "E-Commerce",
    badge: "300k req/s",
    description:
      "Prevents inventory overselling using Redis distributed locks, rate-limiting queues, asynchronous saga payment orchestration, and CQRS.",
    icon: ShoppingCart,
    colorClass: "text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/20",
  },
  {
    title: "Global Video On-Demand & Live Streaming",
    category: "Media Delivery",
    badge: "500 Gbps egress",
    description:
      "Multi-region video ingest with GPU transcoding workers, adaptive HLS/DASH chunking, multi-tier CDN edge caching, and user playback sync.",
    icon: Video,
    colorClass: "text-violet-400",
    bgClass: "bg-violet-500/10 border-violet-500/20",
  },
  {
    title: "Distributed Rate Limiter & DDoS Firewall",
    category: "Infrastructure",
    badge: "1M req/s",
    description:
      "Enforces sliding window and token bucket rate limits across hundreds of microservices using centralized memory clusters and localized edge memory.",
    icon: ShieldCheck,
    colorClass: "text-rose-400",
    bgClass: "bg-rose-500/10 border-rose-500/20",
  },
  {
    title: "Multi-Region Distributed SQL Database",
    category: "Data Systems",
    badge: "99.999% SLA",
    description:
      "Globally consistent transactions across data centers using Raft consensus, Spanner TrueTime primitives, and automatic partition rebalancing.",
    icon: Database,
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    title: "Event-Driven Microservices Mesh",
    category: "Cloud Native",
    badge: "Sub-10ms P99",
    description:
      "Decoupled microservice architecture orchestrating high-throughput Kafka topics, dead-letter queues, gRPC inter-service RPCs, and OpenTelemetry.",
    icon: Server,
    colorClass: "text-blue-400",
    bgClass: "bg-blue-500/10 border-blue-500/20",
  },
];

export default function ArchitectureTemplates() {
  return (
    <section id="templates" className="container mx-auto py-24 px-4 md:px-8 border-t border-white/10 bg-black">
      <div className="text-center space-y-4 mb-16 max-w-3xl mx-auto">
        <Badge
          variant="outline"
          className="text-[#ffee72] border-[#ffdf27]/30 bg-[#ffc507]/10 px-3 py-1 text-xs font-mono"
        >
          Production Templates
        </Badge>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
          Explore System Architectures
        </h2>
        <p className="text-zinc-400 text-base md:text-lg">
          Jumpstart your design interview prep or system RFCs with battle-tested industry standard templates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template, index) => {
          const Icon = template.icon;
          return (
            <Card
              key={index}
              className="border border-white/10 bg-[#0c0d10] hover:border-white/25 transition-colors shadow-2xs group"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center border ${template.bgClass} ${template.colorClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">
                    {template.badge}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-white group-hover:text-[#ffee72] transition-colors">
                  {template.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-zinc-400 leading-relaxed">
                  {template.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
