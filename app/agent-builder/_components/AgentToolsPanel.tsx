"use client";
import { WorkflowContext } from "@/context/WorkflowContext";
import {
  Layout,
  Smartphone,
  Bot,
  Cloud,
  Cpu,
  Layers,
  GitFork,
  Radio,
  Zap,
  Database,
  HardDrive,
  Cog,
  Boxes,
  CloudLightning,
  Sparkles,
  ShieldAlert,
  Activity,
  ExternalLink,
  Search,
  Lock,
  Globe,
  SlidersHorizontal,
  X,
} from "lucide-react";
import React, { useContext, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type DomainCategory = "all" | "frontend" | "backend" | "ai" | "mobile" | "cloud";

interface ComponentTool {
  name: string;
  subtitle: string;
  icon: any;
  colorClass: string;
  bgClass: string;
  type: string;
  id: string;
  domain: "frontend" | "backend" | "ai" | "mobile" | "cloud";
  defaultSettings: Record<string, string>;
}

const SoftwareComponents: ComponentTool[] = [
  // ==================== FRONTEND ====================
  {
    name: "Next.js Web App",
    subtitle: "React 19 • App Router SSR",
    icon: Layout,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    type: "FrontendNode",
    id: "fe-nextjs",
    domain: "frontend",
    defaultSettings: {
      name: "Next.js Web App",
      tech: "Next.js 15 / React 19",
      rendering: "Server-Side Rendered (SSR)",
      protocol: "HTTPS / HTTP/3",
      qps: "80k req/s",
    },
  },
  {
    name: "React Single Page App",
    subtitle: "Vite • Client-Side (CSR)",
    icon: Layout,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    type: "FrontendNode",
    id: "fe-spa",
    domain: "frontend",
    defaultSettings: {
      name: "React SPA Client",
      tech: "Vite + React (CSR)",
      rendering: "Client-Side Rendered",
      protocol: "HTTPS",
      qps: "50k req/s",
    },
  },
  {
    name: "Micro-Frontend",
    subtitle: "Webpack Module Federation",
    icon: Layers,
    colorClass: "text-teal-600 dark:text-teal-400",
    bgClass: "bg-teal-500/10 border-teal-500/20",
    type: "FrontendNode",
    id: "fe-mfe",
    domain: "frontend",
    defaultSettings: {
      name: "Micro-Frontend Shell",
      tech: "Module Federation",
      rendering: "Decoupled Remote Micro-App",
      protocol: "HTTPS",
      qps: "30k req/s",
    },
  },
  {
    name: "Admin Dashboard Portal",
    subtitle: "Tailwind • Shadcn UI • RBAC",
    icon: SlidersHorizontal,
    colorClass: "text-teal-600 dark:text-teal-400",
    bgClass: "bg-teal-500/10 border-teal-500/20",
    type: "FrontendNode",
    id: "fe-admin",
    domain: "frontend",
    defaultSettings: {
      name: "Admin Dashboard Portal",
      tech: "Next.js + Shadcn UI",
      rendering: "Role-Based Auth & Tables",
      protocol: "HTTPS",
      qps: "5k req/s",
    },
  },
  {
    name: "WebSocket Client",
    subtitle: "Bi-directional Real-Time Socket",
    icon: Globe,
    colorClass: "text-cyan-600 dark:text-cyan-400",
    bgClass: "bg-cyan-500/10 border-cyan-500/20",
    type: "ClientNode",
    id: "fe-ws",
    domain: "frontend",
    defaultSettings: {
      name: "WebSocket Client",
      tech: "Socket.io / Native WS",
      protocol: "WSS (Bi-directional)",
      qps: "20k Conns",
    },
  },
  {
    name: "Client State & Cache",
    subtitle: "TanStack Query • Optimistic UI",
    icon: Zap,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    type: "FrontendNode",
    id: "fe-state",
    domain: "frontend",
    defaultSettings: {
      name: "Client State & Cache",
      tech: "TanStack Query / Zustand",
      rendering: "SWR • Optimistic UI Cache",
      protocol: "Memory",
      qps: "Local RAM",
    },
  },

  // ==================== BACKEND ====================
  {
    name: "Envoy API Gateway",
    subtitle: "Auth, SSL, Rate Limit & Routing",
    icon: Layers,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    type: "GatewayNode",
    id: "be-gateway",
    domain: "backend",
    defaultSettings: {
      name: "Envoy API Gateway",
      tech: "Envoy / Kong API Gateway",
      latency: "1.2ms",
      protocol: "gRPC & HTTPS",
      qps: "150k req/s",
    },
  },
  {
    name: "Go Microservice (HPA)",
    subtitle: "High-Throughput Domain Service",
    icon: Cpu,
    colorClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/10 border-violet-500/20",
    type: "ServiceNode",
    id: "be-service",
    domain: "backend",
    defaultSettings: {
      name: "Order & Payment Microservice",
      tech: "Go / Gin Microservice",
      latency: "4.5ms",
      protocol: "gRPC (HTTP/2)",
      qps: "80k req/s",
    },
  },
  {
    name: "GraphQL Federation Gateway",
    subtitle: "Apollo Federation Subgraph",
    icon: GitFork,
    colorClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/10 border-violet-500/20",
    type: "ServiceNode",
    id: "be-graphql",
    domain: "backend",
    defaultSettings: {
      name: "GraphQL Federation Gateway",
      tech: "Apollo Router (Rust)",
      latency: "5.5ms",
      protocol: "GraphQL over HTTPS",
      qps: "40k req/s",
    },
  },
  {
    name: "Serverless Function",
    subtitle: "AWS Lambda / Cloud Run",
    icon: Zap,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    type: "ServerlessNode",
    id: "be-lambda",
    domain: "backend",
    defaultSettings: {
      name: "Serverless Lambda Function",
      tech: "AWS Lambda / Cloud Run",
      concurrency: "Auto-scale • 512MB RAM",
      protocol: "Event / REST",
      qps: "Burst 10k req/s",
    },
  },
  {
    name: "Async Task Worker",
    subtitle: "BullMQ / Celery Queue Worker",
    icon: Cog,
    colorClass: "text-foreground",
    bgClass: "bg-muted border-border",
    type: "WorkerNode",
    id: "be-worker",
    domain: "backend",
    defaultSettings: {
      name: "Async Task Worker",
      tech: "Celery / BullMQ Worker",
      workers: "16 Concurrency • Exponential Backoff",
      protocol: "Redis Stream / AMQP",
    },
  },
  {
    name: "Kafka Event Bus",
    subtitle: "Distributed Event Streaming",
    icon: Radio,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    type: "QueueNode",
    id: "be-kafka",
    domain: "backend",
    defaultSettings: {
      name: "Kafka Event Streaming Bus",
      tech: "Apache Kafka / Redpanda",
      throughput: "100k msg/s • 12 Partitions",
      protocol: "TCP (Kafka Protocol)",
    },
  },
  {
    name: "PostgreSQL Database",
    subtitle: "ACID Relational Master-Replica",
    icon: Database,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-500/10 border-purple-500/20",
    type: "DatabaseNode",
    id: "be-postgres",
    domain: "backend",
    defaultSettings: {
      name: "PostgreSQL Master-Replica",
      tech: "PostgreSQL 16 (WAL Sync)",
      latency: "2.8ms Read / 8.0ms Write",
      protocol: "TCP 5432",
    },
  },
  {
    name: "NoSQL Document DB",
    subtitle: "MongoDB / DynamoDB Key-Value",
    icon: Database,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-500/10 border-purple-500/20",
    type: "DatabaseNode",
    id: "be-nosql",
    domain: "backend",
    defaultSettings: {
      name: "MongoDB / DynamoDB NoSQL",
      tech: "DynamoDB On-Demand Sharding",
      latency: "1.8ms Single-digit Latency",
      protocol: "HTTPS / TLS",
    },
  },
  {
    name: "Redis In-Memory Cache",
    subtitle: "Sub-millisecond Cluster LRU",
    icon: Zap,
    colorClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-500/10 border-rose-500/20",
    type: "CacheNode",
    id: "be-redis",
    domain: "backend",
    defaultSettings: {
      name: "Redis Cluster Cache",
      tech: "Redis Cluster 7.2",
      hitRatio: "0.6ms • 96% Hit Ratio",
      protocol: "RESP (TCP 6379)",
    },
  },

  // ==================== AI ====================
  {
    name: "LLM Inference Engine",
    subtitle: "Gemini 2.5 / OpenAI Inference",
    icon: Bot,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    type: "AiAgentNode",
    id: "ai-llm",
    domain: "ai",
    defaultSettings: {
      name: "Google Gemini 2.5 Flash",
      tech: "Gemini 2.5 Flash / Pro",
      model: "1M Context • Multi-Modal Tokens",
      protocol: "HTTPS REST / gRPC Streaming",
    },
  },
  {
    name: "Autonomous AI Agent",
    subtitle: "ReAct • Tool Calling • Memory",
    icon: Bot,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    type: "AiAgentNode",
    id: "ai-agent",
    domain: "ai",
    defaultSettings: {
      name: "Autonomous ReAct Agent",
      tech: "LangGraph / Antigravity Agent",
      model: "Tool Calling • Memory State Loop",
      protocol: "Agentic MCP / Functions",
    },
  },
  {
    name: "AI Vector Database",
    subtitle: "Pinecone / pgvector / Milvus",
    icon: Sparkles,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    type: "VectorDbNode",
    id: "ai-vectordb",
    domain: "ai",
    defaultSettings: {
      name: "Pinecone / pgvector Store",
      tech: "Pinecone Serverless / pgvector",
      metric: "HNSW Cosine • 1536-dim",
      protocol: "gRPC Vector API",
    },
  },
  {
    name: "Embedding Pipeline",
    subtitle: "Batch Vectorizer & Chunker",
    icon: Sparkles,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    type: "AiAgentNode",
    id: "ai-embed",
    domain: "ai",
    defaultSettings: {
      name: "Embedding Vectorizer Pipeline",
      tech: "text-embedding-004",
      model: "512 Chunk • 10% Overlap",
      protocol: "Batch HTTPS API",
    },
  },
  {
    name: "RAG Hybrid Knowledge Base",
    subtitle: "BM25 + Dense Semantic Retrieval",
    icon: Search,
    colorClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/10 border-violet-500/20",
    type: "SearchNode",
    id: "ai-rag",
    domain: "ai",
    defaultSettings: {
      name: "Hybrid RAG Knowledge Base",
      tech: "OpenSearch + Vector Hybrid",
      shards: "BM25 Keyword + Dense Cosine",
      protocol: "HTTPS / REST",
    },
  },
  {
    name: "AI Guardrails & Safety",
    subtitle: "Prompt Injection & Safety Shield",
    icon: ShieldAlert,
    colorClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-500/10 border-rose-500/20",
    type: "RateLimiterNode",
    id: "ai-guardrails",
    domain: "ai",
    defaultSettings: {
      name: "AI Guardrails Firewall",
      tech: "NeMo Guardrails / Llama Guard",
      limit: "Jailbreak Shield • Output Filter",
      protocol: "Middleware Hook",
    },
  },
  {
    name: "Model Fine-Tuning Cluster",
    subtitle: "PyTorch • LoRA GPU Workers",
    icon: Cog,
    colorClass: "text-foreground",
    bgClass: "bg-muted border-border",
    type: "WorkerNode",
    id: "ai-training",
    domain: "ai",
    defaultSettings: {
      name: "Model Fine-Tuning GPU Cluster",
      tech: "PyTorch / Ray Train (A100)",
      workers: "LoRA / PEFT Checkpointing",
      protocol: "NVIDIA NCCL",
    },
  },

  // ==================== MOBILE ====================
  {
    name: "iOS Native Client",
    subtitle: "Swift 6 • SwiftUI • Keychain",
    icon: Smartphone,
    colorClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/10 border-violet-500/20",
    type: "MobileNode",
    id: "mob-ios",
    domain: "mobile",
    defaultSettings: {
      name: "iOS Native Client",
      tech: "Swift 6 / SwiftUI",
      sync: "Native iOS • Apple Keychain",
      protocol: "HTTPS / TLS 1.3",
    },
  },
  {
    name: "Android Native Client",
    subtitle: "Kotlin • Jetpack Compose",
    icon: Smartphone,
    colorClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/10 border-violet-500/20",
    type: "MobileNode",
    id: "mob-android",
    domain: "mobile",
    defaultSettings: {
      name: "Android Native Client",
      tech: "Kotlin / Jetpack Compose",
      sync: "Room SQLite • Android Keystore",
      protocol: "HTTPS / TLS 1.3",
    },
  },
  {
    name: "Cross-Platform (Flutter)",
    subtitle: "Single Codebase iOS & Android",
    icon: Smartphone,
    colorClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/10 border-violet-500/20",
    type: "MobileNode",
    id: "mob-flutter",
    domain: "mobile",
    defaultSettings: {
      name: "Flutter Mobile App",
      tech: "Flutter 3.x Engine / Dart",
      sync: "Isar DB • Multi-platform",
      protocol: "HTTPS & WebSockets",
    },
  },
  {
    name: "Push Notification Gateway",
    subtitle: "APNs & Firebase Cloud Messaging",
    icon: Radio,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    type: "QueueNode",
    id: "mob-push",
    domain: "mobile",
    defaultSettings: {
      name: "Push Notification Gateway",
      tech: "Apple APNs & Google FCM",
      throughput: "50k pushes/s • Silent Sync",
      protocol: "HTTP/2 APNs & FCM v1",
    },
  },
  {
    name: "Mobile Offline Sync & SQLite",
    subtitle: "Bi-directional Conflict-Free Sync",
    icon: Database,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-500/10 border-purple-500/20",
    type: "MobileNode",
    id: "mob-sqlite",
    domain: "mobile",
    defaultSettings: {
      name: "Mobile Offline Sync Engine",
      tech: "WatermelonDB / SQLite (CRDT)",
      sync: "Delta Replication • Offline-First",
      protocol: "Local SQLite / Delta HTTPS",
    },
  },

  // ==================== CLOUD & INFRA ====================
  {
    name: "Anycast GeoDNS",
    subtitle: "AWS Route 53 • Latency Routing",
    icon: Globe,
    colorClass: "text-teal-600 dark:text-teal-400",
    bgClass: "bg-teal-500/10 border-teal-500/20",
    type: "DnsNode",
    id: "cloud-dns",
    domain: "cloud",
    defaultSettings: {
      name: "Anycast GeoDNS",
      tech: "AWS Route 53 / Cloudflare",
      routing: "Geo-Proximity & Latency Routing",
      protocol: "DNS (UDP/TCP 53)",
    },
  },
  {
    name: "Global CDN Edge",
    subtitle: "Cloudflare / CloudFront 99% Cache",
    icon: CloudLightning,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    type: "CdnNode",
    id: "cloud-cdn",
    domain: "cloud",
    defaultSettings: {
      name: "Global CDN Edge Cache",
      tech: "Cloudflare Workers / CloudFront",
      hitRatio: "1.1ms • 98.5% Edge Cache",
      protocol: "HTTPS / HTTP/3 (QUIC)",
    },
  },
  {
    name: "L4/L7 Load Balancer",
    subtitle: "AWS ALB / NGINX Health Checks",
    icon: GitFork,
    colorClass: "text-cyan-600 dark:text-cyan-400",
    bgClass: "bg-cyan-500/10 border-cyan-500/20",
    type: "LoadBalancerNode",
    id: "cloud-alb",
    domain: "cloud",
    defaultSettings: {
      name: "Application Load Balancer",
      tech: "AWS ALB / NGINX Plus",
      algorithm: "Round Robin & Health Checks",
      protocol: "TLS Offload (Port 443)",
    },
  },
  {
    name: "Kubernetes Cluster (K8s)",
    subtitle: "EKS / GKE Pods & Autoscaling",
    icon: Cloud,
    colorClass: "text-cyan-600 dark:text-cyan-400",
    bgClass: "bg-cyan-500/10 border-cyan-500/20",
    type: "CloudInfraNode",
    id: "cloud-k8s",
    domain: "cloud",
    defaultSettings: {
      name: "Kubernetes K8s Cluster",
      tech: "AWS EKS / Google GKE",
      topology: "Multi-AZ • Cluster Autoscaler",
      protocol: "Containerd / Overlay CNI",
    },
  },
  {
    name: "Object Storage (S3 / GCS)",
    subtitle: "High Durability Blob Store",
    icon: HardDrive,
    colorClass: "text-indigo-600 dark:text-indigo-400",
    bgClass: "bg-indigo-500/10 border-indigo-500/20",
    type: "StorageNode",
    id: "cloud-s3",
    domain: "cloud",
    defaultSettings: {
      name: "Object Storage (S3 / GCS)",
      tech: "AWS S3 / Google Cloud Storage",
      storageClass: "Standard 99.999999999% (11 9s)",
      protocol: "S3 REST API / HTTPS",
    },
  },
  {
    name: "Observability & APM",
    subtitle: "Prometheus, Grafana, OpenTelemetry",
    icon: Activity,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-500/10 border-purple-500/20",
    type: "MonitoringNode",
    id: "cloud-apm",
    domain: "cloud",
    defaultSettings: {
      name: "Observability & APM Cluster",
      tech: "Prometheus, Grafana & OTel",
      interval: "10s Scrapes • Distributed Tracing",
      protocol: "OTLP / gRPC",
    },
  },
  {
    name: "Secrets Vault & KMS",
    subtitle: "HashiCorp Vault / Cloud KMS",
    icon: Lock,
    colorClass: "text-cyan-600 dark:text-cyan-400",
    bgClass: "bg-cyan-500/10 border-cyan-500/20",
    type: "CloudInfraNode",
    id: "cloud-vault",
    domain: "cloud",
    defaultSettings: {
      name: "Secrets Vault & KMS",
      tech: "HashiCorp Vault / AWS KMS",
      topology: "Envelope Encryption & HSM",
      protocol: "mTLS / REST",
    },
  },
  {
    name: "3rd-Party SaaS / Webhook",
    subtitle: "Stripe, Twilio, OAuth Gateways",
    icon: ExternalLink,
    colorClass: "text-cyan-600 dark:text-cyan-400",
    bgClass: "bg-cyan-500/10 border-cyan-500/20",
    type: "ThirdPartyApiNode",
    id: "cloud-saas",
    domain: "cloud",
    defaultSettings: {
      name: "3rd-Party SaaS / Webhook",
      tech: "Stripe / Twilio / Auth0",
      protocol: "REST Webhook (HMAC Signature)",
    },
  },
];

const DOMAINS: { id: DomainCategory; label: string; icon: any; count: number }[] = [
  { id: "all", label: "All", icon: Boxes, count: SoftwareComponents.length },
  {
    id: "frontend",
    label: "Frontend",
    icon: Layout,
    count: SoftwareComponents.filter((c) => c.domain === "frontend").length,
  },
  {
    id: "backend",
    label: "Backend",
    icon: Cpu,
    count: SoftwareComponents.filter((c) => c.domain === "backend").length,
  },
  {
    id: "ai",
    label: "AI",
    icon: Bot,
    count: SoftwareComponents.filter((c) => c.domain === "ai").length,
  },
  {
    id: "mobile",
    label: "Mobile",
    icon: Smartphone,
    count: SoftwareComponents.filter((c) => c.domain === "mobile").length,
  },
  {
    id: "cloud",
    label: "Cloud",
    icon: Cloud,
    count: SoftwareComponents.filter((c) => c.domain === "cloud").length,
  },
];

export default function AgentToolsPanel() {
  const { setAddedNodes } = useContext(WorkflowContext);
  const [selectedDomain, setSelectedDomain] = useState<DomainCategory>("frontend");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredComponents = useMemo(() => {
    return SoftwareComponents.filter((comp) => {
      const matchesDomain =
        selectedDomain === "all" ? true : comp.domain === selectedDomain;
      const matchesSearch =
        searchQuery.trim() === "" ||
        comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.domain.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDomain && matchesSearch;
    });
  }, [selectedDomain, searchQuery]);

  const onComponentClick = (tool: ComponentTool) => {
    const randomOffset = Math.floor(Math.random() * 40);
    const newNode = {
      id: `${tool.id}-${Date.now()}`,
      position: { x: 260 + randomOffset, y: 140 + randomOffset },
      data: {
        label: tool.name,
        type: tool.type,
        settings: {
          name: tool.name,
          ...tool.defaultSettings,
        },
      },
      type: tool.type,
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
  };

  return (
    <div className="bg-card border border-border p-3 rounded-xl shadow-xl w-[260px] sm:w-[280px] max-h-[85vh] flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-xs text-foreground uppercase tracking-wider font-mono">
            System Nodes
          </h3>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-mono text-muted-foreground border-border px-1.5 py-0"
        >
          {filteredComponents.length} items
        </Badge>
      </div>

      {/* Domain Category Selector Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-lg border border-border/60">
        {DOMAINS.map((domain) => {
          const Icon = domain.icon;
          const isActive = selectedDomain === domain.id;
          return (
            <button
              key={domain.id}
              type="button"
              onClick={() => setSelectedDomain(domain.id)}
              className={`flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span className="truncate">{domain.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${selectedDomain === "all" ? "software" : selectedDomain} nodes...`}
          className="h-7.5 pl-8 pr-7 text-xs bg-background border-border"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Node Component List */}
      <div className="overflow-y-auto pr-0.5 space-y-1.5 max-h-[52vh]">
        {filteredComponents.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No components found for &quot;{searchQuery}&quot;
          </div>
        ) : (
          filteredComponents.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onComponentClick(tool)}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/80 text-left transition-colors cursor-pointer border border-transparent hover:border-border group"
              >
                <div
                  className={`h-7 w-7 rounded-md flex items-center justify-center border shrink-0 ${tool.bgClass} ${tool.colorClass} group-hover:scale-105 transition-transform`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-foreground truncate block">
                    {tool.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate block font-mono">
                    {tool.subtitle}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span>Click to add to canvas</span>
        <span className="capitalize text-emerald-600 dark:text-emerald-400 font-semibold">
          {selectedDomain}
        </span>
      </div>
    </div>
  );
}
