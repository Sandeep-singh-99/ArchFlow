"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Eye, Code } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SqlViewNodeData {
  label?: string;
  name?: string;
  schema?: string;
  query?: string;
  columns?: string[];
  isMaterialized?: boolean;
}

function SqlViewNode({ data, selected }: { data: SqlViewNodeData; selected?: boolean }) {
  const viewName = data.name || data.label || "v_active_users";
  const query = data.query || "SELECT u.id, u.name, count(o.id) AS total_orders\nFROM users u\nJOIN orders o ON u.id = o.user_id\nGROUP BY u.id;";
  const isMaterialized = !!data.isMaterialized;

  return (
    <div
      className={`min-w-[240px] max-w-[320px] rounded-xl border bg-card/95 backdrop-blur-md shadow-lg transition-all ${
        selected ? "border-cyan-500 ring-2 ring-cyan-500/30 shadow-cyan-500/20" : "border-border/80 hover:border-cyan-500/50"
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-cyan-500 border-2 border-background" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-cyan-500 border-2 border-background" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-cyan-500 border-2 border-background" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-cyan-500 border-2 border-background" />

      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-border/80 bg-cyan-500/5 rounded-t-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 shrink-0">
            <Eye className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate">
              {isMaterialized ? "MATERIALIZED VIEW" : "VIRTUAL VIEW"}
            </div>
            <div className="text-xs font-bold text-foreground truncate font-mono">
              {viewName}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10">
          VIEW
        </Badge>
      </div>

      {/* Query Preview */}
      <div className="p-2.5 bg-muted/20">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono mb-1">
          <Code className="h-3 w-3" />
          <span>Definition Query</span>
        </div>
        <pre className="text-[10px] font-mono text-muted-foreground bg-muted/50 p-2 rounded-md overflow-x-auto max-h-[100px] whitespace-pre-wrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {query}
        </pre>
      </div>

      {data.columns && data.columns.length > 0 && (
        <div className="px-3 py-1.5 border-t border-border/40 text-[10px] text-muted-foreground">
          <span className="font-semibold text-foreground/80">Outputs: </span>
          {data.columns.join(", ")}
        </div>
      )}
    </div>
  );
}

export default memo(SqlViewNode);
