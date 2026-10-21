"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Activity,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  Workflow,
  CheckCircle2,
  Play,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type NodeData = {
  id: string;
  name: string;
  type: string;
  icon: any;
  colorClass: string;
  bgClass: string;
  qps: string;
  latency: string;
  protocol: string;
  status: "healthy" | "active" | "standby";
  description: string;
};

const interactiveNodes: Record<string, NodeData> = {
  client: {
    id: "client",
    name: "Web & Mobile Clients",
    type: "Client Layer",
    icon: Globe,
    colorClass: "text-teal-600 dark:text-teal-400",
    bgClass: "bg-teal-500/10 border-teal-500/20",
    qps: "120,000 req/s",
    latency: "35ms RTT",
    protocol: "HTTPS / HTTP/3",
    status: "active",
    description: "Global client distribution routed through GeoDNS to the closest POP.",
  },
  waf: {
    id: "waf",
    name: "Edge CDN & WAF",
    type: "Security Layer",
    icon: ShieldCheck,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    qps: "120,000 req/s",
    latency: "1.2ms",
    protocol: "TLS 1.3 / Anycast",
    status: "healthy",
    description: "DDoS mitigation, SSL termination, and static asset edge caching.",
  },
  alb: {
    id: "alb",
    name: "Envoy API Gateway",
    type: "Load Balancer",
    icon: Layers,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    qps: "95,000 req/s",
    latency: "3.4ms",
    protocol: "gRPC & HTTP/2",
    status: "healthy",
    description: "Reverse proxy, JWT token validation, rate-limiting, and path routing.",
  },
  orderService: {
    id: "orderService",
    name: "Order Processing Service",
    type: "Microservice",
    icon: Cpu,
    colorClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/10 border-violet-500/20",
    qps: "38,000 req/s",
    latency: "8.5ms",
    protocol: "gRPC",
    status: "healthy",
    description: "Stateless Golang microservice running on Kubernetes with HPA scaling.",
  },
  redis: {
    id: "redis",
    name: "Redis Cache Cluster",
    type: "In-Memory Cache",
    icon: Zap,
    colorClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-500/10 border-rose-500/20",
    qps: "85,000 req/s",
    latency: "0.8ms",
    protocol: "RESP",
    status: "healthy",
    description: "6-node Redis cluster with read-through caching and 94% hit ratio.",
  },
  kafka: {
    id: "kafka",
    name: "Kafka Event Broker",
    type: "Event Streaming",
    icon: Radio,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    qps: "42,000 msg/s",
    latency: "2.1ms",
    protocol: "TCP Binary",
    status: "healthy",
    description: "Distributed commit log for asynchronous order event handling & analytics.",
  },
  db: {
    id: "db",
    name: "PostgreSQL Primary + Replica",
    type: "Relational Database",
    icon: Database,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-500/10 border-purple-500/20",
    qps: "14,000 trans/s",
    latency: "6.2ms",
    protocol: "Postgres Wire",
    status: "healthy",
    description: "Master-replica cluster with PgBouncer connection pooling and WAL replication.",
  },
};

