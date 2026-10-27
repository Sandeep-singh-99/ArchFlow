import { getAutoLayout } from "./autoLayout";

export interface DemoSchemaResult {
  nodes: any[];
  edges: any[];
}

/**
 * Generates a clean demo schema wrapped inside ONE unified Custom Domain container.
 */
export function generateAllDomainsDemoSchema(): DemoSchemaResult {
  // Single Unified Custom Domain Boundary Container
  const customDomain = {
    id: "custom-domain-1",
    type: "DomainGroupNode",
    position: { x: 0, y: 0 },
    style: { width: 980, height: 560 },
    data: {
      label: "Custom Domain",
      name: "Custom Domain",
      description: "Primary database boundary container for core application services",
      colorTheme: "indigo",
      icon: "Layers",
      isDomainGroup: true,
    },
  };

  const tblUsers = {
    id: "table-users",
    type: "SqlTableNode",
    parentId: "custom-domain-1",
    position: { x: 40, y: 70 },
    data: {
      label: "users",
      name: "users",
      schema: "public",
      domainId: "custom-domain-1",
      domainName: "Custom Domain",
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

  const tblProfiles = {
    id: "table-profiles",
    type: "SqlTableNode",
    parentId: "custom-domain-1",
    position: { x: 360, y: 70 },
    data: {
      label: "user_profiles",
      name: "user_profiles",
      schema: "public",
      domainId: "custom-domain-1",
      domainName: "Custom Domain",
      domainTheme: "indigo",
      columns: [
        { id: "p-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "p-2", name: "user_id", type: "UUID", isFk: true, isNullable: false },
        { id: "p-3", name: "first_name", type: "VARCHAR(100)", isNullable: false },
        { id: "p-4", name: "last_name", type: "VARCHAR(100)", isNullable: false },
        { id: "p-5", name: "avatar_url", type: "TEXT", isNullable: true },
      ],
      comment: "Profile details linked to user",
    },
  };

  const tblSubscriptions = {
    id: "table-subscriptions",
    type: "SqlTableNode",
    parentId: "custom-domain-1",
    position: { x: 40, y: 310 },
    data: {
      label: "subscriptions",
      name: "subscriptions",
      schema: "billing",
      domainId: "custom-domain-1",
      domainName: "Custom Domain",
      domainTheme: "indigo",
      columns: [
        { id: "sub-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "sub-2", name: "user_id", type: "UUID", isFk: true, isNullable: false },
        { id: "sub-3", name: "plan", type: "VARCHAR(100)", isNullable: false },
        { id: "sub-4", name: "status", type: "VARCHAR(50)", isNullable: false },
        { id: "sub-5", name: "current_period_end", type: "TIMESTAMP", isNullable: false },
      ],
      comment: "Customer subscription plan",
    },
  };

  const tblInvoices = {
    id: "table-invoices",
    type: "SqlTableNode",
    parentId: "custom-domain-1",
    position: { x: 360, y: 310 },
    data: {
      label: "invoices",
      name: "invoices",
      schema: "billing",
      domainId: "custom-domain-1",
      domainName: "Custom Domain",
      domainTheme: "indigo",
      columns: [
        { id: "inv-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "inv-2", name: "subscription_id", type: "UUID", isFk: true, isNullable: false },
        { id: "inv-3", name: "amount_cents", type: "INTEGER", isNullable: false },
        { id: "inv-4", name: "status", type: "VARCHAR(50)", isNullable: false },
      ],
      comment: "Issued customer invoices",
    },
  };

  const tblProducts = {
    id: "table-products",
    type: "SqlTableNode",
    parentId: "custom-domain-1",
    position: { x: 680, y: 70 },
    data: {
      label: "products",
      name: "products",
      schema: "catalog",
      domainId: "custom-domain-1",
      domainName: "Custom Domain",
      domainTheme: "indigo",
      columns: [
        { id: "pr-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "pr-2", name: "name", type: "VARCHAR(200)", isNullable: false },
        { id: "pr-3", name: "sku", type: "VARCHAR(100)", isUnique: true, isNullable: false },
        { id: "pr-4", name: "price_cents", type: "INTEGER", isNullable: false },
      ],
      comment: "Product catalog inventory",
    },
  };

  const tblAudit = {
    id: "table-audit-logs",
    type: "SqlTableNode",
    parentId: "custom-domain-1",
    position: { x: 680, y: 310 },
    data: {
      label: "audit_logs",
      name: "audit_logs",
      schema: "compliance",
      domainId: "custom-domain-1",
      domainName: "Custom Domain",
      domainTheme: "indigo",
      columns: [
        { id: "al-1", name: "id", type: "UUID", isPk: true, isNullable: false },
        { id: "al-2", name: "actor_id", type: "UUID", isFk: true, isNullable: false },
        { id: "al-3", name: "action", type: "VARCHAR(150)", isNullable: false },
        { id: "al-4", name: "resource", type: "VARCHAR(150)", isNullable: false },
      ],
      comment: "Append-only security log",
    },
  };

  // Group container MUST be ordered before child nodes in React Flow
  const allNodes = [
    customDomain,
    tblUsers,
    tblProfiles,
    tblSubscriptions,
    tblInvoices,
    tblProducts,
    tblAudit,
  ];

  const allEdges = [
    {
      id: "edge-profiles-users",
      source: "table-profiles",
      target: "table-users",
      type: "erRelationship",
      label: "1:1",
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 2 },
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
      id: "edge-invoices-subscriptions",
      source: "table-invoices",
      target: "table-subscriptions",
      type: "erRelationship",
      label: "1:N (Invoice)",
      animated: true,
      style: { stroke: "#10b981", strokeWidth: 2 },
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
    nodeSep: 80,
    rankSep: 110,
  });

  return {
    nodes: layoutResult.nodes,
    edges: allEdges,
  };
}
