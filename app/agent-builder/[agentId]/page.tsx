"use client";
import React, { useContext, useEffect, useState, useCallback, useRef } from "react";
import Header from "../_components/Header";
import {
  ReactFlow,
  ConnectionMode,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  Background,
  BackgroundVariant,
  Panel,
  useOnSelectionChange,
  OnSelectionChangeParams,
  Node,
  type Edge,
  type EdgeChange,
  type Connection,
  NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "../_customNodes/nodeTypes";
import ErRelationshipEdge from "../_customEdges/ErRelationshipEdge";

const edgeTypes = {
  erRelationship: ErRelationshipEdge,
  default: ErRelationshipEdge,
};

import AgentToolsPanel from "../_components/AgentToolsPanel";
import SettingPanel from "../_components/SettingPanel";
import FlowControls, { BackgroundVariantType } from "../_components/FlowControls";
import FlowMiniMap from "../_components/FlowMiniMap";
import { WorkflowContext } from "@/context/WorkflowContext";
import { useConvex, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Agent } from "@/types/AgentTypes";
import { Button } from "@/components/ui/button";
import { Save, Loader, Layers, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getAutoLayout, isDomainGroupNode } from "@/lib/autoLayout";
import { restoreSqlColumnStrings } from "@/lib/ai/autoConnectPreview";
import { resolveNodeFieldHandle, isFieldHandle } from "@/lib/fieldHandleResolver";
import { DomainPreset } from "@/lib/domainThemes";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useAuth } from "@clerk/nextjs";
import { getUserPlanCode, canAccessFeature, notifyFeatureLocked, FeatureKey } from "@/lib/planAccess";
import { Badge } from "@/components/ui/badge";
import AiAutoConnectBar from "../_components/AiAutoConnectBar";
import PlanUpgradeModal from "@/components/plans/PlanUpgradeModal";

