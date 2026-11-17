"use client";

import React, { useState, useContext, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { WorkflowContext } from "@/context/WorkflowContext";
import { parseMermaidToReactFlow } from "@/lib/mermaidParser";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useReactFlow, Node, Edge } from "@xyflow/react";
import { toast } from "sonner";
import {
  Sparkles,
  GitGraph,
  RotateCcw,
  FileCode2,
  ArrowRightLeft,
  ArrowDownUp,
} from "lucide-react";
import { Agent } from "@/types/AgentTypes";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useAuth } from "@clerk/nextjs";
import { getUserPlanCode, canAccessFeature, notifyFeatureLocked } from "@/lib/planAccess";
import PlanUpgradeModal from "@/components/plans/PlanUpgradeModal";

interface MermaidImportDialogProps {
  agentDetail?: Agent;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

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

  const [mermaidText, setMermaidText] = useState("");
  const [direction, setDirection] = useState<"LR" | "TB">("LR");
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [isGenerating, setIsGenerating] = useState(false);

  const { addedNodes, setAddedNodes, nodeEdges, setNodeEdges } =
    useContext(WorkflowContext);
  const { fitView } = useReactFlow();
  const updateAgentDetail = useMutation(api.agent.UpdateAgentDetail);

  const { userDetails } = useContext(UserDetailContext);
  const { has } = useAuth();
  const userPlan = getUserPlanCode(userDetails, has);
  const isAllowed = canAccessFeature("mermaid_tools", userPlan);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleOpenClick = (e: React.MouseEvent) => {
    if (!isAllowed) {
      e.preventDefault();
      e.stopPropagation();
      notifyFeatureLocked("mermaid_tools", userPlan);
      setShowUpgradeModal(true);
    } else {
      setOpen(true);
    }
  };

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
        const maxY = Math.max(...addedNodes.map((n: Node) => n.position?.y || 0), 0);
        const yOffset = maxY + 240;

        const idMap = new Map<string, string>();
        parsed.nodes.forEach((oldN: Node) => {
          idMap.set(oldN.id, `${oldN.id}-${Date.now().toString().slice(-4)}`);
        });

        const offsetNodes = parsed.nodes.map((n: Node) => ({
          ...n,
          id: idMap.get(n.id) || n.id,
          parentId: n.parentId ? (idMap.get(n.parentId) || n.parentId) : undefined,
          position: {
            x: n.position.x,
            y: n.position.y + yOffset,
          },
        }));

        const offsetEdges = parsed.edges.map((e: Edge) => ({
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
    } catch (err: unknown) {
      console.error("Failed to generate ReactFlow from Mermaid:", err);
      const message = err instanceof Error ? err.message : "Failed to parse Mermaid graph";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <PlanUpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        featureKey="mermaid_tools"
        currentPlan={userPlan}
      />
      <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <span onClick={handleOpenClick} className="cursor-pointer inline-flex">
          {trigger}
        </span>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenClick}
          className="h-8 gap-1.5 text-xs font-semibold bg-primary/5 hover:bg-primary/10 border-primary/20 text-foreground cursor-pointer shadow-xs"
        >
          <GitGraph className="h-3.5 w-3.5 text-primary" />
          <span>Import Mermaid</span>
          {!isAllowed && (
            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] px-1 py-0 font-mono font-bold ml-0.5">
              PRO
            </Badge>
          )}
        </Button>
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
    </>
  );
}
