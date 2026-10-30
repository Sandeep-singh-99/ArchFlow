import { LLMModel } from "@/config/GeminiAI";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const PROMPT = `from this flow, generate a agent instruction prompt with all details along with
tools with all setting info in JSON format. Do not add any extra text just written JSON data.
make sure to mentioned parameters depends on get or post request.
only: {
  systemPrompt: "",
  primaryAgentName: "",
  agents: [
    {
      "id": "",
      "agent-id": "",
      "name": "",
      "model": "",
      "includeHistory": true/false,
      "output": {
        "result": "",
        "tool_id": "",
        "interaction": ""
      }
    }
  ],
  tools: [
    {
      "id": "",
      "name": "",
      "description": "",
      "method": "GET" | "POST",
      "url": "",
      "includeApiKey": true,
      "apiKey": "",
      "parameters": { "key": "dataType" },
      "usage": [],
      "assignedAgent": ""
    }
  ]
}`;

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
          { error: "AI Tool Generation requires the AI Architect plan ($49/mo). Please upgrade." },
          { status: 403 }
        );
      }
    }

    const { jsonConfig } = await req.json();

    const response = await LLMModel.generateContent(PROMPT + jsonConfig);
    const result = response.response.text();

    let parsedJson;

    try {
      parsedJson = JSON.parse(result.replace('```json', '').replace('```', ''));
      return NextResponse.json(parsedJson);
    } catch (error) {
      return NextResponse.json({ error: 'Failed to parse JSON' }, { status: 500 });
    }
  } catch (err) {
    console.error("Error in generate-agent-tool-config:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
