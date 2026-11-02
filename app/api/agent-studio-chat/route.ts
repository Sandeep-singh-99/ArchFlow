import { NextRequest, NextResponse } from "next/server";
import { runAgentStudioChat } from "@/lib/ai/langgraphAgent";

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, canvasSchema } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string." },
        { status: 400 }
      );
    }

    const currentSessionId = sessionId || `session_${Date.now()}`;

    // Run LangGraph with Pinecone RAG and Short-term Memory (in-memory)
    // Note: Previous chat is intentionally NOT saved to any database.
    const result = await runAgentStudioChat({
      query: message,
      sessionId: currentSessionId,
      canvasSchema,
    });

    return NextResponse.json({
      response: result.response,
      canvasActions: result.canvasActions,
      retrievedContext: result.retrievedContext,
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
