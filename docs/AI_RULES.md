# AI Rules & Development Guidelines — ArchFlow

**Applies to:** All AI Coding Assistants, LLMs, Pair-Programmers, and Autonomous Agents interacting with this codebase.  
**Version:** 2.0.0  
**Stack Context:** Next.js 16 (App Router) | React 19 | TypeScript 5 | Tailwind CSS v4 | @xyflow/react 12 | Convex | Clerk  

---

## 1. Prime Directives for AI Assistants

1. **Do No Harm to State & Canvas Rendering:** Never introduce changes that cause canvas freezing, node remount loops, or memory leaks in React Flow.
2. **Preserve Documentation & Comments:** Maintain existing docstrings, algorithmic explanations, and design notes.
3. **Strict Dark Mode First:** ArchFlow has an intentional dark theme design. All new UI components must strictly match the dark aesthetic using zinc/border tokens and the signature gold accent (`#ffc507`, `#ffee72`).
4. **Follow Project Path Aliases:** Always use `@/...` path aliases configured in `tsconfig.json` (e.g. `@/components/ui/button`, `@/convex/_generated/api`).

---

## 2. Framework & Runtime Conventions (Next.js 16 & React 19)

### 2.1 Component Directives
- Any component utilizing React state (`useState`, `useContext`), hooks (`useEffect`, `useMemo`), browser APIs (`window`, `localStorage`, `navigator.clipboard`), or React Flow hooks **MUST** have `"use client";` as line 1.
- Server Components should remain pure and lean, fetching initial data or rendering metadata where appropriate.

### 2.2 React 19 Reactivity & Hydration
- **No Direct DOM Mutations:** Never access canvas DOM nodes directly; interact through `useReactFlow()` helpers (`fitView`, `screenToFlowPosition`, `deleteElements`).
- **Hydration Safety:** Browser-dependent attributes (such as timestamps, clipboard triggers, or canvas dimensions) must only render after client mounting or use standard client guards.

---

## 3. React Flow (@xyflow/react v12) Best Practices

### 3.1 Node & Edge Type Definitions
```typescript
// ❌ INCORRECT: Declaring nodeTypes inside the component causes canvas remounts on every render!
export default function Canvas() {
  const nodeTypes = { SqlTableNode: SqlTableNode }; // NEVER DO THIS
  return <ReactFlow nodeTypes={nodeTypes} ... />;
}

// ✅ CORRECT: Declare nodeTypes outside the component or memoize statically
import { nodeTypes } from "../_customNodes/nodeTypes";
import ErRelationshipEdge from "../_customEdges/ErRelationshipEdge";

const edgeTypes = {
  erRelationship: ErRelationshipEdge,
  default: ErRelationshipEdge,
};

export default function Canvas() {
  return <ReactFlow nodeTypes={nodeTypes} edgeTypes={edgeTypes} ... />;
}
```

### 3.2 State Immutability
- Never mutate node objects directly (e.g., `node.data.columns.push(...)`). Always produce new copies using mapped arrays:
```typescript
setAddedNodes((prevNodes: any[]) =>
  prevNodes.map((node) =>
    node.id === targetNodeId
      ? {
          ...node,
          data: {
            ...node.data,
            columns: [...node.data.columns, newColumn],
          },
        }
      : node
  )
);
```

### 3.3 Column Handle Identifiers
- Foreign key connections depend on explicit handle IDs.
- Source handle (PK): `col-${column.id}-source`
- Target handle (FK): `col-${column.id}-target`
- Do not alter this naming scheme without updating `ErRelationshipEdge` and `lib/sqlDdlExporter.ts`.

---

## 4. Styling Conventions (Tailwind CSS v4)

- **No `tailwind.config.js`:** This project uses Tailwind CSS v4. Theme tokens, color variables, and CSS animations are defined directly in `app/globals.css`.
- **Palette Guidelines:**
  - Backgrounds: `bg-background` (`#09090b` / `black`), `bg-muted/20`, `bg-card`
  - Borders: `border-border` (`#27272a`), `border-border/50`
  - Primary Accents: Golden gradient `from-[#ffc507] via-[#ffee72] to-[#ffdf27]`
  - SQL / Schema Types: Emerald (`emerald-500` / `emerald-400`), Cyan (`cyan-500`), Violet (`violet-500`)
- **Animations:** Use `tw-animate-css` utilities or standard Tailwind v4 transitions.

---

## 5. Convex Backend Rules

### 5.1 Argument Validation
- Every Convex mutation and query **MUST** validate all arguments using `v` from `convex/values`:
```typescript
export const RenameAgent = mutation({
  args: {
    agentId: v.id("AgentTable"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Name cannot be empty");
    await ctx.db.patch(args.agentId, { name: trimmed });
  },
});
```

### 5.2 Patching vs Replacing
- Prefer `ctx.db.patch(id, { ... })` for partial field updates over full document replacement.
- Never write credentials, raw API keys, or private tokens into `AgentTable.nodes` or `edges`.

---

## 6. SQL DDL Generation & Exporter Rules

When extending `lib/sqlDdlExporter.ts`:
1. **Dialect Integrity:** Verify that generated SQL complies with the target dialect (PostgreSQL 16+ or MySQL 8+).
2. **Identifier Escaping:** Escape reserved SQL keywords and ensure table/column names with dashes or special characters are safely quoted (double quotes for Postgres, backticks for MySQL).
3. **Foreign Key Dependency Sorting:** Tables must be emitted in dependency order, or foreign keys must be appended as post-table `ALTER TABLE ADD CONSTRAINT` statements to prevent circular dependency errors.

---

## 7. AI Copilot & Prompt Safety

1. **JSON Only Output:** LLM prompts generating canvas graphs must enforce pure JSON responses without conversational markdown wrap.
2. **Safe Parsing:** Always sanitize LLM responses by removing Markdown backticks (```` ```json ````) before executing `JSON.parse()`.
3. **Credit Verification:** Check user token quotas in `UserTable.token` before dispatching high-cost Gemini generation calls.
