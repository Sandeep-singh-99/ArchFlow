"use client";

import React, { memo, useState, useEffect, useRef, useContext } from "react";
import { WorkflowContext } from "@/context/WorkflowContext";

export interface TextNodeData {
  label?: string;
  text?: string;
  fontSize?: "sm" | "base" | "lg" | "xl" | "2xl";
  color?: "default" | "muted" | "blue" | "emerald" | "amber" | "purple" | "rose";
  isBold?: boolean;
  isItalic?: boolean;
  textAlign?: "left" | "center" | "right";
  hasBackground?: boolean;
}

function TextNode({ id, data, selected }: { id: string; data: TextNodeData; selected?: boolean }) {
  const { setAddedNodes } = useContext(WorkflowContext) || {};
  const initialText = data?.text || data?.label || "Text note";
  const [text, setText] = useState<string>(initialText);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (data?.text !== undefined && data.text !== text) {
      setText(data.text);
    } else if (data?.label !== undefined && !data?.text && data.label !== text) {
      setText(data.label);
    }
  }, [data?.text, data?.label]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const commitText = (newVal: string) => {
    const trimmed = newVal.trim();
    const finalVal = trimmed.length > 0 ? newVal : "Text note";
    setText(finalVal);
    if (setAddedNodes) {
      setAddedNodes((nodes: any[]) =>
        (nodes || []).map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...n.data,
                  text: finalVal,
                  label: finalVal.slice(0, 30),
                },
              }
            : n
        )
      );
    }
  };

  const sizeMap: Record<string, { className: string; style: React.CSSProperties }> = {
    sm: {
      className: "text-[14px] font-normal",
      style: { fontSize: "14px", lineHeight: "1.4" },
    },
    base: {
      className: "text-[20px] font-medium",
      style: { fontSize: "20px", lineHeight: "1.3" },
    },
    lg: {
      className: "text-[30px] font-bold tracking-tight",
      style: { fontSize: "30px", lineHeight: "1.2" },
    },
    xl: {
      className: "text-[42px] font-extrabold tracking-tight",
      style: { fontSize: "42px", lineHeight: "1.15" },
    },
    "2xl": {
      className: "text-[56px] font-black tracking-tight",
      style: { fontSize: "56px", lineHeight: "1.1" },
    },
  };

  const currentSize = sizeMap[data?.fontSize || "base"] || sizeMap.base;

  const colorClass = {
    default: "text-foreground",
    muted: "text-muted-foreground",
    blue: "text-blue-500 dark:text-blue-400",
    emerald: "text-emerald-500 dark:text-emerald-400",
    amber: "text-amber-500 dark:text-amber-400",
    purple: "text-purple-500 dark:text-purple-400",
    rose: "text-rose-500 dark:text-rose-400",
  }[data?.color || "default"];

  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[data?.textAlign || "left"];

  return (
    <div
      className={`group relative min-w-[80px] max-w-[950px] w-fit transition-all ${
        data?.hasBackground
          ? "p-3.5 rounded-xl border bg-card/90 backdrop-blur-md shadow-md border-border/80"
          : "p-1.5 rounded-lg"
      } ${
        selected || isEditing
          ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
          : "hover:ring-1 hover:ring-border/60"
      }`}
    >
      {isEditing ? (
        <div className="grid">
          {/* Invisible mirror element to maintain full text dimensions and prevent layout collapse */}
          <div
            style={currentSize.style}
            className={`invisible col-start-1 row-start-1 whitespace-pre-wrap break-words select-none pointer-events-none p-0 m-0 ${currentSize.className} ${alignClass} ${
              data?.isBold ? "font-bold" : ""
            } ${data?.isItalic ? "italic" : ""}`}
            aria-hidden="true"
          >
            {text ? `${text}\n` : "Type text..."}
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => {
              setIsEditing(false);
              commitText(text);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsEditing(false);
                commitText(text);
              }
            }}
            style={currentSize.style}
            className={`col-start-1 row-start-1 w-full h-full bg-transparent border-0 outline-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-0 p-0 m-0 resize-none overflow-hidden nodrag nopan nowheel ${currentSize.className} ${colorClass} ${alignClass} ${
              data?.isBold ? "font-bold" : ""
            } ${data?.isItalic ? "italic" : ""}`}
          />
        </div>
      ) : (
        <div
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          style={currentSize.style}
          className={`whitespace-pre-wrap break-words cursor-text select-none transition-all p-0 m-0 ${currentSize.className} ${colorClass} ${alignClass} ${
            data?.isBold ? "font-bold" : ""
          } ${data?.isItalic ? "italic" : ""}`}
          title="Double-click to edit inline, or use the Settings Panel"
        >
          {text}
        </div>
      )}
    </div>
  );
}

export default memo(TextNode);
