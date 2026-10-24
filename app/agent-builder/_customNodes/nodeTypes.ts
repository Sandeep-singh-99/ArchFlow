import SqlTableNode from "./SqlTableNode";
import SqlViewNode from "./SqlViewNode";
import SqlIndexNode from "./SqlIndexNode";
import SqlFunctionNode from "./SqlFunctionNode";
import SqlTriggerNode from "./SqlTriggerNode";
import SqlEnumNode from "./SqlEnumNode";

import NosqlCollectionNode from "./NosqlCollectionNode";
import NosqlDocumentNode from "./NosqlDocumentNode";
import NosqlIndexNode from "./NosqlIndexNode";
import NosqlReferenceNode from "./NosqlReferenceNode";
import NosqlEmbeddedNode from "./NosqlEmbeddedNode";
import NosqlValidationNode from "./NosqlValidationNode";

import DbNoteNode from "./DbNoteNode";
import DbSchemaNode from "./DbSchemaNode";

export const nodeTypes = {
  // SQL Nodes
  SqlTableNode,
  SqlViewNode,
  SqlIndexNode,
  SqlFunctionNode,
  SqlTriggerNode,
  SqlEnumNode,

  // NoSQL Nodes
  NosqlCollectionNode,
  NosqlDocumentNode,
  NosqlIndexNode,
  NosqlReferenceNode,
  NosqlEmbeddedNode,
  NosqlValidationNode,

  // Shared Nodes
  DbNoteNode,
  DbSchemaNode,

  // Convenient Aliases
  Table: SqlTableNode,
  View: SqlViewNode,
  Index: SqlIndexNode,
  StoredFunction: SqlFunctionNode,
  Trigger: SqlTriggerNode,
  Enum: SqlEnumNode,
  Collection: NosqlCollectionNode,
  Document: NosqlDocumentNode,
  Reference: NosqlReferenceNode,
  EmbeddedObject: NosqlEmbeddedNode,
  ValidationSchema: NosqlValidationNode,
  Note: DbNoteNode,
  Database: DbSchemaNode,
  Schema: DbSchemaNode,
};
