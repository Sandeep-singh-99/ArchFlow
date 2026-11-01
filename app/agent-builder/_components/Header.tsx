"use client";
import { Agent } from "@/types/AgentTypes";
import {
  ChevronLeft,
  Workflow,
  Database,
  Boxes,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import MermaidImportDialog from "./MermaidImportDialog";
import MermaidExportDialog from "./MermaidExportDialog";
import SqlExportDialog from "./SqlExportDialog";
import ExportImageDialog from "./ExportImageDialog";
import { getSchemaType } from "@/lib/schemaClassifier";

type Props = {
  agentDetail: Agent | undefined;
  previewHeader?: boolean;
};

export default function Header({ agentDetail, previewHeader = false }: Props) {
  const schemaType = getSchemaType(agentDetail);
  const isNoSql = schemaType === "nosql";

  return (
    <div className="w-full px-4 py-2.5 border-b border-border bg-background/90 backdrop-blur flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Back to Dashboard"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-primary" />
          <h2 className="font-bold text-sm text-foreground">
            {agentDetail?.name || "Database Schema Studio"}
          </h2>
          <Badge
            variant="outline"
            className={`text-[10px] font-mono hidden sm:inline-flex items-center gap-1 py-0 px-2 font-medium ${
              isNoSql
                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                : "border-[#ffdf27]/30 text-[#ffee72] bg-[#ffc507]/10"
            }`}
          >
            {isNoSql ? (
              <Boxes className="h-3 w-3 text-emerald-400" />
            ) : (
              <Database className="h-3 w-3 text-[#ffdf27]" />
            )}
            <span>{isNoSql ? "NoSQL Document" : "SQL Relational"}</span>
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* 1. Real SQL DDL Exporter */}
        <SqlExportDialog agentDetail={agentDetail} />

        {/* 2. Export High-Res Image (PNG/SVG) */}
        <ExportImageDialog architectureName={agentDetail?.name || "database-schema"} />

        {/* 3. Mermaid Import & Export Dialogs */}
        <MermaidImportDialog agentDetail={agentDetail} />
        <MermaidExportDialog agentDetail={agentDetail} />
      </div>
    </div>
  );
}
