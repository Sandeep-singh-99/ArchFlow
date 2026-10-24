"use client";

import React, { useState, useContext } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { WorkflowContext } from "@/context/WorkflowContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GitFork, Link2, Sparkles, ChevronDown } from "lucide-react";

export type CardinalityType =
  | "1:N"
  | "1:1"
  | "N:M"
  | "N:1"
  | "crows-one-many"
  | "crows-zero-many"
  | "crows-one-one";

const CARDINALITY_CONFIG: Record<
  string,
  { label: string; source: string; target: string; desc: string; badgeColor: string }
> = {
  "1:N": {
    label: "1:N",
    source: "1",
    target: "N",
    desc: "One-to-Many (e.g. Users ➔ Orders)",
    badgeColor: "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/30",
  },
  "1:1": {
    label: "1:1",
    source: "1",
    target: "1",
    desc: "One-to-One (e.g. User ➔ Profile)",
    badgeColor: "bg-sky-500/15 text-sky-500 dark:text-sky-400 border-sky-500/30",
  },
  "N:M": {
    label: "N:M",
    source: "N",
    target: "M",
    desc: "Many-to-Many (e.g. Products ➔ Categories)",
    badgeColor: "bg-purple-500/15 text-purple-500 dark:text-purple-400 border-purple-500/30",
  },
  "N:1": {
    label: "N:1",
    source: "N",
    target: "1",
    desc: "Many-to-One",
    badgeColor: "bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30",
  },
  "crows-one-many": {
    label: "||—|{",
    source: "||",
    target: "|{",
    desc: "Crow's Foot: One to Mandatory Many",
    badgeColor: "bg-teal-500/15 text-teal-500 dark:text-teal-400 border-teal-500/30",
  },
  "crows-zero-many": {
    label: "||—o{",
    source: "||",
    target: "o{",
    desc: "Crow's Foot: One to Optional Many",
    badgeColor: "bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 border-indigo-500/30",
  },
  "crows-one-one": {
    label: "||—||",
    source: "||",
    target: "||",
    desc: "Crow's Foot: Exactly One to One",
    badgeColor: "bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border-cyan-500/30",
  },
};

export default function ErRelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
  selected,
}: EdgeProps) {
  const { setNodeEdges } = useContext(WorkflowContext);

  // Compute smooth ER step path
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  // Calculate endpoint marker positions along the path
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const angle = Math.atan2(dy, dx);

  const sourceMarkerX = sourceX + Math.cos(angle) * 26;
  const sourceMarkerY = sourceY + Math.sin(angle) * 26;
  const targetMarkerX = targetX - Math.cos(angle) * 26;
  const targetMarkerY = targetY - Math.sin(angle) * 26;

  // Determine active cardinality
  let rawCardinality = (data as any)?.cardinality;
  if (!rawCardinality && label) {
    if (String(label).includes("1:N")) rawCardinality = "1:N";
    else if (String(label).includes("1:1")) rawCardinality = "1:1";
    else if (String(label).includes("N:M")) rawCardinality = "N:M";
    else if (String(label).includes("N:1")) rawCardinality = "N:1";
  }
  const activeCardinality = rawCardinality && CARDINALITY_CONFIG[rawCardinality] ? rawCardinality : "1:N";
  const config = CARDINALITY_CONFIG[activeCardinality];

  const handleSelectCardinality = (newType: string) => {
    setNodeEdges((eds: any[]) =>
      (eds || []).map((e: any) => {
        if (e.id === id) {
          const baseLabel = typeof e.label === "string" ? e.label.replace(/^(1:1|1:N|N:M|N:1|\|\|—\|\{|\|\|—o\{|\|\|—\|\|)\s*/, "").trim() : "";
          const newLabel = baseLabel ? `${CARDINALITY_CONFIG[newType].label} ${baseLabel}` : CARDINALITY_CONFIG[newType].label;
          return {
            ...e,
            label: newLabel,
            data: {
              ...(e.data || {}),
              cardinality: newType,
            },
          };
        }
        return e;
      })
    );
  };

  const relationshipTitle = typeof label === "string" ? label : (data as any)?.title || config.desc;

  return (
    <>
      {/* Base connecting line */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          strokeWidth: selected ? 2.5 : 2,
          stroke: selected ? "#10b981" : "#059669",
          ...style,
        }}
        markerEnd={markerEnd}
      />

      {/* Edge Labels & Interactive Cardinality Pill */}
      <EdgeLabelRenderer>
        {/* Source Cardinality Marker (e.g. 1 or ||) */}
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${sourceMarkerX}px,${sourceMarkerY}px)`,
          }}
          className="pointer-events-none select-none z-10"
        >
          <span className="px-1 py-0.2 rounded text-[9.5px] font-mono font-bold bg-background/90 text-foreground border border-border shadow-xs backdrop-blur-xs">
            {config.source}
          </span>
        </div>

        {/* Target Cardinality Marker (e.g. N or |{) */}
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${targetMarkerX}px,${targetMarkerY}px)`,
          }}
          className="pointer-events-none select-none z-10"
        >
          <span className="px-1 py-0.2 rounded text-[9.5px] font-mono font-bold bg-background/90 text-foreground border border-border shadow-xs backdrop-blur-xs">
            {config.target}
          </span>
        </div>

        {/* Center Interactive Cardinality Pill */}
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          className="nodrag nopan pointer-events-auto z-20"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`group flex items-center gap-1 px-2 py-0.8 rounded-full border text-[11px] font-mono font-semibold shadow-xs backdrop-blur-md cursor-pointer transition-all hover:scale-105 ${config.badgeColor} ${
                  selected ? "ring-2 ring-primary/40 shadow-sm" : ""
                }`}
                title="Click to change relationship cardinality (1:1, 1:N, N:M, Crow's Foot)"
              >
                <span>{config.label}</span>
                {relationshipTitle && !relationshipTitle.includes(config.label) && (
                  <span className="text-[10px] text-foreground/80 font-sans font-normal truncate max-w-[100px]">
                    {relationshipTitle}
                  </span>
                )}
                <ChevronDown className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="center" className="w-60 p-1.5 text-xs font-mono">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1">
                Relationship Cardinality
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {Object.entries(CARDINALITY_CONFIG).map(([key, item]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleSelectCardinality(key)}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-xs ${
                    activeCardinality === key ? "bg-muted font-bold text-primary" : "text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-bold border border-border">
                      {item.label}
                    </span>
                    <span className="font-sans text-[11px] text-muted-foreground">
                      {item.desc}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
