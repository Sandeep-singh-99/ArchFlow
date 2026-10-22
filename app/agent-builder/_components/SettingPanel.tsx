"use client";
import { WorkflowContext } from "@/context/WorkflowContext";
import React, { useContext } from "react";
import SystemNodeSettings from "../_nodeSettings/SystemNodeSettings";

export default function SettingPanel({
  onSave,
}: {
  onSave: (nodes: any) => void;
}) {
  const { selectedNode, addedNodes, setAddedNodes, setSelectedNode } =
    useContext(WorkflowContext);

  const onUpdateNodeData = (formData: any) => {
    if (!selectedNode) return;

    const currentNodes = addedNodes || [];
    // Always find the latest live node in canvas state to preserve its exact dragged/aligned position
    const liveNode =
      currentNodes.find((node: any) => node.id === selectedNode.id) || selectedNode;

    const updateNode = {
      ...liveNode,
      // Strictly preserve the live aligned position
      position: { ...(liveNode.position || selectedNode.position) },
      data: {
        ...liveNode.data,
        label: formData.name || liveNode.data?.label || selectedNode.data?.label,
        settings: formData,
      },
    };

    const updatedNodes = currentNodes.map((node: any) =>
      node.id === selectedNode.id ? updateNode : node
    );

    setAddedNodes(updatedNodes);
    setSelectedNode(updateNode);
    onSave(updatedNodes);
  };

  const onDeleteNode = (nodeId: string) => {
    const currentNodes = addedNodes || [];
    const filtered = currentNodes.filter((node: any) => node.id !== nodeId);
    setAddedNodes(filtered);
    setSelectedNode(null);
    onSave(filtered);
  };

  if (!selectedNode) return null;

  return (
    <div className="p-4 sm:p-5 bg-card border border-border rounded-xl w-[340px] shadow-xl max-h-[85vh] overflow-y-auto">
      <SystemNodeSettings
        selectedNode={selectedNode}
        updateFormData={onUpdateNodeData}
        onDeleteNode={onDeleteNode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}
