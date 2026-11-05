"use client";

import React, { useState, useContext, useMemo } from "react";
import { WorkflowContext } from "@/context/WorkflowContext";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useAuth } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Flame,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Eye,
  X,
  Database,
  Boxes,
  Copy,
  Check,
  Search,
  ArrowRight,
  GitFork,
  Terminal,
} from "lucide-react";
import { getUserPlanCode, canAccessFeature, notifyFeatureLocked } from "@/lib/planAccess";
import PlanUpgradeModal from "@/components/plans/PlanUpgradeModal";
import { toast } from "sonner";
import { Agent } from "@/types/AgentTypes";

interface SchemaColumn {
  id?: string;
  name?: string;
  type?: string;
  isPk?: boolean;
  isFk?: boolean;
  [key: string]: unknown;
}

interface SchemaNodeData {
  name?: string;
  tableName?: string;
  label?: string;
  title?: string;
  query?: string;
  columns?: SchemaColumn[];
  [key: string]: unknown;
}

interface SchemaNode {
  id: string;
  type?: string;
  data?: SchemaNodeData;
  style?: Record<string, unknown>;
  selected?: boolean;
  [key: string]: unknown;
}

interface SchemaEdge {
  id?: string;
  source?: string;
  target?: string;
  [key: string]: unknown;
}

interface CascadeSimulatorDialogProps {
  initialTargetNodeId?: string;
  trigger?: React.ReactNode;
  agentDetail?: Agent;
}

// Bulletproof helper to extract clean string names and avoid React object children crashes
function getSafeNodeName(node?: SchemaNode | null, fallback = "unnamed_table"): string {
  if (!node) return fallback;
  const raw =
    node.data?.name ??
    node.data?.tableName ??
    node.data?.label ??
    node.id;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.name === "string" && obj.name.trim()) return obj.name.trim();
    if (typeof obj.label === "string" && obj.label.trim()) return obj.label.trim();
    if (typeof obj.title === "string" && obj.title.trim()) return obj.title.trim();
  }
  return String(node.id || fallback);
}

