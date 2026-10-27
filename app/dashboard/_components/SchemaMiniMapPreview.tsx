"use client";

import React, { useMemo } from "react";
import { Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface SchemaMiniMapPreviewProps {
  nodes?: any[];
  edges?: any[];
  className?: string;
}

export default function SchemaMiniMapPreview({
  nodes = [],
  edges = [],
  className = "",
}: SchemaMiniMapPreviewProps) {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeEdges = Array.isArray(edges) ? edges : [];

  // Compute node coordinates and mini-map bounding box
  const { processedNodes, processedEdges, viewBox, hasNodes } = useMemo(() => {
    if (safeNodes.length === 0) {
      return {
        processedNodes: [],
        processedEdges: [],
        viewBox: "0 0 600 320",
        hasNodes: false,
      };
    }

    // Build lookup map for resolving relative parent coordinates
    const nodeMap = new Map<string, any>();
    safeNodes.forEach((n) => {
      if (n && n.id) nodeMap.set(n.id, n);
    });

    const resolved = safeNodes.map((node) => {
      let x = node.position?.x ?? 0;
      let y = node.position?.y ?? 0;

      // If child of a domain container, resolve absolute coordinate
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId);
        x += parent.position?.x ?? 0;
        y += parent.position?.y ?? 0;
      }

      const isDomain =
        node.type === "DomainGroupNode" ||
        node.type === "DomainGroup" ||
        node.type === "domainGroup" ||
        node.type === "group" ||
        node.data?.isDomainGroup;

      const isTable =
        node.type === "SqlTableNode" ||
        node.type === "Table" ||
        node.type === "NosqlCollectionNode" ||
        node.type === "Collection";

      const width =
        node.style?.width ?? (isDomain ? 540 : isTable ? 230 : 180);
      const height =
        node.style?.height ??
        (isDomain
          ? 360
          : isTable
            ? Math.min(220, 68 + (node.data?.columns?.length ?? 2) * 16)
            : 110);

      const label =
        node.data?.label ||
        node.data?.name ||
        node.data?.title ||
        node.type ||
        "Entity";

      const schema = node.data?.schema || (isTable ? "public" : "");

      return {
        id: node.id,
        node,
        isDomain,
        isTable,
        type: node.type,
        x,
        y,
        width,
        height,
        label: String(label),
        schema: String(schema),
        columns: Array.isArray(node.data?.columns) ? node.data.columns : [],
      };
    });

    // Compute bounding box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    resolved.forEach((item) => {
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + item.width);
      maxY = Math.max(maxY, item.y + item.height);
    });

    if (minX === Infinity) {
      minX = 0;
      minY = 0;
      maxX = 600;
      maxY = 320;
    }

    const padding = 36;
    const computedWidth = Math.max(480, maxX - minX + padding * 2);
    const computedHeight = Math.max(260, maxY - minY + padding * 2);

    const adjustedMinX = minX - padding;
    const adjustedMinY = minY - padding;

    // Process edges to find start and end points
    const resolvedMap = new Map<string, (typeof resolved)[0]>();
    resolved.forEach((item) => resolvedMap.set(item.id, item));

    const processedEdgesList = safeEdges
      .map((edge) => {
        const sourceNode = resolvedMap.get(edge.source);
        const targetNode = resolvedMap.get(edge.target);
        if (!sourceNode || !targetNode) return null;

        const sx = sourceNode.x + sourceNode.width;
        const sy = sourceNode.y + sourceNode.height / 2;
        const tx = targetNode.x;
        const ty = targetNode.y + targetNode.height / 2;

        const dx = Math.abs(tx - sx);
        const controlOffset = Math.max(30, dx * 0.4);

        const d = `M ${sx} ${sy} C ${sx + controlOffset} ${sy}, ${tx - controlOffset} ${ty}, ${tx} ${ty}`;

        return {
          id: edge.id || `${edge.source}-${edge.target}`,
          d,
          cardinality: edge.data?.cardinality || edge.label || "",
        };
      })
      .filter(Boolean);

    // Separate domains (draw first) and entity nodes (draw on top)
    const domainNodes = resolved.filter((n) => n.isDomain);
    const regularNodes = resolved.filter((n) => !n.isDomain);

    return {
      processedNodes: [...domainNodes, ...regularNodes],
      processedEdges: processedEdgesList as any[],
      viewBox: `${adjustedMinX} ${adjustedMinY} ${computedWidth} ${computedHeight}`,
      hasNodes: true,
    };
  }, [safeNodes, safeEdges]);

  if (!hasNodes) {
    return (
      <div
        className={cn(
          "w-full h-28 rounded-lg border border-dashed border-border/70 bg-muted/20 relative flex flex-col items-center justify-center text-center p-3 overflow-hidden select-none",
          className
        )}
      >
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
            backgroundSize: "14px 14px",
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-1 text-muted-foreground/70">
          <Database className="h-4 w-4" />
          <span className="text-[10px] font-mono">Empty Schema</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full h-28 rounded-lg border border-border/70 bg-background/95 dark:bg-zinc-950 relative overflow-hidden transition-all duration-150",
        className
      )}
    >
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full p-1 pointer-events-none"
      >
        <defs>
          <pattern
            id="thumb-grid"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.2" fill="#71717a" opacity="0.18" />
          </pattern>
        </defs>

        {/* Grid Background */}
        <rect
          x="-5000"
          y="-5000"
          width="10000"
          height="10000"
          fill="url(#thumb-grid)"
        />

        {/* Edges / Relationship Paths */}
        {processedEdges.map((edge) => (
          <g key={edge.id}>
            <path
              d={edge.d}
              fill="none"
              stroke="#ffdf27"
              strokeWidth="2.5"
              strokeOpacity="0.75"
              strokeDasharray="4 2"
            />
          </g>
        ))}

        {/* Nodes */}
        {processedNodes.map((n) => {
          if (n.isDomain) {
            return (
              <g key={n.id}>
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.width}
                  height={n.height}
                  rx="10"
                  fill="rgba(99, 102, 241, 0.07)"
                  stroke="rgba(129, 140, 248, 0.45)"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
                <rect
                  x={n.x + 10}
                  y={n.y + 10}
                  width={Math.min(n.width - 20, 130)}
                  height="20"
                  rx="4"
                  fill="#6366f1"
                  fillOpacity="0.85"
                />
                <text
                  x={n.x + 16}
                  y={n.y + 24}
                  fontSize="10"
                  fontWeight="bold"
                  fill="#ffffff"
                  fontFamily="monospace"
                >
                  {n.label.length > 18 ? n.label.slice(0, 18) + "..." : n.label}
                </text>
              </g>
            );
          }

          const isCollection =
            n.type === "NosqlCollectionNode" || n.type === "Collection";
          const isView = n.type === "SqlViewNode" || n.type === "View";
          const isIndex =
            n.type === "SqlIndexNode" ||
            n.type === "NosqlIndexNode" ||
            n.type === "Index";

          const headerColor = isCollection
            ? "#f59e0b"
            : isView
              ? "#8b5cf6"
              : isIndex
                ? "#06b6d4"
                : "#10b981";

          const displayLabel =
            n.label.length > 18 ? n.label.slice(0, 18) + "…" : n.label;

          const rowsToDisplay = Math.min(3, n.columns.length || 2);

          return (
            <g key={n.id}>
              {/* Card Container */}
              <rect
                x={n.x}
                y={n.y}
                width={n.width}
                height={n.height}
                rx="8"
                fill="#18181b"
                stroke="#3f3f46"
                strokeWidth="1.5"
              />

              {/* Header banner */}
              <rect
                x={n.x}
                y={n.y}
                width={n.width}
                height="24"
                rx="8"
                fill={headerColor}
                fillOpacity="0.9"
              />
              <rect
                x={n.x}
                y={n.y + 16}
                width={n.width}
                height="8"
                fill={headerColor}
                fillOpacity="0.9"
              />

              {/* Header Label Text */}
              <text
                x={n.x + 8}
                y={n.y + 16}
                fontSize="11"
                fontWeight="bold"
                fill="#ffffff"
                fontFamily="system-ui, sans-serif"
              >
                {displayLabel}
              </text>

              {/* Miniature Columns */}
              {Array.from({ length: rowsToDisplay }).map((_, rIdx) => {
                const col = n.columns[rIdx];
                const isPk = col?.isPk;
                const isFk = col?.isFk;
                const rowY = n.y + 34 + rIdx * 15;

                return (
                  <g key={rIdx}>
                    <circle
                      cx={n.x + 10}
                      cy={rowY + 4}
                      r="2.5"
                      fill={isPk ? "#ffdf27" : isFk ? "#38bdf8" : "#71717a"}
                    />
                    <rect
                      x={n.x + 18}
                      y={rowY}
                      width={Math.max(40, (n.width - 34) * (0.6 + (rIdx % 3) * 0.15))}
                      height="7"
                      rx="2"
                      fill="#3f3f46"
                      opacity="0.8"
                    />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
