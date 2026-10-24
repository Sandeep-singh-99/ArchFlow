"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Code2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface FunctionParam {
  name: string;
  type: string;
}

export interface SqlFunctionNodeData {
  label?: string;
  name?: string;
  returnType?: string;
  language?: string;
  parameters?: FunctionParam[];
  description?: string;
}

function SqlFunctionNode({ data, selected }: { data: SqlFunctionNodeData; selected?: boolean }) {
  const funcName = data.name || data.label || "fn_calculate_tax";
  const returnType = data.returnType || "NUMERIC";
  const language = data.language || "plpgsql";
  const parameters: FunctionParam[] = data.parameters || [
    { name: "amount", type: "NUMERIC" },
    { name: "rate", type: "NUMERIC" },
  ];

  return (
    <div
      className={`min-w-[240px] max-w-[300px] rounded-xl border bg-card/95 backdrop-blur-md shadow-lg transition-all ${
        selected ? "border-indigo-500 ring-2 ring-indigo-500/30 shadow-indigo-500/20" : "border-border/80 hover:border-indigo-500/50"
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-indigo-500 border-2 border-background" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-indigo-500 border-2 border-background" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-indigo-500 border-2 border-background" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-indigo-500 border-2 border-background" />

      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-border/80 bg-indigo-500/5 rounded-t-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Code2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate">
              {language} FUNCTION
            </div>
            <div className="text-xs font-bold text-foreground truncate font-mono">
              {funcName}()
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10">
          FUNCTION
        </Badge>
      </div>

      {/* Parameters */}
      <div className="p-3 space-y-2">
        <div className="text-[10px] text-muted-foreground font-mono">Parameters:</div>
        <div className="space-y-1">
          {parameters.map((p, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs font-mono px-2 py-1 rounded bg-muted/40">
              <span className="text-foreground">{p.name}</span>
              <span className="text-muted-foreground text-[10px]">{p.type}</span>
            </div>
          ))}
        </div>

        {/* Return Type */}
        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1 text-muted-foreground">
            <ArrowRight className="h-3 w-3 text-indigo-500" />
            <span>Returns:</span>
          </div>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{returnType}</span>
        </div>
      </div>
    </div>
  );
}

export default memo(SqlFunctionNode);