export default function CascadeSimulatorDialog({
  initialTargetNodeId,
  trigger,
  agentDetail,
}: CascadeSimulatorDialogProps) {
  const { addedNodes, nodeEdges, setSelectedNode, setAddedNodes } = useContext(WorkflowContext);
  const { userDetails } = useContext(UserDetailContext);
  const { has } = useAuth();

  const [open, setOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const userPlan = getUserPlanCode(userDetails, has);
  const isAllowed = canAccessFeature("cascade_simulator", userPlan);

  // Combine live context nodes with agentDetail fallback
  const allNodes: SchemaNode[] = useMemo(() => {
    if (Array.isArray(addedNodes) && addedNodes.length > 0) return addedNodes as SchemaNode[];
    if (Array.isArray(agentDetail?.nodes) && agentDetail.nodes.length > 0) return agentDetail.nodes as SchemaNode[];
    return [];
  }, [addedNodes, agentDetail]);

  const allEdges: SchemaEdge[] = useMemo(() => {
    if (Array.isArray(nodeEdges) && nodeEdges.length > 0) return nodeEdges as SchemaEdge[];
    if (Array.isArray(agentDetail?.edges) && agentDetail.edges.length > 0) return agentDetail.edges as SchemaEdge[];
    return [];
  }, [nodeEdges, agentDetail]);

  // Filter only table / collection nodes safely
  const tableNodes: SchemaNode[] = useMemo(() => {
    return (allNodes || []).filter((n): n is SchemaNode => {
      if (!n || !n.id) return false;
      const type = n?.type || "";
      return (
        type === "SqlTableNode" ||
        type === "NosqlCollectionNode" ||
        type === "Table" ||
        type === "Collection"
      );
    });
  }, [allNodes]);

  // Derived active table selection without useEffect setState cascading renders
  const activeSelectedTableId = useMemo(() => {
    if (selectedTableId && tableNodes.some((n) => n.id === selectedTableId)) {
      return selectedTableId;
    }
    if (initialTargetNodeId && tableNodes.some((n) => n.id === initialTargetNodeId)) {
      return initialTargetNodeId;
    }
    return tableNodes[0]?.id || "";
  }, [selectedTableId, initialTargetNodeId, tableNodes]);

  // Filtered tables based on search query
  const filteredTableNodes = useMemo(() => {
    if (!searchQuery.trim()) return tableNodes;
    const q = searchQuery.toLowerCase();
    return tableNodes.filter((n) => {
      const name = getSafeNodeName(n).toLowerCase();
      return name.includes(q);
    });
  }, [tableNodes, searchQuery]);

  // Handle open request with plan gating
  const handleOpenClick = () => {
    if (!isAllowed) {
      notifyFeatureLocked("cascade_simulator", userPlan);
      setShowUpgradeModal(true);
    } else {
      setOpen(true);
    }
  };

  // Perform CASCADE impact analysis with complete null-safety and cycle protection
  const analysis = useMemo(() => {
    if (!activeSelectedTableId) return null;

    const targetNode = tableNodes.find((n) => n.id === activeSelectedTableId);
    if (!targetNode || !targetNode.id) return null;

    const targetName = getSafeNodeName(targetNode, "selected_table");
    const edges = allEdges || [];
    const nodes = allNodes || [];

    const tableIdSet = new Set<string>(tableNodes.map((n) => n.id).filter(Boolean));

    // 1. Direct dependencies:
    // Any table connected to activeSelectedTableId via an edge in either direction
    const directDependentTableIds = new Set<string>();

    edges.forEach((e) => {
      if (!e) return;
      const s = e.source;
      const t = e.target;
      if (!s || !t) return;

      // Avoid self-referencing loops
      if (s === activeSelectedTableId && t === activeSelectedTableId) return;

      if (t === activeSelectedTableId && tableIdSet.has(s)) {
        directDependentTableIds.add(s);
      } else if (s === activeSelectedTableId && tableIdSet.has(t)) {
        directDependentTableIds.add(t);
      }
    });

    // 2. Transitive CASCADE dependencies (2nd-level cascade)
    const transitiveDependentIds = new Set<string>();
    directDependentTableIds.forEach((childId) => {
      edges.forEach((e) => {
        if (!e) return;
        const s = e.source;
        const t = e.target;
        if (!s || !t) return;

        const otherId = s === childId ? t : t === childId ? s : null;
        if (
          otherId &&
          otherId !== activeSelectedTableId &&
          !directDependentTableIds.has(otherId) &&
          tableIdSet.has(otherId)
        ) {
          transitiveDependentIds.add(otherId);
        }
      });
    });

    // 3. Dependent Views (views whose query mentions targetName)
    const lowerTargetName = targetName.toLowerCase();
    const dependentViews = nodes.filter((n) => {
      if (!n || !n.id) return false;
      const type = n.type || "";
      if (type !== "SqlViewNode" && type !== "View") return false;
      const q = String(n.data?.query || "").toLowerCase();
      return q.includes(lowerTargetName);
    });

    // 4. Resolve table objects safely
    const directTables = nodes.filter(
      (n) => n && n.id && directDependentTableIds.has(n.id)
    );
    const transitiveTables = nodes.filter(
      (n) => n && n.id && transitiveDependentIds.has(n.id)
    );

    // 5. Total affected count
    const totalAffected =
      directTables.length + transitiveTables.length + dependentViews.length;

    const severity: "HIGH" | "MODERATE" | "SAFE" =
      totalAffected >= 3 ? "HIGH" : totalAffected >= 1 ? "MODERATE" : "SAFE";

    const columnsCount = Array.isArray(targetNode.data?.columns)
      ? targetNode.data.columns.length
      : 0;

    const isNoSql =
      targetNode.type === "NosqlCollectionNode" ||
      targetNode.type === "Collection";

    return {
      targetNode,
      targetName,
      directTables,
      transitiveTables,
      dependentViews,
      totalAffected,
      severity,
      columnsCount,
      isNoSql,
    };
  }, [activeSelectedTableId, tableNodes, allEdges, allNodes]);

  // Generate clean SQL text for simulation & copy
  const generatedSql = useMemo(() => {
    if (!analysis) return "";
    const isDoc = analysis.isNoSql;
    if (isDoc) {
      return `// MongoDB / Document Drop Simulation
db.${analysis.targetName}.drop();

${
  analysis.directTables.length > 0
    ? `// Dependent collections referencing "${analysis.targetName}":
${analysis.directTables.map((t) => `// • ${getSafeNodeName(t)}: references removed`).join("\n")}\n`
    : ""
}// Referential integrity verified.`;
    }

    return `-- Simulated CASCADE DROP execution
DROP TABLE IF EXISTS "${analysis.targetName}" CASCADE;

${
  analysis.directTables.length > 0
    ? `-- Foreign keys from child tables automatically severed:
${analysis.directTables.map((t) => `-- • ${getSafeNodeName(t)}: foreign-key constraints removed`).join("\n")}
`
    : ""
}${
  analysis.dependentViews.length > 0
    ? `-- WARNING: Views referencing "${analysis.targetName}" will become invalid:
${analysis.dependentViews.map((v) => `-- • ${getSafeNodeName(v)}`).join("\n")}
`
    : ""
}-- Referential integrity verified.`;
  }, [analysis]);

  const handleCopySql = () => {
    if (!generatedSql) return;
    navigator.clipboard.writeText(generatedSql);
    setCopied(true);
    toast.success("Simulation script copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Safely highlight affected nodes on canvas
  const handleHighlightOnCanvas = () => {
    if (!analysis || !analysis.targetNode) return;
    try {
      const affectedIds = new Set<string>(
        [
          analysis.targetNode.id,
          ...analysis.directTables.map((n) => n?.id),
          ...analysis.transitiveTables.map((n) => n?.id),
          ...analysis.dependentViews.map((n) => n?.id),
        ].filter((id): id is string => Boolean(id))
      );

      // Update node styles temporarily to highlight
      if (typeof setAddedNodes === "function") {
        setAddedNodes((prev: SchemaNode[]) =>
          (prev || []).map((node: SchemaNode) => {
            if (!node || !node.id) return node;
            if (node.id === analysis.targetNode.id) {
              return {
                ...node,
                selected: true,
                style: {
                  ...(node.style || {}),
                  boxShadow: "0 0 28px 6px rgba(239, 68, 68, 0.75)",
                  borderColor: "#ef4444",
                },
              };
            }
            if (affectedIds.has(node.id)) {
              return {
                ...node,
                selected: true,
                style: {
                  ...(node.style || {}),
                  boxShadow: "0 0 22px 4px rgba(245, 158, 11, 0.65)",
                  borderColor: "#f59e0b",
                },
              };
            }
            return {
              ...node,
              selected: false,
            };
          })
        );
      }

      if (typeof setSelectedNode === "function") {
        setSelectedNode(analysis.targetNode);
      }
      setOpen(false);
      toast.success(
        `Highlighted ${analysis.totalAffected + 1} cascade-impacted entities on the canvas!`
      );
    } catch (err) {
      console.error("Failed to highlight cascade impact:", err);
      toast.error("Unable to highlight nodes on canvas");
    }
  };

  return (
    <>
      {/* Trigger Button or Default Trigger */}
      {trigger ? (
        <span onClick={handleOpenClick} className="cursor-pointer inline-flex">
          {trigger}
        </span>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenClick}
          className="h-8 text-xs gap-1.5 border-border hover:bg-muted font-medium cursor-pointer relative"
          title="CASCADE Drop Simulator"
        >
          <Flame className="h-3.5 w-3.5 text-amber-500" />
          <span className="hidden sm:inline">CASCADE Simulator</span>
          {!isAllowed && (
            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] px-1 py-0 font-mono font-bold ml-0.5">
              PRO
            </Badge>
          )}
        </Button>
      )}

      {/* Plan Upgrade Gating Modal */}
      <PlanUpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        featureKey="cascade_simulator"
        currentPlan={userPlan}
      />

      {/* Main Simulator Dialog for Pro & AI users - Center viewport pinned with deep black theme */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[86vh] flex flex-col p-0 border border-zinc-800 bg-black shadow-2xl rounded-2xl overflow-hidden z-50"
        >
          {/* Subtle Top Accent Ambient Line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent pointer-events-none z-10" />

          {/* Pinned Top Header */}
          <DialogHeader className="p-5 sm:p-6 pb-3.5 border-b border-zinc-800/80 shrink-0 space-y-3 text-left bg-black">
            {/* Top Toolbar: Badges + Polished Minimal Close Button */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Badge
                  variant="outline"
                  className="border-amber-500/30 text-amber-400 bg-amber-500/10 font-mono text-[10px] uppercase px-2.5 py-0.5 flex items-center gap-1.5 rounded-full"
                >
                  <Flame className="size-3 text-amber-500" />
                  <span>Referential Integrity Studio</span>
                </Badge>

                {/* Modern Status Pill */}
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
                  <CheckCircle2 className="size-3 text-emerald-400" />
                  <span>Pro Feature Unlocked</span>
                </span>
              </div>

              {/* Polished Close (X) Icon */}
              <DialogClose asChild>
                <button
                  type="button"
                  className="size-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all cursor-pointer shrink-0"
                  aria-label="Close dialog"
                >
                  <X className="size-4" />
                </button>
              </DialogClose>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <AlertTriangle className="size-4 shrink-0" />
                  </div>
                  <span>CASCADE Drop Impact Simulator</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  Simulate production schema breakage before dropping tables. Inspect foreign key severing,
                  downstream cascades, and broken views across your schema.
                </DialogDescription>
              </div>

              {analysis && (
                <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg">
                  <span className="text-zinc-500">Target:</span>
                  <span className="font-semibold text-amber-300 truncate max-w-[140px]">
                    {analysis.targetName}
                  </span>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Scrollable Center Content Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-black">
            {/* Two-Column Studio Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Pane (Table Picker & Filters) - 4 cols */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Database className="size-3.5 text-amber-400" />
                    <span>Select Table to Drop</span>
                  </label>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {tableNodes.length} tables
                  </span>
                </div>

                {/* Table search filter if >= 4 tables */}
                {tableNodes.length >= 4 && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-zinc-500 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter tables..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-black border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all font-mono"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                )}

                {tableNodes.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500 bg-black">
                    No tables or collections found on canvas.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                    {filteredTableNodes.map((n, idx) => {
                      const name = getSafeNodeName(n, `table_${idx + 1}`);
                      const nodeId = n?.id || String(idx);
                      const isSelected = nodeId === activeSelectedTableId;
                      const isDoc =
                        n?.type === "NosqlCollectionNode" ||
                        n?.type === "Collection";
                      const colCount = Array.isArray(n?.data?.columns)
                        ? n.data.columns.length
                        : 0;

                      return (
                        <button
                          key={nodeId}
                          type="button"
                          onClick={() => setSelectedTableId(nodeId)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer group ${
                            isSelected
                              ? "border-amber-500/80 bg-gradient-to-r from-amber-500/15 via-amber-950/10 to-transparent text-amber-200 font-medium shadow-md shadow-amber-950/20"
                              : "border-zinc-800/80 bg-black hover:bg-zinc-950 hover:border-zinc-700/70 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`p-1.5 rounded-md shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-zinc-900 text-zinc-500 group-hover:text-zinc-300"
                              }`}
                            >
                              {isDoc ? (
                                <Boxes className="size-3.5" />
                              ) : (
                                <Database className="size-3.5" />
                              )}
                            </div>
                            <div className="truncate">
                              <span className="font-mono text-xs font-semibold block truncate">
                                {name}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono block">
                                {colCount} {isDoc ? "fields" : "columns"}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            {isSelected && (
                              <span className="size-2 rounded-full bg-amber-400 ring-4 ring-amber-400/20 shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {filteredTableNodes.length === 0 && searchQuery && (
                      <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500 bg-black">
                        No tables match &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Pane (Analysis & Visual Hierarchy) - 8 cols */}
              <div className="lg:col-span-8 space-y-4">
                {analysis ? (
                  <>
                    {/* Dynamic Severity Risk Card */}
                    <div
                      className={`p-4 rounded-2xl border transition-all ${
                        analysis.severity === "HIGH"
                          ? "border-red-500/40 bg-gradient-to-br from-red-500/15 via-black to-black text-red-200 shadow-lg shadow-red-950/20"
                          : analysis.severity === "MODERATE"
                          ? "border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-black to-black text-amber-200 shadow-lg shadow-amber-950/20"
                          : "border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-black to-black text-emerald-200 shadow-lg shadow-emerald-950/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                              analysis.severity === "HIGH"
                                ? "bg-red-500/20 text-red-400"
                                : analysis.severity === "MODERATE"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {analysis.severity === "HIGH" ? (
                              <ShieldAlert className="size-5" />
                            ) : analysis.severity === "MODERATE" ? (
                              <AlertTriangle className="size-5" />
                            ) : (
                              <ShieldCheck className="size-5" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold tracking-tight text-white">
                                {analysis.severity === "HIGH"
                                  ? "Critical Referential Breakage"
                                  : analysis.severity === "MODERATE"
                                  ? "Moderate Cascade Dependency"
                                  : "Isolated Leaf Table (Safe to Drop)"}
                              </span>
                              <Badge
                                className={`text-[9px] font-mono uppercase px-2 py-0.5 font-bold ${
                                  analysis.severity === "HIGH"
                                    ? "bg-red-500 text-white"
                                    : analysis.severity === "MODERATE"
                                    ? "bg-amber-500 text-black"
                                    : "bg-emerald-500 text-black"
                                }`}
                              >
                                {analysis.severity} RISK
                              </Badge>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              {analysis.totalAffected === 0
                                ? `Dropping "${analysis.targetName}" will NOT break any foreign keys or dependent views in the active schema.`
                                : `Dropping "${analysis.targetName}" with CASCADE will invalidate ${analysis.totalAffected} dependent database objects across foreign-key chains and views.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Impact Breakdown Cards (3 Stat KPI Blocks) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl border border-zinc-800 bg-black space-y-1.5">
                        <div className="flex items-center justify-between text-zinc-400">
                          <span className="text-[10px] font-mono uppercase font-semibold">
                            Direct FK Children
                          </span>
                          <GitFork className="size-3.5 text-amber-400" />
                        </div>
                        <div className="text-xl font-bold font-mono text-white">
                          {analysis.directTables.length}
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {analysis.directTables
                            .map((t) => getSafeNodeName(t))
                            .join(", ") || "No direct foreign keys"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-zinc-800 bg-black space-y-1.5">
                        <div className="flex items-center justify-between text-zinc-400">
                          <span className="text-[10px] font-mono uppercase font-semibold">
                            Transitive Cascades
                          </span>
                          <Flame className="size-3.5 text-red-400" />
                        </div>
                        <div className="text-xl font-bold font-mono text-white">
                          {analysis.transitiveTables.length}
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {analysis.transitiveTables
                            .map((t) => getSafeNodeName(t))
                            .join(", ") || "No 2nd-level cascades"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-zinc-800 bg-black space-y-1.5">
                        <div className="flex items-center justify-between text-zinc-400">
                          <span className="text-[10px] font-mono uppercase font-semibold">
                            Broken Views
                          </span>
                          <Terminal className="size-3.5 text-sky-400" />
                        </div>
                        <div className="text-xl font-bold font-mono text-white">
                          {analysis.dependentViews.length}
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {analysis.dependentViews
                            .map((v) => getSafeNodeName(v))
                            .join(", ") || "No referencing views"}
                        </p>
                      </div>
                    </div>

                    {/* Visual Impact Flow Preview */}
                    <div className="p-3.5 rounded-xl border border-zinc-800 bg-black space-y-2">
                      <span className="text-[10px] font-mono uppercase font-semibold text-zinc-400 block">
                        Cascade Dependency Flow
                      </span>

                      <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                        {/* Target node */}
                        <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 font-semibold flex items-center gap-1.5 shadow-xs">
                          <Database className="size-3 text-red-400" />
                          <span>{analysis.targetName}</span>
                        </span>

                        {/* Direction arrow */}
                        <ArrowRight className="size-3.5 text-zinc-600 shrink-0" />

                        {/* Direct tables */}
                        {analysis.directTables.length > 0 ? (
                          analysis.directTables.map((t) => (
                            <span
                              key={t.id}
                              className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]"
                            >
                              {getSafeNodeName(t)}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-500 text-[11px] italic">
                            (No FK children)
                          </span>
                        )}

                        {/* Transitive downstream */}
                        {analysis.transitiveTables.length > 0 && (
                          <>
                            <ArrowRight className="size-3.5 text-zinc-600 shrink-0" />
                            {analysis.transitiveTables.map((t) => (
                              <span
                                key={t.id}
                                className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-300 border border-orange-500/20 text-[11px]"
                              >
                                {getSafeNodeName(t)}
                              </span>
                            ))}
                          </>
                        )}

                        {/* Broken views */}
                        {analysis.dependentViews.length > 0 && (
                          <>
                            <ArrowRight className="size-3.5 text-zinc-600 shrink-0" />
                            {analysis.dependentViews.map((v) => (
                              <span
                                key={v.id}
                                className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[11px]"
                              >
                                v:{getSafeNodeName(v)}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Modern Terminal Code Simulator with Copy Button */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                          <Terminal className="size-3.5 text-amber-400" />
                          <span>{analysis.isNoSql ? "MongoDB Shell Script" : "PostgreSQL & MySQL DDL"}</span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCopySql}
                          className="h-6 gap-1 px-2 text-[11px] font-mono text-zinc-400 hover:text-white cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <Check className="size-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" />
                              <span>Copy Statement</span>
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="rounded-xl bg-black border border-zinc-800 overflow-hidden shadow-inner">
                        {/* Terminal window bar */}
                        <div className="px-3.5 py-1.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-red-500/80 inline-block" />
                            <span className="size-2 rounded-full bg-amber-500/80 inline-block" />
                            <span className="size-2 rounded-full bg-emerald-500/80 inline-block" />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">
                            cascade-simulator.sql
                          </span>
                        </div>
                        <pre className="p-3.5 font-mono text-[11px] text-amber-300/90 overflow-x-auto leading-relaxed select-text max-h-[160px] bg-black">
                          {generatedSql}
                        </pre>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 rounded-2xl border border-dashed border-zinc-800 text-center text-zinc-500 text-xs bg-black">
                    Select a table from the left to run referential impact analysis.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pinned Bottom Footer */}
          <DialogFooter className="p-4 sm:p-5 pt-3 border-t border-zinc-800 bg-black shrink-0 flex flex-col sm:flex-row sm:justify-between items-center gap-2.5">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs border-zinc-800 hover:bg-zinc-900 bg-black text-zinc-300 cursor-pointer w-full sm:w-auto"
              >
                Close
              </Button>
            </DialogClose>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {analysis && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopySql}
                    className="text-xs border-zinc-800 hover:bg-zinc-900 bg-black text-zinc-300 cursor-pointer gap-1.5"
                  >
                    <Copy className="size-3.5" />
                    <span>Copy DDL</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleHighlightOnCanvas}
                    className="text-xs font-semibold bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black hover:brightness-110 cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-950/30"
                  >
                    <Eye className="size-3.5" />
                    <span>Highlight Impact on Canvas</span>
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
