# Product Requirements Document (PRD) — ArchFlow

**Product Name:** ArchFlow (formerly AI Agent Builder Platform)  
**Document Version:** 2.0.0  
**Status:** Active / In Development  
**Target Audience:** Software Architects, Database Administrators, Backend Engineers, Full-Stack Developers, Engineering Leads  

---

## 1. Executive Summary

ArchFlow is an AI-powered visual database design studio and schema engineering platform. It bridges the gap between conceptual data modeling, entity-relationship diagrams (ERDs), and production-grade SQL/NoSQL schema migrations. Using a high-performance node-based canvas powered by `@xyflow/react` (React Flow), developers visually construct relational tables, views, enums, indexes, and document collections, interconnect column-level foreign keys with explicit ER cardinalities, simulate cascade deletions, import Mermaid diagrams, and export executable, syntax-highlighted SQL DDL (PostgreSQL, MySQL, SQLite, and Prisma).

ArchFlow also provides an AI Copilot engine backed by Google Gemini to convert natural language schema descriptions into normalized, typed database architectures.

---

## 2. Problem Statement

1. **Disconnected Design Tools:** Most visual schema tools (e.g., Draw.io, Lucidchart) generate static diagrams that cannot produce production-ready SQL DDL or enforce data modeling constraints.
2. **Fragile Migration Workflows:** Writing raw SQL DDL migrations by hand is prone to syntax errors, circular foreign key constraints, unindexed foreign keys, and accidental cascade deletions.
3. **NoSQL & Polyglot Blind Spots:** Traditional tools strictly separate relational models from document/NoSQL collections. Modern polyglot persistence applications lack a unified modeling surface.
4. **Context Switching in Team Collaboration:** Architects sketch models in design tools, while developers translate them manually into ORM schemas (Prisma, Drizzle, TypeORM), leading to drift between documentation and code.

---

## 3. Product Goals & Success Metrics

### 3.1 Primary Goals
- Provide an intuitive, low-latency, drag-and-drop canvas for schema modeling.
- Support 100% executable SQL DDL generation for PostgreSQL 16+ and MySQL 8+.
- Enable instant bi-directional workflow using Mermaid.js import and SVG/PNG diagram export.
- Provide real-time cloud persistence and state synchronization via Convex.
- Safeguard user workflows with secure authentication (Clerk) and intelligent rate limiting (Arcjet).

### 3.2 Key Performance Indicators (KPIs)
- **Time to First DDL:** Users can create a 5-table relational schema and export DDL within under 2 minutes.
- **Canvas Rendering Performance:** Maintain 60 FPS pan/zoom performance with 50+ table nodes and 100+ relationship edges.
- **DDL Execution Accuracy:** 99.9% syntax correctness across target dialects (PostgreSQL, MySQL) when tested against strict database engines.

---

## 4. User Personas

| Persona | Role | Core Needs | Pain Points |
| :--- | :--- | :--- | :--- |
| **P1: Systems Architect** | Lead Architect / Principal Eng | High-level domain decomposition, bounded contexts, visual system reviews | Tools lack domain grouping, Mermaid import, and high-res vector diagram exports for RFCs |
| **P2: Full-Stack Developer** | Next.js / Node.js Developer | Fast schema prototyping, foreign key validation, instant Prisma/SQL DDL generation | Hand-coding SQL migrations, syntax differences between PostgreSQL and MySQL |
| **P3: Database Administrator (DBA)** | DBA / Data Platform Lead | Strict column typing, nullability, primary key validation, index optimization, cascade safety | Unintentional `ON DELETE CASCADE` catastrophes and unindexed foreign keys |

---

## 5. Core Features & Functional Requirements

### 5.1 Interactive Canvas & Visual Flow Engine
- **Engine:** Built with `@xyflow/react` (React Flow v12) in strict dark-mode aesthetic.
- **Node Management:** Add, select, duplicate, delete, and reposition nodes with real-time bounding box updates.
- **Custom Viewport Controls:** Smooth zoom, fit-view, pan locking, and configurable canvas backgrounds (dots, grid, lines, cross).
- **Interactive MiniMap:** Topographic canvas radar navigation for large enterprise schemas.
- **Auto-Layout Engine:** One-click hierarchical Directed Acyclic Graph (DAG) arrangement powered by `dagre` with branch lane separation and domain context preservation.

