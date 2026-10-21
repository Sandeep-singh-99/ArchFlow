"use client";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Sliders, Trash2, X, Layout, Cpu, Database, Bot, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  selectedNode: any;
  updateFormData: (formData: any) => void;
  onDeleteNode?: (nodeId: string) => void;
  onClose?: () => void;
}

const ROLES = [
  { id: "frontend", label: "Frontend", icon: Layout },
  { id: "backend", label: "Backend", icon: Cpu },
  { id: "database", label: "Database", icon: Database },
  { id: "ai", label: "AI", icon: Bot },
  { id: "custom", label: "Custom", icon: Sparkles },
];

export default function SystemNodeSettings({
  selectedNode,
  updateFormData,
  onDeleteNode,
  onClose,
}: Props) {
  const [formData, setFormData] = useState({
    name: "",
    role: "frontend",
    action: "",
    tech: "",
    protocol: "HTTPS",
    latency: "5.0ms",
    qps: "50k req/s",
    redundancy: "Multi-AZ Active",
    notes: "",
  });

  useEffect(() => {
    if (selectedNode) {
      const settings = selectedNode.data?.settings || {};
      setFormData({
        name: selectedNode.data?.label || selectedNode.data?.name || "Component Node",
        role: settings.role || "frontend",
        action: settings.action || settings.rendering || settings.latency || "Core Functionality",
        tech: settings.tech || "",
        protocol: settings.protocol || "HTTPS",
        latency: settings.latency || "5.0ms",
        qps: settings.qps || "50k req/s",
        redundancy: settings.redundancy || "Multi-AZ Active",
        notes: settings.notes || "",
      });
    }
  }, [selectedNode]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateFormData(formData);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-[#ffdf27]" />
          <h3 className="text-xs font-bold text-foreground">Node Controls</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] font-mono text-[#ffee72] border-[#ffdf27]/30 bg-[#ffc507]/10 uppercase">
            {formData.role}
          </Badge>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground h-5 w-5 flex items-center justify-center rounded hover:bg-muted cursor-pointer transition-colors"
              title="Close specifications"
              aria-label="Close specifications"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Role Selector: Frontend, Backend, Database, AI, Custom */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Node Role / Category</label>
        <div className="grid grid-cols-5 gap-1 p-1 bg-muted/60 rounded-lg border border-border/60">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isActive = formData.role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleChange("role", r.id)}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Node Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Component Label</label>
        <Input
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="e.g. Landing Page, Products DB, Auth API"
          className="h-8 text-xs font-medium"
        />
      </div>

      {/* What it does / Purpose */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">What this node does / Action</label>
        <Input
          value={formData.action}
          onChange={(e) => handleChange("action", e.target.value)}
          placeholder="e.g. Landing to navigate dashboard, SQL relational store..."
          className="h-8 text-xs font-medium"
        />
      </div>

      {/* Contextual Quick Presets based on chosen Role */}
      {formData.role === "database" && (
        <div className="space-y-1.5 p-2 rounded-lg bg-muted/40 border border-border">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
            Database Type Presets
          </span>
          <div className="flex flex-wrap gap-1">
            {[
              { label: "PostgreSQL (SQL)", action: "SQL Relational Store", tech: "PostgreSQL Master-Replica", protocol: "Postgres Wire", latency: "5.0ms" },
              { label: "MongoDB (NoSQL)", action: "Document Store", tech: "MongoDB Shards", protocol: "Mongo Wire", latency: "4.5ms" },
              { label: "Redis (Cache)", action: "In-Memory LRU Cache", tech: "Redis Cluster", protocol: "RESP (Redis)", latency: "0.8ms" },
              { label: "Amazon S3 (Storage)", action: "Blob / Object Store", tech: "Amazon S3", protocol: "HTTPS REST", latency: "25ms" },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    name: prev.name === "New Component" || prev.name === "Database Store" ? preset.label : prev.name,
                    action: preset.action,
                    tech: preset.tech,
                    protocol: preset.protocol,
                    latency: preset.latency,
                  }));
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-[#ffdf27]/40 transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {formData.role === "frontend" && (
        <div className="space-y-1.5 p-2 rounded-lg bg-muted/40 border border-border">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
            Frontend Presets
          </span>
          <div className="flex flex-wrap gap-1">
            {[
              { label: "Landing Page", action: "Public Landing to Navigate App", tech: "Next.js SSR", protocol: "HTTPS", qps: "80k req/s" },
              { label: "User Dashboard", action: "Main Interactive Dashboard", tech: "React SPA / Next.js", protocol: "HTTPS / WS", qps: "40k req/s" },
              { label: "Checkout Funnel", action: "Order & Payment Flow", tech: "Secure Stripe Flow", protocol: "HTTPS / TLS 1.3", qps: "25k req/s" },
              { label: "Mobile App Screen", action: "iOS / Android Mobile View", tech: "React Native", protocol: "HTTPS", qps: "50k req/s" },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    name: prev.name === "New Component" || prev.name === "Frontend UI" ? preset.label : prev.name,
                    action: preset.action,
                    tech: preset.tech,
                    protocol: preset.protocol,
                    qps: preset.qps,
                  }));
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-[#ffdf27]/40 transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {formData.role === "backend" && (
        <div className="space-y-1.5 p-2 rounded-lg bg-muted/40 border border-border">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
            Backend Presets
          </span>
          <div className="flex flex-wrap gap-1">
            {[
              { label: "API Gateway", action: "Routing & Rate Limiting", tech: "Envoy / Kong", protocol: "HTTP/2, gRPC", latency: "1.5ms" },
              { label: "Core Microservice", action: "Business Logic Service", tech: "Go / Node.js", protocol: "REST & gRPC", latency: "8.0ms" },
              { label: "Auth Service", action: "User Auth & JWT Tokens", tech: "OAuth 2.0 / Clerk", protocol: "HTTPS REST", latency: "4.0ms" },
              { label: "Background Worker", action: "Async Queue Job Worker", tech: "BullMQ / Temporal", protocol: "TCP / AMQP", latency: "12ms" },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    name: prev.name === "New Component" || prev.name === "Backend Service" ? preset.label : prev.name,
                    action: preset.action,
                    tech: preset.tech,
                    protocol: preset.protocol,
                    latency: preset.latency,
                  }));
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-[#ffdf27]/40 transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {formData.role === "ai" && (
        <div className="space-y-1.5 p-2 rounded-lg bg-muted/40 border border-border">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
            AI Model Presets
          </span>
          <div className="flex flex-wrap gap-1">
            {[
              { label: "Claude 3.5 Sonnet", action: "Reasoning & Agent Decisions", tech: "Anthropic API", latency: "380ms", protocol: "HTTPS Streaming" },
              { label: "OpenAI GPT-4o", action: "Multimodal LLM Agent", tech: "OpenAI API", latency: "420ms", protocol: "HTTPS Streaming" },
              { label: "RAG & Vector Agent", action: "Semantic Context Retrieval", tech: "Vector DB + LLM", latency: "250ms", protocol: "gRPC / HTTPS" },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    name: prev.name === "New Component" || prev.name === "AI Agent" ? preset.label : prev.name,
                    action: preset.action,
                    tech: preset.tech,
                    protocol: preset.protocol,
                    latency: preset.latency,
                  }));
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-[#ffdf27]/40 transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Technology / Framework */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Technology / Framework</label>
        <Input
          value={formData.tech}
          onChange={(e) => handleChange("tech", e.target.value)}
          placeholder="e.g. Next.js, PostgreSQL, Go, Claude 3.5"
          className="h-8 text-xs font-mono"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Protocol</label>
          <Select
            value={formData.protocol}
            onValueChange={(val) => handleChange("protocol", val)}
          >
            <SelectTrigger className="h-8 text-xs font-mono">
              <SelectValue placeholder="Protocol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HTTPS">HTTPS</SelectItem>
              <SelectItem value="HTTP/2 / HTTP/3">HTTP/2 / HTTP/3</SelectItem>
              <SelectItem value="gRPC / Protobuf">gRPC / Protobuf</SelectItem>
              <SelectItem value="WebSocket">WebSocket</SelectItem>
              <SelectItem value="Postgres Wire">Postgres Wire</SelectItem>
              <SelectItem value="RESP (Redis)">RESP (Redis)</SelectItem>
              <SelectItem value="Kafka Binary">Kafka Binary</SelectItem>
              <SelectItem value="TCP / UDP">TCP / UDP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Est. Latency / SLA</label>
          <Input
            value={formData.latency}
            onChange={(e) => handleChange("latency", e.target.value)}
            placeholder="e.g. 5.0ms"
            className="h-8 text-xs font-mono"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Architecture Notes</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="e.g. Handles checkout requests and sends confirmation emails..."
          className="text-xs min-h-[60px] resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/60">
        {onDeleteNode && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDeleteNode(selectedNode?.id)}
            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          className="h-8 ml-auto text-xs font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none shadow-xs cursor-pointer"
        >
          <Save className="h-3.5 w-3.5 mr-1 text-zinc-950" />
          Apply Changes
        </Button>
      </div>
    </form>
  );
}
