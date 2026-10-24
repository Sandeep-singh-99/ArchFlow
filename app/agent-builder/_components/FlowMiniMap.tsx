"use client";

import React from "react";
import { MiniMap } from "@xyflow/react";
import { useTheme } from "next-themes";

interface FlowMiniMapProps {
  className?: string;
}

export default function FlowMiniMap({ className = "" }: FlowMiniMapProps) {
  const [mounted, setMounted] = React.useState(false);
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  if (!mounted) {
    return null;
  }

  // Minimap node color
  const getNodeColor = (node: any) => {
    return isDark ? "#71717a" : "#94a3b8";
  };

  return (
    <MiniMap
      position="bottom-right"
      className={`!m-3.5 !rounded-xl !border !border-border/80 !bg-card/90 dark:!bg-zinc-900/90 !backdrop-blur-md !shadow-xl !overflow-hidden z-20 ${className}`}
      nodeColor={getNodeColor}
      nodeStrokeColor={isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.15)"}
      nodeStrokeWidth={1.5}
      nodeBorderRadius={4}
      maskColor={
        isDark
          ? "rgba(0, 0, 0, 0.65)"
          : "rgba(226, 232, 240, 0.7)"
      }
      maskStrokeColor={
        isDark
          ? "rgba(255, 223, 39, 0.5)"
          : "rgba(255, 223, 39, 0.6)"
      }
      maskStrokeWidth={1.5}
      bgColor="transparent"
      pannable
      zoomable
      style={{ width: 220, height: 140 }}
      ariaLabel="Canvas mini map overview"
    />
  );
}
