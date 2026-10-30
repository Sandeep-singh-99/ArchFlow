import { LLMModel } from "@/config/GeminiAI";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, has } = await auth();

    // Verify AI Architect tier access for authenticated users
    if (userId && has) {
      const hasAiPlan =
        has({ plan: "ai_architect_pro" }) ||
        has({ plan: "ai_unlimited_plan" }) ||
        has({ plan: "unlimited_plan" });
      if (!hasAiPlan) {
        return NextResponse.json(
          { error: "AI Agent Chat requires the AI Architect plan ($49/mo). Please upgrade." },
          { status: 403 }
        );
      }
    }

    const { messages, agentToolConfig } = await req.json();

    if (!agentToolConfig) {
      return NextResponse.json(
        { error: "Agent configuration is missing" },
        { status: 400 }
      );
    }

    const systemPrompt = `
        You are an AI agent named "${agentToolConfig.primaryAgentName || "AI Agent"}".
        
        Your instructions are:
        ${agentToolConfig.systemPrompt || "You are a helpful assistant."}
        
        Available Tools:
        ${JSON.stringify(agentToolConfig.tools || [], null, 2)}
        
        Please respond to the user's message based on your instructions and available tools.
        If a tool is needed, describe which tool you would use and why, but for now, just provide a text response simulating the action if possible, or ask for clarification.
        `;

    const chat = LLMModel.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am ready to assist." }],
        },
        ...messages.map((msg: any) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
      ],
    });

    // Get the last message content
    const lastMessage = messages[messages.length - 1].content;

    const result = await chat.sendMessage(lastMessage);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in agent-chat:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
