"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Boxes, CornerDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface EmbeddedField {
  name: string;
  type: string;
}

export interface NosqlEmbeddedNodeData {
  label?: string;
  name?: string;
  parentSchema?: string;
  isArray?: boolean;
  fields?: EmbeddedField[];
}

function NosqlEmbeddedNode({ data, selected }: { data: NosqlEmbeddedNodeData; selected?: boolean }) {
  const schemaName = data.name || data.label || "AddressSchema";
  const parentSchema = data.parentSchema || "UserDocument";
  const isArray = !!data.isArray;
  const fields: EmbeddedField[] = data.fields || [
    { name: "street", type: "String" },
    { name: "city", type: "String" },
    { name: "zipCode", type: "String" },
    { name: "geo", type: "Coordinates" },
  ];

  return (
    <div
      className={`min-w-[220px] max-w-[280px] rounded-xl border bg-card/95 backdrop-blur-md shadow-lg transition-all ${
        selected ? "border-fuchsia-500 ring-2 ring-fuchsia-500/30 shadow-fuchsia-500/20" : "border-border/80 hover:border-fuchsia-500/50"
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-fuchsia-500 border-2 border-background" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-fuchsia-500 border-2 border-background" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-fuchsia-500 border-2 border-background" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-fuchsia-500 border-2 border-background" />

      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-border/80 bg-fuchsia-500/10 rounded-t-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 shrink-0">
            <Boxes className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate">
              {isArray ? "ARRAY OF OBJECTS" : "SUB-DOCUMENT"}
            </div>
            <div className="text-xs font-bold text-foreground truncate font-mono">
              {schemaName}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/15">
          EMBEDDED
        </Badge>
      </div>

      {parentSchema && (
        <div className="px-3 py-1 bg-muted/20 border-b border-border/40 text-[10px] text-muted-foreground font-mono flex items-center gap-1">
          <CornerDownRight className="h-3 w-3 text-fuchsia-500" />
          <span>Embedded in: {parentSchema}</span>
        </div>
      )}

      {/* Fields */}
      <div className="divide-y divide-border/40 py-1">
        {fields.map((f, idx) => (
          <div key={idx} className="px-3 py-1.5 flex items-center justify-between text-xs font-mono hover:bg-muted/30">
            <span className="text-foreground">{f.name}</span>
            <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
              {f.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(NosqlEmbeddedNode);
