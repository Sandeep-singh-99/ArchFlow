import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, planName, planCode, billingCycle, amount, currency = "INR" } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid plan amount" }, { status: 400 });
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

    // Razorpay amounts are in smallest currency sub-units (paise for INR, cents for USD)
    const amountInSubunits = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInSubunits,
      currency: currency.toUpperCase(),
      receipt: `rcpt_${Date.now()}_${userId.slice(-6)}`,
      notes: {
        userId,
        userEmail: user.primaryEmailAddress?.emailAddress || "",
        planId: planId || "",
        planName: planName || "",
        planCode: planCode || "pro",
        billingCycle: billingCycle || "monthly",
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
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
