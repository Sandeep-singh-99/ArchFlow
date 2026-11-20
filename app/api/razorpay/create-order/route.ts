import { getActiveSubscription } from "@/lib/subscription";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import Razorpay from "razorpay";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const CANONICAL_PLANS: Record<
  string,
  { name: string; monthlyPrice: number; yearlyPrice: number; currency: string }
> = {
  pro: { name: "Pro Architect", monthlyPrice: 1499, yearlyPrice: 14999, currency: "INR" },
  ai: { name: "AI Architect Pro", monthlyPrice: 3999, yearlyPrice: 39999, currency: "INR" },
};

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, planCode, billingCycle = "monthly" } = body;
    const userEmail = user.primaryEmailAddress?.emailAddress;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl || !userEmail) {
      return NextResponse.json({ error: "Billing is unavailable for this account." }, { status: 503 });
    }
    const convex = new ConvexHttpClient(convexUrl);
    const account = await convex.query(api.user.GetUserByEmail, { email: userEmail });
    if (!account) {
      return NextResponse.json({ error: "Your account is still being set up." }, { status: 409 });
    }
    if (getActiveSubscription(account) !== "free") {
      return NextResponse.json({ error: "Your paid plan is already active." }, { status: 409 });
    }
    if (billingCycle !== "monthly" && billingCycle !== "yearly") {
      return NextResponse.json({ error: "Invalid billing period." }, { status: 400 });
    }

    const normalizedCode = typeof planCode === "string" ? planCode.trim().toLowerCase() : "";

    // Reject free plan purchase
    if (normalizedCode === "free") {
      return NextResponse.json(
        { error: "The Free Starter tier does not require payment." },
        { status: 400 }
      );
    }

    // Fetch authoritative plan from Convex PlanTable
    const dbPlan = await convex.query(api.plans.GetPlanByIdOrCode, {
      planId: typeof planId === "string" ? planId : undefined,
      planCode: normalizedCode || undefined,
    });

    let serverPrice: number;
    let finalPlanName: string;
    let finalPlanCode: string;
    let finalCurrency: string;

    if (dbPlan) {
      const isDiscountExpired = Boolean(
        dbPlan.expiryDate && new Date(`${dbPlan.expiryDate}T23:59:59`).getTime() < Date.now()
      );
      const hasActiveDiscount = Boolean(
        dbPlan.discountPercent && dbPlan.discountPercent > 0 && !isDiscountExpired
      );

      serverPrice =
        billingCycle === "yearly"
          ? (hasActiveDiscount ? dbPlan.yearlyPrice : (dbPlan.originalYearlyPrice ?? dbPlan.yearlyPrice))
          : (hasActiveDiscount ? dbPlan.monthlyPrice : (dbPlan.originalMonthlyPrice ?? dbPlan.monthlyPrice));

      finalPlanName = dbPlan.name;
      finalPlanCode = dbPlan.planCode;
      finalCurrency = dbPlan.currency || "INR";
    } else if (CANONICAL_PLANS[normalizedCode]) {
      const canonical = CANONICAL_PLANS[normalizedCode];
      serverPrice = billingCycle === "yearly" ? canonical.yearlyPrice : canonical.monthlyPrice;
      finalPlanName = canonical.name;
      finalPlanCode = normalizedCode;
      finalCurrency = canonical.currency;
    } else {
      return NextResponse.json(
        { error: `Invalid or unavailable subscription plan: ${planCode || planId}` },
        { status: 400 }
      );
    }

    if (finalPlanCode === "free" || !Number.isFinite(serverPrice) || serverPrice <= 0) {
      return NextResponse.json({ error: "Invalid plan price on server" }, { status: 400 });
    }

    // Reject any client-submitted amount that attempts to override the authoritative price
    if (body.amount !== undefined && Math.abs(Number(body.amount) - serverPrice) > 0.01) {
      return NextResponse.json(
        {
          error: `Client-submitted price (${body.amount}) does not match authorized plan price (${serverPrice} ${finalCurrency}).`,
        },
        { status: 400 }
      );
    }

    const keyId =
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          error:
            "Razorpay API keys (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) are not configured in environment variables.",
          isConfigurationError: true,
        },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Razorpay amounts are in smallest currency sub-units (paise for INR)
    const amountInSubunits = Math.round(serverPrice * 100);

    const options = {
      amount: amountInSubunits,
      currency: finalCurrency.toUpperCase(),
      receipt: `rcpt_${Date.now()}_${userId.slice(-6)}`,
      notes: {
        userId,
        userEmail: user.primaryEmailAddress?.emailAddress || "",
        planId: dbPlan?._id ? String(dbPlan._id) : "",
        planName: finalPlanName,
        planCode: finalPlanCode,
        billingCycle: billingCycle || "monthly",
        authorizedPrice: String(serverPrice),
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planCode: finalPlanCode,
      planName: finalPlanName,
      billingCycle,
      keyId,
      user: {
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "User",
        email: user.primaryEmailAddress?.emailAddress || "",
        phone: user.phoneNumbers?.[0]?.phoneNumber || "",
      },
    });
  } catch (error: unknown) {
    console.error("Razorpay order creation error:", error);
    const message = error instanceof Error ? error.message : "Failed to create Razorpay order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
