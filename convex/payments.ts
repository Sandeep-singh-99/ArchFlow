import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const RecordSuccessfulPayment = mutation({
  args: {
    userEmail: v.string(),
    planId: v.optional(v.id("PlanTable")),
    planName: v.string(),
    planCode: v.string(),
    billingCycle: v.string(), // "monthly" | "yearly"
    amount: v.number(),
    currency: v.string(),
    razorpayOrderId: v.string(),
    razorpayPaymentId: v.string(),
    razorpaySignature: v.string(),
    validityDays: v.number(),
    tokenQuota: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Fetch user by email
    const user = await ctx.db
      .query("UserTable")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
      .first();

    if (!user) {
      throw new Error(`User with email ${args.userEmail} not found`);
    }

    const validFrom = Date.now();
    const durationDays =
      args.billingCycle === "yearly" ? 365 : Math.max(1, args.validityDays || 30);
    const validUntil = validFrom + durationDays * 24 * 60 * 60 * 1000;

    // 2. Insert payment record
    const paymentId = await ctx.db.insert("PaymentTable", {
      userId: user._id,
      userEmail: args.userEmail,
      planId: args.planId,
      planName: args.planName,
      planCode: args.planCode,
      billingCycle: args.billingCycle,
      amount: args.amount,
      currency: args.currency,
      razorpayOrderId: args.razorpayOrderId,
      razorpayPaymentId: args.razorpayPaymentId,
      razorpaySignature: args.razorpaySignature,
      status: "success",
      validFrom,
      validUntil,
      createdAt: validFrom,
    });

    // 3. Update User subscription & tokens
    const tokens =
      args.tokenQuota !== undefined
        ? args.tokenQuota
        : args.planCode === "ai"
          ? 999999
          : args.planCode === "pro"
            ? 50000
            : 5000;

    await ctx.db.patch(user._id, {
      subscription: args.planCode,
      subscriptionPlanId: args.planId ? String(args.planId) : undefined,
      subscriptionBillingCycle: args.billingCycle,
      subscriptionExpiresAt: validUntil,
      lastPaymentId: args.razorpayPaymentId,
      token: tokens,
    });

    return {
      success: true,
      paymentId,
      subscription: args.planCode,
      validUntil,
    };
  },
});

export const GetAllPayments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("PaymentTable")
      .withIndex("by_createdAt")
      .order("desc")
      .take(100);
  },
});

export const GetUserPayments = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("PaymentTable")
      .withIndex("by_userEmail", (q) => q.eq("userEmail", args.email))
      .order("desc")
      .collect();
  },
});
