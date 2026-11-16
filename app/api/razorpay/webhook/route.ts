import { NextResponse } from "next/server";
import crypto from "crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET ||
      process.env.RAZORPAY_KEY_SECRET ||
      "";

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Razorpay webhook secret not configured on server" },
        { status: 500 }
      );
    }

    const rawBody = await req.text();

    // Verify HMAC-SHA256 webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = JSON.parse(rawBody);
    const event = payload.event;

    // Process payment completion events
    if (event === "order.paid" || event === "payment.captured") {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderEntity = payload.payload?.order?.entity;
      const notes = orderEntity?.notes || paymentEntity?.notes || {};

      const userEmail = notes.userEmail;
      const planCode = String(notes.planCode || "pro").toLowerCase();
      const planName = String(notes.planName || "Pro Architect");
      const planId = notes.planId;
      const billingCycle = String(notes.billingCycle || "monthly");
      const amount =
        (paymentEntity?.amount
          ? Number(paymentEntity.amount) / 100
          : Number(orderEntity?.amount) / 100) || 0;
      const currency = paymentEntity?.currency || orderEntity?.currency || "INR";
      const razorpayOrderId = orderEntity?.id || paymentEntity?.order_id || "";
      const razorpayPaymentId = paymentEntity?.id || "";

      if (userEmail && planCode && razorpayOrderId) {
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (convexUrl) {
          const convex = new ConvexHttpClient(convexUrl);
          await convex.mutation(api.payments.RecordSuccessfulPayment, {
            userEmail,
            planId:
              planId && typeof planId === "string" && planId.length > 10
                ? (planId as Id<"PlanTable">)
                : undefined,
            planName,
            planCode,
            billingCycle,
            amount,
            currency,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature: signature,
            validityDays: billingCycle === "yearly" ? 365 : 30,
            tokenQuota: planCode === "ai" ? 999999 : 50000,
            serverSecret: webhookSecret,
          });
        }
      }
    }

    return NextResponse.json({ status: "ok", received: true, event });
  } catch (error: unknown) {
    console.error("Razorpay webhook processing error:", error);
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
