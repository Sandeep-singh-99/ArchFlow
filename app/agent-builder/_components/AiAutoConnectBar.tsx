"use client";

import React, { useRef, useState } from "react";
import type { Edge, Node } from "@xyflow/react";
import {
  Sparkles,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Loader2,
  BrainCircuit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { stripAiPreviewFlags } from "@/lib/ai/autoConnectPreview";
import type { ThinkingStep } from "@/lib/ai/schemaGraph";

type AiBarPhase = "idle" | "thinking" | "review";

interface AiAutoConnectBarProps {
  nodes: Node[];
  edges: Edge[];
  canAccessAi: boolean;
  onLockedClick: () => void;
  onPreviewChange: (previewNodes: Node[], previewEdges: Edge[]) => void;
  onApply: (finalNodes: Node[], finalEdges: Edge[]) => void;
  onReject: (originalNodes: Node[], originalEdges: Edge[]) => void;
}

interface SseResultPayload {
  updatedNodes: Node[];
  addedNodes: Node[];
  addedEdges: Edge[];
  thinkingSteps?: ThinkingStep[];
}

function asSafeString(val: unknown, fallback = ""): string {
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (val && typeof val === "object") return JSON.stringify(val);
  return fallback;
}

function sanitizeRenderNodes(nodes: Node[]): Node[] {
  const stringFields = [
    "label",
    "name",
    "schema",
    "database",
    "shardKey",
    "domainName",
    "comment",
    "tableName",
    "collectionName",
    "indexType",
    "query",
    "parentSchema",
    "fromCollection",
    "fromField",
    "toCollection",
    "toField",
    "cardinality",
    "refType",
    "validationLevel",
    "validationAction",
    "rulesSummary",
  ];

  const stringArrayFields = ["values", "keys", "requiredFields"];

  return nodes.map((node) => {
    const data = { ...(node.data || {}) } as Record<string, unknown>;

    for (const key of stringFields) {
      if (data[key] !== undefined && typeof data[key] !== "string") {
        data[key] = asSafeString(data[key]);
      }
    }

    for (const key of stringArrayFields) {
      if (data[key] !== undefined) {
        if (Array.isArray(data[key])) {
          data[key] = (data[key] as unknown[]).map((item) => asSafeString(item));
        } else if (typeof data[key] === "string") {
          data[key] = [data[key] as string];
        } else if (data[key] && typeof data[key] === "object") {
          data[key] = Object.values(data[key] as Record<string, unknown>).map((v) =>
            asSafeString(v)
          );
        } else {
          data[key] = [];
        }
      }
    }

    if (Array.isArray(data.columns)) {
      data.columns = data.columns.map((c) => {
        if (typeof c === "string") return c;
        if (c && typeof c === "object") {
          const rec = c as Record<string, unknown>;
          return {
            ...rec,
            name: asSafeString(rec.name, "col"),
            type: asSafeString(rec.type, "TEXT"),
          };
        }
        return asSafeString(c);
      });
    }
    if (Array.isArray(data.fields)) {
      data.fields = data.fields.map((f) => {
        if (typeof f === "string") return f;
        if (f && typeof f === "object") {
          const rec = f as Record<string, unknown>;
          return {
            ...rec,
            name: asSafeString(rec.name, "field"),
            type: asSafeString(rec.type, "String"),
          };
        }
        return asSafeString(f);
      });
    }
    return { ...node, data };
  });
}

function sanitizeRenderEdges(edges: Edge[]): Edge[] {
  return edges.map((edge) => ({
    ...edge,
    label: edge.label !== undefined ? asSafeString(edge.label) : undefined,
  }));
}

export default function AiAutoConnectBar({
  nodes,
  edges,
  canAccessAi,
  onLockedClick,
  onPreviewChange,
  onApply,
  onReject,
}: AiAutoConnectBarProps) {
  const [phase, setPhase] = useState<AiBarPhase>("idle");
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [showThinking, setShowThinking] = useState(true);
  const [proposedCounts, setProposedCounts] = useState({ edges: 0, nodes: 0 });

  const snapshotRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const previewRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetState = () => {
    setPhase("idle");
    setThinkingSteps([]);
    setProposedCounts({ edges: 0, nodes: 0 });
    snapshotRef.current = null;
    previewRef.current = null;
  };

  const handleStartAi = async () => {
    if (!canAccessAi) {
      onLockedClick();
      return;
    }

    if (!nodes || nodes.length === 0) {
      toast.info("Create at least one table or collection first.");
      return;
    }

    snapshotRef.current = {
      nodes: structuredClone(nodes),
      edges: structuredClone(edges || []),
    };
    previewRef.current = null;
    setThinkingSteps([]);
    setShowThinking(true);
    setPhase("thinking");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/ai/auto-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges: edges || [] }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(
          typeof errBody?.error === "string"
            ? errBody.error
            : `Request failed with status ${response.status}`
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const rawEvents = buffer.split("\n\n");
        buffer = rawEvents.pop() || "";

        for (const rawEvent of rawEvents) {
          const lines = rawEvent.split("\n");
          let eventName = "message";
          let dataLine = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataLine += line.slice(5).trim();
            }
          }

          if (!dataLine) continue;
          const payload = JSON.parse(dataLine) as unknown;

          if (eventName === "thinking") {
            const rawStep = payload as Record<string, unknown>;
            const step: ThinkingStep = {
              agent: asSafeString(rawStep.agent, "Agent"),
              title: asSafeString(rawStep.title, "Processing..."),
              thought: asSafeString(rawStep.thought, ""),
              timestamp: typeof rawStep.timestamp === "number" ? rawStep.timestamp : Date.now(),
            };
            setThinkingSteps((prev) => [...prev, step]);
          } else if (eventName === "error") {
            const errPayload = payload as { error?: string };
            throw new Error(errPayload.error || "AI pipeline failed.");
          } else if (eventName === "result") {
            const result = payload as SseResultPayload;
            const addedNodes = result.addedNodes || [];
            const addedEdges = result.addedEdges || [];

            if (addedNodes.length === 0 && addedEdges.length === 0) {
              toast.info("No new relationships or supporting nodes needed.");
              resetState();
              return;
            }

            const highlightedAddedNodes = addedNodes.map((node) => ({
              ...node,
              style: {
                ...(node.style || {}),
                boxShadow: "0 0 0 2px #38bdf8, 0 0 18px rgba(56, 189, 248, 0.25)",
                borderRadius: "12px",
              },
            }));

            const mergedNodes = sanitizeRenderNodes([
              ...(result.updatedNodes || nodes),
              ...highlightedAddedNodes,
            ]);
            const mergedEdges = sanitizeRenderEdges([...(edges || []), ...addedEdges]);
            previewRef.current = { nodes: mergedNodes, edges: mergedEdges };
            setProposedCounts({ edges: addedEdges.length, nodes: addedNodes.length });
            onPreviewChange(mergedNodes, mergedEdges);
            setShowThinking(false);
            setPhase("review");
          }
        }
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        toast.info("AI analysis cancelled.");
      } else {
        const message = err instanceof Error ? err.message : "Failed to run AI auto-connect.";
        toast.error(message);
      }
      if (snapshotRef.current) {
        onReject(snapshotRef.current.nodes, snapshotRef.current.edges);
      }
      resetState();
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelThinking = () => {
    abortControllerRef.current?.abort();
  };

  const handleReject = () => {
    if (snapshotRef.current) {
      onReject(snapshotRef.current.nodes, snapshotRef.current.edges);
    }
    toast.info("AI changes rejected.");
    resetState();
  };

  const handleApply = () => {
    if (previewRef.current) {
      const cleaned = stripAiPreviewFlags(
        previewRef.current.nodes,
        previewRef.current.edges
      );
      onApply(cleaned.nodes, cleaned.edges);
    }
    toast.success("AI relationships and nodes applied.");
    resetState();
  };

  const latestStep = thinkingSteps[thinkingSteps.length - 1];

  return (
    <div className="relative flex flex-col items-center">
      {/* Live Thinking Drawer (ChatGPT / Gemini style) */}
      {(phase === "thinking" || phase === "review") &&
        showThinking &&
        thinkingSteps.length > 0 && (
          <div className="mb-2.5 w-[380px] max-w-[90vw] rounded-xl border border-border bg-card/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl p-3 text-left animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <BrainCircuit className="h-3.5 w-3.5 text-emerald-400" />
                <span>
                  {phase === "thinking" ? "AI Multi-Agent Thinking..." : "AI Reasoning Trace"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowThinking(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Hide thinking"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
              {thinkingSteps.map((step, idx) => (
                <div
                  key={`${step.agent}-${idx}`}
                  className="rounded-lg bg-muted/40 border border-border/50 p-2 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-emerald-400">
                      {step.agent}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {step.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {step.thought}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Bottom Action Bar */}
      {phase === "idle" && (
        <Button
          type="button"
          onClick={handleStartAi}
          className="gap-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30 shadow-md cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-white" />
          <span className="text-white">Connect with AI</span>
          {!canAccessAi && (
            <Badge className="bg-amber-400 text-black text-[9px] px-1 py-0 font-bold ml-0.5 font-mono">
              AI
            </Badge>
          )}
        </Button>
      )}

      {phase === "thinking" && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/95 border border-emerald-500/40 shadow-lg text-white">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400 shrink-0" />
          <span className="text-xs font-medium max-w-[220px] truncate">
            {latestStep ? `${latestStep.agent}: ${latestStep.title}` : "Thinking..."}
          </span>
          <button
            type="button"
            onClick={() => setShowThinking((prev) => !prev)}
            className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
            title={showThinking ? "Hide thinking" : "Show thinking"}
          >
            {showThinking ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleCancelThinking}
            className="h-6 px-2 text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      )}

      {phase === "review" && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/95 border border-border shadow-xl text-white">
          <button
            type="button"
            onClick={() => setShowThinking((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white cursor-pointer pr-1"
            title="Toggle AI thinking trace"
          >
            <BrainCircuit className="h-3.5 w-3.5 text-emerald-400" />
            <span>
              +{proposedCounts.edges} rel · +{proposedCounts.nodes} nodes
            </span>
            {showThinking ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </button>

          <div className="h-4 w-px bg-zinc-700" />

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleReject}
            className="h-7 px-2.5 gap-1 text-xs border-red-500/40 text-red-400 hover:bg-red-500/15 hover:text-red-300 bg-transparent cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reject</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            className="h-7 px-2.5 gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Apply</span>
          </Button>
        </div>
      )}
    </div>
  );
}
