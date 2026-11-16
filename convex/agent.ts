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
    // 1. Enforce Subscription Project Quota
    const user = await ctx.db.get(args.userId);
    if (user) {
      const isSubActive =
        user.subscriptionExpiresAt === undefined ||
        user.subscriptionExpiresAt > Date.now();
      const sub = isSubActive ? (user.subscription || "free").toLowerCase() : "free";

      let maxQuota = 1;
      if (sub === "ai" || sub === "ai_unlimited" || sub.includes("ai")) {
        maxQuota = 9999;
      } else if (sub === "pro" || sub === "active" || sub.includes("pro")) {
        maxQuota = 15;
      }

      const existingAgents = await ctx.db
        .query("AgentTable")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();

      if (existingAgents.length >= maxQuota) {
        throw new Error(
          `Project limit reached (${existingAgents.length}/${maxQuota}) for your ${
            sub === "pro" || sub === "active" ? "Pro" : "Free"
          } plan. Please upgrade to unlock more database project slots.`
        );
      }
    }

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
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    return results;
  },
});

export const GetUserAgentsList = query({
  args: {
    userId: v.id("UserTable"),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("AgentTable")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return results.map((agent) => ({
      _id: agent._id,
      _creationTime: agent._creationTime,
      agentId: agent.agentId,
      name: agent.name,
      schemaType: agent.schemaType,
      published: agent.published,
      userId: agent.userId,
    }));
  },
});

export const GetAgentById = query({
  args: {
    agentId: v.string(),
  },

  handler: async (ctx, args) => {
    return await ctx.db
      .query("AgentTable")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
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

    // Enforce Subscription Project Quota on duplicate
    const user = await ctx.db.get(args.userId);
    if (user) {
      const isSubActive =
        user.subscriptionExpiresAt === undefined ||
        user.subscriptionExpiresAt > Date.now();
      const sub = isSubActive ? (user.subscription || "free").toLowerCase() : "free";

      let maxQuota = 1;
      if (sub === "ai" || sub === "ai_unlimited" || sub.includes("ai")) {
        maxQuota = 9999;
      } else if (sub === "pro" || sub === "active" || sub.includes("pro")) {
        maxQuota = 15;
      }

      const existingAgents = await ctx.db
        .query("AgentTable")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();

      if (existingAgents.length >= maxQuota) {
        throw new Error(
          `Project limit reached (${existingAgents.length}/${maxQuota}) for your ${
            sub === "pro" || sub === "active" ? "Pro" : "Free"
          } plan. Please upgrade to unlock more database project slots.`
        );
      }
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
    // Delete all associated chat records for this agent to prevent orphaned rows
    const chatMessages = await ctx.db
      .query("ChatTable")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .collect();

    for (const msg of chatMessages) {
      await ctx.db.delete(msg._id);
    }

    await ctx.db.delete(args.agentId);
  },
});
