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
import {
  FileCode,
  Copy,
  Check,
  Download,
  ExternalLink,
  GitGraph,
  Layers,
  ArrowDownUp,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";
import { exportMermaid } from "@/lib/mermaidExporter";
import { WorkflowContext } from "@/context/WorkflowContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Agent } from "@/types/AgentTypes";

interface MermaidExportDialogProps {
  agentDetail?: Agent;
}

export default function MermaidExportDialog({ agentDetail }: MermaidExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Configuration States
  const [format, setFormat] = useState<"erDiagram" | "flowchart">("erDiagram");
  const [direction, setDirection] = useState<"TD" | "LR">("TD");
  const [includeColumns, setIncludeColumns] = useState(true);
  const [includeDataTypes, setIncludeDataTypes] = useState(true);
  const [includeComments, setIncludeComments] = useState(true);
  const [includeDomains, setIncludeDomains] = useState(true);

  // Live Canvas Context integration
  const { addedNodes, nodeEdges } = useContext(WorkflowContext);
  const nodes = addedNodes && addedNodes.length > 0 ? addedNodes : agentDetail?.nodes || [];
  const edges = nodeEdges && nodeEdges.length > 0 ? nodeEdges : agentDetail?.edges || [];

  // Generate dynamic Mermaid.js syntax
  const mermaidCode = useMemo(() => {
    return exportMermaid(nodes, edges, {
      format,
      direction,
      includeColumns,
      includeDataTypes,
      includeComments,
      includeDomains,
    });
  }, [
    nodes,
    edges,
    format,
    direction,
    includeColumns,
    includeDataTypes,
    includeComments,
    includeDomains,
  ]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    toast.success("Mermaid syntax copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const rawName = agentDetail?.name || "architecture-schema";
    const safeName = rawName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const filename = `${safeName}-${format}.mmd`;

    const blob = new Blob([mermaidCode], { type: "text/plain;charset=utf-8" });
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

  const openMermaidLive = () => {
    try {
      const state = {
        code: mermaidCode,
        mermaid: { theme: "default" },
        autoSync: true,
        updateDiagram: true,
      };
      const json = JSON.stringify(state);
      // pako / base64 json for mermaid live editor
      const base64 = btoa(unescape(encodeURIComponent(json)));
      window.open(`https://mermaid.live/edit#base64:${base64}`, "_blank");
    } catch {
      window.open("https://mermaid.live/edit", "_blank");
    }
  };

  const tableCount = nodes.filter(
    (n: any) =>
      n.type === "SqlTableNode" ||
      n.type === "NosqlCollectionNode" ||
      n.type === "Table" ||
      n.type === "Collection"
  ).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-semibold hidden md:inline-flex cursor-pointer hover:bg-muted/80"
        >
          <FileCode className="h-3.5 w-3.5 text-primary" />
          <span>Export Mermaid</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <GitGraph className="h-4 w-4 text-primary" />
              <span>Export Mermaid.js Diagram</span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Export production-ready Mermaid syntax for GitHub READMEs, Notion docs, GitLab wikis, and Architecture RFCs.
          </DialogDescription>
        </DialogHeader>

        {/* Format Selector and Diagram Options */}
        <div className="flex flex-col gap-2.5 pt-2 pb-2 border-b border-border shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Format toggle: ER Diagram vs Flowchart */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/60 border border-border">
              <Button
                type="button"
                variant={format === "erDiagram" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFormat("erDiagram")}
                className="h-7 text-xs gap-1.5 font-medium px-3"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>ER Diagram (erDiagram)</span>
              </Button>
              <Button
                type="button"
                variant={format === "flowchart" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFormat("flowchart")}
                className="h-7 text-xs gap-1.5 font-medium px-3"
              >
                <GitGraph className="h-3.5 w-3.5" />
                <span>Architecture Flowchart</span>
              </Button>
            </div>

            {/* Counts Badge */}
            <Badge variant="outline" className="text-[11px] font-mono py-1 px-2.5 text-muted-foreground">
              {tableCount} tables • {edges.length} edges
            </Badge>
          </div>

          {/* Contextual Options Row */}
          <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
            {format === "erDiagram" ? (
              <>
                <div className="flex items-center gap-1.5">
                  <Switch
                    id="include-columns"
                    checked={includeColumns}
                    onCheckedChange={setIncludeColumns}
                    className="scale-75"
                  />
                  <Label htmlFor="include-columns" className="text-[11px] cursor-pointer text-muted-foreground">
                    Columns & Keys
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch
                    id="include-datatypes"
                    checked={includeDataTypes}
                    onCheckedChange={setIncludeDataTypes}
                    disabled={!includeColumns}
                    className="scale-75"
                  />
                  <Label htmlFor="include-datatypes" className="text-[11px] cursor-pointer text-muted-foreground">
                    Data Types
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch
                    id="include-comments"
                    checked={includeComments}
                    onCheckedChange={setIncludeComments}
                    className="scale-75"
                  />
                  <Label htmlFor="include-comments" className="text-[11px] cursor-pointer text-muted-foreground">
                    Comments
                  </Label>
                </div>
              </>
            ) : (
              <>
                {/* Flowchart Direction Toggle */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">Direction:</span>
                  <div className="flex items-center rounded-md border border-border p-0.5 bg-muted/40">
                    <Button
                      type="button"
                      variant={direction === "TD" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setDirection("TD")}
                      className="h-6 px-2 text-[10px] gap-1"
                    >
                      <ArrowDownUp className="h-3 w-3" />
                      <span>TD (Vertical)</span>
                    </Button>
                    <Button
                      type="button"
                      variant={direction === "LR" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setDirection("LR")}
                      className="h-6 px-2 text-[10px] gap-1"
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      <span>LR (Horizontal)</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Switch
                    id="include-flow-cols"
                    checked={includeColumns}
                    onCheckedChange={setIncludeColumns}
                    className="scale-75"
                  />
                  <Label htmlFor="include-flow-cols" className="text-[11px] cursor-pointer text-muted-foreground">
                    Column Previews
                  </Label>
                </div>

                <div className="flex items-center gap-1.5">
                  <Switch
                    id="include-domains"
                    checked={includeDomains}
                    onCheckedChange={setIncludeDomains}
                    className="scale-75"
                  />
                  <Label htmlFor="include-domains" className="text-[11px] cursor-pointer text-muted-foreground">
                    Domain Subgraphs
                  </Label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Code Preview Box */}
        <div className="relative mt-2 flex-1 min-h-[220px]">
          <pre className="p-4 rounded-lg bg-muted border border-border font-mono text-xs overflow-x-auto text-foreground max-h-[340px] leading-relaxed selection:bg-primary/20">
            {mermaidCode}
          </pre>

          <Button
            size="sm"
            variant="outline"
            onClick={copyToClipboard}
            className="absolute top-2.5 right-2.5 h-7 gap-1 text-[11px] font-semibold bg-card/90 shadow-xs cursor-pointer hover:bg-card"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy Code</span>
              </>
            )}
          </Button>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border mt-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={openMermaidLive}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            title="Open in official Mermaid Live Editor"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open in Mermaid Live</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>

            <Button
              size="sm"
              onClick={downloadFile}
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download .mmd</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
