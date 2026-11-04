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
        subscriptionPlanId: v.optional(v.string()),
        subscriptionBillingCycle: v.optional(v.string()), // "monthly" | "yearly"
        subscriptionExpiresAt: v.optional(v.number()),
        lastPaymentId: v.optional(v.string()),
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

    PlanTable: defineTable({
        name: v.string(),
        planCode: v.string(), // "free" | "pro" | "ai" | custom string
        description: v.string(),
        monthlyPrice: v.number(),
        yearlyPrice: v.number(),
        currency: v.string(), // "INR", "USD", etc.
        validityDays: v.number(), // e.g. 30 (monthly) / 365 (yearly)
        expiryDate: v.optional(v.string()), // Optional specific campaign expiry date string (YYYY-MM-DD)
        features: v.array(v.string()),
        badge: v.optional(v.string()), // "POPULAR", "BEST VALUE", etc.
        tokenQuota: v.number(),
        projectQuota: v.number(),
        isActive: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.optional(v.number()),
    })
        .index("by_isActive", ["isActive"])
        .index("by_planCode", ["planCode"])
        .index("by_createdAt", ["createdAt"]),

    PaymentTable: defineTable({
        userId: v.id("UserTable"),
        userEmail: v.string(),
        planId: v.optional(v.id("PlanTable")),
        planName: v.string(),
        planCode: v.string(),
        billingCycle: v.string(), // "monthly" | "yearly"
        amount: v.number(), // In base currency (e.g., 799 INR)
        currency: v.string(),
        razorpayOrderId: v.string(),
        razorpayPaymentId: v.string(),
        razorpaySignature: v.string(),
        status: v.string(), // "success" | "failed" | "pending"
        validFrom: v.number(),
        validUntil: v.number(),
        createdAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_userEmail", ["userEmail"])
        .index("by_razorpayOrderId", ["razorpayOrderId"])
        .index("by_status", ["status"])
        .index("by_createdAt", ["createdAt"]),
})
