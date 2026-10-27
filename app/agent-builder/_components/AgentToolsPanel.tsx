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
      position: { x: 300 + offset, y: 160 + offset },
      data: {
        label: "sample_order_doc",
        name: "sample_order_doc",
        collectionName: "orders",
        sampleJson: `{\n  "_id": "65b2f8a1...",\n  "orderNumber": "ORD-2026-904",\n  "status": "shipped",\n  "items": [\n    { "productId": "p1", "qty": 2 }\n  ],\n  "totalAmount": 249.00\n}`,
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
      position: { x: 320 + offset, y: 180 + offset },
      data: {
        label: "idx_geo_store",
        name: "idx_geo_store",
        collectionName: "stores",
        indexType: "2dsphere Geospatial",
        keys: ["location: '2dsphere'", "category: 1"],
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
      position: { x: 340 + offset, y: 200 + offset },
      data: {
        label: "order_to_customer",
        name: "order_to_customer",
        fromCollection: "orders",
        fromField: "customerId",
        toCollection: "customers",
        toField: "_id",
        cardinality: "1:N",
        refType: "ObjectId Reference",
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
            Add Database Objects
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent
          align="start"
          side="bottom"
          sideOffset={8}
          className="w-[360px] p-2 shadow-2xl border-border bg-card/98 backdrop-blur-xl rounded-xl z-50 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto"
        >
          <Tabs defaultValue="sql" className="w-full">
            <TabsList className="grid grid-cols-3 mb-2 h-8 p-0.5 bg-muted/60">
              <TabsTrigger value="sql" className="text-xs font-semibold py-1">
                SQL Nodes
              </TabsTrigger>
              <TabsTrigger value="nosql" className="text-xs font-semibold py-1">
                NoSQL Nodes
              </TabsTrigger>
              <TabsTrigger value="shared" className="text-xs font-semibold py-1">
                Shared Nodes
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
                    Index columns and index types (B-Tree, Hash, GIN)
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={addFunctionNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Code2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">Stored Function</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Reusable database logic and parameters
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
                    Actions on INSERT, UPDATE, or DELETE
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={addEnumNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                  <ListFilter className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">Enum / Custom Type</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Reusable data types and allowed values
                  </div>
                </div>
              </DropdownMenuItem>
            </TabsContent>

            {/* NoSQL NODES */}
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
                      Essential
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    MongoDB collection containing documents
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={addDocumentNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                  <FileJson className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">Document</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    JSON-like fields, nested objects and arrays
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={addNosqlIndexNode}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-teal-500/15 text-teal-600 dark:text-teal-400 shrink-0">
                  <Compass className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-foreground">NoSQL Index</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Single-field, compound, text, or geospatial indexes
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
