/**
 * SQL DDL Exporter for Database Schema Studio
 * Generates executable, production-grade PostgreSQL and MySQL DDL.
 */

export interface SqlExportOptions {
  dialect: "postgresql" | "mysql";
  includeComments?: boolean;
  includeDropIfExists?: boolean;
  schemaName?: string;
}

export function exportSqlDdl(
  nodes: any[] = [],
  edges: any[] = [],
  options: SqlExportOptions = { dialect: "postgresql" }
): string {
  const { dialect, includeComments = true, includeDropIfExists = false } = options;

  if (dialect === "mysql") {
    return generateMysqlDdl(nodes, edges, { includeComments, includeDropIfExists });
  }

  return generatePostgresDdl(nodes, edges, { includeComments, includeDropIfExists });
}

// =========================================================================
// PostgreSQL DDL Generator
// =========================================================================

function extractTableColumns(t: any): any[] {
  if (Array.isArray(t.data?.columns) && t.data.columns.length > 0) {
    return t.data.columns;
  }
  if (Array.isArray(t.data?.fields) && t.data.fields.length > 0) {
    return t.data.fields.map((f: any, idx: number) => {
      const typeLower = (f.type || "").toLowerCase();
      let sqlType = "VARCHAR(255)";
      if (typeLower.includes("objectid")) sqlType = "UUID";
      else if (typeLower.includes("int")) sqlType = "INTEGER";
      else if (typeLower.includes("date") || typeLower.includes("time")) sqlType = "TIMESTAMPTZ";
      else if (typeLower.includes("bool")) sqlType = "BOOLEAN";
      else if (typeLower.includes("double") || typeLower.includes("float") || typeLower.includes("numeric")) sqlType = "DOUBLE PRECISION";
      else if (typeLower.includes("array") || typeLower.includes("object") || typeLower.includes("json")) sqlType = "JSONB";

      return {
        id: String(idx),
        name: f.name,
        type: sqlType,
        isPk: f.name === "_id" || f.name === "id",
        isNullable: !f.required,
      };
    });
  }
  return [
    { id: "1", name: "id", type: "UUID", isPk: true, isNullable: false },
    { id: "2", name: "created_at", type: "TIMESTAMPTZ", isNullable: false },
  ];
}

