# ArchFlow — Google Antigravity Workspace Configuration & Rules

## 1. Project Overview & Tech Stack

**ArchFlow** is a modern visual node-based studio for modeling relational database schemas, foreign key flows, and NoSQL data models powered by React Flow, Convex, and Google Gemini AI.

- **Framework:** Next.js 16.0.1 (App Router, Webpack/Turbopack)
- **Runtime & Environment:** Node.js `>= 18.18.0` (Active: Node `v24.21.x`)
- **Package Manager:** `npm` (Lockfile: `package-lock.json`)
- **UI & Component System:** React 19.2.0, Tailwind CSS 4 (`@tailwindcss/postcss`, `tw-animate-css`), Radix UI Primitives, Lucide React, `sonner`, `next-themes`
- **Visual Flow Engine:** `@xyflow/react` v12.9.3 (React Flow) with `dagre` v0.8.5 for graph auto-layout
- **Backend & Cloud Database:** Convex v1.28.2 (Real-time reactive serverless backend)
- **Authentication:** Clerk (`@clerk/nextjs` v6.34.5) with server middleware / route protection in `proxy.ts`
- **Payments & Subscriptions:** Razorpay client SDK (`lib/razorpayClient.ts`) with Next.js API order creation & webhook verification
- **AI & Agentic Workflows:** `@google/generative-ai` (Gemini), `@langchain/google-genai`, `@langchain/langgraph`, `@pinecone-database/pinecone`
- **Code Export & Syntax:** Shiki v3.15.0, custom DDL generators for PostgreSQL, MySQL, SQLite, Prisma, and MongoDB
- **Security & Inspection:** Arcjet (`@arcjet/next`, `@arcjet/inspect`)

---

## 2. Workflow Commands

### Development
```bash
# Install dependencies (always use npm to maintain package-lock.json)
npm install

# Run Next.js frontend dev server (http://localhost:3000)
npm run dev

# Run Convex backend dev server (in a separate terminal)
npx convex dev
```

### Build & Production
```bash
# Build the production Next.js application
npm run build

# Start production server
npm run start
```

### Code Quality & Type Checking
```bash
# Strict TypeScript compilation check (Mandatory verification step)
npx tsc --noEmit

# ESLint lint check
npm run lint

# Target linting on specific file/directory
npx eslint <path-to-file>
```

---

## 3. Subscription Tiers & Feature Gating Architecture

Plan permissions, quotas, and feature flags are centralized in `lib/planAccess.tsx`.

### 1. Subscription Tiers
| Plan Code | Name | Project Quota | Included Features |
| :--- | :--- | :---: | :--- |
| `free` | Hobbyist Free | **1** | React Flow Visual Canvas, Export SQL & NoSQL DDL |
| `pro` | Pro Architect | **15** | All Free + Multi-Domain Grouping, CASCADE Drop Simulator, Import & Export Mermaid |
| `ai` | AI Architect Pro | **Unlimited (9999)** | All Pro + AI Prompt-to-Schema Copilot, Live Agent Chat & Tool Execution |

### 2. The 7 Canonical Studio Features
1. `visual_canvas`: React Flow Visual Canvas (Free, Pro, AI)
2. `sql_nosql_export`: Export SQL & NoSQL DDL (Free, Pro, AI)
3. `domain_grouping`: Multi-Domain Grouping & Subgraph Boundaries (Pro, AI)
4. `cascade_simulator`: CASCADE Drop Impact Simulator (Pro, AI)
5. `mermaid_import_export`: Import & Export Mermaid Diagrams (Pro, AI)
6. `ai_copilot`: AI Prompt-to-Schema Copilot (AI only)
7. `ai_execution`: AI Agent Chat & Live Tool Execution (AI only)

### 3. Gating & Notification Rules
- Always check permission using `canAccessFeature(featureKey, userPlan)` before opening gated dialogs, drawers, or tools.
- When an unauthorized feature is clicked:
  - Trigger a minimalist floating pill toast using `notifyFeatureLocked(featureKey, userPlan)` from `components/plans/LockedFeatureToast.tsx`.
  - Optionally open `components/plans/PlanUpgradeModal.tsx` for one-click plan upgrade.
- Convex backend queries and mutations (`convex/agent.ts`) must enforce project quotas (`PLAN_QUOTAS[userPlan]`) in `CreateAgent` and `DuplicateAgent` to prevent bypass.

---

## 4. Code Style & Architecture Guidelines

