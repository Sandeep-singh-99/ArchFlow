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
import { Database, Boxes, Copy, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { exportSqlDdl } from "@/lib/sqlDdlExporter";
import { exportNosqlDdl } from "@/lib/nosqlDdlExporter";
import { WorkflowContext } from "@/context/WorkflowContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getSchemaType } from "@/lib/schemaClassifier";

interface SqlExportDialogProps {
  agentDetail?: any;
}

export default function SqlExportDialog({ agentDetail }: SqlExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Options
  const [includeComments, setIncludeComments] = useState(true);
  const [includeDropIfExists, setIncludeDropIfExists] = useState(false);
  const [includeValidators, setIncludeValidators] = useState(true);
  const [includeIndexes, setIncludeIndexes] = useState(true);

  const { addedNodes, nodeEdges } = useContext(WorkflowContext);

  // Fallback to agentDetail nodes/edges if context is empty
  const nodes = addedNodes && addedNodes.length > 0 ? addedNodes : agentDetail?.nodes || [];
  const edges = nodeEdges && nodeEdges.length > 0 ? nodeEdges : agentDetail?.edges || [];

  // Determine whether this schema is SQL or NoSQL
  const schemaType = useMemo(() => {
    return getSchemaType({
      ...agentDetail,
      nodes,
    });
  }, [agentDetail, nodes]);

  const isNoSql = schemaType === "nosql";

  // Generate output code strictly for the project's schema type
  const outputCode = useMemo(() => {
    if (isNoSql) {
      return exportNosqlDdl(nodes, edges, {
        includeComments,
        includeValidators,
        includeIndexes,
      });
    }

    return exportSqlDdl(nodes, edges, {
      dialect: "postgresql",
      includeComments,
      includeDropIfExists,
    });
  }, [
    nodes,
    edges,
    isNoSql,
    includeComments,
    includeDropIfExists,
    includeValidators,
    includeIndexes,
  ]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    toast.success(`Copied ${isNoSql ? "NoSQL" : "SQL"} code to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const rawName = agentDetail?.name || (isNoSql ? "nosql-schema" : "sql-schema");
    const safeName = rawName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const extension = isNoSql ? "nosql.js" : "sql";
    const filename = `${safeName}.${extension}`;

    const mime = isNoSql ? "text/javascript;charset=utf-8" : "text/plain;charset=utf-8";
    const blob = new Blob([outputCode], { type: mime });
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

  // Counts for summary display
  const tableCount = nodes.filter((n: any) => n.type === "SqlTableNode" || n.type === "Table").length;
  const enumCount = nodes.filter((n: any) => n.type === "SqlEnumNode" || n.type === "Enum").length;
  const viewCount = nodes.filter((n: any) => n.type === "SqlViewNode" || n.type === "View").length;
  const sqlIndexCount = nodes.filter((n: any) => n.type === "SqlIndexNode" || n.type === "Index").length;

  const collectionCount = nodes.filter(
    (n: any) => n.type === "NosqlCollectionNode" || n.type === "Collection"
  ).length;
  const embeddedCount = nodes.filter(
    (n: any) => n.type === "NosqlEmbeddedNode" || n.type === "Embedded"
  ).length;
  const nosqlIndexCount = nodes.filter(
    (n: any) => n.type === "NosqlIndexNode"
  ).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 gap-1.5 text-xs font-semibold cursor-pointer shadow-xs ${
            isNoSql
              ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              : "bg-[#ffc507]/10 hover:bg-[#ffc507]/20 text-[#ffee72] border-[#ffdf27]/30"
          }`}
        >
          {isNoSql ? (
            <Boxes className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Database className="h-3.5 w-3.5 text-[#ffdf27]" />
          )}
          <span>{isNoSql ? "Export NoSQL DDL" : "Export SQL DDL"}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              {isNoSql ? (
                <Boxes className="h-4 w-4 text-emerald-400" />
              ) : (
                <Database className="h-4 w-4 text-[#ffdf27]" />
              )}
              <span>{isNoSql ? "Export Real NoSQL DDL" : "Export Real SQL DDL"}</span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {isNoSql
              ? "Generate executable, production-grade MongoDB collection creation scripts, indexes, and document schemas."
              : "Generate executable, production-grade SQL DDL for relational database tables, views, and indexes."}
          </DialogDescription>
        </DialogHeader>

        {/* Format indicator badge & configuration options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-1 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs font-mono font-semibold py-1 px-3 flex items-center gap-1.5 ${
                isNoSql
                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                  : "border-[#ffdf27]/30 text-[#ffee72] bg-[#ffc507]/10"
              }`}
            >
              {isNoSql ? (
                <>
                  <Boxes className="h-3.5 w-3.5 text-emerald-400" />
                  <span>NoSQL (MongoDB / Document Collections)</span>
                </>
              ) : (
                <>
                  <Database className="h-3.5 w-3.5 text-[#ffdf27]" />
                  <span>SQL (Relational / Standard SQL DDL)</span>
                </>
              )}
            </Badge>
          </div>

          {/* Engine-specific Options */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Switch
                id="comments"
                checked={includeComments}
                onCheckedChange={setIncludeComments}
                className="scale-75"
              />
              <Label
                htmlFor="comments"
                className="text-[11px] cursor-pointer text-muted-foreground"
              >
                Comments
              </Label>
            </div>

            {isNoSql ? (
              <>
                <div className="flex items-center gap-1.5">
                  <Switch
                    id="validators"
                    checked={includeValidators}
                    onCheckedChange={setIncludeValidators}
                    className="scale-75"
                  />
                  <Label
                    htmlFor="validators"
                    className="text-[11px] cursor-pointer text-muted-foreground"
                  >
                    Validators
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch
                    id="indexes"
                    checked={includeIndexes}
                    onCheckedChange={setIncludeIndexes}
                    className="scale-75"
                  />
                  <Label
                    htmlFor="indexes"
                    className="text-[11px] cursor-pointer text-muted-foreground"
                  >
                    Indexes
                  </Label>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Switch
                  id="dropIfExists"
                  checked={includeDropIfExists}
                  onCheckedChange={setIncludeDropIfExists}
                  className="scale-75"
                />
                <Label
                  htmlFor="dropIfExists"
                  className="text-[11px] cursor-pointer text-muted-foreground"
                >
                  DROP IF EXISTS
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Schema statistics summary */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground shrink-0 py-1">
          {isNoSql ? (
            <>
              <span>{collectionCount > 0 ? collectionCount : tableCount} Collections</span>
              <span>•</span>
              <span>{embeddedCount} Sub-Docs</span>
              <span>•</span>
              <span>{nosqlIndexCount > 0 ? nosqlIndexCount : sqlIndexCount} Indexes</span>
              <span>•</span>
              <span>{edges.length} References</span>
            </>
          ) : (
            <>
              <span>{tableCount} Tables</span>
              <span>•</span>
              <span>{enumCount} Enums</span>
              <span>•</span>
              <span>{viewCount} Views</span>
              <span>•</span>
              <span>{sqlIndexCount} Indexes</span>
              <span>•</span>
              <span>{edges.length} Relationships</span>
            </>
          )}
        </div>

        {/* Code Preview View */}
        <div className="relative flex-1 min-h-[300px] overflow-hidden rounded-lg border border-border bg-muted/60">
          <pre className="p-4 font-mono text-xs overflow-y-auto max-h-[400px] text-foreground leading-relaxed whitespace-pre select-text">
            {outputCode}
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
                  <span>Copy {isNoSql ? "NoSQL" : "SQL"}</span>
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={downloadFile}
              className={`h-7 gap-1 text-[11px] font-semibold text-white shadow-xs cursor-pointer ${
                isNoSql
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              <Download className="h-3 w-3" />
              <span>Download .{isNoSql ? "js" : "sql"}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
