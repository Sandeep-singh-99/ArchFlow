"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Link, ArrowRight, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface NosqlReferenceNodeData {
  label?: string;
  name?: string;
  fromCollection?: string;
  fromField?: string;
  toCollection?: string;
  toField?: string;
  cardinality?: "1:1" | "1:N" | "N:M";
  refType?: "ObjectId Reference" | "DBRef" | "Manual Reference";
}

function NosqlReferenceNode({ data, selected }: { data: NosqlReferenceNodeData; selected?: boolean }) {
  const refName = data.name || data.label || "user_to_orders";
  const fromCollection = data.fromCollection || "orders";
  const fromField = data.fromField || "customerId";
  const toCollection = data.toCollection || "users";
  const toField = data.toField || "_id";
  const cardinality = data.cardinality || "1:N";
  const refType = data.refType || "ObjectId Reference";

  return (
    <div
      className={`min-w-[240px] max-w-[300px] rounded-xl border bg-card/95 backdrop-blur-md shadow-lg transition-all ${
        selected ? "border-sky-500 ring-2 ring-sky-500/30 shadow-sky-500/20" : "border-border/80 hover:border-sky-500/50"
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-sky-500 border-2 border-background" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-sky-500 border-2 border-background" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-sky-500 border-2 border-background" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-sky-500 border-2 border-background" />

      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-border/80 bg-sky-500/10 rounded-t-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-sky-500/20 text-sky-600 dark:text-sky-400 shrink-0">
            <Share2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate">
              {refType}
            </div>
            <div className="text-xs font-bold text-foreground truncate font-mono">
              {refName}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/15">
          {cardinality}
        </Badge>
      </div>

      {/* Path representation */}
      <div className="p-3 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between gap-2 p-1.5 rounded bg-muted/40">
          <div className="text-foreground truncate font-semibold">{fromCollection}.{fromField}</div>
          <ArrowRight className="h-3.5 w-3.5 text-sky-500 shrink-0" />
          <div className="text-foreground truncate font-semibold">{toCollection}.{toField}</div>
        </div>
      </div>
    </div>
  );
}

export default memo(NosqlReferenceNode);
