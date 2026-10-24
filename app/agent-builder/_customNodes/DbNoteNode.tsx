"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { StickyNote } from "lucide-react";

export interface DbNoteNodeData {
  label?: string;
  text?: string;
  color?: "yellow" | "blue" | "green" | "purple" | "slate";
}

function DbNoteNode({ data, selected }: { data: DbNoteNodeData; selected?: boolean }) {
  const text = data.text || data.label || "Add architectural notes, migration caveats, or business logic explanations here.";
  const color = data.color || "yellow";

  const colorStyles = {
    yellow: "bg-amber-100/90 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200",
    blue: "bg-sky-100/90 dark:bg-sky-950/70 border-sky-300 dark:border-sky-800/80 text-sky-900 dark:text-sky-200",
    green: "bg-emerald-100/90 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200",
    purple: "bg-purple-100/90 dark:bg-purple-950/70 border-purple-300 dark:border-purple-800/80 text-purple-900 dark:text-purple-200",
    slate: "bg-zinc-100/90 dark:bg-zinc-900/80 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200",
  }[color];

  return (
    <div
      className={`min-w-[200px] max-w-[280px] p-3.5 rounded-xl border shadow-md backdrop-blur-sm transition-all ${colorStyles} ${
        selected ? "ring-2 ring-primary/40 shadow-lg scale-[1.02]" : "hover:shadow-lg"
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" className="!w-2 !h-2 !bg-current opacity-40 border-none" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !bg-current opacity-40 border-none" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2 !h-2 !bg-current opacity-40 border-none" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2 !h-2 !bg-current opacity-40 border-none" />

      <div className="flex items-center gap-1.5 mb-2 opacity-75">
        <StickyNote className="h-3.5 w-3.5" />
        <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">NOTE</span>
      </div>

      <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
        {text}
      </div>
    </div>
  );
}

export default memo(DbNoteNode);
