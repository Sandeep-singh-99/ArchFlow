"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Handle,
  Position,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeProps,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Database,
  Plus,
  Trash2,
  Sliders,
  Eye,
  Info,
  Maximize2,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Raw SQL records definition
export interface SqlUser {
  id: number;
  name: string;
}

export interface SqlOrder {
  id: number;
  user_id: number;
  product: string;
  amount: number;
  status: string; // Excluded from Node properties
}

const DEFAULT_USERS: SqlUser[] = [
  { id: 1, name: "Alice Johnson" },
  { id: 2, name: "Bob Smith" },
];

const DEFAULT_ORDERS: SqlOrder[] = [
  { id: 101, user_id: 1, product: "Wireless Mouse", amount: 25.99, status: "DELIVERED" },
  { id: 102, user_id: 1, product: "Mechanical Keyboard", amount: 89.50, status: "PROCESSING" },
  { id: 103, user_id: 2, product: "USB-C Hub", amount: 34.00, status: "SHIPPED" },
];

// Custom User Node (No foreign keys)
function UserGraphNode({ data }: NodeProps) {
  return (
    <div className="group relative flex flex-col items-center justify-center min-w-[150px] px-4 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-amber-400/40 shadow-[0_0_20px_rgba(255,197,7,0.15)] hover:border-amber-400 transition-all duration-300">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-[10px] uppercase font-mono tracking-wider text-amber-300 font-bold">
          :User
        </span>
      </div>
      <div className="text-sm font-semibold text-slate-100">{data.name as string}</div>
      <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {data.id as number}</div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-slate-900 shadow-md cursor-crosshair"
      />
    </div>
  );
}

