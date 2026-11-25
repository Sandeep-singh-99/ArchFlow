import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAdmin } from "./adminAuth";
import { Id } from "./_generated/dataModel";

export const GetAllPlans = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("PlanTable")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

export const GetActivePlans = query({
  args: {},
  handler: async (ctx) => {
    const plans = await ctx.db
      .query("PlanTable")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    // Sort by monthlyPrice ascending (Free -> Pro -> AI)
    return plans.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
  },
});

export const GetPlanByIdOrCode = query({
  args: {
    planId: v.optional(v.string()),
    planCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.planId) {
      try {
        const plan = await ctx.db.get(args.planId as Id<"PlanTable">);
        if (plan && plan.isActive) return plan;
      } catch {
        // Not a valid Convex Id string, fall through to planCode
      }
    }
    if (args.planCode) {
      const code = args.planCode.trim().toLowerCase();
      const plan = await ctx.db
        .query("PlanTable")
        .withIndex("by_planCode", (q) => q.eq("planCode", code))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
      if (plan) return plan;
    }
    return null;
  },
});

export const CreatePlan = mutation({
  args: {
    name: v.string(),
    planCode: v.string(),
    description: v.string(),
    monthlyPrice: v.number(),
    yearlyPrice: v.number(),
    originalMonthlyPrice: v.optional(v.number()),
    originalYearlyPrice: v.optional(v.number()),
    discountPercent: v.optional(v.number()),
    currency: v.string(),
    validityDays: v.number(),
    expiryDate: v.optional(v.string()),
    features: v.array(v.string()),
    badge: v.optional(v.string()),
    tokenQuota: v.number(),
    projectQuota: v.number(),
    isActive: v.boolean(),
    adminUserId: v.optional(v.id("UserTable")),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminUserId);

    const planId = await ctx.db.insert("PlanTable", {
      name: args.name.trim(),
      planCode: args.planCode.trim().toLowerCase(),
      description: args.description.trim(),
      monthlyPrice: Number(args.monthlyPrice),
      yearlyPrice: Number(args.yearlyPrice),
      originalMonthlyPrice: args.originalMonthlyPrice ? Number(args.originalMonthlyPrice) : undefined,
      originalYearlyPrice: args.originalYearlyPrice ? Number(args.originalYearlyPrice) : undefined,
      discountPercent: args.discountPercent ? Number(args.discountPercent) : undefined,
      currency: args.currency.toUpperCase() || "INR",
      validityDays: Number(args.validityDays) || 30,
      expiryDate: args.expiryDate || undefined,
      features: args.features.filter((f) => f.trim().length > 0),
      badge: args.badge?.trim() || undefined,
      tokenQuota: Number(args.tokenQuota) || 5000,
      projectQuota: Number(args.projectQuota) || 1,
      isActive: args.isActive,
      createdAt: Date.now(),
    });

    return { success: true, planId };
  },
});

