import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const CreateAgent = mutation({
  args: {
    name: v.string(),
    agentId: v.string(),
    userId: v.id("UserTable"),
    nodes: v.optional(v.any()),
    edges: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db.insert("AgentTable", {
      name: args.name,
      agentId: args.agentId,
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

export const DeleteAgent = mutation({
  args: {
    agentId: v.id("AgentTable"),
  },

  handler: async (ctx, args) => {
    await ctx.db.delete(args.agentId);
  },
});
