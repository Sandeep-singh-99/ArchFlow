"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Search, Compass, FileText, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface NosqlIndexNodeData {
  label?: string;
  name?: string;
  collectionName?: string;
  indexType?: "Single Field" | "Compound" | "Text Search" | "2dsphere Geospatial" | "TTL" | "Hashed";
  keys?: string[];
  expireAfterSeconds?: number;
}

function NosqlIndexNode({ data, selected }: { data: NosqlIndexNodeData; selected?: boolean }) {
  const indexName = data.name || data.label || "idx_user_geo";
  const collectionName = data.collectionName || "locations";
  const indexType = data.indexType || "2dsphere Geospatial";
  const keys = data.keys || ["coordinates: '2dsphere'", "status: 1"];

  const getIcon = () => {
    switch (indexType) {
      case "2dsphere Geospatial":
        return <Compass className="h-4 w-4" />;
      case "Text Search":
        return <FileText className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={`min-w-[220px] max-w-[280px] rounded-xl border bg-card/95 backdrop-blur-md shadow-lg transition-all ${
        selected ? "border-teal-500 ring-2 ring-teal-500/30 shadow-teal-500/20" : "border-border/80 hover:border-teal-500/50"
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-teal-500 border-2 border-background" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-teal-500 border-2 border-background" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-teal-500 border-2 border-background" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-teal-500 border-2 border-background" />

      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-border/80 bg-teal-500/10 rounded-t-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-teal-500/20 text-teal-600 dark:text-teal-400 shrink-0">
            {getIcon()}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate">
              INDEX ON {collectionName}
            </div>
            <div className="text-xs font-bold text-foreground truncate font-mono">
              {indexName}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/15">
          {indexType}
        </Badge>
      </div>

      {/* Keys */}
      <div className="p-3">
        <div className="text-[10px] text-muted-foreground font-mono mb-1.5">Index Specification:</div>
        <div className="flex flex-col gap-1">
          {keys.map((k, idx) => (
            <div
              key={idx}
              className="text-[10px] font-mono px-2 py-1 rounded bg-muted/50 text-foreground border border-border/50"
            >
              {`{ ${k} }`}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(NosqlIndexNode);
