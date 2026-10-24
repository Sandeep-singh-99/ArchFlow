"use client";

import React, { useContext } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Position,
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
import { ChevronDown } from "lucide-react";

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

/**
 * Calculates a fixed offset point directly outward from the handle face.
 * This guarantees the marker (1 or N) is ALWAYS positioned outside the node
 * on the visible edge line, regardless of where nodes are dragged or moved.
 */
function getHandleOutwardPoint(
  x: number,
  y: number,
  position: Position | string,
  offset = 24
) {
  switch (position) {
    case Position.Right:
      return { x: x + offset, y };
    case Position.Left:
      return { x: x - offset, y };
    case Position.Top:
      return { x, y: y - offset };
    case Position.Bottom:
      return { x, y: y + offset };
    default:
      return { x: x + offset, y };
  }
}

export default function ErRelationshipEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
  style = {},
  markerEnd,
  label,
  data,
  selected,
}: EdgeProps) {
  const { setNodeEdges } = useContext(WorkflowContext);

  const isSelf = source === target;

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (isSelf) {
    // Self-referencing relationship (connecting columns on its own node)
    const loopOffset = 55;
    const dy = targetY - sourceY;

    if (sourcePosition === Position.Right && targetPosition === Position.Right) {
      // Loop out to the right of the node
      const maxX = Math.max(sourceX, targetX) + loopOffset;
      edgePath = `M ${sourceX} ${sourceY} C ${maxX} ${sourceY}, ${maxX} ${targetY}, ${targetX} ${targetY}`;
      labelX = maxX + 10;
      labelY = (sourceY + targetY) / 2;
    } else if (sourcePosition === Position.Left && targetPosition === Position.Left) {
      // Loop out to the left of the node
      const minX = Math.min(sourceX, targetX) - loopOffset;
      edgePath = `M ${sourceX} ${sourceY} C ${minX} ${sourceY}, ${minX} ${targetY}, ${targetX} ${targetY}`;
      labelX = minX - 10;
      labelY = (sourceY + targetY) / 2;
    } else {
      // Loop around node via smooth step
      const [path, lx, ly] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 14,
        offset: 35,
      });
      edgePath = path;
      labelX = lx;
      labelY = ly;
    }
  } else {
    // Normal node-to-node edge with responsive smooth routing
    const [path, lx, ly] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 10,
    });
    edgePath = path;
    labelX = lx;
    labelY = ly;
  }

  // Compute fixed outward positions for 1 and N so they NEVER hide when moving nodes
  const sourcePoint = getHandleOutwardPoint(sourceX, sourceY, sourcePosition, 22);
  const targetPoint = getHandleOutwardPoint(targetX, targetY, targetPosition, 22);

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
          const baseLabel = typeof e.label === "string"
            ? e.label.replace(/^(1:1|1:N|N:M|N:1|\|\|—\|\{|\|\|—o\{|\|\|—\|\|)\s*/, "").trim()
            : "";
          const newLabel = baseLabel
            ? `${CARDINALITY_CONFIG[newType].label} ${baseLabel}`
            : CARDINALITY_CONFIG[newType].label;
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
        {/* Source Cardinality Marker (1 / ||) - Always outside handle with high z-index */}
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${sourcePoint.x}px,${sourcePoint.y}px)`,
            zIndex: 1000,
          }}
          className="pointer-events-none select-none transition-transform"
        >
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-background text-foreground border border-border shadow-md">
            {config.source}
          </span>
        </div>

        {/* Target Cardinality Marker (N / M / |{) - Always outside handle with high z-index */}
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${targetPoint.x}px,${targetPoint.y}px)`,
            zIndex: 1000,
          }}
          className="pointer-events-none select-none transition-transform"
        >
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-background text-foreground border border-border shadow-md">
            {config.target}
          </span>
        </div>

        {/* Center Interactive Cardinality Pill */}
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            zIndex: 1001,
          }}
          className="nodrag nopan pointer-events-auto"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`group flex items-center gap-1 px-2 py-0.8 rounded-full border text-[11px] font-mono font-semibold shadow-md bg-card/95 backdrop-blur-md cursor-pointer transition-all hover:scale-105 ${config.badgeColor} ${
                  selected ? "ring-2 ring-primary/40 shadow-lg" : ""
                }`}
                title="Click to customize relationship cardinality (1:1, 1:N, N:M, Crow's Foot)"
              >
                <span>{config.label}</span>
                {relationshipTitle && !relationshipTitle.includes(config.label) && (
                  <span className="text-[10px] text-foreground/80 font-sans font-normal truncate max-w-[120px]">
                    {relationshipTitle}
                  </span>
                )}
                <ChevronDown className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="center" className="w-64 p-1.5 text-xs font-mono z-[1100]">
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
