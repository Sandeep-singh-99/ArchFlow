"use client";
import React from "react";
import { Handle, Position } from "@xyflow/react";
import { GitFork } from "lucide-react";

export default function IfElseNode({ data, selected }: any) {
  const label = data?.label || data?.name || data?.settings?.name || "Check Condition";
  const condition = data?.condition || data?.settings?.condition || "";
  const trueLabel = data?.trueLabel || data?.settings?.trueLabel || "True";
  const falseLabel = data?.falseLabel || data?.settings?.falseLabel || "False";

  return (
    <div
      className={`relative w-[190px] h-[135px] flex items-center justify-center transition-all group ${
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
              ? "fill-card stroke-amber-500 stroke-[2.5]"
              : "fill-card stroke-amber-500/60 group-hover:stroke-amber-500 stroke-2"
          } transition-all`}
        />
      </svg>

      {/* Decision Content (Strictly centered inside the diamond) */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-7 max-w-[136px] pointer-events-none select-none">
        <div className="flex items-center gap-1 mb-0.5">
          <GitFork className="h-3 w-3 text-amber-500 shrink-0" />
          <span className="text-[9px] font-mono uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
            If / Else
          </span>
        </div>
        <h3 className="text-xs font-bold text-foreground leading-snug line-clamp-2">
          {label}
        </h3>
        {condition && (
          <span className="mt-0.5 text-[8.5px] font-mono text-muted-foreground truncate max-w-[110px] opacity-80">
            {condition}
          </span>
        )}
      </div>

      {/* Flowchart Branch Badges */}
      {/* True Branch Label near Right Vertex */}
      <span className="absolute right-2.5 top-6 -translate-y-full text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1 py-0.2 rounded shadow-2xs pointer-events-none whitespace-nowrap">
        {trueLabel} ➔
      </span>

      {/* False Branch Label near Bottom Vertex */}
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/25 px-1 py-0.2 rounded shadow-2xs pointer-events-none whitespace-nowrap">
        ↓ {falseLabel}
      </span>

      {/* Handles (Positioned on the 4 diamond vertex points) */}
      {/* Left Input Handle (on left apex) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={true}
        className="w-3.5 h-3.5 rounded-full bg-zinc-400 dark:bg-zinc-500 border-2 border-background hover:scale-125 hover:bg-amber-500 transition-all cursor-crosshair z-30"
      />

      {/* Top Input Handle (on top apex) */}
      <Handle
        type="target"
        position={Position.Top}
        id="input-top"
        isConnectable={true}
        className="w-3.5 h-3.5 rounded-full bg-zinc-400 dark:bg-zinc-500 border-2 border-background hover:scale-125 hover:bg-amber-500 transition-all cursor-crosshair z-30"
      />

      {/* Right Output Handle (True - on right apex) */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        isConnectable={true}
        className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background hover:scale-125 hover:bg-emerald-400 transition-all cursor-crosshair z-30 shadow-xs"
      />

      {/* Bottom Output Handle (False - on bottom apex) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        isConnectable={true}
        className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-background hover:scale-125 hover:bg-rose-400 transition-all cursor-crosshair z-30 shadow-xs"
      />
    </div>
  );
}
