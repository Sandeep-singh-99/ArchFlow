"use client";
import { WorkflowContext } from "@/context/WorkflowContext";
import { Type, Boxes, Menu } from "lucide-react";
import React, { useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
    <div className="bg-card/90 backdrop-blur-md border border-border/80 p-1 rounded-xl shadow-xl flex items-center">
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all cursor-pointer"
                aria-label="Add components menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">
            Add Components & Nodes
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent
          align="start"
          side="bottom"
          sideOffset={8}
          className="w-52 p-1.5 shadow-2xl border-border bg-card/95 backdrop-blur-md rounded-xl z-50 animate-in fade-in zoom-in-95"
        >
          <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 py-1">
            Canvas Components
          </DropdownMenuLabel>

          <DropdownMenuItem
            onClick={onAddCustomNode}
            className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-muted transition-colors"
          >
            <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-foreground">Architecture Node</div>
              <div className="text-[10px] text-muted-foreground">Frontend, Backend, DB, AI</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 bg-border/60" />

          <DropdownMenuItem
            onClick={onAddTextNode}
            className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-muted transition-colors"
          >
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500 shrink-0">
              <Type className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-foreground">Text Node</div>
              <div className="text-[10px] text-muted-foreground">Transparent canvas note</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
