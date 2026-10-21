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
import { Badge } from "@/components/ui/badge";

/* ========================================================
   SVG ICONS TO MATCH SCREENSHOT ACCURATELY
   ======================================================== */

// Branching/Scissors style load balancer icon
function LoadBalancerIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4" cy="4" r="2" />
      <circle cx="4" cy="12" r="2" />
      <path d="M6 4 L12 8" />
      <path d="M6 12 L12 8" />
      <circle cx="12" cy="8" r="1.5" fill="currentColor" />
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
   CUSTOM REACT FLOW NODE COMPONENTS (EXACT MATCH)
   ======================================================== */

// 1. Client Node
function ClientLabNode({ data }: any) {
  return (
    <div className="relative rounded-xl bg-[#0c0d10] border border-[#23252b] px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.8)] min-w-[155px] cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        <Monitor className="h-3.5 w-3.5 text-zinc-300 stroke-[1.8]" />
        <span className="text-[12.5px] font-semibold text-white tracking-wide">Client</span>
      </div>
      <div className="text-[11px] text-zinc-300 font-sans">
        <span className="font-bold text-white">20k</span> req/s
      </div>
      <div className="text-[10px] text-zinc-500 font-sans mt-0.5">2 endpoints · 20k/s</div>

      {/* Right Output Handle (Vertical Pill shape like image) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-4 !rounded-full !bg-white !border-0 !-right-[4px] !top-1/2 !-translate-y-1/2 shadow-xs"
      />
    </div>
  );
}

// 2. Load Balancer Node
function LbLabNode({ data }: any) {
  return (
    <div className="relative rounded-xl bg-[#0c0d10] border border-[#23252b] px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.8)] min-w-[170px] cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors">
      {/* Left Input Handle (Concentric ring with center dot like image) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !rounded-full !bg-[#0c0d10] !border-[1.5px] !border-zinc-400 !-left-[7px] !top-1/2 !-translate-y-1/2 flex items-center justify-center pointer-events-none"
      >
        <div className="w-1 h-1 rounded-full bg-zinc-300 pointer-events-none" />
      </Handle>

      <div className="flex items-center gap-2 mb-1.5">
        <LoadBalancerIcon className="h-3.5 w-3.5 text-zinc-300" />
        <span className="text-[12.5px] font-semibold text-white tracking-wide">Load balancer</span>
      </div>
      <div className="text-[11px] text-zinc-300 font-sans">20k / 200k req/s</div>

      {/* Slider style progress bar with thumb */}
      <div className="flex items-center gap-2.5 mt-2">
        <div className="relative flex-1 h-[3px] rounded-full bg-zinc-800">
          <div className="h-full bg-zinc-300 rounded-full w-[10%]" />
          {/* Slider knob */}
          <div className="absolute top-1/2 left-[10%] -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-xs" />
        </div>
        <span className="text-[10px] font-sans text-zinc-400">10%</span>
      </div>

      {/* Right Output Handle (Vertical Pill shape like image) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-4 !rounded-full !bg-white !border-0 !-right-[4px] !top-1/2 !-translate-y-1/2 shadow-xs"
      />
    </div>
  );
}

// 3. API Server Node (with interactive delete button & "Try deleting me" doodle arrow)
function ServerLabNode({ data }: any) {
  const isOffline = data?.isOffline;
  const isDeletable = data?.isDeletable;
  const label = data?.label || "API server";
  const traffic = data?.traffic || "6.7k";
  const utilization = data?.utilization || 67;

  return (
    <div
      className={`relative rounded-xl border px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.8)] min-w-[170px] cursor-grab active:cursor-grabbing transition-all duration-300 ${
        isOffline
          ? "bg-red-950/20 border-red-500/40 opacity-60"
          : "bg-[#0c0d10] border-[#23252b] hover:border-white/20"
      }`}
    >
      {/* Left Input Handle (Concentric ring with center dot like image) */}
      <Handle
        type="target"
        position={Position.Left}
        className={`!w-3.5 !h-3.5 !rounded-full !bg-[#0c0d10] !border-[1.5px] !-left-[7px] !top-1/2 !-translate-y-1/2 flex items-center justify-center pointer-events-none ${
          isOffline ? "!border-red-500" : "!border-zinc-400"
        }`}
      >
        <div className={`w-1 h-1 rounded-full pointer-events-none ${isOffline ? "bg-red-500" : "bg-zinc-300"}`} />
      </Handle>

      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <ServerRackIcon className={`h-3.5 w-3.5 ${isOffline ? "text-red-400" : "text-zinc-300"}`} />
          <span className="text-[12.5px] font-semibold text-white tracking-wide">{label}</span>
        </div>
        {isDeletable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data?.onToggleDelete?.();
            }}
            className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors cursor-pointer"
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

      <div className="text-[11px] text-zinc-300 font-sans">
        {isOffline ? <span className="text-red-400 font-mono font-semibold">OFFLINE</span> : `${traffic} / 10k req/s`}
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2.5 mt-2">
        <div className="flex-1 h-[3px] rounded-full bg-zinc-800 overflow-hidden">
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
        <span className="text-[10px] font-sans text-zinc-400">
          {isOffline ? "0%" : `${utilization}%`}
        </span>
      </div>

      {/* Right Output Handle (Vertical Pill shape like image) */}
      <Handle
        type="source"
        position={Position.Right}
        className={`!w-2 !h-4 !rounded-full !border-0 !-right-[4px] !top-1/2 !-translate-y-1/2 shadow-xs ${
          isOffline ? "!bg-red-500" : "!bg-white"
        }`}
      />

      {/* Hand-drawn "Try deleting me" doodle arrow pointing to Server 3 */}
      {isDeletable && !isOffline && (
        <div className="absolute left-[92%] top-[72%] pointer-events-none select-none z-30">
          <svg width="80" height="48" viewBox="0 0 80 48" fill="none" className="overflow-visible">
            {/* Curved arrow arc pointing directly to server bottom right */}
            <path
              d="M 65 42 C 38 42, 16 32, 2 6"
              stroke="#e4e4e7"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arrowhead */}
            <path
              d="M 8 10 L 2 6 L 1 12"
              stroke="#e4e4e7"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <div
            className="text-[13px] text-zinc-200 whitespace-nowrap ml-8 -mt-2 font-medium tracking-wide"
            style={{ fontFamily: "'Caveat', cursive, 'Brush Script MT', cursive, sans-serif" }}
          >
            Try deleting me
          </div>
        </div>
      )}
    </div>
  );
}

