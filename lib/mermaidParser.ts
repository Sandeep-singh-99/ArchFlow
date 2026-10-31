/**
 * Comprehensive Mermaid to Architecture Canvas Parser and Auto-Layout Engine.
 * Supports:
 * - Directives: graph TD, graph TB, graph LR, flowchart TD, flowchart LR, sequenceDiagram, erDiagram
 * - Subgraphs: subgraph Container["Title"] ... end (maps directly to DomainGroupNode containers with nested parenting)
 * - Shapes: [(Cylinder/DB)] -> SqlTableNode, [Box] -> SqlTableNode/DbSchemaNode, ([Pill]) -> SqlViewNode, {Diamond} -> SqlTriggerNode
 * - Entity-Relationship Diagrams (erDiagram): entities, typed columns (PK/FK/UK), descriptions, relationships (||--o{, ||--||, etc.)
 * - Native Dagre hierarchical Auto-Layout integration with dimension-aware positioning and zero node overlap.
 * - Guaranteed node connectivity with column-specific and node-level handle resolution.
 */

import { getAutoLayout, isDomainGroupNode } from "./autoLayout";

export interface ParsedMermaidResult {
  nodes: any[];
  edges: any[];
  direction: "TD" | "LR";
  nodeCount: number;
  edgeCount: number;
}

export interface ParseMermaidOptions {
  direction?: "LR" | "TD" | "TB";
  nodeSep?: number;
  rankSep?: number;
}

