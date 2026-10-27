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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Save, Loader, Layers, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getAutoLayout, isDomainGroupNode } from "@/lib/autoLayout";
import { DOMAIN_PRESETS, DomainPreset, DOMAIN_THEMES } from "@/lib/domainThemes";
import { generateAllDomainsDemoSchema } from "@/lib/demoDomainSchema";

export default function AgentBuilder() {
  const {
    addedNodes,
    setAddedNodes,
    nodeEdges,
    setNodeEdges,
    selectedNode,
    setSelectedNode,
  } = useContext(WorkflowContext);

  const { deleteElements, fitView } = useReactFlow();

  const { agentId } = useParams();
  const convex = useConvex();
  const updateAgentDetail = useMutation(api.agent.UpdateAgentDetail);

  const [agentDetail, setAgentDetail] = useState<Agent>();
  const [isSaving, setIsSaving] = useState(false);
  const [isArranging, setIsArranging] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [bgVariant, setBgVariant] = useState<BackgroundVariantType>("dots");
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [selectedNodesList, setSelectedNodesList] = useState<any[]>([]);

  const GetAgentDetail = async () => {
    try {
      const results = await convex.query(api.agent.GetAgentById, {
        agentId: agentId as string,
      });
      setAgentDetail(results);
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
      setAddedNodes(agentDetail.nodes || []);
      setNodeEdges(agentDetail.edges || []);
    }
  }, [agentDetail]);

  const SaveNodeAndEdges = async (updatedNodes?: any, updatedEdges?: any) => {
    if (!agentDetail?._id) return;
    try {
      setIsSaving(true);
      await updateAgentDetail({
        id: agentDetail._id,
        edges: updatedEdges ?? nodeEdges,
        nodes: updatedNodes ?? addedNodes,
      });
      toast.success("Database schema saved!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save database schema");
    } finally {
      setIsSaving(false);
    }
  };

  const onNodesChange = useCallback(
    (changes: any) =>
      setAddedNodes((nodesSnapshot: any) =>
        applyNodeChanges(changes, nodesSnapshot || [])
      ),
    [setAddedNodes]
  );

  const onEdgesChange = useCallback(
    (changes: any) =>
      setNodeEdges((edgesSnapshot: any) =>
        applyEdgeChanges(changes, edgesSnapshot || [])
      ),
    [setNodeEdges]
  );

  const onConnect = useCallback(
    (params: any) =>
      setNodeEdges((edgesSnapshot: any) =>
        addEdge(
          {
            ...params,
            type: "erRelationship",
            data: {
              cardinality: "1:N",
            },
            animated: true,
            style: { stroke: "#10b981", strokeWidth: 2 },
            label: "1:N",
          },
          edgesSnapshot || []
        )
      ),
    [setNodeEdges]
  );

  const lastEdgeClickRef = useRef<{ id: string; time: number } | null>(null);

  const disconnectEdge = useCallback(
    (edge: any) => {
      const edgeId = typeof edge === "string" ? edge : edge?.id;
      if (!edgeId) return;

      // Delete via React Flow internal engine
      deleteElements({ edges: [{ id: edgeId }] });

      // Filter out from local workflow state
      setNodeEdges((eds: any) => (eds || []).filter((e: any) => e.id !== edgeId));

      toast.info("Connection disconnected");
    },
    [deleteElements, setNodeEdges]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setAddedNodes((nds: any[]) =>
      (nds || []).map((n) => (n.selected ? { ...n, selected: false } : n))
    );
  }, [setSelectedNode, setAddedNodes]);

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: any) => {
      event?.stopPropagation?.();
      setSelectedNode(null);
      setAddedNodes((nds: any[]) =>
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
    (event: React.MouseEvent, edge: any) => {
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
      if (!addedNodes || addedNodes.length === 0) {
        toast.info("No nodes on the canvas to arrange");
        return;
      }

      setIsArranging(true);
      try {
        const layout = getAutoLayout(addedNodes, nodeEdges, {
          direction,
          nodeSep: 80,
          rankSep: 110,
        });

        setAddedNodes(layout.nodes);
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
    [addedNodes, nodeEdges, setAddedNodes, fitView]
  );

  const handleGroupSelection = useCallback(
    (preset?: DomainPreset) => {
      if (!selectedNodesList || selectedNodesList.length === 0) return;

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      // Calculate bounding box in absolute canvas space
      selectedNodesList.forEach((node: any) => {
        const parent = node.parentId
          ? (addedNodes || []).find((n: any) => n.id === node.parentId)
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
      const updatedNodes = (addedNodes || []).map((node: any) => {
        if (selectedIds.has(node.id)) {
          const currentParent = node.parentId
            ? (addedNodes || []).find((n: any) => n.id === node.parentId)
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
      const nonChildNodes = updatedNodes.filter((n: any) => !selectedIds.has(n.id));
      const childNodes = updatedNodes.filter((n: any) => selectedIds.has(n.id));

      const finalNodes = [
        newDomainNode,
        ...nonChildNodes.filter((n: any) => isDomainGroupNode(n)),
        ...nonChildNodes.filter((n: any) => !isDomainGroupNode(n)),
        ...childNodes,
      ];

      setAddedNodes(finalNodes);
      setSelectedNode(newDomainNode);
      SaveNodeAndEdges(finalNodes);
      toast.success(
        `Grouped ${selectedNodesList.length} tables into "${domainName}" domain`
      );
    },
    [selectedNodesList, addedNodes, setAddedNodes, setSelectedNode, SaveNodeAndEdges]
  );

  const handleLoadAllDomainsDemo = useCallback(() => {
    const demo = generateAllDomainsDemoSchema();
    setAddedNodes(demo.nodes);
    setNodeEdges(demo.edges);
    toast.success("Loaded Enterprise 8-Domain Architecture Demo!");
    setTimeout(() => {
      fitView({ duration: 500, padding: 0.25 });
    }, 50);
  }, [setAddedNodes, setNodeEdges, fitView]);

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
        setAddedNodes((nds: any[]) =>
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
          colorMode="dark"
          connectionMode={ConnectionMode.Loose}
          nodes={addedNodes || []}
          edges={nodeEdges || []}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(e, node) => setSelectedNode(node)}
          onNodeDragStop={(e, node) => setSelectedNode(node)}
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
                  <Layers className="h-4 w-4 text-emerald-500" />
                  <span>{selectedNodesList.length} items selected</span>
                </div>

                <div className="h-4 w-px bg-border mx-1" />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1.5 font-medium bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Group into Domain
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-56">
                    <DropdownMenuLabel className="text-xs font-semibold">
                      Select Domain Boundary
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {DOMAIN_PRESETS.map((preset) => {
                      const theme = DOMAIN_THEMES[preset.theme];
                      return (
                        <DropdownMenuItem
                          key={preset.name}
                          onClick={() => handleGroupSelection(preset)}
                          className="text-xs cursor-pointer py-1.5 flex items-center justify-between"
                        >
                          <span>{preset.name}</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: theme.accent }}
                          />
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleGroupSelection()}
                      className="text-xs cursor-pointer py-1.5 font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      + Custom Domain Boundary
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Panel>
          )}

          {/* Radar MiniMap */}
          {showMiniMap && <FlowMiniMap />}

          {/* Left Palette: System Components */}
          <Panel position="top-left">
            <AgentToolsPanel />
          </Panel>

          {/* Right Inspector: Node Specifications (only visible when a node is selected) */}
          {selectedNode && (
            <Panel position="top-right">
              <SettingPanel onSave={(nodes: any) => SaveNodeAndEdges(nodes)} />
            </Panel>
          )}

          {/* Empty Canvas Quick Starter */}
          {(!addedNodes || addedNodes.length === 0) && (
            <Panel position="top-center" className="mt-20 pointer-events-auto">
              <div className="max-w-md p-6 rounded-2xl bg-card/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-border shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 via-indigo-500/20 to-amber-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">
                    Database Schema Canvas
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Start designing your database schema using the tools palette on the left, or load the complete 8-domain enterprise architecture demo with one click.
                  </p>
                </div>
                <Button
                  onClick={handleLoadAllDomainsDemo}
                  className="w-full gap-2 font-semibold bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white hover:brightness-110 shadow-md cursor-pointer border-none"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Load All 8 Domains Architecture Demo</span>
                </Button>
              </div>
            </Panel>
          )}

          {/* Bottom Center: Save Action */}
          <Panel position="bottom-center">
            <Button
              onClick={() => SaveNodeAndEdges()}
              disabled={isSaving}
              className="gap-2 font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none shadow-md cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader className="h-4 w-4 animate-spin text-zinc-950" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 text-zinc-950" />
                  <span>Save Database Schema</span>
                </>
              )}
            </Button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
