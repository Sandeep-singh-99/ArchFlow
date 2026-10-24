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

  // Database architectural node colors for the canvas minimap
  const getNodeColor = (node: any) => {
    const type = node?.type || "";
    switch (type) {
      case "SqlTableNode":
      case "Table":
        return "#10b981"; // Emerald
      case "SqlViewNode":
      case "View":
        return "#06b6d4"; // Cyan
      case "SqlIndexNode":
      case "Index":
        return "#8b5cf6"; // Violet
      case "SqlFunctionNode":
      case "StoredFunction":
        return "#6366f1"; // Indigo
      case "SqlTriggerNode":
      case "Trigger":
        return "#f43f5e"; // Rose
      case "SqlEnumNode":
      case "Enum":
        return "#f59e0b"; // Amber
      case "NosqlCollectionNode":
      case "Collection":
        return "#10b981"; // Emerald
      case "NosqlDocumentNode":
      case "Document":
        return "#f59e0b"; // Amber
      case "NosqlIndexNode":
        return "#14b8a6"; // Teal
      case "NosqlReferenceNode":
      case "Reference":
        return "#0ea5e9"; // Sky
      case "NosqlEmbeddedNode":
      case "EmbeddedObject":
        return "#d946ef"; // Fuchsia
      case "NosqlValidationNode":
      case "ValidationSchema":
        return "#10b981"; // Emerald
      case "DbNoteNode":
      case "Note":
        return "#eab308"; // Yellow
      case "DbSchemaNode":
      case "Database":
      case "Schema":
        return "#3b82f6"; // Blue
      default:
        return isDark ? "#71717a" : "#94a3b8"; // Zinc / Slate
    }
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
          ? "rgba(10, 10, 15, 0.75)"
          : "rgba(240, 245, 250, 0.75)"
      }
    />
  );
}
