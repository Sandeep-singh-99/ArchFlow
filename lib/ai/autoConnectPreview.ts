import type { Edge, Node } from "@xyflow/react";

function stripEntryPreviewFlag(entry: unknown): unknown {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return entry;
  const copy = { ...entry } as Record<string, unknown>;
  delete copy.isAiProposed;
  return copy;
}

export function stripAiPreviewFlags(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const cleanNodes = nodes.map((node) => {
    const data = { ...node.data };
    const wasAiProposed = Boolean(data.isAiProposed);
    delete data.isAiProposed;
    if (Array.isArray(data.columns)) {
      data.columns = data.columns.map(stripEntryPreviewFlag);
    }
    if (Array.isArray(data.fields)) {
      data.fields = data.fields.map(stripEntryPreviewFlag);
    }
    if (wasAiProposed && node.style) {
      const style = { ...node.style } as Record<string, unknown>;
      delete style.boxShadow;
      return { ...node, data, style };
    }
    return { ...node, data };
  });

  const cleanEdges = edges.map((edge) => {
    const style = { ...edge.style } as Record<string, unknown>;
    const data = { ...edge.data } as Record<string, unknown>;
    if (data.isAiProposed) {
      style.stroke = typeof data.finalStroke === "string" ? data.finalStroke : "#10b981";
      style.strokeWidth = 2;
      delete style.strokeDasharray;
    }
    delete data.isAiProposed;
    delete data.finalStroke;
    return { ...edge, style, data };
  });

  return { nodes: cleanNodes, edges: cleanEdges };
}

export function restoreSqlColumnStrings(node: Node): Node {
  const { type, data } = node;
  if (type !== "SqlIndexNode" && type !== "SqlViewNode" && type !== "Index" && type !== "View") {
    return node;
  }
  if (!Array.isArray(data?.columns)) return node;
  const savedColumns: unknown[] = data.columns;

  // Older previews spread column strings into objects with one numeric key per character.
  const columns = savedColumns.map((column) => {
    if (!column || typeof column !== "object" || Array.isArray(column)) return column;
    const entries = Object.entries(column);
    const hasCharacterKeys = entries.every(
      ([key, value], index) => key === String(index) && typeof value === "string" && value.length === 1
    );
    return hasCharacterKeys ? Object.values(column).join("") : column;
  });

  return columns.some((column, index) => column !== savedColumns[index])
    ? { ...node, data: { ...data, columns } }
    : node;
}
