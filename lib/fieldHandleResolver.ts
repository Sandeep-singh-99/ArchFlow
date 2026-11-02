/**
 * Field Handle Resolver
 * Resolves exact column and field handles on React Flow database nodes
 * so AI-generated database schemas connect field-to-field, exactly
 * the same as when a user manually drags and connects two node field handles.
 */

export interface FieldHandleResult {
  handleId: string;
  colName?: string;
  isFieldConnection: boolean;
}

/**
 * Normalizes entity or table names:
 * Strips schema prefixes, column references, and common suffixes (_id, Id).
 */
export function normalizeEntityName(str: string): string {
  if (!str) return "";
  let s = str.toLowerCase().trim();
  if (s.includes(".")) s = s.split(".")[0];
  s = s.replace(/\(.*?\)/g, "").trim();
  if (s.endsWith("_id")) {
    s = s.slice(0, -3);
  } else if (s.endsWith("id") && s.length > 2) {
    s = s.slice(0, -2);
  }
  return s;
}

/**
 * Checks singular/plural and root equality between table names and reference queries.
 */
export function isEntityNameMatch(nodeName: string, query: string): boolean {
  const n = normalizeEntityName(nodeName);
  const q = normalizeEntityName(query);
  if (!n || !q) return false;
  if (n === q) return true;
  if (`${n}s` === q || `${q}s` === n) return true;
  if (`${n}es` === q || `${q}es` === n) return true;
  if (n.replace(/ies$/, "y") === q || q.replace(/ies$/, "y") === n) return true;
  if (n.replace(/y$/, "ies") === q || q.replace(/y$/, "ies") === n) return true;
  return false;
}

/**
 * Finds a node in a list by name, table name, or ID.
 */
export function findMatchingNode(nameOrId: string, nodesList: any[]): any {
  if (!nameOrId || !Array.isArray(nodesList)) return null;
  const rawQ = nameOrId.toLowerCase().trim();
  const qNorm = normalizeEntityName(nameOrId);

  // 1. Exact match on table name or node ID
  const exact = nodesList.find((n: any) => {
    const name = (n.data?.name || n.data?.tableName || n.data?.label || "").toLowerCase().trim();
    const id = (n.id || "").toLowerCase().trim();
    return name === rawQ || id === rawQ;
  });
  if (exact) return exact;

  // 2. Normalized root/plural match
  const normMatch = nodesList.find((n: any) => {
    const name = (n.data?.name || n.data?.tableName || n.data?.label || "").toLowerCase().trim();
    return isEntityNameMatch(name, qNorm);
  });
  if (normMatch) return normMatch;

  // 3. ID prefix match (e.g. "users-174123" matches "users")
  const idMatch = nodesList.find((n: any) => {
    const id = (n.id || "").toLowerCase().trim();
    return id.startsWith(`${qNorm}-`) || id.startsWith(`${rawQ}-`);
  });
  if (idMatch) return idMatch;

  // 4. Substring fallback for names longer than 2 characters
  if (qNorm.length >= 3) {
    const subMatch = nodesList.find((n: any) => {
      const name = (n.data?.name || n.data?.tableName || n.data?.label || "").toLowerCase().trim();
      const id = (n.id || "").toLowerCase().trim();
      return name.includes(qNorm) || id.includes(qNorm);
    });
    if (subMatch) return subMatch;
  }

  return null;
}

/**
 * Resolves the exact field handle on a node.
 * For SqlTableNode, handles are rendered as: `col-${colHandleKey}-${side}`
 * For NosqlCollectionNode, handles are rendered as: `field-${fieldKey}-${side}`
 * For NosqlEmbeddedNode, handles are rendered as: `embed-field-${fieldKey}-${side}`
 *
 * @param node The React Flow node
 * @param preferredColName Optional column/field name specified by the user or relation
 * @param role "parent" (referenced/PK) or "child" (referencing/FK)
 * @param side "left" or "right"
 * @param otherNode The opposite node in the relationship (used for FK matching)
 */
