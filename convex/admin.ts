import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// =========================================================================
// Overview & Platform Metrics
// =========================================================================

export const GetAdminOverviewMetrics = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("UserTable").collect();
    const agents = await ctx.db.query("AgentTable").collect();
    const feedbacks = await ctx.db.query("FeedbackTable").collect();

    // 1. User Stats
    const totalUsers = users.length;
    const adminCount = users.filter((u) => u.role === "admin").length;
    const userCount = totalUsers - adminCount;

    // 2. Subscription & Earnings Stats
    // Plan pricing: Pro = $19/mo, AI Unlimited = $49/mo
    let proCount = 0;
    let aiCount = 0;
    let freeCount = 0;

    users.forEach((u) => {
      const sub = (u.subscription || "").toLowerCase();
      if (sub === "ai" || sub === "ai_unlimited") {
        aiCount++;
      } else if (sub === "active" || sub === "pro") {
        proCount++;
      } else {
        freeCount++;
      }
    });

    const mrr = proCount * 19 + aiCount * 49;
    const arr = mrr * 12;
    const paidUsers = proCount + aiCount;
    const conversionRate = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : "0.0";

    // 3. Schema Stats
    const totalSchemas = agents.length;
    const sqlSchemas = agents.filter((a) => a.schemaType !== "nosql").length;
    const nosqlSchemas = agents.filter((a) => a.schemaType === "nosql").length;

    // 4. Feedback Stats
    const totalFeedback = feedbacks.length;
    const newFeedbackCount = feedbacks.filter((f) => f.status === "new").length;
    const inReviewFeedbackCount = feedbacks.filter((f) => f.status === "in_review").length;
    const resolvedFeedbackCount = feedbacks.filter((f) => f.status === "resolved").length;

    const avgRating =
      totalFeedback > 0
        ? (feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / totalFeedback).toFixed(1)
        : "5.0";

    // 5. Recent 5 Users & Recent 5 Schemas
    const recentUsers = [...users]
      .reverse()
      .slice(0, 5)
      .map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        imageUrl: u.imageUrl,
        role: u.role || "user",
        subscription: u.subscription || "free",
        token: u.token,
      }));

    const recentSchemas = [...agents]
      .reverse()
      .slice(0, 5)
      .map((a) => ({
        id: a._id,
        name: a.name,
        schemaType: a.schemaType || "sql",
        tableCount: Array.isArray(a.nodes) ? a.nodes.length : 0,
        published: a.published,
      }));

    return {
      users: {
        total: totalUsers,
        adminCount,
        userCount,
        freeCount,
        proCount,
        aiCount,
        paidCount: paidUsers,
        conversionRate,
      },
      earnings: {
        mrr,
        arr,
        proRevenue: proCount * 19,
        aiRevenue: aiCount * 49,
      },
      schemas: {
        total: totalSchemas,
        sql: sqlSchemas,
        nosql: nosqlSchemas,
      },
      feedback: {
        total: totalFeedback,
        newCount: newFeedbackCount,
        inReviewCount: inReviewFeedbackCount,
        resolvedCount: resolvedFeedbackCount,
        avgRating,
      },
      recentUsers,
      recentSchemas,
    };
  },
});

// =========================================================================
// User Management
// =========================================================================

export const GetAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("UserTable").collect();
    const agents = await ctx.db.query("AgentTable").collect();

    // Group agents by userId
    const agentCountByUser = new Map<string, number>();
    agents.forEach((a) => {
      if (a.userId) {
        const idStr = String(a.userId);
        agentCountByUser.set(idStr, (agentCountByUser.get(idStr) || 0) + 1);
      }
    });

    return users.map((u) => {
      const sub = (u.subscription || "").toLowerCase();
      let plan = "Free Tier";
      if (sub === "ai" || sub === "ai_unlimited") plan = "AI Unlimited";
      else if (sub === "active" || sub === "pro") plan = "Pro Architect";

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        imageUrl: u.imageUrl,
        role: u.role || "user",
        subscription: u.subscription || "free",
        planLabel: plan,
        token: u.token,
        schemaCount: agentCountByUser.get(String(u._id)) || 0,
        _creationTime: u._creationTime,
      };
    });
  },
});

