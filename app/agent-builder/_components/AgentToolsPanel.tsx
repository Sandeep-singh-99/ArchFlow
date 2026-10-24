"use client";

import React, { useContext } from "react";
import { WorkflowContext } from "@/context/WorkflowContext";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function AgentToolsPanel() {
  const { setAddedNodes } = useContext(WorkflowContext);

  const onAddNode = () => {
    const randomOffset = Math.floor(Math.random() * 50);
    const newNode = {
      id: `node-${Date.now()}`,
      position: { x: 260 + randomOffset, y: 140 + randomOffset },
      data: {
        label: "New Node",
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
  };

  return (
    <div className="bg-card/90 backdrop-blur-md border border-border/80 p-1 rounded-xl shadow-xl flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddNode}
            className="h-8 gap-2 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all cursor-pointer font-medium text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Node</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs font-medium">
          Add a fresh node to canvas
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
