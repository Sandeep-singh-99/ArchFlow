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
import { Save, Check, Loader } from "lucide-react";
import { toast } from "sonner";

export default function AgentBuilder() {
  const {
    addedNodes,
    setAddedNodes,
    nodeEdges,
    setNodeEdges,
    selectedNode,
    setSelectedNode,
  } = useContext(WorkflowContext);

  const { deleteElements } = useReactFlow();

  const { agentId } = useParams();
  const convex = useConvex();
  const updateAgentDetail = useMutation(api.agent.UpdateAgentDetail);

  const [agentDetail, setAgentDetail] = useState<Agent>();
  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [bgVariant, setBgVariant] = useState<BackgroundVariantType>("dots");
  const [showMiniMap, setShowMiniMap] = useState(true);

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

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: any) => {
      event?.stopPropagation?.();
      setSelectedNode(null);

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
    [disconnectEdge, setSelectedNode]
  );

  const onEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: any) => {
      event?.stopPropagation?.();
      disconnectEdge(edge);
      lastEdgeClickRef.current = null;
    },
    [disconnectEdge]
  );

  const onNodeSelect = useCallback(
    ({ nodes }: OnSelectionChangeParams) => {
      if (nodes && nodes.length > 0) {
        setSelectedNode(nodes[0]);
      } else {
        setSelectedNode(null);
      }
    },
    [setSelectedNode]
  );

  useOnSelectionChange({
    onChange: onNodeSelect,
  });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <Header agentDetail={agentDetail} />
      <div className="flex-1 w-full relative">
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
          onPaneClick={() => setSelectedNode(null)}
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
          />

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
