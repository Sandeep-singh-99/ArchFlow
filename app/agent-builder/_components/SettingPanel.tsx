"use client";
import { WorkflowContext } from "@/context/WorkflowContext";
import React, { useContext } from "react";
import SystemNodeSettings from "../_nodeSettings/SystemNodeSettings";

export default function SettingPanel({
  onSave,
}: {
  onSave: (nodes: any) => void;
}) {
  const { selectedNode, setAddedNodes, setSelectedNode } =
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
    setAddedNodes((prev: any) => {
      const updatedNodes = prev.map((node: any) =>
        node.id === selectedNode.id ? updateNode : node
      );
      onSave(updatedNodes);
      return updatedNodes;
    });
    setSelectedNode(updateNode);
  };

  const onDeleteNode = (nodeId: string) => {
    setAddedNodes((prev: any) => {
      const filtered = prev.filter((node: any) => node.id !== nodeId);
      onSave(filtered);
      return filtered;
    });
    setSelectedNode(null);
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
