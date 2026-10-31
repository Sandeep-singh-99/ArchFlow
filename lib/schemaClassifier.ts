import { Agent, SchemaProjectType } from "@/types/AgentTypes";

/**
 * Determines whether a schema project is SQL (Relational) or NoSQL (Document).
 * Checks the explicit schemaType first, then falls back to inspecting node types
 * so existing/legacy schemas are seamlessly classified.
 */
export function getSchemaType(agent: Partial<Agent> | null | undefined): SchemaProjectType {
  if (!agent) return "sql";

  const explicitType = (agent.schemaType || agent.config?.schemaType || "").toLowerCase();
  if (explicitType === "nosql") return "nosql";
  if (explicitType === "sql") return "sql";

  // Heuristic based on nodes in the project
  const nodes = Array.isArray(agent.nodes) ? agent.nodes : [];
  const hasNosqlNodes = nodes.some((node: Record<string, unknown>) => {
    const type = ((node?.type as string) || "").toLowerCase();
    return (
      type.includes("nosql") ||
      type === "collection" ||
      type === "subdocument" ||
      type === "embedded"
    );
  });

  if (hasNosqlNodes) return "nosql";

  return "sql";
}

export function isNosqlSchema(agent: Partial<Agent> | null | undefined): boolean {
  return getSchemaType(agent) === "nosql";
}

export function isSqlSchema(agent: Partial<Agent> | null | undefined): boolean {
  return getSchemaType(agent) === "sql";
}
