import { StateGraph, Annotation, START, END, MemorySaver } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { retrieveRelevantDocs } from "./pineconeRAG";

export interface CanvasAction {
  type: "CREATE_NODE" | "DELETE_NODE" | "UPDATE_NODE" | "CONNECT_NODES" | "AUTO_LAYOUT";
  targetName?: string;
  nodeType?: string;
  name?: string;
  columns?: Array<{
    name: string;
    type: string;
    isPrimaryKey?: boolean;
    isForeignKey?: boolean;
    isUnique?: boolean;
    isNullable?: boolean;
    defaultValue?: string;
  }>;
  query?: string;
  text?: string;
  values?: string[];
  tableName?: string;
  addColumns?: Array<{
    name: string;
    type: string;
    isPrimaryKey?: boolean;
    isForeignKey?: boolean;
    isUnique?: boolean;
    isNullable?: boolean;
    defaultValue?: string;
  }>;
  removeColumns?: string[];
  renameTable?: string;
  changeNodeType?: string;
  relations?: Array<{
    targetTable: string;
    cardinality?: "1:1" | "1:N" | "N:M";
  }>;
  sourceTable?: string;
}

// Graph State Definition with Annotation
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  query: Annotation<string>(),
  canvasSchema: Annotation<any>(),
  retrievedContext: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  finalResponse: Annotation<string>(),
  canvasActions: Annotation<CanvasAction[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
});

// Single in-memory checkpointer for short-term session memory (ephemeral, not saved to DB)
const inMemorySaver = new MemorySaver();

// 1. RAG Node: Retrieves context from Pinecone for all tasks
async function ragRetrievalNode(state: typeof AgentState.State) {
  const query = state.query || "";
  let retrieved: string[] = [];

  if (query.trim()) {
    retrieved = await retrieveRelevantDocs(query, 4);
  }

  return {
    retrievedContext: retrieved,
  };
}

