import { auth, currentUser } from "@clerk/nextjs/server";
import type { Edge, Node } from "@xyflow/react";
import { z } from "zod";
import { buildSchemaAutoConnectGraph, type ThinkingStep } from "@/lib/ai/schemaGraph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  nodes: z.array(z.record(z.string(), z.unknown())).min(1, "Add at least one table or collection first."),
  edges: z.array(z.record(z.string(), z.unknown())).default([]),
});

function formatSse(event: string, data: unknown): Uint8Array {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(payload);
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.json();
    const parsed = RequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.issues[0]?.message || "Invalid request payload." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const inputNodes = parsed.data.nodes as unknown as Node[];
    const inputEdges = parsed.data.edges as unknown as Edge[];

    const graph = buildSchemaAutoConnectGraph();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          controller.enqueue(
            formatSse("thinking", {
              agent: "Orchestrator",
              title: "Initializing LangGraph multi-agent pipeline...",
              thought: `Dispatching ${inputNodes.length} node(s) and ${inputEdges.length} existing edge(s) to Gemini agents.`,
              timestamp: Date.now(),
            } satisfies ThinkingStep)
          );

          let finalUpdatedNodes: Node[] = inputNodes;
          let finalAddedNodes: Node[] = [];
          let finalAddedEdges: Edge[] = [];
          const allThinking: ThinkingStep[] = [];

          const graphStream = await graph.stream(
            {
              nodes: inputNodes,
              edges: inputEdges,
            },
            { streamMode: "updates" }
          );

          for await (const update of graphStream) {
            for (const nodeOutput of Object.values(update)) {
              if (!nodeOutput || typeof nodeOutput !== "object") continue;
              const chunk = nodeOutput as Record<string, unknown>;

              if (Array.isArray(chunk.thinkingSteps)) {
                for (const step of chunk.thinkingSteps as ThinkingStep[]) {
                  allThinking.push(step);
                  controller.enqueue(formatSse("thinking", step));
                }
              }

              if (Array.isArray(chunk.finalUpdatedNodes)) {
                finalUpdatedNodes = chunk.finalUpdatedNodes as Node[];
              }
              if (Array.isArray(chunk.finalAddedNodes)) {
                finalAddedNodes = chunk.finalAddedNodes as Node[];
              }
              if (Array.isArray(chunk.finalAddedEdges)) {
                finalAddedEdges = chunk.finalAddedEdges as Edge[];
              }
            }
          }

          controller.enqueue(
            formatSse("result", {
              updatedNodes: finalUpdatedNodes,
              addedNodes: finalAddedNodes,
              addedEdges: finalAddedEdges,
              thinkingSteps: allThinking,
            })
          );
          controller.close();
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "AI auto-connect pipeline failed.";
          controller.enqueue(formatSse("error", { error: message }));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
