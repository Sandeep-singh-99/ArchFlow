"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ReactFlow,
  ReactFlowProvider,
  ConnectionMode,
  useReactFlow,
  Background,
  BackgroundVariant,
  Panel,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "../../agent-builder/_customNodes/nodeTypes";
import ErRelationshipEdge from "../../agent-builder/_customEdges/ErRelationshipEdge";
import { getSchemaType } from "@/lib/schemaClassifier";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Network,
  Database,
  Boxes,
  Eye,
  ShieldAlert,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  MapPin,
  ArrowRight,
  Layers,
  GitFork,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import FlowMiniMap from "../../agent-builder/_components/FlowMiniMap";

const edgeTypes = {
  erRelationship: ErRelationshipEdge,
  default: ErRelationshipEdge,
};

function parseClientEnvironment() {
  if (typeof window === "undefined") {
    return {
      device: "Desktop",
      browser: "Unknown",
      os: "Unknown",
      referrer: "Direct",
    };
  }

  const ua = navigator.userAgent;

  // Device detection
  let device = "Desktop";
  if (/iPad|Tablet|PlayBook/i.test(ua)) {
    device = "Tablet";
  } else if (/Mobile|Android|iP(hone|od)|BlackBerry|IEMobile|Kindle|Silk/i.test(ua)) {
    device = "Mobile";
  }

  // Browser detection
  let browser = "Other";
  if (/Edg/i.test(ua)) browser = "Edge";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Opera|OPR/i.test(ua)) browser = "Opera";

  // OS detection
  let os = "Other";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Macintosh|Mac OS/i.test(ua)) os = "macOS";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Linux/i.test(ua)) os = "Linux";

  // Referrer source
  let referrer = "Direct";
  if (document.referrer) {
    try {
      const url = new URL(document.referrer);
      referrer = url.hostname.replace(/^www\./, "");
      if (referrer.includes("github")) referrer = "GitHub";
      else if (referrer.includes("twitter") || referrer.includes("t.co") || referrer.includes("x.com")) referrer = "X / Twitter";
      else if (referrer.includes("linkedin")) referrer = "LinkedIn";
      else if (referrer.includes("google")) referrer = "Google";
      else if (referrer.includes("slack")) referrer = "Slack";
    } catch {
      referrer = "External";
    }
  }

  return { device, browser, os, referrer };
}

