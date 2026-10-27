"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import moment from "moment";
import { Agent } from "@/types/AgentTypes";
import { Id } from "@/convex/_generated/dataModel";
import SchemaMiniMapPreview from "./SchemaMiniMapPreview";
import RenameProjectModal from "./RenameProjectModal";
import { exportSqlDdl } from "@/lib/sqlDdlExporter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Database,
  MoreVertical,
  Pencil,
  Copy,
  Download,
  Trash2,
  ArrowRight,
  Clock,
  Code2,
  FileCode,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface SchemaCardProps {
  agent: Agent;
  userId?: Id<"UserTable">;
  onDeleteRequest: (agentId: Id<"AgentTable">, agentName: string) => void;
  onRefresh: () => void;
}

export default function SchemaCard({
  agent,
  userId,
  onDeleteRequest,
  onRefresh,
}: SchemaCardProps) {
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [cardName, setCardName] = useState(agent.name);
  const duplicateAgentMutation = useMutation(api.agent.DuplicateAgent);

  // Floating snapshot outside-the-card hover state
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [placement, setPlacement] = useState<"top" | "bottom">("top");
  const [align, setAlign] = useState<"center" | "left" | "right">("center");
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        // If within 280px of top of viewport, flip preview to appear below the card
        if (rect.top < 280) {
          setPlacement("bottom");
        } else {
          setPlacement("top");
        }

        // Horizontal alignment check to prevent clipping on viewport edges
        if (rect.left < 100) {
          setAlign("left");
        } else if (window.innerWidth - rect.right < 100) {
          setAlign("right");
        } else {
          setAlign("center");
        }
      }
      setIsHovered(true);
    }, 140);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleQuickExportSql = (dialect: "postgresql" | "mysql") => {
    try {
      const ddl = exportSqlDdl(agent.nodes || [], agent.edges || [], { dialect });
      const blob = new Blob([ddl], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = (cardName || "schema")
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "_");
      link.download = `${safeName}_${dialect}.sql`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${dialect.toUpperCase()} DDL!`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to export SQL DDL");
    }
  };

  const handleDuplicate = async () => {
    if (!userId) {
      toast.error("User session not found");
      return;
    }
    try {
      toast.loading("Duplicating database schema...", { id: "duplicate-toast" });
      await duplicateAgentMutation({
        agentId: agent._id,
        userId,
      });
      toast.success(`Duplicated "${cardName}"`, { id: "duplicate-toast" });
      onRefresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to duplicate schema", {
        id: "duplicate-toast",
      });
    }
  };

  const handleCopyAgentId = () => {
    navigator.clipboard.writeText(agent.agentId);
    toast.success("Project ID copied to clipboard");
  };

  // Align positioning classes
  const alignClasses =
    align === "left"
      ? "left-0 translate-x-0"
      : align === "right"
        ? "right-0 translate-x-0"
        : "left-1/2 -translate-x-1/2";

  const placementClasses =
    placement === "top"
      ? "bottom-[calc(100%+12px)] origin-bottom"
      : "top-[calc(100%+12px)] origin-top";

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative h-full transition-all duration-150 ${
        isHovered ? "z-40" : "z-10"
      }`}
    >
      {/* The Main Stable Dashboard Card */}
      <div className="h-full rounded-xl border border-border/80 bg-card hover:border-zinc-300 dark:hover:border-white/60 transition-all duration-200 shadow-2xs hover:shadow-md relative group flex flex-col justify-between overflow-hidden">
        {/* Top Section */}
        <div className="p-4 space-y-3">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#ffc507]/10 text-[#ffee72] flex items-center justify-center border border-[#ffdf27]/20 shrink-0">
              <Database className="h-4 w-4 text-[#ffdf27]" />
            </div>

            {/* Quick Actions & Status */}
            <div className="flex items-center gap-1 shrink-0">
              <Badge
                variant="outline"
                className="text-[10px] font-mono text-muted-foreground/80 border-border/60 py-0 px-1.5"
              >
                {agent.published ? "Published" : "Draft"}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md cursor-pointer"
                    title="Actions"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 z-50">
                  <DropdownMenuItem
                    onClick={() => setRenameModalOpen(true)}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Rename</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleDuplicate}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Duplicate</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => handleQuickExportSql("postgresql")}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Export PostgreSQL</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleQuickExportSql("mysql")}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <Code2 className="h-3.5 w-3.5 text-sky-500" />
                    <span>Export MySQL</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleCopyAgentId}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Copy ID</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => onDeleteRequest(agent._id, cardName)}
                    className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Schema Title & Metadata */}
          <div>
            <Link
              href={`/agent-builder/${agent.agentId}`}
              className="font-semibold text-sm text-foreground hover:text-[#ffee72] transition-colors truncate block"
              title={cardName}
            >
              {cardName}
            </Link>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono mt-1">
              <Clock className="h-3 w-3 shrink-0" />
              <span>{moment(agent._creationTime).fromNow()}</span>
            </div>
          </div>
        </div>

        {/* Card Footer: Minimal Action Row */}
        <div className="px-4 py-2.5 bg-muted/15 border-t border-border/60 flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted-foreground/80">
            Database Studio
          </span>

          <Link href={`/agent-builder/${agent.agentId}`}>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 gap-1 text-xs font-semibold text-[#ffee72] hover:text-[#ffdf27] hover:bg-[#ffc507]/10 cursor-pointer"
            >
              <span>Open Canvas</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Modern Floating Visual Snapshot Outside the Card */}
      <div
        className={`absolute z-50 w-[380px] max-w-[92vw] transition-all duration-200 ease-out ${alignClasses} ${placementClasses} ${
          isHovered
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <Link
          href={`/agent-builder/${agent.agentId}`}
          className="block rounded-2xl border border-border/80 dark:border-white/15 bg-card/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl p-3.5 space-y-2.5 hover:border-[#ffdf27]/50 transition-colors cursor-pointer group/preview"
        >
          {/* Header row in snapshot popover */}
          <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-xs text-foreground truncate max-w-[190px]">
                {cardName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0">
              <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                {agent.nodes?.length ?? 0} {agent.nodes?.length === 1 ? "entity" : "entities"}
              </span>
              <span className="text-[#ffee72] flex items-center gap-0.5 font-medium text-[11px] group-hover/preview:translate-x-0.5 transition-transform">
                Open <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
              </span>
            </div>
          </div>

          {/* Crisp, expanded visual diagram */}
          <div className="rounded-xl overflow-hidden border border-border/60 bg-background/50">
            <SchemaMiniMapPreview
              nodes={agent.nodes}
              edges={agent.edges}
              className="h-44 w-full"
            />
          </div>

          {/* Footer Caption */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 font-mono pt-0.5">
            <span>Visual schema diagram</span>
            <span className="text-foreground/70 group-hover/preview:text-[#ffee72] transition-colors">
              Click snapshot to edit →
            </span>
          </div>

          {/* Arrow pointer connecting popover to the card */}
          {placement === "top" ? (
            <div
              className={`absolute top-full -mt-1.5 w-3 h-3 bg-card/95 dark:bg-zinc-900/95 border-r border-b border-border/80 dark:border-white/15 rotate-45 ${
                align === "left"
                  ? "left-8"
                  : align === "right"
                    ? "right-8"
                    : "left-1/2 -translate-x-1/2"
              }`}
            />
          ) : (
            <div
              className={`absolute bottom-full -mb-1.5 w-3 h-3 bg-card/95 dark:bg-zinc-900/95 border-l border-t border-border/80 dark:border-white/15 rotate-45 ${
                align === "left"
                  ? "left-8"
                  : align === "right"
                    ? "right-8"
                    : "left-1/2 -translate-x-1/2"
              }`}
            />
          )}
        </Link>
      </div>

      {/* In-place Rename Modal */}
      <RenameProjectModal
        open={renameModalOpen}
        onOpenChange={setRenameModalOpen}
        agentId={agent._id}
        currentName={cardName}
        onSuccess={(newName) => {
          setCardName(newName);
          onRefresh();
        }}
      />
    </div>
  );
}
