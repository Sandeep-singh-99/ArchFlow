"use client";

import React, { useState, useContext, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { WorkflowContext } from "@/context/WorkflowContext";
import { parseMermaidToReactFlow } from "@/lib/mermaidParser";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useReactFlow } from "@xyflow/react";
import { toast } from "sonner";
import {
  Sparkles,
  GitGraph,
  RotateCcw,
  FileCode2,
  ArrowRightLeft,
  ArrowDownUp,
  LayoutGrid,
} from "lucide-react";
import { Agent } from "@/types/AgentTypes";

interface MermaidImportDialogProps {
  agentDetail?: Agent;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const TEMPLATES = [
  {
    name: "E-Commerce ERD",
    code: `erDiagram
    USERS ||--o{ ORDERS : "places"
    CATEGORIES ||--o{ PRODUCTS : "categorizes"
    ORDERS ||--|{ ORDER_ITEMS : "contains"
    PRODUCTS ||--o{ ORDER_ITEMS : "ordered_in"
    ORDERS ||--o| PAYMENTS : "settles"

    USERS {
        uuid id PK
        varchar email UK "Login email"
        varchar full_name "Customer name"
        varchar role "admin, customer"
        timestamp created_at
    }

    CATEGORIES {
        uuid id PK
        varchar name UK
        varchar slug UK
    }

    PRODUCTS {
        uuid id PK
        uuid category_id FK
        varchar title
        varchar sku UK
        decimal price
        int stock_quantity
    }

    ORDERS {
        uuid id PK
        uuid user_id FK
        varchar order_status
        decimal total_amount
        timestamp created_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
    }

    PAYMENTS {
        uuid id PK
        uuid order_id FK
        varchar payment_method
        decimal amount
        timestamp processed_at
    }`,
  },
  {
    name: "Domains & Microservices",
    code: `graph LR
    subgraph Identity["Identity Domain"]
        USERS[("USERS<br/>• id (PK)<br/>• email (UK)<br/>• full_name")]
        SESSIONS[("USER_SESSIONS<br/>• id (PK)<br/>• user_id (FK)<br/>• token")]
    end

    subgraph Catalog["Catalog Domain"]
        PRODUCTS[("PRODUCTS<br/>• id (PK)<br/>• title<br/>• price")]
        CATEGORIES[("CATEGORIES<br/>• id (PK)<br/>• name")]
    end

    subgraph Billing["Billing Domain"]
        ORDERS[("ORDERS<br/>• id (PK)<br/>• user_id (FK)<br/>• total")]
        PAYMENTS[("PAYMENTS<br/>• id (PK)<br/>• order_id (FK)<br/>• amount")]
    end

    USERS --> SESSIONS
    CATEGORIES --> PRODUCTS
    USERS --> ORDERS
    PRODUCTS --> ORDERS
    ORDERS --> PAYMENTS`,
  },
  {
    name: "RBAC Roles & Permissions",
    code: `erDiagram
    USERS ||--o{ USER_ROLES : "assigned"
    ROLES ||--o{ USER_ROLES : "granted"
    ROLES ||--o{ ROLE_PERMISSIONS : "includes"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "belongs_to"

    USERS {
        uuid id PK
        varchar email UK
        varchar username UK
        boolean is_active
        timestamp created_at
    }

    ROLES {
        uuid id PK
        varchar name UK "admin, editor, viewer"
        varchar description
    }

    PERMISSIONS {
        uuid id PK
        varchar code UK "users:read, orders:write"
        varchar resource
    }

    USER_ROLES {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
        timestamp assigned_at
    }

    ROLE_PERMISSIONS {
        uuid id PK
        uuid role_id FK
        uuid permission_id FK
    }`,
  },
];

export default function MermaidImportDialog({
  agentDetail,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: MermaidImportDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [mermaidText, setMermaidText] = useState(TEMPLATES[0].code);
  const [direction, setDirection] = useState<"LR" | "TB">("LR");
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [isGenerating, setIsGenerating] = useState(false);

  const { addedNodes, setAddedNodes, nodeEdges, setNodeEdges } =
    useContext(WorkflowContext);
  const { fitView } = useReactFlow();
  const updateAgentDetail = useMutation(api.agent.UpdateAgentDetail);

  // Live parse preview stats with chosen layout direction
  const previewStats = useMemo(() => {
    try {
      if (!mermaidText.trim()) return null;
      return parseMermaidToReactFlow(mermaidText, { direction });
    } catch {
      return null;
    }
  }, [mermaidText, direction]);

  const handleGenerate = async () => {
    if (!mermaidText.trim()) {
      toast.error("Please enter raw Mermaid syntax");
      return;
    }

    try {
      setIsGenerating(true);
      const parsed = parseMermaidToReactFlow(mermaidText, { direction });

      if (parsed.nodeCount === 0) {
        toast.error("Could not parse any nodes. Check your Mermaid syntax (e.g., erDiagram or A --> B)");
        return;
      }

      let finalNodes = parsed.nodes;
      let finalEdges = parsed.edges;

      if (mode === "append" && addedNodes && addedNodes.length > 0) {
        // Offset appended nodes to prevent overlapping
        const maxY = Math.max(...addedNodes.map((n: any) => n.position?.y || 0), 0);
        const yOffset = maxY + 240;

        const idMap = new Map<string, string>();
        parsed.nodes.forEach((oldN: any) => {
          idMap.set(oldN.id, `${oldN.id}-${Date.now().toString().slice(-4)}`);
        });

        const offsetNodes = parsed.nodes.map((n: any) => ({
          ...n,
          id: idMap.get(n.id) || n.id,
          parentId: n.parentId ? (idMap.get(n.parentId) || n.parentId) : undefined,
          position: {
            x: n.position.x,
            y: n.position.y + yOffset,
          },
        }));

        const offsetEdges = parsed.edges.map((e: any) => ({
          ...e,
          id: `edge-${idMap.get(e.source) || e.source}-${idMap.get(e.target) || e.target}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          source: idMap.get(e.source) || e.source,
          target: idMap.get(e.target) || e.target,
        }));

        finalNodes = [...addedNodes, ...offsetNodes];
        finalEdges = [...(nodeEdges || []), ...offsetEdges];
      }

      // 1. Update ReactFlow Canvas state
      setAddedNodes(finalNodes);
      setNodeEdges(finalEdges);

      // 2. Persist to Convex DB if agentDetail is present
      if (agentDetail?._id) {
        await updateAgentDetail({
          id: agentDetail._id,
          nodes: finalNodes,
          edges: finalEdges,
        });
      }

      toast.success(
        `Generated ${parsed.nodeCount} nodes & ${parsed.edgeCount} relationships!`,
        {
          description: `Auto-layout applied in ${direction === "LR" ? "Horizontal (Left-to-Right)" : "Vertical (Top-to-Bottom)"} mode.`,
        }
      );

      // 3. Smooth fitView animation to newly created canvas
      setTimeout(() => {
        fitView({ padding: 0.25, duration: 600 });
      }, 150);

      setOpen(false);
    } catch (err: any) {
      console.error("Failed to generate ReactFlow from Mermaid:", err);
      toast.error(err?.message || "Failed to parse Mermaid graph");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold bg-primary/5 hover:bg-primary/10 border-primary/20 text-foreground cursor-pointer shadow-xs"
          >
            <GitGraph className="h-3.5 w-3.5 text-primary" />
            <span>Import Mermaid</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[92vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FileCode2 className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Mermaid to Architecture Canvas</span>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-mono">
                    Auto-Layout v2.0
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Import ER diagrams or flowcharts. Entities, typed columns, foreign keys, and domain subgraphs are generated automatically.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-2 pt-2 pb-1 overflow-x-auto shrink-0">
          <span className="text-[11px] font-mono text-muted-foreground shrink-0">Presets:</span>
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              type="button"
              onClick={() => setMermaidText(tmpl.code)}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted/50 hover:bg-muted border border-border/70 text-foreground transition-colors cursor-pointer shrink-0"
            >
              {tmpl.name}
            </button>
          ))}
        </div>

        {/* Raw Mermaid Editor Area */}
        <div className="flex-1 flex flex-col min-h-[260px] max-h-[380px] relative my-2">
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border border-b-0 border-border rounded-t-lg text-[11px] text-muted-foreground font-mono">
            <span>mermaid-diagram.mmd</span>
            <div className="flex items-center gap-2">
              {previewStats && (
                <span className="text-emerald-500 font-medium">
                  ✓ {previewStats.nodeCount} Entities, {previewStats.edgeCount} Relationships ({direction})
                </span>
              )}
              <button
                type="button"
                onClick={() => setMermaidText("")}
                className="hover:text-foreground transition-colors cursor-pointer"
                title="Clear input"
              >
                Clear
              </button>
            </div>
          </div>
          <Textarea
            value={mermaidText}
            onChange={(e) => setMermaidText(e.target.value)}
            placeholder={`erDiagram\n    USERS ||--o{ ORDERS : places\n    USERS {\n        uuid id PK\n        string email UK\n    }`}
            className="flex-1 font-mono text-xs p-3.5 rounded-t-none rounded-b-lg border-border resize-none bg-muted/30 focus-visible:ring-1 focus-visible:ring-primary leading-relaxed"
            rows={12}
            spellCheck={false}
          />
        </div>

        {/* Controls Footer */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/80">
          {/* Layout Direction & Canvas Mode */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Direction Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Layout:</span>
              <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
                <button
                  type="button"
                  onClick={() => setDirection("LR")}
                  className={`px-2 py-1 text-xs rounded-md font-medium transition-all cursor-pointer flex items-center gap-1 ${
                    direction === "LR"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Horizontal Layout (Left to Right)"
                >
                  <ArrowRightLeft className="h-3 w-3" />
                  <span>Left to Right (LR)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("TB")}
                  className={`px-2 py-1 text-xs rounded-md font-medium transition-all cursor-pointer flex items-center gap-1 ${
                    direction === "TB"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Vertical Layout (Top to Bottom)"
                >
                  <ArrowDownUp className="h-3 w-3" />
                  <span>Top to Bottom (TB)</span>
                </button>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Mode:</span>
              <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
                <button
                  type="button"
                  onClick={() => setMode("replace")}
                  className={`px-2 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                    mode === "replace"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Replace Canvas
                </button>
                <button
                  type="button"
                  onClick={() => setMode("append")}
                  className={`px-2 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                    mode === "append"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Add to Canvas
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 text-xs font-medium cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating || !mermaidText.trim()}
              className="h-8 gap-1.5 text-xs font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none shadow-md cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 animate-spin text-zinc-950" />
                  <span>Organizing Canvas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-zinc-950" />
                  <span>Import & Auto-Layout</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
