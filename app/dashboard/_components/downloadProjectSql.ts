import type { ConvexReactClient } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { exportSqlDdl } from "@/lib/sqlDdlExporter";
import type { DashboardProject } from "@/app/dashboard/_components/MyAgents";

export async function downloadProjectSql(
  convex: ConvexReactClient,
  project: DashboardProject,
  dialect: "postgresql" | "mysql",
) {
  try {
    const agent = await convex.query(api.agent.GetAgentById, { agentId: project.agentId });
    if (!agent || agent._id !== project._id) throw new Error("Schema not found");

    const nodes = Array.isArray(agent.nodes) ? agent.nodes : [];
    const edges = Array.isArray(agent.edges) ? agent.edges : [];
    const ddl = exportSqlDdl(nodes, edges, { dialect });
    const url = URL.createObjectURL(new Blob([ddl], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(agent.name || "schema").toLowerCase().replace(/[^a-z0-9_-]+/g, "_")}_${dialect}.sql`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${dialect.toUpperCase()} DDL!`);
  } catch (error) {
    console.error(error);
    toast.error("Failed to export SQL DDL");
  }
}
