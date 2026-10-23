/**
 * Comprehensive Mermaid to ReactFlow Parser and Auto-Layout Engine.
 * Supports:
 * - Directives: graph TD, graph TB, graph LR, graph RL, flowchart TD, flowchart LR, etc.
 * - Shapes: [Rectangle], (Rounded), ([Pill/Stadium]), [(Cylinder/DB)], {Diamond/Decision}, {{Hexagon}}
 * - Edges: -->, ---, -.->, ==>, labeled edges (-->|label| or -- label -->), and chained arrows (A --> B --> C)
 * - Automatic semantic node type inference (StartNode, EndNode, IfElseNode, Database, Frontend, Backend, AI)
 * - Topological rank-based layered DAG layout (vertical TD and horizontal LR)
 */

export interface ParsedMermaidResult {
  nodes: any[];
  edges: any[];
  direction: "TD" | "LR";
  nodeCount: number;
  edgeCount: number;
}

export function parseMermaidToReactFlow(mermaidCode: string): ParsedMermaidResult {
  if (!mermaidCode || !mermaidCode.trim()) {
    return { nodes: [], edges: [], direction: "TD", nodeCount: 0, edgeCount: 0 };
  }

  const rawLines = mermaidCode.split(/\r?\n/);

  let direction: "TD" | "LR" = "TD";
  const nodeMap = new Map<
    string,
    {
      id: string;
      label: string;
      rawShape: string;
      explicitType?: string;
      role?: string;
    }
  >();

  interface RawEdge {
    source: string;
    target: string;
    label?: string;
    animated?: boolean;
    style?: any;
  }
  const rawEdges: RawEdge[] = [];

  // Helper to register or update node in map
  const registerNode = (id: string, label?: string, rawShape?: string) => {
    const cleanId = id.trim().replace(/['"`]/g, "");
    if (!cleanId) return cleanId;

    const existing = nodeMap.get(cleanId);
    let finalLabel = cleanId;
    if (label !== undefined && label.trim() !== "" && label.trim() !== cleanId) {
      finalLabel = label.trim();
    } else if (existing?.label && existing.label !== cleanId) {
      finalLabel = existing.label;
    } else if (label !== undefined && label.trim() !== "") {
      finalLabel = label.trim();
    }

    let finalShape = rawShape || "box";
    if (rawShape && rawShape !== "box") {
      finalShape = rawShape;
    } else if (existing?.rawShape && existing.rawShape !== "box") {
      finalShape = existing.rawShape;
    }

    nodeMap.set(cleanId, {
      id: cleanId,
      label: finalLabel,
      rawShape: finalShape,
    });
    return cleanId;
  };

  // Helper to extract node token with bracket shapes
  // e.g. NodeA["My Label"] or NodeB[(Database)] or NodeC{"Check Condition"}
  const parseNodeToken = (token: string): { id: string; label?: string; shape?: string } => {
    const t = token.trim();

    // 1. Cylinder: id[(Label)]
    const cylMatch = t.match(/^([\w\-.:]+)\s*\[\(\s*["']?([\s\S]+?)["']?\s*\)\]$/);
    if (cylMatch) {
      return { id: cylMatch[1], label: cylMatch[2], shape: "cylinder" };
    }

    // 2. Stadium/Pill: id([Label])
    const pillMatch = t.match(/^([\w\-.:]+)\s*\(\[\s*["']?([\s\S]+?)["']?\s*\]\)$/);
    if (pillMatch) {
      return { id: pillMatch[1], label: pillMatch[2], shape: "pill" };
    }

    // 3. Diamond/Decision: id{Label} or id{{Label}}
    const diamondMatch = t.match(/^([\w\-.:]+)\s*\{\{?\s*["']?([\s\S]+?)["']?\s*\}\}?$/);
    if (diamondMatch) {
      return { id: diamondMatch[1], label: diamondMatch[2], shape: "diamond" };
    }

    // 4. Circle: id((Label))
    const circleMatch = t.match(/^([\w\-.:]+)\s*\(\(\s*["']?([\s\S]+?)["']?\s*\)\)$/);
    if (circleMatch) {
      return { id: circleMatch[1], label: circleMatch[2], shape: "circle" };
    }

    // 5. Rounded rect: id(Label)
    const roundedMatch = t.match(/^([\w\-.:]+)\s*\(\s*["']?([\s\S]+?)["']?\s*\)$/);
    if (roundedMatch) {
      return { id: roundedMatch[1], label: roundedMatch[2], shape: "rounded" };
    }

    // 6. Box: id[Label]
    const boxMatch = t.match(/^([\w\-.:]+)\s*\[\s*["']?([\s\S]+?)["']?\s*\]$/);
    if (boxMatch) {
      return { id: boxMatch[1], label: boxMatch[2], shape: "box" };
    }

    // 7. Plain identifier without brackets
    const plainMatch = t.match(/^([\w\-.:]+)$/);
    if (plainMatch) {
      return { id: plainMatch[1], label: plainMatch[1], shape: "box" };
    }

    return { id: t, label: t, shape: "box" };
  };

  // Process line by line
  for (let line of rawLines) {
    line = line.trim();

    // Ignore empty lines and Mermaid comments
    if (!line || line.startsWith("%%") || line.startsWith("//")) continue;

    // Check header direction: graph TD/LR/TB/RL or flowchart TD/LR
    const headerMatch = line.match(/^(?:graph|flowchart)\s+(TD|TB|LR|RL)/i);
    if (headerMatch) {
      const dir = headerMatch[1].toUpperCase();
      direction = dir === "LR" || dir === "RL" ? "LR" : "TD";
      continue;
    }

    // Ignore styling commands
    if (
      line.startsWith("classDef") ||
      line.startsWith("class ") ||
      line.startsWith("style ") ||
      line.startsWith("click ") ||
      line.startsWith("subgraph") ||
      line === "end"
    ) {
      continue;
    }

    // Regex for edge connectors:
    // e.g. -->|label|, -- label -->, -->, -.->, ==>
    // We split by edge operators while capturing them
    const edgePattern =
      /(?:-->\|([^|]+)\|)|(?:--\s*["']?([^"'-]+?)["']?\s*-->)|(?:==\s*["']?([^"'-]+?)["']?\s*==>)|(?:-\.\s*["']?([^"'-]+?)["']?\s*\.->)|(?:-->)|(?:==>)|(?:-\.->)|(?:---)/g;

    const matches: { index: number; text: string; edgeLabel?: string }[] = [];
    let match;
    while ((match = edgePattern.exec(line)) !== null) {
      const edgeLabel = match[1] || match[2] || match[3] || match[4] || undefined;
      matches.push({
        index: match.index,
        text: match[0],
        edgeLabel: edgeLabel?.trim(),
      });
    }

    if (matches.length > 0) {
      // Line contains one or more edge connections (possibly chained like A --> B --> C)
      let prevTokenEnd = 0;
      const nodeSegments: { token: string; edgeLabelToNext?: string }[] = [];

      for (let i = 0; i < matches.length; i++) {
        const m = matches[i];
        const rawNodeToken = line.substring(prevTokenEnd, m.index).trim();
        nodeSegments.push({
          token: rawNodeToken,
          edgeLabelToNext: m.edgeLabel,
        });
        prevTokenEnd = m.index + m.text.length;
      }

      // Last node token after last edge operator
      const lastToken = line.substring(prevTokenEnd).trim();
      if (lastToken) {
        nodeSegments.push({ token: lastToken });
      }

      // Parse each node and create edges between consecutive nodes
      for (let i = 0; i < nodeSegments.length - 1; i++) {
        const sourceData = parseNodeToken(nodeSegments[i].token);
        const targetData = parseNodeToken(nodeSegments[i + 1].token);

        const sourceId = registerNode(sourceData.id, sourceData.label, sourceData.shape);
        const targetId = registerNode(targetData.id, targetData.label, targetData.shape);

        if (sourceId && targetId) {
          rawEdges.push({
            source: sourceId,
            target: targetId,
            label: nodeSegments[i].edgeLabelToNext,
            animated: true,
          });
        }
      }
    } else {
      // Standalone node declaration (e.g. A[My Service])
      const nodeData = parseNodeToken(line);
      if (nodeData.id) {
        registerNode(nodeData.id, nodeData.label, nodeData.shape);
      }
    }
  }

  // --- Topological Layering & Layout Engine ---
  // 1. Build adjacency list and in-degrees
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const [id] of nodeMap) {
    adj.set(id, []);
    inDegree.set(id, 0);
  }

  for (const edge of rawEdges) {
    if (adj.has(edge.source) && inDegree.has(edge.target)) {
      adj.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  }

  // 2. Compute Longest-Path Rank / Layer for each node
  const rank = new Map<string, number>();
  const queue: string[] = [];

  for (const [id, deg] of inDegree) {
    if (deg === 0) {
      queue.push(id);
      rank.set(id, 0);
    }
  }

  // Fallback if cyclic: initialize any unranked nodes
  if (queue.length === 0 && nodeMap.size > 0) {
    const firstId = Array.from(nodeMap.keys())[0];
    queue.push(firstId);
    rank.set(firstId, 0);
  }

  // BFS traversal with cycle protection
  let head = 0;
  const visitedCount = new Map<string, number>();

  while (head < queue.length) {
    const u = queue[head++];
    const currentRank = rank.get(u) || 0;
    const neighbors = adj.get(u) || [];

    for (const v of neighbors) {
      const vRank = rank.get(v) || 0;
      const newRank = Math.max(vRank, currentRank + 1);
      rank.set(v, newRank);

      const vVisits = (visitedCount.get(v) || 0) + 1;
      visitedCount.set(v, vVisits);

      // Prevent infinite loops on cycles (max 3 re-evaluations)
      if (vVisits <= 3 && !queue.includes(v)) {
        queue.push(v);
      }
    }
  }

  // Assign rank 0 to any remaining disconnected nodes
  for (const [id] of nodeMap) {
    if (!rank.has(id)) {
      rank.set(id, 0);
    }
  }

  // Group nodes by their rank/layer
  const layers = new Map<number, string[]>();
  for (const [id, r] of rank) {
    if (!layers.has(r)) layers.set(r, []);
    layers.get(r)!.push(id);
  }

  // Sort ranks
  const sortedRanks = Array.from(layers.keys()).sort((a, b) => a - b);

  // 3. Convert parsed nodes to ReactFlow nodes with inferred types & coordinates
  const rfNodes: any[] = [];
  const nodeIfElseOutCount = new Map<string, number>();

  for (const r of sortedRanks) {
    const nodesInLayer = layers.get(r) || [];
    const countInLayer = nodesInLayer.length;

    nodesInLayer.forEach((id, idx) => {
      const info = nodeMap.get(id)!;
      const textLower = (info.label + " " + info.id).toLowerCase();

      // Semantic Node Type Inference:
      let nodeType = "CustomNode";
      let role = "custom";
      let dbFormat: "sql" | "nosql" | undefined = undefined;

      if (
        info.rawShape === "diamond" ||
        textLower.includes("if") ||
        textLower.includes("?") ||
        textLower.includes("decision") ||
        textLower.includes("check")
      ) {
        nodeType = "IfElseNode";
      } else if (
        info.id.toLowerCase() === "start" ||
        info.label.toLowerCase() === "start" ||
        textLower.startsWith("start") ||
        (info.rawShape === "pill" && textLower.includes("start"))
      ) {
        nodeType = "StartNode";
      } else if (
        info.id.toLowerCase() === "end" ||
        info.label.toLowerCase() === "end" ||
        textLower.startsWith("end") ||
        (info.rawShape === "pill" && textLower.includes("end"))
      ) {
        nodeType = "EndNode";
      } else if (
        info.rawShape === "cylinder" ||
        textLower.includes("db") ||
        textLower.includes("database") ||
        textLower.includes("sql") ||
        textLower.includes("postgres") ||
        textLower.includes("mongo") ||
        textLower.includes("redis") ||
        textLower.includes("store")
      ) {
        nodeType = "CustomNode";
        role = "database";
        dbFormat =
          textLower.includes("mongo") || textLower.includes("redis") || textLower.includes("nosql")
            ? "nosql"
            : "sql";
      } else if (
        textLower.includes("ai") ||
        textLower.includes("llm") ||
        textLower.includes("gpt") ||
        textLower.includes("claude") ||
        textLower.includes("agent")
      ) {
        nodeType = "CustomNode";
        role = "ai";
      } else if (
        textLower.includes("front") ||
        textLower.includes("ui") ||
        textLower.includes("client") ||
        textLower.includes("web") ||
        textLower.includes("app") ||
        textLower.includes("react") ||
        textLower.includes("next")
      ) {
        nodeType = "CustomNode";
        role = "frontend";
      } else if (
        textLower.includes("back") ||
        textLower.includes("api") ||
        textLower.includes("server") ||
        textLower.includes("service") ||
        textLower.includes("gateway")
      ) {
        nodeType = "CustomNode";
        role = "backend";
      }

      // Dynamic Coordinate Positioning:
      let posX = 0;
      let posY = 0;

      if (direction === "LR") {
        // Horizontal Layout: Rank defines X, Layer Index defines Y
        posX = r * 300 + 100;
        const layerCenterOffset = ((countInLayer - 1) / 2) * 140;
        posY = idx * 140 - layerCenterOffset + 240;
      } else {
        // Vertical Layout (TD): Rank defines Y, Layer Index defines X
        posY = r * 220 + 80;
        const layerCenterOffset = ((countInLayer - 1) / 2) * 280;
        posX = idx * 280 - layerCenterOffset + 380;
      }

      // Build data payload
      const dataPayload: any = {
        label: info.label,
        name: info.label,
        type: nodeType,
        settings: {
          name: info.label,
          role,
          ...(dbFormat ? { dbFormat } : {}),
        },
      };

      if (nodeType === "CustomNode") {
        dataPayload.settings.role = role;
        if (role === "database") {
          dataPayload.settings.dbTableName = info.label.toLowerCase().replace(/\s+/g, "_");
        }
      }

      rfNodes.push({
        id: info.id,
        type: nodeType,
        position: { x: Math.round(posX), y: Math.round(posY) },
        data: dataPayload,
      });
    });
  }

  // 4. Convert edges to ReactFlow edges with intelligent handle routing
  const rfEdges: any[] = [];

  rawEdges.forEach((e, idx) => {
    const sourceNode = rfNodes.find((n) => n.id === e.source);
    const targetNode = rfNodes.find((n) => n.id === e.target);

    let sourceHandle: string | undefined = undefined;
    let targetHandle: string | undefined = undefined;

    // Handle mapping for StartNode
    if (sourceNode?.type === "StartNode") {
      sourceHandle = direction === "LR" ? "right" : "bottom";
    }

    // Handle mapping for EndNode
    if (targetNode?.type === "EndNode") {
      targetHandle = "top";
    }

    // Handle mapping for IfElseNode
    if (sourceNode?.type === "IfElseNode") {
      const outCount = nodeIfElseOutCount.get(e.source) || 0;
      nodeIfElseOutCount.set(e.source, outCount + 1);

      const edgeLabelLower = (e.label || "").toLowerCase();
      const isNegative =
        edgeLabelLower.includes("false") ||
        edgeLabelLower.includes("no") ||
        edgeLabelLower.includes("invalid") ||
        edgeLabelLower.includes("fail") ||
        edgeLabelLower.includes("err") ||
        edgeLabelLower.includes("reject");

      const isPositive =
        !isNegative &&
        (edgeLabelLower.includes("true") ||
          edgeLabelLower.includes("yes") ||
          edgeLabelLower.includes("valid") ||
          edgeLabelLower.includes("ok") ||
          edgeLabelLower.includes("success") ||
          edgeLabelLower.includes("pass"));

      if (isPositive) {
        sourceHandle = "true";
      } else if (isNegative) {
        sourceHandle = "false";
      } else {
        // Fallback: 1st edge is True (Right), 2nd edge is False (Left)
        sourceHandle = outCount === 0 ? "true" : "false";
      }
    }

    if (targetNode?.type === "IfElseNode") {
      targetHandle = "input";
    }

    // Handle mapping for CustomNode
    if (sourceNode?.type === "CustomNode") {
      if (sourceNode.data?.settings?.role === "frontend") {
        sourceHandle = "bottom";
      } else {
        sourceHandle = "right";
      }
    }

    if (targetNode?.type === "CustomNode") {
      if (targetNode.data?.settings?.role === "frontend") {
        targetHandle = "top";
      } else {
        targetHandle = "left";
      }
    }

    rfEdges.push({
      id: `edge-${e.source}-${e.target}-${idx}`,
      source: e.source,
      target: e.target,
      ...(sourceHandle ? { sourceHandle } : {}),
      ...(targetHandle ? { targetHandle } : {}),
      animated: true,
      label: e.label || undefined,
      style: { strokeWidth: 2 },
    });
  });

  return {
    nodes: rfNodes,
    edges: rfEdges,
    direction,
    nodeCount: rfNodes.length,
    edgeCount: rfEdges.length,
  };
}
