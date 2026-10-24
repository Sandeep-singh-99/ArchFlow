"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ListFilter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SqlEnumNodeData {
  label?: string;
  name?: string;
  schema?: string;
  values?: string[];
}

function SqlEnumNode({ data, selected }: { data: SqlEnumNodeData; selected?: boolean }) {
  const enumName = data.name || data.label || "user_role_enum";
  const values = data.values || ["admin", "editor", "viewer", "guest"];

  return (
    <div
      className={`min-w-[200px] max-w-[260px] rounded-xl border bg-card/95 backdrop-blur-md shadow-lg transition-all ${
        selected ? "border-amber-500 ring-2 ring-amber-500/30 shadow-amber-500/20" : "border-border/80 hover:border-amber-500/50"
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-amber-500 border-2 border-background" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-amber-500 border-2 border-background" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-amber-500 border-2 border-background" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-amber-500 border-2 border-background" />

      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-border/80 bg-amber-500/5 rounded-t-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
            <ListFilter className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate">
              TYPE / ENUM
            </div>
            <div className="text-xs font-bold text-foreground truncate font-mono">
              {enumName}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10">
          ENUM
        </Badge>
      </div>

      {/* Allowed Values */}
      <div className="p-3">
        <div className="text-[10px] text-muted-foreground font-mono mb-1.5">Allowed Values:</div>
        <div className="flex flex-wrap gap-1.5">
          {values.map((val, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
            >
              '{val}'
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(SqlEnumNode);
