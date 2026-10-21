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
    const updateNode = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        label: formData.name,
        settings: formData,
      },
    };
    const currentNodes = addedNodes || [];
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