export default function Hero() {
  const [selectedNode, setSelectedNode] = useState<NodeData>(interactiveNodes.alb);
  const [isSimulating, setIsSimulating] = useState(true);

  return (
    <section className="relative flex flex-col items-center justify-center pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
      {/* Background technical grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40 -z-10" />

      <div className="container mx-auto px-4 md:px-6 text-center space-y-8">
        {/* Release Pill with Emerald Accent */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-mono text-emerald-700 dark:text-emerald-400 backdrop-blur-sm shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>System Architecture & Flowchart Platform</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span className="font-semibold">v2.0 Canvas</span>
        </div>

        {/* Main Headline with Solid Emerald Highlight */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-5xl mx-auto leading-[1.12]">
          Design Scalable{" "}
          <span className="text-emerald-600 dark:text-emerald-400">
            System Architectures
          </span>{" "}
          & Flows with AI
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          From microservices, distributed caches, and event streams to load-balanced cloud topologies.
          Generate, simulate, and export production-ready system design diagrams and flowcharts in seconds.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="h-12 px-8 text-base rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 shadow-sm"
            >
              <Workflow className="mr-2 h-5 w-5" />
              Launch Architecture Canvas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#templates">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-7 text-base rounded-lg border-border hover:bg-muted font-medium"
            >
              Explore System Templates
            </Button>
          </Link>
        </div>

        {/* Feature Highlights List */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs md:text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>50+ Cloud & Microservice Nodes</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Live Traffic & Latency Simulation</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Mermaid & Terraform Export</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>System Design Interview Prep</span>
          </div>
        </div>

        {/* Interactive Architecture Preview Canvas */}
        <div className="mt-12 relative mx-auto max-w-6xl w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          {/* Canvas Window Header Bar */}
          <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-border inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-border inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-border inline-block" />
              </div>
              <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
                project://ecommerce-distributed-order-pipeline.sys
              </span>
            </div>

            {/* Live Metrics */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>P99: 14.2ms</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
                <Activity className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>QPS: 120k/s</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSimulating(!isSimulating)}
                className="h-7 text-[11px] px-2.5 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Play className={`h-3 w-3 ${isSimulating ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
                <span>{isSimulating ? "Simulating Traffic" : "Simulation Paused"}</span>
              </Button>
            </div>
          </div>

          {/* Canvas Work Area + Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px] bg-background">
            {/* Visual Node Diagram Area */}
            <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
              {/* Instructions banner */}
              <div className="flex items-center justify-between z-10 mb-4">
                <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-3 py-1 rounded border border-border">
                  Click any component below to inspect specifications
                </span>
                <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold hidden sm:inline">
                  Topology: Multi-AZ Active
                </span>
              </div>

              {/* Architecture Node Diagram Flow */}
              <div className="relative z-10 flex flex-col gap-6 my-auto">
                {/* Level 1: Ingress */}
                <div className="flex items-center justify-center gap-4 sm:gap-8">
                  <button
                    onClick={() => setSelectedNode(interactiveNodes.client)}
                    className={`p-3 sm:px-4 sm:py-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                      selectedNode.id === "client"
                        ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 ring-1 ring-emerald-500/30"
                        : "border-border bg-card hover:border-emerald-500/40 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className={`h-4 w-4 ${interactiveNodes.client.colorClass}`} />
                      <div>
                        <div className="text-xs font-bold text-foreground">Clients</div>
                        <div className="text-[10px] text-muted-foreground font-mono">Web / Mobile</div>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center text-xs font-mono text-muted-foreground">
                    <span className="hidden sm:inline mr-1 text-[10px]">HTTPS</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">➔</span>
                  </div>

                  <button
                    onClick={() => setSelectedNode(interactiveNodes.waf)}
                    className={`p-3 sm:px-4 sm:py-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                      selectedNode.id === "waf"
                        ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 ring-1 ring-emerald-500/30"
                        : "border-border bg-card hover:border-emerald-500/40 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className={`h-4 w-4 ${interactiveNodes.waf.colorClass}`} />
                      <div>
                        <div className="text-xs font-bold text-foreground">Edge CDN & WAF</div>
                        <div className="text-[10px] text-muted-foreground font-mono">DDoS / Cache</div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Flow connector line down */}
                <div className="flex justify-center text-xs font-mono">
                  <div className="h-6 w-px bg-border"></div>
                </div>

                {/* Level 2: Gateway / Load Balancer */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setSelectedNode(interactiveNodes.alb)}
                    className={`w-full max-w-md p-3 sm:px-5 sm:py-3 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                      selectedNode.id === "alb"
                        ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 ring-1 ring-emerald-500/30"
                        : "border-border bg-card hover:border-emerald-500/40 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">Envoy API Gateway & Load Balancer</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Auth Check • Rate Limiting • Path Routing
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-mono">
                        3.4ms
                      </Badge>
                    </div>
                  </button>
                </div>

                {/* Flow connector line down */}
                <div className="flex justify-center text-xs font-mono">
                  <div className="h-6 w-px bg-border"></div>
                </div>

                {/* Level 3: Microservices & Event Stream */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedNode(interactiveNodes.orderService)}
                    className={`p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                      selectedNode.id === "orderService"
                        ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 ring-1 ring-emerald-500/30"
                        : "border-border bg-card hover:border-violet-500/40 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
                        <Cpu className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Order Service</div>
                        <div className="text-[10px] text-muted-foreground font-mono">Go Microservice (HPA)</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedNode(interactiveNodes.kafka)}
                    className={`p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                      selectedNode.id === "kafka"
                        ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 ring-1 ring-emerald-500/30"
                        : "border-border bg-card hover:border-amber-500/40 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Radio className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Kafka Event Bus</div>
                        <div className="text-[10px] text-muted-foreground font-mono">Pub/Sub Partitioned</div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Flow connector line down */}
                <div className="flex justify-center text-xs font-mono">
                  <div className="h-6 w-px bg-border"></div>
                </div>

                {/* Level 4: Storage & Caching Layer */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedNode(interactiveNodes.redis)}
                    className={`p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                      selectedNode.id === "redis"
                        ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 ring-1 ring-emerald-500/30"
                        : "border-border bg-card hover:border-rose-500/40 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Redis Cache Cluster</div>
                        <div className="text-[10px] text-muted-foreground font-mono">0.8ms • 94% Hit Ratio</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedNode(interactiveNodes.db)}
                    className={`p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                      selectedNode.id === "db"
                        ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 ring-1 ring-emerald-500/30"
                        : "border-border bg-card hover:border-purple-500/40 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <Database className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">PostgreSQL Sharded</div>
                        <div className="text-[10px] text-muted-foreground font-mono">WAL Replication • Multi-AZ</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bottom Canvas Toolbar */}
              <div className="flex items-center justify-between pt-6 border-t border-border text-[11px] font-mono text-muted-foreground z-10">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Protocol: <strong className="text-foreground">gRPC / Protobuf</strong>
                </span>
                <span>Zoom: 100% • 7 Nodes</span>
              </div>
            </div>

            {/* Component Inspector Panel */}
            <div className="lg:col-span-4 p-6 border-t lg:border-t-0 lg:border-l border-border bg-muted/20 flex flex-col justify-between">
              <div className="space-y-5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    Node Inspector
                  </span>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-mono font-semibold">
                    {selectedNode.status}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${selectedNode.bgClass}`}>
                      <selectedNode.icon className={`h-4 w-4 ${selectedNode.colorClass}`} />
                    </div>
                    <h3 className="font-bold text-sm text-foreground">{selectedNode.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">{selectedNode.description}</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-2.5 rounded-lg bg-card border border-border space-y-0.5">
                    <div className="text-[10px] text-muted-foreground font-mono">Throughput</div>
                    <div className="text-xs font-mono font-bold text-foreground">{selectedNode.qps}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card border border-border space-y-0.5">
                    <div className="text-[10px] text-muted-foreground font-mono">P99 Latency</div>
                    <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedNode.latency}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card border border-border space-y-0.5">
                    <div className="text-[10px] text-muted-foreground font-mono">Protocol</div>
                    <div className="text-xs font-mono font-bold text-foreground">{selectedNode.protocol}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card border border-border space-y-0.5">
                    <div className="text-[10px] text-muted-foreground font-mono">Redundancy</div>
                    <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">Multi-AZ Active</div>
                  </div>
                </div>

                {/* AI Architecture Insight */}
                <div className="p-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-500/10 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Architect Recommendation</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Under peak traffic (&gt;100k QPS), enable connection pooling with PgBouncer and partition order events into 12 Kafka topics to eliminate write contention.
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="pt-6">
                <Link href="/dashboard" className="w-full block">
                  <Button size="sm" className="w-full gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950">
                    <Workflow className="h-3.5 w-3.5" />
                    Edit this Architecture in Studio
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
