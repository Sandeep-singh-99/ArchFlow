"use client";
import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Play } from "lucide-react";

export default function StartNode({ data, selected }: any) {
  const label = data?.label || data?.name || data?.settings?.name || "Start";

  return (
    <div
      className={`relative flex items-center gap-3 bg-gradient-to-r from-emerald-500/15 via-card to-card backdrop-blur-sm pl-2 pr-5 py-2 shadow-md border transition-all rounded-l-full rounded-r-2xl group ${
        selected
          ? "border-emerald-500 ring-2 ring-emerald-500/30 shadow-emerald-500/15 shadow-lg"
          : "border-emerald-500/40 hover:border-emerald-500/80 hover:shadow-emerald-500/10 hover:shadow-md"
      }`}
    >
      {/* Left Half Curve: Nested Circular Play Icon */}
      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-zinc-950 flex items-center justify-center shadow-md shadow-emerald-500/30 shrink-0">
        <Play className="h-4 w-4 fill-zinc-950 ml-0.5 stroke-[2.5]" />
      </div>

      {/* Only Start Text */}
      <span className="text-xs font-bold text-foreground tracking-wide select-none whitespace-nowrap">
        {label}
      </span>

      {/* ONLY Right and Down (Bottom) Handles */}
      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        isConnectable={true}
        className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background hover:scale-125 hover:bg-emerald-400 transition-all cursor-crosshair z-30 shadow-xs"
      />

      {/* Down (Bottom) Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable={true}
        className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background hover:scale-125 hover:bg-emerald-400 transition-all cursor-crosshair z-30 shadow-xs"
      />
    </div>
  );
}
