"use client";
import React, { useContext, useEffect, useState, useCallback } from "react";
import Header from "../_components/Header";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  MiniMap,
  Controls,
  Panel,
  useOnSelectionChange,
  OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "../_customNodes/nodeTypes";

import AgentToolsPanel from "../_components/AgentToolsPanel";
import SettingPanel from "../_components/SettingPanel";
import { WorkflowContext } from "@/context/WorkflowContext";
import { useConvex, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Agent } from "@/types/AgentTypes";
import { Button } from "@/components/ui/button";
import { Save, Check, Loader } from "lucide-react";
import { toast } from "sonner";

const defaultSystemNodes = [
  {
    id: "client-1",
    type: "ClientNode",
    position: { x: 50, y: 150 },
    data: {
      label: "Web & Mobile Clients",
      settings: {
        name: "Web & Mobile Clients",
        protocol: "HTTPS / HTTP/3",
        qps: "100k QPS",
      },
    },
  },
  {
    id: "gateway-1",
    type: "GatewayNode",
    position: { x: 320, y: 150 },
    data: {
      label: "Envoy API Gateway",
      settings: {
        name: "Envoy API Gateway",
        tech: "Envoy / Rate Limiting",
        latency: "2.4ms",
      },
    },
  },
  {
    id: "service-1",
    type: "ServiceNode",
    position: { x: 600, y: 150 },
    data: {
      label: "Order Service",
      settings: {
        name: "Order Service",
        tech: "Go Microservice (HPA)",
        latency: "8.5ms",
      },
    },
  },
  {
    id: "cache-1",
    type: "CacheNode",
    position: { x: 880, y: 60 },
    data: {
      label: "Redis Cache",
      settings: {
        name: "Redis Cache",
        tech: "Cluster LRU",
        hitRatio: "0.8ms • 94% Hit",
      },
    },
  },
  {
    id: "db-1",
    type: "DatabaseNode",
    position: { x: 880, y: 240 },
    data: {
      label: "PostgreSQL Database",
      settings: {
        name: "PostgreSQL Database",
        tech: "Master-Replica (WAL)",
        latency: "6.2ms",
      },
    },
  },
];

const defaultSystemEdges = [
  { id: "e1-2", source: "client-1", target: "gateway-1", animated: true },
  { id: "e2-3", source: "gateway-1", target: "service-1", animated: true },
  { id: "e3-4", source: "service-1", target: "cache-1", animated: true },
  { id: "e3-5", source: "service-1", target: "db-1", animated: true },
];

export default function AgentBuilder() {
  const {
    addedNodes,
    setAddedNodes,
    nodeEdges,
    setNodeEdges,
    setSelectedNode,
  } = useContext(WorkflowContext);

  const { agentId } = useParams();
  const convex = useConvex();
  const updateAgentDetail = useMutation(api.agent.UpdateAgentDetail);

  const [agentDetail, setAgentDetail] = useState<Agent>();
  const [isSaving, setIsSaving] = useState(false);

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
    GetAgentDetail();
  }, []);

  useEffect(() => {
    if (agentDetail) {
      if (agentDetail.nodes && agentDetail.nodes.length > 0) {
        setAddedNodes(agentDetail.nodes);
        setNodeEdges(agentDetail.edges || []);
      } else {
        // Initialize with realistic starter system design topology
        setAddedNodes(defaultSystemNodes);
        setNodeEdges(defaultSystemEdges);
      }
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
      toast.success("Architecture saved!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save architecture");
    } finally {
      setIsSaving(false);
    }
  };

  const onNodesChange = useCallback(
    (changes: any) =>
      setAddedNodes((nodesSnapshot: any) => {
        const updated = applyNodeChanges(changes, nodesSnapshot || []);
        return updated;
      }),
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
        addEdge({ ...params, animated: true }, edgesSnapshot || [])
      ),
    [setNodeEdges]
  );

  const onNodeSelect = useCallback(
    ({ nodes }: OnSelectionChangeParams) => {
      if (nodes && nodes.length > 0) {
        setSelectedNode(nodes[0]);
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
          nodes={addedNodes || []}
          edges={nodeEdges || []}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(e, node) => setSelectedNode(node)}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{
            animated: true,
            style: { strokeWidth: 2 },
          }}
          fitView
        >
          <MiniMap className="border border-border bg-card rounded-lg overflow-hidden" />
          <Controls className="border border-border bg-card rounded-lg overflow-hidden" />
          {/* Theme-adaptive canvas background */}
          <Background gap={16} size={1} className="opacity-50" />

          {/* Left Palette: System Components */}
          <Panel position="top-left">
            <AgentToolsPanel />
          </Panel>

          {/* Right Inspector: Node Specifications */}
          <Panel position="top-right">
            <SettingPanel onSave={(nodes: any) => SaveNodeAndEdges(nodes)} />
          </Panel>

          {/* Bottom Center: Save Action */}
          <Panel position="bottom-center">
            <Button
              onClick={() => SaveNodeAndEdges()}
              disabled={isSaving}
              className="gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 shadow-md cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Architecture</span>
                </>
              )}
            </Button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
