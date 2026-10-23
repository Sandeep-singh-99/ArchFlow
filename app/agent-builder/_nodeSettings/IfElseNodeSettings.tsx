"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GitFork, Trash2, X, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  selectedNode: any;
  updateFormData: (formData: any) => void;
  onDeleteNode?: (nodeId: string) => void;
  onClose?: () => void;
}

const CONDITION_PRESETS = [
  "isAuthenticated === true",
  "status === 200",
  "role === 'admin'",
  "has_error === false",
  "data !== null",
  "token.isValid",
];

export default function IfElseNodeSettings({
  selectedNode,
  updateFormData,
  onDeleteNode,
  onClose,
}: Props) {
  const [formData, setFormData] = useState({
    name: "Condition Check",
    condition: "is_valid === true",
    trueLabel: "True",
    falseLabel: "False",
  });

  useEffect(() => {
    if (selectedNode) {
      const settings = selectedNode.data?.settings || {};
      setFormData({
        name:
          selectedNode.data?.label ||
          selectedNode.data?.name ||
          settings.name ||
          "Condition Check",
        condition:
          selectedNode.data?.condition ||
          settings.condition ||
          "is_valid === true",
        trueLabel:
          selectedNode.data?.trueLabel ||
          settings.trueLabel ||
          "True",
        falseLabel:
          selectedNode.data?.falseLabel ||
          settings.falseLabel ||
          "False",
      });
    }
  }, [selectedNode]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateFormData({
      ...formData,
      label: formData.name,
      type: "IfElseNode",
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center">
            <GitFork className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-xs font-bold text-foreground">If / Else Decision</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="text-[10px] font-mono text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 uppercase"
          >
            Router
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

      {/* Decision Label */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Decision Title</label>
        <Input
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="e.g. Is Authenticated?, Validate Token"
          className="h-8 text-xs font-medium"
        />
      </div>

      {/* Condition Expression */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Condition Expression</label>
        <Input
          value={formData.condition}
          onChange={(e) => handleChange("condition", e.target.value)}
          placeholder="e.g. isAuthenticated === true"
          className="h-8 text-xs font-mono"
        />

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1 pt-1">
          {CONDITION_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleChange("condition", preset)}
              className={`text-[9.5px] px-2 py-0.5 rounded border font-mono transition-colors cursor-pointer ${
                formData.condition === preset
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 font-semibold"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Branch Labels (True / False) */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            True (Right ➔)
          </label>
          <Input
            value={formData.trueLabel}
            onChange={(e) => handleChange("trueLabel", e.target.value)}
            placeholder="True"
            className="h-7 text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            False (Down ↓)
          </label>
          <Input
            value={formData.falseLabel}
            onChange={(e) => handleChange("falseLabel", e.target.value)}
            placeholder="False"
            className="h-7 text-xs"
          />
        </div>
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
          className="h-8 ml-auto text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white border-none shadow-xs cursor-pointer"
        >
          <Save className="h-3.5 w-3.5 mr-1 text-white" />
          Apply Changes
        </Button>
      </div>
    </form>
  );
}
