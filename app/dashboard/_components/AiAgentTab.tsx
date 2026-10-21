"use client";
import React, { useContext, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MyAgents from "./MyAgents";
import {
  Car,
  ShoppingCart,
  Video,
  ShieldAlert,
  MessageSquare,
  Link2,
  Workflow,
  Sparkles,
  ArrowRight,
  Loader,
  Layers,
  Cpu,
  Database,
  Radio,
  Zap,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { UserDetailContext } from "@/context/UserDetailContext";
import { toast } from "sonner";

const templateCards = [
  {
    id: "uber",
    title: "Real-Time Ride Hailing (Uber Style)",
    category: "Geospatial & WebSocket",
    icon: Car,
    colorClass: "text-teal-600 dark:text-teal-400",
    bgClass: "bg-teal-500/10 border-teal-500/20",
    qps: "150k updates/s",
    sla: "99.999%",
    description:
      "Ingests driver GPS coordinates via WebSockets, updates H3 spatial indexes, and dispatches trips with Redis cluster and Kafka.",
    nodes: ["WebSocket Ingress", "H3 Spatial Shard", "Redis Cluster", "Kafka Streams", "Trip Matcher Worker", "Cassandra DB"],
  },
  {
    id: "amazon",
    title: "High-Concurrency Flash Sale (Amazon Style)",
    category: "E-Commerce & High Volume",
    icon: ShoppingCart,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    qps: "300k req/s",
    sla: "Zero Overselling",
    description:
      "Prevents inventory overselling using atomic Redis Redlocks, asynchronous Saga coordinators, and partitioned PostgreSQL databases.",
    nodes: ["Envoy WAF / Shield", "Token Bucket Limiter", "Redis Redlock", "Kafka Order Pipeline", "PostgreSQL Shards", "Saga Coordinator"],
  },
  {
    id: "netflix",
    title: "Global Video Streaming (Netflix Style)",
    category: "Media & Edge CDN",
    icon: Video,
    colorClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/10 border-violet-500/20",
    qps: "500 Gbps egress",
    sla: "< 1.5s Playback",
    description:
      "Adaptive HLS/DASH video pipeline with GPU transcoding clusters, multi-tier CDN edge caching, and user playback telemetry.",
    nodes: ["Multi-CDN Edge", "Transcoding Fleet", "Amazon S3 Storage", "Metadata Cache", "ScyllaDB Watch History", "Kafka Telemetry"],
  },
  {
    id: "rate-limiter",
    title: "Distributed Rate Limiter & API Shield",
    category: "Infrastructure & Security",
    icon: ShieldAlert,
    colorClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-500/10 border-rose-500/20",
    qps: "1M req/s",
    sla: "< 1ms Evaluation",
    description:
      "Protects downstream microservices against spikes using token bucket algorithms, Redis Sentinel clusters, and localized edge memory.",
    nodes: ["eBPF / Envoy Filter", "Local Memory L1", "Redis Cluster L2", "Metrics Exporter", "Sliding Log Engine", "Alert Webhook"],
  },
  {
    id: "chat-system",
    title: "Real-Time Chat Broker (WhatsApp Style)",
    category: "Messaging & Pub/Sub",
    icon: MessageSquare,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    qps: "80k msgs/s",
    sla: "< 50ms Delivery",
    description:
      "Persistent WebSocket gateway managing active client connections, presence detection, Redis pub/sub routing, and Cassandra message store.",
    nodes: ["WebSocket Gateway", "Presence Service", "Redis Pub/Sub", "Kafka Ingest", "Cassandra Message Store", "Push Notification Service"],
  },
  {
    id: "url-shortener",
    title: "High-Throughput URL Shortener (TinyURL)",
    category: "Distributed Hash & Cache",
    icon: Link2,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-500/10 border-purple-500/20",
    qps: "100k reads/s",
    sla: "100:1 Read-to-Write",
    description:
      "Global Base62 short URL generator backed by distributed Range KGS (Key Generation Service), Redis read-through caching, and MongoDB.",
    nodes: ["Cloudflare Anycast", "Base62 Encoder", "Key Gen Service (KGS)", "Redis LRU Cache", "MongoDB Shards", "Analytics Worker"],
  },
];

const componentCatalog = [
  {
    category: "Ingress & Edge",
    components: [
      { name: "Anycast DNS", protocol: "DNS / UDP", latency: "5ms" },
      { name: "Cloudflare Edge WAF", protocol: "HTTPS / TLS 1.3", latency: "1.2ms" },
      { name: "AWS Route 53 GeoDNS", protocol: "DNS Latency Routing", latency: "4ms" },
      { name: "NGINX / Envoy Proxy", protocol: "HTTP/2, gRPC", latency: "2.1ms" },
    ],
  },
  {
    category: "Compute & Microservices",
    components: [
      { name: "Auth Service", protocol: "JWT / OAuth2", latency: "4.5ms" },
      { name: "Order Processing Engine", protocol: "gRPC / Protobuf", latency: "8.2ms" },
      { name: "Payment Gateway Worker", protocol: "REST / HTTPS", latency: "120ms" },
      { name: "Notification Dispatcher", protocol: "FCM / APNs / SES", latency: "45ms" },
    ],
  },
  {
    category: "Streaming & Messaging",
    components: [
      { name: "Apache Kafka Cluster", protocol: "TCP Binary Partitioned", latency: "2.5ms" },
      { name: "RabbitMQ AMQP Broker", protocol: "AMQP 0-9-1", latency: "3.2ms" },
      { name: "Redis Pub/Sub Channel", protocol: "RESP In-Memory", latency: "0.5ms" },
      { name: "AWS SQS FIFO Queue", protocol: "HTTPS Batch", latency: "18ms" },
    ],
  },
  {
    category: "Storage & In-Memory",
    components: [
      { name: "Redis Cluster (L1 Cache)", protocol: "RESP In-Memory", latency: "0.8ms" },
      { name: "PostgreSQL Master-Replica", protocol: "Pg Wire / ACID", latency: "6.5ms" },
      { name: "Cassandra / ScyllaDB", protocol: "CQL Distributed", latency: "4.2ms" },
      { name: "Amazon S3 Blob Storage", protocol: "HTTPS REST Object", latency: "25ms" },
    ],
  },
];

export default function AiAgentTab() {
  const [activeTab, setActiveTab] = useState("myagent");
  const [cloningId, setCloningId] = useState<string | null>(null);

  const CreateAgentMutation = useMutation(api.agent.CreateAgent);
  const { userDetails } = useContext(UserDetailContext);
  const router = useRouter();

  const handleCloneTemplate = async (template: typeof templateCards[0]) => {
    try {
      setCloningId(template.id);
      const agentId = uuidv4();
      await CreateAgentMutation({
        agentId: agentId,
        name: template.title,
        userId: userDetails?._id,
      });
      toast.success(`Created project from ${template.title}!`);
      router.push(`/agent-builder/${agentId}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to initialize template");
      setCloningId(null);
    }
  };

  return (
    <div className="px-6 md:px-12 lg:px-20 py-8 max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted p-1 border border-border">
          <TabsTrigger value="myagent" className="text-xs font-semibold data-[state=active]:bg-card cursor-pointer">
            My Architectures
          </TabsTrigger>
          <TabsTrigger value="template" className="text-xs font-semibold data-[state=active]:bg-card cursor-pointer">
            Production Templates
          </TabsTrigger>
          <TabsTrigger value="components" className="text-xs font-semibold data-[state=active]:bg-card cursor-pointer">
            Component Library
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: My Architectures */}
        <TabsContent value="myagent">
          <MyAgents onSelectTemplateTab={() => setActiveTab("template")} />
        </TabsContent>

        {/* Tab 2: Production Templates Gallery */}
        <TabsContent value="template" className="space-y-6 pt-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">
              Production Architecture Blueprints
            </h3>
            <p className="text-xs text-muted-foreground">
              One-click launchable distributed system patterns. Click "Clone to Canvas" to start modeling and simulating.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {templateCards.map((template) => {
              const Icon = template.icon;
              const isCloning = cloningId === template.id;
              return (
                <div
                  key={template.id}
                  className="rounded-xl border border-border bg-card p-5 hover:border-emerald-500/50 transition-all duration-150 shadow-2xs hover:shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center border ${template.bgClass} ${template.colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border">
                        {template.category}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-foreground line-clamp-1">
                        {template.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                        <span>QPS: <strong className="text-foreground">{template.qps}</strong></span>
                        <span>•</span>
                        <span>SLA: <strong className="text-emerald-700 dark:text-emerald-400">{template.sla}</strong></span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {template.description}
                    </p>

                    {/* Nodes preview */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {template.nodes.slice(0, 3).map((node) => (
                        <span key={node} className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                          {node}
                        </span>
                      ))}
                      {template.nodes.length > 3 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-muted-foreground">
                          +{template.nodes.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/60">
                    <Button
                      size="sm"
                      onClick={() => handleCloneTemplate(template)}
                      disabled={isCloning}
                      className="w-full gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 cursor-pointer"
                    >
                      {isCloning ? (
                        <>
                          <Loader className="h-3.5 w-3.5 animate-spin" />
                          <span>Creating Canvas...</span>
                        </>
                      ) : (
                        <>
                          <Workflow className="h-3.5 w-3.5" />
                          <span>Clone to Canvas</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 3: Component Library Reference */}
        <TabsContent value="components" className="space-y-6 pt-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">
              50+ Distributed System Components
            </h3>
            <p className="text-xs text-muted-foreground">
              Reference guide of available cloud services, protocols, and latency budgets available inside the visual canvas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {componentCatalog.map((category) => (
              <div key={category.category} className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-bold text-sm text-foreground">{category.category}</h4>
                </div>
                <div className="space-y-2">
                  {category.components.map((c) => (
                    <div key={c.name} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground">{c.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{c.protocol}</div>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                        {c.latency}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
