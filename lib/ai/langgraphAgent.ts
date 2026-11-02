import { StateGraph, Annotation, START, END, MemorySaver } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

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
    references?: string;
  }>;
  fields?: Array<{
    name: string;
    type: string;
    required?: boolean;
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
    references?: string;
  }>;
  addFields?: Array<{
    name: string;
    type: string;
    required?: boolean;
  }>;
  removeColumns?: string[];
  removeFields?: string[];
  renameTable?: string;
  changeNodeType?: string;
  relations?: Array<{
    targetTable: string;
    cardinality?: "1:1" | "1:N" | "N:M";
    sourceColumn?: string;
    targetColumn?: string;
    connectToField?: boolean;
  }>;
  sourceTable?: string;
  sourceColumn?: string;
  targetTable?: string;
  targetColumn?: string;
  connectToField?: boolean;
  cardinality?: "1:1" | "1:N" | "N:M";
}

// Graph State Definition with Annotation
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  query: Annotation<string>(),
  canvasSchema: Annotation<any>(),
  finalResponse: Annotation<string>(),
  canvasActions: Annotation<CanvasAction[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
});

// Single in-memory checkpointer for short-term session memory (ephemeral, not saved to DB)
const inMemorySaver = new MemorySaver();

// Gemini Generator Node with Canvas Action Capabilities
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
              isPk: !!(c.isPrimaryKey || c.isPk),
              isFk: !!(c.isForeignKey || c.isFk),
              isUnique: !!c.isUnique,
              isNullable: c.isNullable,
              references: c.references || c.referencesTable,
            })) || [],
          fields: n.data?.fields || [],
          query: n.data?.query,
          settings: n.data?.settings || {},
        })),
        edges: (schemaContext.edges || []).map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
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

  const systemPrompt = `You are ArchFlow's AI Database Schema & Architecture Copilot.
You have direct control over the React Flow database canvas and can create, delete, update, and connect any node.

=== STRICT DOMAIN & SCOPE BOUNDARY ===
You are strictly and exclusively a Database Schema & Architecture assistant.
- You MUST ONLY answer questions and execute actions directly related to:
  1. Creating, modifying, deleting, connecting, and inspecting database tables, columns, collections, fields, and relationships on the canvas.
  2. Database architecture, data modeling, normalization (3NF), foreign keys, NoSQL embedding vs referencing, and indexing.
  3. Queries specifically about the current database schema on the canvas.
- STRICT REFUSAL FOR OFF-TOPIC / GENERAL QUERIES:
  If the user asks about ANYTHING outside database schema design and database architecture (e.g. "what is reactjs", frontend frameworks, styling, Python scripts, general programming, history, or trivia):
  You MUST politely refuse in 1-2 concise sentences, stating that you only answer questions and take actions related to the database schema.
  Example response:
  "I am your Database Schema Copilot and only assist with database architecture, schemas, and canvas operations. Please ask a question related to your database design, tables, or relationships."
  Always return "canvasActions": [] for off-topic requests.

${architectureDirective}

=== LIVE CANVAS DATABASE CONTEXT ===
${formattedCanvas}

=== CRITICAL SCHEMA GROUNDING & CREATION RULE ===
1. The LIVE CANVAS DATABASE CONTEXT above is the ONLY ground truth for what currently exists on the canvas.
2. NEVER assume a table exists just because it was discussed in earlier chat turns.
3. If the user asks to create an entity (e.g. "Create categories table"), and that entity is NOT in the "nodes" list above, you MUST emit a CREATE_NODE action. Do NOT say it is already present.
4. When the user requests a complete multi-table schema (e.g. users, categories, products, orders, order_items, payments):
   - Emit a CREATE_NODE for EVERY single requested entity.
   - FOR EVERY TABLE THAT REFERENCES ANOTHER TABLE, YOU MUST SPECIFY FIELD-LEVEL CONNECTIONS:
     * Mark "isForeignKey": true and "references": "target_table(target_column)" on the foreign key column.
     * In "relations", provide the source primary key column and target foreign key column:
       e.g., "products": "relations": [{"targetTable": "categories", "cardinality": "1:N", "sourceColumn": "id", "targetColumn": "category_id"}]
       e.g., "orders": "relations": [{"targetTable": "users", "cardinality": "1:N", "sourceColumn": "id", "targetColumn": "user_id"}]
       e.g., "order_items": "relations": [
         {"targetTable": "orders", "cardinality": "1:N", "sourceColumn": "id", "targetColumn": "order_id"},
         {"targetTable": "products", "cardinality": "1:N", "sourceColumn": "id", "targetColumn": "product_id"}
       ]
       e.g., "payments": "relations": [{"targetTable": "orders", "cardinality": "1:N", "sourceColumn": "id", "targetColumn": "order_id"}]
   - Include {"type": "AUTO_LAYOUT"} so all nodes and connecting relationship edges are automatically organized hierarchically without overlap.

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
       { "name": "user_id", "type": "UUID", "isForeignKey": true, "references": "users(id)" },
       { "name": "amount", "type": "DECIMAL(10,2)" }
     ],
     "relations": [
       { "targetTable": "users", "cardinality": "1:N", "sourceColumn": "id", "targetColumn": "user_id" }
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
     "changeNodeType": "SqlTableNode" | "NosqlCollectionNode", // optional
     "addColumns": [ // For SQL tables
       { "name": "new_column", "type": "VARCHAR(255)", "isNullable": true, "isForeignKey": true, "references": "other_table(id)" }
     ],
     "addFields": [ // For NoSQL collections
       { "name": "amount", "type": "Number" },
       { "name": "status", "type": "String" },
       { "name": "transactionId", "type": "String" }
     ],
     "removeColumns": ["old_col"], // optional
     "removeFields": ["old_field"] // optional
   }

=== CRITICAL: IMPLEMENTING SUGGESTED FIELDS & CONFIRMATIONS ===
- When the user asks to analyze/improve a schema and you suggest missing fields (e.g. "payments lacks amount, status, transactionId"):
  If the user responds with "implement this field", "add them", "ok", "yes", "apply", or "update payment model":
  YOU MUST EMIT AN "UPDATE_NODE" ACTION with those exact fields in "addFields" (for NoSQL) or "addColumns" (for SQL) targeting that table.
  NEVER merely claim in text that fields were added without returning the "UPDATE_NODE" in "canvasActions", because without "UPDATE_NODE" the canvas does not update!

4. Connect two nodes:
   - Field-to-field connection (default for foreign keys):
     {
       "type": "CONNECT_NODES",
       "sourceTable": "users",
       "sourceColumn": "id",
       "targetTable": "orders",
       "targetColumn": "user_id",
       "cardinality": "1:N"
     }
   - Model-level / Table-level connection (when user asks "not any specific field", "only on model", "connect models", or "do not connect to _id"):
     {
       "type": "CONNECT_NODES",
       "sourceTable": "users",
       "targetTable": "payments",
       "connectToField": false,
       "cardinality": "1:N"
     }
     IMPORTANT: If the user explicitly says "connect to user model not any specific field" or "only on model", set "connectToField": false so it connects directly to the model node header and NOT to _id or any field. Do NOT force an _id foreign key when user specifically asks not to connect fields.

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
  .addNode("geminiGenerator", geminiGeneratorNode)
  .addEdge(START, "geminiGenerator")
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
  };
}
