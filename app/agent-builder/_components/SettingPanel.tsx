"use client";
import { WorkflowContext } from "@/context/WorkflowContext";
import React, { useContext } from "react";
import SystemNodeSettings from "../_nodeSettings/SystemNodeSettings";
import TextNodeSettings from "../_nodeSettings/TextNodeSettings";

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

    const isText = liveNode.type === "TextNode" || liveNode.data?.type === "TextNode";

    const updateNode = {
      ...liveNode,
      // Strictly preserve the live aligned position
      position: { ...(liveNode.position || selectedNode.position) },
      data: {
        ...liveNode.data,
        label:
          formData.name ||
          formData.title ||
          (formData.text && formData.text.trim().length > 0
            ? formData.text.slice(0, 25) + "..."
            : liveNode.data?.label),
        title: formData.title || liveNode.data?.title,
        text: formData.text !== undefined ? formData.text : liveNode.data?.text,
        color: formData.color || liveNode.data?.color,
        fontSize: formData.fontSize || liveNode.data?.fontSize || "base",
        ...(isText ? {} : { settings: formData }),
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

  const isTextNode =
    selectedNode.type === "TextNode" || selectedNode.data?.type === "TextNode";

  return (
    <div className="p-4 sm:p-5 bg-card border border-border rounded-xl w-[340px] shadow-xl max-h-[85vh] overflow-y-auto">
      {isTextNode ? (
        <TextNodeSettings
          selectedNode={selectedNode}
          onUpdate={onUpdateNodeData}
          onDeleteNode={onDeleteNode}
          onClose={() => setSelectedNode(null)}
        />
      ) : (
        <SystemNodeSettings
          selectedNode={selectedNode}
          updateFormData={onUpdateNodeData}
          onDeleteNode={onDeleteNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
