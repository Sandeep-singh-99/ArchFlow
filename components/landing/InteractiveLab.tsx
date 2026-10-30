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
  Sparkles,
  Shield,
  Layers,
  Boxes,
  Database,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  domainTheme?: "indigo" | "emerald" | "amber" | "cyan" | "purple" | string;
  columns?: ColumnDefinition[];
  comment?: string;
  isDeletable?: boolean;
  isDropped?: boolean;
  onToggleDelete?: () => void;
}

/* ========================================================
   DOMAIN PALETTES FOR NODES
   ======================================================== */
interface DomainStyle {
  color: string;
  glow: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
  badge: string;
  dotColor: string;
  headerAccent: string;
  IconComponent: React.ElementType;
}

const DOMAIN_STYLES: Record<string, DomainStyle> = {
  indigo: {
    color: "#6366f1",
    glow: "rgba(99, 102, 241, 0.25)",
    gradient: "from-indigo-500/15 via-indigo-500/5 to-transparent",
    iconBg: "bg-indigo-500/15 border border-indigo-500/30",
    iconColor: "text-indigo-400",
    badge: "border-indigo-500/30 text-indigo-300 bg-indigo-500/10",
    dotColor: "bg-indigo-400",
    headerAccent: "from-indigo-500 via-blue-400 to-indigo-500/30",
    IconComponent: Shield,
  },
  emerald: {
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.25)",
    gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    iconBg: "bg-emerald-500/15 border border-emerald-500/30",
    iconColor: "text-emerald-400",
    badge: "border-emerald-500/30 text-emerald-300 bg-emerald-500/10",
    dotColor: "bg-emerald-400",
    headerAccent: "from-emerald-500 via-teal-400 to-emerald-500/30",
    IconComponent: Layers,
  },
  amber: {
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.25)",
    gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
    iconBg: "bg-amber-500/15 border border-amber-500/30",
    iconColor: "text-[#ffdf27]",
    badge: "border-amber-500/30 text-[#ffee72] bg-amber-500/10",
    dotColor: "bg-[#ffdf27]",
    headerAccent: "from-[#ffc507] via-[#ffee72] to-[#ffdf27]/30",
    IconComponent: Boxes,
  },
};

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
  const domainKey = data.domainTheme || "indigo";
  const domainStyle = DOMAIN_STYLES[domainKey] || DOMAIN_STYLES.indigo;
  const DomainIcon = domainStyle.IconComponent || Table;
  const isDropped = data.isDropped;
  const isDeletable = data.isDeletable;

  const columns: ColumnDefinition[] = data.columns || [
    { id: "id", name: "id", type: "UUID", isPk: true, isNullable: false },
    { id: "created_at", name: "created_at", type: "TIMESTAMP", isNullable: false },
  ];

  return (
    <div
      className={`min-w-[270px] max-w-[320px] rounded-2xl border backdrop-blur-2xl transition-all duration-300 relative select-none group/node shadow-2xl ${
        isDropped
          ? "bg-red-950/20 border-red-500/50 shadow-[0_0_35px_rgba(239,68,68,0.22)]"
          : selected
          ? "bg-[#0b0c10]/95 border-[#ffdf27]/70 ring-2 ring-[#ffdf27]/25 shadow-[0_0_30px_rgba(255,223,39,0.18),0_20px_45px_-10px_rgba(0,0,0,0.9)]"
          : "bg-[#0b0c10]/92 border-[#23252b] hover:border-zinc-700 hover:shadow-[0_24px_50px_-10px_rgba(0,0,0,0.95)] hover:-translate-y-0.5"
      }`}
      style={{
        boxShadow:
          !isDropped && !selected
            ? `0 18px 40px -12px rgba(0,0,0,0.85), inset 0 1px 0 0 rgba(255,255,255,0.12)`
            : undefined,
      }}
    >
      {/* Top radiant domain accent line */}
      <div
        className={`absolute -top-px left-4 right-4 h-[2px] rounded-full transition-opacity ${
          isDropped
            ? "bg-gradient-to-r from-transparent via-red-500 to-transparent"
            : `bg-gradient-to-r ${domainStyle.headerAccent}`
        }`}
      />

      {/* Subtle top ambient aura */}
      {!isDropped && (
        <div
          className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${domainStyle.gradient} pointer-events-none rounded-t-2xl opacity-70`}
        />
      )}

      {/* Node-level fallback handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={`!w-2.5 !h-2.5 !border-2 !border-[#0b0c10] !rounded-full z-20 transition-all hover:scale-125 ${
          isDropped ? "!bg-red-500" : selected ? "!bg-[#ffdf27]" : "!bg-zinc-400 hover:!bg-white"
        }`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={`!w-2.5 !h-2.5 !border-2 !border-[#0b0c10] !rounded-full z-20 transition-all hover:scale-125 ${
          isDropped ? "!bg-red-500" : selected ? "!bg-[#ffdf27]" : "!bg-zinc-400 hover:!bg-white"
        }`}
      />

      {/* Table Header */}
      <div
        className={`px-3.5 py-2.5 border-b rounded-t-2xl flex items-center justify-between gap-2 relative z-10 transition-colors ${
          isDropped
            ? "border-red-500/30 bg-red-950/40"
            : "border-[#23252b] bg-white/[0.02]"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-1.5 rounded-lg shrink-0 transition-transform group-hover/node:scale-105 ${
              isDropped
                ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                : `${domainStyle.iconBg} ${domainStyle.iconColor} shadow-xs`
            }`}
          >
            <DomainIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9.5px] uppercase font-mono tracking-wider text-zinc-400 font-semibold truncate">
                {schemaName}
              </span>
              <span className="text-zinc-600 text-[10px] leading-none">•</span>
              {data.domainName && (
                <span
                  title={`Domain: ${data.domainName}`}
                  className={`text-[8.5px] px-1.5 py-0.2 rounded-full font-mono font-medium truncate max-w-[100px] border ${domainStyle.badge}`}
                >
                  {data.domainName}
                </span>
              )}
            </div>
            <div className="text-[13px] font-bold text-white truncate font-mono tracking-tight flex items-center gap-1.5 mt-0.5">
              <span>{tableName}</span>
              {!isDropped && (
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${domainStyle.dotColor} shadow-[0_0_6px_currentColor]`}
                  title="Active Table"
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className={`text-[9.5px] px-2 py-0.5 h-4.5 font-mono font-bold tracking-tight ${
              isDropped
                ? "border-red-500/40 text-red-400 bg-red-500/10 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                : "border-[#23252b] text-zinc-300 bg-zinc-900/50"
            }`}
          >
            {isDropped ? "DROPPED" : `${columns.length} COLS`}
          </Badge>

          {isDeletable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data?.onToggleDelete?.();
              }}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                isDropped
                  ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.3)] animate-pulse"
                  : "text-zinc-400 hover:text-red-400 hover:bg-red-500/15 border border-transparent hover:border-red-500/30"
              }`}
              title={isDropped ? "Restore Table & Foreign Keys" : "Simulate CASCADE DROP"}
            >
              {isDropped ? (
                <RefreshCw className="h-3.5 w-3.5" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Dropped Alert Banner */}
      {isDropped && (
        <div className="px-3.5 py-1.5 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between text-[10px] font-mono text-red-300 relative z-10">
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
            FOREIGN KEYS DETACHED
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              data?.onToggleDelete?.();
            }}
            className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            RESTORE
          </button>
        </div>
      )}

      {/* Columns List with Row-Level ER Handles */}
      <div className="divide-y divide-white/[0.04] py-1 relative z-10">
        {columns.map((col, idx) => {
          const colHandleKey = col.id || col.name || `col-${idx}`;
          return (
            <div
              key={col.id || `col-${idx}-${col.name || "unnamed"}`}
              className={`group/row relative px-3.5 py-1.5 flex items-center justify-between text-xs transition-all gap-2 ${
                isDropped ? "opacity-35" : "hover:bg-white/[0.04]"
              }`}
            >
              {/* Row Left Handle (Target/Source for Relationship) */}
              <Handle
                type="target"
                position={Position.Left}
                id={`col-${colHandleKey}-left`}
                className={`!w-2.5 !h-2.5 !-left-[5px] !border-2 !border-[#0b0c10] !rounded-full shadow-xs transition-all group-hover/row:scale-130 z-20 cursor-crosshair ${
                  isDropped
                    ? "!bg-red-500"
                    : "!bg-sky-400 hover:!bg-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.7)]"
                }`}
                title={`Connect foreign key to ${tableName}.${col.name}`}
              />

              {/* Column Name & Key Badges */}
              <div className="flex items-center gap-2 min-w-0">
                {col.isPk && (
                  <span
                    title="Primary Key (PK)"
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono font-bold rounded bg-amber-400/15 text-[#ffdf27] border border-[#ffdf27]/40 shadow-[0_0_8px_rgba(255,223,39,0.15)] shrink-0"
                  >
                    <Key className="h-2.5 w-2.5 text-[#ffdf27]" />
                    <span>PK</span>
                  </span>
                )}
                {col.isFk && (
                  <span
                    title="Foreign Key (FK)"
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono font-bold rounded bg-sky-500/15 text-sky-300 border border-sky-400/40 shadow-[0_0_8px_rgba(56,189,248,0.15)] shrink-0"
                  >
                    <Link2 className="h-2.5 w-2.5 text-sky-300" />
                    <span>FK</span>
                  </span>
                )}
                {!col.isPk && !col.isFk && (
                  <Hash className="h-3 w-3 text-zinc-600 shrink-0" />
                )}
                <span
                  className={`font-mono text-[11.5px] truncate tracking-tight ${
                    col.isPk
                      ? "font-semibold text-white"
                      : col.isFk
                      ? "font-medium text-sky-200"
                      : "text-zinc-200"
                  }`}
                >
                  {col.name}
                </span>
              </div>

              {/* Column Type & Modifiers */}
              <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                <span className="text-zinc-400 bg-zinc-900/60 px-1.5 py-0.5 rounded border border-[#23252b] text-[9.5px]">
                  {col.type}
                </span>
                {col.isNullable && (
                  <span className="text-zinc-500 text-[8.5px] px-1 py-0.2 rounded bg-zinc-900/80 border border-zinc-800 font-mono">
                    NULL
                  </span>
                )}
                {col.isUnique && !col.isPk && (
                  <span className="text-purple-300 font-semibold text-[8px] px-1.5 py-0.2 rounded bg-purple-500/15 border border-purple-500/30">
                    UQ
                  </span>
                )}
              </div>

              {/* Row Right Handle (Source/Target for Relationship) */}
              <Handle
                type="source"
                position={Position.Right}
                id={`col-${colHandleKey}-right`}
                className={`!w-2.5 !h-2.5 !-right-[5px] !border-2 !border-[#0b0c10] !rounded-full shadow-xs transition-all group-hover/row:scale-130 z-20 cursor-crosshair ${
                  isDropped
                    ? "!bg-red-500"
                    : "!bg-emerald-400 hover:!bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                }`}
                title={`Connect relationship from ${tableName}.${col.name}`}
              />
            </div>
          );
        })}
      </div>

      {/* Footer comment / metadata */}
      <div className="px-3.5 py-2 border-t border-[#23252b] bg-black/30 rounded-b-2xl flex items-center justify-between text-[10px] text-zinc-500 font-mono relative z-10">
        <div className="flex items-center gap-1.5 truncate">
          <Sparkles className="h-3 w-3 text-zinc-600 shrink-0" />
          <span className="truncate italic text-zinc-400">
            {data.comment || "Active relation"}
          </span>
        </div>
        <span className="text-[9px] uppercase tracking-wider text-zinc-600 shrink-0 font-mono">
          PostgreSQL
        </span>
      </div>

      {/* Handwritten "Try deleting me" doodle arrow pointing down at the delete button */}
      {isDeletable && !isDropped && (
        <div className="absolute -top-14 right-0 pointer-events-none select-none z-30 flex items-end gap-1.5 animate-bounce [animation-duration:2.5s]">
          <div className="flex flex-col items-end">
            <span
              className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#ffee72] whitespace-nowrap tracking-wide leading-none drop-shadow-[0_2px_8px_rgba(255,223,39,0.4)]"
              style={{ fontFamily: "'Caveat', cursive, 'Brush Script MT', 'Comic Sans MS', cursive, sans-serif" }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ffdf27]" />
              Try deleting me!
            </span>
            <span className="text-[9.5px] text-zinc-400 font-mono tracking-tight mt-0.5">
              Test cascade drop
            </span>
          </div>
          <svg
            width="32"
            height="36"
            viewBox="0 0 32 36"
            fill="none"
            className="overflow-visible text-[#ffdf27] drop-shadow-[0_0_6px_rgba(255,223,39,0.4)]"
          >
            {/* Smooth curving arc down towards the trash button */}
            <path
              d="M 4 4 C 20 4, 26 14, 22 28"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arrowhead */}
            <path
              d="M 15 24 L 22 30 L 28 22"
              stroke="currentColor"
              strokeWidth="1.8"
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
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0b0c10]/95 border border-[#23252b] shadow-2xl backdrop-blur-xl text-xs font-medium text-zinc-300">
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
          onClick={() => fitView({ padding: 0.16, duration: 300 })}
          className="px-2.5 py-0.5 rounded-full hover:bg-white/10 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer font-sans"
        >
          Fit view
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
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full hover:bg-white/10 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer font-sans"
        >
          <Sliders className="h-3 w-3 text-[#ffdf27]" />
          <span>Reset layout</span>
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
        position: { x: 30, y: 70 },
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
        position: { x: 860, y: 155 },
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
        position: { x: 440, y: 400 },
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
      stroke: "rgba(255, 255, 255, 0.5)",
      strokeWidth: 1.8,
      strokeDasharray: "4 4",
    };
    const labelStyle = { fill: "#f4f4f5", fontSize: 9.5, fontFamily: "monospace", fontWeight: 600 };
    const labelBgStyle = { fill: "#0c0d12", stroke: "rgba(255,255,255,0.18)", borderRadius: 8 };
    const labelBgPadding = [8, 3] as [number, number];

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
          style: { stroke: "rgba(239, 68, 68, 0.65)", strokeWidth: 1.8, strokeDasharray: "4 4" },
          label: "CASCADE DROPPED",
          labelStyle: { fill: "#f87171", fontSize: 9, fontFamily: "monospace", fontWeight: 700 },
          labelBgStyle: { fill: "#271214", stroke: "rgba(239,68,68,0.4)", borderRadius: 8 },
          labelBgPadding,
        },
        {
          id: "e-products-items",
          source: "products-table",
          target: "order_items-table",
          sourceHandle: "col-id-right",
          targetHandle: "col-product_id-left",
          animated: false,
          style: { stroke: "rgba(239, 68, 68, 0.65)", strokeWidth: 1.8, strokeDasharray: "4 4" },
          label: "CASCADE DROPPED",
          labelStyle: { fill: "#f87171", fontSize: 9, fontFamily: "monospace", fontWeight: 700 },
          labelBgStyle: { fill: "#271214", stroke: "rgba(239,68,68,0.4)", borderRadius: 8 },
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
    <section className="relative py-16 px-4 md:px-8 bg-black overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        {/* Section Headline */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#23252b] bg-white/[0.03] px-3.5 py-1 text-xs font-mono text-zinc-400 backdrop-blur-md shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-[#ffdf27]" />
            <span>Interactive Sandbox</span>
            <span className="h-1 w-1 rounded-full bg-[#ffc507]" />
            <span className="text-[#ffee72] font-semibold">Live React Flow Canvas</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Interactive Database Flows
          </h2>
          <p className="text-sm md:text-base text-zinc-400 max-w-lg mx-auto">
            Drag tables, inspect foreign key relationships, and test CASCADE drops in real time.
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