/**
 * Mermaid.js Diagram Exporter for ArchFlow
 * Generates production-grade Mermaid Entity-Relationship Diagrams (erDiagram)
 * and Architecture Flowcharts (flowchart TD / flowchart LR).
 */

export interface MermaidExportOptions {
  format?: "erDiagram" | "flowchart";
  direction?: "TD" | "LR";
  includeColumns?: boolean;
  includeDataTypes?: boolean;
  includeComments?: boolean;
  includeDomains?: boolean;
}

export function exportMermaid(
  nodes: any[] = [],
  edges: any[] = [],
  options: MermaidExportOptions = {}
): string {
  const {
    format = "erDiagram",
    direction = "TD",
    includeColumns = true,
    includeDataTypes = true,
    includeComments = true,
    includeDomains = true,
  } = options;

  if (format === "flowchart") {
    return generateFlowchart(nodes, edges, { direction, includeColumns, includeDomains });
  }

  return generateErDiagram(nodes, edges, {
    includeColumns,
    includeDataTypes,
    includeComments,
  });
}

// =========================================================================
// Helpers & Sanitizers
// =========================================================================

function cleanEntityName(raw: string): string {
  if (!raw) return "TABLE";
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9_]/g, "_");
  // Entity names in Mermaid erDiagram cannot start with a number
  return /^[0-9]/.test(cleaned) ? `T_${cleaned}` : cleaned;
}

function cleanFieldName(raw: string): string {
  if (!raw) return "field";
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9_]/g, "_");
  return /^[0-9]/.test(cleaned) ? `f_${cleaned}` : cleaned;
}

function cleanType(rawType: string): string {
  if (!rawType) return "string";
  // Remove length/precision: VARCHAR(255) -> varchar, DECIMAL(10,2) -> decimal
  let t = rawType.trim().replace(/\([^)]*\)/g, "").toLowerCase();

  // Normalize multi-word types for Mermaid syntax (cannot have spaces)
  if (t.includes("timestamp") || t.includes("timestamptz") || t.includes("datetime")) return "timestamptz";
  if (t.includes("double") || t.includes("float") || t.includes("real")) return "float";
  if (t.includes("bigint") || t.includes("int8")) return "bigint";
  if (t.includes("smallint") || t.includes("int2")) return "smallint";
  if (t.includes("int")) return "int";
  if (t.includes("bool")) return "boolean";
  if (t.includes("uuid") || t.includes("objectid")) return "uuid";
  if (t.includes("json")) return "json";
  if (t.includes("text")) return "text";
  if (t.includes("char") || t.includes("string")) return "string";
  if (t.includes("numeric") || t.includes("decimal")) return "decimal";
  if (t.includes("blob") || t.includes("bytea") || t.includes("binary")) return "binary";

  // Strip remaining non-alphanumeric characters
  const sanitized = t.replace(/[^a-z0-9_]/g, "_");
  return sanitized || "string";
}

