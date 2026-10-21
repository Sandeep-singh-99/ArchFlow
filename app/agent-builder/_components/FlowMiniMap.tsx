"use client";

import React, { useState } from "react";
import { MiniMap } from "@xyflow/react";
import { useTheme } from "next-themes";
import { Layers, Minimize2, Maximize2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FlowMiniMapProps {
  onClose?: () => void;
  nodeCount?: number;
  className?: string;
}

export default function FlowMiniMap({
  onClose,
  nodeCount = 0,
  className = "",
}: FlowMiniMapProps) {
  const { resolvedTheme } = useTheme();
  const [isMinimized, setIsMinimized] = useState(false);

  const isDark = resolvedTheme === "dark";

  // Categorized architectural node colors for the radar minimap
  const getNodeColor = (node: any) => {
    const type = node?.type;
    switch (type) {
      case "FrontendNode":
      case "ClientNode":
      case "MobileNode":
        return "#10b981"; // emerald
      case "AiAgentNode":
      case "AgentNode":
        return "#8b5cf6"; // purple / violet
      case "GatewayNode":
      case "LoadBalancerNode":
      case "RateLimiterNode":
        return "#f43f5e"; // rose
      case "ServiceNode":
      case "ServerlessNode":
      case "WorkerNode":
        return "#3b82f6"; // blue
      case "DatabaseNode":
      case "VectorDbNode":
      case "CacheNode":
      case "StorageNode":
        return "#f59e0b"; // amber
      case "DnsNode":
      case "CdnNode":
      case "CloudInfraNode":
        return "#06b6d4"; // cyan
      case "MonitoringNode":
      case "QueueNode":
        return "#6366f1"; // indigo
      default:
        return isDark ? "#71717a" : "#94a3b8"; // zinc / slate
    }
  };

  return (
    <div
      className={`border border-border/80 bg-card/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/25 flex flex-col transition-all duration-200 ${className}`}
    >
      {/* MiniMap Title Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/70 bg-muted/40">
        <div className="flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-foreground/80">
            Map
          </span>
          {nodeCount > 0 && (
            <Badge
              variant="outline"
              className="text-[9px] font-mono px-1 py-0 h-3.5 border-border text-muted-foreground"
            >
              {nodeCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized((prev) => !prev)}
            className="text-muted-foreground hover:text-foreground h-4 w-4 flex items-center justify-center rounded hover:bg-muted cursor-pointer transition-colors"
            title={isMinimized ? "Expand MiniMap" : "Minimize MiniMap"}
            aria-label={isMinimized ? "Expand MiniMap" : "Minimize MiniMap"}
          >
            {isMinimized ? (
              <Maximize2 className="h-2.5 w-2.5" />
            ) : (
              <Minimize2 className="h-2.5 w-2.5" />
            )}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground h-4 w-4 flex items-center justify-center rounded hover:bg-muted cursor-pointer transition-colors"
              title="Close MiniMap"
              aria-label="Close MiniMap"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* MiniMap SVG Body */}
      {!isMinimized && (
        <div className="w-[180px] h-[120px] sm:w-[200px] sm:h-[130px] relative overflow-hidden bg-card/50 dark:bg-zinc-950/40">
          <MiniMap
            style={{ width: "100%", height: "100%", margin: 0, position: "static" }}
            nodeColor={getNodeColor}
            nodeStrokeColor={isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"}
            nodeStrokeWidth={1}
            nodeBorderRadius={4}
            maskColor={
              isDark
                ? "rgba(0, 0, 0, 0.65)"
                : "rgba(226, 232, 240, 0.7)"
            }
            maskStrokeColor={
              isDark
                ? "rgba(16, 185, 129, 0.4)"
                : "rgba(16, 185, 129, 0.5)"
            }
            maskStrokeWidth={1.5}
            bgColor="transparent"
            pannable
            zoomable
            className="!m-0 !border-none !shadow-none !rounded-none"
          />
        </div>
      )}
    </div>
  );
}
