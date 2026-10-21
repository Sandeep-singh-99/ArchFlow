import { Handle, Position } from "@xyflow/react";
import { ShieldAlert } from "lucide-react";
import React from "react";

export default function RateLimiterNode({ data }: any) {
  const label = data?.label || "Rate Limiter & Shield";
  const tech = data?.settings?.tech || "Envoy / Redis Token Bucket";
  const limit = data?.settings?.limit || "10,000 req/s • Burst 2x";

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm min-w-[210px] hover:border-rose-500/60 transition-colors">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-foreground truncate">{label}</h3>
          <p className="text-[10px] font-mono text-muted-foreground truncate">{tech}</p>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span>Capacity</span>
        <span className="font-semibold text-rose-600 dark:text-rose-400">{limit}</span>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 bg-muted-foreground border-2 border-background"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 bg-muted-foreground border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 bg-rose-500 border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 bg-rose-500 border-2 border-background"
      />
    </div>
  );
}
