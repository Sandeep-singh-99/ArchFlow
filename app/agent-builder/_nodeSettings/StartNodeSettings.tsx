"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Play, Trash2, X, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  selectedNode: any;
  updateFormData: (formData: any) => void;
  onDeleteNode?: (nodeId: string) => void;
  onClose?: () => void;
}

export default function StartNodeSettings({
  selectedNode,
  updateFormData,
  onDeleteNode,
  onClose,
}: Props) {
  const [name, setName] = useState("Start");

  useEffect(() => {
    if (selectedNode) {
      const settings = selectedNode.data?.settings || {};
      setName(
        selectedNode.data?.label ||
        selectedNode.data?.name ||
        settings.name ||
        "Start"
      );
    }
  }, [selectedNode]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateFormData({
      name,
      label: name,
      type: "StartNode",
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center">
            <Play className="h-3.5 w-3.5 fill-emerald-500/20 stroke-[2.5]" />
          </div>
          <h3 className="text-xs font-bold text-foreground">Start Node Controls</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 uppercase"
          >
            Start
          </Badge>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground h-5 w-5 flex items-center justify-center rounded hover:bg-muted cursor-pointer transition-colors"
              title="Close specifications"
              aria-label="Close specifications"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Component Label */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Node Label</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Start"
          className="h-8 text-xs font-medium"
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/60">
        {onDeleteNode && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDeleteNode(selectedNode?.id)}
            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          className="h-8 ml-auto text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-xs cursor-pointer"
        >
          <Save className="h-3.5 w-3.5 mr-1 text-white" />
          Apply Changes
        </Button>
      </div>
    </form>
  );
}
