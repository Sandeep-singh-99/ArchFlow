"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Table, Key, Link2, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ColumnDefinition {
  id: string;
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
}

export interface SqlTableNodeData {
  label?: string;
  name?: string;
  schema?: string;
  columns?: ColumnDefinition[];
  comment?: string;
  settings?: any;
}

function SqlTableNode({ data, selected }: { data: SqlTableNodeData; selected?: boolean }) {
  const tableName = data.name || data.label || "untitled_table";
  const schemaName = data.schema || "public";
  const columns: ColumnDefinition[] = data.columns || [
    { id: "1", name: "id", type: "UUID", isPk: true, isNullable: false },
    { id: "2", name: "created_at", type: "TIMESTAMP", isNullable: false },
  ];

  return (
    <div
      className={`min-w-[240px] max-w-[320px] rounded-xl border bg-card/95 backdrop-blur-md shadow-lg transition-all ${
        selected ? "border-primary ring-2 ring-primary/30 shadow-primary/20" : "border-border/80 hover:border-primary/50"
      }`}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-primary border-2 border-background" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-primary border-2 border-background" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-primary border-2 border-background" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-primary border-2 border-background" />

      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-border/80 bg-muted/40 rounded-t-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Table className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate">
              {schemaName}
            </div>
            <div className="text-xs font-bold text-foreground truncate font-mono">
              {tableName}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
          TABLE
        </Badge>
      </div>

      {/* Columns List */}
      <div className="divide-y divide-border/40 py-1 max-h-[300px] overflow-y-auto">
        {columns.map((col, idx) => (
          <div
            key={col.id || `col-${idx}-${col.name || 'unnamed'}`}
            className="px-3 py-1.5 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors gap-2"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {col.isPk ? (
                <span title="Primary Key">
                  <Key className="h-3 w-3 text-amber-500 shrink-0" />
                </span>
              ) : col.isFk ? (
                <span title="Foreign Key">
                  <Link2 className="h-3 w-3 text-sky-500 shrink-0" />
                </span>
              ) : (
                <Hash className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              )}
              <span className={`font-mono truncate ${col.isPk ? "font-semibold text-foreground" : "text-foreground/90"}`}>
                {col.name}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
              <span className="text-muted-foreground">{col.type}</span>
              {col.isNullable && <span className="text-muted-foreground/60 text-[9px]">NULL</span>}
              {col.isUnique && !col.isPk && (
                <span className="text-violet-500 font-semibold text-[9px]">UQ</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer comment if present */}
      {data.comment && (
        <div className="px-3 py-1.5 border-t border-border/40 text-[10px] text-muted-foreground truncate italic">
          {data.comment}
        </div>
      )}
    </div>
  );
}

export default memo(SqlTableNode);
