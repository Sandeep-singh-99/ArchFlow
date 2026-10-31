import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
    UserTable: defineTable({
        name: v.string(),
        email: v.string(),
        imageUrl: v.string(),
        subscription: v.optional(v.string()),
        token: v.number()
    }),

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
    })
})
