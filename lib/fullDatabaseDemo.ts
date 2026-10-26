export const fullDatabaseDemoNodes = [
  // --- ARCHITECTURE TITLE (SHARED TEXT NODE) ---
  {
    id: "title-polyglot-db",
    type: "TextNode",
    position: { x: 40, y: -40 },
    data: {
      label: "Polyglot Database Architecture",
      text: "Polyglot Database Architecture",
      fontSize: "2xl",
      isBold: true,
      color: "default",
      hasBackground: false,
    },
  },

  // --- SHARED NODES / DATABASE NAMESPACES ---
  {
    id: "db-postgres",
    type: "DbSchemaNode",
    position: { x: 40, y: 40 },
    data: {
      name: "ecommerce_relational_db",
      engine: "PostgreSQL 16",
      charset: "UTF-8",
      collation: "en_US.UTF-8",
      description: "Primary relational database for core transactional consistency",
    },
  },
  {
    id: "arch-note",
    type: "DbNoteNode",
    position: { x: 420, y: 40 },
    data: {
      label: "Polyglot Architecture Note",
      text: "📌 Polyglot Database Architecture:\n• PostgreSQL 16: Handles strict ACID customer orders, accounts, constraints, and revenue reporting.\n• MongoDB 7.0: Powers dynamic, polymorphic product catalog, flexible technical specs, and geo-indexes.\n• Cross-database links connect relational line items to NoSQL documents via ObjectId references.",
      color: "yellow",
    },
  },
  {
    id: "db-mongodb",
    type: "DbSchemaNode",
    position: { x: 800, y: 40 },
    data: {
      name: "catalog_events_nosql_db",
      engine: "MongoDB 7.0 Sharded",
      charset: "BSON UTF-8",
      collation: "Standard Binary",
      description: "Document datastore for high-throughput product catalog and search",
    },
  },

  // --- SQL RELATIONAL NODES (PostgreSQL) ---
  {
    id: "sql-enum-status",
    type: "SqlEnumNode",
    position: { x: 40, y: 230 },
    data: {
      name: "order_status_enum",
      values: ["draft", "pending_payment", "processing", "shipped", "delivered", "cancelled"],
    },
  },
  {
    id: "sql-table-customers",
    type: "SqlTableNode",
    position: { x: 40, y: 410 },
    data: {
      name: "customers",
      schema: "public",
      columns: [
        { id: "c1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "c2", name: "email", type: "VARCHAR(255)", isUnique: true, isNullable: false },
        { id: "c3", name: "full_name", type: "VARCHAR(120)", isNullable: false },
        { id: "c4", name: "tier", type: "VARCHAR(20)", isNullable: false },
        { id: "c5", name: "created_at", type: "TIMESTAMPTZ", isNullable: false },
      ],
      comment: "Verified customer accounts",
    },
  },
  {
    id: "sql-table-orders",
    type: "SqlTableNode",
    position: { x: 40, y: 680 },
    data: {
      name: "orders",
      schema: "public",
      columns: [
        { id: "o1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "o2", name: "customer_id", type: "UUID", isFk: true, isNullable: false },
        { id: "o3", name: "status", type: "order_status_enum", isNullable: false },
        { id: "o4", name: "total_amount", type: "NUMERIC(12,2)", isNullable: false },
        { id: "o5", name: "placed_at", type: "TIMESTAMPTZ", isNullable: false },
      ],
      comment: "ACID transactional orders",
    },
  },
  {
    id: "sql-view-revenue",
    type: "SqlViewNode",
    position: { x: 420, y: 460 },
    data: {
      name: "v_customer_revenue",
      schema: "analytics",
      isMaterialized: true,
      query: "SELECT c.id, c.email, COUNT(o.id) AS total_orders, SUM(o.total_amount) AS lifetime_value\nFROM customers c\nJOIN orders o ON c.id = o.customer_id\nWHERE o.status != 'cancelled'\nGROUP BY c.id, c.email;",
      columns: ["id", "email", "total_orders", "lifetime_value"],
    },
  },
  {
    id: "sql-idx-orders",
    type: "SqlIndexNode",
    position: { x: 420, y: 680 },
    data: {
      name: "idx_orders_customer_date",
      tableName: "orders",
      indexType: "B-TREE",
      columns: ["customer_id ASC", "placed_at DESC"],
      isUnique: false,
    },
  },
  {
    id: "sql-func-validate",
    type: "SqlFunctionNode",
    position: { x: 40, y: 950 },
    data: {
      name: "fn_validate_order_credit",
      language: "plpgsql",
      returnType: "TRIGGER",
      parameters: [
        { name: "p_customer_id", type: "UUID" },
        { name: "p_order_total", type: "NUMERIC" },
      ],
    },
  },
  {
    id: "sql-trg-audit",
    type: "SqlTriggerNode",
    position: { x: 420, y: 950 },
    data: {
      name: "trg_orders_audit",
      tableName: "orders",
      timing: "AFTER",
      events: ["INSERT", "UPDATE"],
      functionName: "fn_validate_order_credit()",
    },
  },

  // --- NOSQL DOCUMENT NODES (MongoDB) ---
  {
    id: "nosql-validation-product",
    type: "NosqlValidationNode",
    position: { x: 800, y: 230 },
    data: {
      name: "ProductValidator",
      collectionName: "products",
      validationLevel: "strict",
      validationAction: "error",
      requiredFields: ["_id", "sku", "title", "pricing", "specs"],
      rulesSummary: "sku: string (regex ^SKU-), pricing.basePrice > 0, specs: object",
    },
  },
  {
    id: "nosql-collection-products",
    type: "NosqlCollectionNode",
    position: { x: 800, y: 460 },
    data: {
      name: "products",
      database: "catalog_events_nosql_db",
      shardKey: "category: hashed",
      fields: [
        { name: "_id", type: "ObjectId", required: true },
        { name: "sku", type: "String", required: true },
        { name: "title", type: "String", required: true },
        { name: "pricing", type: "Object", required: true },
        { name: "specs", type: "EmbeddedObject", required: true },
        { name: "tags", type: "Array<String>", required: false },
        { name: "inventoryLocation", type: "2dsphere", required: false },
      ],
    },
  },
  {
    id: "nosql-embedded-specs",
    type: "NosqlEmbeddedNode",
    position: { x: 1160, y: 460 },
    data: {
      name: "TechnicalSpecs",
      parentSchema: "ProductDocument",
      isArray: false,
      fields: [
        { name: "dimensions", type: "Object { width, height }" },
        { name: "weightKg", type: "Double" },
        { name: "compliance", type: "Array<String>" },
        { name: "attributes", type: "Map<String, Any>" },
      ],
    },
  },
  {
    id: "nosql-doc-sample",
    type: "NosqlDocumentNode",
    position: { x: 1160, y: 700 },
    data: {
      name: "sample_macbook_doc",
      collectionName: "products",
      sampleJson: `{\n  "_id": "66a8f10b2...",\n  "sku": "SKU-MBP-M3",\n  "title": "MacBook Pro 16",\n  "pricing": {\n    "basePrice": 2499.00,\n    "currency": "USD"\n  },\n  "specs": {\n    "cpu": "M3 Max 16-Core",\n    "ram": "64GB"\n  }\n}`,
    },
  },
  {
    id: "nosql-idx-geo",
    type: "NosqlIndexNode",
    position: { x: 800, y: 790 },
    data: {
      name: "idx_product_geo_search",
      collectionName: "products",
      indexType: "2dsphere Geospatial",
      keys: ["inventoryLocation: '2dsphere'", "sku: 1"],
    },
  },
  {
    id: "nosql-ref-crossdb",
    type: "NosqlReferenceNode",
    position: { x: 420, y: 800 },
    data: {
      name: "order_items_to_catalog",
      fromCollection: "orders.items",
      fromField: "productId",
      toCollection: "products",
      toField: "_id",
      cardinality: "N:M",
      refType: "ObjectId Reference",
    },
  },
];

export const fullDatabaseDemoEdges = [
  // Database Namespace Connections
  { id: "e-db-pg-cust", source: "db-postgres", target: "sql-table-customers", animated: true, style: { strokeWidth: 2 } },
  { id: "e-db-pg-ord", source: "db-postgres", target: "sql-table-orders", animated: true, style: { strokeWidth: 2 } },
  { id: "e-db-mongo-col", source: "db-mongodb", target: "nosql-collection-products", animated: true, style: { strokeWidth: 2 } },

  // Architecture Note Links
  { id: "e-note-pg", source: "arch-note", target: "sql-table-orders", animated: true, style: { strokeDasharray: "4 4", strokeWidth: 1.5 } },
  { id: "e-note-mongo", source: "arch-note", target: "nosql-collection-products", animated: true, style: { strokeDasharray: "4 4", strokeWidth: 1.5 } },

  // SQL Internal Relationships
  { id: "e-enum-ord", source: "sql-enum-status", target: "sql-table-orders", animated: true, label: "order_status" },
  { id: "e-cust-ord", source: "sql-table-customers", target: "sql-table-orders", animated: true, label: "1:N (customer_id)" },
  { id: "e-ord-view", source: "sql-table-orders", target: "sql-view-revenue", animated: true, label: "Analytics Source" },
  { id: "e-ord-idx", source: "sql-table-orders", target: "sql-idx-orders", animated: true, label: "Covering Index" },
  { id: "e-func-trg", source: "sql-func-validate", target: "sql-trg-audit", animated: true, label: "Invokes Function" },
  { id: "e-trg-ord", source: "sql-trg-audit", target: "sql-table-orders", animated: true, label: "AFTER INSERT/UPDATE" },

  // NoSQL Internal Relationships
  { id: "e-val-col", source: "nosql-validation-product", target: "nosql-collection-products", animated: true, label: "Enforces Schema" },
  { id: "e-col-embed", source: "nosql-collection-products", target: "nosql-embedded-specs", animated: true, label: "Embeds Document" },
  { id: "e-col-doc", source: "nosql-collection-products", target: "nosql-doc-sample", animated: true, label: "JSON Instance" },
  { id: "e-col-idx", source: "nosql-collection-products", target: "nosql-idx-geo", animated: true, label: "Geo Index" },

  // Cross-Database Link (Postgres Orders -> MongoDB Products)
  { id: "e-ord-ref", source: "sql-table-orders", target: "nosql-ref-crossdb", animated: true, label: "items.productId" },
  { id: "e-ref-col", source: "nosql-ref-crossdb", target: "nosql-collection-products", animated: true, label: "Foreign Document Ref" },
];
