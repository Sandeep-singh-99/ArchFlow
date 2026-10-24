"use client";
import React, { useContext, useRef } from "react";
import {
  getBezierPath,
  EdgeLabelRenderer,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { WorkflowContext } from "@/context/WorkflowContext";
import { toast } from "sonner";

export default function AnimatedGreenEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { setNodeEdges } = useContext(WorkflowContext);
  const { setEdges } = useReactFlow();
  const lastClickRef = useRef<number>(0);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setNodeEdges((eds: any) => (eds || []).filter((edge: any) => edge.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
    toast.info("Connection disconnected");
  };

  const handlePointerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (e.detail >= 2 || now - lastClickRef.current < 450) {
      handleDelete(e);
      lastClickRef.current = 0;
      return;
    }
    lastClickRef.current = now;
  };

  return (
    <>
      {/* Invisible thick 36px interaction path for guaranteed click & double-click capture */}
      <path
        d={edgePath}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.001}
        strokeWidth={36}
        className="cursor-pointer"
        style={{ pointerEvents: "stroke" }}
        onDoubleClick={handleDelete}
        onClick={handlePointerClick}
      />

      {/* Visible emerald green animated dot connection path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        className="react-flow__edge-path cursor-pointer"
        style={{
          stroke: selected ? "#34d399" : "#10b981",
          strokeWidth: selected ? 2.8 : 2,
          strokeDasharray: "4 6",
          strokeLinecap: "round",
          animation: "flowDashGreen 0.75s linear infinite",
          pointerEvents: "stroke",
          filter: selected
            ? "drop-shadow(0 0 6px rgba(52, 211, 153, 0.8))"
            : "drop-shadow(0 0 3px rgba(16, 185, 129, 0.45))",
          ...style,
        }}
        markerEnd={markerEnd}
        onDoubleClick={handleDelete}
        onClick={handlePointerClick}
      />

      {/* Centered connection label with single transparent glass badge & white border */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              background: "transparent",
              border: "none",
              padding: 0,
              margin: 0,
            }}
            className="nodrag nopan select-none"
            onDoubleClick={handleDelete}
            onClick={handlePointerClick}
          >
            <div className="edge-label-badge">
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
