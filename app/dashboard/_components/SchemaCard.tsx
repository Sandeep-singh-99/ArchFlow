"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { DashboardProject } from "@/app/dashboard/_components/MyAgents";
import { Id } from "@/convex/_generated/dataModel";
import RenameProjectModal from "./RenameProjectModal";
import { downloadProjectSql } from "@/app/dashboard/_components/downloadProjectSql";
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
  Boxes,
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
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getSchemaType } from "@/lib/schemaClassifier";

interface SchemaCardProps {
  agent: DashboardProject;
  userId?: Id<"UserTable">;
  onDeleteRequest: (agentId: Id<"AgentTable">, agentName: string) => void;
}

export default function SchemaCard({
  agent,
  userId,
  onDeleteRequest,
}: SchemaCardProps) {
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const cardName = agent.name || "Untitled schema";
  const convex = useConvex();
  const duplicateAgentMutation = useMutation(api.agent.DuplicateAgent);

  const schemaType = getSchemaType(agent);
  const isNoSql = schemaType === "nosql";

  const { tableCount = 0, viewCount = 0, relationCount = 0 } = agent;

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
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card motion-safe:transition-colors hover:border-white/20 focus-within:border-white/20">
      {/* Subtle top ambient glow */}
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${
          isNoSql ? "via-emerald-500/35" : "via-[#ffdf27]/25"
        } to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}
      />

      {/* Main Card Content */}
      <div className="flex-1 space-y-3">
        {/* Header Bar */}
        <div className={`flex items-center justify-between gap-2 border-b border-border bg-[radial-gradient(#ffffff20_1px,transparent_1px)] bg-size-[14px_14px] p-4 ${isNoSql ? "bg-[#10201e]" : "bg-[#1c1826]"}`}>
          <div className="flex items-center gap-2">
            <div
              className={`size-10 rounded-xl flex items-center justify-center border shrink-0 shadow-2xs ${
                isNoSql
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-[#ffc507]/10 text-[#ffee72] border-[#ffdf27]/20"
              }`}
            >
              {isNoSql ? (
                <Boxes className="h-4 w-4 text-emerald-400" />
              ) : (
                <Database className="h-4 w-4 text-[#ffdf27]" />
              )}
            </div>

            {/* Architecture Type Badge */}
            <Badge
              variant="outline"
              className={`text-[10px] font-mono py-0 px-2 font-medium ${
                isNoSql
                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                  : "border-[#ffdf27]/30 text-[#ffee72] bg-[#ffc507]/10"
              }`}
            >
              {isNoSql ? "NoSQL" : "SQL"}
            </Badge>

            {/* Status Badge */}
            <Badge
              variant="outline"
              className={`text-[10px] font-mono py-0 px-2 ${
                agent.published
                  ? "border-sky-500/30 text-sky-400 bg-sky-500/10"
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
                  className="size-9 bg-card/80 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md cursor-pointer"
                  aria-label={`Actions for ${cardName}`} title="Actions"
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
                  onClick={() => downloadProjectSql(convex, agent, "postgresql")}
                  className="cursor-pointer gap-2 text-xs"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Export PostgreSQL</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => downloadProjectSql(convex, agent, "mysql")}
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
        <h3 className="px-4 pt-0.5">
          <Link
            href={`/agent-builder/${agent.agentId}`}
            className="block truncate rounded-sm text-base font-semibold tracking-tight text-foreground outline-none hover:text-[#ffe47a] focus-visible:ring-2 focus-visible:ring-[#ffe47a]"
            title={cardName}
          >
            {cardName}
          </Link>
        </h3>

        {/* Entity Stats Chips */}
        <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
          <div className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-md bg-muted/50 border border-border/60 text-foreground">
            <Layers className="h-3 w-3 text-emerald-400 shrink-0" />
            <span>
              {tableCount} {isNoSql ? (tableCount === 1 ? "collection" : "collections") : (tableCount === 1 ? "table" : "tables")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-md bg-muted/50 border border-border/60 text-foreground">
            <GitFork className="h-3 w-3 text-sky-400 shrink-0" />
            <span>
              {relationCount} {relationCount === 1 ? "relation" : "relations"}
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
      <div className="flex items-center justify-end border-t border-border bg-muted/25 px-3 py-2">
        <Button asChild size="sm" variant="ghost" className="gap-1.5 text-xs font-semibold text-[#ffe47a] hover:bg-[#ffe47a]/10 hover:text-[#ffed9d]">
          <Link href={`/agent-builder/${agent.agentId}`} aria-label={`Open canvas for ${cardName}`}>
            Open canvas <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </Button>
      </div>

      {/* In-place Rename Modal */}
      <RenameProjectModal
        open={renameModalOpen}
        onOpenChange={setRenameModalOpen}
        agentId={agent._id}
        currentName={cardName}
      />
    </article>
  );
}
