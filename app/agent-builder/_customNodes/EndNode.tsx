"use client";
import React from "react";
import { Handle, Position } from "@xyflow/react";
import { CheckCircle2 } from "lucide-react";

export default function EndNode({ data, selected }: any) {
  const label = data?.label || data?.name || data?.settings?.name || "End";

  return (
    <div
      className={`relative flex items-center gap-3 bg-gradient-to-r from-rose-500/15 via-card to-card backdrop-blur-sm pl-2 pr-5 py-2 shadow-md border transition-all rounded-full group ${
        selected
          ? "border-rose-500 ring-2 ring-rose-500/30 shadow-rose-500/15 shadow-lg"
          : "border-rose-500/40 hover:border-rose-500/80 hover:shadow-rose-500/10 hover:shadow-md"
      }`}
    >
      {/* Nested Circular Check/Terminal Icon */}
      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/30 shrink-0">
        <CheckCircle2 className="h-4.5 w-4.5 stroke-[2.5]" />
      </div>

      {/* Only End Text */}
      <span className="text-xs font-bold text-foreground tracking-wide select-none whitespace-nowrap">
        {label}
      </span>

      {/* ONLY Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        isConnectable={true}
        className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-background hover:scale-125 hover:bg-rose-400 transition-all cursor-crosshair z-30 shadow-xs"
      />
    </div>
  );
}
