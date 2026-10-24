"use client";

import React, { useContext, useState, useEffect } from "react";
import { WorkflowContext } from "@/context/WorkflowContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, X } from "lucide-react";

export default function SettingPanel({
  onSave,
}: {
  onSave: (nodes: any) => void;
}) {
  const { selectedNode, addedNodes, setAddedNodes, setSelectedNode } =
    useContext(WorkflowContext);

  const [label, setLabel] = useState("");

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data?.label || selectedNode.data?.name || "");
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const onUpdateLabel = (newLabel: string) => {
    setLabel(newLabel);
    const currentNodes = addedNodes || [];
    const updated = currentNodes.map((n: any) =>
      n.id === selectedNode.id
        ? {
            ...n,
            data: {
              ...n.data,
              label: newLabel,
            },
          }
        : n
    );
    setAddedNodes(updated);
    setSelectedNode({
      ...selectedNode,
      data: {
        ...selectedNode.data,
        label: newLabel,
      },
    });
    onSave(updated);
  };

  const onDeleteNode = (nodeId: string) => {
    const currentNodes = addedNodes || [];
    const filtered = currentNodes.filter((node: any) => node.id !== nodeId);
    setAddedNodes(filtered);
    setSelectedNode(null);
    onSave(filtered);
  };

  return (
    <div className="p-4 sm:p-5 bg-card border border-border rounded-xl w-[320px] shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">Node Settings</h3>
        <button
          onClick={() => setSelectedNode(null)}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="py-4 space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Node Label</Label>
          <Input
            value={label}
            onChange={(e) => onUpdateLabel(e.target.value)}
            placeholder="Enter node label..."
            className="h-8 text-xs"
          />
        </div>

        <div className="pt-2 text-xs text-muted-foreground space-y-1 border-t border-border/50">
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-mono text-foreground">{selectedNode?.type || "default"}</span>
          </div>
          <div className="flex justify-between">
            <span>ID:</span>
            <span className="font-mono text-foreground truncate max-w-[160px]">{selectedNode?.id}</span>
          </div>
        </div>
      </div>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => onDeleteNode(selectedNode.id)}
        className="w-full gap-2 cursor-pointer"
      >
        <Trash2 className="h-4 w-4" />
        Delete Node
      </Button>
    </div>
  );
}
