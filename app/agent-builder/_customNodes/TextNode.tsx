"use client";
import React, { useContext, useState, useEffect, useCallback, useRef } from "react";
import { NodeResizer, NodeProps } from "@xyflow/react";
import { WorkflowContext } from "@/context/WorkflowContext";

export default function TextNode({ id, data, selected }: NodeProps) {
  const { setAddedNodes } = useContext(WorkflowContext);

  const initialText = (data?.text as string) || (data?.label as string) || "";
  const [text, setText] = useState<string>(initialText);
  const [isEditing, setIsEditing] = useState<boolean>(!initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync external updates (e.g. from inspector or backend)
  useEffect(() => {
    if (data?.text !== undefined && data.text !== text) {
      setText(data.text as string);
    }
  }, [data?.text]);

  const updateTextInWorkflow = (newVal: string) => {
    setAddedNodes((nodes: any[]) =>
      (nodes || []).map((n) =>
        n.id === id
          ? {
              ...n,
              data: {
                ...n.data,
                text: newVal,
                label: newVal.trim() ? newVal.slice(0, 30) : "Text",
              },
            }
          : n
      )
    );
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    updateTextInWorkflow(val);
  };

  const handleResizeEnd = useCallback(
    (_: any, params: { width: number; height: number }) => {
      setAddedNodes((nodes: any[]) =>
        (nodes || []).map((n) =>
          n.id === id
            ? {
                ...n,
                style: {
                  ...(n.style || {}),
                  width: Math.round(params.width),
                  height: Math.round(params.height),
                },
              }
            : n
        )
      );
    },
    [id, setAddedNodes]
  );

  const fontSizeClass =
    data?.fontSize === "sm"
      ? "text-xs"
      : data?.fontSize === "lg"
      ? "text-xl font-semibold"
      : data?.fontSize === "xl"
      ? "text-2xl font-bold"
      : data?.fontSize === "2xl"
      ? "text-3xl font-extrabold"
      : "text-base font-normal";

  return (
    <div
      className="relative w-full h-full min-w-[60px] min-h-[28px] bg-transparent border-none outline-none shadow-none"
    >
      {/* Dynamic Resizer - completely borderless and dot-free */}
      <NodeResizer
        isVisible={Boolean(selected)}
        minWidth={60}
        minHeight={28}
        handleStyle={{ display: "none" }}
        handleClassName="hidden"
        lineClassName="border-transparent"
        onResizeEnd={handleResizeEnd}
      />

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={text}
          autoFocus
          onChange={handleTextChange}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsEditing(false);
            }
          }}
          placeholder="Type text here..."
          className={`w-full h-full p-1 bg-transparent border-none resize-none focus:outline-none text-foreground leading-relaxed placeholder:text-muted-foreground/40 nodrag nopan nowheel ${fontSizeClass}`}
        />
      ) : (
        <div
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className={`w-full h-full p-1 whitespace-pre-wrap break-words cursor-grab active:cursor-grabbing select-none text-foreground leading-relaxed ${fontSizeClass}`}
          title="Double-click to edit, drag to move"
        >
          {text.trim() ? (
            text
          ) : (
            <span className="text-muted-foreground/40 italic text-xs">
              Double-click to write text...
            </span>
          )}
        </div>
      )}
    </div>
  );
}