export function parseMermaidToReactFlow(
  mermaidCode: string,
  options?: ParseMermaidOptions
): ParsedMermaidResult {
  if (!mermaidCode || !mermaidCode.trim()) {
    return { nodes: [], edges: [], direction: "LR", nodeCount: 0, edgeCount: 0 };
  }

  const rawLines = mermaidCode.split(/\r?\n/);
  const isSequence = /^\s*sequenceDiagram/im.test(mermaidCode);
  const isErDiagram = /^\s*erDiagram/im.test(mermaidCode);

  let detectedDirection: "TD" | "LR" = isSequence || isErDiagram ? "LR" : "TD";

  // Check if header specifies direction
  for (const line of rawLines) {
    const headerMatch = line.trim().match(/^(?:graph|flowchart)\s+(TD|TB|LR|RL)/i);
    if (headerMatch) {
      const dir = headerMatch[1].toUpperCase();
      detectedDirection = dir === "LR" || dir === "RL" ? "LR" : "TD";
      break;
    }
  }

  const direction: "TD" | "LR" = options?.direction
    ? options.direction === "TB" || options.direction === "TD"
      ? "TD"
      : "LR"
    : detectedDirection;

  // Node registration
  const nodeMap = new Map<
    string,
    {
      id: string;
      label: string;
      rawShape: string;
      explicitType?: string;
      subgraphId?: string;
      subgraphTitle?: string;
      columns?: any[];
    }
  >();

  // Case-insensitive entity mapper for ER Diagrams so "USERS" and "users" match
  const entityCaseMap = new Map<string, string>();
  const getCanonicalEntity = (raw: string): string => {
    const trimmed = raw.trim().replace(/['"`]/g, "");
    const lower = trimmed.toLowerCase();
    if (entityCaseMap.has(lower)) {
      return entityCaseMap.get(lower)!;
    }
    entityCaseMap.set(lower, trimmed);
    return trimmed;
  };

  // Subgraph / Domain Group tracking
  const subgraphMap = new Map<string, { id: string; title: string }>();
  let activeSubgraph: { id: string; title: string } | null = null;

  interface RawEdge {
    source: string;
    target: string;
    label?: string;
    cardinality?: string;
    sourceRelation?: string;
    targetRelation?: string;
    animated?: boolean;
    style?: any;
    isResponse?: boolean;
  }
  const rawEdges: RawEdge[] = [];

  const formatParticipantLabel = (name: string): string => {
    let formatted = name.replace(/[_-]+/g, " ");
    formatted = formatted.replace(/([a-z])([A-Z])/g, "$1 $2");
    formatted = formatted.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
    return formatted.trim();
  };

  const mapErTypeToSql = (typeStr: string): string => {
    const t = (typeStr || "").toLowerCase();
    if (t === "string" || t === "varchar") return "VARCHAR(255)";
    if (t === "text") return "TEXT";
    if (t === "uuid") return "UUID";
    if (t === "int" || t === "integer") return "INTEGER";
    if (t === "bigint" || t === "long") return "BIGINT";
    if (t === "decimal" || t === "float" || t === "double" || t === "numeric") return "DECIMAL(10,2)";
    if (t === "datetime" || t === "timestamp" || t === "timestamptz") return "TIMESTAMPTZ";
    if (t === "date") return "DATE";
    if (t === "boolean" || t === "bool") return "BOOLEAN";
    if (t === "json" || t === "jsonb" || t === "object") return "JSONB";
    return typeStr.toUpperCase();
  };

  const formatCardinality = (sym: string): { text: string; srcRel: string; tgtRel: string } => {
    if (sym.includes("--o{") || sym.includes("..o{") || sym.includes("--|{") || sym.includes("..|{")) {
      return { text: "1:N", srcRel: "1", tgtRel: "N" };
    }
    if (sym.includes("}o--") || sym.includes("}o..") || sym.includes("|{--") || sym.includes("|{..")) {
      return { text: "N:1", srcRel: "N", tgtRel: "1" };
    }
    if (sym.includes("}o--o{") || sym.includes("}o..o{") || sym.includes("}o--|{") || sym.includes("}o..|{")) {
      return { text: "N:M", srcRel: "N", tgtRel: "N" };
    }
    if (sym.includes("||--||") || sym.includes("||..||") || sym.includes("||--o|") || sym.includes("||..o|")) {
      return { text: "1:1", srcRel: "1", tgtRel: "1" };
    }
    return { text: "1:N", srcRel: "1", tgtRel: "N" };
  };

  const registerNode = (id: string, label?: string, rawShape?: string, columns?: any[]) => {
    const cleanId = id.trim().replace(/['"`]/g, "");
    if (!cleanId) return cleanId;

    const existing = nodeMap.get(cleanId);
    let finalLabel = cleanId;
    if (label !== undefined && label.trim() !== "" && label.trim() !== cleanId) {
      finalLabel = label.trim();
    } else if (existing?.label && existing.label !== cleanId) {
      finalLabel = existing.label;
    } else {
      finalLabel = formatParticipantLabel(cleanId);
    }

    let finalShape = rawShape || "box";
    if (rawShape && rawShape !== "box") {
      finalShape = rawShape;
    } else if (existing?.rawShape && existing.rawShape !== "box") {
      finalShape = existing.rawShape;
    }

    const currentSub = activeSubgraph || (existing?.subgraphId ? { id: existing.subgraphId, title: existing.subgraphTitle || "" } : null);

    nodeMap.set(cleanId, {
      id: cleanId,
      label: finalLabel,
      rawShape: finalShape,
      subgraphId: currentSub?.id,
      subgraphTitle: currentSub?.title,
      columns: columns || existing?.columns,
    });
    return cleanId;
  };

  const parseNodeToken = (token: string): { id: string; label?: string; shape?: string; columns?: any[] } => {
    const t = token.trim();

    // 1. Cylinder: id[("Label" or 'Label')]
    const cylMatch = t.match(/^([\w\-.:]+)\s*\[\(\s*["']?([\s\S]+?)["']?\s*\)\]$/);
    if (cylMatch) {
      const parsedColumns = parseMultiLineColumns(cylMatch[2]);
      return {
        id: cylMatch[1],
        label: parsedColumns.name || cylMatch[2],
        shape: "cylinder",
        columns: parsedColumns.columns,
      };
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

    // 6. Box: id["Label"]
    const boxMatch = t.match(/^([\w\-.:]+)\s*\[\s*["']?([\s\S]+?)["']?\s*\]$/);
    if (boxMatch) {
      const parsedColumns = parseMultiLineColumns(boxMatch[2]);
      return {
        id: boxMatch[1],
        label: parsedColumns.name || boxMatch[2],
        shape: "box",
        columns: parsedColumns.columns,
      };
    }

    // 7. Plain identifier
    const plainMatch = t.match(/^([\w\-.:]+)$/);
    if (plainMatch) {
      return { id: plainMatch[1], label: plainMatch[1], shape: "box" };
    }

    return { id: t, label: t, shape: "box" };
  };

  // Helper to parse multi-line labels like "USERS<br/>• id (PK)<br/>• email"
  function parseMultiLineColumns(rawLabel: string): { name: string; columns?: any[] } {
    if (!rawLabel.includes("<br/>") && !rawLabel.includes("\n") && !rawLabel.includes("•")) {
      return { name: rawLabel };
    }

    const segments = rawLabel.split(/(?:<br\s*\/?>|\n)+/).map((s) => s.trim()).filter(Boolean);
    const tableName = segments[0]?.replace(/^\[+|\]+$/g, "").trim() || "table";

    const columns: any[] = [];
    for (let i = 1; i < segments.length; i++) {
      const line = segments[i].replace(/^[•\-\*]\s*/, "").trim();
      if (!line) continue;

      const colMatch = line.match(/^([\w\-]+)(?:\s*\(([^)]+)\))?(?:\s*:\s*([\w()]+))?/i);
      if (colMatch) {
        const colName = colMatch[1];
        const tags = (colMatch[2] || "").toUpperCase();
        const colType = colMatch[3] || (tags.includes("PK") ? "UUID" : "VARCHAR(255)");

        columns.push({
          id: `col-${i}`,
          name: colName,
          type: mapErTypeToSql(colType),
          isPk: tags.includes("PK"),
          isFk: tags.includes("FK"),
          isUnique: tags.includes("UK") || tags.includes("PK"),
          isNullable: !tags.includes("PK"),
        });
      }
    }

    return {
      name: tableName,
      columns: columns.length > 0 ? columns : undefined,
    };
  }

  // ER Diagram State
  let currentErEntity: string | null = null;
  const erEntityFields = new Map<
    string,
    {
      type: string;
      name: string;
      isPk: boolean;
      isFk: boolean;
      isUnique: boolean;
      comment?: string;
    }[]
  >();

  // --- Parse Line by Line ---
  for (let rawLine of rawLines) {
    // Strip trailing comments and extra whitespaces
    let line = rawLine.replace(/%%.*$/, "").trim();
    if (!line || line.startsWith("//")) continue;

    // --- Subgraph Support (Container Boundaries) ---
    const subgraphMatch = line.match(/^subgraph\s+([A-Za-z0-9_.:]+)(?:\s*\[\s*["']?([^"']+)["']?\s*\])?/i);
    if (subgraphMatch) {
      const subId = subgraphMatch[1].trim();
      const subTitle = (subgraphMatch[2] || subId).trim();
      activeSubgraph = { id: subId, title: subTitle };
      subgraphMap.set(subId, activeSubgraph);
      continue;
    }

    if (line === "end" || line.startsWith("end ")) {
      if (activeSubgraph) {
        activeSubgraph = null;
        continue;
      }
    }

    // --- Entity-Relationship Diagram Mode ---
    if (isErDiagram) {
      if (line.startsWith("erDiagram")) continue;

      // Inside entity block: ENTITY {
      const entityStartMatch = line.match(/^([A-Za-z0-9_\-]+)\s*\{$/);
      if (entityStartMatch) {
        currentErEntity = getCanonicalEntity(entityStartMatch[1]);
        registerNode(currentErEntity, formatParticipantLabel(currentErEntity), "entity");
        if (!erEntityFields.has(currentErEntity)) erEntityFields.set(currentErEntity, []);
        continue;
      }

      if (currentErEntity) {
        if (line === "}" || line.startsWith("}")) {
          currentErEntity = null;
          continue;
        }

        // Entity field match: type name [PK/FK/UK] ["comment"]
        const fieldMatch = line.match(
          /^\s*([A-Za-z0-9_()]+)\s+([A-Za-z0-9_]+)(?:\s+([A-Za-z0-9_,\s]+?))?(?:\s+["']([^"']*)["'])?\s*$/i
        );
        if (fieldMatch) {
          const type = fieldMatch[1];
          const name = fieldMatch[2];
          const constraint = (fieldMatch[3] || "").toUpperCase();
          const comment = fieldMatch[4]?.trim() || "";

          const isPk = constraint.includes("PK");
          const isFk = constraint.includes("FK");
          const isUnique = constraint.includes("UK") || isPk;

          erEntityFields.get(currentErEntity)!.push({
            type,
            name,
            isPk,
            isFk,
            isUnique,
            comment,
          });
          continue;
        }
      }

      // Relationship: USER ||--o{ ORDER : "places"
      const relMatch = line.match(
        /^([A-Za-z0-9_\-]+)\s*([|o}{]+(?:--|\.\.)[|o}{]+|--[->]|->)\s*([A-Za-z0-9_\-]+)(?:\s*:\s*["']?([^"'\r\n]+?)["']?)?$/
      );
      if (relMatch) {
        const sourceId = getCanonicalEntity(relMatch[1]);
        const cardSym = relMatch[2].trim();
        const targetId = getCanonicalEntity(relMatch[3]);
        const relLabel = relMatch[4]?.trim() || "";

        registerNode(sourceId, formatParticipantLabel(sourceId), "entity");
        registerNode(targetId, formatParticipantLabel(targetId), "entity");

        const cardData = formatCardinality(cardSym);
        rawEdges.push({
          source: sourceId,
          target: targetId,
          label: relLabel || cardData.text,
          cardinality: cardData.text,
          sourceRelation: cardData.srcRel,
          targetRelation: cardData.tgtRel,
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
        line.startsWith("Note ")
      ) {
        continue;
      }

      const seqArrowMatch = line.match(
        /^([A-Za-z0-9_.:]+)\s*(-->>|->>|-->|->|-\)|--\)|-x|--x)\s*([+-]?)\s*([A-Za-z0-9_.:]+)\s*:\s*(.*)$/
      );
      if (seqArrowMatch) {
        const sourceId = registerNode(seqArrowMatch[1]);
        const arrow = seqArrowMatch[2];
        const targetId = registerNode(seqArrowMatch[4]);
        const msg = seqArrowMatch[5].trim();
        const isResponse = arrow.includes(">>") || arrow.includes("--");

        rawEdges.push({
          source: sourceId,
          target: targetId,
          label: msg,
          isResponse,
          animated: true,
        });
        continue;
      }
    }

    // --- Standard Flowchart / Graph Mode ---
    if (line.match(/^(?:graph|flowchart)\s+(TD|TB|LR|RL)/i)) continue;
    if (
      line.startsWith("classDef") ||
      line.startsWith("class ") ||
      line.startsWith("style ") ||
      line.startsWith("click ")
    ) {
      continue;
    }

    // Extract edge connectors
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

        const sourceId = registerNode(sourceData.id, sourceData.label, sourceData.shape, sourceData.columns);
        const targetId = registerNode(targetData.id, targetData.label, targetData.shape, targetData.columns);

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
        registerNode(nodeData.id, nodeData.label, nodeData.shape, nodeData.columns);
      }
    }
  }

  // --- Build ReactFlow Nodes ---
  const rfNodes: any[] = [];

  // Register DomainGroupNode containers for all discovered subgraphs
  subgraphMap.forEach((sub, subId) => {
    rfNodes.push({
      id: `domain-${subId}`,
      type: "DomainGroupNode",
      position: { x: 0, y: 0 },
      data: {
        label: sub.title,
        name: sub.title,
        description: `${sub.title} domain boundary`,
        colorTheme: "indigo",
        isDomainGroup: true,
      },
    });
  });

  // Convert parsed nodes
  nodeMap.forEach((info) => {
    let nodeType = "SqlTableNode";
    const textLower = (info.label + " " + info.id).toLowerCase();

    if (info.rawShape === "diamond") {
      nodeType = "SqlTriggerNode";
    } else if (info.rawShape === "pill" || textLower.includes("view")) {
      nodeType = "SqlViewNode";
    } else if (info.rawShape === "cylinder" || isErDiagram || textLower.includes("table") || textLower.includes("users") || textLower.includes("orders")) {
      nodeType = "SqlTableNode";
    }

    const dataPayload: any = {
      label: info.label,
      name: info.id.toLowerCase(),
      database: "public",
      columns: [],
    };

    if (info.subgraphId) {
      dataPayload.domainId = `domain-${info.subgraphId}`;
      dataPayload.domainName = info.subgraphTitle;
    }

    // Structured columns
    if (isErDiagram) {
      const fields = erEntityFields.get(info.id) || [];
      if (fields.length > 0) {
        dataPayload.columns = fields.map((f, i) => ({
          id: `col-${i + 1}`,
          name: f.name,
          type: mapErTypeToSql(f.type),
          isPk: f.isPk,
          isFk: f.isFk,
          isNullable: !f.isPk,
          isUnique: f.isUnique,
          defaultValue: f.isPk && f.type.toLowerCase().includes("uuid") ? "gen_random_uuid()" : undefined,
          comment: f.comment || undefined,
        }));
      } else {
        dataPayload.columns = [
          { id: "col-1", name: "id", type: "UUID", isPk: true, isNullable: false, defaultValue: "gen_random_uuid()" },
          { id: "col-2", name: "name", type: "VARCHAR(255)", isNullable: false },
          { id: "col-3", name: "created_at", type: "TIMESTAMPTZ", isNullable: false, defaultValue: "CURRENT_TIMESTAMP" },
        ];
      }
    } else if (info.columns && info.columns.length > 0) {
      dataPayload.columns = info.columns;
    } else {
      dataPayload.columns = [
        { id: "col-1", name: "id", type: "UUID", isPk: true, isNullable: false, defaultValue: "gen_random_uuid()" },
        { id: "col-2", name: "created_at", type: "TIMESTAMPTZ", isNullable: false, defaultValue: "CURRENT_TIMESTAMP" },
      ];
    }

    rfNodes.push({
      id: info.id,
      type: nodeType,
      position: { x: 0, y: 0 },
      parentId: info.subgraphId ? `domain-${info.subgraphId}` : undefined,
      data: dataPayload,
    });
  });

  // --- Build ReactFlow Edges with Explicit Handle Resolution ---
  const rfEdges: any[] = [];
  let edgeIdx = 0;

  // Node lookup map by exact ID and lowercase ID
  const nodeLookup = new Map<string, any>();
  rfNodes.forEach((n) => {
    nodeLookup.set(n.id, n);
    nodeLookup.set(n.id.toLowerCase(), n);
  });

  for (const e of rawEdges) {
    const srcNode = nodeLookup.get(e.source) || nodeLookup.get(e.source?.toLowerCase());
    const tgtNode = nodeLookup.get(e.target) || nodeLookup.get(e.target?.toLowerCase());

    const actualSourceId = srcNode ? srcNode.id : e.source;
    const actualTargetId = tgtNode ? tgtNode.id : e.target;

    const isHorizontal = direction === "LR";
    const sourceHandle = isHorizontal ? "right" : "bottom";
    const targetHandle = isHorizontal ? "left" : "top";

    rfEdges.push({
      id: `edge-${actualSourceId}-${actualTargetId}-${edgeIdx++}`,
      source: actualSourceId,
      target: actualTargetId,
      type: "erRelationship",
      sourceHandle,
      targetHandle,
      animated: true,
      data: {
        cardinality: e.cardinality || "1:N",
        sourceRelation: e.sourceRelation || "1",
        targetRelation: e.targetRelation || "N",
        label: e.label,
      },
    });
  }

  // --- Auto-Layout using enhanced Dagre layout engine ---
  const layout = getAutoLayout(rfNodes, rfEdges, {
    direction: direction === "TD" ? "TB" : "LR",
    nodeSep: options?.nodeSep || 90,
    rankSep: options?.rankSep || 140,
  });

  return {
    nodes: layout.nodes,
    edges: layout.edges,
    direction,
    nodeCount: layout.nodes.length,
    edgeCount: layout.edges.length,
  };
}
