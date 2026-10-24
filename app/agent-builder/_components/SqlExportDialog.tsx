"use client";

import React, { useState, useMemo, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Copy, Check, Download, Sparkles, Code2 } from "lucide-react";
import { toast } from "sonner";
import { exportSqlDdl, SqlExportOptions } from "@/lib/sqlDdlExporter";
import { WorkflowContext } from "@/context/WorkflowContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SqlExportDialogProps {
  agentDetail?: any;
}

export default function SqlExportDialog({ agentDetail }: SqlExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [dialect, setDialect] = useState<"postgresql" | "mysql">("postgresql");
  const [includeComments, setIncludeComments] = useState(true);
  const [includeDropIfExists, setIncludeDropIfExists] = useState(false);
  const [copied, setCopied] = useState(false);

  const { addedNodes, nodeEdges } = useContext(WorkflowContext);

  // Fallback to agentDetail nodes/edges if context is empty
  const nodes = (addedNodes && addedNodes.length > 0) ? addedNodes : (agentDetail?.nodes || []);
  const edges = (nodeEdges && nodeEdges.length > 0) ? nodeEdges : (agentDetail?.edges || []);

  const sqlCode = useMemo(() => {
    return exportSqlDdl(nodes, edges, {
      dialect,
      includeComments,
      includeDropIfExists,
    });
  }, [nodes, edges, dialect, includeComments, includeDropIfExists]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    toast.success(`Copied ${dialect === "postgresql" ? "PostgreSQL" : "MySQL"} SQL to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSqlFile = () => {
    const rawName = agentDetail?.name || "database-schema";
    const safeName = rawName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const filename = `${safeName}-${dialect}.sql`;

    const blob = new Blob([sqlCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded ${filename} successfully!`);
  };

  const tableCount = nodes.filter((n: any) => n.type === "SqlTableNode" || n.type === "Table").length;
  const enumCount = nodes.filter((n: any) => n.type === "SqlEnumNode" || n.type === "Enum").length;
  const viewCount = nodes.filter((n: any) => n.type === "SqlViewNode" || n.type === "View").length;
  const indexCount = nodes.filter((n: any) => n.type === "SqlIndexNode" || n.type === "Index").length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 cursor-pointer shadow-xs"
        >
          <Database className="h-3.5 w-3.5 text-emerald-500" />
          <span>Export SQL DDL</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-emerald-500" />
              <span>Export Real SQL DDL (PostgreSQL & MySQL)</span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Generates production-grade, executable DDL for tables, enums, views, foreign keys, and indexes.
          </DialogDescription>
        </DialogHeader>

        {/* Dialect selector & options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-1 border-b border-border shrink-0">
          <Tabs
            value={dialect}
            onValueChange={(val) => setDialect(val as "postgresql" | "mysql")}
            className="w-auto"
          >
            <TabsList className="h-8 bg-muted p-1">
              <TabsTrigger value="postgresql" className="text-xs font-semibold h-6 px-3">
                PostgreSQL (16+)
              </TabsTrigger>
              <TabsTrigger value="mysql" className="text-xs font-semibold h-6 px-3">
                MySQL (8.0+)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Switch
                id="comments"
                checked={includeComments}
                onCheckedChange={setIncludeComments}
                className="scale-75"
              />
              <Label htmlFor="comments" className="text-[11px] cursor-pointer text-muted-foreground">
                Comments
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Switch
                id="dropIfExists"
                checked={includeDropIfExists}
                onCheckedChange={setIncludeDropIfExists}
                className="scale-75"
              />
              <Label htmlFor="dropIfExists" className="text-[11px] cursor-pointer text-muted-foreground">
                DROP IF EXISTS
              </Label>
            </div>
          </div>
        </div>

        {/* Schema statistics summary */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground shrink-0 py-1">
          <span>{tableCount} Tables</span>
          <span>•</span>
          <span>{enumCount} Enums</span>
          <span>•</span>
          <span>{viewCount} Views</span>
          <span>•</span>
          <span>{indexCount} Indexes</span>
          <span>•</span>
          <span>{edges.length} Relationships</span>
        </div>

        {/* SQL Code View */}
        <div className="relative flex-1 min-h-[300px] overflow-hidden rounded-lg border border-border bg-muted/60">
          <pre className="p-4 font-mono text-xs overflow-y-auto max-h-[400px] text-foreground leading-relaxed whitespace-pre select-text">
            {sqlCode}
          </pre>

          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={copyToClipboard}
              className="h-7 gap-1 text-[11px] font-semibold bg-background/90 backdrop-blur shadow-xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy SQL</span>
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={downloadSqlFile}
              className="h-7 gap-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span>Download .sql</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