// 2. Gemini Generator Node with Canvas Action Capabilities
async function geminiGeneratorNode(state: typeof AgentState.State) {
  const apiKey = process.env.GOOGLE_API_KEY || "";
  const model = new ChatGoogleGenerativeAI({
    apiKey,
    model: "gemini-3.5-flash-lite",
    temperature: 0.2,
  });

  const schemaContext = state.canvasSchema || {};
  const schemaType: string = (schemaContext.schemaType || "sql").toLowerCase();
  const isNoSql = schemaType === "nosql";

  let formattedCanvas = "No database objects currently on the canvas.";

  if (schemaContext && Array.isArray(schemaContext.nodes) && schemaContext.nodes.length > 0) {
    formattedCanvas = JSON.stringify(
      {
        architectureType: isNoSql ? "NoSQL Document" : "SQL Relational",
        totalNodes: schemaContext.nodes.length,
        nodes: schemaContext.nodes.map((n: any) => ({
          id: n.id,
          type: n.type,
          name: n.data?.name || n.data?.label || n.data?.tableName || n.id,
          columns:
            n.data?.columns?.map((c: any) => ({
              name: c.name,
              type: c.type,
              isPk: c.isPrimaryKey,
              isFk: c.isForeignKey,
              isUnique: c.isUnique,
              isNullable: c.isNullable,
            })) || [],
          fields: n.data?.fields || [],
          query: n.data?.query,
          settings: n.data?.settings || {},
        })),
        edges: (schemaContext.edges || []).map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          cardinality: e.data?.cardinality || e.label || "1:N",
        })),
      },
      null,
      2
    );
  }

  const architectureDirective = isNoSql
    ? `=== ACTIVE DATABASE ARCHITECTURE: NoSQL (DOCUMENT / MONGODB) ===
- The project is configured as a NoSQL Document Architecture.
- When creating nodes, use "nodeType": "NosqlCollectionNode" (or "NosqlEmbeddedNode", "NosqlDocumentNode", "NosqlIndexNode").
- In "columns" or fields, use document field types: "ObjectId", "String", "Number", "Boolean", "Date", "Array", "Object".
- Do NOT output SQL DDL (e.g. CREATE TABLE, VARCHAR); output MongoDB Mongoose schemas, Document models, or MongoDB JSON schemas.
- Discuss embedding vs referencing (1:few vs 1:many patterns), denormalization, and aggregation queries instead of 3NF/SQL joins.`
    : `=== ACTIVE DATABASE ARCHITECTURE: SQL (RELATIONAL / POSTGRESQL / MYSQL) ===
- The project is configured as a Relational SQL Architecture.
- When creating nodes, use "nodeType": "SqlTableNode" (or "SqlViewNode", "SqlIndexNode", "SqlFunctionNode", "SqlTriggerNode", "SqlEnumNode").
- In "columns", use SQL types: "UUID", "VARCHAR(255)", "INTEGER", "DECIMAL(10,2)", "BOOLEAN", "TIMESTAMPTZ".
- Output clean PostgreSQL / MySQL / SQLite DDL or Prisma schemas with primary keys and foreign keys.
- Enforce 3NF normalization, foreign key constraints, and relational indexing.`;

  const retrievedDocs = state.retrievedContext || [];
  const formattedDocs =
    retrievedDocs.length > 0
      ? retrievedDocs.map((doc, idx) => `[Source ${idx + 1}]: ${doc}`).join("\n\n")
      : "Standard relational (3NF) & NoSQL database architecture best practices.";

  const systemPrompt = `You are ArchFlow's AI Database Schema & Architecture Copilot.
You have direct control over the React Flow database canvas and can create, delete, update, and connect any node.

${architectureDirective}

=== RETRIEVED PINECONE RAG KNOWLEDGE ===
${formattedDocs}

=== LIVE CANVAS DATABASE CONTEXT ===
${formattedCanvas}

=== OUTPUT FORMAT RULE ===
You MUST return your answer strictly as a JSON object with this exact shape:
{
  "response": "Brief, concise, meaningful answer (strictly 1-3 sentences). No filler or lengthy essays.",
  "canvasActions": [
    // Array of actions to execute on the React Flow canvas (empty [] if only answering a question)
  ]
}

=== AVAILABLE CANVAS ACTIONS ===
1. Create a table/node:
   {
     "type": "CREATE_NODE",
     "nodeType": "SqlTableNode" | "SqlViewNode" | "SqlIndexNode" | "SqlFunctionNode" | "SqlTriggerNode" | "SqlEnumNode" | "NosqlCollectionNode" | "DbNoteNode" | "TextNode",
     "name": "table_name",
     "columns": [
       { "name": "id", "type": "UUID", "isPrimaryKey": true, "isNullable": false },
       { "name": "user_id", "type": "UUID", "isForeignKey": true },
       { "name": "amount", "type": "DECIMAL(10,2)" }
     ],
     "relations": [
       { "targetTable": "existing_table_name", "cardinality": "1:N" }
     ],
     "query": "SELECT ... (if SqlViewNode)",
     "text": "Note content (if DbNoteNode)"
   }

2. Delete a table/node:
   {
     "type": "DELETE_NODE",
     "targetName": "table_name_to_delete"
   }

3. Update an existing table/node:
   {
     "type": "UPDATE_NODE",
     "targetName": "existing_table_name",
     "renameTable": "new_name", // optional
     "changeNodeType": "SqlTableNode", // optional, e.g. convert view to table
     "addColumns": [
       { "name": "new_column", "type": "VARCHAR(255)", "isNullable": true }
     ],
     "removeColumns": ["old_col"] // optional
   }

4. Connect two nodes:
   {
     "type": "CONNECT_NODES",
     "sourceTable": "orders",
     "targetTable": "users",
     "cardinality": "1:N"
   }

5. Auto-arrange canvas:
   {
     "type": "AUTO_LAYOUT"
   }
   IMPORTANT: ONLY output "AUTO_LAYOUT" if the user explicitly asks to "auto arrange", "re-layout", or "reorganize" the canvas. NEVER include AUTO_LAYOUT for standard create, delete, or update operations so existing node positions are preserved.

=== CRITICAL LENGTH & CONCISENESS RULE ===
- Keep "response" SHORT, DIRECT, and MEANINGFUL (maximum 1 to 3 sentences).
- Absolutely NO long conversational filler, disclaimers, or excessive text.
- If user says "delete reviews table", return:
  "response": "Deleted the \`reviews\` table and disconnected its flows.", "canvasActions": [{"type": "DELETE_NODE", "targetName": "reviews"}]`;

  const messagesToSend: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...state.messages,
    new HumanMessage(state.query),
  ];

  const response = await model.invoke(messagesToSend);
  const responseContent = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

  let parsedResponse = responseContent;
  let canvasActions: CanvasAction[] = [];

  try {
    const cleaned = responseContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "").trim();
    const json = JSON.parse(cleaned);
    if (json && typeof json === "object") {
      if (typeof json.response === "string") {
        parsedResponse = json.response;
      }
      if (Array.isArray(json.canvasActions)) {
        canvasActions = json.canvasActions;
      }
    }
  } catch (e) {
    // If not JSON, use the raw response and empty actions
    parsedResponse = responseContent;
    canvasActions = [];
  }

  return {
    messages: [new HumanMessage(state.query), new AIMessage(parsedResponse)],
    finalResponse: parsedResponse,
    canvasActions,
  };
}

// Build the LangGraph Workflow
const workflow = new StateGraph(AgentState)
  .addNode("ragRetriever", ragRetrievalNode)
  .addNode("geminiGenerator", geminiGeneratorNode)
  .addEdge(START, "ragRetriever")
  .addEdge("ragRetriever", "geminiGenerator")
  .addEdge("geminiGenerator", END);

export const agentGraphApp = workflow.compile({
  checkpointer: inMemorySaver,
});

/**
 * Execute a query through the LangGraph agent with short-term memory (session-based)
 * Previous chat is NOT stored in any persistent DB.
 */
export async function runAgentStudioChat({
  query,
  sessionId,
  canvasSchema,
}: {
  query: string;
  sessionId: string;
  canvasSchema?: any;
}) {
  const result = await agentGraphApp.invoke(
    {
      query,
      canvasSchema,
    },
    {
      configurable: {
        thread_id: sessionId,
      },
    }
  );

  return {
    response: result.finalResponse,
    canvasActions: result.canvasActions || [],
    retrievedContext: result.retrievedContext || [],
  };
}
