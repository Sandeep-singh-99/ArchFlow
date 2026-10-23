"use client";
import React from "react";
import { Handle, Position } from "@xyflow/react";

export default function IfElseNode({ data, selected }: any) {
  const label = data?.label || data?.name || data?.settings?.name || "If / Else";

  return (
    <div
      className={`relative w-[180px] h-[130px] flex items-center justify-center transition-all group ${
        selected ? "filter drop-shadow-md" : ""
      }`}
    >
      {/* SVG Flowchart Diamond Symbol */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none transition-all overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="50,2 98,50 50,98 2,50"
          className={`${
            selected
              ? "fill-card stroke-foreground stroke-[2.5]"
              : "fill-card stroke-border group-hover:stroke-border/80 stroke-1.5"
          } transition-all`}
        />
      </svg>

      {/* Decision Content: Only "If / Else" text centered (No icon, No condition check) */}
      <div className="relative z-10 flex items-center justify-center text-center pointer-events-none select-none">
        <span className="text-xs font-bold text-foreground tracking-wide select-none whitespace-nowrap">
          {label}
        </span>
      </div>

      {/* Exactly 3 Handles: Top = Input, Right = True, Left = False (Down dot removed) */}
      {/* Top Input Handle (Incoming from another node) */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={true}
        className="w-3.5 h-3.5 rounded-full bg-zinc-400 dark:bg-zinc-500 border-2 border-background hover:scale-125 hover:bg-foreground/70 transition-all cursor-crosshair z-30 shadow-xs"
      />

      {/* Left Output Handle (False) */}
      <Handle
        type="source"
        position={Position.Left}
        id="false"
        isConnectable={true}
        className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-background hover:scale-125 hover:bg-rose-400 transition-all cursor-crosshair z-30 shadow-xs"
      />

      {/* Right Output Handle (True) */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        isConnectable={true}
        className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background hover:scale-125 hover:bg-emerald-400 transition-all cursor-crosshair z-30 shadow-xs"
      />
    </div>
  );
}
