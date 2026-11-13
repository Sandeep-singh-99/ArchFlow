"use client";

import React, { useState } from "react";
import { ReactFlowProvider, Node, Edge } from "@xyflow/react";
import { WorkflowContext } from "@/context/WorkflowContext";

export default function AgentBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [addedNodes, setAddedNodes] = useState<Node[]>([]);
  const [nodeEdges, setNodeEdges] = useState<Edge[]>([]);

  return (
    <ReactFlowProvider>
      <WorkflowContext.Provider
        value={{
          addedNodes,
          setAddedNodes,
          nodeEdges,
          setNodeEdges,
          selectedNode,
          setSelectedNode,
        }}
      >
        {children}
      </WorkflowContext.Provider>
    </ReactFlowProvider>
  );
}
