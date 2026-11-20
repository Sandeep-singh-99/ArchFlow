import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (typeof razorpay_order_id !== "string" || !razorpay_order_id ||
        typeof razorpay_payment_id !== "string" || !razorpay_payment_id ||
        typeof razorpay_signature !== "string" || !/^[0-9a-f]{64}$/.test(razorpay_signature)) {
      return NextResponse.json(
        { error: "Missing required payment signature verification fields" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay secret key not configured on server" },
        { status: 500 }
      );
    }

    // 1. Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isAuthentic = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(razorpay_signature, "hex"),
    );

    if (!isAuthentic) {
      return NextResponse.json(
        { error: "Payment verification failed: Signature mismatch", verified: false },
        { status: 400 }
      );
    }

    // 2. Fetch order details from Razorpay to read verified server notes
    const keyId =
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      "";

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const userEmail = user.primaryEmailAddress?.emailAddress;
    if (!keyId || !convexUrl || !userEmail) {
      return NextResponse.json({ error: "Payment confirmation is unavailable." }, { status: 503 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const [order, payment] = await Promise.all([
      razorpay.orders.fetch(razorpay_order_id),
      razorpay.payments.fetch(razorpay_payment_id),
    ]);
    const notes = order.notes;
    if (!notes || notes.userId !== userId || notes.userEmail !== userEmail ||
        payment.order_id !== order.id || Number(payment.amount) !== Number(order.amount) ||
        payment.currency !== order.currency) {
      return NextResponse.json({ error: "Payment does not match this order." }, { status: 403 });
    }

    if (payment.status !== "captured") {
      return NextResponse.json({ error: "Razorpay is confirming your payment. Check your plan before trying again." }, { status: 409 });
    }

    const { planCode, planName, planId, billingCycle } = notes;
    if (typeof planCode !== "string" || typeof planName !== "string" ||
        (billingCycle !== "monthly" && billingCycle !== "yearly")) {
      return NextResponse.json({ error: "Invalid plan details on this order." }, { status: 400 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    const convexResult = await convex.mutation(api.payments.RecordSuccessfulPayment, {
      userEmail,
      planId: typeof planId === "string" && planId ? planId as Id<"PlanTable"> : undefined,
      planName,
      planCode,
      billingCycle,
      amount: Number(order.amount) / 100,
      currency: order.currency,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      validityDays: billingCycle === "yearly" ? 365 : 30,
      serverSecret: process.env.CONVEX_SERVER_SECRET || keySecret,
    });

    if (!convexResult.activated) {
      return NextResponse.json({
        error: "Payment was recorded, but another plan is already active. Contact support with your payment ID.",
      }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      subscription: convexResult.subscription,
      billingCycle: convexResult.billingCycle,
      token: convexResult.token,
      validUntil: convexResult.validUntil,
      paymentRecordId: convexResult.paymentId,
    });
  } catch (error: unknown) {
    console.error("Razorpay verification error:", error);
    const message = error instanceof Error ? error.message : "Internal verification error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
