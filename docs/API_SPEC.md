# API Specification — ArchFlow

**Version:** 2.0.0  
**Base URL (Local):** `http://localhost:3000`  
**Convex Deployment URL:** `https://<deployment-name>.convex.cloud`  
**Authentication:** Clerk Bearer Session Tokens / Cookies  

---

## 1. Overview

ArchFlow communicates via two distinct interfaces:
1. **Next.js Route Handlers (`/api/*`):** Serverless HTTP endpoints handling AI text/JSON generation, token consumption, and rate limiting.
2. **Convex WebSocket API (`api.*`):** Real-time typed RPC queries and mutations for instant document synchronization.

---

## 2. Next.js REST API Routes

### 2.1 AI Agent Chat
Performs conversational chat with Google Gemini, simulating tool invocations and schema recommendations.

- **Endpoint:** `POST /api/agent-chat`
- **Content-Type:** `application/json`
- **Authentication:** Authenticated Clerk user session required.

#### Request Headers
| Header | Type | Description |
| :--- | :--- | :--- |
| `Content-Type` | `string` | Must be `application/json` |
| `Authorization` | `string` | Bearer `<clerk_session_token>` |

#### Request Body
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Can you recommend indexes for an orders table queried by user_id and created_at?"
    }
  ],
  "agentToolConfig": {
    "primaryAgentName": "Schema Copilot",
    "systemPrompt": "You are an expert PostgreSQL DBA assisting with indexing strategies.",
    "tools": [
      {
        "id": "tool-1",
        "name": "AddIndex",
        "description": "Adds a composite index to the table node",
        "method": "POST"
      }
    ]
  }
}
```

#### Success Response (`200 OK`)
```json
{
  "response": "For queries filtering by both `user_id` and sorted by `created_at DESC`, a composite B-tree index is optimal:\n\n```sql\nCREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);\n```\nThis avoids file-sort operations and enables index-only scans."
}
```

#### Error Responses
- `400 Bad Request`: When `agentToolConfig` is missing.
  ```json
  { "error": "Agent configuration is missing" }
  ```
- `500 Internal Server Error`: When the Gemini API call fails.
  ```json
  { "error": "Failed to process request" }
  ```

---

### 2.2 Generate Agent Tool Config
Generates structured JSON tool configurations and system prompts from a canvas flow graph.

- **Endpoint:** `POST /api/generate-agent-tool-config`
- **Content-Type:** `application/json`
- **Authentication:** Authenticated Clerk user session required.

#### Request Body
```json
{
  "jsonConfig": "{\"nodes\": [...], \"edges\": [...]}"
}
```

#### Success Response (`200 OK`)
```json
{
  "systemPrompt": "You are an AI database engineer responsible for managing the e-commerce schema.",
  "primaryAgentName": "DatabaseManager",
  "agents": [
    {
      "id": "agent-1",
      "agent-id": "ecommerce-core",
      "name": "OrderProcessor",
      "model": "gemini-2.5-flash",
      "includeHistory": true,
      "output": {
        "result": "success",
        "tool_id": "tool-1",
        "interaction": "direct"
      }
    }
  ],
  "tools": [
    {
      "id": "tool-1",
      "name": "ExportSQL",
      "description": "Exports PostgreSQL DDL for all nodes",
      "method": "POST",
      "url": "/api/export-ddl",
      "includeApiKey": false,
      "parameters": { "dialect": "string" },
      "usage": ["manual", "automated"],
      "assignedAgent": "OrderProcessor"
    }
  ]
}
```

#### Error Responses
- `500 Internal Server Error`: When the model response cannot be parsed into valid JSON.
  ```json
  { "error": "Failed to parse JSON" }
  ```

---

### 2.3 Arcjet Rate Limiting & Protection
Evaluates client requests against token bucket capacity and bot detection rules.

- **Endpoint:** `GET /api/arcjet`
- **Content-Type:** `application/json`

#### Success Response (`200 OK`)
```json
{
  "message": "Hello world"
}
```

#### Rate Limited Response (`429 Too Many Requests`)
```json
{
  "error": "Too Many Requests",
  "reason": {
    "type": "RATE_LIMIT",
    "remaining": 0,
    "reset": 86400
  }
}
```

---

## 3. Convex Real-Time RPC API

Convex functions are invoked directly from the frontend using `useQuery` and `useMutation` hooks from `convex/react`.

### 3.1 User Operations (`convex/user.ts`)

#### `api.user.CreateNewUser`
- **Type:** `Mutation`
- **Arguments:**
  ```typescript
  {
    name: string;
    email: string;
    imageUrl: string;
  }
  ```
- **Returns:** `Doc<"UserTable">`
- **Behavior:** Checks if a user with `email` already exists. If not, initializes a new user record with `token: 5000`. Returns the existing or newly created user.

---

### 3.2 Schema Project Operations (`convex/agent.ts`)

#### `api.agent.CreateAgent`
- **Type:** `Mutation`
- **Arguments:**
  ```typescript
  {
    name: string;
    agentId: string;       // Unique UUID generated client-side
    userId: Id<"UserTable">;
    nodes?: any;           // Initial React Flow nodes array
    edges?: any;           // Initial React Flow edges array
  }
  ```
- **Returns:** `Id<"AgentTable">`

#### `api.agent.GetUserAgents`
- **Type:** `Query`
- **Arguments:**
  ```typescript
  {
    userId: Id<"UserTable">;
  }
  ```
- **Returns:** `Array<Doc<"AgentTable">>` sorted descending by creation time.

#### `api.agent.GetAgentById`
- **Type:** `Query`
- **Arguments:**
  ```typescript
  {
    agentId: string; // The project routing UUID
  }
  ```
- **Returns:** `Doc<"AgentTable"> | undefined`

#### `api.agent.UpdateAgentDetail`
- **Type:** `Mutation`
- **Arguments:**
  ```typescript
  {
    id: Id<"AgentTable">;
    nodes: any; // Serialized React Flow nodes
    edges: any; // Serialized React Flow edges
  }
  ```
- **Returns:** `void`

#### `api.agent.RenameAgent`
- **Type:** `Mutation`
- **Arguments:**
  ```typescript
  {
    agentId: Id<"AgentTable">;
    name: string;
  }
  ```
- **Errors:** Throws `Error("Project name cannot be empty")` if whitespace only.

#### `api.agent.DuplicateAgent`
- **Type:** `Mutation`
- **Arguments:**
  ```typescript
  {
    agentId: Id<"AgentTable">;
    userId: Id<"UserTable">;
  }
  ```
- **Returns:** `Id<"AgentTable">` of the duplicated project.

#### `api.agent.DeleteAgent`
- **Type:** `Mutation`
- **Arguments:**
  ```typescript
  {
    agentId: Id<"AgentTable">;
  }
  ```
- **Returns:** `void`

#### `api.agent.PublishAgent`
- **Type:** `Mutation`
- **Arguments:**
  ```typescript
  {
    id: Id<"AgentTable">;
    published: boolean;
  }
  ```
- **Returns:** `void`

---

## 4. Status & Error Codes

| Status Code | Description | Handling Recommendation |
| :--- | :--- | :--- |
| `200 OK` | Request completed successfully | Process payload |
| `400 Bad Request` | Missing parameters or invalid JSON body | Check request parameters |
| `401 Unauthorized` | Missing or invalid Clerk authentication token | Redirect to `/sign-in` |
| `429 Too Many Requests`| Arcjet token bucket exhausted | Display toast with cooldown timer |
| `500 Server Error` | Uncaught exception or upstream Gemini error | Display friendly retry prompt |
