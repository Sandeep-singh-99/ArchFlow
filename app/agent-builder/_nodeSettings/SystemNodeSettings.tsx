"use client";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Sliders, Trash2, X, Layout, Cpu, Database, Bot, Sparkles, Table2, Braces, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  selectedNode: any;
  updateFormData: (formData: any) => void;
  onDeleteNode?: (nodeId: string) => void;
  onClose?: () => void;
}

const ROLES = [
  { id: "frontend", label: "Frontend", icon: Layout },
  { id: "backend", label: "Backend", icon: Cpu },
  { id: "database", label: "Database", icon: Database },
  { id: "ai", label: "AI", icon: Bot },
  { id: "custom", label: "Custom", icon: Sparkles },
];

const DEFAULT_SQL_FIELDS = [
  { id: "f-1", name: "id", type: "UUID PRIMARY KEY" },
  { id: "f-2", name: "email", type: "VARCHAR(255) UNIQUE" },
  { id: "f-3", name: "created_at", type: "TIMESTAMP DEFAULT NOW()" },
];

const DEFAULT_NOSQL_FIELDS = [
  { id: "f-1", name: "_id", type: "ObjectId" },
  { id: "f-2", name: "username", type: "String" },
  { id: "f-3", name: "is_active", type: "Boolean" },
];

