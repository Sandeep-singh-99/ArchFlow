"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { FolderTree, FileCode, Layers, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDomainTheme } from "@/lib/domainThemes";

export interface NosqlField {
  name: string;
  type: string;
  required?: boolean;
}

export interface NosqlCollectionNodeData {
  label?: string;
  name?: string;
  database?: string;
  domainName?: string;
  domainTheme?: string;
  domainId?: string;
  shardKey?: string;
  isCapped?: boolean;
  fields?: NosqlField[];
  indexesCount?: number;
}

function NosqlCollectionNode({ data, selected }: { data: NosqlCollectionNodeData; selected?: boolean }) {
  const collectionName = data.name || data.label || "users_collection";
  const database = data.database || "app_db";
  const shardKey = data.shardKey;
  const domainThemeConfig = data.domainName ? getDomainTheme(data.domainTheme) : null;
  const fields: NosqlField[] = data.fields || [
    { name: "_id", type: "ObjectId", required: true },
    { name: "username", type: "String", required: true },
    { name: "profile", type: "Object", required: false },
    { name: "createdAt", type: "Date", required: true },
  ];

  return (
    <div
      className={`min-w-[240px] max-w-[320px] rounded-xl border bg-card/95 backdrop-blur-md shadow-lg transition-all ${
        selected ? "border-emerald-500 ring-2 ring-emerald-500/30 shadow-emerald-500/20" : "border-border/80 hover:border-emerald-500/50"
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-emerald-500 border-2 border-background" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-emerald-500 border-2 border-background" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-emerald-500 border-2 border-background" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-emerald-500 border-2 border-background" />

      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-border/80 bg-emerald-500/10 rounded-t-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            <FolderTree className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate">
                {database}
              </span>
              {data.domainName && domainThemeConfig && (
                <span
                  title={`Domain: ${data.domainName}`}
                  className={`text-[8.5px] px-1 py-0.2 rounded font-mono font-medium truncate max-w-[110px] border ${domainThemeConfig.badge}`}
                >
                  {data.domainName}
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-foreground truncate font-mono">
              {collectionName}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/15">
          COLLECTION
        </Badge>
      </div>

      {/* Shard Key or Options banner if any */}
      {shardKey && (
        <div className="px-3 py-1 bg-emerald-500/5 border-b border-border/50 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Layers className="h-3 w-3" />
          <span>Shard Key: {shardKey}</span>
        </div>
      )}

      {/* Fields Preview */}
      <div className="divide-y divide-border/40 py-1">
        {fields.map((f, idx) => (
          <div key={idx} className="px-3 py-1.5 flex items-center justify-between text-xs font-mono hover:bg-muted/30">
            <div className="flex items-center gap-1.5 min-w-0">
              <FileCode className="h-3 w-3 text-emerald-500/70 shrink-0" />
              <span className="text-foreground truncate">{f.name}</span>
              {f.required && <span className="text-rose-500 font-bold text-[10px]">*</span>}
            </div>
            <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
              {f.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(NosqlCollectionNode);
