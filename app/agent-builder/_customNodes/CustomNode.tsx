import { Handle, Position } from "@xyflow/react";
import { Layout, Cpu, Database, Bot, Sparkles, Table2, Braces, Key } from "lucide-react";
import React from "react";

interface SqlColumn {
  name: string;
  type: string;
  isPk?: boolean;
}

function parseSqlData(rawSql?: string): SqlColumn[] {
  if (!rawSql || !rawSql.trim()) {
    return [
      { name: "id", type: "UUID", isPk: true },
      { name: "created_at", type: "TIMESTAMP" },
    ];
  }

  const text = rawSql.trim();
  const createTableMatch = text.match(/CREATE\s+TABLE\s+[\w`"'.]+\s*\(([\s\S]+)\)/i);
  const content = createTableMatch ? createTableMatch[1] : text;

  const lines = content
    .split(/[\n,]+/)
    .map((l) => l.trim().replace(/^,+|,+$/g, ""))
    .filter(
      (l) =>
        l.length > 0 &&
        !l.startsWith("--") &&
        !l.startsWith("/*") &&
        !l.toUpperCase().startsWith("PRIMARY KEY (") &&
        !l.toUpperCase().startsWith("CONSTRAINT")
    );

  const cols: SqlColumn[] = [];

  for (const line of lines) {
    const insertMatch = line.match(/INSERT\s+INTO\s+[\w`"'.]+\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (insertMatch) {
      const colNames = insertMatch[1].split(",").map((s) => s.trim().replace(/['"`]/g, ""));
      const colVals = insertMatch[2].split(",").map((s) => s.trim().replace(/['"`]/g, ""));
      colNames.forEach((c, idx) => {
        cols.push({ name: c, type: colVals[idx] || "VALUE" });
      });
      break;
    }

    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      const colName = parts[0].replace(/['"`]/g, "");
      const isPk = line.toUpperCase().includes("PRIMARY KEY") || colName.toLowerCase() === "id";
      const rest = parts.slice(1).join(" ").replace(/PRIMARY\s+KEY/i, "").trim();
      cols.push({
        name: colName,
        type: rest || "VARCHAR",
        isPk,
      });
    } else if (parts.length === 1 && parts[0]) {
      cols.push({
        name: parts[0].replace(/['"`]/g, ""),
        type: "FIELD",
        isPk: parts[0].toLowerCase() === "id",
      });
    }
  }

  return cols.length > 0
    ? cols
    : [
        { name: "id", type: "UUID", isPk: true },
        { name: "record", type: "DATA" },
      ];
}

interface NoSqlEntry {
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "object" | "array" | "id";
}

function parseNoSqlData(rawJson?: string): NoSqlEntry[] {
  if (!rawJson || !rawJson.trim()) {
    return [
      { key: "_id", value: "usr_01", type: "id" },
      { key: "status", value: "active", type: "string" },
    ];
  }

  try {
    let parsed = JSON.parse(rawJson);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      if (parsed.document && typeof parsed.document === "object") {
        parsed = parsed.document;
      } else if (parsed.doc && typeof parsed.doc === "object") {
        parsed = parsed.doc;
      }
    } else if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
      parsed = parsed[0];
    }

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed).map(([key, val]) => {
        if (val === null || val === undefined) {
          return { key, value: "null", type: "string" };
        }
        if (typeof val === "boolean") {
          return { key, value: String(val), type: "boolean" };
        }
        if (typeof val === "number") {
          return { key, value: String(val), type: "number" };
        }
        if (Array.isArray(val)) {
          return { key, value: `[${val.length} items]`, type: "array" };
        }
        if (typeof val === "object") {
          return { key, value: "{object}", type: "object" };
        }
        const valStr = String(val);
        const isId = key.toLowerCase().includes("id");
        return { key, value: valStr, type: isId ? "id" : "string" };
      });
    }
  } catch {
    const lines = rawJson.split("\n").filter((l) => l.includes(":"));
    const entries: NoSqlEntry[] = [];
    for (const line of lines) {
      const idx = line.indexOf(":");
      if (idx !== -1) {
        const k = line.substring(0, idx).replace(/[{}[\],"'`]/g, "").trim();
        const v = line.substring(idx + 1).replace(/[{}[\],"'`]/g, "").trim();
        if (k && k !== "collection") {
          entries.push({
            key: k,
            value: v || "—",
            type: k.toLowerCase().includes("id") ? "id" : "string",
          });
        }
      }
    }
    if (entries.length > 0) return entries;
  }

  return [
    { key: "_id", value: "doc_id", type: "id" },
    { key: "data", value: "record", type: "string" },
  ];
}

const ROLE_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  frontend: {
    icon: Layout,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },
  backend: {
    icon: Cpu,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  database: {
    icon: Database,
    color: "text-zinc-900 dark:text-zinc-100",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    border: "border-zinc-300 dark:border-zinc-700",
  },
  ai: {
    icon: Bot,
    color: "text-[#ffee72]",
    bg: "bg-[#ffc507]/10",
    border: "border-[#ffdf27]/30",
  },
  custom: {
    icon: Sparkles,
    color: "text-[#ffee72]",
    bg: "bg-[#ffc507]/10",
    border: "border-[#ffdf27]/30",
  },
};

export default function CustomNode({ data }: any) {
  const roleKey = (data?.settings?.role || data?.type?.replace("Node", "") || "custom").toLowerCase();
  const config = ROLE_CONFIG[roleKey] || ROLE_CONFIG.custom;
  const Icon = config.icon;

  const isDatabase = roleKey === "database" || Boolean(data?.settings?.dbTableName) || Boolean(data?.settings?.dbData);
  const dbFormat = (
    data?.settings?.dbFormat ||
    (data?.settings?.tech?.toLowerCase().includes("mongo") || data?.settings?.action?.toLowerCase().includes("nosql") ? "nosql" : "sql")
  ).toLowerCase();

  const tableName = data?.settings?.dbTableName || (dbFormat === "nosql" ? "collection_data" : "table_data");

  const sqlColumns = dbFormat === "sql" ? parseSqlData(data?.settings?.dbData) : [];
  const nosqlEntries = dbFormat === "nosql" ? parseNoSqlData(data?.settings?.dbData) : [];

  const label = isDatabase
    ? (data?.settings?.dbTableName || data?.label || "Database")
    : (data?.label || data?.settings?.name || "Custom Component");

  const action = isDatabase
    ? (dbFormat === "nosql" ? "NoSQL Document Store" : "SQL Relational Store")
    : (data?.settings?.action || data?.settings?.rendering || data?.settings?.latency || "Active Component");

  const tech = isDatabase
    ? (dbFormat === "nosql" ? "NoSQL Database" : "SQL Database")
    : (data?.settings?.tech || "Custom Stack");

  return (
    <div className={`relative rounded-xl border border-border bg-card p-3.5 shadow-sm min-w-[240px] max-w-[300px] hover:${config.border} transition-colors group`}>
      <div className="flex items-center gap-2.5">
        <div className={`h-8 w-8 rounded-lg ${config.bg} ${config.color} flex items-center justify-center border ${config.border} shrink-0`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-foreground truncate">{label}</h3>
          <p className="text-[10px] font-mono text-muted-foreground truncate">{tech}</p>
        </div>
      </div>

      {/* Database Schema / Data Display inside Node (Clean Structured Table or Document, NOT raw) */}
      {isDatabase && (
        <div className="mt-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-inner">
          {/* Header */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[9px] font-mono">
            <span className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[170px]">
              {dbFormat === "nosql" ? (
                <Braces className="h-3 w-3 text-zinc-700 dark:text-zinc-300 shrink-0" />
              ) : (
                <Table2 className="h-3 w-3 text-zinc-700 dark:text-zinc-300 shrink-0" />
              )}
              <span className="truncate">{tableName}</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 shrink-0">
              {dbFormat}
            </span>
          </div>

          {/* SQL Structured View (Columns & Types) */}
          {dbFormat === "sql" && (
            <div className="bg-zinc-50 dark:bg-zinc-950 p-1.5">
              <div className="flex items-center justify-between px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-bold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800/80 mb-1">
                <span>Column</span>
                <span>Type</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                {sqlColumns.map((col, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-1.5 py-1 rounded hover:bg-zinc-200/50 dark:hover:bg-zinc-900 transition-colors gap-2"
                  >
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate text-[9.5px]">
                      {col.isPk ? (
                        <Key className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600 text-[8px]">•</span>
                      )}
                      <span className="truncate">{col.name}</span>
                    </span>
                    <span className="font-mono text-[8.5px] px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[110px] text-right">
                      {col.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NoSQL Structured View (Document Fields & Typed Values) */}
          {dbFormat === "nosql" && (
            <div className="bg-zinc-50 dark:bg-zinc-950 p-1.5">
              <div className="flex items-center justify-between px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-bold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800/80 mb-1">
                <span>Field</span>
                <span>Value</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                {nosqlEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-1.5 py-1 rounded hover:bg-zinc-200/50 dark:hover:bg-zinc-900 transition-colors gap-2"
                  >
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate text-[9.5px]">
                      <span className="text-zinc-400 dark:text-zinc-600 text-[8px] font-mono">•</span>
                      <span className="truncate">{entry.key}</span>
                    </span>
                    <span
                      className={`font-mono text-[8.5px] px-1.5 py-0.5 rounded border max-w-[115px] truncate font-medium text-right ${
                        entry.type === "boolean"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : entry.type === "number"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          : entry.type === "id"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                          : "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300/60 dark:border-zinc-700"
                      }`}
                    >
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span className="capitalize font-semibold text-foreground/80">{roleKey}</span>
        <span className={`font-semibold ${config.color} truncate max-w-[130px]`}>{action}</span>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="left"
        isConnectableStart={true}
        isConnectableEnd={true}
        className="w-3.5 h-3.5 rounded-full bg-zinc-400 dark:bg-zinc-500 border-2 border-background hover:scale-125 hover:bg-[#ffdf27] transition-all cursor-crosshair z-30"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        isConnectableStart={true}
        isConnectableEnd={true}
        className="w-3.5 h-3.5 rounded-full bg-[#ffdf27] border-2 border-background hover:scale-125 hover:bg-[#ffee72] transition-all cursor-crosshair z-30"
      />
    </div>
  );
}
