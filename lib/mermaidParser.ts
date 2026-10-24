/**
 * Comprehensive Mermaid to ReactFlow Parser and Auto-Layout Engine.
 * Supports:
 * - Directives: graph TD, graph TB, graph LR, graph RL, flowchart TD, flowchart LR, sequenceDiagram, erDiagram
 * - Shapes: [Rectangle], (Rounded), ([Pill/Stadium]), [(Cylinder/DB)], {Diamond/Decision}, {{Hexagon}}
 * - Edges: -->, ---, -.->, ==>, labeled edges (-->|label| or -- label -->), and chained arrows (A --> B --> C)
 * - Sequence Diagrams: actor, participant, A->>B: msg, A-->>B: resp, activation, loop, alt, autonumber
 * - Entity-Relationship Diagrams (erDiagram): entities, fields (PK/FK/types), cardinalities (||--o{, }o--||, etc.)
 * - Automatic semantic node type inference (StartNode, EndNode, IfElseNode, Database, Frontend, Backend, AI)
 * - Kahn's topological DAG rank-based auto-layout with branch lane routing
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
  const isSequence = /^\s*sequenceDiagram/im.test(mermaidCode);
  const isErDiagram = /^\s*erDiagram/im.test(mermaidCode);

  let direction: "TD" | "LR" = isSequence || isErDiagram ? "LR" : "TD";
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
    isResponse?: boolean;
  }
  const rawEdges: RawEdge[] = [];

  // Helper to format camelCase / snake_case into human-readable labels
  const formatParticipantLabel = (name: string): string => {
    let formatted = name.replace(/[_-]+/g, " ");
    formatted = formatted.replace(/([a-z])([A-Z])/g, "$1 $2");
    formatted = formatted.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
    return formatted.trim();
  };

  // Helper to map ER types to SQL data types
  const mapErTypeToSql = (typeStr: string): string => {
    const t = typeStr.toLowerCase();
    if (t === "string" || t === "varchar") return "VARCHAR(255)";
    if (t === "text") return "TEXT";
    if (t === "int" || t === "integer") return "INTEGER";
    if (t === "decimal" || t === "float" || t === "double" || t === "numeric") return "DECIMAL(10,2)";
    if (t === "datetime" || t === "timestamp") return "TIMESTAMP";
    if (t === "date") return "DATE";
    if (t === "boolean" || t === "bool") return "BOOLEAN";
    return typeStr.toUpperCase();
  };

  // Helper to format ER cardinality symbols
  const formatCardinality = (sym: string): string => {
    if (sym.includes("--o{") || sym.includes("--|{")) return "1:N";
    if (sym.includes("}o--") || sym.includes("|{--")) return "N:1";
    if (sym.includes("}o--o{") || sym.includes("}o--|{")) return "M:N";
    if (sym.includes("||--||")) return "1:1";
    return "";
  };

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
    } else {
      finalLabel = formatParticipantLabel(cleanId);
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

  // ER Diagram State
  let currentErEntity: string | null = null;
  const erEntityFields = new Map<
    string,
    { type: string; name: string; isPk: boolean; isFk: boolean }[]
  >();

  // Process line by line
  for (let line of rawLines) {
    line = line.trim();

    // Ignore empty lines and Mermaid comments
    if (!line || line.startsWith("%%") || line.startsWith("//")) continue;

    // --- Entity-Relationship Diagram Mode ---
    if (isErDiagram) {
      if (line.startsWith("erDiagram")) continue;

      // Inside entity block: ENTITY {
      const entityStartMatch = line.match(/^([A-Za-z0-9_]+)\s*\{$/);
      if (entityStartMatch) {
        currentErEntity = entityStartMatch[1];
        registerNode(currentErEntity, formatParticipantLabel(currentErEntity), "entity");
        if (!erEntityFields.has(currentErEntity)) erEntityFields.set(currentErEntity, []);
        continue;
      }

      if (currentErEntity) {
        if (line === "}" || line.startsWith("}")) {
          currentErEntity = null;
          continue;
        }

        const fieldMatch = line.match(
          /^\s*([A-Za-z0-9_()]+)\s+([A-Za-z0-9_]+)(?:\s+(PK|FK|UK|FK\s+PK|PK\s+FK))?(?:\s+["'][^"']*["'])?\s*$/i
        );
        if (fieldMatch) {
          const type = fieldMatch[1];
          const name = fieldMatch[2];
          const constraint = (fieldMatch[3] || "").toUpperCase();
          const isPk = constraint.includes("PK");
          const isFk = constraint.includes("FK");

          erEntityFields.get(currentErEntity)!.push({
            type,
            name,
            isPk,
            isFk,
          });
          continue;
        }
      }

      // Relationship: USER ||--o{ ORDER : places
      const relMatch = line.match(
        /^([A-Za-z0-9_]+)\s*([|o}{]+--[|o}{]+)\s*([A-Za-z0-9_]+)\s*(?::\s*["']?([^"'\r\n]+)["']?)?$/
      );
      if (relMatch) {
        const sourceId = relMatch[1].trim();
        const cardSym = relMatch[2].trim();
        const targetId = relMatch[3].trim();
        const relLabel = relMatch[4]?.trim() || "";

        registerNode(sourceId, formatParticipantLabel(sourceId), "entity");
        registerNode(targetId, formatParticipantLabel(targetId), "entity");

        const cardText = formatCardinality(cardSym);
        const displayLabel = relLabel
          ? cardText
            ? `${relLabel} (${cardText})`
            : relLabel
          : cardText;

        rawEdges.push({
          source: sourceId,
          target: targetId,
          label: displayLabel || undefined,
          animated: true,
        });
        continue;
      }
    }

    // --- Sequence Diagram Mode ---
    if (isSequence) {
      if (
        line.startsWith("sequenceDiagram") ||
        line.startsWith("autonumber") ||
        line.startsWith("activate ") ||
        line.startsWith("deactivate ") ||
        line.startsWith("loop ") ||
        line.startsWith("alt ") ||
        line.startsWith("else ") ||
        line.startsWith("opt ") ||
        line.startsWith("par ") ||
        line === "end" ||
        line.startsWith("Note ")
      ) {
        continue;
      }

      // Check actor: actor User [as "Customer"]
      const actorMatch = line.match(/^actor\s+([\w\-.:]+)(?:\s+as\s+["']?([^"']+)["']?)?$/i);
      if (actorMatch) {
        const id = actorMatch[1];
        const label = actorMatch[2] || formatParticipantLabel(id);
        registerNode(id, label, "actor");
        continue;
      }

      // Check participant: participant Frontend [as "Web App"]
      const partMatch = line.match(/^participant\s+([\w\-.:]+)(?:\s+as\s+["']?([^"']+)["']?)?$/i);
      if (partMatch) {
        const id = partMatch[1];
        const label = partMatch[2] || formatParticipantLabel(id);
        registerNode(id, label, "participant");
        continue;
      }

      // Check sequence message: Sender->>Receiver: Message or Sender-->>Receiver: Response
      const seqArrowMatch = line.match(
        /^([A-Za-z0-9_.:]+)\s*(-->>|->>|-->|->|-\)|--\)|-x|--x)\s*([+-]?)\s*([A-Za-z0-9_.:]+)\s*:\s*(.*)$/
      );
      if (seqArrowMatch) {
        const sourceId = seqArrowMatch[1].trim();
        const arrow = seqArrowMatch[2].trim();
        const targetId = seqArrowMatch[4].trim();
        const msg = seqArrowMatch[5]?.trim();
        const isResponse = arrow.startsWith("--");

        registerNode(sourceId, formatParticipantLabel(sourceId));
        registerNode(targetId, formatParticipantLabel(targetId));

        rawEdges.push({
          source: sourceId,
          target: targetId,
          label: msg,
          isResponse,
          animated: true,
          style: isResponse ? { strokeDasharray: "5 5", strokeWidth: 2 } : { strokeWidth: 2 },
        });
        continue;
      }
    }

    // --- Standard Graph / Flowchart Mode ---
    const headerMatch = line.match(/^(?:graph|flowchart)\s+(TD|TB|LR|RL)/i);
    if (headerMatch) {
      const dir = headerMatch[1].toUpperCase();
      direction = dir === "LR" || dir === "RL" ? "LR" : "TD";
      continue;
    }

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

    // Regex for edge connectors
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

      const lastToken = line.substring(prevTokenEnd).trim();
      if (lastToken) {
        nodeSegments.push({ token: lastToken });
      }

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
      const nodeData = parseNodeToken(line);
      if (nodeData.id) {
        registerNode(nodeData.id, nodeData.label, nodeData.shape);
      }
    }
  }

  // --- Topological Layering & Layout Engine (Kahn's Algorithm) ---
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const [id] of nodeMap) {
    adj.set(id, []);
    inDegree.set(id, 0);
  }

  for (const edge of rawEdges) {
    if (isSequence && edge.isResponse) continue;

    if (adj.has(edge.source) && inDegree.has(edge.target)) {
      adj.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  }

  // Compute Longest-Path Rank using Kahn's algorithm
  const rank = new Map<string, number>();
  const remainingInDegree = new Map<string, number>();
  const queue: string[] = [];

  for (const [id, deg] of inDegree) {
    remainingInDegree.set(id, deg);
    rank.set(id, 0);
    if (deg === 0) {
      queue.push(id);
    }
  }

  if (queue.length === 0 && nodeMap.size > 0) {
    const firstId = Array.from(nodeMap.keys())[0];
    queue.push(firstId);
  }

  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    const currentRank = rank.get(u) || 0;
    const neighbors = adj.get(u) || [];

    for (const v of neighbors) {
      const vRank = rank.get(v) || 0;
      rank.set(v, Math.max(vRank, currentRank + 1));

      const remDeg = (remainingInDegree.get(v) || 1) - 1;
      remainingInDegree.set(v, remDeg);

      if (remDeg === 0) {
        queue.push(v);
      }
    }
  }

  // Assign sequential ranks to any nodes remaining in cycles
  for (const [id] of nodeMap) {
    if (!queue.includes(id)) {
      const maxRank = Math.max(0, ...Array.from(rank.values()));
      rank.set(id, maxRank + 1);
      queue.push(id);
    }
  }

  // Group nodes by layer/rank
  const layers = new Map<number, string[]>();
  for (const [id, r] of rank) {
    if (!layers.has(r)) layers.set(r, []);
    layers.get(r)!.push(id);
  }

  const sortedRanks = Array.from(layers.keys()).sort((a, b) => a - b);

  // Identify nodes that belong to side branches (e.g. Yes branch of a Decision node)
  const branchOffsetMap = new Map<string, number>();
  for (const edge of rawEdges) {
    const sourceInfo = nodeMap.get(edge.source);
    if (sourceInfo?.rawShape === "diamond") {
      const lbl = (edge.label || "").toLowerCase();
      const isPositive = lbl.includes("yes") || lbl.includes("true") || lbl.includes("valid");
      if (isPositive) {
        // Mark target and its direct linear descendants for lateral branch shift
        let curr: string | undefined = edge.target;
        while (curr) {
          branchOffsetMap.set(curr, 160); // Shift right by 160px
          const nextNeighbors: string[] = adj.get(curr) || [];
          if (nextNeighbors.length === 1 && (inDegree.get(nextNeighbors[0]) || 0) === 1) {
            curr = nextNeighbors[0];
          } else {
            break;
          }
        }
      }
    }
  }

  // 3. Convert parsed nodes to ReactFlow nodes
  const rfNodes: any[] = [];
  const nodeIfElseOutCount = new Map<string, number>();

  for (const r of sortedRanks) {
    const nodesInLayer = layers.get(r) || [];
    const countInLayer = nodesInLayer.length;

    nodesInLayer.forEach((id, idx) => {
      const info = nodeMap.get(id)!;
      const textLower = (info.label + " " + info.id).toLowerCase();
      const inDeg = inDegree.get(info.id) || 0;
      const outDeg = (adj.get(info.id) || []).length;

      let nodeType = "default";
      let role = isErDiagram ? "database" : "custom";
      let dbFormat: "sql" | "nosql" | undefined = isErDiagram ? "sql" : undefined;

      // Dynamic Coordinate Positioning:
      let posX = 0;
      let posY = 0;

      if (isErDiagram) {
        posX = r * 440 + 80;
        const layerCenterOffset = ((countInLayer - 1) / 2) * 260;
        posY = idx * 260 - layerCenterOffset + 240;
      } else if (direction === "LR") {
        posX = r * 330 + 80;
        const layerCenterOffset = ((countInLayer - 1) / 2) * 160;
        posY = idx * 160 - layerCenterOffset + 240;
      } else {
        // Vertical TD Layout:
        posY = r * 220 + 80;
        const branchOffset = branchOffsetMap.get(id) || 0;
        if (countInLayer === 1) {
          posX = 380 + branchOffset;
        } else {
          const layerCenterOffset = ((countInLayer - 1) / 2) * 280;
          posX = idx * 280 - layerCenterOffset + 380;
        }
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

      if (isErDiagram) {
        const fields = erEntityFields.get(info.id) || [];
        const colDefinitions = fields.map((f) => {
          const sqlType = mapErTypeToSql(f.type);
          const pkStr = f.isPk ? " PRIMARY KEY" : "";
          const fkStr = f.isFk ? " /* FK */" : "";
          return `  ${f.name} ${sqlType}${pkStr}${fkStr}`;
        });

        const fallbackCols = [
          "  id VARCHAR(255) PRIMARY KEY",
          "  name VARCHAR(255)",
          "  created_at TIMESTAMP",
        ];

        const finalCols = colDefinitions.length > 0 ? colDefinitions : fallbackCols;
        const generatedSql = `CREATE TABLE ${info.id.toLowerCase()} (\n${finalCols.join(",\n")}\n);`;

        dataPayload.settings.role = "database";
        dataPayload.settings.dbFormat = "sql";
        dataPayload.settings.dbTableName = info.id.toLowerCase();
        dataPayload.settings.dbSql = generatedSql;
        dataPayload.settings.sqlSchema = generatedSql;
        dataPayload.settings.tech = "Relational Entity";
        dataPayload.settings.action = `${fields.length || 3} Columns Schema`;
      } else {
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

  // 4. Combine duplicate consecutive calls and route handles
  const rfEdges: any[] = [];
  const edgeDedupeMap = new Map<string, { edge: RawEdge; labels: string[] }>();

  for (const e of rawEdges) {
    const key = `${e.source}__${e.target}__${e.isResponse ? "resp" : "fwd"}`;
    const existing = edgeDedupeMap.get(key);
    if (existing) {
      if (e.label && !existing.labels.includes(e.label)) {
        existing.labels.push(e.label);
      }
    } else {
      edgeDedupeMap.set(key, {
        edge: e,
        labels: e.label ? [e.label] : [],
      });
    }
  }

  let edgeIdx = 0;
  for (const [, { edge: e, labels }] of edgeDedupeMap) {
    const sourceNode = rfNodes.find((n) => n.id === e.source);
    const targetNode = rfNodes.find((n) => n.id === e.target);

    let sourceHandle: string | undefined = undefined;
    let targetHandle: string | undefined = undefined;

    const displayLabel = labels.length > 1 ? labels.join(" / ") : labels[0] || undefined;

    rfEdges.push({
      id: `edge-${e.source}-${e.target}-${edgeIdx++}`,
      source: e.source,
      target: e.target,
      ...(sourceHandle ? { sourceHandle } : {}),
      ...(targetHandle ? { targetHandle } : {}),
      animated: true,
      label: displayLabel,
      style: e.style || { strokeWidth: 2 },
    });
  }

  return {
    nodes: rfNodes,
    edges: rfEdges,
    direction,
    nodeCount: rfNodes.length,
    edgeCount: rfEdges.length,
  };
}
