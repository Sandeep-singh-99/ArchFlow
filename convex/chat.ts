import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const SaveMessage = mutation({
  args: {
    agentId: v.id("AgentTable"),
    role: v.string(),
    content: v.string(),
    sessionId: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("ChatTable", {
      agentId: args.agentId,
      role: args.role,
      content: args.content,
      sessionId: args.sessionId,
      createdAt: args.createdAt,
    });
  },
});

export const GetMessages = query({
  args: {
    agentId: v.id("AgentTable"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("ChatTable")
      .withIndex("by_agentId_sessionId", (q) =>
        q.eq("agentId", args.agentId).eq("sessionId", args.sessionId)
      )
      .collect();

    return messages.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const ClearChat = mutation({
  args: {
    agentId: v.id("AgentTable"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("ChatTable")
      .withIndex("by_agentId_sessionId", (q) =>
        q.eq("agentId", args.agentId).eq("sessionId", args.sessionId)
      )
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
  },
});
