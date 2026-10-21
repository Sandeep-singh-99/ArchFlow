import { Handle, Position } from "@xyflow/react";
import { Cpu } from "lucide-react";
import React from "react";

export default function ServiceNode({ data }: any) {
  const label = data?.label || "Order Service";
  const tech = data?.settings?.tech || "Go Microservice (HPA)";
  const latency = data?.settings?.latency || "8.5ms";

  return (
    <div className="relative rounded-xl border border-border bg-card p-3 shadow-sm min-w-[210px] hover:border-violet-500/60 transition-colors">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-500/20 shrink-0">
          <Cpu className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-foreground truncate">{label}</h3>
          <p className="text-[10px] font-mono text-muted-foreground truncate">{tech}</p>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span>Service Latency</span>
        <span className="font-semibold text-violet-600 dark:text-violet-400">{latency}</span>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 bg-muted-foreground border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 bg-indigo-500 border-2 border-background"
      />
    </div>
  );
}
