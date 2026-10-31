"use client";

import React, { useState } from "react";
import Link from "next/link";
import moment from "moment";
import { Agent } from "@/types/AgentTypes";
import { Id } from "@/convex/_generated/dataModel";
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
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { exportSqlDdl } from "@/lib/sqlDdlExporter";
import RenameProjectModal from "./RenameProjectModal";
import { getSchemaType } from "@/lib/schemaClassifier";

interface SchemaTableViewProps {
  agents: Agent[];
  userId?: Id<"UserTable">;
  onDeleteRequest: (agentId: Id<"AgentTable">, agentName: string) => void;
  onRefresh: () => void;
}

export default function SchemaTableView({
  agents,
  userId,
  onDeleteRequest,
  onRefresh,
}: SchemaTableViewProps) {
  const [renameTarget, setRenameTarget] = useState<{
    id: Id<"AgentTable">;
    name: string;
  } | null>(null);

  const duplicateAgentMutation = useMutation(api.agent.DuplicateAgent);

  const handleQuickExportSql = (
    agent: Agent,
    dialect: "postgresql" | "mysql"
  ) => {
    try {
      const ddl = exportSqlDdl(agent.nodes || [], agent.edges || [], {
        dialect,
      });
      const blob = new Blob([ddl], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = (agent.name || "schema")
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

  const handleDuplicate = async (agent: Agent) => {
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
      toast.success(`Duplicated "${agent.name}"`, { id: "duplicate-toast" });
      onRefresh();
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to duplicate schema";
      toast.error(message, { id: "duplicate-toast" });
    }
  };

  const handleCopyAgentId = (agentId: string) => {
    navigator.clipboard.writeText(agentId);
    toast.success("Project ID copied to clipboard");
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 border-b border-border text-muted-foreground font-mono uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4 font-semibold">Schema Name</th>
              <th className="py-3 px-3 font-semibold">Type</th>
              <th className="py-3 px-3 font-semibold">Status</th>
              <th className="py-3 px-3 font-semibold">Entities</th>
              <th className="py-3 px-3 font-semibold">Relations</th>
              <th className="py-3 px-3 font-semibold">Last Modified</th>
              <th className="py-3 px-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {agents.map((agent) => {
              const schemaType = getSchemaType(agent);
              const isNoSql = schemaType === "nosql";

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

              return (
                <tr
                  key={agent._id}
                  className="group hover:bg-muted/20 transition-colors"
                >
                  {/* Schema Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 ${
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
                      <div className="min-w-0">
                        <Link
                          href={`/agent-builder/${agent.agentId}`}
                          className="font-semibold text-foreground hover:text-[#ffee72] transition-colors truncate block max-w-[220px] sm:max-w-[300px]"
                        >
                          {agent.name}
                        </Link>
                        <span className="text-[10px] font-mono text-muted-foreground/70 truncate block">
                          ID: {agent.agentId.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Architecture Type */}
                  <td className="py-3.5 px-3">
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
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3">
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
                  </td>

                  {/* Entities */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                      <Layers className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>
                        {tableCount} {isNoSql ? "collections" : "tables"}
                      </span>
                      {viewCount > 0 && (
                        <span className="text-muted-foreground text-[10px]">
                          (+{viewCount} v)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Relations */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                      <GitFork className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                      <span>{edges.length} {isNoSql ? "relations" : "FK links"}</span>
                    </div>
                  </td>

                  {/* Last Modified */}
                  <td className="py-3.5 px-3 text-muted-foreground font-mono text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{moment(agent._creationTime).fromNow()}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/agent-builder/${agent.agentId}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs font-semibold text-[#ffee72] hover:text-[#ffdf27] hover:bg-[#ffc507]/10 cursor-pointer"
                        >
                          <span>Open</span>
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 z-50">
                          <DropdownMenuItem
                            onClick={() =>
                              setRenameTarget({
                                id: agent._id,
                                name: agent.name,
                              })
                            }
                            className="cursor-pointer gap-2 text-xs"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Rename</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleDuplicate(agent)}
                            className="cursor-pointer gap-2 text-xs"
                          >
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Duplicate</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() =>
                              handleQuickExportSql(agent, "postgresql")
                            }
                            className="cursor-pointer gap-2 text-xs"
                          >
                            <Download className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Export PostgreSQL</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleQuickExportSql(agent, "mysql")}
                            className="cursor-pointer gap-2 text-xs"
                          >
                            <Code2 className="h-3.5 w-3.5 text-sky-500" />
                            <span>Export MySQL</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handleCopyAgentId(agent.agentId)}
                            className="cursor-pointer gap-2 text-xs"
                          >
                            <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Copy ID</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() =>
                              onDeleteRequest(agent._id, agent.name)
                            }
                            className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rename Modal */}
      {renameTarget && (
        <RenameProjectModal
          open={Boolean(renameTarget)}
          onOpenChange={(open) => !open && setRenameTarget(null)}
          agentId={renameTarget.id}
          currentName={renameTarget.name}
          onSuccess={() => {
            setRenameTarget(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