function generatePostgresDdl(
  nodes: any[],
  edges: any[],
  { includeComments, includeDropIfExists }: { includeComments: boolean; includeDropIfExists: boolean }
): string {
  const lines: string[] = [];

  const timestamp = new Date().toISOString();
  lines.push(`-- =========================================================================`);
  lines.push(`-- Database Schema DDL (PostgreSQL 16+)`);
  lines.push(`-- Generated: ${timestamp}`);
  lines.push(`-- Generated via Database Schema Studio`);
  lines.push(`-- =========================================================================\n`);

  lines.push(`-- Enable common extensions`);
  lines.push(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
  lines.push(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n`);

  // 1. SCHEMAS
  const schemaNodes = nodes.filter(
    (n) => n.type === "DbSchemaNode" || n.type === "Database"
  );
  if (schemaNodes.length > 0) {
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`-- SCHEMAS / NAMESPACES`);
    lines.push(`-- -------------------------------------------------------------------------`);
    schemaNodes.forEach((s) => {
      const name = cleanIdentifier(s.data?.name || s.data?.label || "public");
      if (name !== "public") {
        lines.push(`CREATE SCHEMA IF NOT EXISTS ${name};`);
      }
    });
    lines.push("");
  }

  // 2. ENUMS
  const enumNodes = nodes.filter(
    (n) => n.type === "SqlEnumNode" || n.type === "Enum"
  );
  if (enumNodes.length > 0) {
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`-- ENUM TYPES`);
    lines.push(`-- -------------------------------------------------------------------------`);
    enumNodes.forEach((e) => {
      const enumName = cleanIdentifier(e.data?.name || e.data?.label || "custom_enum");
      const values: string[] = e.data?.values || ["default_value"];
      if (includeDropIfExists) {
        lines.push(`DROP TYPE IF EXISTS ${enumName} CASCADE;`);
      }
      lines.push(`CREATE TYPE ${enumName} AS ENUM (`);
      lines.push(values.map((v) => `  '${escapeSqlString(v)}'`).join(",\n"));
      lines.push(`);\n`);
    });
  }

  // 3. TABLES
  const tableNodes = nodes.filter(
    (n) => n.type === "SqlTableNode" || n.type === "Table" || n.type === "NosqlCollectionNode" || n.type === "Collection"
  );

  const tableMap = new Map<string, any>();
  tableNodes.forEach((t) => tableMap.set(t.id, t));

  if (tableNodes.length > 0) {
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`-- TABLES`);
    lines.push(`-- -------------------------------------------------------------------------`);

    tableNodes.forEach((t) => {
      const rawName = t.data?.name || t.data?.label || "untitled_table";
      const schemaName = t.data?.schema && t.data.schema !== "public" ? cleanIdentifier(t.data.schema) : "";
      const tableName = schemaName ? `${schemaName}.${cleanIdentifier(rawName)}` : cleanIdentifier(rawName);

      if (includeDropIfExists) {
        lines.push(`DROP TABLE IF EXISTS ${tableName} CASCADE;`);
      }

      const columns: any[] = extractTableColumns(t);

      lines.push(`CREATE TABLE ${tableName} (`);

      const colDefs: string[] = [];
      const primaryKeys: string[] = [];

      columns.forEach((col) => {
        const colName = cleanIdentifier(col.name);
        const colType = normalizePostgresType(col.type || "VARCHAR(255)");
        const parts: string[] = [`  ${colName} ${colType}`];

        if (col.isPk) {
          primaryKeys.push(colName);
          // If UUID PK, add default generator if not present
          if (colType.toUpperCase().includes("UUID") && !colType.toUpperCase().includes("DEFAULT")) {
            parts.push(`DEFAULT gen_random_uuid()`);
          } else if (colType.toUpperCase().includes("INT") && !colType.toUpperCase().includes("IDENTITY") && !colType.toUpperCase().includes("SERIAL")) {
            parts.push(`GENERATED ALWAYS AS IDENTITY`);
          }
        }

        if (!col.isNullable && !col.isPk) {
          parts.push("NOT NULL");
        }

        if (col.isUnique && !col.isPk) {
          parts.push("UNIQUE");
        }

        if (colName === "created_at" && !parts.some((p) => p.includes("DEFAULT"))) {
          parts.push("DEFAULT NOW()");
        } else if (colName === "updated_at" && !parts.some((p) => p.includes("DEFAULT"))) {
          parts.push("DEFAULT NOW()");
        }

        colDefs.push(parts.join(" "));
      });

      if (primaryKeys.length > 0) {
        colDefs.push(`  CONSTRAINT pk_${cleanIdentifier(rawName)} PRIMARY KEY (${primaryKeys.join(", ")})`);
      }

      lines.push(colDefs.join(",\n"));
      lines.push(`);\n`);

      if (includeComments && t.data?.comment) {
        lines.push(`COMMENT ON TABLE ${tableName} IS '${escapeSqlString(t.data.comment)}';\n`);
      }
    });
  }

  // 4. FOREIGN KEY CONSTRAINTS (from edges and column definitions)
  const fkConstraints = extractForeignKeys(tableNodes, edges, "postgresql");
  if (fkConstraints.length > 0) {
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`-- FOREIGN KEY CONSTRAINTS`);
    lines.push(`-- -------------------------------------------------------------------------`);
    fkConstraints.forEach((fk) => {
      lines.push(`ALTER TABLE ${fk.childTable}`);
      lines.push(`  ADD CONSTRAINT ${fk.constraintName}`);
      lines.push(`  FOREIGN KEY (${fk.childColumn})`);
      lines.push(`  REFERENCES ${fk.parentTable} (${fk.parentColumn})`);
      lines.push(`  ON UPDATE ${fk.onUpdate || "CASCADE"}`);
      lines.push(`  ON DELETE ${fk.onDelete || "CASCADE"};\n`);
    });
  }

  // 5. INDEXES
  const indexNodes = nodes.filter(
    (n) => n.type === "SqlIndexNode" || n.type === "Index"
  );
  if (indexNodes.length > 0) {
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`-- INDEXES`);
    lines.push(`-- -------------------------------------------------------------------------`);
    indexNodes.forEach((idx) => {
      const indexName = cleanIdentifier(idx.data?.name || idx.data?.label || "idx_table_col");
      const tableName = cleanIdentifier(idx.data?.tableName || "target_table");
      const isUnique = !!idx.data?.isUnique;
      const indexType = (idx.data?.indexType || "B-TREE").toUpperCase();
      const cols: string[] = idx.data?.columns || ["id"];

      const uniqueKw = isUnique ? "UNIQUE " : "";
      const usingKw = indexType && indexType !== "B-TREE" && indexType !== "UNIQUE" ? `USING ${indexType} ` : "";
      lines.push(`CREATE ${uniqueKw}INDEX IF NOT EXISTS ${indexName} ON ${tableName} ${usingKw}(${cols.join(", ")});`);
    });
    lines.push("");
  }

  // 6. VIEWS
  const viewNodes = nodes.filter(
    (n) => n.type === "SqlViewNode" || n.type === "View"
  );
  if (viewNodes.length > 0) {
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`-- VIEWS`);
    lines.push(`-- -------------------------------------------------------------------------`);
    viewNodes.forEach((v) => {
      const viewName = cleanIdentifier(v.data?.name || v.data?.label || "v_active_view");
      const isMaterialized = !!v.data?.isMaterialized;
      const query = v.data?.query?.trim() || "SELECT 1;";
      const matKw = isMaterialized ? "MATERIALIZED " : "";
      lines.push(`CREATE OR REPLACE ${matKw}VIEW ${viewName} AS`);
      lines.push(query.endsWith(";") ? query : `${query};`);
      lines.push("");
    });
  }

  return lines.join("\n");
}

// =========================================================================
// MySQL DDL Generator
// =========================================================================
function generateMysqlDdl(
  nodes: any[],
  edges: any[],
  { includeComments, includeDropIfExists }: { includeComments: boolean; includeDropIfExists: boolean }
): string {
  const lines: string[] = [];

  const timestamp = new Date().toISOString();
  lines.push(`-- =========================================================================`);
  lines.push(`-- Database Schema DDL (MySQL 8.0+)`);
  lines.push(`-- Generated: ${timestamp}`);
  lines.push(`-- Generated via Database Schema Studio`);
  lines.push(`-- =========================================================================\n`);

  lines.push(`SET FOREIGN_KEY_CHECKS = 0;\n`);

  // Tables
  const tableNodes = nodes.filter(
    (n) => n.type === "SqlTableNode" || n.type === "Table" || n.type === "NosqlCollectionNode" || n.type === "Collection"
  );

  if (tableNodes.length > 0) {
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`-- TABLES`);
    lines.push(`-- -------------------------------------------------------------------------`);

    tableNodes.forEach((t) => {
      const tableName = cleanIdentifier(t.data?.name || t.data?.label || "untitled_table");

      if (includeDropIfExists) {
        lines.push(`DROP TABLE IF EXISTS \`${tableName}\`;`);
      }

      const columns: any[] = extractTableColumns(t);

      lines.push(`CREATE TABLE \`${tableName}\` (`);

      const colDefs: string[] = [];
      const primaryKeys: string[] = [];

      columns.forEach((col) => {
        const colName = cleanIdentifier(col.name);
        const colType = normalizeMysqlType(col.type || "VARCHAR(255)");
        const parts: string[] = [`  \`${colName}\` ${colType}`];

        if (col.isPk) {
          primaryKeys.push(`\`${colName}\``);
          if (colType.toUpperCase().includes("INT") && !colType.toUpperCase().includes("AUTO_INCREMENT")) {
            parts.push("AUTO_INCREMENT");
          } else if (colType.toUpperCase().includes("CHAR(36)")) {
            parts.push("DEFAULT (UUID())");
          }
        }

        if (!col.isNullable && !col.isPk) {
          parts.push("NOT NULL");
        }

        if (col.isUnique && !col.isPk) {
          parts.push("UNIQUE");
        }

        if (colName === "created_at" && !parts.some((p) => p.includes("DEFAULT"))) {
          parts.push("DEFAULT CURRENT_TIMESTAMP");
        } else if (colName === "updated_at" && !parts.some((p) => p.includes("DEFAULT"))) {
          parts.push("DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        }

        colDefs.push(parts.join(" "));
      });

      if (primaryKeys.length > 0) {
        colDefs.push(`  PRIMARY KEY (${primaryKeys.join(", ")})`);
      }

      lines.push(colDefs.join(",\n"));
      const commentStr = includeComments && t.data?.comment ? ` COMMENT='${escapeSqlString(t.data.comment)}'` : "";
      lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci${commentStr};\n`);
    });
  }

  // Foreign keys
  const fkConstraints = extractForeignKeys(tableNodes, edges, "mysql");
  if (fkConstraints.length > 0) {
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`-- FOREIGN KEY CONSTRAINTS`);
    lines.push(`-- -------------------------------------------------------------------------`);
    fkConstraints.forEach((fk) => {
      lines.push(`ALTER TABLE \`${fk.childTable}\``);
      lines.push(`  ADD CONSTRAINT \`${fk.constraintName}\``);
      lines.push(`  FOREIGN KEY (\`${fk.childColumn}\`)`);
      lines.push(`  REFERENCES \`${fk.parentTable}\` (\`${fk.parentColumn}\`)`);
      lines.push(`  ON UPDATE ${fk.onUpdate || "CASCADE"}`);
      lines.push(`  ON DELETE ${fk.onDelete || "CASCADE"};\n`);
    });
  }

  // Indexes
  const indexNodes = nodes.filter(
    (n) => n.type === "SqlIndexNode" || n.type === "Index"
  );
  if (indexNodes.length > 0) {
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`-- INDEXES`);
    lines.push(`-- -------------------------------------------------------------------------`);
    indexNodes.forEach((idx) => {
      const indexName = cleanIdentifier(idx.data?.name || idx.data?.label || "idx_table_col");
      const tableName = cleanIdentifier(idx.data?.tableName || "target_table");
      const isUnique = !!idx.data?.isUnique;
      const cols: string[] = idx.data?.columns || ["id"];
      const formattedCols = cols.map((c) => `\`${cleanIdentifier(c.replace(/\s+(ASC|DESC)/i, ""))}\``).join(", ");

      const uniqueKw = isUnique ? "UNIQUE " : "";
      lines.push(`CREATE ${uniqueKw}INDEX \`${indexName}\` ON \`${tableName}\` (${formattedCols});`);
    });
    lines.push("");
  }

  // Views
  const viewNodes = nodes.filter(
    (n) => n.type === "SqlViewNode" || n.type === "View"
  );
  if (viewNodes.length > 0) {
    lines.push(`-- -------------------------------------------------------------------------`);
    lines.push(`-- VIEWS`);
    lines.push(`-- -------------------------------------------------------------------------`);
    viewNodes.forEach((v) => {
      const viewName = cleanIdentifier(v.data?.name || v.data?.label || "v_active_view");
      const query = v.data?.query?.trim() || "SELECT 1";
      lines.push(`CREATE OR REPLACE VIEW \`${viewName}\` AS`);
      lines.push(query.endsWith(";") ? query : `${query};`);
      lines.push("");
    });
  }

  lines.push(`SET FOREIGN_KEY_CHECKS = 1;`);

  return lines.join("\n");
}

