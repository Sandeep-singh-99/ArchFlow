export const postgresEcommerceNodes = [
  // --- DATABASE SCHEMA NAMESPACE ---
  {
    id: "db-schema-ecommerce",
    type: "DbSchemaNode",
    position: { x: 440, y: 30 },
    data: {
      name: "ecommerce_postgresql_db",
      engine: "PostgreSQL 16",
      charset: "UTF-8",
      collation: "en_US.UTF-8",
      description: "Production E-Commerce Relational ER Architecture with 1:1, 1:N, and N:M (Many-to-Many) Relationships",
    },
  },

  // --- ENUM STATUS ---
  {
    id: "enum-order-status",
    type: "SqlEnumNode",
    position: { x: 40, y: 30 },
    data: {
      name: "order_status_enum",
      values: ["cart", "pending_payment", "processing", "shipped", "delivered", "refunded", "cancelled"],
    },
  },

  // --- 1. USERS TABLE ---
  {
    id: "table-users",
    type: "SqlTableNode",
    position: { x: 40, y: 220 },
    data: {
      name: "users",
      schema: "auth",
      columns: [
        { id: "u1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "u2", name: "email", type: "VARCHAR(255)", isUnique: true, isNullable: false },
        { id: "u3", name: "password_hash", type: "VARCHAR(255)", isNullable: false },
        { id: "u4", name: "full_name", type: "VARCHAR(120)", isNullable: false },
        { id: "u5", name: "role", type: "VARCHAR(20)", isNullable: false },
        { id: "u6", name: "created_at", type: "TIMESTAMPTZ", isNullable: false },
      ],
      comment: "User accounts table",
    },
  },

  // --- 2. USER PROFILES (1:1 with Users) ---
  {
    id: "table-user-profiles",
    type: "SqlTableNode",
    position: { x: 40, y: 550 },
    data: {
      name: "user_profiles",
      schema: "auth",
      columns: [
        { id: "up1", name: "user_id", type: "UUID", isPk: true, isFk: true, isNullable: false },
        { id: "up2", name: "phone_number", type: "VARCHAR(30)", isNullable: true },
        { id: "up3", name: "avatar_url", type: "VARCHAR(500)", isNullable: true },
        { id: "up4", name: "shipping_address", type: "JSONB", isNullable: true },
        { id: "up5", name: "billing_address", type: "JSONB", isNullable: true },
        { id: "up6", name: "updated_at", type: "TIMESTAMPTZ", isNullable: false },
      ],
      comment: "1:1 Extension Table for User Profile & Address",
    },
  },

  // --- 3. REVIEWS TABLE (1:N from Users, 1:N to Products) ---
  {
    id: "table-reviews",
    type: "SqlTableNode",
    position: { x: 40, y: 880 },
    data: {
      name: "product_reviews",
      schema: "catalog",
      columns: [
        { id: "r1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "r2", name: "customer_id", type: "UUID", isFk: true, isNullable: false },
        { id: "r3", name: "product_id", type: "UUID", isFk: true, isNullable: false },
        { id: "r4", name: "rating", type: "INT CHECK (1-5)", isNullable: false },
        { id: "r5", name: "headline", type: "VARCHAR(120)", isNullable: true },
        { id: "r6", name: "comment", type: "TEXT", isNullable: true },
        { id: "r7", name: "created_at", type: "TIMESTAMPTZ", isNullable: false },
      ],
      comment: "Customer product reviews and ratings",
    },
  },

  // --- 4. ORDERS TABLE (1:N from Users) ---
  {
    id: "table-orders",
    type: "SqlTableNode",
    position: { x: 440, y: 220 },
    data: {
      name: "orders",
      schema: "sales",
      columns: [
        { id: "o1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "o2", name: "customer_id", type: "UUID", isFk: true, isNullable: false },
        { id: "o3", name: "status", type: "order_status_enum", isNullable: false },
        { id: "o4", name: "total_amount", type: "NUMERIC(12,2)", isNullable: false },
        { id: "o5", name: "currency", type: "VARCHAR(3)", isNullable: false },
        { id: "o6", name: "placed_at", type: "TIMESTAMPTZ", isNullable: false },
      ],
      comment: "ACID transactional orders",
    },
  },

  // --- 5. PAYMENTS TABLE (1:1 with Orders) ---
  {
    id: "table-payments",
    type: "SqlTableNode",
    position: { x: 440, y: 550 },
    data: {
      name: "payments",
      schema: "sales",
      columns: [
        { id: "p1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "p2", name: "order_id", type: "UUID", isFk: true, isUnique: true, isNullable: false },
        { id: "p3", name: "provider", type: "VARCHAR(50)", isNullable: false },
        { id: "p4", name: "transaction_ref", type: "VARCHAR(100)", isUnique: true, isNullable: false },
        { id: "p5", name: "amount", type: "NUMERIC(12,2)", isNullable: false },
        { id: "p6", name: "status", type: "VARCHAR(30)", isNullable: false },
        { id: "p7", name: "paid_at", type: "TIMESTAMPTZ", isNullable: false },
      ],
      comment: "1:1 Payment transaction per order",
    },
  },

  // --- 6. ORDER_ITEMS (N:M Many-to-Many Junction: Orders <-> Products) ---
  {
    id: "table-order-items",
    type: "SqlTableNode",
    position: { x: 440, y: 880 },
    data: {
      name: "order_items",
      schema: "sales",
      columns: [
        { id: "oi1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "oi2", name: "order_id", type: "UUID", isFk: true, isNullable: false },
        { id: "oi3", name: "product_id", type: "UUID", isFk: true, isNullable: false },
        { id: "oi4", name: "quantity", type: "INT", isNullable: false },
        { id: "oi5", name: "unit_price", type: "NUMERIC(10,2)", isNullable: false },
        { id: "oi6", name: "subtotal", type: "NUMERIC(12,2)", isNullable: false },
      ],
      comment: "Many-to-Many junction connecting Orders and Products",
    },
  },

  // --- 7. CATEGORIES TABLE ---
  {
    id: "table-categories",
    type: "SqlTableNode",
    position: { x: 860, y: 220 },
    data: {
      name: "categories",
      schema: "catalog",
      columns: [
        { id: "cat1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "cat2", name: "name", type: "VARCHAR(100)", isNullable: false },
        { id: "cat3", name: "slug", type: "VARCHAR(120)", isUnique: true, isNullable: false },
        { id: "cat4", name: "parent_id", type: "UUID", isFk: true, isNullable: true },
        { id: "cat5", name: "is_active", type: "BOOLEAN", isNullable: false },
      ],
      comment: "Hierarchical product categories",
    },
  },

  // --- 8. PRODUCTS TABLE ---
  {
    id: "table-products",
    type: "SqlTableNode",
    position: { x: 860, y: 550 },
    data: {
      name: "products",
      schema: "catalog",
      columns: [
        { id: "prd1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "prd2", name: "sku", type: "VARCHAR(50)", isUnique: true, isNullable: false },
        { id: "prd3", name: "name", type: "VARCHAR(255)", isNullable: false },
        { id: "prd4", name: "price", type: "NUMERIC(10,2)", isNullable: false },
        { id: "prd5", name: "stock_quantity", type: "INT", isNullable: false },
        { id: "prd6", name: "is_active", type: "BOOLEAN", isNullable: false },
        { id: "prd7", name: "created_at", type: "TIMESTAMPTZ", isNullable: false },
      ],
      comment: "Product catalog inventory",
    },
  },

  // --- 9. PRODUCT_CATEGORIES (N:M Many-to-Many: Products <-> Categories) ---
  {
    id: "table-product-categories",
    type: "SqlTableNode",
    position: { x: 1220, y: 380 },
    data: {
      name: "product_categories",
      schema: "catalog",
      columns: [
        { id: "pc1", name: "product_id", type: "UUID", isPk: true, isFk: true, isNullable: false },
        { id: "pc2", name: "category_id", type: "UUID", isPk: true, isFk: true, isNullable: false },
        { id: "pc3", name: "is_primary", type: "BOOLEAN", isNullable: false },
        { id: "pc4", name: "assigned_at", type: "TIMESTAMPTZ", isNullable: false },
      ],
      comment: "Many-to-Many junction table (Products ↔ Categories)",
    },
  },

  // --- 10. MATERIALIZED VIEW FOR REVENUE ---
  {
    id: "view-sales-analytics",
    type: "SqlViewNode",
    position: { x: 860, y: 880 },
    data: {
      name: "v_product_sales_summary",
      schema: "analytics",
      isMaterialized: true,
      query: "SELECT p.id, p.name, SUM(oi.quantity) AS total_sold, SUM(oi.subtotal) AS gross_revenue\nFROM products p\nJOIN order_items oi ON p.id = oi.product_id\nJOIN orders o ON oi.order_id = o.id\nWHERE o.status = 'delivered'\nGROUP BY p.id, p.name;",
      columns: ["id", "name", "total_sold", "gross_revenue"],
    },
  },
];

export const postgresEcommerceEdges = [
  // Database Header Link
  { id: "edge-db-users", source: "db-schema-ecommerce", target: "table-users", animated: true, style: { strokeWidth: 2 } },
  { id: "edge-db-orders", source: "db-schema-ecommerce", target: "table-orders", animated: true, style: { strokeWidth: 2 } },
  { id: "edge-db-products", source: "db-schema-ecommerce", target: "table-products", animated: true, style: { strokeWidth: 2 } },

  // Enum Connection
  { id: "edge-enum-orders", source: "enum-order-status", target: "table-orders", animated: true, label: "enum: status" },

  // 1:1 Relationship (Users.id <-> User Profiles.user_id)
  {
    id: "edge-users-profiles",
    source: "table-users",
    sourceHandle: "col-u1-right",
    target: "table-user-profiles",
    targetHandle: "col-up1-left",
    type: "erRelationship",
    data: { cardinality: "1:1" },
    label: "1:1 (user_id)",
    animated: true,
  },

  // 1:N Relationship (Users.id <-> Orders.customer_id)
  {
    id: "edge-users-orders",
    source: "table-users",
    sourceHandle: "col-u1-right",
    target: "table-orders",
    targetHandle: "col-o2-left",
    type: "erRelationship",
    data: { cardinality: "1:N" },
    label: "1:N (customer_id)",
    animated: true,
  },

  // 1:1 Relationship (Orders.id <-> Payments.order_id)
  {
    id: "edge-orders-payments",
    source: "table-orders",
    sourceHandle: "col-o1-right",
    target: "table-payments",
    targetHandle: "col-p2-left",
    type: "erRelationship",
    data: { cardinality: "1:1" },
    label: "1:1 (order_id)",
    animated: true,
  },

  // Many-to-Many N:M (Orders.id <-> Order Items.order_id)
  {
    id: "edge-orders-items",
    source: "table-orders",
    sourceHandle: "col-o1-right",
    target: "table-order-items",
    targetHandle: "col-oi2-left",
    type: "erRelationship",
    data: { cardinality: "1:N" },
    label: "1:N (order_id)",
    animated: true,
  },
  // Products.id <-> Order Items.product_id
  {
    id: "edge-products-items",
    source: "table-products",
    sourceHandle: "col-prd1-right",
    target: "table-order-items",
    targetHandle: "col-oi3-left",
    type: "erRelationship",
    data: { cardinality: "N:M" },
    label: "N:M (Many:Many items)",
    animated: true,
  },

  // Many-to-Many N:M (Categories.id <-> Product Categories.category_id)
  {
    id: "edge-categories-prodcat",
    source: "table-categories",
    sourceHandle: "col-cat1-right",
    target: "table-product-categories",
    targetHandle: "col-pc2-left",
    type: "erRelationship",
    data: { cardinality: "1:N" },
    label: "1:N (category_id)",
    animated: true,
  },
  // Products.id <-> Product Categories.product_id
  {
    id: "edge-products-prodcat",
    source: "table-products",
    sourceHandle: "col-prd1-right",
    target: "table-product-categories",
    targetHandle: "col-pc1-left",
    type: "erRelationship",
    data: { cardinality: "N:M" },
    label: "N:M (Many:Many category)",
    animated: true,
  },

  // 1:N Relationships (Reviews)
  {
    id: "edge-users-reviews",
    source: "table-users",
    sourceHandle: "col-u1-right",
    target: "table-reviews",
    targetHandle: "col-r2-left",
    type: "erRelationship",
    data: { cardinality: "1:N" },
    label: "1:N (customer_id)",
    animated: true,
  },
  {
    id: "edge-products-reviews",
    source: "table-products",
    sourceHandle: "col-prd1-right",
    target: "table-reviews",
    targetHandle: "col-r3-left",
    type: "erRelationship",
    data: { cardinality: "1:N" },
    label: "1:N (product_id)",
    animated: true,
  },

  // View Analytics Link
  { id: "edge-items-view", source: "table-order-items", target: "view-sales-analytics", animated: true, label: "Aggregates Sales" },
];
