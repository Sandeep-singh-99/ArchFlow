"use client";
import { Button } from "@/components/ui/button";
import { Agent } from "@/types/AgentTypes";
import {
  ChevronLeft,
  FileCode,
  Share2,
  Workflow,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useContext } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import MermaidImportDialog from "./MermaidImportDialog";
import SqlExportDialog from "./SqlExportDialog";
import ExportImageDialog from "./ExportImageDialog";
import { WorkflowContext } from "@/context/WorkflowContext";
import { generateAllDomainsDemoSchema } from "@/lib/demoDomainSchema";

type Props = {
  agentDetail: Agent | undefined;
  previewHeader?: boolean;
};

export default function Header({ agentDetail, previewHeader = false }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const publishAgent = useMutation(api.agent.PublishAgent);
  const { setAddedNodes, setNodeEdges } = useContext(WorkflowContext);

  const handleLoadAllDomainsDemo = () => {
    const demo = generateAllDomainsDemoSchema();
    setAddedNodes(demo.nodes);
    setNodeEdges(demo.edges);
    toast.success("Loaded Enterprise 8-Domain Architecture Demo!");
  };

  const handlePublish = async () => {
    if (!agentDetail?._id) return;
    try {
      await publishAgent({
        id: agentDetail._id,
        published: true,
      });
      toast.success("Architecture published successfully!");
      setOpen(true);
    } catch (error) {
      toast.error("Failed to publish architecture");
      console.error(error);
    }
  };

  // Generate dynamic Mermaid.js syntax from nodes if present
  const nodes = agentDetail?.nodes || [];
  const edges = agentDetail?.edges || [];

  let mermaidCode = "graph TD\n";
  if (nodes.length > 0) {
    nodes.forEach((n: any) => {
      const label = n.data?.label || n.type;
      mermaidCode += `    ${n.id}["${label}"]\n`;
    });
    if (edges.length > 0) {
      edges.forEach((e: any) => {
        mermaidCode += `    ${e.source} --> ${e.target}\n`;
      });
    } else {
      mermaidCode += "    %% Connect your nodes on the canvas to generate edges\n";
    }
  } else {
    mermaidCode = "erDiagram\n    USERS ||--o{ ORDERS : places\n    ORDERS ||--|{ ORDER_ITEMS : contains\n    PRODUCTS ||--o{ ORDER_ITEMS : ordered_in\n";
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    toast.success("Mermaid syntax copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

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
          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border hidden sm:inline">
            Database Schema Studio
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Load All Domains Demo */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLoadAllDomainsDemo}
          className="h-8 gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer hidden lg:inline-flex"
          title="Load all 8 domains (Auth, Billing, Catalog, Users, Comms, Analytics, Audit, Core) demo schema"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
          <span>All Domains Demo</span>
        </Button>

        {/* 1. Real SQL DDL Exporter */}
        <SqlExportDialog agentDetail={agentDetail} />

        {/* 4. Export High-Res Image (PNG/SVG) */}
        <ExportImageDialog architectureName={agentDetail?.name || "database-schema"} />

        <MermaidImportDialog agentDetail={agentDetail} />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="h-8 gap-1.5 text-xs font-semibold hidden md:inline-flex"
        >
          <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Export Mermaid</span>
        </Button>

        <Button
          size="sm"
          onClick={handlePublish}
          className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Share & Publish</span>
        </Button>

        {/* Export Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileCode className="h-4 w-4 text-primary" />
                <span>Architecture Mermaid.js Code</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Paste this into your GitHub README, Notion document, or Architecture RFC for instant rendering.
              </DialogDescription>
            </DialogHeader>

            <div className="relative mt-2">
              <pre className="p-4 rounded-lg bg-muted border border-border font-mono text-xs overflow-x-auto text-foreground max-h-[300px]">
                {mermaidCode}
              </pre>
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                className="absolute top-2.5 right-2.5 h-7 gap-1 text-[11px] font-semibold bg-card/80"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-primary" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