export const UpdatePlan = mutation({
  args: {
    id: v.id("PlanTable"),
    name: v.string(),
    planCode: v.string(),
    description: v.string(),
    monthlyPrice: v.number(),
    yearlyPrice: v.number(),
    originalMonthlyPrice: v.optional(v.number()),
    originalYearlyPrice: v.optional(v.number()),
    discountPercent: v.optional(v.number()),
    currency: v.string(),
    validityDays: v.number(),
    expiryDate: v.optional(v.string()),
    features: v.array(v.string()),
    badge: v.optional(v.string()),
    tokenQuota: v.number(),
    projectQuota: v.number(),
    isActive: v.boolean(),
    adminUserId: v.optional(v.id("UserTable")),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminUserId);

    const plan = await ctx.db.get(args.id);
    if (!plan) {
      throw new Error("Plan not found");
    }

    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      planCode: args.planCode.trim().toLowerCase(),
      description: args.description.trim(),
      monthlyPrice: Number(args.monthlyPrice),
      yearlyPrice: Number(args.yearlyPrice),
      originalMonthlyPrice: args.originalMonthlyPrice ? Number(args.originalMonthlyPrice) : undefined,
      originalYearlyPrice: args.originalYearlyPrice ? Number(args.originalYearlyPrice) : undefined,
      discountPercent: args.discountPercent ? Number(args.discountPercent) : undefined,
      currency: args.currency.toUpperCase() || "INR",
      validityDays: Number(args.validityDays) || 30,
      expiryDate: args.expiryDate || undefined,
      features: args.features.filter((f) => f.trim().length > 0),
      badge: args.badge?.trim() || undefined,
      tokenQuota: Number(args.tokenQuota) || 5000,
      projectQuota: Number(args.projectQuota) || 1,
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const TogglePlanStatus = mutation({
  args: {
    id: v.id("PlanTable"),
    adminUserId: v.optional(v.id("UserTable")),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminUserId);

    const plan = await ctx.db.get(args.id);
    if (!plan) {
      throw new Error("Plan not found");
    }

    await ctx.db.patch(args.id, {
      isActive: !plan.isActive,
      updatedAt: Date.now(),
    });

    return { success: true, isActive: !plan.isActive };
  },
});

export const DeletePlan = mutation({
  args: {
    id: v.id("PlanTable"),
    adminUserId: v.optional(v.id("UserTable")),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminUserId);

    const plan = await ctx.db.get(args.id);
    if (!plan) {
      throw new Error("Plan not found");
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const SeedDefaultPlans = mutation({
  args: {
    forceReset: v.optional(v.boolean()),
    adminUserId: v.optional(v.id("UserTable")),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminUserId);

    const existing = await ctx.db.query("PlanTable").collect();
    if (existing.length > 0 && !args.forceReset) {
      // Sync existing default plans to canonical comparison-table features only
      for (const plan of existing) {
        if (plan.planCode === "free") {
          await ctx.db.patch(plan._id, {
            name: "Hobbyist Free",
            projectQuota: 1,
            features: [
              "React Flow Visual Canvas",
              "Export SQL & NoSQL DDL",
            ],
            updatedAt: Date.now(),
          });
        } else if (plan.planCode === "pro") {
          await ctx.db.patch(plan._id, {
            name: "Pro Architect",
            projectQuota: 15,
            features: [
              "React Flow Visual Canvas",
              "Export SQL & NoSQL DDL",
              "Multi-Domain Grouping",
              "CASCADE Drop Simulator",
              "Import & Export Mermaid",
              "Share Architecture Preview",
            ],
            updatedAt: Date.now(),
          });
        } else if (plan.planCode === "ai") {
          await ctx.db.patch(plan._id, {
            name: "AI Architect Pro",
            projectQuota: 9999,
            features: [
              "React Flow Visual Canvas",
              "Export SQL & NoSQL DDL",
              "Multi-Domain Grouping",
              "CASCADE Drop Simulator",
              "Import & Export Mermaid",
              "Share Architecture Preview",
              "AI Auto-Connect & Cardinality",
            ],
            updatedAt: Date.now(),
          });
        }
      }
      return { success: true, message: "Existing plans synced to comparison-table features" };
    }

    if (args.forceReset && existing.length > 0) {
      for (const plan of existing) {
        await ctx.db.delete(plan._id);
      }
    }

    const defaultPlans = [
      {
        name: "Hobbyist Free",
        planCode: "free",
        description: "For solo developers prototyping their first database architecture.",
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: "INR",
        validityDays: 365,
        features: [
          "React Flow Visual Canvas",
          "Export SQL & NoSQL DDL",
        ],
        tokenQuota: 5000,
        projectQuota: 1,
        isActive: true,
        createdAt: Date.now() - 3000,
      },
      {
        name: "Pro Architect",
        planCode: "pro",
        description: "For power architects managing multi-domain schemas and team collaboration.",
        monthlyPrice: 1499,
        yearlyPrice: 14999,
        currency: "INR",
        validityDays: 30,
        badge: "POPULAR",
        features: [
          "React Flow Visual Canvas",
          "Export SQL & NoSQL DDL",
          "Multi-Domain Grouping",
          "CASCADE Drop Simulator",
          "Import & Export Mermaid",
          "Share Architecture Preview",
        ],
        tokenQuota: 50000,
        projectQuota: 15,
        isActive: true,
        createdAt: Date.now() - 2000,
      },
      {
        name: "AI Architect Pro",
        planCode: "ai",
        description: "Unlimited schema projects, multi-domain containers, and architecture sharing.",
        monthlyPrice: 3999,
        yearlyPrice: 39999,
        currency: "INR",
        validityDays: 30,
        badge: "ULTIMATE",
        features: [
          "React Flow Visual Canvas",
          "Export SQL & NoSQL DDL",
          "Multi-Domain Grouping",
          "CASCADE Drop Simulator",
          "Import & Export Mermaid",
          "Share Architecture Preview",
          "AI Auto-Connect & Cardinality",
        ],
        tokenQuota: 999999,
        projectQuota: 9999,
        isActive: true,
        createdAt: Date.now() - 1000,
      },
    ];

    for (const plan of defaultPlans) {
      await ctx.db.insert("PlanTable", plan);
    }

    return { success: true, count: defaultPlans.length };
  },
});