function escapeMermaidComment(str: string): string {
  if (!str) return "";
  return str.replace(/["\r\n]/g, " ").trim();
}

function escapeLabel(str: string): string {
  if (!str) return "";
  return str.replace(/["\r\n]/g, " ").trim();
}

// =========================================================================
// ER Diagram Generator
// =========================================================================

function generateErDiagram(
  nodes: any[],
  edges: any[],
  options: {
    includeColumns: boolean;
    includeDataTypes: boolean;
    includeComments: boolean;
  }
): string {
  const lines: string[] = ["erDiagram"];

  // Filter relevant table / collection / view nodes
  const tableNodes = nodes.filter(
    (n) =>
      n.type === "SqlTableNode" ||
      n.type === "NosqlCollectionNode" ||
      n.type === "Table" ||
      n.type === "Collection" ||
      (!n.type && (n.data?.columns || n.data?.fields))
  );

  if (tableNodes.length === 0) {
    lines.push("    %% No schema tables detected on the canvas.");
    lines.push("    %% Add tables to the canvas or connect relationships.");
    lines.push("    USERS ||--o{ ORDERS : places");
    lines.push("    ORDERS ||--|{ ORDER_ITEMS : contains");
    lines.push("    PRODUCTS ||--o{ ORDER_ITEMS : ordered_in");
    lines.push("    USERS {");
    lines.push("        uuid id PK");
    lines.push("        string email UK");
    lines.push("        timestamptz created_at");
    lines.push("    }");
    lines.push("    ORDERS {");
    lines.push("        uuid id PK");
    lines.push("        uuid user_id FK");
    lines.push("        decimal total_amount");
    lines.push("    }");
    return lines.join("\n") + "\n";
  }

  // Map nodeId to canonical entity name
  const nodeToEntityMap = new Map<string, string>();
  const entityNamesUsed = new Set<string>();

  tableNodes.forEach((node) => {
    let raw = node.data?.name || node.data?.label || node.id;
    let entityName = cleanEntityName(raw).toUpperCase();

    // Prevent duplicates
    let uniqueName = entityName;
    let counter = 2;
    while (entityNamesUsed.has(uniqueName)) {
      uniqueName = `${entityName}_${counter}`;
      counter++;
    }
    entityNamesUsed.add(uniqueName);
    nodeToEntityMap.set(node.id, uniqueName);
  });

  // 1. Generate Relationships (Edges) first or after entities
  const processedEdges = new Set<string>();

  edges.forEach((edge) => {
    const sourceEntity = nodeToEntityMap.get(edge.source);
    const targetEntity = nodeToEntityMap.get(edge.target);

    if (!sourceEntity || !targetEntity) return;

    // Build unique key to avoid duplicating bi-directional edges
    const edgeKey = `${edge.source}->${edge.target}`;
    if (processedEdges.has(edgeKey)) return;
    processedEdges.add(edgeKey);

    // Cardinality syntax: e.g. ||--o{ (one to zero or more)
    let cardinality = edge.data?.cardinality || edge.cardinality;
    if (!cardinality) {
      // Auto-detect based on FK or default to one-to-many
      cardinality = "||--o{";
    }

    // Ensure valid Mermaid relationship symbol
    const validSymbols = [
      "||--o{",
      "||--|{",
      "||--||",
      "|o--o|",
      "|o--||",
      "}o--o{",
      "}o--|{",
      "}|--|{",
      "||--o|",
    ];
    if (!validSymbols.includes(cardinality)) {
      cardinality = "||--o{";
    }

    let relLabel = edge.label || edge.data?.label || edge.data?.relationName || "relates_to";
    relLabel = escapeLabel(relLabel);

    lines.push(`    ${sourceEntity} ${cardinality} ${targetEntity} : "${relLabel}"`);
  });

  if (edges.length > 0) {
    lines.push("");
  }

  // 2. Generate Entities with Column Definitions
  tableNodes.forEach((node) => {
    const entityName = nodeToEntityMap.get(node.id)!;
    const rawColumns = node.data?.columns || node.data?.fields || [];

    if (!options.includeColumns || rawColumns.length === 0) {
      lines.push(`    ${entityName} {`);
      lines.push(`    }`);
      return;
    }

    lines.push(`    ${entityName} {`);
    rawColumns.forEach((col: any) => {
      const typeStr = options.includeDataTypes ? cleanType(col.type) : "string";
      const fieldName = cleanFieldName(col.name);

      let keyFlag = "";
      if (col.isPk) {
        keyFlag = " PK";
      } else if (col.isFk) {
        keyFlag = " FK";
      } else if (col.isUnique) {
        keyFlag = " UK";
      }

      let commentPart = "";
      if (options.includeComments && (col.comment || col.description)) {
        const commentClean = escapeMermaidComment(col.comment || col.description);
        if (commentClean) {
          commentPart = ` "${commentClean}"`;
        }
      }

      lines.push(`        ${typeStr} ${fieldName}${keyFlag}${commentPart}`);
    });
    lines.push(`    }`);
    lines.push("");
  });

  return lines.join("\n");
}

// =========================================================================
// Architecture Flowchart Generator
// =========================================================================

function generateFlowchart(
  nodes: any[],
  edges: any[],
  options: {
    direction: "TD" | "LR";
    includeColumns: boolean;
    includeDomains: boolean;
  }
): string {
  const dir = options.direction === "LR" ? "LR" : "TD";
  const lines: string[] = [`flowchart ${dir}`];

  if (nodes.length === 0) {
    lines.push("    %% No nodes present on canvas");
    lines.push('    Client["Client App"] --> API["API Gateway"]');
    lines.push('    API --> DB[("Database")]');
    return lines.join("\n") + "\n";
  }

  // Group by Domain if enabled
  const domainNodes = nodes.filter((n) => n.type === "DomainGroupNode");
  const regularNodes = nodes.filter((n) => n.type !== "DomainGroupNode");

  const nodesByDomain = new Map<string, any[]>();
  const unassignedNodes: any[] = [];

  if (options.includeDomains && domainNodes.length > 0) {
    domainNodes.forEach((domain) => {
      nodesByDomain.set(domain.id, []);
    });

    regularNodes.forEach((node) => {
      const parentDomainId = node.parentId || node.data?.domainId;
      if (parentDomainId && nodesByDomain.has(parentDomainId)) {
        nodesByDomain.get(parentDomainId)!.push(node);
      } else {
        unassignedNodes.push(node);
      }
    });

    // Render Subgraphs
    domainNodes.forEach((domain) => {
      const title = escapeLabel(domain.data?.label || domain.data?.title || domain.id);
      const safeSubId = `sub_${cleanEntityName(domain.id)}`;
      lines.push(`    subgraph ${safeSubId}["${title}"]`);

      const members = nodesByDomain.get(domain.id) || [];
      if (members.length === 0) {
        lines.push(`        %% Empty domain`);
      } else {
        members.forEach((m) => {
          renderFlowNode(m, lines, "        ", options.includeColumns);
        });
      }
      lines.push(`    end\n`);
    });

    // Render Unassigned Nodes
    if (unassignedNodes.length > 0) {
      unassignedNodes.forEach((n) => {
        renderFlowNode(n, lines, "    ", options.includeColumns);
      });
    }
  } else {
    // Flat flowchart
    regularNodes.forEach((n) => {
      renderFlowNode(n, lines, "    ", options.includeColumns);
    });
  }

  lines.push("");

  // Render Edges
  if (edges.length > 0) {
    edges.forEach((edge) => {
      const safeSource = cleanEntityName(edge.source);
      const safeTarget = cleanEntityName(edge.target);
      const label = edge.label || edge.data?.label;

      if (label) {
        const cleanL = escapeLabel(String(label));
        lines.push(`    ${safeSource} -->|"${cleanL}"| ${safeTarget}`);
      } else {
        lines.push(`    ${safeSource} --> ${safeTarget}`);
      }
    });
  } else {
    lines.push("    %% No connections on canvas");
  }

  return lines.join("\n") + "\n";
}

function renderFlowNode(
  node: any,
  lines: string[],
  indent: string,
  includeColumns: boolean
) {
  const safeId = cleanEntityName(node.id);
  const rawLabel = node.data?.name || node.data?.label || node.id;
  const safeTitle = escapeLabel(rawLabel);

  const columns = node.data?.columns || node.data?.fields || [];
  let displayLabel = safeTitle;

  if (includeColumns && columns.length > 0) {
    const colSummary = columns
      .slice(0, 4)
      .map((c: any) => `• ${c.name}${c.isPk ? " (PK)" : c.isFk ? " (FK)" : ""}`)
      .join("<br/>");
    const moreText = columns.length > 4 ? `<br/>... +${columns.length - 4} more` : "";
    displayLabel = `<b>${safeTitle}</b><br/>${colSummary}${moreText}`;
  }

  // Choose appropriate shape based on node type
  if (node.type === "SqlTableNode" || node.type === "NosqlCollectionNode") {
    // Database Cylinder: [(Label)]
    lines.push(`${indent}${safeId}[("${displayLabel}")]`);
  } else if (node.type === "SqlViewNode") {
    // Pill / Stadium: ([Label])
    lines.push(`${indent}${safeId}(["${displayLabel}"])`);
  } else if (node.type === "SqlEnumNode" || node.type === "SqlTriggerNode") {
    // Rhombus / Diamond: {"Label"}
    lines.push(`${indent}${safeId}{"${displayLabel}"}`);
  } else {
    // Standard Box: ["Label"]
    lines.push(`${indent}${safeId}["${displayLabel}"]`);
  }
}
