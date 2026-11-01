import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
    UserTable: defineTable({
        name: v.string(),
        email: v.string(),
        imageUrl: v.string(),
        subscription: v.optional(v.string()),
        token: v.number(),
        role: v.optional(v.string()), // "user" | "admin"
    })
        .index("by_email", ["email"])
        .index("by_role", ["role"]),

    AgentTable: defineTable({
        agentId: v.string(),
        name: v.string(),
        schemaType: v.optional(v.string()),
        config: v.optional(v.any()),
        published: v.boolean(),
        nodes: v.optional(v.any()),
        edges: v.optional(v.any()),
        agentToolConfig: v.optional(v.any()),
        userId: v.id("UserTable"),
    }),

    ChatTable: defineTable({
        agentId: v.id("AgentTable"),
        role: v.string(),
        content: v.string(),
        sessionId: v.string(),
        createdAt: v.number()
    }),

    FeedbackTable: defineTable({
        userId: v.optional(v.id("UserTable")),
        userEmail: v.string(),
        userName: v.string(),
        userTier: v.string(), // "free" | "pro" | "ai"
        type: v.string(), // "bug" | "feature_request" | "ui_ux" | "performance" | "general" | "praise"
        rating: v.number(), // 1 - 5 stars
        title: v.optional(v.string()),
        message: v.string(),
        status: v.string(), // "new" | "in_review" | "resolved" | "archived"
        createdAt: v.number(),
    })
        .index("by_status", ["status"])
        .index("by_type", ["type"])
        .index("by_userTier", ["userTier"])
        .index("by_createdAt", ["createdAt"]),
})