// =========================================================================
// Helpers for FK Extraction & Normalization
// =========================================================================
interface ExtractedFk {
  constraintName: string;
  childTable: string;
  childColumn: string;
  parentTable: string;
  parentColumn: string;
  onUpdate?: string;
  onDelete?: string;
}

function extractForeignKeys(
  tableNodes: any[],
  edges: any[],
  dialect: "postgresql" | "mysql"
): ExtractedFk[] {
  const fks: ExtractedFk[] = [];
  const processed = new Set<string>();

  const tableById = new Map<string, any>();
  const tableByName = new Map<string, any>();

  tableNodes.forEach((t) => {
    tableById.set(t.id, t);
    const rawName = t.data?.name || t.data?.label;
    if (rawName) {
      tableByName.set(cleanIdentifier(rawName).toLowerCase(), t);
    }
  });

  // Extract from edges
  edges.forEach((edge) => {
    const sourceNode = tableById.get(edge.source);
    const targetNode = tableById.get(edge.target);

    if (!sourceNode || !targetNode) return;

    const sourceTableName = cleanIdentifier(sourceNode.data?.name || sourceNode.data?.label || edge.source);
    const targetTableName = cleanIdentifier(targetNode.data?.name || targetNode.data?.label || edge.target);

    // Identify parent and child:
    // In database ER: parent holds PK (e.g., users.id), child holds FK (e.g., orders.customer_id)
    let parentTable = sourceTableName;
    let childTable = targetTableName;
    let parentNode = sourceNode;
    let childNode = targetNode;

    let parentCol = "id";
    let childCol = "";

    // 1. Check handle IDs: e.g. "col-u1-right", "col-customer_id-left"
    if (edge.sourceHandle || edge.targetHandle) {
      const parseHandle = (node: any, handleId?: string) => {
        if (!handleId) return null;
        const cols: any[] = node.data?.columns || [];
        // handle format: col-${col.id}-right or col-${col.name}-right
        for (const col of cols) {
          if (handleId.includes(col.id) || handleId.includes(col.name)) {
            return col;
          }
        }
        return null;
      };

      const sourceCol = parseHandle(sourceNode, edge.sourceHandle);
      const targetCol = parseHandle(targetNode, edge.targetHandle);

      if (sourceCol && targetCol) {
        if (targetCol.isFk || !sourceCol.isFk) {
          parentCol = sourceCol.name;
          childCol = targetCol.name;
          parentTable = sourceTableName;
          childTable = targetTableName;
        } else {
          parentCol = targetCol.name;
          childCol = sourceCol.name;
          parentTable = targetTableName;
          childTable = sourceTableName;
        }
      } else if (targetCol) {
        childCol = targetCol.name;
      } else if (sourceCol) {
        childCol = sourceCol.name;
      }
    }

    // 2. Check edge label e.g., "1:N (customer_id)" or "1:1 (user_id)"
    if (!childCol && edge.label) {
      const match = String(edge.label).match(/\(([^)]+)\)/);
      if (match && match[1]) {
        childCol = cleanIdentifier(match[1].trim());
      }
    }

    // 3. Fallback: search childNode columns for FK or matching parent name
    if (!childCol) {
      const childCols: any[] = childNode.data?.columns || [];
      const parentSingular = parentTable.replace(/s$/, "");
      const candidate = childCols.find(
        (c) =>
          c.isFk ||
          c.name === `${parentSingular}_id` ||
          c.name === `${parentTable}_id` ||
          c.name === "user_id" ||
          c.name === "customer_id"
      );
      if (candidate) {
        childCol = candidate.name;
      }
    }

    // Find parent primary key column
    const parentCols: any[] = parentNode.data?.columns || [];
    const pkCol = parentCols.find((c) => c.isPk);
    if (pkCol) {
      parentCol = pkCol.name;
    }

    if (childCol && parentCol) {
      const fkKey = `${childTable}.${childCol}->${parentTable}.${parentCol}`;
      if (!processed.has(fkKey)) {
        processed.add(fkKey);
        fks.push({
          constraintName: `fk_${cleanIdentifier(childTable)}_${cleanIdentifier(childCol)}`,
          childTable,
          childColumn: childCol,
          parentTable,
          parentColumn: parentCol,
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        });
      }
    }
  });

  return fks;
}

