import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const CreateAgent = mutation({
  args: {
    name: v.string(),
    agentId: v.string(),
    userId: v.id("UserTable"),
    schemaType: v.optional(v.string()),
    nodes: v.optional(v.any()),
    edges: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const chosenType = args.schemaType ?? "sql";
    const results = await ctx.db.insert("AgentTable", {
      name: args.name,
      agentId: args.agentId,
      schemaType: chosenType,
      config: { schemaType: chosenType },
      published: false,
      userId: args.userId,
      nodes: args.nodes ?? [],
      edges: args.edges ?? [],
    });
    return results;
  },
});

export const GetUserAgents = query({
  args: {
    userId: v.id("UserTable"),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("AgentTable")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();
    return results;
  },
});

export const GetAgentById = query({
  args: {
    agentId: v.string(),
  },

  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("AgentTable")
      .filter((q) => q.eq(q.field("agentId"), args.agentId))
      .order("desc")
      .collect();

    return results[0];
  },
});

export const UpdateAgentDetail = mutation({
  args: {
    id: v.id("AgentTable"),
    nodes: v.any(),
    edges: v.any(),
  },

  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      edges: args.edges,
      nodes: args.nodes,
    });
  },
});

export const UpdateAgentToolConfig = mutation({
  args: {
    id: v.id("AgentTable"),
    agentToolConfig: v.any(),
  },

  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      agentToolConfig: args.agentToolConfig,
    });
  },
});

export const PublishAgent = mutation({
  args: {
    id: v.id("AgentTable"),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      published: args.published,
    });
  },
});

export const RenameAgent = mutation({
  args: {
    agentId: v.id("AgentTable"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmed = args.name.trim();
    if (!trimmed) {
      throw new Error("Project name cannot be empty");
    }
    await ctx.db.patch(args.agentId, {
      name: trimmed,
    });
  },
});

export const DuplicateAgent = mutation({
  args: {
    agentId: v.id("AgentTable"),
    userId: v.id("UserTable"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.agentId);
    if (!existing) {
      throw new Error("Database schema not found");
    }
    const newAgentId = crypto.randomUUID();
    return await ctx.db.insert("AgentTable", {
      name: `${existing.name} (Copy)`,
      agentId: newAgentId,
      schemaType: existing.schemaType ?? existing.config?.schemaType ?? "sql",
      config: existing.config ?? { schemaType: existing.schemaType ?? "sql" },
      published: false,
      userId: args.userId,
      nodes: existing.nodes ?? [],
      edges: existing.edges ?? [],
      agentToolConfig: existing.agentToolConfig,
    });
  },
});

export const DeleteAgent = mutation({
  args: {
    agentId: v.id("AgentTable"),
  },

  handler: async (ctx, args) => {
    await ctx.db.delete(args.agentId);
  },
});
