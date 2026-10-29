# Tasks & Product Roadmap — ArchFlow

**Current Version:** 2.0.0  
**Status Dashboard:** Live / In Continuous Development  

---

## 1. Completed Milestones (v1.0 - v2.0)

- [x] **Core Visual Flow Canvas:**
  - Integrated `@xyflow/react` (React Flow v12) in dark mode.
  - Implemented viewport pan, zoom, fit-view, and background patterns (dots, lines, grid, cross).
  - Built interactive minimap radar navigation (`FlowMiniMap.tsx`).
- [x] **Relational SQL & Document NoSQL Nodes:**
  - `SqlTableNode` with column-level handles, primary keys, foreign keys, unique, and nullable constraints.
  - `SqlViewNode` supporting standard and materialized views with SQL definitions.
  - `SqlIndexNode`, `SqlEnumNode`, `SqlFunctionNode`, and `SqlTriggerNode`.
  - `NosqlCollectionNode`, `NosqlDocumentNode`, and `NosqlEmbeddedNode`.
  - `DomainGroupNode` with 8+ domain presets (Auth, Billing, Orders, Inventory, etc.).
- [x] **Column-to-Column ER Relationship Wiring:**
  - Custom `ErRelationshipEdge` with animated flow particles and cardinality tags (`1:1`, `1:N`, `N:M`).
  - Strict handle binding matching source column to target column IDs.
- [x] **Production SQL DDL Exporter:**
  - Executable PostgreSQL 16+ DDL generation with extensions, enums, tables, foreign keys, and indexes.
  - Executable MySQL 8+ DDL generation with backticks, engine declarations, and constraints.
  - Syntax highlighting with Shiki, clipboard copy, and `.sql` file download.
- [x] **Mermaid Import & Vector Image Export:**
  - Mermaid `erDiagram`, `graph TD`, and `flowchart` parser with topological auto-layout.
  - High-resolution PNG and SVG canvas diagram export using `html-to-image`.
- [x] **Backend & Authentication:**
  - Convex serverless document database integration (`UserTable`, `AgentTable`, `ChatTable`).
  - Clerk user authentication and session enforcement in `proxy.ts`.
  - Project duplication, renaming, deletion, and auto-sync.
- [x] **Security & Rate Limiting:**
  - Integrated `@arcjet/next` token bucket rate limiter and bot protection.

---

## 2. In-Progress & Short-Term Tasks (v2.1)

- [ ] **Task 2.1: SQLite & Prisma Schema Exporters**
  - Add SQLite dialect generation to `lib/sqlDdlExporter.ts`.
  - Add Prisma schema export (`schema.prisma` models with `@id`, `@unique`, `@relation`).
- [ ] **Task 2.2: Live CASCADE Drop & Dependency Simulator**
  - Create a visual interactive modal to simulate `ON DELETE CASCADE` effects.
  - Highlight all downstream child and grandchild records on the canvas when a parent table is dropped.
- [ ] **Task 2.3: Schema Quality & Integrity Linter**
  - Implement real-time schema validation rules:
    - Flag foreign key columns that lack corresponding indexes.
    - Warn when tables lack primary keys.
    - Warn when foreign key column data types do not match the referenced primary key type.
  - Display non-blocking warning badges on table node headers.
- [ ] **Task 2.4: Canvas Undo / Redo History Stack**
  - Implement snapshot history stack (Ctrl+Z / Ctrl+Y) for canvas node additions, removals, and position changes.
- [ ] **Task 2.5: Keyboard Shortcuts Modal & Command Palette**
  - Register global hotkeys (`Del` to remove, `Ctrl+D` to duplicate, `Ctrl+A` to select all, `Ctrl+S` to save, `Ctrl+K` for search).
  - Build searchable table/column locator palette for 50+ table schemas.

---

## 3. Medium-Term Enhancements (v2.2 - v2.5)

- [ ] **Task 3.1: Two-Way Live Database Introspection**
  - Secure modal allowing users to enter a read-only PostgreSQL connection string.
  - Serverless worker querying `information_schema.tables`, `columns`, and `table_constraints` to construct visual nodes on canvas automatically.
- [ ] **Task 3.2: Drizzle ORM Schema Exporter**
  - Generate TypeScript Drizzle table definitions (`pgTable`, `serial`, `varchar`, `foreignKey`).
- [ ] **Task 3.3: Schema Versioning & Migration Diff Generator**
  - Store schema revision snapshots in Convex.
  - Generate up/down migration scripts (`ALTER TABLE ADD COLUMN`, `DROP COLUMN`) by comparing two snapshots.
- [ ] **Task 3.4: Collaborative Multiplayer Cursors**
  - Use Convex Presence to broadcast live cursor coordinates and active selections to other team members viewing the same schema.

---

## 4. Backlog / Icebox

- [ ] Dark / Light mode toggle support (currently dark mode only).
- [ ] GraphQL schema definition exporter (`type Query`, `type Mutation`, SDL).
- [ ] Native Electron / Desktop offline packaging.
- [ ] DBML (Database Markup Language) import and export integration.
