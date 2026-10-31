"use client";

import React, { memo, useContext } from "react";
import { NodeResizer, Handle, Position, useReactFlow } from "@xyflow/react";
import {
  Shield,
  CreditCard,
  Package,
  Users,
  Bell,
  BarChart3,
  Layers,
  Sparkles,
  Maximize2,
  Unlink,
  FolderTree,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DOMAIN_THEMES,
  DomainColorTheme,
  getDomainTheme,
} from "@/lib/domainThemes";
import { WorkflowContext } from "@/context/WorkflowContext";
import { toast } from "sonner";

export interface DomainGroupNodeData {
  label?: string;
  name?: string;
  description?: string;
  colorTheme?: DomainColorTheme;
  icon?: string;
  isDomainGroup?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Shield,
  CreditCard,
  Package,
  Users,
  Bell,
  BarChart3,
  Layers,
  FolderTree,
};

function DomainGroupNode({
  id,
  data,
  selected,
}: {
  id: string;
  data: DomainGroupNodeData;
  selected?: boolean;
}) {
  const theme = getDomainTheme(data.colorTheme);
  const domainName = data.name || data.label || "Domain Boundary";
  const iconName = data.icon || "Layers";
  const IconComponent = ICON_MAP[iconName] || Layers;

  const { addedNodes, setAddedNodes, setSelectedNode } = useContext(WorkflowContext);
  const { getNode } = useReactFlow();

  // Find all member tables belonging to this domain
  const memberNodes = (addedNodes || []).filter(
    (n: any) => n.parentId === id || n.data?.domainId === id
  );

  // Auto-fit container boundary to snugly wrap all member nodes
  const handleFitToChildren = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (memberNodes.length === 0) {
      toast.info("No tables currently inside this domain boundary");
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    memberNodes.forEach((node: any) => {
      // In React Flow, child position is relative to parent
      const posX = node.position.x;
      const posY = node.position.y;
      const w = node.measured?.width || node.width || 300;
      const h = node.measured?.height || node.height || 200;

      minX = Math.min(minX, posX);
      minY = Math.min(minY, posY);
      maxX = Math.max(maxX, posX + w);
      maxY = Math.max(maxY, posY + h);
    });

    const padding = 45;
    const headerOffset = 65; // space for header

    // Calculate new width & height
    const newWidth = Math.max(360, maxX + padding);
    const newHeight = Math.max(240, maxY + padding);

    setAddedNodes((nds: any[]) =>
      (nds || []).map((n) =>
        n.id === id
          ? {
              ...n,
              style: {
                ...(n.style || {}),
                width: newWidth,
                height: newHeight,
              },
            }
          : n
      )
    );
    toast.success(`Domain container resized to fit ${memberNodes.length} tables`);
  };

  // Ungroup: detach all child tables back to absolute canvas coordinates and remove container
  const handleUngroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    const groupNode = getNode(id);
    const groupX = groupNode?.position?.x || 0;
    const groupY = groupNode?.position?.y || 0;

    setAddedNodes((nds: any[]) => {
      return (nds || [])
        // Detach children
        .map((n) => {
          if (n.parentId === id || n.data?.domainId === id) {
            const { parentId, ...rest } = n;
            return {
              ...rest,
              position: {
                x: groupX + (n.position?.x || 0),
                y: groupY + (n.position?.y || 0),
              },
              data: {
                ...(n.data || {}),
                domainId: undefined,
                domainName: undefined,
              },
            };
          }
          return n;
        })
        // Remove this group container
        .filter((n) => n.id !== id);
    });

    setSelectedNode(null);
    toast.info(`Ungrouped domain "${domainName}" and preserved all tables`);
  };

  // Quick switch color theme directly from container
  const handleColorChange = (newTheme: DomainColorTheme, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddedNodes((nds: any[]) =>
      (nds || []).map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              colorTheme: newTheme,
            },
          };
        }
        // Also update child nodes domain theme indicator if set
        if (n.parentId === id || n.data?.domainId === id) {
          return {
            ...n,
            data: {
              ...n.data,
              domainTheme: newTheme,
            },
          };
        }
        return n;
      })
    );
  };

  const themeKeys: DomainColorTheme[] = [
    "indigo",
    "emerald",
    "amber",
    "purple",
    "cyan",
    "rose",
    "blue",
    "slate",
  ];

  return (
    <div
      className={`relative w-full h-full rounded-2xl border-2 transition-all group/domain ${
        theme.borderDashed
      } ${theme.bg} ${
        selected
          ? `ring-2 ${theme.ring} shadow-xl ${theme.shadow} border-solid`
          : "hover:border-solid hover:shadow-md"
      }`}
      style={{
        minWidth: 320,
        minHeight: 220,
      }}
    >
      {/* React Flow Resizer handles on selection */}
      <NodeResizer
        minWidth={320}
        minHeight={220}
        isVisible={!!selected}
        lineClassName="!border-primary/50"
        handleClassName="!w-3 !h-3 !rounded-sm !bg-background !border-2 !border-primary"
      />

      {/* Domain-level handles for high-level domain relationships */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-3 !h-3 !bg-muted-foreground/40 !border-2 !border-background opacity-0 group-hover/domain:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !bg-muted-foreground/40 !border-2 !border-background opacity-0 group-hover/domain:opacity-100 transition-opacity"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-muted-foreground/40 !border-2 !border-background opacity-0 group-hover/domain:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-muted-foreground/40 !border-2 !border-background opacity-0 group-hover/domain:opacity-100 transition-opacity"
      />
      {/* Compatibility aliases for domain-* */}
      <Handle type="target" position={Position.Top} id="domain-top" className="opacity-0 pointer-events-none" />
      <Handle type="source" position={Position.Bottom} id="domain-bottom" className="opacity-0 pointer-events-none" />
      <Handle type="target" position={Position.Left} id="domain-left" className="opacity-0 pointer-events-none" />
      <Handle type="source" position={Position.Right} id="domain-right" className="opacity-0 pointer-events-none" />

      {/* Domain Container Header Bar */}
      <div
        className={`px-4 py-3 rounded-t-2xl border-b border-border/60 flex items-center justify-between gap-3 backdrop-blur-md ${theme.headerBg} select-none`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="p-1.5 rounded-lg border shadow-xs shrink-0"
            style={{
              backgroundColor: `${theme.accent}20`,
              borderColor: `${theme.accent}40`,
              color: theme.accent,
            }}
          >
            <IconComponent className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-foreground truncate">
                {domainName}
              </span>
              <Badge
                variant="outline"
                className={`text-[9.5px] px-1.5 py-0 h-4 font-mono font-medium ${theme.badge}`}
              >
                DOMAIN
              </Badge>
            </div>
            {data.description ? (
              <p className="text-[11px] text-muted-foreground truncate max-w-[280px]">
                {data.description}
              </p>
            ) : (
              <span className="text-[11px] text-muted-foreground font-mono">
                {memberNodes.length}{" "}
                {memberNodes.length === 1 ? "table" : "tables"} enclosed
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions & Palette Swatches */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick theme dots */}
          <div className="hidden sm:flex items-center gap-1 px-1.5 py-1 bg-background/50 rounded-lg border border-border/40">
            {themeKeys.map((tk) => {
              const tcfg = DOMAIN_THEMES[tk];
              const isCurrent = (data.colorTheme || "indigo") === tk;
              return (
                <button
                  key={tk}
                  type="button"
                  onClick={(e) => handleColorChange(tk, e)}
                  title={`Set ${tcfg.label}`}
                  className={`w-3 h-3 rounded-full transition-transform cursor-pointer ${
                    isCurrent
                      ? "scale-125 ring-2 ring-foreground shadow-xs"
                      : "hover:scale-110 opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: tcfg.accent }}
                />
              );
            })}
          </div>

          {/* Fit to children button */}
          <button
            type="button"
            onClick={handleFitToChildren}
            title="Auto-Fit Boundary around tables"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {/* Ungroup button */}
          <button
            type="button"
            onClick={handleUngroup}
            title="Ungroup & release tables"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <Unlink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Subtle corner watermark */}
      <div className="absolute bottom-3 right-4 pointer-events-none select-none opacity-20 font-mono text-[11px] uppercase tracking-wider font-bold">
        {domainName}
      </div>
    </div>
  );
}

export default memo(DomainGroupNode);
