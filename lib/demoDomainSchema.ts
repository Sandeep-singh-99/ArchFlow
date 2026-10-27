import { getAutoLayout } from "./autoLayout";

export interface DemoSchemaResult {
  nodes: any[];
  edges: any[];
}

export function generateAllDomainsDemoSchema(): DemoSchemaResult {
  // Domain 1: Auth & Security (Theme: Indigo)
  const grpAuth = {
    id: "domain-auth",
    type: "DomainGroupNode",
    position: { x: 0, y: 0 },
    style: { width: 680, height: 440 },
    data: {
      label: "Auth & Security",
      name: "Auth & Security",
      description: "User authentication, passwords, sessions, and MFA credentials",
      colorTheme: "indigo",
      icon: "Shield",
      isDomainGroup: true,
    },
  };

  const tblUsers = {
    id: "table-users",
    type: "SqlTableNode",
    parentId: "domain-auth",
    position: { x: 40, y: 70 },
    data: {
      label: "users",
      name: "users",
      schema: "auth",
      domainId: "domain-auth",
      domainName: "Auth & Security",
      domainTheme: "indigo",
      columns: [
        { id: "u-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "u-2", name: "email", type: "VARCHAR(255)", isUnique: true, isNullable: false },
        { id: "u-3", name: "password_hash", type: "VARCHAR(255)", isNullable: false },
        { id: "u-4", name: "role", type: "VARCHAR(50)", isNullable: false },
        { id: "u-5", name: "created_at", type: "TIMESTAMP", isNullable: false },
      ],
      comment: "Primary user identities",
    },
  };

  const tblSessions = {
    id: "table-sessions",
    type: "SqlTableNode",
    parentId: "domain-auth",
    position: { x: 370, y: 70 },
    data: {
      label: "user_sessions",
      name: "user_sessions",
      schema: "auth",
      domainId: "domain-auth",
      domainName: "Auth & Security",
      domainTheme: "indigo",
      columns: [
        { id: "s-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "s-2", name: "user_id", type: "UUID", isFk: true, isNullable: false },
        { id: "s-3", name: "token", type: "VARCHAR(512)", isUnique: true, isNullable: false },
        { id: "s-4", name: "ip_address", type: "VARCHAR(45)", isNullable: true },
        { id: "s-5", name: "expires_at", type: "TIMESTAMP", isNullable: false },
      ],
      comment: "Active session tokens",
    },
  };

  // Domain 2: User Management & Organizations (Theme: Blue)
  const grpUsers = {
    id: "domain-users",
    type: "DomainGroupNode",
    position: { x: 0, y: 480 },
    style: { width: 720, height: 440 },
    data: {
      label: "User Management",
      name: "User Management",
      description: "Profiles, teams, organizations, and tenancy hierarchy",
      colorTheme: "blue",
      icon: "Users",
      isDomainGroup: true,
    },
  };

  const tblProfiles = {
    id: "table-profiles",
    type: "SqlTableNode",
    parentId: "domain-users",
    position: { x: 40, y: 70 },
    data: {
      label: "user_profiles",
      name: "user_profiles",
      schema: "public",
      domainId: "domain-users",
      domainName: "User Management",
      domainTheme: "blue",
      columns: [
        { id: "p-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "p-2", name: "user_id", type: "UUID", isFk: true, isNullable: false },
        { id: "p-3", name: "first_name", type: "VARCHAR(100)", isNullable: false },
        { id: "p-4", name: "last_name", type: "VARCHAR(100)", isNullable: false },
        { id: "p-5", name: "avatar_url", type: "TEXT", isNullable: true },
      ],
      comment: "Personal profile data",
    },
  };

  const tblOrgs = {
    id: "table-organizations",
    type: "SqlTableNode",
    parentId: "domain-users",
    position: { x: 380, y: 70 },
    data: {
      label: "organizations",
      name: "organizations",
      schema: "public",
      domainId: "domain-users",
      domainName: "User Management",
      domainTheme: "blue",
      columns: [
        { id: "o-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "o-2", name: "name", type: "VARCHAR(150)", isNullable: false },
        { id: "o-3", name: "slug", type: "VARCHAR(100)", isUnique: true, isNullable: false },
        { id: "o-4", name: "owner_id", type: "UUID", isFk: true, isNullable: false },
        { id: "o-5", name: "tier", type: "VARCHAR(50)", isNullable: false },
      ],
      comment: "Multi-tenant tenant entities",
    },
  };

  // Domain 3: Billing & Invoicing (Theme: Emerald)
  const grpBilling = {
    id: "domain-billing",
    type: "DomainGroupNode",
    position: { x: 740, y: 0 },
    style: { width: 720, height: 440 },
    data: {
      label: "Billing & Invoicing",
      name: "Billing & Invoicing",
      description: "Subscriptions, payment ledger, transaction records, and invoices",
      colorTheme: "emerald",
      icon: "CreditCard",
      isDomainGroup: true,
    },
  };

  const tblSubscriptions = {
    id: "table-subscriptions",
    type: "SqlTableNode",
    parentId: "domain-billing",
    position: { x: 40, y: 70 },
    data: {
      label: "subscriptions",
      name: "subscriptions",
      schema: "billing",
      domainId: "domain-billing",
      domainName: "Billing & Invoicing",
      domainTheme: "emerald",
      columns: [
        { id: "sub-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "sub-2", name: "user_id", type: "UUID", isFk: true, isNullable: false },
        { id: "sub-3", name: "org_id", type: "UUID", isFk: true, isNullable: false },
        { id: "sub-4", name: "plan_id", type: "VARCHAR(100)", isNullable: false },
        { id: "sub-5", name: "status", type: "VARCHAR(50)", isNullable: false },
      ],
      comment: "Active customer plans",
    },
  };

  const tblInvoices = {
    id: "table-invoices",
    type: "SqlTableNode",
    parentId: "domain-billing",
    position: { x: 380, y: 70 },
    data: {
      label: "invoices",
      name: "invoices",
      schema: "billing",
      domainId: "domain-billing",
      domainName: "Billing & Invoicing",
      domainTheme: "emerald",
      columns: [
        { id: "inv-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "inv-2", name: "subscription_id", type: "UUID", isFk: true, isNullable: false },
        { id: "inv-3", name: "amount_cents", type: "INTEGER", isNullable: false },
        { id: "inv-4", name: "currency", type: "VARCHAR(3)", isNullable: false },
        { id: "inv-5", name: "status", type: "VARCHAR(50)", isNullable: false },
      ],
      comment: "Issued customer invoices",
    },
  };

  // Domain 4: Product Catalog (Theme: Amber)
  const grpCatalog = {
    id: "domain-catalog",
    type: "DomainGroupNode",
    position: { x: 740, y: 480 },
    style: { width: 720, height: 440 },
    data: {
      label: "Product Catalog",
      name: "Product Catalog",
      description: "Product inventory, categories, SKUs, and stock tracking",
      colorTheme: "amber",
      icon: "Package",
      isDomainGroup: true,
    },
  };

  const tblCategories = {
    id: "table-categories",
    type: "SqlTableNode",
    parentId: "domain-catalog",
    position: { x: 40, y: 70 },
    data: {
      label: "categories",
      name: "categories",
      schema: "catalog",
      domainId: "domain-catalog",
      domainName: "Product Catalog",
      domainTheme: "amber",
      columns: [
        { id: "c-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "c-2", name: "name", type: "VARCHAR(150)", isNullable: false },
        { id: "c-3", name: "slug", type: "VARCHAR(100)", isUnique: true, isNullable: false },
      ],
      comment: "Taxonomy categories",
    },
  };

  const tblProducts = {
    id: "table-products",
    type: "SqlTableNode",
    parentId: "domain-catalog",
    position: { x: 380, y: 70 },
    data: {
      label: "products",
      name: "products",
      schema: "catalog",
      domainId: "domain-catalog",
      domainName: "Product Catalog",
      domainTheme: "amber",
      columns: [
        { id: "pr-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "pr-2", name: "category_id", type: "UUID", isFk: true, isNullable: false },
        { id: "pr-3", name: "name", type: "VARCHAR(200)", isNullable: false },
        { id: "pr-4", name: "sku", type: "VARCHAR(100)", isUnique: true, isNullable: false },
        { id: "pr-5", name: "price_cents", type: "INTEGER", isNullable: false },
      ],
      comment: "Catalog items and SKU list",
    },
  };

  // Domain 5: Notifications & Comms (Theme: Cyan)
  const grpNotifications = {
    id: "domain-notifications",
    type: "DomainGroupNode",
    position: { x: 1480, y: 0 },
    style: { width: 700, height: 420 },
    data: {
      label: "Notifications & Comms",
      name: "Notifications & Comms",
      description: "In-app notifications, webhooks, delivery logs, and email dispatch",
      colorTheme: "cyan",
      icon: "Bell",
      isDomainGroup: true,
    },
  };

  const tblNotifications = {
    id: "table-notifications",
    type: "SqlTableNode",
    parentId: "domain-notifications",
    position: { x: 40, y: 70 },
    data: {
      label: "notifications",
      name: "notifications",
      schema: "comms",
      domainId: "domain-notifications",
      domainName: "Notifications & Comms",
      domainTheme: "cyan",
      columns: [
        { id: "n-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "n-2", name: "user_id", type: "UUID", isFk: true, isNullable: false },
        { id: "n-3", name: "channel", type: "VARCHAR(50)", isNullable: false },
        { id: "n-4", name: "title", type: "VARCHAR(255)", isNullable: false },
        { id: "n-5", name: "is_read", type: "BOOLEAN", isNullable: false },
      ],
      comment: "User notification inbox",
    },
  };

  const tblWebhooks = {
    id: "table-webhooks",
    type: "SqlTableNode",
    parentId: "domain-notifications",
    position: { x: 370, y: 70 },
    data: {
      label: "webhook_endpoints",
      name: "webhook_endpoints",
      schema: "comms",
      domainId: "domain-notifications",
      domainName: "Notifications & Comms",
      domainTheme: "cyan",
      columns: [
        { id: "w-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "w-2", name: "org_id", type: "UUID", isFk: true, isNullable: false },
        { id: "w-3", name: "url", type: "TEXT", isNullable: false },
        { id: "w-4", name: "secret", type: "VARCHAR(255)", isNullable: false },
      ],
      comment: "Outbound developer webhooks",
    },
  };

  // Domain 6: Analytics & Metrics (Theme: Purple)
  const grpAnalytics = {
    id: "domain-analytics",
    type: "DomainGroupNode",
    position: { x: 1480, y: 480 },
    style: { width: 700, height: 420 },
    data: {
      label: "Analytics & Metrics",
      name: "Analytics & Metrics",
      description: "User clickstream telemetry, event ingestion, and daily metrics rollups",
      colorTheme: "purple",
      icon: "BarChart3",
      isDomainGroup: true,
    },
  };

  const tblEvents = {
    id: "table-analytics-events",
    type: "SqlTableNode",
    parentId: "domain-analytics",
    position: { x: 40, y: 70 },
    data: {
      label: "analytics_events",
      name: "analytics_events",
      schema: "telemetry",
      domainId: "domain-analytics",
      domainName: "Analytics & Metrics",
      domainTheme: "purple",
      columns: [
        { id: "ae-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "ae-2", name: "user_id", type: "UUID", isFk: true, isNullable: false },
        { id: "ae-3", name: "event_name", type: "VARCHAR(150)", isNullable: false },
        { id: "ae-4", name: "properties", type: "JSONB", isNullable: false },
      ],
      comment: "Raw user behavior events",
    },
  };

  const tblMetrics = {
    id: "table-daily-metrics",
    type: "SqlTableNode",
    parentId: "domain-analytics",
    position: { x: 370, y: 70 },
    data: {
      label: "daily_metrics_rollup",
      name: "daily_metrics_rollup",
      schema: "telemetry",
      domainId: "domain-analytics",
      domainName: "Analytics & Metrics",
      domainTheme: "purple",
      columns: [
        { id: "dm-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "dm-2", name: "org_id", type: "UUID", isFk: true, isNullable: false },
        { id: "dm-3", name: "date", type: "DATE", isNullable: false },
        { id: "dm-4", name: "active_users", type: "INTEGER", isNullable: false },
      ],
      comment: "Aggregated daily KPI metrics",
    },
  };

  // Domain 7: Audit & Compliance (Theme: Rose)
  const grpAudit = {
    id: "domain-audit",
    type: "DomainGroupNode",
    position: { x: 2200, y: 0 },
    style: { width: 440, height: 420 },
    data: {
      label: "Audit & Compliance",
      name: "Audit & Compliance",
      description: "Immutable security audit trails, actor logs, and access compliance",
      colorTheme: "rose",
      icon: "Shield",
      isDomainGroup: true,
    },
  };

  const tblAudit = {
    id: "table-audit-logs",
    type: "SqlTableNode",
    parentId: "domain-audit",
    position: { x: 40, y: 70 },
    data: {
      label: "audit_logs",
      name: "audit_logs",
      schema: "compliance",
      domainId: "domain-audit",
      domainName: "Audit & Compliance",
      domainTheme: "rose",
      columns: [
        { id: "al-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "al-2", name: "actor_id", type: "UUID", isFk: true, isNullable: false },
        { id: "al-3", name: "action", type: "VARCHAR(150)", isNullable: false },
        { id: "al-4", name: "resource", type: "VARCHAR(150)", isNullable: false },
      ],
      comment: "Append-only security log",
    },
  };

  // Domain 8: Shared & Infrastructure (Theme: Slate)
  const grpCore = {
    id: "domain-core",
    type: "DomainGroupNode",
    position: { x: 2200, y: 480 },
    style: { width: 440, height: 420 },
    data: {
      label: "Shared & Infrastructure",
      name: "Shared & Infrastructure",
      description: "Global system feature flags, runtime configurations, and secrets",
      colorTheme: "slate",
      icon: "Layers",
      isDomainGroup: true,
    },
  };

  const tblFlags = {
    id: "table-feature-flags",
    type: "SqlTableNode",
    parentId: "domain-core",
    position: { x: 40, y: 70 },
    data: {
      label: "feature_flags",
      name: "feature_flags",
      schema: "core",
      domainId: "domain-core",
      domainName: "Shared & Infrastructure",
      domainTheme: "slate",
      columns: [
        { id: "ff-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "ff-2", name: "flag_key", type: "VARCHAR(150)", isUnique: true, isNullable: false },
        { id: "ff-3", name: "is_enabled", type: "BOOLEAN", isNullable: false },
        { id: "ff-4", name: "rollout_pct", type: "INTEGER", isNullable: false },
      ],
      comment: "Dynamic feature toggles",
    },
  };

  // Group nodes MUST come first in the array for React Flow subflow rendering
  const allNodes = [
    grpAuth,
    grpUsers,
    grpBilling,
    grpCatalog,
    grpNotifications,
    grpAnalytics,
    grpAudit,
    grpCore,
    tblUsers,
    tblSessions,
    tblProfiles,
    tblOrgs,
    tblSubscriptions,
    tblInvoices,
    tblCategories,
    tblProducts,
    tblNotifications,
    tblWebhooks,
    tblEvents,
    tblMetrics,
    tblAudit,
    tblFlags,
  ];

  // Cross-Domain & Inter-Table Relational Edges
  const allEdges = [
    {
      id: "edge-sessions-users",
      source: "table-sessions",
      target: "table-users",
      type: "erRelationship",
      label: "1:N (N:1)",
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 2 },
    },
    {
      id: "edge-profiles-users",
      source: "table-profiles",
      target: "table-users",
      type: "erRelationship",
      label: "1:1",
      animated: true,
      style: { stroke: "#3b82f6", strokeWidth: 2 },
    },
    {
      id: "edge-orgs-users",
      source: "table-organizations",
      target: "table-users",
      type: "erRelationship",
      label: "1:N (Owned By)",
      animated: true,
      style: { stroke: "#3b82f6", strokeWidth: 2 },
    },
    {
      id: "edge-subscriptions-users",
      source: "table-subscriptions",
      target: "table-users",
      type: "erRelationship",
      label: "1:N (Billed To)",
      animated: true,
      style: { stroke: "#10b981", strokeWidth: 2 },
    },
    {
      id: "edge-subscriptions-orgs",
      source: "table-subscriptions",
      target: "table-organizations",
      type: "erRelationship",
      label: "1:N (Tenant Sub)",
      animated: true,
      style: { stroke: "#10b981", strokeWidth: 2 },
    },
    {
      id: "edge-invoices-subscriptions",
      source: "table-invoices",
      target: "table-subscriptions",
      type: "erRelationship",
      label: "1:N (Invoice)",
      animated: true,
      style: { stroke: "#10b981", strokeWidth: 2 },
    },
    {
      id: "edge-products-categories",
      source: "table-products",
      target: "table-categories",
      type: "erRelationship",
      label: "1:N (Categorized)",
      animated: true,
      style: { stroke: "#f59e0b", strokeWidth: 2 },
    },
    {
      id: "edge-notifications-users",
      source: "table-notifications",
      target: "table-users",
      type: "erRelationship",
      label: "1:N (Sent To)",
      animated: true,
      style: { stroke: "#06b6d4", strokeWidth: 2 },
    },
    {
      id: "edge-webhooks-orgs",
      source: "table-webhooks",
      target: "table-organizations",
      type: "erRelationship",
      label: "1:N (Org Webhook)",
      animated: true,
      style: { stroke: "#06b6d4", strokeWidth: 2 },
    },
    {
      id: "edge-events-users",
      source: "table-analytics-events",
      target: "table-users",
      type: "erRelationship",
      label: "1:N (Action Tracked)",
      animated: true,
      style: { stroke: "#a855f7", strokeWidth: 2 },
    },
    {
      id: "edge-metrics-orgs",
      source: "table-daily-metrics",
      target: "table-organizations",
      type: "erRelationship",
      label: "1:N (Daily Rollup)",
      animated: true,
      style: { stroke: "#a855f7", strokeWidth: 2 },
    },
    {
      id: "edge-audit-users",
      source: "table-audit-logs",
      target: "table-users",
      type: "erRelationship",
      label: "1:N (Actor)",
      animated: true,
      style: { stroke: "#f43f5e", strokeWidth: 2 },
    },
  ];

  // Organize cleanly via Dagre auto-layout engine
  const layoutResult = getAutoLayout(allNodes, allEdges, {
    direction: "LR",
    nodeSep: 90,
    rankSep: 130,
  });

  return {
    nodes: layoutResult.nodes,
    edges: allEdges,
  };
}
