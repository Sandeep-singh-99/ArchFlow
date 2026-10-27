"use client";

import React, { useContext, useState } from "react";
import { WorkflowContext } from "@/context/WorkflowContext";
import {
  Table,
  Eye,
  Zap,
  Code2,
  BellElectric,
  ListFilter,
  FolderTree,
  FileJson,
  Compass,
  Share2,
  Boxes,
  ShieldCheck,
  StickyNote,
  Database,
  Type,
  Plus,
  Layers,
  ChevronDown,
  Menu,
  Shield,
  CreditCard,
  Package,
  Users,
  Bell,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DOMAIN_PRESETS,
  DomainPreset,
  DOMAIN_THEMES,
} from "@/lib/domainThemes";
import { generateAllDomainsDemoSchema } from "@/lib/demoDomainSchema";
import { toast } from "sonner";

export default function AgentToolsPanel() {
  const { setAddedNodes, setNodeEdges } = useContext(WorkflowContext);
  const [open, setOpen] = useState(false);

  const getOffset = () => Math.floor(Math.random() * 60) - 30;

  // SQL Nodes
  const addTableNode = () => {
    const offset = getOffset();
    const id = `table-${Date.now()}`;
    const newNode = {
      id,
      type: "SqlTableNode",
      position: { x: 260 + offset, y: 140 + offset },
      data: {
        label: "users",
        name: "users",
        schema: "public",
        columns: [
          { id: "col-1", name: "id", type: "UUID", isPk: true, isNullable: false },
          { id: "col-2", name: "email", type: "VARCHAR(255)", isUnique: true, isNullable: false },
          { id: "col-3", name: "role_id", type: "INT", isFk: true, isNullable: true },
          { id: "col-4", name: "created_at", type: "TIMESTAMP", isNullable: false },
        ],
        comment: "User accounts table",
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
    setOpen(false);
  };

  const addViewNode = () => {
    const offset = getOffset();
    const id = `view-${Date.now()}`;
    const newNode = {
      id,
      type: "SqlViewNode",
      position: { x: 300 + offset, y: 160 + offset },
      data: {
        label: "v_active_users",
        name: "v_active_users",
        schema: "public",
        isMaterialized: false,
        query: "SELECT u.id, u.email, count(o.id) AS orders_count\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nGROUP BY u.id, u.email;",
        columns: ["id", "email", "orders_count"],
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
    setOpen(false);
  };

  const addIndexNode = () => {
    const offset = getOffset();
    const id = `index-${Date.now()}`;
    const newNode = {
      id,
      type: "SqlIndexNode",
      position: { x: 320 + offset, y: 180 + offset },
      data: {
        label: "idx_users_email",
        name: "idx_users_email",
        tableName: "users",
        indexType: "B-TREE",
        columns: ["email ASC"],
        isUnique: true,
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
    setOpen(false);
  };

  const addFunctionNode = () => {
    const offset = getOffset();
    const id = `func-${Date.now()}`;
    const newNode = {
      id,
      type: "SqlFunctionNode",
      position: { x: 340 + offset, y: 200 + offset },
      data: {
        label: "fn_calculate_discount",
        name: "fn_calculate_discount",
        language: "plpgsql",
        returnType: "NUMERIC",
        parameters: [
          { name: "p_user_id", type: "UUID" },
          { name: "p_total", type: "NUMERIC" },
        ],
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
    setOpen(false);
  };

  const addTriggerNode = () => {
    const offset = getOffset();
    const id = `trg-${Date.now()}`;
    const newNode = {
      id,
      type: "SqlTriggerNode",
      position: { x: 360 + offset, y: 220 + offset },
      data: {
        label: "trg_update_timestamp",
        name: "trg_update_timestamp",
        tableName: "orders",
        timing: "BEFORE",
        events: ["UPDATE"],
        functionName: "set_updated_at()",
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
    setOpen(false);
  };

  const addEnumNode = () => {
    const offset = getOffset();
    const id = `enum-${Date.now()}`;
    const newNode = {
      id,
      type: "SqlEnumNode",
      position: { x: 280 + offset, y: 170 + offset },
      data: {
        label: "order_status",
        name: "order_status",
        values: ["pending", "processing", "shipped", "delivered", "cancelled"],
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
    setOpen(false);
  };

  // NoSQL Nodes
  const addCollectionNode = () => {
    const offset = getOffset();
    const id = `collection-${Date.now()}`;
    const newNode = {
      id,
      type: "NosqlCollectionNode",
      position: { x: 260 + offset, y: 140 + offset },
      data: {
        label: "customers",
        name: "customers",
        database: "store_db",
        shardKey: "_id: hashed",
        fields: [
          { name: "_id", type: "ObjectId", required: true },
          { name: "name", type: "String", required: true },
          { name: "email", type: "String", required: true },
          { name: "addresses", type: "Array<Object>", required: false },
          { name: "createdAt", type: "Date", required: true },
        ],
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
    setOpen(false);
  };

  const addDocumentNode = () => {
    const offset = getOffset();
    const id = `doc-${Date.now()}`;
    const newNode = {
      id,
      type: "NosqlDocumentNode",
      position: { x: 280 + offset, y: 160 + offset },
      data: {
        label: "UserProfileDoc",
        name: "UserProfileDoc",
        collectionName: "customers",
        version: "v1.2",
        attributes: [
          { key: "preferences.theme", val: "'dark'" },
          { key: "preferences.currency", val: "'USD'" },
          { key: "auth.mfa_enabled", val: "true" },
          { key: "tags", val: "['vip', 'early_adopter']" },
        ],
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
    setOpen(false);
  };

  const addNosqlIndexNode = () => {
    const offset = getOffset();
    const id = `nosql-idx-${Date.now()}`;
    const newNode = {
      id,
      type: "NosqlIndexNode",
      position: { x: 300 + offset, y: 180 + offset },
      data: {
        label: "idx_cust_email_unique",
        name: "idx_cust_email_unique",
        collectionName: "customers",
        indexType: "Compound (Asc/Desc)",
        keys: "{ email: 1, tenant_id: 1 }",
        isUnique: true,
        isSparse: false,
        ttlSeconds: undefined,
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
    setOpen(false);
  };

  const addReferenceNode = () => {
    const offset = getOffset();
    const id = `ref-${Date.now()}`;
    const newNode = {
      id,
      type: "NosqlReferenceNode",
      position: { x: 270 + offset, y: 150 + offset },
      data: {
        label: "Cust_Order_Rel",
        name: "Cust_Order_Rel",
        fromCollection: "orders",
        toCollection: "customers",
        relationshipType: "1:N",
        refField: "customer_id",
        targetField: "_id",
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
    setOpen(false);
  };

  const addEmbeddedNode = () => {
    const offset = getOffset();
    const id = `embed-${Date.now()}`;
    const newNode = {
      id,
      type: "NosqlEmbeddedNode",
      position: { x: 290 + offset, y: 190 + offset },
      data: {
        label: "ShippingAddress",
        name: "ShippingAddress",
        parentSchema: "OrderDocument",
        isArray: false,
        fields: [
          { name: "street", type: "String" },
          { name: "city", type: "String" },
          { name: "postalCode", type: "String" },
          { name: "country", type: "String" },
        ],
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
    setOpen(false);
  };

  const addValidationNode = () => {
    const offset = getOffset();
    const id = `validator-${Date.now()}`;
    const newNode = {
      id,
      type: "NosqlValidationNode",
      position: { x: 310 + offset, y: 210 + offset },
      data: {
        label: "CustomerValidator",
        name: "CustomerValidator",
        collectionName: "customers",
        validationLevel: "strict",
        validationAction: "error",
        requiredFields: ["_id", "name", "email"],
        rulesSummary: "email matches standard RFC regex, status in ['active', 'inactive']",
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
    setOpen(false);
  };

  // Domain Containers
  const addDomainNode = (preset?: DomainPreset) => {
    const offset = getOffset();
    const id = `domain-${Date.now()}`;
    const name = preset?.name || "Custom Domain";
    const theme = preset?.theme || "indigo";
    const description = preset?.description || "Domain subgraph boundary container";
    const icon = preset?.icon || "Layers";

    const newNode = {
      id,
      type: "DomainGroupNode",
      position: { x: 200 + offset, y: 100 + offset },
      style: { width: 560, height: 380 },
      data: {
        label: name,
        name: name,
        description,
        colorTheme: theme,
        icon,
        isDomainGroup: true,
      },
    };
    // Group container nodes MUST be placed at start of array in React Flow
    setAddedNodes((prev: any) => [newNode, ...(prev || [])]);
    setOpen(false);
  };

  const loadFullDemoSchema = () => {
    const demo = generateAllDomainsDemoSchema();
    setAddedNodes(demo.nodes);
    setNodeEdges(demo.edges);
    setOpen(false);
    toast.success("Loaded Enterprise 8-Domain Architecture Demo!");
  };

  // Shared Nodes
  const addNoteNode = () => {
    const offset = getOffset();
    const id = `note-${Date.now()}`;
    const newNode = {
      id,
      type: "DbNoteNode",
      position: { x: 240 + offset, y: 120 + offset },
      data: {
        label: "Architecture Note",
        text: "Database Note:\n• Primary cluster runs on Aurora PostgreSQL / MongoDB 7.\n• Foreign keys use CASCADE on delete for audit trails.",
        color: "yellow",
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
    setOpen(false);
  };

  const addSchemaNode = () => {
    const offset = getOffset();
    const id = `schema-${Date.now()}`;
    const newNode = {
      id,
      type: "DbSchemaNode",
      position: { x: 220 + offset, y: 100 + offset },
      data: {
        label: "ecommerce_db",
        name: "ecommerce_db",
        engine: "PostgreSQL 16",
        charset: "UTF-8",
        collation: "en_US.UTF-8",
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
    setOpen(false);
  };

  const addTextNode = () => {
    const offset = getOffset();
    const id = `text-${Date.now()}`;
    const newNode = {
      id,
      type: "TextNode",
      position: { x: 260 + offset, y: 140 + offset },
      data: {
        label: "Text Annotation",
        text: "Database Architecture Notes & Annotations",
        fontSize: "base",
        color: "default",
        hasBackground: false,
      },
    };
    setAddedNodes((prev: any) => [...(prev || []), newNode]);
    setOpen(false);
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case "Shield":
        return <Shield className="h-4 w-4" />;
      case "CreditCard":
        return <CreditCard className="h-4 w-4" />;
      case "Package":
        return <Package className="h-4 w-4" />;
      case "Users":
        return <Users className="h-4 w-4" />;
      case "Bell":
        return <Bell className="h-4 w-4" />;
      case "BarChart3":
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-card/95 backdrop-blur-md border border-border/80 p-1 rounded-xl shadow-xl flex items-center">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all cursor-pointer"
                aria-label="Add database objects"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">
            Add Database Objects & Domains
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent
          align="start"
          side="bottom"
          sideOffset={8}
          className="w-[370px] p-2 shadow-2xl border-border bg-card/98 backdrop-blur-xl rounded-xl z-50 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto"
        >
          <Tabs defaultValue="sql" className="w-full">
            <TabsList className="grid grid-cols-4 mb-2 h-8 p-0.5 bg-muted/60">
              <TabsTrigger value="sql" className="text-xs font-semibold py-1">
                SQL
              </TabsTrigger>
              <TabsTrigger value="nosql" className="text-xs font-semibold py-1">
                NoSQL
              </TabsTrigger>
              <TabsTrigger value="domains" className="text-xs font-semibold py-1 text-emerald-600 dark:text-emerald-400">
                Domains
              </TabsTrigger>
              <TabsTrigger value="shared" className="text-xs font-semibold py-1">
                Shared
              </TabsTrigger>
            </TabsList>

            {/* SQL NODES */}
            <TabsContent value="sql" className="space-y-1 focus-visible:outline-none">
              <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 py-0.5">
                Relational Objects
              </DropdownMenuLabel>

              <DropdownMenuItem
                onClick={addTableNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Table className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-foreground">Table</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                      Essential
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Columns, data types, PK, FK, constraints
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={addViewNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 shrink-0">
                  <Eye className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">View</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Virtual table defined by a query
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={addIndexNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-400 shrink-0">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">Index</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    B-Tree, Hash, GIN, unique index specs
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={addFunctionNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                  <Code2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">Stored Function</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    PL/pgSQL or SQL procedures and routines
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={addTriggerNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
                  <BellElectric className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">Trigger</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Event-driven database triggers (INSERT, UPDATE)
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={addEnumNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 shrink-0">
                  <ListFilter className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">Enum Type</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    User-defined custom enumerated types
                  </div>
                </div>
              </DropdownMenuItem>
            </TabsContent>

            {/* NOSQL NODES */}
            <TabsContent value="nosql" className="space-y-1 focus-visible:outline-none">
              <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 py-0.5">
                Document & NoSQL Objects
              </DropdownMenuLabel>

              <DropdownMenuItem
                onClick={addCollectionNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <FolderTree className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-foreground">Collection</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                      Core
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    MongoDB / Document Store schema definition
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={addDocumentNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                  <FileJson className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">Document Schema</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Document structure and key-value templates
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={addNosqlIndexNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-400 shrink-0">
                  <Compass className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">NoSQL Index</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Compound, TTL, Geospatial, and Text indexes
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={addReferenceNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 shrink-0">
                  <Share2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">Reference</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Link documents between collections (1:1, 1:N, N:M)
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={addEmbeddedNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 shrink-0">
                  <Boxes className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">Embedded Object</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Nested objects and arrays inside documents
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={addValidationNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">Validation Schema</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Document field types and validation rules
                  </div>
                </div>
              </DropdownMenuItem>
            </TabsContent>

            {/* DOMAIN SUBGRAPH CONTAINERS */}
            <TabsContent value="domains" className="space-y-1 focus-visible:outline-none">
              {/* One-Click All Domains Architecture Demo */}
              <div className="p-2.5 mb-2 rounded-xl bg-gradient-to-br from-emerald-500/10 via-indigo-500/10 to-amber-500/10 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <span>Enterprise 8-Domain Demo</span>
                </div>
                <p className="text-[10.5px] text-muted-foreground leading-snug">
                  Instant showcase of all 8 colored domain containers (Auth, Billing, Catalog, Users, Comms, Analytics, Audit, Core) with 14 connected relational tables.
                </p>
                <Button
                  size="sm"
                  onClick={loadFullDemoSchema}
                  className="w-full h-7 text-xs font-semibold bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white hover:brightness-110 shadow-xs cursor-pointer border-none"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Load All 8 Domains Demo
                </Button>
              </div>

              <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 py-0.5">
                Domain Subgraph Containers
              </DropdownMenuLabel>

              {DOMAIN_PRESETS.map((preset) => {
                const themeCfg = DOMAIN_THEMES[preset.theme];
                return (
                  <DropdownMenuItem
                    key={preset.name}
                    onClick={() => addDomainNode(preset)}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  >
                    <div
                      className="p-2 rounded-md shrink-0 border"
                      style={{
                        backgroundColor: `${themeCfg.accent}15`,
                        borderColor: `${themeCfg.accent}35`,
                        color: themeCfg.accent,
                      }}
                    >
                      {getPresetIcon(preset.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-foreground">
                          {preset.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[8.5px] px-1 py-0 h-3.5 font-mono ${themeCfg.badge}`}
                        >
                          {themeCfg.label.split(" / ")[0]}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {preset.description}
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                onClick={() => addDomainNode()}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0 border border-primary/20">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">
                    Custom Domain Boundary
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Blank colored subgraph container for grouping tables
                  </div>
                </div>
              </DropdownMenuItem>
            </TabsContent>

            {/* SHARED NODES */}
            <TabsContent value="shared" className="space-y-1 focus-visible:outline-none">
              <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 py-0.5">
                Diagram & Organization
              </DropdownMenuLabel>

              <DropdownMenuItem
                onClick={addNoteNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                  <StickyNote className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">Note</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Add explanations, caveats, and documentation
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={addSchemaNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                  <Database className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">Database / Schema</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Group objects by database or namespace
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={addTextNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 shrink-0">
                  <Type className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">Text Label</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Free-floating text, titles, and annotations
                  </div>
                </div>
              </DropdownMenuItem>
            </TabsContent>
          </Tabs>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