export default function AgentBuilder() {
  const {
    addedNodes,
    setAddedNodes,
    nodeEdges,
    setNodeEdges,
    selectedNode,
    setSelectedNode,
  } = useContext(WorkflowContext);

  const { deleteElements, fitView, getNodes, getEdges } = useReactFlow();
  const [nodes, setNodes] = useState<Node[]>(addedNodes || []);

  useEffect(() => {
    setNodes(addedNodes || []);
  }, [addedNodes]);

  const { agentId } = useParams();
  const convex = useConvex();
  const updateAgentDetail = useMutation(api.agent.UpdateAgentDetail);

  const [agentDetail, setAgentDetail] = useState<Agent>();
  const [isSaving, setIsSaving] = useState(false);
  const [isArranging, setIsArranging] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [bgVariant, setBgVariant] = useState<BackgroundVariantType>("dots");
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [selectedNodesList, setSelectedNodesList] = useState<Node[]>([]);
  const { userDetails } = useContext(UserDetailContext);
  const { has } = useAuth();
  const userPlan = getUserPlanCode(userDetails, has);
  const canAccessDomain = canAccessFeature("domain_grouping", userPlan);
  // Temporarily unlocked for testing; restore `canAccessFeature("ai_copilot", userPlan)` when ready
  const canAccessAi = true;
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<FeatureKey>("domain_grouping");

  const GetAgentDetail = async () => {
    try {
      const results = await convex.query(api.agent.GetAgentById, {
        agentId: agentId as string,
      });
      setAgentDetail(results || undefined);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setSelectedNode(null);
    GetAgentDetail();
  }, []);

  useEffect(() => {
    if (agentDetail) {
      // Respect saved nodes directly; if empty or new, start with an empty canvas
      const savedNodes: Node[] = agentDetail.nodes || [];
      setAddedNodes(savedNodes.map(restoreSqlColumnStrings));
      setNodeEdges(agentDetail.edges || []);
    }
  }, [agentDetail]);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const SaveNodeAndEdges = useCallback(
    async (
      updatedNodes?: Node[],
      updatedEdges?: Edge[],
      showToast: boolean = false
    ) => {
      if (!agentDetail?._id) return;
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      try {
        setIsSaving(true);
        const nodesToSave = updatedNodes ?? getNodes();
        const edgesToSave = updatedEdges ?? getEdges();
        await updateAgentDetail({
          id: agentDetail._id,
          edges: edgesToSave,
          nodes: nodesToSave,
        });
        if (showToast) {
          toast.success("Database schema saved!");
        }
        return true;
      } catch (e) {
        console.error(e);
        toast.error("Failed to save database schema");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [agentDetail?._id, getNodes, getEdges, updateAgentDetail]
  );

  const debouncedAutoSave = useCallback(
    (updatedNodes?: Node[], updatedEdges?: Edge[]) => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        SaveNodeAndEdges(updatedNodes, updatedEdges, false);
      }, 1000);
    },
    [SaveNodeAndEdges]
  );

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // 1. Keep active node positions in React Flow's local internal state during drag
      setNodes((nodesSnapshot: Node[]) =>
        applyNodeChanges(changes, nodesSnapshot || [])
      );

      // 2. Decouple position changes during drags from global WorkflowContext
      const hasPositionChange = changes.some((c) => c.type === "position");
      if (!hasPositionChange) {
        setAddedNodes((nodesSnapshot: Node[]) =>
          applyNodeChanges(changes, nodesSnapshot || [])
        );
      }
    },
    [setAddedNodes]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      const currentNodes = getNodes();
      setAddedNodes(currentNodes);
      debouncedAutoSave(currentNodes);
    },
    [setSelectedNode, getNodes, setAddedNodes, debouncedAutoSave]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setNodeEdges((edgesSnapshot: Edge[]) =>
        applyEdgeChanges(changes, edgesSnapshot || [])
      ),
    [setNodeEdges]
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setNodeEdges((edgesSnapshot: Edge[]) => {
        const allNodes = addedNodes || [];
        const sourceNode = allNodes.find((n: Node) => n.id === params.source);
        const targetNode = allNodes.find((n: Node) => n.id === params.target);
        const isEnumEdge = sourceNode?.type === "SqlEnumNode" || targetNode?.type === "SqlEnumNode";

        const newEdges = addEdge(
          {
            ...params,
            type: "erRelationship",
            data: {
              cardinality: isEnumEdge ? "enum" : "1:N",
            },
            animated: true,
            style: {
              stroke: isEnumEdge ? "#f59e0b" : "#10b981",
              strokeWidth: 2,
            },
            label: isEnumEdge ? "ENUM" : "1:N",
          },
          edgesSnapshot || []
        );
        debouncedAutoSave(undefined, newEdges);
        return newEdges;
      }),
    [setNodeEdges, addedNodes, debouncedAutoSave]
  );

  const lastEdgeClickRef = useRef<{ id: string; time: number } | null>(null);

  const disconnectEdge = useCallback(
    (edge: Edge | string) => {
      const edgeId = typeof edge === "string" ? edge : edge?.id;
      if (!edgeId) return;

      // Delete via React Flow internal engine
      deleteElements({ edges: [{ id: edgeId }] });

      // Filter out from local workflow state and auto-save
      setNodeEdges((eds: Edge[]) => {
        const remaining = (eds || []).filter((e: Edge) => e.id !== edgeId);
        debouncedAutoSave(undefined, remaining);
        return remaining;
      });

      toast.info("Connection disconnected");
    },
    [deleteElements, setNodeEdges, debouncedAutoSave]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setNodes((nds: Node[]) =>
      (nds || []).map((n) => (n.selected ? { ...n, selected: false } : n))
    );
    setAddedNodes((nds: Node[]) =>
      (nds || []).map((n) => (n.selected ? { ...n, selected: false } : n))
    );
  }, [setSelectedNode, setAddedNodes]);

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event?.stopPropagation?.();
      setSelectedNode(null);
      setNodes((nds: Node[]) =>
        (nds || []).map((n) => (n.selected ? { ...n, selected: false } : n))
      );
      setAddedNodes((nds: Node[]) =>
        (nds || []).map((n) => (n.selected ? { ...n, selected: false } : n))
      );

      const now = Date.now();
      const isFastClick =
        lastEdgeClickRef.current &&
        lastEdgeClickRef.current.id === edge?.id &&
        now - lastEdgeClickRef.current.time < 500;

      // Handle double click reliably via click count (event.detail >= 2) or rapid consecutive clicks
      if (event.detail >= 2 || isFastClick) {
        disconnectEdge(edge);
        lastEdgeClickRef.current = null;
        return;
      }

      lastEdgeClickRef.current = { id: edge?.id, time: now };
    },
    [disconnectEdge, setSelectedNode, setAddedNodes]
  );

  const onEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event?.stopPropagation?.();
      setSelectedNode(null);
      disconnectEdge(edge);
      lastEdgeClickRef.current = null;
    },
    [disconnectEdge, setSelectedNode]
  );

  const onNodeSelect = useCallback(
    ({ nodes }: OnSelectionChangeParams) => {
      setSelectedNodesList(nodes || []);
      if (nodes && nodes.length === 1) {
        setSelectedNode(nodes[0]);
      } else if (!nodes || nodes.length === 0) {
        setSelectedNode(null);
      }
    },
    [setSelectedNode]
  );

  useOnSelectionChange({
    onChange: onNodeSelect,
  });

  const handleAutoArrange = useCallback(
    (direction: "LR" | "TB" = "LR") => {
      const currentNodes = nodes.length > 0 ? nodes : addedNodes;
      if (!currentNodes || currentNodes.length === 0) {
        toast.info("No nodes on the canvas to arrange");
        return;
      }

      setIsArranging(true);
      try {
        const layout = getAutoLayout(currentNodes, nodeEdges, {
          direction,
          nodeSep: 80,
          rankSep: 110,
        });

        const isHorizontal = direction === "LR";
        const updatedEdges = (nodeEdges || []).map((e: Edge) => {
          const hasSourceFieldHandle = isFieldHandle(e.sourceHandle);
          const hasTargetFieldHandle = isFieldHandle(e.targetHandle);

          // Preserve existing field connections if already wired to column/field handles
          if (hasSourceFieldHandle && hasTargetFieldHandle) {
            return e;
          }

          // Upgrade generic edges to field-level handles if table/collection nodes exist
          const srcNode = (currentNodes || []).find((n: Node) => n.id === e.source);
          const tgtNode = (currentNodes || []).find((n: Node) => n.id === e.target);
          if (srcNode && tgtNode) {
            const srcSide = isHorizontal ? "right" : "bottom";
            const tgtSide = isHorizontal ? "left" : "top";
            const srcH = resolveNodeFieldHandle(
              srcNode,
              typeof e.data?.sourceColumn === "string" ? e.data.sourceColumn : undefined,
              "parent",
              "right",
              tgtNode
            );
            const tgtH = resolveNodeFieldHandle(
              tgtNode,
              typeof e.data?.targetColumn === "string" ? e.data.targetColumn : undefined,
              "child",
              "left",
              srcNode
            );

            return {
              ...e,
              sourceHandle: srcH.isFieldConnection ? srcH.handleId : srcSide,
              targetHandle: tgtH.isFieldConnection ? tgtH.handleId : tgtSide,
              data: {
                ...(e.data || {}),
                sourceColumn: srcH.colName || e.data?.sourceColumn,
                targetColumn: tgtH.colName || e.data?.targetColumn,
              },
            };
          }

          return {
            ...e,
            sourceHandle: isHorizontal ? "right" : "bottom",
            targetHandle: isHorizontal ? "left" : "top",
          };
        });

        setNodes(layout.nodes);
        setAddedNodes(layout.nodes);
        setNodeEdges(updatedEdges);
        SaveNodeAndEdges(layout.nodes, updatedEdges, false);
        toast.success(
          `Schema organized (${direction === "LR" ? "Left-to-Right" : "Top-to-Bottom"} hierarchical layout)`
        );

        setTimeout(() => {
          fitView({ duration: 500, padding: 0.25 });
        }, 50);
      } catch (err) {
        console.error("Auto-layout failed:", err);
        toast.error("Auto-layout encountered an error");
      } finally {
        setIsArranging(false);
      }
    },
    [nodes, addedNodes, nodeEdges, setAddedNodes, fitView, SaveNodeAndEdges]
  );

  const handleGroupSelection = useCallback(
    (preset?: DomainPreset) => {
      if (!selectedNodesList || selectedNodesList.length === 0) return;

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      const currentNodes = nodes.length > 0 ? nodes : addedNodes;
      // Calculate bounding box in absolute canvas space
      selectedNodesList.forEach((node: Node) => {
        const parent = node.parentId
          ? (currentNodes || []).find((n: Node) => n.id === node.parentId)
          : null;
        const absX = (parent?.position?.x || 0) + (node.position?.x || 0);
        const absY = (parent?.position?.y || 0) + (node.position?.y || 0);
        const w = node.measured?.width || node.width || 300;
        const h = node.measured?.height || node.height || 200;

        minX = Math.min(minX, absX);
        minY = Math.min(minY, absY);
        maxX = Math.max(maxX, absX + w);
        maxY = Math.max(maxY, absY + h);
      });

      const padding = 45;
      const headerHeight = 65;

      const domainX = Math.round(minX - padding);
      const domainY = Math.round(minY - padding - headerHeight);
      const domainWidth = Math.max(380, Math.round(maxX - minX + padding * 2));
      const domainHeight = Math.max(260, Math.round(maxY - minY + padding * 2 + headerHeight));

      const domainId = `domain-${Date.now()}`;
      const domainName = preset?.name || "New Domain";
      const domainTheme = preset?.theme || "indigo";
      const domainDesc = preset?.description || "Bounded context domain container";
      const domainIcon = preset?.icon || "Layers";

      const newDomainNode = {
        id: domainId,
        type: "DomainGroupNode",
        position: { x: domainX, y: domainY },
        style: { width: domainWidth, height: domainHeight },
        data: {
          label: domainName,
          name: domainName,
          description: domainDesc,
          colorTheme: domainTheme,
          icon: domainIcon,
          isDomainGroup: true,
        },
      };

      const selectedIds = new Set(selectedNodesList.map((n) => n.id));

      // Update selected child nodes to be relative to the new domain container
      const updatedNodes = (currentNodes || []).map((node: Node) => {
        if (selectedIds.has(node.id)) {
          const currentParent = node.parentId
            ? (currentNodes || []).find((n: Node) => n.id === node.parentId)
            : null;
          const absX = (currentParent?.position?.x || 0) + (node.position?.x || 0);
          const absY = (currentParent?.position?.y || 0) + (node.position?.y || 0);

          return {
            ...node,
            parentId: domainId,
            position: {
              x: Math.round(absX - domainX),
              y: Math.round(absY - domainY),
            },
            data: {
              ...(node.data || {}),
              domainId: domainId,
              domainName: domainName,
              domainTheme: domainTheme,
            },
          };
        }
        return node;
      });

      // Group nodes must come before child nodes in the React Flow array
      const nonChildNodes = updatedNodes.filter((n: Node) => !selectedIds.has(n.id));
      const childNodes = updatedNodes.filter((n: Node) => selectedIds.has(n.id));

      const finalNodes = [
        newDomainNode,
        ...nonChildNodes.filter((n: Node) => isDomainGroupNode(n)),
        ...nonChildNodes.filter((n: Node) => !isDomainGroupNode(n)),
        ...childNodes,
      ];

      setNodes(finalNodes);
      setAddedNodes(finalNodes);
      setSelectedNode(newDomainNode);
      SaveNodeAndEdges(finalNodes);
      toast.success(
        `Grouped ${selectedNodesList.length} tables into Custom Domain`
      );
    },
    [selectedNodesList, nodes, addedNodes, setAddedNodes, setSelectedNode, SaveNodeAndEdges]
  );

  const handleCanvasWrapperClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const isNode = target.closest(".react-flow__node");
      const isPanel =
        target.closest(".react-flow__panel") ||
        target.closest("[role='dialog']") ||
        target.closest("[role='menu']");
      if (!isNode && !isPanel) {
        setSelectedNode(null);
        setAddedNodes((nds: Node[]) =>
          (nds || []).map((n) => (n.selected ? { ...n, selected: false } : n))
        );
      }
    },
    [setSelectedNode, setAddedNodes]
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <Header agentDetail={agentDetail} />
      <div className="flex-1 w-full relative" onClick={handleCanvasWrapperClick}>
        <ReactFlow
          onlyRenderVisibleElements={true}
          colorMode="dark"
          connectionMode={ConnectionMode.Loose}
          nodes={nodes}
          edges={nodeEdges || []}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(e, node) => setSelectedNode(node)}
          onNodeDragStop={onNodeDragStop}
          onPaneClick={onPaneClick}
          onEdgeClick={onEdgeClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          deleteKeyCode={null}
          edgesReconnectable={false}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: "#10b981", strokeWidth: 2 },
            interactionWidth: 36,
            labelStyle: { fill: "#ffffff", fontWeight: 500, fontSize: 11 },
            labelBgStyle: { fill: "rgba(0, 0, 0, 0.75)", stroke: "#ffffff", strokeWidth: 1 },
            labelBgPadding: [12, 6],
            labelBgBorderRadius: 8,
          }}
          fitView
          nodesDraggable={!isLocked}
          nodesConnectable={!isLocked}
          elementsSelectable={!isLocked}
        >
          {/* Custom Theme-Adaptive Canvas Background Pattern */}
          {bgVariant !== "none" && (
            <Background
              variant={
                bgVariant === "lines"
                  ? BackgroundVariant.Lines
                  : bgVariant === "cross"
                  ? BackgroundVariant.Cross
                  : BackgroundVariant.Dots
              }
              gap={bgVariant === "lines" ? 24 : 16}
              size={bgVariant === "lines" ? 1 : bgVariant === "cross" ? 6 : 1.2}
              className="opacity-40 dark:opacity-30"
            />
          )}

          {/* Canvas Floating Control Center */}
          <FlowControls
            isLocked={isLocked}
            setIsLocked={setIsLocked}
            bgVariant={bgVariant}
            setBgVariant={setBgVariant}
            showMiniMap={showMiniMap}
            setShowMiniMap={setShowMiniMap}
            onAutoArrange={handleAutoArrange}
            isArranging={isArranging}
          />

          {/* Multi-Selection Domain Grouping Toolbar */}
          {selectedNodesList.length >= 2 && (
            <Panel position="top-center" className="mt-3">
              <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-card/95 dark:bg-zinc-900/95 backdrop-blur-md border border-border shadow-2xl rounded-xl animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  <span>{selectedNodesList.length} items selected</span>
                </div>

                <div className="h-4 w-px bg-border mx-1" />

                <Button
                  size="sm"
                  onClick={() => {
                    if (!canAccessDomain) {
                      notifyFeatureLocked("domain_grouping", userPlan);
                      setUpgradeFeature("domain_grouping");
                      setShowUpgradeModal(true);
                    } else {
                      handleGroupSelection();
                    }
                  }}
                  className="h-7 text-xs gap-1.5 font-medium bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Group into Custom Domain</span>
                  {!canAccessDomain && (
                    <Badge className="bg-amber-400 text-black text-[9px] px-1 py-0 font-bold ml-1 font-mono">
                      PRO
                    </Badge>
                  )}
                </Button>
              </div>
            </Panel>
          )}

          {/* Radar MiniMap */}
          {showMiniMap && <FlowMiniMap />}

          {/* Left Palette: System Components */}
          <Panel position="top-left" className="flex flex-col gap-2 z-30">
            <AgentToolsPanel />
          </Panel>

          {/* Right Inspector: Node Specifications (only visible when a node is selected) */}
          {selectedNode && (
            <Panel position="top-right">
              <SettingPanel onSave={(nodes: Node[]) => debouncedAutoSave(nodes)} />
            </Panel>
          )}

          {/* Empty Canvas Quick Starter */}
          {(!nodes || nodes.length === 0) && (!addedNodes || addedNodes.length === 0) && (
            <Panel position="top-center" className="mt-20 pointer-events-auto">
              <div className="max-w-md p-6 rounded-2xl bg-card/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-border shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 via-emerald-500/20 to-teal-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-500">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">
                    Database Schema Canvas
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Start designing your database schema using the tools palette on the left.
                  </p>
                </div>
              </div>
            </Panel>
          )}

          {/* Bottom Center: Save & AI Auto-Connect Actions */}
          <Panel position="bottom-center">
            <div className="flex items-end gap-2">
              <Button
                onClick={() => SaveNodeAndEdges(undefined, undefined, true)}
                disabled={isSaving}
                className="gap-2 font-semibold bg-zinc-900 hover:bg-zinc-800 text-white border border-border shadow-md cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin text-white" />
                    <span className="text-white">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 text-white" />
                    <span className="text-white">Save</span>
                  </>
                )}
              </Button>

              <AiAutoConnectBar
                nodes={nodes.length > 0 ? nodes : addedNodes || []}
                edges={nodeEdges || []}
                canAccessAi={canAccessAi}
                onLockedClick={() => {
                  notifyFeatureLocked("ai_copilot", userPlan);
                  setUpgradeFeature("ai_copilot");
                  setShowUpgradeModal(true);
                }}
                onPreviewChange={(previewNodes, previewEdges) => {
                  setNodes(previewNodes);
                  setAddedNodes(previewNodes);
                  setNodeEdges(previewEdges);
                }}
                onApply={(finalNodes, finalEdges) => {
                  setNodes(finalNodes);
                  setAddedNodes(finalNodes);
                  setNodeEdges(finalEdges);
                  SaveNodeAndEdges(finalNodes, finalEdges, false);
                }}
                onReject={(originalNodes, originalEdges) => {
                  setNodes(originalNodes);
                  setAddedNodes(originalNodes);
                  setNodeEdges(originalEdges);
                }}
              />
            </div>
          </Panel>
        </ReactFlow>

        <PlanUpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          featureKey={upgradeFeature}
          currentPlan={userPlan}
        />
      </div>
    </div>
  );
}