### Directory Structure & Layout
```text
├── app/
│   ├── (auth)/                    # Clerk sign-in / sign-up pages
│   ├── admin/                     # Admin dashboards (analytics, earnings, feedback, plans, users)
│   ├── agent-builder/             # Visual schema canvas workspace
│   │   ├── [agentId]/             # Dynamic route per workspace project
│   │   ├── _components/           # Studio tools, header, chat drawer, CascadeSimulatorDialog, export dialogs
│   │   ├── _customNodes/          # React Flow custom SQL & NoSQL table nodes
│   │   └── _customEdges/          # ER relationship edges & cardinality markers
│   ├── api/                       # Next.js API route handlers (AI chat, Razorpay orders, agent tool config)
│   ├── dashboard/                 # Projects dashboard & template picker
│   │   └── pricing/               # In-app subscription management & Razorpay checkout
│   ├── globals.css                # Tailwind CSS 4 setup & theme variables
│   ├── layout.tsx                 # Root layout with ClerkProvider & ConvexClientProvider
│   └── page.tsx                   # Landing page
├── components/
│   ├── feedback/                  # User feedback modal
│   ├── landing/                   # Hero, Features, Pricing, InteractiveLab, Navbar, Footer
│   ├── plans/                     # LockedFeatureToast.tsx, PlanUpgradeModal.tsx
│   └── ui/                        # Reusable Radix UI primitives (shadcn-compatible)
├── context/                       # React contexts (WorkflowContext, UserDetailContext)
├── convex/                        # Convex backend mutations, queries, actions, schema.ts
├── hooks/                         # Client hooks (e.g. use-mobile.ts)
├── lib/                           # Core utilities, autoLayout, exporters (SQL, NoSQL, Mermaid)
│   ├── ai/                        # AI & LangGraph agent definitions (langgraphAgent.ts)
│   ├── planAccess.tsx             # Centralized plan codes, permissions, canonical features & toast helper
│   ├── razorpayClient.ts          # Razorpay checkout SDK loader & types
│   ├── schemaClassifier.ts        # SQL vs NoSQL schema detector
│   └── sqlDdlExporter.ts          # Relational DDL exporter
├── public/                        # Static assets & illustrations
└── types/                         # Shared TypeScript interfaces & types (AgentTypes.tsx)
```

### Module Resolution & Paths
- Always use the `@/*` path alias for root-relative imports (e.g., `@/components/ui/button`, `@/lib/utils`, `@/convex/_generated/api`).
- Do not use brittle relative paths like `../../../components`.

### Component & File Naming Conventions
- **UI Primitives (`components/ui/`):** kebab-case (e.g., `alert-dialog.tsx`, `dropdown-menu.tsx`).
- **Feature & Composite Components:** PascalCase (e.g., `CascadeSimulatorDialog.tsx`, `AgentStudioChatDrawer.tsx`, `Header.tsx`, `Pricing.tsx`).
- **Utility / Exporter Modules (`lib/`):** camelCase (e.g., `sqlDdlExporter.ts`, `planAccess.tsx`, `fieldHandleResolver.ts`).
- **Route Files (`app/**`):** Next.js App Router standards (`page.tsx`, `layout.tsx`, `route.ts`).
- **Private Folders:** Prefix sub-folders inside routes with `_` to exclude them from routing (e.g., `_components/`, `_customNodes/`).

### State Management Patterns
1. **Canvas & Graph Flow State:** Managed through `@xyflow/react` hooks (`useNodesState`, `useEdgesState`, `useReactFlow`) combined with `WorkflowContext` for cross-component toolbar and drawer communication.
2. **Persistent Cloud State:** Real-time synchronization handled via Convex reactive hooks (`useQuery`, `useMutation`).
3. **User & Auth State:** Managed via Clerk (`useUser`, `useAuth`) and synchronized into Convex `UserTable`.
4. **Client Directives:** Mark all interactive canvas components, drawers, dialogs, and hooks with `"use client";` at the very top of the file.

### Type Safety Rules
- Maintain TypeScript strict mode compatibility (`strict: true` in `tsconfig.json`).
- Avoid introducing `any`. Write explicit interfaces or type aliases in `types/` or co-locate with feature modules.
- Ensure all React Flow node data and edge data conform to typed interfaces.
- For Convex queries and mutations, always utilize generated type-safe helpers from `convex/_generated/server` and validators from `convex/values`.
- Avoid calling `setState` directly inside synchronous `useEffect` blocks; prefer derived state via `useMemo` to prevent React 19 cascading render warnings.

---

## 5. Testing & Verification Standards

Before completing or committing any modification, agents MUST verify:

1. **TypeScript Typecheck:**
   ```bash
   npx tsc --noEmit
   ```
   Must exit with **0 errors**.
2. **Build Validation:**
   ```bash
   npm run build
   ```
   Must successfully bundle the application without Next.js build or SSR failures.
3. **Schema Integrity:**
   - When modifying `convex/schema.ts`, confirm all references across `convex/` functions (queries, mutations) remain valid and all indices are preserved.
4. **Graph & Handle Consistency:**
   - Any modifications to custom node handles or field connectors must be validated against `lib/fieldHandleResolver.ts` and `_customEdges/ErRelationshipEdge.tsx`.
5. **Linting Check:**
   - Ensure newly added or edited files do not introduce new ESLint errors (`npx eslint <path-to-file>`).

---

## 6. Hard Guardrails (Strict "DO NOT" Rules)

- 🚫 **DO NOT expose or modify `.env` or `.env.local` secrets.** Never log, print, or commit API keys (`CLERK_SECRET_KEY`, `GOOGLE_API_KEY`, `PINECONE_API_KEY`, `CONVEX_DEPLOYMENT`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
- 🚫 **DO NOT switch package managers.** Do not use `pnpm`, `yarn`, or `bun`. Use `npm` only and keep `package-lock.json` committed and updated.
- 🚫 **DO NOT introduce `any` types in new code.** Existing debt should not be increased.
- 🚫 **DO NOT delete or break Convex database indices** (`by_email`, `by_role`, `by_status`, etc.) without migrating dependant queries.
- 🚫 **DO NOT bypass Clerk route authentication** in `proxy.ts` / middleware without explicit user consent.
- 🚫 **DO NOT delete existing comments or documentation** unless explicitly instructed by the user.
