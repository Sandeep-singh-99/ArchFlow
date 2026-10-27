import dagre from "dagre";

export interface AutoLayoutOptions {
  direction?: "TB" | "LR";
  nodeSep?: number;
  rankSep?: number;
  align?: "UL" | "UR" | "DL" | "DR";
}

/**
 * Estimates the dimensions of a node based on its type and content
 */
export function estimateNodeDimensions(node: any): { width: number; height: number } {
  // Respect user-set or measured dimensions first
  if (node.measured?.width && node.measured?.height) {
    return { width: Math.round(node.measured.width), height: Math.round(node.measured.height) };
  }
  if (node.width && node.height) {
    return { width: Math.round(node.width), height: Math.round(node.height) };
  }
  if (node.style?.width && node.style?.height) {
    const w = typeof node.style.width === "number" ? node.style.width : parseInt(node.style.width, 10);
    const h = typeof node.style.height === "number" ? node.style.height : parseInt(node.style.height, 10);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      return { width: w, height: h };
    }
  }

  const type = node.type || "default";

  switch (type) {
    case "SqlTableNode":
    case "Table": {
      const colCount = node.data?.columns?.length || 2;
      return { width: 300, height: 80 + colCount * 36 };
    }
    case "NosqlCollectionNode":
    case "Collection": {
      const fieldCount = node.data?.fields?.length || 3;
      return { width: 290, height: 80 + fieldCount * 34 };
    }
    case "SqlViewNode":
    case "View":
      return { width: 280, height: 180 };
    case "SqlIndexNode":
    case "Index":
      return { width: 240, height: 140 };
    case "SqlFunctionNode":
    case "StoredFunction":
      return { width: 260, height: 160 };
    case "SqlTriggerNode":
    case "Trigger":
      return { width: 260, height: 150 };
    case "SqlEnumNode":
    case "Enum": {
      const valCount = node.data?.values?.length || 3;
      return { width: 240, height: 70 + valCount * 28 };
    }
    case "DbNoteNode":
    case "Note":
    case "TextNode":
    case "Text":
      return { width: 240, height: 160 };
    case "DbSchemaNode":
    case "Database":
    case "Schema":
      return { width: 260, height: 160 };
    case "DomainGroupNode":
    case "DomainGroup":
    case "domainGroup":
    case "group":
      return { width: 380, height: 260 };
    default:
      return { width: 260, height: 160 };
  }
}

/**
 * Checks if a node is a domain group / subgraph container
 */
export function isDomainGroupNode(node: any): boolean {
  const type = node?.type || "";
  return (
    type === "DomainGroupNode" ||
    type === "DomainGroup" ||
    type === "domainGroup" ||
    type === "group" ||
    node?.data?.isDomainGroup === true
  );
}

/**
 * Computes an organized, hierarchical auto-layout for schemas and domain boundaries
 * with minimal edge crossing using Dagre.
 */
export function getAutoLayout(
  nodes: any[],
  edges: any[],
  options: AutoLayoutOptions = {}
): { nodes: any[]; edges: any[] } {
  if (!nodes || nodes.length === 0) {
    return { nodes: [], edges: edges || [] };
  }

  const {
    direction = "LR",
    nodeSep = 70,
    rankSep = 110,
    align,
  } = options;

  const g = new dagre.graphlib.Graph({ compound: true });
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSep,
    ranksep: rankSep,
    align: align,
    compound: true,
    marginx: 50,
    marginy: 50,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Identify all domain group nodes
  const groupNodes = nodes.filter(isDomainGroupNode);
  const groupIds = new Set(groupNodes.map((n) => n.id));

  // Step 1: Register group nodes first in dagre
  groupNodes.forEach((grp) => {
    const dim = estimateNodeDimensions(grp);
    g.setNode(grp.id, {
      label: grp.data?.label || grp.data?.name || grp.id,
      isGroup: true,
      width: dim.width,
      height: dim.height,
    });
  });

  // Step 2: Register regular nodes
  nodes.forEach((node) => {
    if (groupIds.has(node.id)) return;

    const dim = estimateNodeDimensions(node);
    g.setNode(node.id, {
      width: dim.width,
      height: dim.height,
    });

    // Handle compound parenting
    const parentId = node.parentId || node.data?.domainId;
    if (parentId && groupIds.has(parentId)) {
      g.setParent(node.id, parentId);
    }
  });

  // Step 3: Register edges (only if both source and target exist)
  (edges || []).forEach((edge) => {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  });

  // Step 4: Run Dagre Layout
  try {
    dagre.layout(g);
  } catch (error) {
    console.error("Dagre auto-layout failed:", error);
    return { nodes, edges };
  }

  // Step 5: Reposition nodes based on computed coordinates
  const updatedNodes = nodes.map((node) => {
    const dNode = g.node(node.id);
    if (!dNode) return node;

    if (groupIds.has(node.id)) {
      // Group container node
      const left = Math.round(dNode.x - dNode.width / 2);
      const top = Math.round(dNode.y - dNode.height / 2);
      const w = Math.max(340, Math.round(dNode.width));
      const h = Math.max(220, Math.round(dNode.height));

      return {
        ...node,
        position: { x: left, y: top },
        style: {
          ...(node.style || {}),
          width: w,
          height: h,
        },
      };
    } else {
      // Regular child or standalone node
      const parentId = node.parentId || node.data?.domainId;
      if (parentId && groupIds.has(parentId)) {
        const pNode = g.node(parentId);
        if (pNode) {
          const pLeft = pNode.x - pNode.width / 2;
          const pTop = pNode.y - pNode.height / 2;

          return {
            ...node,
            parentId: parentId,
            position: {
              x: Math.round(dNode.x - dNode.width / 2 - pLeft),
              y: Math.round(dNode.y - dNode.height / 2 - pTop),
            },
          };
        }
      }

      // Standalone node with absolute canvas coordinates
      return {
        ...node,
        position: {
          x: Math.round(dNode.x - dNode.width / 2),
          y: Math.round(dNode.y - dNode.height / 2),
        },
      };
    }
  });

  // CRITICAL for React Flow: Group/Parent nodes MUST be ordered before child nodes in the array
  const parentOrderedNodes = [
    ...updatedNodes.filter(isDomainGroupNode),
    ...updatedNodes.filter((n) => !isDomainGroupNode(n)),
  ];

  return {
    nodes: parentOrderedNodes,
    edges: edges || [],
  };
}
