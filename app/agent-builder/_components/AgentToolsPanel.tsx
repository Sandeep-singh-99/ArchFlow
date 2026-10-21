"use client";
import { WorkflowContext } from "@/context/WorkflowContext";
import { Plus } from "lucide-react";
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
          action: "Landing Page / UI",
          tech: "Next.js / React",
          protocol: "HTTPS",
          latency: "5.0ms",
          dbFormat: "sql",
          dbTableName: "users_table",
          dbFields: [
            { id: "f-1", name: "id", type: "UUID PRIMARY KEY" },
            { id: "f-2", name: "email", type: "VARCHAR(255) UNIQUE" },
          ],
          dbDescription: "",
          dbData: "",
          notes: "",
        },
      },
      type: "CustomNode",
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
  };

  return (
    <div className="bg-card/90 backdrop-blur-md border border-border/80 p-1.5 rounded-xl shadow-xl flex items-center">
      <Button
        onClick={onAddCustomNode}
        size="sm"
        className="gap-2 font-semibold text-xs bg-white text-black hover:bg-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-sm cursor-pointer h-8 px-3.5 transition-all active:scale-95"
      >
        <Plus className="h-3.5 w-3.5 stroke-[2.5] text-black" />
        <span>Add Node</span>
      </Button>
    </div>
  );
}