### 5.2 Rich Relational & Document Entity Modeling
- **Relational SQL Nodes:**
  - `SqlTableNode`: Name, schema namespace, column definitions (name, type, PK, FK, Unique, Nullable, default values), and comments.
  - `SqlViewNode`: Materialized vs Standard views, underlying SELECT query, projected columns.
  - `SqlIndexNode`: B-tree, Hash, GIN, GiST, unique constraint, indexed expressions.
  - `SqlEnumNode`: Named custom enum types and enumerated string values.
  - `SqlFunctionNode` & `SqlTriggerNode`: Stored procedures, triggers, execution timing (BEFORE/AFTER/INSTEAD OF), events (INSERT, UPDATE, DELETE).
- **Document / NoSQL Nodes:**
  - `NosqlCollectionNode`: Collection names, schema validation rules, shard keys.
  - `NosqlDocumentNode`: Sample BSON/JSON payload previews.
  - `NosqlEmbeddedNode`: Sub-document object nesting schemas.
  - `NosqlReferenceNode`: DBRef / ObjectId relational links.
- **Documentation & Annotation Nodes:**
  - `DbNoteNode`: Markdown sticky notes for design rationale and architectural notes.
  - `DbSchemaNode`: Logical namespace headers (e.g., `auth`, `billing`, `analytics`).
  - `DomainGroupNode`: Bounded context domain containers with 8+ color presets (Auth, Billing, Orders, Inventory, etc.).

### 5.3 Column-Level ER Relationship Wiring
- Custom edge renderer `ErRelationshipEdge` featuring animated flows, customizable relationship stroke colors, and semantic handles.
- Support for relational cardinalities:
  - One-to-One (`1:1`)
  - One-to-Many (`1:N`)
  - Many-to-Many (`N:M`) with intermediate junction table notation
- Column handle alignment: Connecting a source column's output handle to a target foreign key handle with visual feedback.

### 5.4 Production SQL DDL & Migration Exporter
- Generation of fully validated SQL scripts with dialect toggles:
  - **PostgreSQL 16+**: Schemas, UUID extensions (`uuid-ossp`, `pgcrypto`), ENUM types, `CREATE TABLE` with inline constraints, `ALTER TABLE ... ADD CONSTRAINT FOREIGN KEY`, indexes, views, and functions.
  - **MySQL 8+**: Backtick quoting, `AUTO_INCREMENT`, engine declarations (`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`), table comments.
- Configurable export options:
  - Include inline column & table comments
  - Include `DROP TABLE IF EXISTS` safe preambles
  - One-click clipboard copy with syntax feedback
  - Direct `.sql` file download

### 5.5 Mermaid.js ER & Flowchart Importer
- Import existing Mermaid diagrams (`erDiagram`, `flowchart TD`, `graph LR`, `sequenceDiagram`).
- Parse entity definitions, column lists, PK/FK flags, and cardinality notations (`||--o{`, etc.).
- Auto-layout imported entities onto the canvas with zero overlapping nodes.

### 5.6 High-Resolution Diagram Export
- Canvas capture using `html-to-image`.
- Export ultra-high-resolution PNG (up to 3x pixel ratio) and SVG vector files.
- Transparent background or theme-matched dark background option for design documents.

### 5.7 Real-Time Cloud Persistence (Convex)
- Auto-saving or manual saving of canvas nodes, edges, positions, and metadata.
- Project duplication, renaming, and soft/hard deletion.
- User-scoped architecture workspaces.

### 5.8 AI Schema Copilot (Gemini API)
- Natural language to relational schema generation.
- Prompting Gemini to produce normalized schemas, detect missing indexes, and recommend foreign key relationships.

---

## 6. Non-Functional Requirements (NFRs)

- **Security:** Complete route protection via Clerk middleware, Arcjet rate-limiting / bot protection, and server-side token validation.
- **Accessibility:** Keyboard navigable modal dialogs, accessible ARIA attributes on toolbar buttons, high contrast dark theme ratios.
- **Reliability:** Graceful fallbacks when offline; non-blocking local state updates if backend sync is in-flight.
- **Extensibility:** Modular node and edge registry allowing rapid addition of graph databases (Neo4j, Memgraph) or vector databases (Pinecone, Qdrant).

---

## 7. Future Roadmap (v2.1+)

- **Direct Database Live Introspection:** Connect via connection string (read-only) to reverse-engineer live PostgreSQL/MySQL databases directly into an editable visual canvas.
- **Prisma & Drizzle Schema Two-Way Sync:** Bi-directional import and export of `schema.prisma` and Drizzle ORM definitions.
- **Multiplayer Real-time Cursor Collaboration:** Live multiplayer presence using Convex real-time subscriptions and shared cursors.
- **Schema Migration Diffing:** Compare two schema versions and generate up/down migration SQL patches (`ALTER TABLE ...`).