// Custom Order Node (Dynamically sized by amount, all database fields visible with no hidden data)
function OrderGraphNode({ data }: NodeProps) {
  const size = (data.size as number) || 150;
  const amount = data.amount as number;
  const product = data.product as string;
  const id = data.id as number;
  const status = (data.status as string) || "PROCESSING";
  const userId = data.user_id as number;

  const getStatusColor = (st: string) => {
    switch (st?.toUpperCase()) {
      case "DELIVERED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "SHIPPED":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "PROCESSING":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  return (
    <div
      style={{
        width: `${size}px`,
        minHeight: `${size}px`,
      }}
      className="group relative flex flex-col items-center justify-between rounded-3xl bg-gradient-to-br from-emerald-950/85 via-slate-900/95 to-slate-950 border-2 border-emerald-400/70 shadow-[0_0_30px_rgba(52,211,153,0.2)] hover:border-emerald-300 hover:shadow-[0_0_40px_rgba(52,211,153,0.4)] transition-all duration-300 select-none p-3.5 text-center gap-1.5"
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-slate-950 shadow-md cursor-crosshair"
      />

      {/* Header: Order ID & User Relation */}
      <div className="flex items-center justify-between w-full px-1 text-[10px] font-mono">
        <span className="font-bold tracking-wider text-emerald-400">
          :Order #{id}
        </span>
        <span className="text-amber-400 font-semibold bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.2 rounded-full">
          User #{userId}
        </span>
      </div>

      {/* Product Name */}
      <div
        className="font-semibold text-slate-100 line-clamp-2 px-1 leading-tight tracking-tight my-auto"
        style={{ fontSize: `${Math.max(11, Math.min(16, size / 10))}px` }}
        title={product}
      >
        {product}
      </div>

      {/* Amount Display */}
      <div
        className="font-extrabold text-emerald-300 drop-shadow-sm"
        style={{ fontSize: `${Math.max(14, Math.min(26, size / 7))}px` }}
      >
        ${amount.toFixed(2)}
      </div>

      {/* Bottom Row: Status Badge & Dynamic Size Indicator */}
      <div className="flex items-center justify-between w-full pt-1 border-t border-emerald-900/40 text-[9px] font-mono">
        <span className={`px-2 py-0.5 rounded-md border font-bold uppercase tracking-wider ${getStatusColor(status)}`}>
          {status}
        </span>
        <span className="text-emerald-400/70">
          {size}px
        </span>
      </div>
    </div>
  );
}

export default function NodeDatabaseVisualizer() {
  const [users] = useState<SqlUser[]>(DEFAULT_USERS);
  const [orders, setOrders] = useState<SqlOrder[]>(DEFAULT_ORDERS);

  // Sizing curve: linear, sqrt (smoother for large values), log
  const [scaleMode, setScaleMode] = useState<"sqrt" | "linear">("linear");
  const [baseScale, setBaseScale] = useState<number>(1.2);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<any | null>(null);

  // Form states to add new order
  const [newProduct, setNewProduct] = useState("");
  const [newAmount, setNewAmount] = useState<string>("50");
  const [newUserId, setNewUserId] = useState<number>(1);
  const [newStatus, setNewStatus] = useState<string>("PROCESSING");

  // Dynamic node sizing formula - generous minimum to display all database fields without hiding
  const computeSize = useCallback(
    (amount: number) => {
      const minDimension = 140;
      const maxDimension = 260;

      if (scaleMode === "sqrt") {
        // Square root scaling: preserves visibility across large differences
        const val = minDimension + Math.sqrt(Math.max(1, amount)) * 6.5 * baseScale;
        return Math.round(Math.min(maxDimension, Math.max(minDimension, val)));
      } else {
        // Linear scaling with baseline
        const val = minDimension + amount * 0.7 * baseScale;
        return Math.round(Math.min(maxDimension, Math.max(minDimension, val)));
      }
    },
    [scaleMode, baseScale]
  );

  // Generate React Flow Nodes with dynamic positioning to prevent overlapping
  const nodes = useMemo<Node[]>(() => {
    const userNodes: Node[] = users.map((user, idx) => ({
      id: `user-${user.id}`,
      type: "userNode",
      position: { x: 60, y: idx * 260 + 80 },
      data: {
        id: user.id,
        name: user.name,
      },
    }));

    let accumulatedY = 40;
    const orderNodes: Node[] = orders.map((order) => {
      const size = computeSize(order.amount);
      const yPos = accumulatedY;
      accumulatedY += size + 35; // Dynamically space nodes based on their size

      return {
        id: `order-${order.id}`,
        type: "orderNode",
        position: { x: 380, y: yPos },
        data: {
          id: order.id,
          user_id: order.user_id,
          product: order.product,
          amount: order.amount,
          status: order.status,
          size,
        },
      };
    });

    return [...userNodes, ...orderNodes];
  }, [users, orders, computeSize]);

  // Generate React Flow Edges (replaces the foreign key user_id)
  const edges = useMemo<Edge[]>(() => {
    return orders.map((order) => ({
      id: `edge-${order.user_id}-${order.id}`,
      source: `user-${order.user_id}`,
      target: `order-${order.id}`,
      label: "PLACED",
      animated: true,
      style: { stroke: "#10b981", strokeWidth: 2 },
      labelStyle: { fill: "#6ee7b7", fontWeight: 700, fontSize: 10 },
      labelBgStyle: { fill: "#064e3b", fillOpacity: 0.9, rx: 4, ry: 4 },
      labelBgPadding: [4, 6] as [number, number],
    }));
  }, [orders]);

  const nodeTypes = useMemo(
    () => ({
      userNode: UserGraphNode,
      orderNode: OrderGraphNode,
    }),
    []
  );

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newAmount);
    if (!newProduct.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const nextId = orders.length > 0 ? Math.max(...orders.map((o) => o.id)) + 1 : 101;
    setOrders((prev) => [
      ...prev,
      {
        id: nextId,
        user_id: newUserId,
        product: newProduct.trim(),
        amount: parsedAmount,
        status: newStatus,
      },
    ]);

    setNewProduct("");
    setNewAmount("50");
  };

  const handleUpdateAmount = (orderId: number, nextAmt: number) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, amount: Math.max(1, nextAmt) } : o))
    );
  };

  const handleDeleteOrder = (orderId: number) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (selectedNodeDetails?.id === orderId) {
      setSelectedNodeDetails(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 text-foreground">
      {/* Header Info Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Feature Implementation
            </span>
            <span className="text-xs text-muted-foreground">SQL → Graph Node Model</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="h-6 w-6 text-emerald-400" />
            Dynamic Node Sizing by Amount
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            All database properties (<code className="text-emerald-300">id</code>, <code className="text-amber-300">user_id</code>, <code className="text-emerald-300">product</code>, <code className="text-emerald-300">amount</code>, <code className="text-emerald-300">status</code>) are fully rendered and visible without hiding, and{" "}
            <strong className="text-white">Order node dimensions scale dynamically with order amount</strong>.
          </p>
        </div>

        {/* Scaling Adjuster Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sliders className="h-3 w-3" /> Size Scale
            </span>
            <input
              type="range"
              min="0.6"
              max="2.0"
              step="0.1"
              value={baseScale}
              onChange={(e) => setBaseScale(parseFloat(e.target.value))}
              className="w-28 accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400">Scale Mode</span>
            <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setScaleMode("linear")}
                className={`px-2.5 py-1 font-mono transition-colors ${
                  scaleMode === "linear"
                    ? "bg-emerald-500 text-slate-950 font-bold"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                }`}
              >
                Linear
              </button>
              <button
                type="button"
                onClick={() => setScaleMode("sqrt")}
                className={`px-2.5 py-1 font-mono transition-colors ${
                  scaleMode === "sqrt"
                    ? "bg-emerald-500 text-slate-950 font-bold"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                }`}
              >
                Sqrt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Canvas (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col h-[620px] rounded-2xl border border-slate-800 bg-[#090a0f] overflow-hidden shadow-2xl relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedNodeDetails(node)}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
          >
            <Background color="#1e293b" gap={22} variant={BackgroundVariant.Dots} />
            <Controls className="!bg-slate-900 !border-slate-800 !text-white" />
            <Panel position="top-right" className="bg-slate-950/80 backdrop-blur-md p-2 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Node diameter reflects amount in real-time</span>
            </Panel>
          </ReactFlow>

          {/* Node Inspector Drawer if clicked */}
          {selectedNodeDetails && (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-2xl z-10 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-emerald-400" />
                  Inspecting Node: {selectedNodeDetails.id}
                </span>
                <button
                  onClick={() => setSelectedNodeDetails(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mt-2 space-y-1 font-mono text-[11px]">
                {Object.entries(selectedNodeDetails.data).map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-400">{key}:</span>
                    <span className="text-emerald-300 font-bold">{String(val)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-300/90 flex items-center gap-1">
                <Info className="h-3 w-3 shrink-0" />
                <span>All database fields are fully loaded and rendered on this node.</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Data Management & Live Form (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Add New Order Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <Plus className="h-4 w-4 text-emerald-400" />
              Insert Order into Graph
            </h3>

            <form onSubmit={handleAddOrder} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. UltraWide Monitor"
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="1000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">User (Relation)</label>
                  <select
                    value={newUserId}
                    onChange={(e) => setNewUserId(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-400"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (ID: {u.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  Status <span className="text-emerald-400 font-mono text-[10px]">(Rendered in Node)</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-emerald-400"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </div>

              <Button
                type="submit"
                size="sm"
                className="w-full mt-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-md shadow-emerald-500/20"
              >
                Add Order Node
              </Button>
            </form>
          </div>

          {/* Real-time Order Node Sizing Adjusters */}
          <div className="flex-1 p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md flex flex-col">
            <h3 className="text-sm font-semibold text-white flex items-center justify-between mb-3">
              <span className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-400" />
                Live Amount & Node Size
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {orders.length} orders
              </span>
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[260px] pr-1">
              {orders.map((order) => {
                const currentSize = computeSize(order.amount);
                return (
                  <div
                    key={order.id}
                    className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 truncate max-w-[140px]">
                        {order.product}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400 font-bold">
                          ${order.amount.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {currentSize}px
                        </span>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete node"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Amount Slider to demonstrate live size enlargement */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">$5</span>
                      <input
                        type="range"
                        min="5"
                        max="350"
                        step="5"
                        value={order.amount}
                        onChange={(e) => handleUpdateAmount(order.id, parseFloat(e.target.value))}
                        className="flex-1 accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <span className="text-[10px] text-slate-500">$350</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison View: SQL Table vs Node Graph Properties */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-400" />
          Data Mapping Breakdown: Relational SQL vs Node Database
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* SQL Relational Table View */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-amber-400 font-semibold mb-2 flex items-center gap-1.5">
              <span>SQL Table: `orders`</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                    <th className="pb-1.5">id</th>
                    <th className="pb-1.5 text-rose-400">user_id (FK)</th>
                    <th className="pb-1.5">product</th>
                    <th className="pb-1.5">amount</th>
                    <th className="pb-1.5 text-rose-400">status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-1">{o.id}</td>
                      <td className="py-1 text-rose-400">{o.user_id}</td>
                      <td className="py-1 truncate max-w-[100px]">{o.product}</td>
                      <td className="py-1 text-emerald-400 font-bold">${o.amount.toFixed(2)}</td>
                      <td className="py-1 text-rose-400">{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Graph Node View */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-emerald-400 font-semibold mb-2 flex items-center gap-1.5">
              <span>Node Database: `(:Order)` Attributes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                    <th className="pb-1.5">id</th>
                    <th className="pb-1.5 text-amber-300">user_id</th>
                    <th className="pb-1.5">product</th>
                    <th className="pb-1.5">amount</th>
                    <th className="pb-1.5 text-emerald-300">status</th>
                    <th className="pb-1.5 text-emerald-400">Dynamic Node Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-1">{o.id}</td>
                      <td className="py-1 text-amber-300">#{o.user_id}</td>
                      <td className="py-1 truncate max-w-[100px]">{o.product}</td>
                      <td className="py-1 text-emerald-400 font-bold">${o.amount.toFixed(2)}</td>
                      <td className="py-1 text-emerald-300 font-semibold">{o.status}</td>
                      <td className="py-1 text-emerald-300 font-bold">
                        {computeSize(o.amount)}px ◯
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
