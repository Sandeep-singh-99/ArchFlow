import { NextRequest, NextResponse } from "next/server";
import { runAgentStudioChat } from "@/lib/ai/langgraphAgent";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getUserPlanCode, canAccessFeature } from "@/lib/planAccess";

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, canvasSchema, userEmail } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string." },
        { status: 400 }
      );
    }

    // Verify AI Architect Tier Authorization
    const { userId, has } = await auth();
    if (userId) {
      let isAuthorized = false;

      // 1. Check Clerk billing claim as fallback if enabled
      const hasClerkAiPlan = Boolean(
        has &&
          (has({ plan: "ai_architect_pro" }) ||
            has({ plan: "ai_unlimited_plan" }) ||
            has({ plan: "unlimited_plan" }))
      );

      if (hasClerkAiPlan) {
        isAuthorized = true;
      }

      // 2. Authoritative check: Check user's active tier in Convex UserTable (Razorpay subscriptions)
      if (!isAuthorized && process.env.NEXT_PUBLIC_CONVEX_URL) {
        try {
          const user = await currentUser();
          const email = (userEmail || user?.primaryEmailAddress?.emailAddress || "").toLowerCase();
          if (email) {
            const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
            const dbUser = await convex.query(api.user.GetUserByEmail, { email });
            if (dbUser) {
              const planCode = getUserPlanCode(dbUser);
              const isAdmin = dbUser.role === "admin";
              if (isAdmin || canAccessFeature("ai_agent_chat", planCode)) {
                isAuthorized = true;
              }
            }
          }
        } catch (convexErr) {
          console.error("Error verifying Convex subscription in agent-studio-chat:", convexErr);
        }
      }

      if (!isAuthorized) {
        return NextResponse.json(
          {
            error:
              "Forbidden: AI Copilot and Agent Studio Chat require an active AI Architect subscription.",
          },
          { status: 403 }
        );
      }
    }

    const currentSessionId = sessionId || `session_${Date.now()}`;

    // Run LangGraph with Gemini Generator and Short-term Memory (in-memory)
    // Note: Previous chat is intentionally NOT saved to any database.
    const result = await runAgentStudioChat({
      query: message,
      sessionId: currentSessionId,
      canvasSchema,
    });

    return NextResponse.json({
      response: result.response,
      canvasActions: result.canvasActions,
      sessionId: currentSessionId,
    });
  } catch (error: unknown) {
    console.error("Error in agent-studio-chat route:", error);
    const msg = error instanceof Error ? error.message : "Failed to process chat with AI agent.";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
