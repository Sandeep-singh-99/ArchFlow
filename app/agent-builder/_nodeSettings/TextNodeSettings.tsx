"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, X, Type } from "lucide-react";

interface Props {
  selectedNode: any;
  onUpdate: (formData: any) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
}

const FONT_SIZES = [
  { id: "sm", label: "Small", sub: "12px" },
  { id: "base", label: "Normal", sub: "16px" },
  { id: "lg", label: "Large", sub: "20px" },
  { id: "xl", label: "Title", sub: "24px" },
  { id: "2xl", label: "Huge", sub: "30px" },
];

export default function TextNodeSettings({
  selectedNode,
  onUpdate,
  onDeleteNode,
  onClose,
}: Props) {
  const [text, setText] = useState(
    selectedNode?.data?.text || selectedNode?.data?.label || ""
  );
  const [fontSize, setFontSize] = useState(
    selectedNode?.data?.fontSize || "base"
  );

  useEffect(() => {
    setText(selectedNode?.data?.text || selectedNode?.data?.label || "");
    setFontSize(selectedNode?.data?.fontSize || "base");
  }, [selectedNode]);

  const handleFontSizeSelect = (sizeId: string) => {
    setFontSize(sizeId);
    onUpdate({
      text,
      name: text.trim() ? text.slice(0, 30) : "Text",
      label: text.trim() ? text.slice(0, 30) : "Text",
      fontSize: sizeId,
      type: "TextNode",
    });
  };

  const handleSave = () => {
    onUpdate({
      text,
      name: text.trim() ? text.slice(0, 30) : "Text",
      label: text.trim() ? text.slice(0, 30) : "Text",
      fontSize,
      type: "TextNode",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Type className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Canvas Text</h3>
            <p className="text-[11px] text-muted-foreground">
              Transparent text annotation
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Text Content */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Text</label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your text here..."
          className="text-xs bg-background min-h-[140px] leading-relaxed resize-y"
        />
        <div className="text-[10px] text-muted-foreground text-right">
          {text.length} characters
        </div>
      </div>

      {/* Font Size Preset */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Font Size</label>
        <div className="grid grid-cols-5 gap-1 pt-1">
          {FONT_SIZES.map((f) => (
            <button
              key={f.id}
              onClick={() => handleFontSizeSelect(f.id)}
              className={`py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                fontSize === f.id
                  ? "border-primary bg-primary/15 text-primary font-bold shadow-xs"
                  : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <div className="text-xs font-semibold leading-tight">{f.label}</div>
              <div className="text-[9px] opacity-60 leading-tight">{f.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDeleteNode(selectedNode.id)}
          className="h-8 gap-1.5 text-xs cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </Button>

        <Button
          size="sm"
          onClick={handleSave}
          className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <span>Apply Changes</span>
        </Button>
      </div>
    </div>
  );
}
