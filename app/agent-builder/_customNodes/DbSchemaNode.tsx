"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Database, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface DbSchemaNodeData {
  label?: string;
  name?: string;
  engine?: string;
  charset?: string;
  collation?: string;
  description?: string;
}

function DbSchemaNode({ data, selected }: { data: DbSchemaNodeData; selected?: boolean }) {
  const schemaName = data.name || data.label || "production_db";
  const engine = data.engine || "PostgreSQL 16";
  const charset = data.charset || "UTF-8";
  const collation = data.collation || "en_US.UTF-8";

  return (
    <div
      className={`min-w-[240px] max-w-[320px] rounded-xl border bg-card/95 backdrop-blur-md shadow-lg transition-all ${
        selected ? "border-blue-500 ring-2 ring-blue-500/30 shadow-blue-500/20" : "border-border/80 hover:border-blue-500/50"
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-blue-500 border-2 border-background" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-blue-500 border-2 border-background" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-blue-500 border-2 border-background" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-blue-500 border-2 border-background" />

      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-border/80 bg-blue-500/10 rounded-t-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
            <Database className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate">
              NAMESPACE / SCHEMA
            </div>
            <div className="text-xs font-bold text-foreground truncate font-mono">
              {schemaName}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/15">
          DATABASE
        </Badge>
      </div>

      {/* Metadata */}
      <div className="p-3 space-y-1.5 text-xs font-mono">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Engine / RDBMS:</span>
          <span className="font-semibold text-foreground">{engine}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Encoding:</span>
          <span className="text-foreground">{charset}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Collation:</span>
          <span className="text-foreground">{collation}</span>
        </div>
      </div>
    </div>
  );
}

export default memo(DbSchemaNode);
