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
  Play,
  RotateCcw,
  Check,
  Layers,
  ArrowRight,
  FileCode2,
} from "lucide-react";
import { Agent } from "@/types/AgentTypes";

interface MermaidImportDialogProps {
  agentDetail?: Agent;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const PRESET_TEMPLATES = [
  {
    name: "Fullstack App",
    badge: "Popular",
    code: `graph TD
    Start([Start]) --> WebApp["Frontend Web App"]
    WebApp --> ApiGateway["API Gateway Server"]
    ApiGateway --> AuthCheck{"Is Authenticated?"}
    AuthCheck -->|Valid| MainDB[("PostgreSQL Database")]
    AuthCheck -->|Invalid| End([End])
    MainDB --> End([End])`,
  },
  {
    name: "Auth & Decision",
    badge: "Logic Flow",
    code: `graph TD
    Start([Start]) --> LoginScreen["User Login UI"]
    LoginScreen --> AuthService["Auth Microservice"]
    AuthService --> CheckUser{"Verify Credentials"}
    CheckUser -->|Success| UserDashboard["Dashboard UI"]
    CheckUser -->|Failure| ErrorToast["Error Handler"]
    UserDashboard --> End([End])
    ErrorToast --> End([End])`,
  },
  {
    name: "AI Agent Pipeline",
    badge: "AI & RAG",
    code: `graph LR
    Start([Start]) --> UserInput["User Chat Interface"]
    UserInput --> ModelRouter{"Agent Router"}
    ModelRouter -->|Code Task| CodeAgent["Claude Coding Specialist"]
    ModelRouter -->|General| VectorDB[("Pinecone Vector Store")]
    CodeAgent --> ResponseFormatter["Response Formatter"]
    VectorDB --> ResponseFormatter
    ResponseFormatter --> End([End])`,
  },
  {
    name: "Microservices & Cache",
    badge: "Backend",
    code: `graph TD
    Start([Start]) --> Ingress["Cloudflare Edge"]
    Ingress --> ApiService["NestJS Backend"]
    ApiService --> CacheCheck{"Cache Hit?"}
    CacheCheck -->|Yes| RedisCache[("Redis Cache")]
    CacheCheck -->|No| PrimaryDB[("PostgreSQL Primary")]
    RedisCache --> End([End])
    PrimaryDB --> End([End])`,
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

  const [mermaidText, setMermaidText] = useState(PRESET_TEMPLATES[0].code);
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [isGenerating, setIsGenerating] = useState(false);

  const { addedNodes, setAddedNodes, nodeEdges, setNodeEdges } =
    useContext(WorkflowContext);
  const { fitView } = useReactFlow();
  const updateAgentDetail = useMutation(api.agent.UpdateAgentDetail);

  // Live parse preview stats
  const previewStats = useMemo(() => {
    try {
      if (!mermaidText.trim()) return null;
      return parseMermaidToReactFlow(mermaidText);
    } catch {
      return null;
    }
  }, [mermaidText]);

  const handleGenerate = async () => {
    if (!mermaidText.trim()) {
      toast.error("Please enter raw Mermaid syntax");
      return;
    }

    try {
      setIsGenerating(true);
      const parsed = parseMermaidToReactFlow(mermaidText);

      if (parsed.nodeCount === 0) {
        toast.error("Could not parse any nodes. Check your Mermaid syntax (e.g., A --> B)");
        return;
      }

      let finalNodes = parsed.nodes;
      let finalEdges = parsed.edges;

      if (mode === "append" && addedNodes && addedNodes.length > 0) {
        // Offset appended nodes to prevent overlapping
        const maxY = Math.max(...addedNodes.map((n: any) => n.position?.y || 0), 0);
        const yOffset = maxY + 220;

        const offsetNodes = parsed.nodes.map((n: any) => ({
          ...n,
          id: `${n.id}-${Date.now().toString().slice(-4)}`,
          position: {
            x: n.position.x,
            y: n.position.y + yOffset,
          },
        }));

        // Remap edge IDs and sources/targets
        const idMap = new Map<string, string>();
        parsed.nodes.forEach((oldN: any, idx: number) => {
          idMap.set(oldN.id, offsetNodes[idx].id);
        });

        const offsetEdges = parsed.edges.map((e: any) => ({
          ...e,
          id: `edge-${idMap.get(e.source) || e.source}-${idMap.get(e.target) || e.target}-${Date.now()}`,
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
        `Generated ${parsed.nodeCount} nodes & ${parsed.edgeCount} edges in ReactFlow!`,
        {
          description: `Canvas layout computed in ${parsed.direction} mode.`,
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
            className="h-8 gap-1.5 text-xs font-semibold bg-primary/5 hover:bg-primary/10 border-primary/20 text-foreground"
          >
            <GitGraph className="h-3.5 w-3.5 text-primary" />
            <span>Raw Mermaid</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FileCode2 className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Mermaid to Architecture Canvas</span>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-mono">
                    Auto-Layout
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Write or paste raw Mermaid syntax. Nodes, shapes, and handles are automatically generated into ReactFlow.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Preset Templates Bar */}
        <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto py-2 border-y border-border">
          <span className="text-[11px] font-semibold text-muted-foreground shrink-0 flex items-center gap-1 mr-1">
            <Sparkles className="h-3 w-3 text-amber-500" /> Presets:
          </span>
          {PRESET_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              type="button"
              onClick={() => setMermaidText(tmpl.code)}
              className="px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:border-primary/40 hover:bg-muted/80 text-foreground transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <span>{tmpl.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                ({tmpl.badge})
              </span>
            </button>
          ))}
        </div>

        {/* Raw Mermaid Editor Area */}
        <div className="flex-1 flex flex-col min-h-[260px] max-h-[360px] relative my-3">
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border border-b-0 border-border rounded-t-lg text-[11px] text-muted-foreground font-mono">
            <span>mermaid-diagram.mmd</span>
            <div className="flex items-center gap-2">
              {previewStats && (
                <span className="text-emerald-500 font-medium">
                  ✓ {previewStats.nodeCount} Nodes, {previewStats.edgeCount} Edges ({previewStats.direction})
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
            placeholder={`graph TD\n    Start([Start]) --> WebApp["Frontend Web"]\n    WebApp --> DB[("PostgreSQL")]\n    DB --> End([End])`}
            className="flex-1 font-mono text-xs p-3.5 rounded-t-none rounded-b-lg border-border resize-none bg-muted/30 focus-visible:ring-1 focus-visible:ring-primary leading-relaxed"
            rows={12}
            spellCheck={false}
          />
        </div>

        {/* Controls Footer */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Canvas Mode Selection */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Mode:</span>
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
                Add to Canvas
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
              onClick={handleGenerate}
              disabled={isGenerating || !mermaidText.trim()}
              className="h-8 gap-1.5 text-xs font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none shadow-md cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 animate-spin text-zinc-950" />
                  <span>Generating Flow...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-zinc-950" />
                  <span>Generate in ReactFlow</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
