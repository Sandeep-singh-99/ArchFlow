import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
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
      const orderId = payload.payload?.order?.entity?.id || paymentEntity?.order_id;
      if (typeof orderId !== "string" || typeof paymentEntity?.id !== "string") {
        return NextResponse.json({ error: "Missing webhook order or payment." }, { status: 400 });
      }

      const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keyId || !keySecret) {
        return NextResponse.json({ error: "Payment confirmation is unavailable." }, { status: 503 });
      }
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const order = await razorpay.orders.fetch(orderId);
      const { userEmail, planCode, planName, planId, billingCycle } = order.notes || {};
      if (typeof userEmail === "string" && typeof planCode === "string" &&
          typeof planName === "string" && (billingCycle === "monthly" || billingCycle === "yearly") &&
          paymentEntity.order_id === order.id && paymentEntity.status === "captured" &&
          Number(paymentEntity.amount) === Number(order.amount) && paymentEntity.currency === order.currency) {
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (!convexUrl) {
          return NextResponse.json({ error: "Billing storage is unavailable." }, { status: 503 });
        }
        const convex = new ConvexHttpClient(convexUrl);
        await convex.mutation(api.payments.RecordSuccessfulPayment, {
          userEmail,
          planId:
            planId && typeof planId === "string"
              ? (planId as Id<"PlanTable">)
              : undefined,
          planName,
          planCode,
          billingCycle,
          amount: Number(order.amount) / 100,
          currency: order.currency,
          razorpayOrderId: order.id,
          razorpayPaymentId: paymentEntity.id,
          razorpaySignature: signature,
          validityDays: billingCycle === "yearly" ? 365 : 30,
          serverSecret: process.env.CONVEX_SERVER_SECRET || keySecret,
        });
      }
    }

    return NextResponse.json({ status: "ok", received: true, event });
  } catch (error: unknown) {
    console.error("Razorpay webhook processing error:", error);
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
