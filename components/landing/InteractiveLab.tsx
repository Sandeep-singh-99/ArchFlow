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
  Table,
  Key,
  Link2,
  Hash,
  Minus,
  Plus,
  Trash2,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDomainTheme } from "@/lib/domainThemes";

/* ========================================================
   TYPES
   ======================================================== */
export interface ColumnDefinition {
  id: string;
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
}

export interface InteractiveTableNodeData {
  label?: string;
  name?: string;
  schema?: string;
  domainName?: string;
  domainTheme?: string;
  columns?: ColumnDefinition[];
  comment?: string;
  isDeletable?: boolean;
  isDropped?: boolean;
  onToggleDelete?: () => void;
}

/* ========================================================
   CUSTOM INTERACTIVE DATABASE TABLE NODE
   ======================================================== */
function InteractiveDbTableNode({
  data,
  selected,
}: {
  data: InteractiveTableNodeData;
  selected?: boolean;
}) {
  const tableName = data.name || data.label || "untitled_table";
  const schemaName = data.schema || "public";
  const domainThemeConfig = data.domainName ? getDomainTheme(data.domainTheme) : null;
  const isDropped = data.isDropped;
  const isDeletable = data.isDeletable;

  const columns: ColumnDefinition[] = data.columns || [
    { id: "id", name: "id", type: "UUID", isPk: true, isNullable: false },
    { id: "created_at", name: "created_at", type: "TIMESTAMP", isNullable: false },
  ];

  return (
    <div
      className={`min-w-[240px] max-w-[290px] rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 relative select-none ${
        isDropped
          ? "bg-red-950/20 border-red-500/40 opacity-60 shadow-red-950/20"
          : selected
          ? "bg-[#0c0d10]/95 border-white ring-2 ring-white/20 shadow-white/5"
          : "bg-[#0c0d10]/95 border-[#23252b] hover:border-zinc-700 shadow-black/80"
      }`}
    >
      {/* Node-level fallback handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={`!w-2.5 !h-2.5 !border-2 !border-[#0c0d10] !rounded-full z-20 ${
          isDropped ? "!bg-red-500" : selected ? "!bg-white" : "!bg-zinc-400"
        }`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={`!w-2.5 !h-2.5 !border-2 !border-[#0c0d10] !rounded-full z-20 ${
          isDropped ? "!bg-red-500" : selected ? "!bg-white" : "!bg-zinc-400"
        }`}
      />

      {/* Table Header */}
      <div
        className={`px-3 py-2 border-b rounded-t-xl flex items-center justify-between gap-2 transition-colors ${
          isDropped
            ? "border-red-500/30 bg-red-950/40"
            : "border-[#23252b] bg-white/[0.02]"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`p-1 rounded-md shrink-0 ${
              isDropped
                ? "bg-red-500/20 text-red-400"
                : "bg-amber-500/15 text-[#ffdf27]"
            }`}
          >
            <Table className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9.5px] uppercase font-mono tracking-wider text-zinc-500 truncate">
                {schemaName}
              </span>
              {data.domainName && domainThemeConfig && (
                <span
                  title={`Domain: ${data.domainName}`}
                  className={`text-[8.5px] px-1 py-0.2 rounded font-mono font-medium truncate max-w-[100px] border ${domainThemeConfig.badge}`}
                >
                  {data.domainName}
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-white truncate font-mono">
              {tableName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className={`text-[9px] px-1.5 py-0 h-4 font-mono font-semibold ${
              isDropped
                ? "border-red-500/40 text-red-400 bg-red-500/10"
                : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
            }`}
          >
            {isDropped ? "DROPPED" : "TABLE"}
          </Badge>

          {isDeletable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data?.onToggleDelete?.();
              }}
              className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={isDropped ? "Restore Table" : "Simulate CASCADE DROP"}
            >
              {isDropped ? (
                <RefreshCw className="h-3 w-3 text-emerald-400" />
              ) : (
                <Trash2 className="h-3 w-3 hover:text-red-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Columns List with Row-Level ER Handles */}
      <div className="divide-y divide-white/5 py-1">
        {columns.map((col, idx) => {
          const colHandleKey = col.id || col.name || `col-${idx}`;
          return (
            <div
              key={col.id || `col-${idx}-${col.name || "unnamed"}`}
              className={`group/row relative px-3 py-1.2 flex items-center justify-between text-xs transition-colors gap-2 ${
                isDropped ? "opacity-40" : "hover:bg-white/[0.04]"
              }`}
            >
              {/* Row Left Handle (Target/Source for Relationship) */}
              <Handle
                type="target"
                position={Position.Left}
                id={`col-${colHandleKey}-left`}
                className={`!w-2 !h-2 !-left-[5px] !border-2 !border-[#0c0d10] !rounded-full shadow-xs transition-transform group-hover/row:scale-125 z-10 cursor-crosshair ${
                  isDropped ? "!bg-red-500" : "!bg-sky-400 hover:!bg-sky-300"
                }`}
                title={`Relationship connection to ${tableName}.${col.name}`}
              />

              <div className="flex items-center gap-1.5 min-w-0">
                {col.isPk && (
                  <span
                    title="Primary Key (PK)"
                    className="flex items-center gap-0.5 px-1 py-0.2 text-[8px] font-mono font-bold rounded bg-amber-500/15 text-[#ffdf27] border border-amber-500/30 shrink-0"
                  >
                    <Key className="h-2.5 w-2.5" />
                    <span>PK</span>
                  </span>
                )}
                {col.isFk && (
                  <span
                    title="Foreign Key (FK)"
                    className="flex items-center gap-0.5 px-1 py-0.2 text-[8px] font-mono font-bold rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0"
                  >
                    <Link2 className="h-2.5 w-2.5" />
                    <span>FK</span>
                  </span>
                )}
                {!col.isPk && !col.isFk && (
                  <Hash className="h-2.5 w-2.5 text-zinc-600 shrink-0" />
                )}
                <span
                  className={`font-mono text-[11px] truncate ${
                    col.isPk
                      ? "font-semibold text-white"
                      : col.isFk
                      ? "font-medium text-sky-300"
                      : "text-zinc-300"
                  }`}
                >
                  {col.name}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0 font-mono text-[9.5px]">
                <span className="text-zinc-500">{col.type}</span>
                {col.isNullable && (
                  <span className="text-zinc-600 text-[8.5px]">NULL</span>
                )}
                {col.isUnique && !col.isPk && (
                  <span className="text-violet-400 font-semibold text-[8px] px-1 rounded bg-violet-500/15 border border-violet-500/30">
                    UQ
                  </span>
                )}
              </div>

              {/* Row Right Handle (Source/Target for Relationship) */}
              <Handle
                type="source"
                position={Position.Right}
                id={`col-${colHandleKey}-right`}
                className={`!w-2 !h-2 !-right-[5px] !border-2 !border-[#0c0d10] !rounded-full shadow-xs transition-transform group-hover/row:scale-125 z-10 cursor-crosshair ${
                  isDropped ? "!bg-red-500" : "!bg-emerald-400 hover:!bg-emerald-300"
                }`}
                title={`Relationship connection from ${tableName}.${col.name}`}
              />
            </div>
          );
        })}
      </div>

      {/* Footer comment / metadata */}
      {data.comment && (
        <div className="px-3 py-1.5 border-t border-[#23252b]/60 text-[9.5px] text-zinc-500 truncate italic">
          {data.comment}
        </div>
      )}

      {/* Handwritten "Try deleting me" doodle arrow pointing down at the delete button */}
      {isDeletable && !isDropped && (
        <div className="absolute -top-11 right-1 pointer-events-none select-none z-30 flex items-end gap-1.5">
          <span
            className="text-[13px] text-zinc-300 font-medium whitespace-nowrap tracking-wide leading-none pb-1"
            style={{ fontFamily: "'Caveat', cursive, 'Brush Script MT', cursive, sans-serif" }}
          >
            Try deleting me
          </span>
          <svg
            width="28"
            height="32"
            viewBox="0 0 28 32"
            fill="none"
            className="overflow-visible text-zinc-300"
          >
            {/* Smooth curving arc down towards the trash button */}
            <path
              d="M 2 4 C 16 4, 22 12, 19 25"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arrowhead */}
            <path
              d="M 13 21 L 19 27 L 24 20"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      )}
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
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0c0d10]/95 border border-[#23252b] shadow-2xl backdrop-blur-md text-xs font-medium text-zinc-300">
        {/* Zoom Out */}
        <button
          onClick={() => zoomOut({ duration: 200 })}
          className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
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
          className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Zoom in"
        >
          <Plus className="h-3 w-3" />
        </button>

        <div className="h-3.5 w-px bg-white/10 mx-0.5" />

        {/* Fit View */}
        <button
          onClick={() => fitView({ padding: 0.15, duration: 300 })}
          className="px-2 py-0.5 rounded-full hover:bg-white/10 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer font-sans"
        >
          Fit
        </button>

        <div className="h-3.5 w-px bg-white/10 mx-0.5" />

        {/* Auto layout / Reset */}
        <button
          onClick={() => {
            onReset();
            setTimeout(() => {
              fitView({ padding: 0.16, duration: 300 });
            }, 50);
          }}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full hover:bg-white/10 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer font-sans"
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
  const [orderItemsActive, setOrderItemsActive] = useState(true);

  // Toggle order_items table state
  const handleToggleOrderItems = useCallback(() => {
    setOrderItemsActive((prev) => !prev);
  }, []);

  // Register React Flow custom node types
  const nodeTypes = useMemo(
    () => ({
      dbTable: InteractiveDbTableNode,
    }),
    []
  );

  // Initial Database Nodes (Realistic Relational E-Commerce Schema with generous spacing)
  const initialNodes: Node[] = useMemo(
    () => [
      // 1. users Table (Auth Domain)
      {
        id: "users-table",
        type: "dbTable",
        position: { x: 40, y: 70 },
        data: {
          name: "users",
          schema: "public",
          domainName: "auth",
          domainTheme: "indigo",
          comment: "Core identity & access store",
          columns: [
            { id: "id", name: "id", type: "UUID", isPk: true, isNullable: false },
            { id: "email", name: "email", type: "VARCHAR(255)", isUnique: true, isNullable: false },
            { id: "full_name", name: "full_name", type: "VARCHAR(100)", isNullable: true },
            { id: "created_at", name: "created_at", type: "TIMESTAMP", isNullable: false },
          ],
        },
      },
      // 2. orders Table (Commerce Domain)
      {
        id: "orders-table",
        type: "dbTable",
        position: { x: 440, y: 40 },
        data: {
          name: "orders",
          schema: "public",
          domainName: "commerce",
          domainTheme: "emerald",
          comment: "Customer purchases & lifecycle",
          columns: [
            { id: "id", name: "id", type: "UUID", isPk: true, isNullable: false },
            { id: "user_id", name: "user_id", type: "UUID", isFk: true, isNullable: false },
            { id: "status", name: "status", type: "VARCHAR(30)", isNullable: false },
            { id: "total_amount", name: "total_amount", type: "NUMERIC(10,2)", isNullable: false },
            { id: "created_at", name: "created_at", type: "TIMESTAMP", isNullable: false },
          ],
        },
      },
      // 3. order_items Table (Line items - Interactive deletable node)
      {
        id: "order_items-table",
        type: "dbTable",
        position: { x: 840, y: 155 },
        data: {
          name: "order_items",
          schema: "public",
          domainName: "commerce",
          domainTheme: "emerald",
          comment: "Line item quantities & snapshot pricing",
          isDeletable: true,
          isDropped: !orderItemsActive,
          onToggleDelete: handleToggleOrderItems,
          columns: [
            { id: "id", name: "id", type: "UUID", isPk: true, isNullable: false },
            { id: "order_id", name: "order_id", type: "UUID", isFk: true, isNullable: false },
            { id: "product_id", name: "product_id", type: "UUID", isFk: true, isNullable: false },
            { id: "quantity", name: "quantity", type: "INT", isNullable: false },
            { id: "unit_price", name: "unit_price", type: "NUMERIC(10,2)", isNullable: false },
          ],
        },
      },
      // 4. products Table (Catalog Domain)
      {
        id: "products-table",
        type: "dbTable",
        position: { x: 440, y: 390 },
        data: {
          name: "products",
          schema: "public",
          domainName: "catalog",
          domainTheme: "amber",
          comment: "SKU inventory & merchandising",
          columns: [
            { id: "id", name: "id", type: "UUID", isPk: true, isNullable: false },
            { id: "name", name: "name", type: "VARCHAR(200)", isNullable: false },
            { id: "sku", name: "sku", type: "VARCHAR(50)", isUnique: true, isNullable: false },
            { id: "price", name: "price", type: "NUMERIC(10,2)", isNullable: false },
            { id: "stock_count", name: "stock_count", type: "INT", isNullable: false },
          ],
        },
      },
    ],
    [orderItemsActive, handleToggleOrderItems]
  );

  // React Flow Foreign Key Relationship Edges
  const initialEdges: Edge[] = useMemo(() => {
    const edgeStyle = {
      stroke: "rgba(255, 255, 255, 0.45)",
      strokeWidth: 1.5,
      strokeDasharray: "4 4",
    };
    const labelStyle = { fill: "#f4f4f5", fontSize: 9.5, fontFamily: "monospace" };
    const labelBgStyle = { fill: "#0c0d10", stroke: "rgba(255,255,255,0.2)", borderRadius: 8 };
    const labelBgPadding = [6, 2] as [number, number];

    const edgesList: Edge[] = [
      // users.id -> orders.user_id
      {
        id: "e-users-orders",
        source: "users-table",
        target: "orders-table",
        sourceHandle: "col-id-right",
        targetHandle: "col-user_id-left",
        animated: true,
        style: edgeStyle,
        label: "1 : N (FK)",
        labelStyle,
        labelBgStyle,
        labelBgPadding,
      },
    ];

    if (orderItemsActive) {
      edgesList.push(
        // orders.id -> order_items.order_id
        {
          id: "e-orders-items",
          source: "orders-table",
          target: "order_items-table",
          sourceHandle: "col-id-right",
          targetHandle: "col-order_id-left",
          animated: true,
          style: edgeStyle,
          label: "1 : N (FK)",
          labelStyle,
          labelBgStyle,
          labelBgPadding,
        },
        // products.id -> order_items.product_id
        {
          id: "e-products-items",
          source: "products-table",
          target: "order_items-table",
          sourceHandle: "col-id-right",
          targetHandle: "col-product_id-left",
          animated: true,
          style: edgeStyle,
          label: "1 : N (FK)",
          labelStyle,
          labelBgStyle,
          labelBgPadding,
        }
      );
    } else {
      // Red dashed disconnected lines when table is dropped
      edgesList.push(
        {
          id: "e-orders-items",
          source: "orders-table",
          target: "order_items-table",
          sourceHandle: "col-id-right",
          targetHandle: "col-order_id-left",
          animated: false,
          style: { stroke: "rgba(239, 68, 68, 0.4)", strokeWidth: 1.5, strokeDasharray: "4 4" },
          label: "CASCADE DROPPED",
          labelStyle: { fill: "#f87171", fontSize: 9, fontFamily: "monospace" },
          labelBgStyle: { fill: "#271214", stroke: "rgba(239,68,68,0.3)", borderRadius: 8 },
          labelBgPadding,
        },
        {
          id: "e-products-items",
          source: "products-table",
          target: "order_items-table",
          sourceHandle: "col-id-right",
          targetHandle: "col-product_id-left",
          animated: false,
          style: { stroke: "rgba(239, 68, 68, 0.4)", strokeWidth: 1.5, strokeDasharray: "4 4" },
          label: "CASCADE DROPPED",
          labelStyle: { fill: "#f87171", fontSize: 9, fontFamily: "monospace" },
          labelBgStyle: { fill: "#271214", stroke: "rgba(239,68,68,0.3)", borderRadius: 8 },
          labelBgPadding,
        }
      );
    }

    return edgesList;
  }, [orderItemsActive]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state changes with nodes and edges
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Reset to initial layout & restore order_items table
  const handleReset = useCallback(() => {
    setOrderItemsActive(true);
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  return (
    <section className="relative py-14 px-4 md:px-8 bg-black overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        {/* Section Headline */}
        <div className="text-center space-y-2.5 mb-10">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Practice systems <br className="hidden sm:inline" />
            using interactive labs
          </h2>
          <p className="text-sm md:text-base text-zinc-400 max-w-xl mx-auto">
            Design relational database schemas, inspect foreign key constraints, and test live architectural flows in an interactive canvas.
          </p>
        </div>

        {/* Nodes Area with central square grid spotlight floating on pure black */}
        <div className="relative w-full h-[600px] md:h-[680px] bg-black">
          {/* Architectural square grid with smooth radial spotlight */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px, 48px 48px, 24px 24px, 24px 24px",
              maskImage: "radial-gradient(ellipse 70% 65% at 50% 50%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 80%)",
              WebkitMaskImage: "radial-gradient(ellipse 70% 65% at 50% 50%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 80%)",
            }}
          />

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={{ padding: 0.16, maxZoom: 1 }}
            minZoom={0.4}
            maxZoom={1.6}
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
