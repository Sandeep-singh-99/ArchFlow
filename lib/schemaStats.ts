/**
 * Schema Entity Statistics Calculator
 * Computes entity metrics (Tables, Foreign Keys, Domains, Views, Indexes, etc.)
 * from ReactFlow canvas nodes and edges.
 */

export interface SchemaEntityStats {
  tables: number;
  collections: number;
  foreignKeys: number;
  domains: number;
  views: number;
  indexes: number;
  enums: number;
  totalColumns: number;
  totalEntities: number;
}

export function computeSchemaEntityStats(
  nodes?: any[],
  edges?: any[]
): SchemaEntityStats {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeEdges = Array.isArray(edges) ? edges : [];

  let tables = 0;
  let collections = 0;
  let domains = 0;
  let views = 0;
  let indexes = 0;
  let enums = 0;
  let totalColumns = 0;
  let fkColsCount = 0;
  const domainIds = new Set<string>();

  safeNodes.forEach((node) => {
    const type = node.type || "";
    const nodeData = node.data || {};

    if (type === "SqlTableNode" || type === "Table") {
      tables++;
      const cols = nodeData.columns;
      if (Array.isArray(cols)) {
        totalColumns += cols.length;
        cols.forEach((col: any) => {
          if (col.isFk) fkColsCount++;
        });
      }
    } else if (
      type === "NosqlCollectionNode" ||
      type === "Collection" ||
      type === "NosqlDocumentNode" ||
      type === "Document"
    ) {
      collections++;
    } else if (
      type === "DomainGroupNode" ||
      type === "DomainGroup" ||
      type === "domainGroup" ||
      type === "group" ||
      nodeData.isDomainGroup
    ) {
      domains++;
      if (node.id) domainIds.add(node.id);
    } else if (type === "SqlViewNode" || type === "View") {
      views++;
    } else if (
      type === "SqlIndexNode" ||
      type === "NosqlIndexNode" ||
      type === "Index"
    ) {
      indexes++;
    } else if (type === "SqlEnumNode" || type === "Enum") {
      enums++;
    }

    if (nodeData.domainId) {
      domainIds.add(String(nodeData.domainId));
    } else if (nodeData.domainName) {
      domainIds.add(String(nodeData.domainName));
    }
  });

  const domainsCount = Math.max(domains, domainIds.size);
  // Relationships/Foreign keys: edges connecting tables or explicitly marked FK columns
  const foreignKeys = Math.max(safeEdges.length, fkColsCount);
  const totalEntities = tables + collections + views + indexes + enums;

  return {
    tables,
    collections,
    foreignKeys,
    domains: domainsCount,
    views,
    indexes,
    enums,
    totalColumns,
    totalEntities,
  };
}
