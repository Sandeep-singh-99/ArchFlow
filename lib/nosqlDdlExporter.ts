/**
 * NoSQL DDL & Schema Exporter for Database Schema Studio
 * Generates executable MongoDB collection creation scripts,
 * $jsonSchema validators, compound indexes, and document models.
 */

export interface NosqlExportOptions {
  includeComments?: boolean;
  includeValidators?: boolean;
  includeIndexes?: boolean;
}

export function exportNosqlDdl(
  nodes: any[] = [],
  edges: any[] = [],
  options: NosqlExportOptions = {}
): string {
  const {
    includeComments = true,
    includeValidators = true,
    includeIndexes = true,
  } = options;

  const lines: string[] = [];
  const timestamp = new Date().toISOString().split("T")[0];

  if (includeComments) {
    lines.push(`// =========================================================================`);
    lines.push(`// NoSQL Database Architecture Schema (MongoDB / Document Collections)`);
    lines.push(`// Generated: ${timestamp}`);
    lines.push(`// Generated via Database Schema Studio`);
    lines.push(`// =========================================================================\n`);
  }

  // Find collections (NosqlCollectionNode or converted SqlTableNode)
  const collectionNodes = nodes.filter(
    (n) =>
      n.type === "NosqlCollectionNode" ||
      n.type === "Collection" ||
      n.type === "SqlTableNode" ||
      n.type === "Table"
  );

  // Find embedded sub-document nodes
  const embeddedNodes = nodes.filter(
    (n) => n.type === "NosqlEmbeddedNode" || n.type === "Embedded"
  );

  // Find index nodes
  const indexNodes = nodes.filter(
    (n) =>
      n.type === "NosqlIndexNode" ||
      n.type === "SqlIndexNode" ||
      n.type === "Index"
  );

  if (collectionNodes.length === 0 && embeddedNodes.length === 0) {
    return `// No tables or collections found on the canvas.\n// Add collections or tables from the left palette to generate NoSQL DDL.`;
  }

  // 1. EMBEDDED SUB-DOCUMENTS
  if (embeddedNodes.length > 0) {
    lines.push(`// -------------------------------------------------------------------------`);
    lines.push(`// 1. EMBEDDED SUB-DOCUMENT SCHEMAS`);
    lines.push(`// -------------------------------------------------------------------------`);
    embeddedNodes.forEach((node) => {
      const name = node.data?.name || node.data?.label || "SubDocument";
      const schemaVar = `${capitalize(name)}SubSchema`;
      const fields = node.data?.fields || [];

      lines.push(`const ${schemaVar} = {`);
      lines.push(`  bsonType: "object",`);
      lines.push(`  title: "${name}",`);
      if (fields.length > 0) {
        lines.push(`  properties: {`);
        fields.forEach((f: any) => {
          const bson = mapToBsonType(f.type || "string");
          lines.push(`    ${f.name}: { bsonType: "${bson}" },`);
        });
        lines.push(`  }`);
      }
      lines.push(`};\n`);
    });
  }

  // 2. COLLECTIONS WITH $jsonSchema VALIDATION
  lines.push(`// -------------------------------------------------------------------------`);
  lines.push(`// 2. COLLECTIONS & VALIDATION SCHEMAS`);
  lines.push(`// -------------------------------------------------------------------------`);

  collectionNodes.forEach((node) => {
    const rawName = node.data?.name || node.data?.label || "untitled_collection";
    const collectionName = rawName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const shardKey = node.data?.shardKey;
    const database = node.data?.database || "app_db";

    let fields: { name: string; type: string; required?: boolean }[] = [];
    if (Array.isArray(node.data?.fields)) {
      fields = node.data.fields;
    } else if (Array.isArray(node.data?.columns)) {
      fields = node.data.columns.map((c: any) => ({
        name: c.name,
        type: c.type,
        required: c.isPk || !c.isNullable,
      }));
    } else {
      fields = [
        { name: "_id", type: "ObjectId", required: true },
        { name: "createdAt", type: "Date", required: true },
        { name: "updatedAt", type: "Date", required: false },
      ];
    }

    const requiredFields = fields.filter((f) => f.required).map((f) => `"${f.name}"`);

    lines.push(`// Collection: ${collectionName}`);
    if (includeValidators) {
      lines.push(`db.createCollection("${collectionName}", {`);
      lines.push(`  validator: {`);
      lines.push(`    $jsonSchema: {`);
      lines.push(`      bsonType: "object",`);
      lines.push(`      title: "${rawName} Document Validation",`);
      if (requiredFields.length > 0) {
        lines.push(`      required: [${requiredFields.join(", ")}],`);
      }
      lines.push(`      properties: {`);
      fields.forEach((f) => {
        const bson = mapToBsonType(f.type || "string");
        lines.push(`        ${f.name}: {`);
        lines.push(`          bsonType: "${bson}",`);
        lines.push(`          description: "${f.name} field (${f.type})"`);
        lines.push(`        },`);
      });
      lines.push(`      }`);
      lines.push(`    }`);
      lines.push(`  },`);
      lines.push(`  validationLevel: "moderate",`);
      lines.push(`  validationAction: "error"`);
      lines.push(`});\n`);
    } else {
      lines.push(`db.createCollection("${collectionName}");\n`);
    }

    if (shardKey) {
      lines.push(`// Shard Collection: ${collectionName}`);
      lines.push(`sh.shardCollection("${database}.${collectionName}", ${shardKey});\n`);
    }
  });

  // 3. INDEXES
  if (includeIndexes && (indexNodes.length > 0 || collectionNodes.length > 0)) {
    lines.push(`// -------------------------------------------------------------------------`);
    lines.push(`// 3. INDEXES & COMPOUND KEYS`);
    lines.push(`// -------------------------------------------------------------------------`);

    collectionNodes.forEach((node) => {
      const name = (node.data?.name || node.data?.label || "collection").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      const fields = node.data?.fields || node.data?.columns || [];
      const hasEmail = fields.some((f: any) => (f.name || "").toLowerCase() === "email");
      if (hasEmail) {
        lines.push(`db.${name}.createIndex({ email: 1 }, { unique: true, name: "idx_${name}_email" });`);
      }
    });

    indexNodes.forEach((idx) => {
      const collName = (idx.data?.collectionName || idx.data?.tableName || "collection").toLowerCase();
      const idxName = idx.data?.name || idx.data?.label || "idx_custom";
      const keys = idx.data?.keys;
      const isUnique = Boolean(idx.data?.isUnique);

      if (Array.isArray(keys) && keys.length > 0) {
        const keyObjParts = keys.map((k: string) => {
          const [f, dir] = k.split(":").map((s) => s.trim());
          return `${f}: ${dir || 1}`;
        });
        lines.push(
          `db.${collName}.createIndex({ ${keyObjParts.join(", ")} }, { ${isUnique ? "unique: true, " : ""}name: "${idxName}" });`
        );
      } else {
        const columns = idx.data?.columns || ["createdAt"];
        const keyParts = columns.map((c: string) => `${c}: 1`).join(", ");
        lines.push(
          `db.${collName}.createIndex({ ${keyParts} }, { ${isUnique ? "unique: true, " : ""}name: "${idxName}" });`
        );
      }
    });
    lines.push("");
  }

  // 4. RELATIONSHIPS
  if (edges.length > 0) {
    lines.push(`// -------------------------------------------------------------------------`);
    lines.push(`// 4. MAPPED RELATIONSHIPS & DOCUMENT REFERENCES (DBRef / ObjectId)`);
    lines.push(`// -------------------------------------------------------------------------`);
    edges.forEach((e) => {
      const s = nodes.find((n) => n.id === e.source);
      const t = nodes.find((n) => n.id === e.target);
      const sName = s?.data?.name || s?.data?.label || e.source;
      const tName = t?.data?.name || t?.data?.label || e.target;
      const label = e.data?.label ? ` (${e.data.label})` : "";
      const card = e.data?.cardinality ? ` [${e.data.cardinality}]` : "";
      lines.push(`// ${sName} -> ${tName}${card}${label}`);
    });
    lines.push("");
  }

  return lines.join("\n");
}

function mapToBsonType(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("objectid")) return "objectId";
  if (t.includes("int") || t.includes("serial")) return "int";
  if (t.includes("bigint") || t.includes("long")) return "long";
  if (t.includes("double") || t.includes("float") || t.includes("decimal") || t.includes("numeric")) return "double";
  if (t.includes("bool")) return "bool";
  if (t.includes("date") || t.includes("time")) return "date";
  if (t.includes("array") || t.includes("[]")) return "array";
  if (t.includes("object") || t.includes("json")) return "object";
  return "string";
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
