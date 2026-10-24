"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { BellElectric, Play, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SqlTriggerNodeData {
  label?: string;
  name?: string;
  tableName?: string;
  timing?: "BEFORE" | "AFTER" | "INSTEAD OF";
  events?: ("INSERT" | "UPDATE" | "DELETE")[];
  functionName?: string;
}

function SqlTriggerNode({ data, selected }: { data: SqlTriggerNodeData; selected?: boolean }) {
  const triggerName = data.name || data.label || "trg_update_timestamp";
  const tableName = data.tableName || "orders";
  const timing = data.timing || "BEFORE";
  const events = data.events || ["UPDATE"];
  const functionName = data.functionName || "set_timestamp()";

  return (
    <div
      className={`min-w-[240px] max-w-[300px] rounded-xl border bg-card/95 backdrop-blur-md shadow-lg transition-all ${
        selected ? "border-rose-500 ring-2 ring-rose-500/30 shadow-rose-500/20" : "border-border/80 hover:border-rose-500/50"
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-rose-500 border-2 border-background" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-rose-500 border-2 border-background" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-rose-500 border-2 border-background" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-rose-500 border-2 border-background" />

      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-border/80 bg-rose-500/5 rounded-t-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
            <BellElectric className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate">
              ON {tableName}
            </div>
            <div className="text-xs font-bold text-foreground truncate font-mono">
              {triggerName}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10">
          TRIGGER
        </Badge>
      </div>

      {/* Timing and Events */}
      <div className="p-3 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Execution:</span>
          <span className="font-semibold text-foreground">{timing} {events.join(", ")}</span>
        </div>

        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Play className="h-3 w-3 text-rose-500" />
            <span>Executes:</span>
          </div>
          <span className="font-semibold text-rose-600 dark:text-rose-400 truncate max-w-[150px]">{functionName}</span>
        </div>
      </div>
    </div>
  );
}

export default memo(SqlTriggerNode);
