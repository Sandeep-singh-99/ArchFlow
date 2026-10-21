"use client";
import { WorkflowContext } from "@/context/WorkflowContext";
import { Sparkles, Plus } from "lucide-react";
import React, { useContext } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AgentToolsPanel() {
  const { setAddedNodes } = useContext(WorkflowContext);

  const onAddCustomNode = () => {
    const randomOffset = Math.floor(Math.random() * 50);
    const newNode = {
      id: `node-${Date.now()}`,
      position: { x: 260 + randomOffset, y: 140 + randomOffset },
      data: {
        label: "New Component",
        type: "CustomNode",
        settings: {
          name: "New Component",
          role: "frontend",
          action: "Landing Page / UI",
          tech: "Next.js / React",
          protocol: "HTTPS",
          latency: "5.0ms",
          notes: "",
        },
      },
      type: "CustomNode",
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
  };

  return (
    <div className="bg-card/95 backdrop-blur-md border border-border p-3.5 rounded-xl shadow-xl w-[220px] sm:w-[240px] flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#ffdf27]" />
          <h3 className="font-bold text-xs text-foreground uppercase tracking-wider font-mono">
            Canvas Node
          </h3>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-mono text-[#ffee72] border-[#ffdf27]/30 bg-[#ffc507]/10 px-1.5 py-0"
        >
          1 universal
        </Badge>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Add a customizable node to your architecture. You can control its role, purpose, and tech inside the inspector.
      </p>

      {/* The Single Add Node Button */}
      <Button
        onClick={onAddCustomNode}
        className="w-full gap-2 text-xs font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none shadow-xs cursor-pointer h-9"
      >
        <Plus className="h-4 w-4 text-zinc-950 font-bold" />
        <span>+ Add Node</span>
      </Button>

      {/* Footer Hint */}
      <div className="pt-2 border-t border-border/60 text-[10px] font-mono text-muted-foreground text-center">
        Full control in inspector
      </div>
    </div>
  );
}