function cleanIdentifier(name: string): string {
  if (!name) return "";
  return name.trim().replace(/[^a-zA-Z0-9_]/g, "_");
}

function escapeSqlString(str: string): string {
  if (!str) return "";
  return str.replace(/'/g, "''");
}

function normalizePostgresType(type: string): string {
  const t = type.trim();
  const upper = t.toUpperCase();
  if (upper === "STRING") return "VARCHAR(255)";
  if (upper === "INT" || upper === "INTEGER") return "INTEGER";
  if (upper === "BIGINT") return "BIGINT";
  if (upper === "DATETIME") return "TIMESTAMPTZ";
  if (upper === "TIMESTAMP") return "TIMESTAMPTZ";
  if (upper === "FLOAT" || upper === "DOUBLE") return "DOUBLE PRECISION";
  if (upper === "JSON") return "JSONB";
  return t;
}

function normalizeMysqlType(type: string): string {
  const t = type.trim();
  const upper = t.toUpperCase();
  if (upper === "UUID") return "CHAR(36)";
  if (upper === "TIMESTAMPTZ") return "DATETIME";
  if (upper === "TIMESTAMP") return "TIMESTAMP";
  if (upper === "JSONB") return "JSON";
  if (upper === "BOOLEAN" || upper === "BOOL") return "TINYINT(1)";
  if (upper.includes("CHECK")) {
    // Strip check for simple type in MySQL column
    return upper.replace(/CHECK\s*\([^)]*\)/i, "").trim() || "INT";
  }
  return t;
}
