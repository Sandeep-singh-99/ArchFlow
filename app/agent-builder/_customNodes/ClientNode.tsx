import { Handle, Position } from "@xyflow/react";
import { Globe } from "lucide-react";
import React from "react";

export default function ClientNode({ data }: any) {
  const label = data?.label || "Web & Mobile Clients";
  const protocol = data?.settings?.protocol || "HTTPS / HTTP/3";
  const qps = data?.settings?.qps || "100k QPS";

  return (
    <div className="relative rounded-xl border border-border bg-card p-3 shadow-sm min-w-[200px] hover:border-teal-500/60 transition-colors">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 shrink-0">
          <Globe className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-foreground truncate">{label}</h3>
          <p className="text-[10px] font-mono text-muted-foreground truncate">{protocol}</p>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span>Ingress Layer</span>
        <span className="font-semibold text-teal-600 dark:text-teal-400">{qps}</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 bg-teal-500 border-2 border-background"
      />
    </div>
  );
}