export function resolveNodeFieldHandle(
  node: any,
  preferredColName: string | undefined,
  role: "parent" | "child",
  side: "left" | "right",
  otherNode?: any,
  options?: {
    connectToField?: boolean;
  }
): FieldHandleResult {
  if (!node) {
    return { handleId: side, isFieldConnection: false };
  }

  // If explicitly requested to connect at the model/table level (not to any specific field / _id)
  if (options?.connectToField === false) {
    return { handleId: side, isFieldConnection: false };
  }

  const nodeType = node.type || "SqlTableNode";
  const isSql = nodeType === "SqlTableNode" || nodeType === "Table";
  const isNoSqlCollection = nodeType === "NosqlCollectionNode" || nodeType === "Collection";
  const isNoSqlEmbedded = nodeType === "NosqlEmbeddedNode" || nodeType === "Embedded";

  // =========================================================================
  // 1. Relational SQL Table Node
  // =========================================================================
  if (isSql) {
    const columns: any[] = node.data?.columns || [];
    if (columns.length === 0) {
      return { handleId: side, isFieldConnection: false };
    }

    let matchedCol: any = null;

    // A. Explicit column requested
    if (preferredColName) {
      const cleanTarget = preferredColName.toLowerCase().trim();
      matchedCol = columns.find((c: any) => {
        const cName = (c.name || "").toLowerCase().trim();
        const cId = (c.id || "").toLowerCase().trim();
        return (
          cName === cleanTarget ||
          cId === cleanTarget ||
          (cId.startsWith("col-") && cId.slice(4) === cleanTarget)
        );
      });
    }

    // B. Child node looking for Foreign Key column pointing to parent (otherNode)
    if (!matchedCol && role === "child" && otherNode) {
      const parentName = (
        otherNode.data?.name ||
        otherNode.data?.tableName ||
        otherNode.data?.label ||
        otherNode.id ||
        ""
      )
        .toLowerCase()
        .trim();
      const parentNorm = normalizeEntityName(parentName);

      // 1. Check columns that have an explicit "references" definition
      matchedCol = columns.find((c: any) => {
        const ref = (c.references || c.referencesTable || c.fkTarget || "")
          .toLowerCase()
          .trim();
        if (!ref) return false;
        return (
          ref === parentName ||
          ref === parentNorm ||
          ref.startsWith(`${parentName}(`) ||
          ref.startsWith(`${parentNorm}(`) ||
          ref.startsWith(`${parentName}.`) ||
          ref.startsWith(`${parentNorm}.`) ||
          isEntityNameMatch(ref, parentName)
        );
      });

      // 2. Check columns marked as FK where column name matches parent entity
      if (!matchedCol) {
        matchedCol = columns.find((c: any) => {
          if (!c.isFk && !c.isForeignKey) return false;
          const cName = (c.name || "").toLowerCase().trim();
          return (
            cName === `${parentNorm}_id` ||
            cName === `${parentName}_id` ||
            cName === `${parentNorm}id` ||
            cName.includes(parentNorm) ||
            isEntityNameMatch(cName, parentName)
          );
        });
      }

      // 3. Check any column name ending in _id or Id that matches parent entity
      if (!matchedCol) {
        matchedCol = columns.find((c: any) => {
          const cName = (c.name || "").toLowerCase().trim();
          if (c.isPk || c.isPrimaryKey || cName === "id" || cName === "_id") return false;
          return (
            cName === `${parentNorm}_id` ||
            cName === `${parentName}_id` ||
            cName === `${parentNorm}id` ||
            (cName.endsWith("_id") && cName.includes(parentNorm)) ||
            (cName.endsWith("id") && cName.includes(parentNorm)) ||
            isEntityNameMatch(cName, parentName)
          );
        });
      }

      // 4. Fallback to any column marked as FK
      if (!matchedCol) {
        matchedCol = columns.find((c: any) => c.isFk || c.isForeignKey);
      }
    }

    // C. Parent node looking for Primary Key (PK) column
    if (!matchedCol && role === "parent") {
      matchedCol = columns.find((c: any) => c.isPk || c.isPrimaryKey);

      if (!matchedCol) {
        matchedCol = columns.find((c: any) => {
          const cName = (c.name || "").toLowerCase().trim();
          return cName === "id" || cName === "_id" || cName === "uuid";
        });
      }

      // If otherNode (child) had a foreign key like "user_id", check if parent has "user_id"
      if (!matchedCol && otherNode) {
        const childCols: any[] = otherNode.data?.columns || [];
        const fkCol = childCols.find((c: any) => c.isFk || c.isForeignKey);
        if (fkCol) {
          const fkName = (fkCol.name || "").toLowerCase();
          matchedCol = columns.find((c: any) => (c.name || "").toLowerCase() === fkName);
        }
      }

      // Final fallback to first column
      if (!matchedCol && columns.length > 0) {
        matchedCol = columns[0];
      }
    }

    // Build handle ID exactly matching SqlTableNode.tsx:
    // const colHandleKey = col.id || col.name || `col-${idx}`;
    // Handle ID: `col-${colHandleKey}-${side}`
    if (matchedCol) {
      const colIdx = columns.indexOf(matchedCol);
      const colHandleKey = matchedCol.id || matchedCol.name || `col-${colIdx}`;
      return {
        handleId: `col-${colHandleKey}-${side}`,
        colName: matchedCol.name,
        isFieldConnection: true,
      };
    }
  }

  // =========================================================================
  // 2. NoSQL Collection Node
  // =========================================================================
  if (isNoSqlCollection) {
    const fields: any[] = node.data?.fields || [];
    if (fields.length === 0) {
      return { handleId: side, isFieldConnection: false };
    }

    let matchedField: any = null;

    if (preferredColName) {
      const cleanTarget = preferredColName.toLowerCase().trim();
      matchedField = fields.find(
        (f: any) => (f.name || "").toLowerCase().trim() === cleanTarget
      );
    }

    if (!matchedField && role === "child" && otherNode) {
      const parentName = (
        otherNode.data?.name ||
        otherNode.data?.label ||
        otherNode.id ||
        ""
      )
        .toLowerCase()
        .trim();
      const parentNorm = normalizeEntityName(parentName);

      matchedField = fields.find((f: any) => {
        const fName = (f.name || "").toLowerCase().trim();
        if (fName === "_id" || fName === "id") return false;
        return (
          fName === `${parentNorm}_id` ||
          fName === `${parentName}_id` ||
          fName === `${parentNorm}id` ||
          (fName.endsWith("_id") && fName.includes(parentNorm)) ||
          (fName.endsWith("id") && fName.includes(parentNorm)) ||
          isEntityNameMatch(fName, parentName)
        );
      });
    }

    if (!matchedField && role === "parent") {
      matchedField = fields.find((f: any) => {
        const fName = (f.name || "").toLowerCase().trim();
        return fName === "_id" || fName === "id";
      });
      if (!matchedField) {
        matchedField = fields.find((f: any) => f.required);
      }
      if (!matchedField && fields.length > 0) {
        matchedField = fields[0];
      }
    }

    // Build handle ID exactly matching NosqlCollectionNode.tsx:
    // const fieldKey = f.name || `field-${idx}`;
    // Handle ID: `field-${fieldKey}-${side}`
    if (matchedField) {
      const fieldIdx = fields.indexOf(matchedField);
      const fieldKey = matchedField.name || `field-${fieldIdx}`;
      return {
        handleId: `field-${fieldKey}-${side}`,
        colName: matchedField.name,
        isFieldConnection: true,
      };
    }
  }

  // =========================================================================
  // 3. NoSQL Embedded Node
  // =========================================================================
  if (isNoSqlEmbedded) {
    const fields: any[] = node.data?.fields || [];
    if (fields.length === 0) {
      return { handleId: side, isFieldConnection: false };
    }

    let matchedField: any = null;
    if (preferredColName) {
      const cleanTarget = preferredColName.toLowerCase().trim();
      matchedField = fields.find(
        (f: any) => (f.name || "").toLowerCase().trim() === cleanTarget
      );
    }
    if (!matchedField && fields.length > 0) {
      matchedField = fields[0];
    }

    // Build handle ID exactly matching NosqlEmbeddedNode.tsx:
    // const fieldKey = f.name || `embed-${idx}`;
    // Handle ID: `embed-field-${fieldKey}-${side}`
    if (matchedField) {
      const fieldIdx = fields.indexOf(matchedField);
      const fieldKey = matchedField.name || `embed-${fieldIdx}`;
      return {
        handleId: `embed-field-${fieldKey}-${side}`,
        colName: matchedField.name,
        isFieldConnection: true,
      };
    }
  }

  // Fallback to node-level handle (header dot)
  return { handleId: side, isFieldConnection: false };
}

/**
 * Checks if a handle string represents a field-level handle (rather than node header fallback).
 */
export function isFieldHandle(handleId?: string | null): boolean {
  if (!handleId || typeof handleId !== "string") return false;
  return (
    handleId.startsWith("col-") ||
    handleId.startsWith("field-") ||
    handleId.startsWith("embed-field-")
  );
}
