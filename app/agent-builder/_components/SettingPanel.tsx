"use client";
import { WorkflowContext } from "@/context/WorkflowContext";
import React, { useContext } from "react";
import SystemNodeSettings from "../_nodeSettings/SystemNodeSettings";
import AgentSettings from "../_nodeSettings/AgentSettings";
import EndSettings from "../_nodeSettings/EndSettings";
import IfElseSetting from "../_nodeSettings/IfElseSetting";
import WhileSettings from "../_nodeSettings/WhileSettings";
import UserApprovalSettings from "../_nodeSettings/UserApprovalSettings";
import ApiSettings from "../_nodeSettings/ApiSettings";

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

  const isSystemNode = [
    "FrontendNode",
    "MobileNode",
    "AiAgentNode",
    "CloudInfraNode",
    "ClientNode",
    "DnsNode",
    "CdnNode",
    "GatewayNode",
    "LoadBalancerNode",
    "RateLimiterNode",
    "ServiceNode",
    "ServerlessNode",
    "QueueNode",
    "CacheNode",
    "DatabaseNode",
    "VectorDbNode",
    "StorageNode",
    "WorkerNode",
    "SearchNode",
    "MonitoringNode",
    "ThirdPartyApiNode",
  ].includes(selectedNode?.type);

  return (
    <div className="p-4 sm:p-5 bg-card border border-border rounded-xl w-[340px] shadow-xl max-h-[85vh] overflow-y-auto">
      {isSystemNode && (
        <SystemNodeSettings
          selectedNode={selectedNode}
          updateFormData={onUpdateNodeData}
          onDeleteNode={onDeleteNode}
        />
      )}

      {/* Legacy Fallbacks */}
      {selectedNode?.type === "AgentNode" && (
        <AgentSettings
          selectedNode={selectedNode}
          updateFormData={onUpdateNodeData}
        />
      )}
      {selectedNode?.type === "EndNode" && (
        <EndSettings
          selectedNode={selectedNode}
          updateFormData={onUpdateNodeData}
        />
      )}
      {selectedNode?.type === "IfElseNode" && (
        <IfElseSetting
          selectedNode={selectedNode}
          updateFormData={onUpdateNodeData}
        />
      )}
      {selectedNode?.type === "WhileNode" && (
        <WhileSettings
          selectedNode={selectedNode}
          updateFormData={onUpdateNodeData}
        />
      )}
      {selectedNode?.type === "UserApprovalNode" && (
        <UserApprovalSettings
          selectedNode={selectedNode}
          updateFormData={onUpdateNodeData}
        />
      )}
      {selectedNode?.type === "ApiNode" && (
        <ApiSettings
          selectedNode={selectedNode}
          updateFormData={onUpdateNodeData}
        />
      )}
    </div>
  );
}
