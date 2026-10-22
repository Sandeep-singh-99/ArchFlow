"use client";
import { WorkflowContext } from "@/context/WorkflowContext";
import { Plus, Type } from "lucide-react";
import React, { useContext } from "react";
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
          action: "",
          tech: "",
          protocol: "HTTPS",
          latency: "5.0ms",
          qps: "50k req/s",
          notes: "",
        },
      },
      type: "CustomNode",
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
  };

  const onAddTextNode = () => {
    const randomOffset = Math.floor(Math.random() * 50);
    const newTextNode = {
      id: `text-node-${Date.now()}`,
      type: "TextNode",
      position: { x: 280 + randomOffset, y: 160 + randomOffset },
      style: { width: 180, height: 60 },
      data: {
        text: "",
        label: "Text",
        fontSize: "base",
        type: "TextNode",
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newTextNode]);
  };

  return (
    <div className="bg-card/90 backdrop-blur-md border border-border/80 p-1.5 rounded-xl shadow-xl flex flex-col gap-1.5 w-[144px]">
      <Button
        onClick={onAddCustomNode}
        size="sm"
        className="w-full justify-start gap-2 font-semibold text-xs bg-white text-black hover:bg-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-sm cursor-pointer h-8 px-2.5 transition-all active:scale-95"
      >
        <Plus className="h-3.5 w-3.5 stroke-[2.5] text-black shrink-0" />
        <span>Add Node</span>
      </Button>

      <Button
        onClick={onAddTextNode}
        size="sm"
        variant="outline"
        className="w-full justify-start gap-2 font-semibold text-xs border-border shadow-xs cursor-pointer h-8 px-2.5 transition-all active:scale-95 hover:bg-muted"
      >
        <Type className="h-3.5 w-3.5 text-primary shrink-0" />
        <span>Add Text</span>
      </Button>
    </div>
  );
}
