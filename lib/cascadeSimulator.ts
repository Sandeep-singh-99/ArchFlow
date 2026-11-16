/**
 * CASCADE Drop Impact Simulator Engine
 *
 * Traverses foreign-key relationship graphs strictly from parent to child
 * using recursive depth-first search with visited cycle protection.
 */

export interface SchemaColumn {
  id?: string;
  name?: string;
  type?: string;
  isPk?: boolean;
  isFk?: boolean;
  references?: string;
  [key: string]: unknown;
}

export interface SchemaNodeData {
  name?: string;
  tableName?: string;
  label?: string;
  title?: string;
  query?: string;
  columns?: SchemaColumn[];
  fields?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface SchemaNode {
  id: string;
  type?: string;
  data?: SchemaNodeData;
  style?: Record<string, unknown>;
  selected?: boolean;
  [key: string]: unknown;
}

export interface SchemaEdge {
  id?: string;
  source?: string;
  target?: string;
  sourceHandle?: string;
  targetHandle?: string;
  cardinality?: string;
  data?: {
    cardinality?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface CascadeAnalysisResult {
  targetNode: SchemaNode;
  targetName: string;
  directTables: SchemaNode[];
  transitiveTables: SchemaNode[];
  dependentViews: SchemaNode[];
  totalAffected: number;
  severity: "HIGH" | "MODERATE" | "SAFE";
  columnsCount: number;
  isNoSql: boolean;
}

/**
 * Bulletproof helper to extract clean string names and avoid React object children crashes
 */
export function getSafeNodeName(node?: SchemaNode | null, fallback = "unnamed_table"): string {
  if (!node) return fallback;
  const raw =
    node.data?.name ??
    node.data?.tableName ??
    node.data?.label ??
    node.id;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.name === "string" && obj.name.trim()) return obj.name.trim();
    if (typeof obj.label === "string" && obj.label.trim()) return obj.label.trim();
    if (typeof obj.title === "string" && obj.title.trim()) return obj.title.trim();
  }
  return String(node.id || fallback);
}

/**
 * Computes CASCADE drop impact by traversing relationships strictly from parent to child
 * using recursive depth-first search with visited cycle protection.
 */
export function computeCascadeAnalysis(
  activeSelectedTableId: string | null | undefined,
  allNodes: SchemaNode[] = [],
  allEdges: SchemaEdge[] = []
): CascadeAnalysisResult | null {
  if (!activeSelectedTableId) return null;

  const tableNodes = allNodes.filter((n) => {
    if (!n || !n.type) return false;
    const t = n.type;
    return (
      t === "SqlTableNode" ||
      t === "Table" ||
      t === "NosqlCollectionNode" ||
      t === "Collection" ||
      t === "DbSchemaNode"
    );
  });

  const targetNode = tableNodes.find((n) => n.id === activeSelectedTableId);
  if (!targetNode || !targetNode.id) return null;

  const targetName = getSafeNodeName(targetNode, "selected_table");
  const tableIdSet = new Set<string>(tableNodes.map((n) => n.id).filter(Boolean));
  const tableById = new Map<string, SchemaNode>(tableNodes.map((n) => [n.id, n]));

  // Build Parent -> Children directed graph
  const parentToChildren = new Map<string, Set<string>>();
  tableNodes.forEach((t) => parentToChildren.set(t.id, new Set<string>()));

  allEdges.forEach((edge) => {
    if (!edge || !edge.source || !edge.target) return;
    if (!tableIdSet.has(edge.source) || !tableIdSet.has(edge.target)) return;
    if (edge.source === edge.target) return;

    const sourceNode = tableById.get(edge.source);
    const targetNode = tableById.get(edge.target);
    if (!sourceNode || !targetNode) return;

    // Determine parent vs child:
    // In ER modeling, parent holds PK, child holds FK.
    let parentId = edge.source;
    let childId = edge.target;

    const parseHandle = (node: SchemaNode, handleId?: string): SchemaColumn | null => {
      if (!handleId) return null;
      const cols: SchemaColumn[] = node.data?.columns || [];
      const token = handleId.replace(/^col-/, "").replace(/-(?:left|right|top|bottom)$/, "");
      const exact = cols.find((c) => c.id === token || c.name === token || c.id === handleId || c.name === handleId);
      if (exact) return exact;
      const sorted = [...cols].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));
      for (const col of sorted) {
        if (
          (col.id && (handleId === col.id || handleId.includes(`-${col.id}-`) || handleId.endsWith(`-${col.id}`) || handleId.startsWith(`${col.id}-`))) ||
          (col.name && (handleId === col.name || handleId.includes(`-${col.name}-`) || handleId.endsWith(`-${col.name}`) || handleId.startsWith(`${col.name}-`)))
        ) {
          return col;
        }
      }
      for (const col of sorted) {
        if ((col.id && handleId.includes(col.id)) || (col.name && handleId.includes(col.name))) {
          return col;
        }
      }
      return null;
    };

    const sourceCol = parseHandle(sourceNode, edge.sourceHandle);
    const targetCol = parseHandle(targetNode, edge.targetHandle);

    if (sourceCol && targetCol) {
      if (sourceCol.isFk && !targetCol.isFk) {
        parentId = edge.target;
        childId = edge.source;
      } else if (targetCol.isFk && !sourceCol.isFk) {
        parentId = edge.source;
        childId = edge.target;
      }
    } else {
      const card = edge.data?.cardinality || edge.cardinality;
      if (card === "N:1" || card === "}o--||") {
        parentId = edge.target;
        childId = edge.source;
      } else {
        const tName = (targetNode.data?.name || targetNode.data?.label || "").toLowerCase();
        const sourceCols: SchemaColumn[] = sourceNode.data?.columns || [];
        const sourceHasFkToTarget = sourceCols.some(
          (c) =>
            c.isFk &&
            ((c.name && c.name.toLowerCase().includes(tName)) ||
              (c.references && c.references.toLowerCase().includes(tName)))
        );
        if (sourceHasFkToTarget) {
          parentId = edge.target;
          childId = edge.source;
        }
      }
    }

    parentToChildren.get(parentId)?.add(childId);
  });

  // Traverse strictly from parent to child using recursive depth-first search (DFS) with a visited set
  const directDependentTableIds = new Set<string>();
  const transitiveDependentIds = new Set<string>();
  const visited = new Set<string>([activeSelectedTableId]);

  function dfs(currentId: string, depth: number) {
    const children = parentToChildren.get(currentId);
    if (!children) return;

    for (const childId of children) {
      if (childId === activeSelectedTableId) continue;

      if (depth === 1) {
        directDependentTableIds.add(childId);
      } else if (!directDependentTableIds.has(childId)) {
        transitiveDependentIds.add(childId);
      }

      if (!visited.has(childId)) {
        visited.add(childId);
        dfs(childId, depth + 1);
      }
    }
  }

  dfs(activeSelectedTableId, 1);

  // Dependent Views (views whose query mentions targetName)
  const lowerTargetName = targetName.toLowerCase();
  const dependentViews = allNodes.filter((n) => {
    if (!n || !n.id) return false;
    const type = n.type || "";
    if (type !== "SqlViewNode" && type !== "View") return false;
    const q = String(n.data?.query || "").toLowerCase();
    return q.includes(lowerTargetName);
  });

  // Resolve table objects safely
  const directTables = allNodes.filter(
    (n) => n && n.id && directDependentTableIds.has(n.id)
  );
  const transitiveTables = allNodes.filter(
    (n) => n && n.id && transitiveDependentIds.has(n.id)
  );

  const totalAffected =
    directTables.length + transitiveTables.length + dependentViews.length;

  const severity: "HIGH" | "MODERATE" | "SAFE" =
    totalAffected >= 3 ? "HIGH" : totalAffected >= 1 ? "MODERATE" : "SAFE";

  const columnsCount = Array.isArray(targetNode.data?.columns)
    ? targetNode.data.columns.length
    : 0;

  const isNoSql =
    targetNode.type === "NosqlCollectionNode" ||
    targetNode.type === "Collection";

  return {
    targetNode,
    targetName,
    directTables,
    transitiveTables,
    dependentViews,
    totalAffected,
    severity,
    columnsCount,
    isNoSql,
  };
}
