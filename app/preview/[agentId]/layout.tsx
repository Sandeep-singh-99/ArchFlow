"use client";

import React, { useState } from "react";
import { ReactFlowProvider, Node, Edge } from "@xyflow/react";
import { WorkflowContext } from "@/context/WorkflowContext";

export default function PreviewLayout({
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
        <div className="w-screen h-screen overflow-hidden bg-background text-foreground flex flex-col select-none">
          {children}
        </div>
      </WorkflowContext.Provider>
    </ReactFlowProvider>
  );
}
