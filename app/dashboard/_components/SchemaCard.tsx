"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Agent } from "@/types/AgentTypes";
import { Id } from "@/convex/_generated/dataModel";
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
  Code2,
  FileCode,
  Layers,
  GitFork,
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

  const nodes = Array.isArray(agent.nodes) ? agent.nodes : [];
  const edges = Array.isArray(agent.edges) ? agent.edges : [];

  const tableCount = nodes.filter((n: Record<string, unknown>) => {
    const type = (n?.type as string) || "";
    return (
      type === "SqlTableNode" ||
      type === "NosqlCollectionNode" ||
      type === "Table" ||
      type === "Collection"
    );
  }).length;

  const viewCount = nodes.filter((n: Record<string, unknown>) => {
    const type = (n?.type as string) || "";
    return type === "SqlViewNode" || type === "View";
  }).length;

  const handleQuickExportSql = (dialect: "postgresql" | "mysql") => {
    try {
      const ddl = exportSqlDdl(nodes, edges, { dialect });
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
      toast.loading("Duplicating database schema...", {
        id: "duplicate-toast",
      });
      await duplicateAgentMutation({
        agentId: agent._id,
        userId,
      });
      toast.success(`Duplicated "${cardName}"`, { id: "duplicate-toast" });
      onRefresh();
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to duplicate schema";
      toast.error(message, { id: "duplicate-toast" });
    }
  };

  const handleCopyAgentId = () => {
    navigator.clipboard.writeText(agent.agentId);
    toast.success("Project ID copied to clipboard");
  };

  return (
    <div className="group relative rounded-xl border border-border/80 bg-card hover:border-zinc-600 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden">
      {/* Subtle top ambient glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ffdf27]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Main Card Content */}
      <div className="p-4 space-y-3.5">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#ffc507]/10 text-[#ffee72] flex items-center justify-center border border-[#ffdf27]/20 shrink-0 shadow-2xs">
              <Database className="h-4 w-4 text-[#ffdf27]" />
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono py-0 px-2 ${
                agent.published
                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                  : "border-border/60 text-muted-foreground/80 bg-muted/40"
              }`}
            >
              {agent.published ? "Published" : "Draft"}
            </Badge>
          </div>

          {/* Quick Actions Menu */}
          <div className="flex items-center gap-1 shrink-0">
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

        {/* Title */}
        <div>
          <Link
            href={`/agent-builder/${agent.agentId}`}
            className="font-semibold text-sm text-foreground hover:text-[#ffee72] transition-colors truncate block"
            title={cardName}
          >
            {cardName}
          </Link>
        </div>

        {/* Entity Stats Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-md bg-muted/50 border border-border/60 text-foreground">
            <Layers className="h-3 w-3 text-emerald-400 shrink-0" />
            <span>
              {tableCount} {tableCount === 1 ? "table" : "tables"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-md bg-muted/50 border border-border/60 text-foreground">
            <GitFork className="h-3 w-3 text-sky-400 shrink-0" />
            <span>
              {edges.length} {edges.length === 1 ? "relation" : "relations"}
            </span>
          </div>
          {viewCount > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-muted/50 border border-border/60 text-muted-foreground">
              <span>{viewCount} views</span>
            </div>
          )}
        </div>

      </div>

      {/* Footer Action Row */}
      <div className="px-4 py-2.5 bg-muted/20 border-t border-border/60 flex items-center justify-end">
        <Link href={`/agent-builder/${agent.agentId}`}>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2.5 gap-1.5 text-xs font-semibold text-[#ffee72] hover:text-[#ffdf27] hover:bg-[#ffc507]/10 cursor-pointer"
          >
            <span>Open Canvas</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
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
