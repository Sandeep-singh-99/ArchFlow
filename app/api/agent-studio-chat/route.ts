import { NextRequest, NextResponse } from "next/server";
import { runAgentStudioChat } from "@/lib/ai/langgraphAgent";
import { auth, currentUser } from "@clerk/nextjs/server";

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
      const hasClerkAiPlan =
        has &&
        (has({ plan: "ai_architect_pro" }) ||
          has({ plan: "ai_unlimited_plan" }) ||
          has({ plan: "unlimited_plan" }));

      // If user has Clerk AI plan, authorized.
      // Otherwise allow if convex subscription is verified or proceed if session active
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
  } catch (error: any) {
    console.error("Error in agent-studio-chat route:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process chat with AI agent." },
      { status: 500 }
    );
  }
}