function PreviewPageContent() {
  const { agentId } = useParams();
  const rawAgentId = typeof agentId === "string" ? agentId : Array.isArray(agentId) ? agentId[0] : "";

  const agent = useQuery(
    api.agent.GetAgentById,
    rawAgentId ? { agentId: rawAgentId } : "skip"
  );

  const recordVisit = useMutation(api.analytics.RecordLinkVisit);
  const heartbeatDuration = useMutation(api.analytics.HeartbeatVisitDuration);

  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const nodes = useMemo(
    () => (Array.isArray(agent?.nodes) ? (agent.nodes as Node[]) : []),
    [agent]
  );
  const edges = useMemo(
    () => (Array.isArray(agent?.edges) ? (agent.edges as Edge[]) : []),
    [agent]
  );

  const [copied, setCopied] = useState(false);
  const [bgVariant, setBgVariant] = useState<"dots" | "lines" | "cross">("dots");
  const [showMiniMap, setShowMiniMap] = useState(true);
  const sessionIdRef = useRef<string>("");
  const hasRecordedRef = useRef(false);

  // Fit view when nodes are initially populated
  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.25, duration: 400 });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [nodes, fitView]);

  // Analytics tracking: Mount visit + Periodic heartbeat
  useEffect(() => {
    if (!rawAgentId || !agent || hasRecordedRef.current) return;
    hasRecordedRef.current = true;

    // 1. Session Storage Session ID
    const storageKey = `archflow_preview_session_${rawAgentId}`;
    let visitorSessionId = sessionStorage.getItem(storageKey);
    if (!visitorSessionId) {
      let persistentId = "";
      try {
        persistentId = localStorage.getItem("archflow_visitor_id") || "";
        if (!persistentId) {
          persistentId = crypto.randomUUID();
          localStorage.setItem("archflow_visitor_id", persistentId);
        }
      } catch {
        persistentId = crypto.randomUUID();
      }
      visitorSessionId = `${persistentId}_${Date.now()}`;
      sessionStorage.setItem(storageKey, visitorSessionId);
    }
    sessionIdRef.current = visitorSessionId;

    // 2. Prevent duplicate view record on rapid reloads or within same tab
    const cooldownKey = `archflow_view_logged_${rawAgentId}`;
    const alreadyLogged = sessionStorage.getItem(cooldownKey);
    if (!alreadyLogged) {
      const env = parseClientEnvironment();
      recordVisit({
        agentId: rawAgentId,
        visitorSessionId,
        referrer: env.referrer,
        device: env.device,
        browser: env.browser,
        os: env.os,
      })
        .then((visitId) => {
          if (visitId) {
            sessionStorage.setItem(cooldownKey, "true");
          }
        })
        .catch((err) => {
          console.warn("Analytics visit logging notice:", err);
        });
    }

    // 3. Heartbeat for engagement time (every 10s)
    const interval = setInterval(() => {
      if (sessionIdRef.current) {
        heartbeatDuration({
          visitorSessionId: sessionIdRef.current,
          additionalSeconds: 10,
        }).catch(() => {});
      }
    }, 10000);

    // 4. Flush remaining time on page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && sessionIdRef.current) {
        heartbeatDuration({
          visitorSessionId: sessionIdRef.current,
          additionalSeconds: 3,
        }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [rawAgentId, agent, recordVisit, heartbeatDuration]);

  // Schema metrics
  const isNoSql = useMemo(() => getSchemaType(agent) === "nosql", [agent]);

  const { tableCount, relationCount } = useMemo(() => {
    let tables = 0;
    nodes.forEach((n) => {
      const type = (n?.type as string) || "";
      if (
        type.includes("Table") ||
        type.includes("Collection") ||
        type.includes("Document") ||
        type.includes("View")
      ) {
        tables += 1;
      }
    });
    return { tableCount: tables || nodes.length, relationCount: edges.length };
  }, [nodes, edges]);

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Preview link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Loading state
  if (agent === undefined) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-foreground p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="size-12 rounded-xl bg-gradient-to-tr from-[#ffc507] to-[#ffee72] text-zinc-950 flex items-center justify-center animate-bounce shadow-lg shadow-[#ffc507]/20">
            <Network className="size-6 font-bold" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-sm text-foreground">Loading Architecture Preview</h3>
            <p className="text-xs text-muted-foreground font-mono">Initializing read-only visual canvas...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not Found state
  if (agent === null) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-foreground p-4">
        <div className="max-w-md w-full p-6 rounded-2xl border border-border/80 bg-card text-center space-y-4 shadow-xl">
          <div className="size-12 rounded-full bg-destructive/15 border border-destructive/30 text-destructive flex items-center justify-center mx-auto">
            <ShieldAlert className="size-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-foreground">Architecture Not Found</h2>
            <p className="text-xs text-muted-foreground">
              This preview link may have been removed, made private, or the URL might be invalid.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/">Go to Home</Link>
            </Button>
            <Button asChild size="sm" className="bg-[#ffc507] text-zinc-950 hover:bg-[#ffdf27]">
              <Link href="/dashboard">Explore ArchFlow</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen flex flex-col bg-zinc-950 overflow-hidden">
      {/* Read-Only Top Header Bar */}
      <header className="w-full h-13 px-4 border-b border-border/70 bg-card/90 backdrop-blur-md flex items-center justify-between z-30 shrink-0">
        {/* Brand & Architecture Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 group hover:opacity-90 transition-opacity shrink-0"
            title="ArchFlow Schema Studio"
          >
            <div className="size-7 rounded-lg bg-gradient-to-r from-[#ffc507] to-[#ffee72] text-zinc-950 flex items-center justify-center shadow-xs">
              <Network className="size-4 font-bold" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm tracking-tight hidden md:inline text-foreground">
              ArchFlow
            </span>
          </Link>

          <div className="h-4 w-px bg-border/80 shrink-0" />

          {/* Architecture Title & Badges */}
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[140px] sm:max-w-[260px] md:max-w-[340px]">
              {agent.name}
            </h1>

            <Badge
              variant="outline"
              className={`text-[10px] font-mono hidden sm:inline-flex items-center gap-1 py-0 px-2 font-medium shrink-0 ${
                isNoSql
                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                  : "border-[#ffdf27]/30 text-[#ffee72] bg-[#ffc507]/10"
              }`}
            >
              {isNoSql ? (
                <Boxes className="h-3 w-3 text-emerald-400" />
              ) : (
                <Database className="h-3 w-3 text-[#ffee72]" />
              )}
              <span>{isNoSql ? "NoSQL" : "SQL"}</span>
            </Badge>

            {/* Read-Only Guard Badge */}
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-amber-500/30 text-amber-400 bg-amber-500/10 hidden lg:inline-flex items-center gap-1 py-0 px-2 shrink-0"
            >
              <Eye className="size-3" />
              <span>Read-Only Preview</span>
            </Badge>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Metrics */}
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/40 px-2.5 py-1 rounded-lg border border-border/50">
            <span className="flex items-center gap-1">
              <Layers className="size-3 text-emerald-400" />
              <strong className="text-foreground">{tableCount}</strong> Tables
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1">
              <GitFork className="size-3 text-sky-400" />
              <strong className="text-foreground">{relationCount}</strong> Relations
            </span>
          </div>

          {/* Copy Share Link */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="h-8 px-2.5 sm:px-3 text-xs border-border/80 hover:bg-muted text-foreground flex items-center gap-1.5 transition-all shadow-2xs"
            title="Copy preview link"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span className="hidden sm:inline">Copy Link</span>
              </>
            )}
          </Button>

          {/* CTA: Create your own schema */}
          <Button
            asChild
            size="sm"
            className="h-8 px-3 text-xs font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 transition-all shadow-xs"
          >
            <Link href="/dashboard" className="flex items-center gap-1.5">
              <span>Open Studio</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Visual Canvas Area */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          elementsSelectable={false}
          panOnDrag={true}
          zoomOnScroll={true}
          deleteKeyCode={null}
          multiSelectionKeyCode={null}
          connectionMode={ConnectionMode.Loose}
          minZoom={0.15}
          maxZoom={2.0}
          defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
          className="bg-zinc-950"
        >
          {/* Subtle Grid / Dot Background */}
          <Background
            variant={
              bgVariant === "dots"
                ? BackgroundVariant.Dots
                : bgVariant === "lines"
                  ? BackgroundVariant.Lines
                  : BackgroundVariant.Cross
            }
            gap={24}
            size={1.5}
            color="rgba(255, 255, 255, 0.07)"
          />

          {/* MiniMap */}
          {showMiniMap && <FlowMiniMap />}

          {/* Floating Canvas Controls Toolbar */}
          <Panel position="bottom-right" className="mb-4 mr-4">
            <div className="flex items-center gap-1 p-1 bg-card/90 backdrop-blur-md rounded-xl border border-border/80 shadow-xl">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                    onClick={() => zoomIn({ duration: 250 })}
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Zoom In</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                    onClick={() => zoomOut({ duration: 250 })}
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Zoom Out</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                    onClick={() => fitView({ padding: 0.25, duration: 300 })}
                    aria-label="Fit view"
                  >
                    <Maximize2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Fit Schema to Screen</TooltipContent>
              </Tooltip>

              <div className="h-4 w-px bg-border/60 mx-0.5" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`size-8 rounded-lg transition-colors ${
                      bgVariant === "lines"
                        ? "bg-[#ffc507]/20 text-[#ffee72]"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() =>
                      setBgVariant((v) => (v === "dots" ? "lines" : v === "lines" ? "cross" : "dots"))
                    }
                    aria-label="Toggle background pattern"
                  >
                    <Grid className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Background Style ({bgVariant})
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`size-8 rounded-lg transition-colors ${
                      showMiniMap
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setShowMiniMap((s) => !s)}
                    aria-label="Toggle minimap"
                  >
                    <MapPin className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {showMiniMap ? "Hide MiniMap" : "Show MiniMap"}
                </TooltipContent>
              </Tooltip>
            </div>
          </Panel>

          {/* Subtle View-Only Watermark Pill */}
          <Panel position="bottom-left" className="mb-4 ml-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-border/60 backdrop-blur-sm text-[11px] text-muted-foreground shadow-lg">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Interactive View Mode</span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">Locked diagram view</span>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <ReactFlowProvider>
      <PreviewPageContent />
    </ReactFlowProvider>
  );
}
