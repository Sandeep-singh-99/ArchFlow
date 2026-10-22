import { Handle, Position } from "@xyflow/react";
import { Layout, Cpu, Database, Bot, Sparkles, Table2, Braces, Key } from "lucide-react";
import React from "react";

interface SqlColumn {
  name: string;
  type: string;
  isPk?: boolean;
}

function parseSqlData(rawSql?: string, dbFields?: any[]): SqlColumn[] {
  const fallbackCols: SqlColumn[] =
    Array.isArray(dbFields) && dbFields.length > 0
      ? dbFields.map((f: any) => ({
          name: f.name || f.key || "column",
          type: f.type || "VARCHAR",
          isPk: Boolean(
            f.isPk ||
            f.name?.toLowerCase() === "id" ||
            f.type?.toUpperCase().includes("PRIMARY")
          ),
        }))
      : [
          { name: "id", type: "UUID PRIMARY KEY", isPk: true },
          { name: "email", type: "VARCHAR(255) UNIQUE" },
          { name: "created_at", type: "TIMESTAMP DEFAULT NOW()" },
        ];

  if (!rawSql || !rawSql.trim()) {
    return fallbackCols;
  }

  const text = rawSql.trim();

  // 1. Check for SELECT statement: SELECT col1, col2, col3 FROM ...
  const selectMatch = text.match(/SELECT\s+([\s\S]+?)\s+FROM/i);
  if (selectMatch) {
    const rawCols = selectMatch[1].split(",");
    const cols: SqlColumn[] = rawCols
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
      .map((c) => {
        const aliasMatch = c.match(/(?:AS\s+)?([\w`"']+)$/i);
        const name = (aliasMatch ? aliasMatch[1] : c).replace(/['"`]/g, "");
        const isPk = name.toLowerCase() === "id";
        return {
          name,
          type: "FIELD",
          isPk,
        };
      });
    if (cols.length > 0) return cols;
  }

  // 2. Check for INSERT INTO ... (col1, col2, ...) VALUES (val1, val2, ...)
  const insertMatch = text.match(
    /INSERT\s+INTO\s+[\w`"'.]+\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i
  );
  if (insertMatch) {
    const colNames = insertMatch[1].split(",").map((s) => s.trim().replace(/['"`]/g, ""));
    const colVals = insertMatch[2].split(",").map((s) => s.trim().replace(/['"`]/g, ""));
    const cols: SqlColumn[] = colNames.map((name, idx) => ({
      name,
      type: colVals[idx] || "VALUE",
      isPk: name.toLowerCase() === "id",
    }));
    if (cols.length > 0) return cols;
  }

  // 3. Check for CREATE TABLE ... (...)
  const createTableMatch = text.match(/CREATE\s+TABLE\s+[\w`"'.]+\s*\(([\s\S]+)\)/i);
  const content = createTableMatch ? createTableMatch[1] : text;

  // Split lines respecting parentheses (so DECIMAL(10, 2) is not split)
  const rawSegments: string[] = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === "(") depth++;
    else if (char === ")") depth = Math.max(0, depth - 1);

    if ((char === "," || char === "\n") && depth === 0) {
      if (current.trim()) rawSegments.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) rawSegments.push(current.trim());

  const lines = rawSegments.filter(
    (l) =>
      l.length > 0 &&
      !l.startsWith("--") &&
      !l.startsWith("/*") &&
      !l.toUpperCase().startsWith("CONSTRAINT") &&
      !l.toUpperCase().startsWith("FOREIGN KEY")
  );

  const cols: SqlColumn[] = [];
  const primaryKeyCols: string[] = [];

  // Find standalone PRIMARY KEY (col1, col2)
  for (const line of lines) {
    const pkMatch = line.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
    if (pkMatch) {
      pkMatch[1]
        .split(",")
        .forEach((c) => primaryKeyCols.push(c.trim().replace(/['"`]/g, "").toLowerCase()));
    }
  }

  for (const line of lines) {
    if (line.toUpperCase().startsWith("PRIMARY KEY")) continue;

    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      const colName = parts[0].replace(/['"`]/g, "");
      const isPkInline =
        line.toUpperCase().includes("PRIMARY KEY") ||
        colName.toLowerCase() === "id" ||
        primaryKeyCols.includes(colName.toLowerCase());
      const rest = parts.slice(1).join(" ").replace(/PRIMARY\s+KEY/i, "").trim();
      cols.push({
        name: colName,
        type: rest || "VARCHAR",
        isPk: isPkInline,
      });
    } else if (parts.length === 1 && parts[0]) {
      const colName = parts[0].replace(/['"`]/g, "");
      cols.push({
        name: colName,
        type: "FIELD",
        isPk: colName.toLowerCase() === "id" || primaryKeyCols.includes(colName.toLowerCase()),
      });
    }
  }

  return cols.length > 0 ? cols : fallbackCols;
}

interface NoSqlEntry {
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "object" | "array" | "id";
}

function parseNoSqlData(rawJson?: string, dbFields?: any[]): NoSqlEntry[] {
  const fallbackEntries: NoSqlEntry[] =
    Array.isArray(dbFields) && dbFields.length > 0
      ? dbFields.map((f: any) => ({
          key: f.name || f.key || "field",
          value: f.type || "string",
          type: (f.name?.toLowerCase().includes("id") || f.name?.startsWith("_")
            ? "id"
            : f.type?.toLowerCase() === "number"
            ? "number"
            : f.type?.toLowerCase() === "boolean"
            ? "boolean"
            : "string") as any,
        }))
      : [
          { key: "_id", value: "usr_01", type: "id" },
          { key: "username", value: "alex_doe", type: "string" },
          { key: "is_active", value: "true", type: "boolean" },
        ];

  if (!rawJson || !rawJson.trim()) {
    return fallbackEntries;
  }

  try {
    let parsed = JSON.parse(rawJson);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      if (parsed.document && typeof parsed.document === "object") {
        parsed = parsed.document;
      } else if (parsed.doc && typeof parsed.doc === "object") {
        parsed = parsed.doc;
      } else if (parsed.data && typeof parsed.data === "object" && !Array.isArray(parsed.data)) {
        parsed = parsed.data;
      }
    } else if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
      parsed = parsed[0];
    }

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const entries = Object.entries(parsed).map(([key, val]) => {
        if (val === null || val === undefined) {
          return { key, value: "null", type: "string" as const };
        }
        if (typeof val === "boolean") {
          return { key, value: String(val), type: "boolean" as const };
        }
        if (typeof val === "number") {
          return { key, value: String(val), type: "number" as const };
        }
        if (Array.isArray(val)) {
          return { key, value: `[${val.length} items]`, type: "array" as const };
        }
        if (typeof val === "object") {
          return { key, value: "{...}", type: "object" as const };
        }
        const valStr = String(val);
        const isId = key.toLowerCase().includes("id") || key.startsWith("_");
        return { key, value: valStr, type: isId ? ("id" as const) : ("string" as const) };
      });
      if (entries.length > 0) return entries;
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
            type: k.toLowerCase().includes("id") || k.startsWith("_") ? "id" : "string",
          });
        }
      }
    }
    if (entries.length > 0) return entries;
  }

  return fallbackEntries;
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

  const isDatabase = roleKey === "database" || data?.type === "DatabaseNode";
  const dbFormat = (
    data?.settings?.dbFormat ||
    (data?.settings?.tech?.toLowerCase().includes("mongo") || data?.settings?.action?.toLowerCase().includes("nosql") ? "nosql" : "sql")
  ).toLowerCase();

  const tableName = data?.settings?.dbTableName || (dbFormat === "nosql" ? "collection_data" : "table_data");

  const sqlColumns = isDatabase && dbFormat === "sql" ? parseSqlData(data?.settings?.dbData, data?.settings?.dbFields) : [];
  const nosqlEntries = isDatabase && dbFormat === "nosql" ? parseNoSqlData(data?.settings?.dbData, data?.settings?.dbFields) : [];
  const fieldCount = dbFormat === "sql" ? sqlColumns.length : nosqlEntries.length;

  const label = isDatabase
    ? (data?.settings?.dbTableName || data?.label || data?.settings?.name || "Database")
    : (data?.settings?.name || data?.label || "Custom Component");

  const action = isDatabase
    ? (data?.settings?.action && !data?.settings?.action.includes("Landing") && !data?.settings?.action.includes("UI")
        ? data.settings.action
        : (dbFormat === "nosql" ? "NoSQL Document Store" : "SQL Relational Store"))
    : (data?.settings?.action || data?.settings?.rendering || data?.settings?.latency || "Active Component");

  const tech = isDatabase
    ? (data?.settings?.tech && !data?.settings?.tech.includes("Next") && !data?.settings?.tech.includes("React")
        ? data.settings.tech
        : (dbFormat === "nosql" ? "NoSQL Database" : "SQL Database"))
    : (data?.settings?.tech || (roleKey === "frontend" ? "" : "Custom Stack"));

  // Dynamically size container width for database schema nodes so field names & types are never hidden or cramped
  const containerClasses = isDatabase
    ? `relative rounded-xl border border-border bg-card p-3.5 shadow-md min-w-[280px] sm:min-w-[320px] max-w-[440px] w-auto transition-all group hover:${config.border}`
    : `relative rounded-xl border border-border bg-card p-3.5 shadow-sm min-w-[240px] max-w-[300px] transition-colors group hover:${config.border}`;

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-2.5">
        <div className={`h-8 w-8 rounded-lg ${config.bg} ${config.color} flex items-center justify-center border ${config.border} shrink-0`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-foreground truncate">{label}</h3>
          {tech ? (
            <p className="text-[10px] font-mono text-muted-foreground truncate">{tech}</p>
          ) : null}
        </div>
      </div>

      {/* Database Schema / Data Display inside Node (Clean Structured Table or Document, NOT raw) */}
      {isDatabase && (
        <div className="mt-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-inner">
          {/* Header */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[9px] font-mono">
            <span className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {dbFormat === "nosql" ? (
                <Braces className="h-3 w-3 text-zinc-700 dark:text-zinc-300 shrink-0" />
              ) : (
                <Table2 className="h-3 w-3 text-zinc-700 dark:text-zinc-300 shrink-0" />
              )}
              <span className="truncate" title={tableName}>{tableName}</span>
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800/80">
                {fieldCount} {fieldCount === 1 ? "field" : "fields"}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700">
                {dbFormat}
              </span>
            </div>
          </div>

          {/* SQL Structured View (Columns & Types) - DYNAMIC HEIGHT TO FIT ALL FIELDS */}
          {dbFormat === "sql" && (
            <div className="bg-zinc-50 dark:bg-zinc-950 p-1.5">
              <div className="flex items-center justify-between px-2 py-0.5 text-[8px] uppercase tracking-wider font-bold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800/80 mb-1">
                <span>Column</span>
                <span>Type</span>
              </div>
              <div className="space-y-1 max-h-[500px] overflow-y-auto scrollbar-thin transition-all">
                {sqlColumns.map((col, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-2 py-1 rounded hover:bg-zinc-200/50 dark:hover:bg-zinc-900 transition-colors gap-2"
                  >
                    <span
                      className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate text-[10px] min-w-0"
                      title={col.name}
                    >
                      {col.isPk ? (
                        <Key className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600 text-[8px]">•</span>
                      )}
                      <span className="truncate">{col.name}</span>
                    </span>
                    <span
                      className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium shrink-0 text-right"
                      title={col.type}
                    >
                      {col.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NoSQL Structured View (Document Fields & Typed Values) - DYNAMIC HEIGHT TO FIT ALL FIELDS */}
          {dbFormat === "nosql" && (
            <div className="bg-zinc-50 dark:bg-zinc-950 p-1.5">
              <div className="flex items-center justify-between px-2 py-0.5 text-[8px] uppercase tracking-wider font-bold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800/80 mb-1">
                <span>Field</span>
                <span>Value</span>
              </div>
              <div className="space-y-1 max-h-[500px] overflow-y-auto scrollbar-thin transition-all">
                {nosqlEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-2 py-1 rounded hover:bg-zinc-200/50 dark:hover:bg-zinc-900 transition-colors gap-2"
                  >
                    <span
                      className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate text-[10px] min-w-0"
                      title={entry.key}
                    >
                      <span className="text-zinc-400 dark:text-zinc-600 text-[8px] font-mono">•</span>
                      <span className="truncate">{entry.key}</span>
                    </span>
                    <span
                      title={entry.value}
                      className={`font-mono text-[9px] px-1.5 py-0.5 rounded border shrink-0 font-medium text-right ${
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

      {roleKey !== "frontend" && (
        <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span className="capitalize font-semibold text-foreground/80">{roleKey}</span>
          {action ? (
            <span className={`font-semibold ${config.color} truncate max-w-[130px]`}>{action}</span>
          ) : null}
        </div>
      )}

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
