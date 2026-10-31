"use client";

import React, { useState, useContext } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkflowContext } from "@/context/WorkflowContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useReactFlow } from "@xyflow/react";
import { toast } from "sonner";
import {
  Sparkles,
  FolderTree,
  RotateCcw,
  Boxes,
  Compass,
  ShieldCheck,
  Share2,
  FileJson,
  Check,
  Layers,
  Zap,
} from "lucide-react";
import { Agent } from "@/types/AgentTypes";
import { NOSQL_DEMO_PRESETS, getTwitterFullNosqlDemo } from "@/lib/nosqlTwitterDemo";

interface NosqlDemoDialogProps {
  agentDetail?: Agent;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function NosqlDemoDialog({
  agentDetail,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: NosqlDemoDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [isLoading, setIsLoading] = useState(false);

  const { addedNodes, setAddedNodes, nodeEdges, setNodeEdges } =
    useContext(WorkflowContext);
  const { fitView } = useReactFlow();
  const updateAgentDetail = useMutation(api.agent.UpdateAgentDetail);

  const demoPreset = NOSQL_DEMO_PRESETS[0];

  const handleLoadDemo = async () => {
    try {
      setIsLoading(true);
      const { nodes: demoNodes, edges: demoEdges } = getTwitterFullNosqlDemo();

      let finalNodes = demoNodes;
      let finalEdges = demoEdges;

      if (mode === "append" && addedNodes && addedNodes.length > 0) {
        // Offset to prevent overlapping existing nodes
        const maxY = Math.max(
          ...addedNodes.map((n: any) => n.position?.y || 0),
          0
        );
        const yOffset = maxY + 300;

        const timestamp = Date.now().toString().slice(-4);
        const offsetNodes = demoNodes.map((n: any) => ({
          ...n,
          id: `${n.id}-${timestamp}`,
          position: {
            x: n.position.x,
            y: n.position.y + yOffset,
          },
        }));

        const idMap = new Map<string, string>();
        demoNodes.forEach((oldN: any, idx: number) => {
          idMap.set(oldN.id, offsetNodes[idx].id);
        });

        const offsetEdges = demoEdges.map((e: any, idx: number) => ({
          ...e,
          id: `edge-${timestamp}-${idx}`,
          source: idMap.get(e.source) || e.source,
          target: idMap.get(e.target) || e.target,
        }));

        finalNodes = [...addedNodes, ...offsetNodes];
        finalEdges = [...nodeEdges, ...offsetEdges];
      }

      setAddedNodes(finalNodes);
      setNodeEdges(finalEdges);

      if (agentDetail?._id) {
        await updateAgentDetail({
          id: agentDetail._id,
          nodes: finalNodes,
          edges: finalEdges,
        });
      }

      toast.success("Loaded Twitter / X NoSQL Architecture Demo!", {
        description: `Generated ${demoNodes.length} NoSQL objects with follower graph & fan-out timelines.`,
      });

      setTimeout(() => {
        fitView({ padding: 0.2, duration: 600 });
      }, 150);

      setOpen(false);
    } catch (err: any) {
      console.error("Failed to load NoSQL demo:", err);
      toast.error(err?.message || "Failed to load NoSQL demo");
    } finally {
      setIsLoading(false);
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
            className="h-8 gap-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>NoSQL Demos</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <FolderTree className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <span>NoSQL Architecture Demos</span>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono"
                >
                  Document Store
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Load production-grade NoSQL designs with collections, embedded objects, compound indexes, and validation rules.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Featured Demo Card */}
        <div className="flex-1 overflow-y-auto space-y-4 py-3">
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-4.5 space-y-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    Twitter / X Social Media Architecture
                  </h3>
                  <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono py-0">
                    Production NoSQL
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Engineered for high-throughput tweet writes, sub-millisecond timeline feed reads, and multi-tier social follower graphs.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground shrink-0">
                <span className="px-2 py-0.5 rounded bg-muted/60 border border-border">
                  twitter_app_db
                </span>
              </div>
            </div>

            {/* Architecture Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-lg border border-border/70 bg-background/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <FolderTree className="h-3.5 w-3.5 text-emerald-500" />
                  <span>5 Collections</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Sharded <code className="text-emerald-400">users</code>, <code className="text-emerald-400">tweets</code>, <code className="text-emerald-400">follows</code>, <code className="text-emerald-400">timelines</code>, & <code className="text-emerald-400">notifications</code>.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-border/70 bg-background/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Boxes className="h-3.5 w-3.5 text-fuchsia-400" />
                  <span>Embedded Objects</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  <code className="text-fuchsia-400">MediaAttachment</code> array in tweets + <code className="text-fuchsia-400">UserSettings</code> sub-document.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-border/70 bg-background/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Compass className="h-3.5 w-3.5 text-sky-400" />
                  <span>Indexes & Validation</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Compound author/date indexes, unique follow pair keys, and strict BSON tweet length validators.
                </p>
              </div>
            </div>

            {/* Detailed Component Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border">
                Timeline Fan-out Cache
              </span>
              <span className="px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border">
                Author-to-Tweet 1:N Ref
              </span>
              <span className="px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border">
                Compound Shard Keys
              </span>
              <span className="px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border">
                Strict BSON Validation
              </span>
              <span className="px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border">
                Sample Document Preview
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/80">
          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Canvas Mode:</span>
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => setMode("replace")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
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
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  mode === "append"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Append to Canvas
              </button>
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
              onClick={handleLoadDemo}
              disabled={isLoading}
              className="h-8 gap-1.5 text-xs font-semibold bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-zinc-950 hover:brightness-105 border-none shadow-md cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                  <span>Loading Schema...</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 fill-zinc-950 text-zinc-950" />
                  <span>Load Twitter NoSQL Demo</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
