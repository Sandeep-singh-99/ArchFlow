import { Handle, Position } from "@xyflow/react";
import { Layout, Cpu, Database, Bot, Sparkles } from "lucide-react";
import React from "react";

const ROLE_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  frontend: {
    icon: Layout,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },
  backend: {
    icon: Cpu,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  database: {
    icon: Database,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  ai: {
    icon: Bot,
    color: "text-[#ffee72]",
    bg: "bg-[#ffc507]/10",
    border: "border-[#ffdf27]/30",
  },
  custom: {
    icon: Sparkles,
    color: "text-[#ffee72]",
    bg: "bg-[#ffc507]/10",
    border: "border-[#ffdf27]/30",
  },
};

export default function CustomNode({ data }: any) {
  const roleKey = (data?.settings?.role || data?.type?.replace("Node", "") || "custom").toLowerCase();
  const config = ROLE_CONFIG[roleKey] || ROLE_CONFIG.custom;
  const Icon = config.icon;

  const label = data?.label || data?.settings?.name || "Custom Component";
  const action = data?.settings?.action || data?.settings?.rendering || data?.settings?.latency || "Active Component";
  const tech = data?.settings?.tech || "Custom Stack";

  return (
    <div className={`relative rounded-xl border border-border bg-card p-3.5 shadow-sm min-w-[220px] max-w-[280px] hover:${config.border} transition-colors group`}>
      <div className="flex items-center gap-2.5">
        <div className={`h-8 w-8 rounded-lg ${config.bg} ${config.color} flex items-center justify-center border ${config.border} shrink-0`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-foreground truncate">{label}</h3>
          <p className="text-[10px] font-mono text-muted-foreground truncate">{tech}</p>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span className="capitalize font-semibold text-foreground/80">{roleKey}</span>
        <span className={`font-semibold ${config.color} truncate max-w-[130px]`}>{action}</span>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 bg-muted-foreground border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 bg-[#ffdf27] border-2 border-background"
      />
    </div>
  );
}
