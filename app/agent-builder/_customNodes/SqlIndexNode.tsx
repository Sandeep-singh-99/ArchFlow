"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Zap, ListTree } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SqlIndexNodeData {
  label?: string;
  name?: string;
  tableName?: string;
  indexType?: "B-TREE" | "HASH" | "GIN" | "GIST" | "BRIN" | "UNIQUE";
  columns?: string[];
  isUnique?: boolean;
}

function SqlIndexNode({ data, selected }: { data: SqlIndexNodeData; selected?: boolean }) {
  const indexName = data.name || data.label || "idx_users_email";
  const tableName = data.tableName || "users";
  const indexType = data.indexType || (data.isUnique ? "UNIQUE" : "B-TREE");
  const columns = data.columns || ["email ASC"];

  return (
    <div
      className={`min-w-[220px] max-w-[280px] rounded-xl border bg-card/95 backdrop-blur-md shadow-lg transition-all ${
        selected ? "border-violet-500 ring-2 ring-violet-500/30 shadow-violet-500/20" : "border-border/80 hover:border-violet-500/50"
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-violet-500 border-2 border-background" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-violet-500 border-2 border-background" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-violet-500 border-2 border-background" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-violet-500 border-2 border-background" />

      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-border/80 bg-violet-500/5 rounded-t-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-400 shrink-0">
            <Zap className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate">
              INDEX ON {tableName}
            </div>
            <div className="text-xs font-bold text-foreground truncate font-mono">
              {indexName}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/10">
          {indexType}
        </Badge>
      </div>

      {/* Indexed Columns */}
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1.5 font-mono">
          <ListTree className="h-3 w-3" />
          <span>Indexed Columns</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {columns.map((col, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-foreground border border-border/50"
            >
              {col}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(SqlIndexNode);
