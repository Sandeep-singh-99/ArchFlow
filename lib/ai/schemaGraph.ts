import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { Edge, Node } from "@xyflow/react";
import { z } from "zod";
import { withGeminiKeyRotation } from "@/lib/ai/geminiKeyManager";
import { findMatchingNode, resolveNodeFieldHandle } from "@/lib/fieldHandleResolver";
import { getSchemaType } from "@/lib/schemaClassifier";

export interface ThinkingStep {
  agent: string;
  title: string;
  thought: string;
  timestamp: number;
}

export interface ProposedEdgeSpec {
  sourceNode: string;
  sourceColumn?: string;
  targetNode: string;
  targetColumn?: string;
  cardinality:
    | "1:N"
    | "1:1"
    | "N:M"
    | "N:1"
    | "enum"
    | "type"
    | "crows-one-many"
    | "crows-zero-many"
    | "crows-one-one";
  reason: string;
}

export interface ProposedNodeSpec {
  nodeType:
    | "SqlIndexNode"
    | "SqlEnumNode"
    | "SqlViewNode"
    | "NosqlIndexNode"
    | "NosqlEmbeddedNode"
    | "NosqlReferenceNode"
    | "NosqlValidationNode";
  name: string;
  relatedToNode: string;
  relatedColumn?: string;
  edgeCardinality:
    | "1:N"
    | "1:1"
    | "N:M"
    | "N:1"
    | "enum"
    | "type"
    | "crows-one-many"
    | "crows-zero-many"
    | "crows-one-one";
  data: Record<string, unknown>;
  reason: string;
}

export interface ColumnAdditionSpec {
  nodeName: string;
  columnName: string;
  columnType: string;
  isFk?: boolean;
  isNullable?: boolean;
}

const AnalyzerOutputSchema = z.object({
  thinking: z.string(),
  domainSummary: z.string(),
  entityInsights: z.array(z.string()).default([]),
});

const CardinalityEnum = z.enum([
  "1:N",
  "1:1",
  "N:M",
  "N:1",
  "enum",
  "type",
  "crows-one-many",
  "crows-zero-many",
  "crows-one-one",
]);

const optionalString = z
  .string()
  .nullish()
  .transform((v) => v ?? undefined);

const optionalBool = z
  .boolean()
  .nullish()
  .transform((v) => v ?? undefined);

const RelationshipOutputSchema = z.object({
  thinking: z.string().default(""),
  relationships: z
    .array(
      z.object({
        sourceNode: z.string(),
        sourceColumn: optionalString,
        targetNode: z.string(),
        targetColumn: optionalString,
        cardinality: CardinalityEnum.nullish().transform((v) => v ?? "1:N"),
        reason: z
          .string()
          .nullish()
          .transform((v) => v ?? "Inferred relationship"),
      })
    )
    .default([]),
  columnAdditions: z
    .array(
      z.object({
        nodeName: z.string(),
        columnName: z.string(),
        columnType: z
          .string()
          .nullish()
          .transform((v) => v ?? "UUID"),
        isFk: optionalBool,
        isNullable: optionalBool,
      })
    )
    .default([]),
});

const EnricherOutputSchema = z.object({
  thinking: z.string().default(""),
  relatedNodes: z
    .array(
      z.object({
        nodeType: z.enum([
          "SqlIndexNode",
          "SqlEnumNode",
          "SqlViewNode",
          "NosqlIndexNode",
          "NosqlEmbeddedNode",
          "NosqlReferenceNode",
          "NosqlValidationNode",
        ]),
        name: z.string(),
        relatedToNode: z.string(),
        relatedColumn: optionalString,
        edgeCardinality: CardinalityEnum.nullish().transform((v) => v ?? "type"),
        data: z
          .record(z.string(), z.unknown())
          .nullish()
          .transform((v) => v ?? {}),
        reason: z
          .string()
          .nullish()
          .transform((v) => v ?? "Suggested supporting node"),
      })
    )
    .default([]),
});