export default function SystemNodeSettings({
  selectedNode,
  updateFormData,
  onDeleteNode,
  onClose,
}: Props) {
  const [formData, setFormData] = useState({
    name: "",
    role: "frontend",
    action: "",
    tech: "",
    protocol: "HTTPS",
    latency: "5.0ms",
    qps: "50k req/s",
    redundancy: "Multi-AZ Active",
    notes: "",
    fontSize: "base",
    dbFormat: "sql",
    dbTableName: "users_table",
    dbFields: DEFAULT_SQL_FIELDS,
    dbDescription: "",
    dbData: "",
  });

  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("");

  useEffect(() => {
    if (selectedNode) {
      const settings = selectedNode.data?.settings || {};
      const inferredFormat =
        settings.dbFormat ||
        (settings.action?.toLowerCase().includes("nosql") ||
        settings.tech?.toLowerCase().includes("mongo") ||
        settings.tech?.toLowerCase().includes("redis") ||
        settings.tech?.toLowerCase().includes("dynamo")
          ? "nosql"
          : "sql");

      const defaultFields = inferredFormat === "nosql" ? DEFAULT_NOSQL_FIELDS : DEFAULT_SQL_FIELDS;
      const initialFields =
        Array.isArray(settings.dbFields) && settings.dbFields.length > 0
          ? settings.dbFields
          : defaultFields;

      setFormData({
        name: selectedNode.data?.label || selectedNode.data?.name || "Component Node",
        role: settings.role || "frontend",
        action: settings.action || settings.rendering || settings.latency || "Core Functionality",
        tech: settings.tech || "",
        protocol: settings.protocol || "HTTPS",
        latency: settings.latency || "5.0ms",
        qps: settings.qps || "50k req/s",
        redundancy: settings.redundancy || "Multi-AZ Active",
        notes: settings.notes || "",
        fontSize: settings.fontSize || selectedNode.data?.fontSize || "base",
        dbFormat: inferredFormat,
        dbTableName:
          settings.dbTableName ||
          (inferredFormat === "nosql" ? "users_collection" : "users_table"),
        dbFields: initialFields,
        dbDescription: settings.dbDescription || settings.notes || "",
        dbData: settings.dbData || "",
      });
    }
  }, [selectedNode]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    const newField = {
      id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newFieldName.trim(),
      type: newFieldType.trim() || (formData.dbFormat === "sql" ? "VARCHAR" : "string"),
    };
    setFormData((prev: any) => ({
      ...prev,
      dbFields: [...(prev.dbFields || []), newField],
    }));
    setNewFieldName("");
    setNewFieldType("");
  };

  const handleRemoveField = (fieldId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      dbFields: (prev.dbFields || []).filter((f: any) => f.id !== fieldId),
    }));
  };

  const handleSwitchDbFormat = (format: "sql" | "nosql") => {
    setFormData((prev: any) => ({
      ...prev,
      dbFormat: format,
      dbTableName:
        format === "sql"
          ? prev.dbTableName === "users_collection"
            ? "users_table"
            : prev.dbTableName || "users_table"
          : prev.dbTableName === "users_table"
            ? "users_collection"
            : prev.dbTableName || "users_collection",
      dbFields:
        format === "sql"
          ? prev.dbFormat === "sql" && prev.dbFields?.length
            ? prev.dbFields
            : DEFAULT_SQL_FIELDS
          : prev.dbFormat === "nosql" && prev.dbFields?.length
            ? prev.dbFields
            : DEFAULT_NOSQL_FIELDS,
      tech: format === "sql" ? "PostgreSQL" : "MongoDB",
      protocol: format === "sql" ? "Postgres Wire" : "Mongo Wire",
      action: format === "sql" ? "SQL Relational Store" : "Document / NoSQL Store",
    }));
  };

  const handleRoleChange = (roleId: string) => {
    setFormData((prev: any) => {
      const updates: any = { ...prev, role: roleId };
      if (roleId === "frontend" || roleId === "backend") {
        updates.action = "";
        updates.tech = "";
      }
      if (roleId === "database") {
        const fmt = prev.dbFormat || "sql";
        updates.dbFormat = fmt;
        updates.dbTableName =
          prev.dbTableName ||
          (fmt === "nosql" ? "users_collection" : "users_table");
        updates.dbFields =
          Array.isArray(prev.dbFields) && prev.dbFields.length > 0
            ? prev.dbFields
            : fmt === "nosql"
              ? DEFAULT_NOSQL_FIELDS
              : DEFAULT_SQL_FIELDS;
        if (!prev.dbDescription) {
          updates.dbDescription = "Core database store for platform data persistence";
        }
        if (
          !prev.action ||
          prev.action === "Core Functionality" ||
          prev.action === "Landing Page / UI"
        ) {
          updates.action =
            fmt === "nosql" ? "Document / NoSQL Store" : "SQL Relational Store";
        }
        if (
          !prev.tech ||
          prev.tech.includes("Next.js") ||
          prev.tech.includes("React")
        ) {
          updates.tech = fmt === "nosql" ? "MongoDB" : "PostgreSQL";
          updates.protocol = fmt === "nosql" ? "Mongo Wire" : "Postgres Wire";
        }
      } else if (prev.role === "database") {
        // Reset role-specific defaults when switching away from database
        if (roleId === "frontend") {
          updates.name = (!prev.name || prev.name === prev.dbTableName || prev.name === "users_table" || prev.name === "users_collection" || prev.name === "Database") ? "Frontend UI" : prev.name;
          updates.action = "";
          updates.tech = "";
          updates.protocol = "HTTPS";
        } else if (roleId === "backend") {
          updates.name = (!prev.name || prev.name === prev.dbTableName || prev.name === "users_table" || prev.name === "users_collection" || prev.name === "Database") ? "Backend API" : prev.name;
          updates.action = "";
          updates.tech = "";
          updates.protocol = "HTTPS";
        } else if (roleId === "ai") {
          updates.name = (!prev.name || prev.name === prev.dbTableName || prev.name === "users_table" || prev.name === "users_collection" || prev.name === "Database") ? "AI Agent" : prev.name;
          updates.action = "Reasoning & Agent Decisions";
          updates.tech = "Claude 3.5 Sonnet";
          updates.protocol = "HTTPS Streaming";
        } else if (roleId === "custom") {
          updates.name = (!prev.name || prev.name === prev.dbTableName || prev.name === "users_table" || prev.name === "users_collection" || prev.name === "Database") ? "Custom Service" : prev.name;
          updates.action = "Custom Workflow Logic";
          updates.tech = "Custom Stack";
          updates.protocol = "HTTPS / gRPC";
        }
      }
      return updates;
    });
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalData = { ...formData };
    if (formData.role === "database") {
      finalData.name = formData.dbTableName || "Database";
      finalData.action = formData.dbFormat === "nosql" ? "NoSQL Document Store" : "SQL Relational Store";
      finalData.notes = formData.dbDescription || "";
    } else if (formData.role === "frontend" || formData.role === "backend") {
      finalData.action = "";
      finalData.tech = "";
    }
    updateFormData(finalData);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-[#ffdf27]" />
          <h3 className="text-xs font-bold text-foreground">Node Controls</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] font-mono text-[#ffee72] border-[#ffdf27]/30 bg-[#ffc507]/10 uppercase">
            {formData.role}
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

      {/* Role Selector: Frontend, Backend, Database, AI, Custom */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Node Role / Category</label>
        <div className="grid grid-cols-5 gap-1 p-1 bg-muted/60 rounded-lg border border-border/60">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isActive = formData.role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleChange(r.id)}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Component Label and Action (Action hidden for database, frontend, and backend) */}
      {formData.role !== "database" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Component Label</label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Landing Page, Products DB, Auth API"
              className="h-8 text-xs font-medium"
            />
          </div>

          {(formData.role === "frontend" || formData.role === "backend") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Font & Node Size</label>
                <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold">
                  {formData.fontSize || "base"}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 p-1 bg-muted/60 rounded-lg border border-border/60">
                {[
                  { id: "sm", label: "Small" },
                  { id: "base", label: "Normal" },
                  { id: "lg", label: "Large" },
                  { id: "xl", label: "Title" },
                ].map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => handleChange("fontSize", size.id)}
                    className={`py-1 px-2 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      (formData.fontSize || "base") === size.id
                        ? "bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formData.role !== "frontend" && formData.role !== "backend" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">What this node does / Action</label>
              <Input
                value={formData.action}
                onChange={(e) => handleChange("action", e.target.value)}
                placeholder="e.g. User auth service, core processing..."
                className="h-8 text-xs font-medium"
              />
            </div>
          )}
        </>
      )}

      {/* Contextual Database Controls: SQL vs NoSQL, Table/Document Name, Data Fields, Description */}
      {formData.role === "database" && (
        <div className="space-y-3 p-3 rounded-xl bg-muted/40 border border-border">
          {/* Header */}
          <div className="flex items-center justify-between pb-1 border-b border-border/60">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-bold">
              <Database className="h-3.5 w-3.5 text-foreground" />
              Database Options
            </span>
            <Badge variant="outline" className="text-[9px] font-mono text-foreground border-border uppercase">
              {formData.dbFormat || "sql"}
            </Badge>
          </div>

          {/* 1. Two Options: SQL or NoSQL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Select Database Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSwitchDbFormat("sql")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  formData.dbFormat === "sql"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-xs"
                    : "bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted"
                }`}
              >
                <Table2 className="h-4 w-4" />
                <span>SQL</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchDbFormat("nosql")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  formData.dbFormat === "nosql"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-xs"
                    : "bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted"
                }`}
              >
                <Braces className="h-4 w-4" />
                <span>NoSQL</span>
              </button>
            </div>
          </div>

          {/* 2. Table or Document Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {formData.dbFormat === "sql" ? "Table Name" : "Document / Collection Name"}
            </label>
            <Input
              value={formData.dbTableName || ""}
              onChange={(e) => handleChange("dbTableName", e.target.value)}
              placeholder={formData.dbFormat === "sql" ? "e.g. users, orders, products" : "e.g. users_collection, orders_doc"}
              className="h-8 text-xs font-mono font-medium"
            />
          </div>

          {/* 3. Direct Code / Query Editor for SQL or NoSQL */}
          <div className="space-y-2 pt-1 border-t border-border/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                {formData.dbFormat === "sql"
                  ? "SQL Query / Schema (CREATE, INSERT, etc.)"
                  : "NoSQL JSON Document / Data"}
              </label>
              <span className="text-[9px] font-mono text-muted-foreground font-semibold">
                Visible inside node
              </span>
            </div>

            {/* Quick Template Insert Pills */}
            <div className="flex flex-wrap gap-1">
              {formData.dbFormat === "sql" ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      handleChange(
                        "dbData",
                        `CREATE TABLE ${formData.dbTableName || "users"} (\n  id UUID PRIMARY KEY,\n  email VARCHAR(255) UNIQUE NOT NULL,\n  role VARCHAR(50) DEFAULT 'user',\n  created_at TIMESTAMP DEFAULT NOW()\n);`
                      )
                    }
                    className="text-[9.5px] px-2 py-0.5 rounded bg-card hover:bg-muted text-foreground border border-border cursor-pointer transition-colors"
                  >
                    + CREATE TABLE
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleChange(
                        "dbData",
                        `INSERT INTO ${formData.dbTableName || "users"} (email, role)\nVALUES ('alex@example.com', 'admin');`
                      )
                    }
                    className="text-[9.5px] px-2 py-0.5 rounded bg-card hover:bg-muted text-foreground border border-border cursor-pointer transition-colors"
                  >
                    + INSERT INTO
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleChange(
                        "dbData",
                        `SELECT id, email, role\nFROM ${formData.dbTableName || "users"}\nWHERE role = 'user'\nORDER BY created_at DESC;`
                      )
                    }
                    className="text-[9.5px] px-2 py-0.5 rounded bg-card hover:bg-muted text-foreground border border-border cursor-pointer transition-colors"
                  >
                    + SELECT Query
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      handleChange(
                        "dbData",
                        `{\n  "collection": "${formData.dbTableName || "users"}",\n  "document": {\n    "_id": "usr_902",\n    "email": "user@example.com",\n    "role": "customer",\n    "status": "active"\n  }\n}`
                      )
                    }
                    className="text-[9.5px] px-2 py-0.5 rounded bg-card hover:bg-muted text-foreground border border-border cursor-pointer transition-colors"
                  >
                    + Single Document
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleChange(
                        "dbData",
                        `[\n  {\n    "id": 1,\n    "sku": "ITEM-101",\n    "name": "Mechanical Keyboard",\n    "price": 129.99\n  },\n  {\n    "id": 2,\n    "sku": "ITEM-102",\n    "name": "Wireless Mouse",\n    "price": 49.99\n  }\n]`
                      )
                    }
                    className="text-[9.5px] px-2 py-0.5 rounded bg-card hover:bg-muted text-foreground border border-border cursor-pointer transition-colors"
                  >
                    + Document Array
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleChange(
                        "dbData",
                        `{\n  "key": "session:user_token_99",\n  "type": "hash",\n  "ttl": 3600,\n  "data": { "userId": "usr_902", "role": "admin" }\n}`
                      )
                    }
                    className="text-[9.5px] px-2 py-0.5 rounded bg-card hover:bg-muted text-foreground border border-border cursor-pointer transition-colors"
                  >
                    + Key-Value Record
                  </button>
                </>
              )}
            </div>

            {/* Code/Query Textarea */}
            <Textarea
              value={formData.dbData || ""}
              onChange={(e) => handleChange("dbData", e.target.value)}
              placeholder={
                formData.dbFormat === "sql"
                  ? "CREATE TABLE users (\n  id UUID PRIMARY KEY,\n  email VARCHAR(255)\n);"
                  : '{\n  "id": "item_1",\n  "name": "example"\n}'
              }
              className="text-xs font-mono min-h-[140px] resize-y bg-zinc-950 text-zinc-100 border-zinc-800 leading-relaxed scrollbar-thin"
            />
          </div>

          {/* 4. Write Description (Hidden from node, ONLY visible in Node Controls) */}
          <div className="space-y-1.5 pt-1 border-t border-border/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Database Description
              </label>
              <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                Inspector only (hidden from node)
              </span>
            </div>
            <Textarea
              value={formData.dbDescription || ""}
              onChange={(e) => {
                handleChange("dbDescription", e.target.value);
                handleChange("notes", e.target.value);
              }}
              placeholder="e.g. High-concurrency customer profiles and credentials store..."
              className="text-xs min-h-[65px] resize-y"
            />
          </div>
        </div>
      )}

      {formData.role === "ai" && (
        <div className="space-y-1.5 p-2 rounded-lg bg-muted/40 border border-border">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
            AI Model Presets
          </span>
          <div className="flex flex-wrap gap-1">
            {[
              { label: "Claude 3.5 Sonnet", action: "Reasoning & Agent Decisions", tech: "Anthropic API", latency: "380ms", protocol: "HTTPS Streaming" },
              { label: "OpenAI GPT-4o", action: "Multimodal LLM Agent", tech: "OpenAI API", latency: "420ms", protocol: "HTTPS Streaming" },
              { label: "RAG & Vector Agent", action: "Semantic Context Retrieval", tech: "Vector DB + LLM", latency: "250ms", protocol: "gRPC / HTTPS" },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    name: prev.name === "New Component" || prev.name === "AI Agent" ? preset.label : prev.name,
                    action: preset.action,
                    tech: preset.tech,
                    protocol: preset.protocol,
                    latency: preset.latency,
                  }));
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-[#ffdf27]/40 transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Technology, Protocol, Latency, and Architecture Notes (hidden for database, frontend, and backend) */}
      {formData.role !== "database" && (
        <>
          {formData.role !== "frontend" && formData.role !== "backend" && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Technology / Framework</label>
                <Input
                  value={formData.tech}
                  onChange={(e) => handleChange("tech", e.target.value)}
                  placeholder="e.g. Next.js, Go, Python, Claude 3.5"
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Protocol</label>
                  <Select
                    value={formData.protocol}
                    onValueChange={(val) => handleChange("protocol", val)}
                  >
                    <SelectTrigger className="h-8 text-xs font-mono">
                      <SelectValue placeholder="Protocol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HTTPS">HTTPS</SelectItem>
                      <SelectItem value="HTTP/2 / HTTP/3">HTTP/2 / HTTP/3</SelectItem>
                      <SelectItem value="gRPC / Protobuf">gRPC / Protobuf</SelectItem>
                      <SelectItem value="WebSocket">WebSocket</SelectItem>
                      <SelectItem value="Kafka Binary">Kafka Binary</SelectItem>
                      <SelectItem value="TCP / UDP">TCP / UDP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Est. Latency / SLA</label>
                  <Input
                    value={formData.latency}
                    onChange={(e) => handleChange("latency", e.target.value)}
                    placeholder="e.g. 5.0ms"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Architecture Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="e.g. Handles checkout requests and sends confirmation emails..."
              className="text-xs min-h-[60px] resize-none"
            />
          </div>
        </>
      )}

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
          className="h-8 ml-auto text-xs font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none shadow-xs cursor-pointer"
        >
          <Save className="h-3.5 w-3.5 mr-1 text-zinc-950" />
          Apply Changes
        </Button>
      </div>
    </form>
  );
}
