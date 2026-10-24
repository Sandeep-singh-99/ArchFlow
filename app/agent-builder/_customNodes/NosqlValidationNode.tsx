"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface NosqlValidationNodeData {
  label?: string;
  name?: string;
  collectionName?: string;
  validationLevel?: "strict" | "moderate" | "off";
  validationAction?: "error" | "warn";
  requiredFields?: string[];
  rulesSummary?: string;
}

function NosqlValidationNode({ data, selected }: { data: NosqlValidationNodeData; selected?: boolean }) {
  const schemaName = data.name || data.label || "UserValidationSchema";
  const collectionName = data.collectionName || "users";
  const validationLevel = data.validationLevel || "strict";
  const validationAction = data.validationAction || "error";
  const requiredFields = data.requiredFields || ["email", "passwordHash", "status"];
  const rulesSummary = data.rulesSummary || "email: string (regex), age: int (>= 18)";

  return (
    <div
      className={`min-w-[240px] max-w-[300px] rounded-xl border bg-card/95 backdrop-blur-md shadow-lg transition-all ${
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
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate">
              VALIDATOR FOR {collectionName}
            </div>
            <div className="text-xs font-bold text-foreground truncate font-mono">
              {schemaName}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/15">
          {validationLevel.toUpperCase()}
        </Badge>
      </div>

      <div className="p-3 space-y-2 text-xs font-mono">
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">Required Properties:</div>
          <div className="flex flex-wrap gap-1">
            {requiredFields.map((field, idx) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-muted/60 text-foreground border border-border/50">
                {field}
              </span>
            ))}
          </div>
        </div>

        {rulesSummary && (
          <div className="pt-2 border-t border-border/50">
            <div className="text-[10px] text-muted-foreground mb-0.5">Rules:</div>
            <div className="text-[10px] text-muted-foreground bg-muted/30 p-1.5 rounded">
              {rulesSummary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(NosqlValidationNode);
