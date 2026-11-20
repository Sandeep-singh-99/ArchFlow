import { getActiveSubscription } from "../lib/subscription";
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
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Require server-side payment verification.
    const validSecrets = [
      process.env.CONVEX_SERVER_SECRET,
      process.env.RAZORPAY_KEY_SECRET,
      process.env.RAZORPAY_WEBHOOK_SECRET,
    ].filter(Boolean) as string[];

    if (validSecrets.length > 0) {
      const isAuthorizedServer = Boolean(
        args.serverSecret && validSecrets.includes(args.serverSecret)
      );

      if (!isAuthorizedServer) {
        throw new Error("Unauthorized: Subscription upgrades require verified server-side authorization.");
      }
    } else {
      // Fallback if secrets are not yet configured in the Convex deployment environment:
      // Require that the caller supplied a non-empty serverSecret from the server-side API route.
      if (!args.serverSecret || args.serverSecret.trim().length === 0) {
        throw new Error("Unauthorized: Subscription upgrades require verified server-side authorization.");
      }
      console.warn(
        "CONVEX_SERVER_SECRET is not configured in Convex deployment environment variables. " +
        "Run 'npx convex env set CONVEX_SERVER_SECRET <secret>' to enforce strict server authorization."
      );
    }

    // 2. Reject free tier upgrades through payment
    if (args.planCode.toLowerCase() === "free" || args.amount <= 0) {
      throw new Error("Invalid payment: Free tier does not require payment processing.");
    }

    // 4. Fetch user by email
    const user = await ctx.db
      .query("UserTable")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
      .first();

    if (!user) {
      throw new Error(`User with email ${args.userEmail} not found`);
    }

    // 3. Idempotency: Prevent duplicate payment recordings
    const existingPayment = await ctx.db
      .query("PaymentTable")
      .withIndex("by_razorpayOrderId", (q) => q.eq("razorpayOrderId", args.razorpayOrderId))
      .first();

    if (existingPayment && existingPayment.status === "success") {
      return {
        success: true,
        paymentId: existingPayment._id,
        subscription: user.subscription,
        billingCycle: user.subscriptionBillingCycle,
        validUntil: user.subscriptionExpiresAt,
        token: user.token,
        activated: user.lastPaymentId === existingPayment.razorpayPaymentId,
        isDuplicate: true,
      };
    }

    const validFrom = Date.now();
    const durationDays =
      args.billingCycle === "yearly" ? 365 : Math.max(1, args.validityDays || 30);
    const validUntil = validFrom + durationDays * 24 * 60 * 60 * 1000;

    // 5. Insert payment record
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

    // Keep the active plan if a previously opened checkout is paid later.
    if (getActiveSubscription(user, validFrom) !== "free") {
      return { success: true, paymentId, activated: false };
    }

    // 6. Update User subscription & tokens
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
      billingCycle: args.billingCycle,
      token: tokens,
      activated: true,
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
