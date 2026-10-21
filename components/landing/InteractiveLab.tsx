"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Monitor,
  Database,
  Minus,
  Plus,
  Trash2,
  RefreshCw,
  Sliders,
} from "lucide-react";

/* ========================================================
   PRECISE SVG ICONS (MATCHING SCREENSHOT)
   ======================================================== */

// Fork/Scissors Load Balancer icon
function LoadBalancerIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="3.5" cy="4.5" r="1.8" />
      <circle cx="3.5" cy="11.5" r="1.8" />
      <path d="M5.5 4.5 L12 8" />
      <path d="M5.5 11.5 L12 8" />
      <circle cx="12.5" cy="8" r="1.3" fill="currentColor" />
    </svg>
  );
}

// Stacked rack server icon
function ServerRackIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="3" width="12" height="4" rx="1" />
      <rect x="2" y="9" width="12" height="4" rx="1" />
      <circle cx="4.5" cy="5" r="0.6" fill="currentColor" />
      <circle cx="4.5" cy="11" r="0.6" fill="currentColor" />
    </svg>
  );
}

/* ========================================================
   CUSTOM REACT FLOW NODE COMPONENTS (EXACT SCREENSHOT UI)
   ======================================================== */

// 1. Client Node (Top-Left)
function ClientLabNode({ data }: any) {
  return (
    <div className="relative rounded-2xl bg-[#0c0d10] border border-[#23252b] px-3.5 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.85)] min-w-[135px] cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors select-none">
      {/* Title Row */}
      <div className="flex items-center gap-1.5 mb-1">
        <Monitor className="h-3 w-3 text-zinc-300 stroke-[1.8]" />
        <span className="text-[12px] font-semibold text-white tracking-tight">Client</span>
      </div>

      {/* Metric Row */}
      <div className="text-[11px] text-zinc-300 font-sans leading-tight">
        <span className="font-semibold text-white">20k</span> req/s
      </div>
      <div className="text-[9.5px] text-zinc-500 font-sans mt-0.5 leading-tight">
        2 endpoints · 20k/s
      </div>

      {/* Right Output Handle (White capsule pill) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-3.5 !rounded-full !bg-white !border-0 !-right-[4px] !top-1/2 !-translate-y-1/2 shadow-xs cursor-crosshair"
      />
    </div>
  );
}

// 2. Load Balancer Node (Center-Left)
function LbLabNode({ data }: any) {
  return (
    <div className="relative rounded-2xl bg-[#0c0d10] border border-[#23252b] px-3.5 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.85)] min-w-[148px] cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors select-none">
      {/* Left Input Handle (Concentric ring with center dot) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !rounded-full !bg-[#0c0d10] !border-[1.5px] !border-zinc-400 !-left-[6px] !top-1/2 !-translate-y-1/2 flex items-center justify-center cursor-crosshair"
      >
        <div className="w-1 h-1 rounded-full bg-zinc-200 pointer-events-none" />
      </Handle>

      {/* Title Row */}
      <div className="flex items-center gap-1.5 mb-1">
        <LoadBalancerIcon className="h-3 w-3 text-zinc-300" />
        <span className="text-[12px] font-semibold text-white tracking-tight">Load balancer</span>
      </div>

      {/* Metric Row */}
      <div className="text-[10.5px] text-zinc-300 font-sans leading-tight">
        20k / 200k req/s
      </div>

      {/* Slider Progress Bar */}
      <div className="flex items-center gap-2 mt-2">
        <div className="relative flex-1 h-[2.5px] rounded-full bg-zinc-800">
          <div className="h-full bg-zinc-300 rounded-full w-[10%]" />
          {/* Slider thumb dot */}
          <div className="absolute top-1/2 left-[10%] -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
        </div>
        <span className="text-[9.5px] font-sans text-zinc-400">10%</span>
      </div>

      {/* Right Output Handle (White capsule pill) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-3.5 !rounded-full !bg-white !border-0 !-right-[4px] !top-1/2 !-translate-y-1/2 shadow-xs cursor-crosshair"
      />
    </div>
  );
}

// 3. API Server Node (Servers 1, 2, 3)
function ServerLabNode({ data }: any) {
  const isOffline = data?.isOffline;
  const isDeletable = data?.isDeletable;
  const label = data?.label || "API server";
  const traffic = data?.traffic || "6.7k";
  const utilization = data?.utilization || 67;

  return (
    <div
      className={`relative rounded-2xl border px-3.5 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.85)] min-w-[145px] cursor-grab active:cursor-grabbing transition-all duration-300 select-none ${
        isOffline
          ? "bg-red-950/20 border-red-500/40 opacity-60"
          : "bg-[#0c0d10] border-[#23252b] hover:border-white/20"
      }`}
    >
      {/* Left Input Handle (Concentric ring with center dot) */}
      <Handle
        type="target"
        position={Position.Left}
        className={`!w-3 !h-3 !rounded-full !bg-[#0c0d10] !border-[1.5px] !-left-[6px] !top-1/2 !-translate-y-1/2 flex items-center justify-center cursor-crosshair ${
          isOffline ? "!border-red-500" : "!border-zinc-400"
        }`}
      >
        <div className={`w-1 h-1 rounded-full pointer-events-none ${isOffline ? "bg-red-500" : "bg-zinc-200"}`} />
      </Handle>

      {/* Title Row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <ServerRackIcon className={`h-3 w-3 ${isOffline ? "text-red-400" : "text-zinc-300"}`} />
          <span className="text-[12px] font-semibold text-white tracking-tight">{label}</span>
        </div>
        {isDeletable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data?.onToggleDelete?.();
            }}
            className="p-0.5 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors cursor-pointer"
            title={isOffline ? "Restore Server" : "Click to simulate failure"}
          >
            {isOffline ? (
              <RefreshCw className="h-3 w-3 text-emerald-400" />
            ) : (
              <Trash2 className="h-3 w-3 hover:text-red-400" />
            )}
          </button>
        )}
      </div>

      {/* Metric Row */}
      <div className="text-[10.5px] text-zinc-300 font-sans leading-tight">
        {isOffline ? <span className="text-red-400 font-mono font-semibold">OFFLINE</span> : `${traffic} / 10k req/s`}
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-[2.5px] rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOffline
                ? "w-0"
                : utilization > 80
                ? "bg-amber-400 w-[100%]"
                : "bg-zinc-300 w-[67%]"
            }`}
          />
        </div>
        <span className="text-[9.5px] font-sans text-zinc-400">
          {isOffline ? "0%" : `${utilization}%`}
        </span>
      </div>

      {/* Right Output Handle (White capsule pill) */}
      <Handle
        type="source"
        position={Position.Right}
        className={`!w-2 !h-3.5 !rounded-full !border-0 !-right-[4px] !top-1/2 !-translate-y-1/2 shadow-xs cursor-crosshair ${
          isOffline ? "!bg-red-500" : "!bg-white"
        }`}
      />

      {/* Handwritten "Try deleting me" doodle arrow pointing right at Server 3 corner */}
      {isDeletable && !isOffline && (
        <div className="absolute left-[88%] top-[68%] pointer-events-none select-none z-30">
          <svg width="70" height="42" viewBox="0 0 70 42" fill="none" className="overflow-visible">
            {/* Smooth curving arc */}
            <path
              d="M 58 38 C 32 38, 14 28, 2 5"
              stroke="#e4e4e7"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arrow head */}
            <path
              d="M 7 9 L 2 5 L 1 11"
              stroke="#e4e4e7"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <div
            className="text-[12.5px] text-zinc-200 whitespace-nowrap ml-7 -mt-2 font-medium tracking-wide"
            style={{ fontFamily: "'Caveat', cursive, 'Brush Script MT', cursive, sans-serif" }}
          >
            Try deleting me
          </div>
        </div>
      )}
    </div>
  );
}

// 4. Postgres Node (Far-Right)
function DbLabNode({ data }: any) {
  return (
    <div className="relative rounded-2xl bg-[#0c0d10] border border-[#23252b] px-3.5 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.85)] min-w-[145px] cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors select-none">
      {/* Left Input Handle (Concentric ring with center dot) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !rounded-full !bg-[#0c0d10] !border-[1.5px] !border-zinc-400 !-left-[6px] !top-1/2 !-translate-y-1/2 flex items-center justify-center cursor-crosshair"
      >
        <div className="w-1 h-1 rounded-full bg-zinc-200 pointer-events-none" />
      </Handle>

      {/* Title Row */}
      <div className="flex items-center gap-1.5 mb-1">
        <Database className="h-3 w-3 text-zinc-300 stroke-[1.8]" />
        <span className="text-[12px] font-semibold text-white tracking-tight">Postgres</span>
      </div>

      {/* Metric Row with amber write rate */}
      <div className="text-[10.5px] text-zinc-300 font-sans leading-tight">
        20k r · <span className="text-[#f59e0b] font-medium">202 w/s</span>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-[2.5px] rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full bg-zinc-300 rounded-full w-[52%]" />
        </div>
        <span className="text-[9.5px] font-sans text-zinc-400">52%</span>
      </div>
    </div>
  );
}

/* ========================================================
   FLOATING CANVAS DOCK TOOLBAR
   ======================================================== */
function FloatingCanvasToolbar({ onReset }: { onReset: () => void }) {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const [currentZoom, setCurrentZoom] = useState(100);

  useEffect(() => {
    const updateZoom = () => {
      try {
        const z = getZoom();
        setCurrentZoom(Math.round(z * 100));
      } catch (err) {
        // ignore
      }
    };
    const interval = setInterval(updateZoom, 300);
    return () => clearInterval(interval);
  }, [getZoom]);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0c0d10]/95 border border-[#23252b] shadow-2xl backdrop-blur-md text-xs font-medium text-zinc-300">
        {/* Zoom Out */}
        <button
          onClick={() => zoomOut({ duration: 200 })}
          className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Zoom out"
        >
          <Minus className="h-3 w-3" />
        </button>

        {/* Zoom Percent */}
        <span className="font-mono text-[11px] w-9 text-center text-zinc-300 font-semibold select-none">
          {currentZoom}%
        </span>

        {/* Zoom In */}
        <button
          onClick={() => zoomIn({ duration: 200 })}
          className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Zoom in"
        >
          <Plus className="h-3 w-3" />
        </button>

        <div className="h-3.5 w-px bg-white/10 mx-0.5" />

        {/* Fit View */}
        <button
          onClick={() => fitView({ padding: 0.12, duration: 300 })}
          className="px-2 py-0.5 rounded hover:bg-white/10 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer font-sans"
        >
          Fit
        </button>

        <div className="h-3.5 w-px bg-white/10 mx-0.5" />

        {/* Auto layout / Reset */}
        <button
          onClick={() => {
            onReset();
            fitView({ padding: 0.12, duration: 300 });
          }}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/10 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer font-sans"
        >
          <Sliders className="h-3 w-3" />
          <span>Auto layout</span>
        </button>
      </div>
    </div>
  );
}

/* ========================================================
   MAIN COMPONENT
   ======================================================== */
export default function InteractiveLab() {
  const [server3Active, setServer3Active] = useState(true);

  // Toggle server 3 state
  const handleToggleServer3 = useCallback(() => {
    setServer3Active((prev) => !prev);
  }, []);

  // Register React Flow custom node types
  const nodeTypes = useMemo(
    () => ({
      clientLab: ClientLabNode,
      lbLab: LbLabNode,
      serverLab: ServerLabNode,
      dbLab: DbLabNode,
    }),
    []
  );

  // Dynamic traffic calculations
  const trafficText = server3Active ? "6.7k" : "10k";
  const trafficRate = server3Active ? "6.7k/s" : "10k/s";
  const utilizationVal = server3Active ? 67 : 100;

  // React Flow Nodes (Positions matching exact screenshot layout)
  const initialNodes: Node[] = useMemo(
    () => [
      {
        id: "client-1",
        type: "clientLab",
        position: { x: 70, y: 90 },
        data: {},
      },
      {
        id: "lb-1",
        type: "lbLab",
        position: { x: 270, y: 155 },
        data: {},
      },
      {
        id: "server-1",
        type: "serverLab",
        position: { x: 480, y: 35 },
        data: {
          label: "API server 1",
          traffic: trafficText,
          utilization: utilizationVal,
          isDeletable: false,
          isOffline: false,
        },
      },
      {
        id: "server-2",
        type: "serverLab",
        position: { x: 480, y: 155 },
        data: {
          label: "API server 2",
          traffic: trafficText,
          utilization: utilizationVal,
          isDeletable: false,
          isOffline: false,
        },
      },
      {
        id: "server-3",
        type: "serverLab",
        position: { x: 480, y: 275 },
        data: {
          label: "API server 3",
          traffic: trafficText,
          utilization: utilizationVal,
          isDeletable: true,
          isOffline: !server3Active,
          onToggleDelete: handleToggleServer3,
        },
      },
      {
        id: "db-1",
        type: "dbLab",
        position: { x: 720, y: 155 },
        data: {},
      },
    ],
    [server3Active, trafficText, utilizationVal, handleToggleServer3]
  );

  // React Flow Edges (Dashed curves matching screenshot)
  const initialEdges: Edge[] = useMemo(() => {
    const edgeStyle = { stroke: "rgba(255, 255, 255, 0.4)", strokeWidth: 1.5, strokeDasharray: "4 4" };
    const labelStyle = { fill: "#f4f4f5", fontSize: 10, fontFamily: "sans-serif" };
    const labelBgStyle = { fill: "#0c0d10", stroke: "rgba(255,255,255,0.2)", borderRadius: 10 };
    const labelBgPadding = [6, 2.5] as [number, number];

    const edgesList: Edge[] = [
      // Client -> Load Balancer (Curves down)
      {
        id: "e-client-lb",
        source: "client-1",
        target: "lb-1",
        animated: true,
        style: edgeStyle,
        label: "20k/s",
        labelStyle,
        labelBgStyle,
        labelBgPadding,
      },
      // LB -> Server 1 (Curves up)
      {
        id: "e-lb-s1",
        source: "lb-1",
        target: "server-1",
        animated: true,
        style: edgeStyle,
        label: trafficRate,
        labelStyle,
        labelBgStyle,
        labelBgPadding,
      },
      // LB -> Server 2 (Straight)
      {
        id: "e-lb-s2",
        source: "lb-1",
        target: "server-2",
        animated: true,
        style: edgeStyle,
        label: trafficRate,
        labelStyle,
        labelBgStyle,
        labelBgPadding,
      },
      // Server 1 -> DB (Curves down)
      {
        id: "e-s1-db",
        source: "server-1",
        target: "db-1",
        animated: true,
        style: edgeStyle,
        label: trafficRate,
        labelStyle,
        labelBgStyle,
        labelBgPadding,
      },
      // Server 2 -> DB (Straight)
      {
        id: "e-s2-db",
        source: "server-2",
        target: "db-1",
        animated: true,
        style: edgeStyle,
        label: trafficRate,
        labelStyle,
        labelBgStyle,
        labelBgPadding,
      },
    ];

    if (server3Active) {
      edgesList.push(
        // LB -> Server 3 (Curves down)
        {
          id: "e-lb-s3",
          source: "lb-1",
          target: "server-3",
          animated: true,
          style: edgeStyle,
          label: trafficRate,
          labelStyle,
          labelBgStyle,
          labelBgPadding,
        },
        // Server 3 -> DB (Curves up)
        {
          id: "e-s3-db",
          source: "server-3",
          target: "db-1",
          animated: true,
          style: edgeStyle,
          label: trafficRate,
          labelStyle,
          labelBgStyle,
          labelBgPadding,
        }
      );
    } else {
      // Red dashed disconnected lines when offline
      edgesList.push(
        {
          id: "e-lb-s3",
          source: "lb-1",
          target: "server-3",
          animated: false,
          style: { stroke: "rgba(239, 68, 68, 0.4)", strokeWidth: 1.5, strokeDasharray: "4 4" },
          label: "0/s",
          labelStyle: { fill: "#f87171", fontSize: 10, fontFamily: "sans-serif" },
          labelBgStyle: { fill: "#271214", stroke: "rgba(239,68,68,0.3)", borderRadius: 10 },
          labelBgPadding,
        },
        {
          id: "e-s3-db",
          source: "server-3",
          target: "db-1",
          animated: false,
          style: { stroke: "rgba(239, 68, 68, 0.4)", strokeWidth: 1.5, strokeDasharray: "4 4" },
          label: "0/s",
          labelStyle: { fill: "#f87171", fontSize: 10, fontFamily: "sans-serif" },
          labelBgStyle: { fill: "#271214", stroke: "rgba(239,68,68,0.3)", borderRadius: 10 },
          labelBgPadding,
        }
      );
    }

    return edgesList;
  }, [server3Active, trafficRate]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state changes with nodes and edges
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Reset to initial layout & restore server 3
  const handleReset = useCallback(() => {
    setServer3Active(true);
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  return (
    <section className="relative py-14 px-4 md:px-8 bg-black overflow-hidden border-t border-white/10">
      <div className="container mx-auto max-w-6xl">
        {/* Section Headline matching screenshot */}
        <div className="text-center space-y-2.5 mb-10">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Practice systems <br className="hidden sm:inline" />
            using interactive labs
          </h2>
        </div>

        {/* Nodes Area with central square grid spotlight floating on pure black */}
        <div className="relative w-full h-[480px] md:h-[520px] bg-black">
          {/* Subtle square grid pattern with radial spotlight fade matching uploaded image */}
          <div 
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: "80px 80px",
              maskImage: "radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 80%)",
              WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 80%)",
            }}
          />

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            minZoom={0.4}
            maxZoom={1.4}
            nodesDraggable={true}
            elementsSelectable={true}
            panOnDrag={true}
            zoomOnScroll={false}
            proOptions={{ hideAttribution: true }}
            className="bg-transparent relative z-10"
          >
            {/* Floating toolbar inside ReactFlow */}
            <FloatingCanvasToolbar onReset={handleReset} />
          </ReactFlow>
        </div>
      </div>
    </section>
  );
}