export const UpdateUserRole = mutation({
  args: {
    userId: v.id("UserTable"),
    role: v.string(), // "admin" | "user"
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
    });

    return { success: true, userId: args.userId, role: args.role };
  },
});

export const AdjustUserTokens = mutation({
  args: {
    userId: v.id("UserTable"),
    tokens: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      token: args.tokens,
    });

    return { success: true, tokens: args.tokens };
  },
});

// =========================================================================
// Platform Analytics
// =========================================================================

export const GetPlatformAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("UserTable").collect();
    const agents = await ctx.db.query("AgentTable").collect();
    const feedbacks = await ctx.db.query("FeedbackTable").collect();

    // Analyze nodes and edge density
    let totalNodes = 0;
    let totalEdges = 0;
    let totalSqlTables = 0;
    let totalNoSqlCollections = 0;

    agents.forEach((a) => {
      const nodes = Array.isArray(a.nodes) ? a.nodes : [];
      const edges = Array.isArray(a.edges) ? a.edges : [];
      totalNodes += nodes.length;
      totalEdges += edges.length;

      nodes.forEach((n: any) => {
        if (n.type === "SqlTableNode" || n.type === "Table") totalSqlTables++;
        if (n.type === "NosqlCollectionNode" || n.type === "Collection") totalNoSqlCollections++;
      });
    });

    const avgNodesPerSchema = agents.length > 0 ? (totalNodes / agents.length).toFixed(1) : "0";
    const avgEdgesPerSchema = agents.length > 0 ? (totalEdges / agents.length).toFixed(1) : "0";

    return {
      totalUsers: users.length,
      totalSchemas: agents.length,
      sqlSchemas: agents.filter((a) => a.schemaType !== "nosql").length,
      nosqlSchemas: agents.filter((a) => a.schemaType === "nosql").length,
      totalNodes,
      totalEdges,
      totalSqlTables,
      totalNoSqlCollections,
      avgNodesPerSchema,
      avgEdgesPerSchema,
      totalFeedbacks: feedbacks.length,
    };
  },
});

// =========================================================================
// User Feedback Loop
// =========================================================================

export const SubmitFeedback = mutation({
  args: {
    userId: v.optional(v.id("UserTable")),
    userEmail: v.string(),
    userName: v.string(),
    userTier: v.string(), // "free" | "pro" | "ai"
    type: v.string(), // "bug" | "feature_request" | "ui_ux" | "performance" | "general" | "praise"
    rating: v.number(), // 1 to 5
    title: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const feedbackId = await ctx.db.insert("FeedbackTable", {
      userId: args.userId,
      userEmail: args.userEmail,
      userName: args.userName,
      userTier: args.userTier,
      type: args.type,
      rating: args.rating,
      title: args.title || "",
      message: args.message,
      status: "new",
      createdAt: Date.now(),
    });

    return { success: true, feedbackId };
  },
});

export const GetAllFeedback = query({
  args: {
    statusFilter: v.optional(v.string()),
    typeFilter: v.optional(v.string()),
    tierFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let list = await ctx.db.query("FeedbackTable").collect();

    // Sort descending by created time
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (args.statusFilter && args.statusFilter !== "all") {
      list = list.filter((f) => f.status === args.statusFilter);
    }

    if (args.typeFilter && args.typeFilter !== "all") {
      list = list.filter((f) => f.type === args.typeFilter);
    }

    if (args.tierFilter && args.tierFilter !== "all") {
      list = list.filter((f) => f.userTier === args.tierFilter);
    }

    return list;
  },
});

export const UpdateFeedbackStatus = mutation({
  args: {
    feedbackId: v.id("FeedbackTable"),
    status: v.string(), // "new" | "in_review" | "resolved" | "archived"
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.feedbackId, {
      status: args.status,
    });
    return { success: true, feedbackId: args.feedbackId, status: args.status };
  },
});

export const DeleteFeedback = mutation({
  args: {
    feedbackId: v.id("FeedbackTable"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.feedbackId);
    return { success: true };
  },
});