// 4. Postgres Database Node
function DbLabNode({ data }: any) {
  return (
    <div className="relative rounded-xl bg-[#0c0d10] border border-[#23252b] px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.8)] min-w-[160px] cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors">
      {/* Left Input Handle (Concentric ring with center dot like image) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !rounded-full !bg-[#0c0d10] !border-[1.5px] !border-zinc-400 !-left-[7px] !top-1/2 !-translate-y-1/2 flex items-center justify-center pointer-events-none"
      >
        <div className="w-1 h-1 rounded-full bg-zinc-300 pointer-events-none" />
      </Handle>

      <div className="flex items-center gap-2 mb-1.5">
        <Database className="h-3.5 w-3.5 text-zinc-300 stroke-[1.8]" />
        <span className="text-[12.5px] font-semibold text-white tracking-wide">Postgres</span>
      </div>
      <div className="text-[11px] text-zinc-300 font-sans">
        20k r · <span className="text-[#f59e0b] font-medium">202 w/s</span>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2.5 mt-2">
        <div className="flex-1 h-[3px] rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full bg-zinc-300 rounded-full w-[52%]" />
        </div>
        <span className="text-[10px] font-sans text-zinc-400">52%</span>
      </div>
    </div>
  );
}

/* ========================================================
   FLOATING CANVAS TOOLBAR (EXACT MATCH TO BOTTOM DOCK)
   ======================================================== */
function FloatingCanvasToolbar({ onReset }: { onReset: () => void }) {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const [currentZoom, setCurrentZoom] = useState(79);

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
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0c0d10]/95 border border-[#23252b] shadow-2xl backdrop-blur-md text-xs font-medium text-zinc-300">
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
          onClick={() => fitView({ padding: 0.15, duration: 300 })}
          className="px-2 py-0.5 rounded hover:bg-white/10 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer font-sans"
        >
          Fit
        </button>

        <div className="h-3.5 w-px bg-white/10 mx-0.5" />

        {/* Auto layout / Reset */}
        <button
          onClick={() => {
            onReset();
            fitView({ padding: 0.15, duration: 300 });
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

  // React Flow Nodes
  const initialNodes: Node[] = useMemo(
    () => [
      {
        id: "client-1",
        type: "clientLab",
        position: { x: 30, y: 160 },
        data: {},
      },
      {
        id: "lb-1",
        type: "lbLab",
        position: { x: 260, y: 195 },
        data: {},
      },
      {
        id: "server-1",
        type: "serverLab",
        position: { x: 520, y: 65 },
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
        position: { x: 520, y: 195 },
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
        position: { x: 520, y: 325 },
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
        position: { x: 840, y: 195 },
        data: {},
      },
    ],
    [server3Active, trafficText, utilizationVal, handleToggleServer3]
  );

  // React Flow Edges (Dashed curves matching screenshot)
  const initialEdges: Edge[] = useMemo(() => {
    const edgeStyle = { stroke: "rgba(255, 255, 255, 0.35)", strokeWidth: 1.6, strokeDasharray: "4 4" };
    const labelStyle = { fill: "#f4f4f5", fontSize: 10, fontFamily: "sans-serif" };
    const labelBgStyle = { fill: "#111215", stroke: "rgba(255,255,255,0.18)", borderRadius: 10 };
    const labelBgPadding = [6, 3] as [number, number];

    const edgesList: Edge[] = [
      // Client -> Load Balancer
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
      // LB -> Server 1
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
      // LB -> Server 2
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
      // Server 1 -> DB
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
      // Server 2 -> DB
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
          style: { stroke: "rgba(239, 68, 68, 0.4)", strokeWidth: 1.6, strokeDasharray: "4 4" },
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
          style: { stroke: "rgba(239, 68, 68, 0.4)", strokeWidth: 1.6, strokeDasharray: "4 4" },
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
    <section className="relative py-14 px-4 md:px-8 bg-background overflow-hidden border-t border-border/40">
      <div className="container mx-auto max-w-6xl">
        {/* Section Headline matching screenshot: Practice systems using interactive labs */}
        <div className="text-center space-y-2.5 mb-10">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Practice systems <br className="hidden sm:inline" />
            using interactive labs
          </h2>
        </div>

        {/* Nodes Area with targeted square grid UI strictly behind nodes like Hero.tsx */}
        <div className="relative w-full h-[520px] md:h-[560px] rounded-2xl overflow-hidden">
          {/* Square Grid Pattern strictly for the nodes area */}
          <div className="absolute inset-0 pointer-events-none z-0">
            {/* Base dark canvas */}
            <div className="absolute inset-0 bg-[#080808]" />

            {/* Uploaded grid pattern image */}
            <div 
              className="absolute inset-0 bg-repeat opacity-85"
              style={{
                backgroundImage: "url('/grid-pattern.png')",
                backgroundSize: "168px 358px",
                backgroundRepeat: "repeat",
              }}
            />

            {/* High-visibility crisp architectural grid lines */}
            <div 
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.12) 1px, transparent 1px)
                `,
                backgroundSize: "42px 42px",
              }}
            />

            {/* Soft radial fade vignette so it gently blends at the edges */}
            <div 
              className="absolute inset-0"
              style={{
                background: "radial-gradient(ellipse 80% 75% at 50% 50%, transparent 40%, var(--background) 100%)",
              }}
            />

            {/* Subtle warm center radial accent */}
            <div 
              className="absolute inset-0"
              style={{
                background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255, 223, 39, 0.04) 0%, transparent 75%)",
              }}
            />
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={{ padding: 0.12 }}
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
