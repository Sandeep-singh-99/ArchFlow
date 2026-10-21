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
import { Save, Sliders, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  selectedNode: any;
  updateFormData: (formData: any) => void;
  onDeleteNode?: (nodeId: string) => void;
}

export default function SystemNodeSettings({
  selectedNode,
  updateFormData,
  onDeleteNode,
}: Props) {
  const [formData, setFormData] = useState({
    name: "",
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
        name: selectedNode.data?.label || selectedNode.data?.name || "System Node",
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
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold text-foreground">Node Specifications</h3>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border">
          {selectedNode?.type || "Node"}
        </Badge>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Component Label</label>
        <Input
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="e.g. Order Processing Service"
          className="h-8 text-xs font-medium"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Technology / Framework</label>
        <Input
          value={formData.tech}
          onChange={(e) => handleChange("tech", e.target.value)}
          placeholder="e.g. Envoy Proxy / Go Microservice"
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
              <SelectItem value="HTTPS / HTTP/3">HTTPS / HTTP/3</SelectItem>
              <SelectItem value="gRPC / Protobuf">gRPC / Protobuf</SelectItem>
              <SelectItem value="WebSocket">WebSocket</SelectItem>
              <SelectItem value="Kafka Binary">Kafka Binary</SelectItem>
              <SelectItem value="RESP (Redis)">RESP (Redis)</SelectItem>
              <SelectItem value="Postgres Wire">Postgres Wire</SelectItem>
              <SelectItem value="AMQP (RabbitMQ)">AMQP (RabbitMQ)</SelectItem>
              <SelectItem value="TCP / UDP">TCP / UDP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Est. Latency</label>
          <Input
            value={formData.latency}
            onChange={(e) => handleChange("latency", e.target.value)}
            placeholder="e.g. 3.5ms"
            className="h-8 text-xs font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Throughput / QPS</label>
          <Input
            value={formData.qps}
            onChange={(e) => handleChange("qps", e.target.value)}
            placeholder="e.g. 50k req/s"
            className="h-8 text-xs font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Redundancy</label>
          <Select
            value={formData.redundancy}
            onValueChange={(val) => handleChange("redundancy", val)}
          >
            <SelectTrigger className="h-8 text-xs font-mono">
              <SelectValue placeholder="Redundancy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Multi-AZ Active">Multi-AZ Active</SelectItem>
              <SelectItem value="Active-Standby">Active-Standby</SelectItem>
              <SelectItem value="Single Instance">Single Instance</SelectItem>
              <SelectItem value="Kubernetes HPA">Kubernetes HPA</SelectItem>
              <SelectItem value="Global Anycast">Global Anycast</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Trade-offs & Architecture Notes</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="e.g. Partitioned across 12 Kafka topics to handle peak write spikes..."
          className="text-xs min-h-[70px] resize-none"
        />
      </div>

      <div className="pt-2 flex items-center justify-between gap-2">
        {onDeleteNode && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDeleteNode(selectedNode?.id)}
            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          className="h-8 ml-auto text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950"
        >
          <Save className="h-3.5 w-3.5 mr-1" />
          Apply
        </Button>
      </div>
    </form>
  );
}
