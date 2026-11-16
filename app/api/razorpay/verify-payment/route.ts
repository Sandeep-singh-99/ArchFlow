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

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
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

    const isAuthentic = expectedSignature === razorpay_signature;

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let order: any = null;
    if (keyId) {
      try {
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        order = await razorpay.orders.fetch(razorpay_order_id);
      } catch (err) {
        console.warn("Could not fetch order from Razorpay SDK:", err);
      }
    }

    const orderNotes = order?.notes || {};
    const userEmail =
      user.primaryEmailAddress?.emailAddress || orderNotes.userEmail || body.userEmail || "";
    const planCode = String(orderNotes.planCode || body.planCode || "pro").toLowerCase();
    const planName = String(orderNotes.planName || body.planName || "Pro Architect");
    const planId = orderNotes.planId || body.planId || undefined;
    const billingCycle = String(orderNotes.billingCycle || body.billingCycle || "monthly");
    const amount = order ? Number(order.amount) / 100 : Number(orderNotes.authorizedPrice || body.amount || 0);
    const currency = order?.currency || body.currency || "INR";

    // 3. Record successful payment and upgrade subscription directly on the server
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let convexResult: any = null;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (convexUrl && userEmail) {
      try {
        const convex = new ConvexHttpClient(convexUrl);
        convexResult = await convex.mutation(api.payments.RecordSuccessfulPayment, {
          userEmail,
          planId: planId && typeof planId === "string" && planId.length > 10 ? (planId as Id<"PlanTable">) : undefined,
          planName,
          planCode,
          billingCycle,
          amount,
          currency,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          validityDays: billingCycle === "yearly" ? 365 : 30,
          tokenQuota: planCode === "ai" ? 999999 : 50000,
          serverSecret: keySecret,
        });
      } catch (err) {
        console.error("Convex server-side payment recording error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      subscription: convexResult?.subscription || planCode,
      validUntil: convexResult?.validUntil,
      paymentRecordId: convexResult?.paymentId,
    });
  } catch (error: unknown) {
    console.error("Razorpay verification error:", error);
    const message = error instanceof Error ? error.message : "Internal verification error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
