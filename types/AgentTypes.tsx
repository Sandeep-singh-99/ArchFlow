import { Id } from "@/convex/_generated/dataModel";

export type SchemaProjectType = "sql" | "nosql";

export type Agent = {
    _id: Id<"AgentTable">;
    agentId: string;
    name: string;
    schemaType?: "sql" | "nosql" | string;
    config?: any;
    published: boolean;
    userId: Id<"UserTable">;
    nodes?: any;
    edges?: any;
    agentToolConfig?: any;
    _creationTime: number;
};

// Aliases for Database Schema Studio
export type DatabaseSchema = Agent;
export type DatabaseProject = Agent;
