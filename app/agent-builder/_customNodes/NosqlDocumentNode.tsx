"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { FileJson, Braces } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface NosqlDocumentNodeData {
  label?: string;
  name?: string;
  sampleJson?: string;
  collectionName?: string;
}

function NosqlDocumentNode({ data, selected }: { data: NosqlDocumentNodeData; selected?: boolean }) {
  const docName = data.name || data.label || "sample_document";
  const collectionName = data.collectionName || "orders";
  const sampleJson = data.sampleJson || `{\n  "_id": "64f1a2b...",\n  "customer": {\n    "name": "Alice",\n    "vip": true\n  },\n  "items": [\n    { "sku": "A10", "qty": 2 }\n  ],\n  "total": 129.50\n}`;

  return (
    <div
      className={`min-w-[240px] max-w-[320px] rounded-xl border bg-card/95 backdrop-blur-md shadow-lg transition-all ${
        selected ? "border-amber-500 ring-2 ring-amber-500/30 shadow-amber-500/20" : "border-border/80 hover:border-amber-500/50"
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-amber-500 border-2 border-background" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-amber-500 border-2 border-background" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-amber-500 border-2 border-background" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-amber-500 border-2 border-background" />

      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-border/80 bg-amber-500/10 rounded-t-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <FileJson className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate">
              DOC IN {collectionName}
            </div>
            <div className="text-xs font-bold text-foreground truncate font-mono">
              {docName}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/15">
          DOCUMENT
        </Badge>
      </div>

      {/* JSON Viewer */}
      <div className="p-2.5 bg-muted/30">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono mb-1">
          <Braces className="h-3 w-3" />
          <span>BSON / JSON Structure</span>
        </div>
        <pre className="text-[10px] font-mono text-muted-foreground bg-background/80 p-2 rounded-md overflow-x-auto max-h-[140px] whitespace-pre-wrap border border-border/40">
          {sampleJson}
        </pre>
      </div>
    </div>
  );
}

export default memo(NosqlDocumentNode);