const SchemaGraphAnnotation = Annotation.Root({
  nodes: Annotation<Node[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  edges: Annotation<Edge[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  schemaType: Annotation<"sql" | "nosql">({
    reducer: (_prev, next) => next,
    default: () => "sql",
  }),
  domainSummary: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  proposedRelationships: Annotation<ProposedEdgeSpec[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  proposedColumnAdditions: Annotation<ColumnAdditionSpec[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  proposedRelatedNodes: Annotation<ProposedNodeSpec[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  finalAddedNodes: Annotation<Node[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  finalAddedEdges: Annotation<Edge[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  finalUpdatedNodes: Annotation<Node[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  thinkingSteps: Annotation<ThinkingStep[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

type SchemaGraphState = typeof SchemaGraphAnnotation.State;

function extractJsonFromText(raw: unknown): unknown {
  const text = typeof raw === "string" ? raw : JSON.stringify(raw);
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : text.trim();
  const startIdx = candidate.indexOf("{");
  const endIdx = candidate.lastIndexOf("}");
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error("Model did not return a JSON object.");
  }
  return JSON.parse(candidate.slice(startIdx, endIdx + 1));
}

function summarizeNodesForPrompt(nodes: Node[]): string {
  return JSON.stringify(
    nodes.map((n) => {
      const data = (n.data || {}) as Record<string, unknown>;
      return {
        id: n.id,
        type: n.type,
        name: data.name || data.tableName || data.label || n.id,
        columns: Array.isArray(data.columns) ? data.columns : undefined,
        fields: Array.isArray(data.fields) ? data.fields : undefined,
        values: Array.isArray(data.values) ? data.values : undefined,
      };
    }),
    null,
    2
  );
}

function summarizeEdgesForPrompt(edges: Edge[], nodes: Node[]): string {
  const nodeNameById = new Map<string, string>();
  for (const n of nodes) {
    const data = (n.data || {}) as Record<string, unknown>;
    nodeNameById.set(n.id, String(data.name || data.label || n.id));
  }
  return JSON.stringify(
    edges.map((e) => ({
      source: nodeNameById.get(e.source) || e.source,
      target: nodeNameById.get(e.target) || e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      cardinality: (e.data as Record<string, unknown> | undefined)?.cardinality || e.label,
    })),
    null,
    2
  );
}

async function analyzerAgentNode(
  state: SchemaGraphState
): Promise<Partial<SchemaGraphState>> {
  const detectedType = getSchemaType({ nodes: state.nodes });
  const nodesSummary = summarizeNodesForPrompt(state.nodes);
  const edgesSummary = summarizeEdgesForPrompt(state.edges, state.nodes);

  const parsed = await withGeminiKeyRotation("analyzer", async (llm) => {
    const res = await llm.invoke([
      new SystemMessage(
        `You are the Schema Analyzer Agent in a multi-agent database architecture system.
Inspect the user's existing ${detectedType.toUpperCase()} nodes and edges.
Return ONLY valid JSON matching:
{
  "thinking": "Clear step-by-step reasoning about what tables/collections exist, what domain they model, and which relationships are missing.",
  "domainSummary": "1-2 sentence summary of the schema domain.",
  "entityInsights": ["short bullet per key entity"]
}`
      ),
      new HumanMessage(
        `Existing Nodes:\n${nodesSummary}\n\nExisting Edges:\n${edgesSummary}`
      ),
    ]);
    const json = extractJsonFromText(res.content);
    return AnalyzerOutputSchema.parse(json);
  });

  return {
    schemaType: detectedType,
    domainSummary: parsed.domainSummary,
    thinkingSteps: [
      {
        agent: "Schema Analyzer",
        title: `Analyzed ${state.nodes.length} ${detectedType.toUpperCase()} nodes`,
        thought: parsed.thinking,
        timestamp: Date.now(),
      },
    ],
  };
}

async function relationshipAgentNode(
  state: SchemaGraphState
): Promise<Partial<SchemaGraphState>> {
  const nodesSummary = summarizeNodesForPrompt(state.nodes);
  const edgesSummary = summarizeEdgesForPrompt(state.edges, state.nodes);

  const parsed = await withGeminiKeyRotation("relationship", async (llm) => {
    const res = await llm.invoke([
      new SystemMessage(
        `You are the Relationship & Cardinality Architect Agent.
Given the schema domain (${state.domainSummary}) and existing ${state.schemaType.toUpperCase()} nodes/edges:
1. Identify all missing relationships between existing tables/collections.
2. For each relationship, determine the exact Cardinality:
   - "1:N" (One-to-Many: source is parent/1, target is child/N)
   - "1:1" (One-to-One)
   - "N:M" (Many-to-Many)
   - "N:1" (Many-to-One)
   - "enum" (Table to Enum)
   - "type" (Type/Reference)
3. Do NOT duplicate any existing edge.
4. If a child table/collection needs a foreign-key/reference column that is missing (e.g. "user_id" on "orders"), include it in "columnAdditions".
Return ONLY valid JSON matching:
{
  "thinking": "Explain why each relationship and cardinality (1:N, 1:1, N:M, etc.) was chosen.",
  "relationships": [
    {
      "sourceNode": "exact table/collection name or id (parent side)",
      "sourceColumn": "primary key or referenced field (e.g. id or _id)",
      "targetNode": "exact table/collection name or id (child side)",
      "targetColumn": "foreign key or reference field (e.g. user_id)",
      "cardinality": "1:N",
      "reason": "short explanation"
    }
  ],
  "columnAdditions": [
    {
      "nodeName": "orders",
      "columnName": "user_id",
      "columnType": "UUID",
      "isFk": true,
      "isNullable": false
    }
  ]
}`
      ),
      new HumanMessage(
        `Existing Nodes:\n${nodesSummary}\n\nExisting Edges:\n${edgesSummary}`
      ),
    ]);
    const json = extractJsonFromText(res.content);
    return RelationshipOutputSchema.parse(json);
  });

  return {
    proposedRelationships: parsed.relationships,
    proposedColumnAdditions: parsed.columnAdditions,
    thinkingSteps: [
      {
        agent: "Relationship Architect",
        title: `Inferred ${parsed.relationships.length} relationship(s) & cardinalities`,
        thought: parsed.thinking,
        timestamp: Date.now(),
      },
    ],
  };
}

async function enricherAgentNode(
  state: SchemaGraphState
): Promise<Partial<SchemaGraphState>> {
  const nodesSummary = summarizeNodesForPrompt(state.nodes);
  const relSummary = JSON.stringify(state.proposedRelationships, null, 2);
  const allowedNodeTypes =
    state.schemaType === "nosql"
      ? ["NosqlIndexNode", "NosqlEmbeddedNode", "NosqlReferenceNode", "NosqlValidationNode"]
      : ["SqlIndexNode", "SqlEnumNode", "SqlViewNode"];

  const parsed = await withGeminiKeyRotation("enricher", async (llm) => {
    const res = await llm.invoke([
      new SystemMessage(
        `You are the Supporting Node Enricher Agent.
Based on the user's ${state.schemaType.toUpperCase()} schema and proposed relationships, suggest high-value related nodes (keep it focused: 1 to 4 nodes max, avoid clutter).
Allowed nodeTypes for this schema: ${allowedNodeTypes.join(", ")}.

Data shape per nodeType:
- SqlIndexNode: { label, name, tableName, indexType: "B-TREE", columns: ["col ASC"], isUnique: boolean }
- SqlEnumNode: { label, name, values: ["val1", "val2"] }
- SqlViewNode: { label, name, schema: "public", isMaterialized: false, query: "SELECT ...", columns: ["col1"] }
- NosqlIndexNode: { label, name, collectionName, indexType: "Compound", keys: ["field: 1"], isUnique: boolean }
- NosqlEmbeddedNode: { label, name, parentSchema, isArray: boolean, fields: [{ name: "street", type: "String" }] }
- NosqlReferenceNode: { label, name, fromCollection, toCollection, relationshipType: "1:N", refField, targetField: "_id" }
- NosqlValidationNode: { label, name, collectionName, validationLevel: "strict", validationAction: "error", requiredFields: ["email"], rulesSummary: "email: string" }

Return ONLY valid JSON matching:
{
  "thinking": "Explain which supporting nodes (indexes, enums, embedded docs, views) add real value and how they connect.",
  "relatedNodes": [
    {
      "nodeType": "${allowedNodeTypes[0]}",
      "name": "idx_orders_user_id",
      "relatedToNode": "orders",
      "relatedColumn": "user_id",
      "edgeCardinality": "type",
      "data": { ... },
      "reason": "Speeds up user order lookups"
    }
  ]
}`
      ),
      new HumanMessage(
        `Existing Nodes:\n${nodesSummary}\n\nProposed Relationships:\n${relSummary}`
      ),
    ]);
    const json = extractJsonFromText(res.content);
    return EnricherOutputSchema.parse(json);
  });

  return {
    proposedRelatedNodes: parsed.relatedNodes,
    thinkingSteps: [
      {
        agent: "Node Enricher",
        title: `Suggested ${parsed.relatedNodes.length} supporting node(s)`,
        thought: parsed.thinking,
        timestamp: Date.now(),
      },
    ],
  };
}

function getCardinalityStroke(cardinality: string): string {
  if (cardinality === "enum" || cardinality === "type") return "#f59e0b";
  if (cardinality === "1:1" || cardinality === "crows-one-one") return "#0ea5e9";
  if (cardinality === "N:M") return "#a855f7";
  return "#10b981";
}

function getCardinalityLabel(cardinality: string): string {
  if (cardinality === "enum") return "ENUM";
  if (cardinality === "type") return "TYPE";
  if (cardinality === "crows-one-many") return "||—|{";
  if (cardinality === "crows-zero-many") return "||—o{";
  if (cardinality === "crows-one-one") return "||—||";
  return cardinality;
}

function toStringValue(val: unknown, fallback = ""): string {
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (val && typeof val === "object") return JSON.stringify(val);
  return fallback;
}

function toStringArray(val: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(val)) {
    return val.map((item) => toStringValue(item)).filter(Boolean);
  }
  if (typeof val === "string" && val.trim()) {
    return [val.trim()];
  }
  if (val && typeof val === "object") {
    return Object.entries(val as Record<string, unknown>).map(
      ([k, v]) => `${k}: ${toStringValue(v)}`
    );
  }
  return fallback;
}

function sanitizeProposedNodeData(spec: ProposedNodeSpec): Record<string, unknown> {
  const raw = spec.data || {};
  const baseName = toStringValue(raw.name || raw.label, spec.name);

  switch (spec.nodeType) {
    case "SqlIndexNode":
      return {
        label: baseName,
        name: baseName,
        tableName: toStringValue(raw.tableName, spec.relatedToNode),
        indexType: toStringValue(raw.indexType, "B-TREE"),
        columns: toStringArray(raw.columns, [spec.relatedColumn || "id ASC"]),
        isUnique: Boolean(raw.isUnique),
      };
    case "SqlEnumNode":
      return {
        label: baseName,
        name: baseName,
        values: toStringArray(raw.values, ["pending", "active"]),
      };
    case "SqlViewNode":
      return {
        label: baseName,
        name: baseName,
        schema: toStringValue(raw.schema, "public"),
        isMaterialized: Boolean(raw.isMaterialized),
        query: toStringValue(raw.query, `SELECT * FROM ${spec.relatedToNode};`),
        columns: toStringArray(raw.columns, []),
      };
    case "NosqlIndexNode":
      return {
        label: baseName,
        name: baseName,
        collectionName: toStringValue(raw.collectionName, spec.relatedToNode),
        indexType: toStringValue(raw.indexType, "Compound"),
        keys: toStringArray(raw.keys, [`${spec.relatedColumn || "_id"}: 1`]),
      };
    case "NosqlEmbeddedNode": {
      const rawFields = Array.isArray(raw.fields) ? raw.fields : [];
      const fields = rawFields.map((f, idx) => {
        if (f && typeof f === "object") {
          const rec = f as Record<string, unknown>;
          return {
            name: toStringValue(rec.name, `field_${idx}`),
            type: toStringValue(rec.type, "String"),
          };
        }
        return { name: toStringValue(f, `field_${idx}`), type: "String" };
      });
      return {
        label: baseName,
        name: baseName,
        parentSchema: toStringValue(raw.parentSchema, spec.relatedToNode),
        isArray: Boolean(raw.isArray),
        fields,
      };
    }
    case "NosqlReferenceNode":
      return {
        label: baseName,
        name: baseName,
        fromCollection: toStringValue(raw.fromCollection, spec.relatedToNode),
        toCollection: toStringValue(raw.toCollection, spec.relatedToNode),
        relationshipType: toStringValue(raw.relationshipType, "1:N"),
        refField: toStringValue(raw.refField, spec.relatedColumn || "ref_id"),
        targetField: toStringValue(raw.targetField, "_id"),
      };
    case "NosqlValidationNode":
      return {
        label: baseName,
        name: baseName,
        collectionName: toStringValue(raw.collectionName, spec.relatedToNode),
        validationLevel: toStringValue(raw.validationLevel, "strict"),
        validationAction: toStringValue(raw.validationAction, "error"),
        requiredFields: toStringArray(raw.requiredFields, ["_id"]),
        rulesSummary: toStringValue(raw.rulesSummary ?? raw.rules, ""),
      };
  }
}

async function validatorNode(
  state: SchemaGraphState
): Promise<Partial<SchemaGraphState>> {
  const workingNodes: Node[] = state.nodes.map((n) => ({
    ...n,
    data: { ...(n.data || {}) },
  }));

  // 1. Apply any proposed FK/reference column additions to workingNodes so handle resolution finds them
  for (const colAdd of state.proposedColumnAdditions) {
    const targetNode = findMatchingNode(colAdd.nodeName, workingNodes) as Node | null;
    if (!targetNode) continue;

    const data = targetNode.data as Record<string, unknown>;
    if (targetNode.type === "NosqlCollectionNode" || targetNode.type === "Collection") {
      const existingFields = Array.isArray(data.fields)
        ? [...(data.fields as Array<Record<string, unknown>>)]
        : [];
      const alreadyExists = existingFields.some(
        (f) => String(f.name || "").toLowerCase() === colAdd.columnName.toLowerCase()
      );
      if (!alreadyExists) {
        existingFields.push({
          name: colAdd.columnName,
          type: colAdd.columnType || "ObjectId",
          required: !(colAdd.isNullable ?? true),
          isAiProposed: true,
        });
        data.fields = existingFields;
      }
    } else {
      const existingCols = Array.isArray(data.columns)
        ? [...(data.columns as Array<Record<string, unknown>>)]
        : [];
      const alreadyExists = existingCols.some(
        (c) => String(c.name || "").toLowerCase() === colAdd.columnName.toLowerCase()
      );
      if (!alreadyExists) {
        existingCols.push({
          id: `col-ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: colAdd.columnName,
          type: colAdd.columnType || "UUID",
          isFk: colAdd.isFk ?? true,
          isNullable: colAdd.isNullable ?? false,
          isAiProposed: true,
        });
        data.columns = existingCols;
      }
    }
  }

  const newEdges: Edge[] = [];
  const existingPairKeys = new Set(
    state.edges.map((e) => `${e.source}->${e.target}`)
  );

  // 2. Resolve relationships between existing nodes
  const stamp = Date.now();
  state.proposedRelationships.forEach((rel, idx) => {
    const srcNode = findMatchingNode(rel.sourceNode, workingNodes) as Node | null;
    const tgtNode = findMatchingNode(rel.targetNode, workingNodes) as Node | null;
    if (!srcNode || !tgtNode || srcNode.id === tgtNode.id) return;

    const pairKey = `${srcNode.id}->${tgtNode.id}`;
    const reverseKey = `${tgtNode.id}->${srcNode.id}`;
    if (existingPairKeys.has(pairKey) || existingPairKeys.has(reverseKey)) return;
    existingPairKeys.add(pairKey);

    const srcHandle = resolveNodeFieldHandle(
      srcNode,
      rel.sourceColumn,
      "parent",
      "right",
      tgtNode
    );
    const tgtHandle = resolveNodeFieldHandle(
      tgtNode,
      rel.targetColumn,
      "child",
      "left",
      srcNode
    );

    const stroke = getCardinalityStroke(rel.cardinality);
    newEdges.push({
      id: `ai-edge-${stamp}-${idx}`,
      source: srcNode.id,
      target: tgtNode.id,
      sourceHandle: srcHandle.handleId,
      targetHandle: tgtHandle.handleId,
      type: "erRelationship",
      animated: true,
      label: getCardinalityLabel(rel.cardinality),
      style: { stroke: "#38bdf8", strokeWidth: 2.5, strokeDasharray: "6 3" },
      data: {
        cardinality: rel.cardinality,
        sourceColumn: srcHandle.colName || rel.sourceColumn,
        targetColumn: tgtHandle.colName || rel.targetColumn,
        reason: rel.reason,
        finalStroke: stroke,
        isAiProposed: true,
      },
    });
  });

  // 3. Create supporting nodes & connect them cleanly near their related table/collection
  const addedNodes: Node[] = [];
  state.proposedRelatedNodes.forEach((spec, idx) => {
    const anchor = findMatchingNode(spec.relatedToNode, workingNodes) as Node | null;
    if (!anchor) return;

    const existingSameName = workingNodes.find((n) => {
      const d = n.data as Record<string, unknown>;
      return String(d?.name || d?.label || "").toLowerCase() === spec.name.toLowerCase();
    });
    if (existingSameName) return;

    const nodeId = `ai-${spec.nodeType.toLowerCase()}-${stamp}-${idx}`;
    const offsetX = 360;
    const offsetY = idx * 170 - 60;

    const newNode: Node = {
      id: nodeId,
      type: spec.nodeType,
      position: {
        x: (anchor.position?.x || 200) + offsetX,
        y: (anchor.position?.y || 160) + offsetY,
      },
      data: {
        ...sanitizeProposedNodeData(spec),
        isAiProposed: true,
        aiReason: spec.reason,
      },
    };
    addedNodes.push(newNode);

    const anchorHandle = resolveNodeFieldHandle(
      anchor,
      spec.relatedColumn,
      "child",
      "right",
      newNode
    );
    const cardinality =
      spec.nodeType === "SqlEnumNode" ? "enum" : spec.edgeCardinality || "type";

    newEdges.push({
      id: `ai-rel-node-edge-${stamp}-${idx}`,
      source: anchor.id,
      target: nodeId,
      sourceHandle: anchorHandle.handleId,
      targetHandle: "left",
      type: "erRelationship",
      animated: true,
      label: getCardinalityLabel(cardinality),
      style: {
        stroke: "#38bdf8",
        strokeWidth: 2.5,
        strokeDasharray: "6 3",
      },
      data: {
        cardinality,
        sourceColumn: anchorHandle.colName || spec.relatedColumn,
        reason: spec.reason,
        finalStroke: getCardinalityStroke(cardinality),
        isAiProposed: true,
      },
    });
  });

  return {
    finalUpdatedNodes: workingNodes,
    finalAddedNodes: addedNodes,
    finalAddedEdges: newEdges,
    thinkingSteps: [
      {
        agent: "Graph Validator",
        title: `Validated ${newEdges.length} edge(s) and ${addedNodes.length} new node(s)`,
        thought: `Resolved field-level handles via fieldHandleResolver and prepared ${newEdges.length} relationship edge(s) with cardinalities plus ${addedNodes.length} supporting node(s) for user review.`,
        timestamp: Date.now(),
      },
    ],
  };
}

export function buildSchemaAutoConnectGraph() {
  return new StateGraph(SchemaGraphAnnotation)
    .addNode("analyzer", analyzerAgentNode)
    .addNode("relationship", relationshipAgentNode)
    .addNode("enricher", enricherAgentNode)
    .addNode("validator", validatorNode)
    .addEdge(START, "analyzer")
    .addEdge("analyzer", "relationship")
    .addEdge("relationship", "enricher")
    .addEdge("enricher", "validator")
    .addEdge("validator", END)
    .compile();
}
