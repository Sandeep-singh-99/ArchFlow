"use client";
import { useEffect, useState, useContext } from "react";
import Header from "../../_components/Header";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Agent } from "@/types/AgentTypes";
import { ReactFlow, ConnectionMode } from "@xyflow/react";
import { nodeTypes } from "../../_customNodes/nodeTypes";
import "@xyflow/react/dist/style.css";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { RefreshCcwIcon, Sparkles, Lock, Zap } from "lucide-react";
import ChatUI from "./_components/ChatUI";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { UserDetailContext } from "@/context/UserDetailContext";

export default function PreviewAgent() {
  const { agentId } = useParams();
  const convex = useConvex();
  const { userDetails } = useContext(UserDetailContext);
  const [agentDetail, setAgentDetail] = useState<Agent>();
  const [flowConfig, setFlowConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const updateAgentToolConfig = useMutation(api.agent.UpdateAgentToolConfig);

  const { has } = useAuth();
  const hasAiAccess = Boolean(
    (has &&
      (has({ plan: "ai_architect_pro" }) ||
        has({ plan: "ai_unlimited_plan" }) ||
        has({ plan: "unlimited_plan" }))) ||
      userDetails?.subscription === "ai" ||
      userDetails?.subscription === "active"
  );

  const GetAgentDetail = async () => {
    const results = await convex.query(api.agent.GetAgentById, {
      agentId: agentId as string,
    });
    setAgentDetail(results);
  };

  useEffect(() => {
    GetAgentDetail();
  }, []);

  useEffect(() => {
    if (agentDetail) {
      GenerateWorkflow();
    }
  }, [agentDetail]);

  const GenerateWorkflow = () => {
    const edgeMap = agentDetail?.edges.reduce((acc: any, edge: any) => {
      if (!acc[edge.source]) acc[edge.source] = [];
      acc[edge.source].push(edge);
      return acc;
    }, {});

    const flow = agentDetail?.nodes?.map((node: any) => {
      const connectedEdges = edgeMap[node.id] || [];
      let next: any = null;

      if (connectedEdges.length === 1) {
        next = connectedEdges[0].target;
      } else if (connectedEdges.length > 1) {
        next = connectedEdges.map((e: any) => e.target);
      }

      return {
        id: node.id,
        type: node.type,
        label: node.data?.label || node.type,
        settings: node.data?.settings || {},
        next,
      };
    });

    const startNode = agentDetail?.nodes?.[0];

    const config = {
      startNode: startNode?.id || null,
      flow,
    };
    setFlowConfig(config);
  };

  const GenerateAgentToolConfig = async () => {
    if (!hasAiAccess) {
      return;
    }
    setLoading(true);
    try {
      const result = await axios.post(`/api/generate-agent-tool-config`, {
        jsonConfig: JSON.stringify(flowConfig),
      });
      await updateAgentToolConfig({
        id: agentDetail?._id as any,
        agentToolConfig: result.data,
      });
      GetAgentDetail();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header previewHeader={true} agentDetail={agentDetail} />

      <div className="grid grid-cols-1 lg:grid-cols-4 flex-1">
        {/* Flow Canvas Area */}
        <div className="lg:col-span-3 p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Architecture Preview
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              {agentDetail?.name || "Schema Flow"}
            </span>
          </div>

          <div className="w-full h-[82vh] bg-black rounded-2xl border border-border overflow-hidden relative shadow-inner">
            <ReactFlow
              colorMode="dark"
              connectionMode={ConnectionMode.Loose}
              nodes={agentDetail?.nodes || []}
              edges={agentDetail?.edges || []}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={{
                animated: true,
                style: { stroke: "#ffdf27", strokeWidth: 2 },
                interactionWidth: 20,
                labelStyle: { fill: "#ffffff", fontWeight: 600, fontSize: 10, fontFamily: "monospace" },
                labelBgStyle: { fill: "rgba(12, 13, 18, 0.9)", stroke: "rgba(255, 255, 255, 0.2)", borderRadius: 8 },
                labelBgPadding: [8, 4],
              }}
              fitView
              draggable={true}
              nodesDraggable={false}
            />
          </div>
        </div>

        {/* AI Chat & Tool Execution Area */}
        <div className="border-t lg:border-t-0 lg:border-l border-border bg-card/40 flex flex-col justify-center p-4">
          {!hasAiAccess ? (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-2xl border border-[#ffdf27]/40 bg-[#0c0d12]/95 backdrop-blur-md shadow-xl my-auto">
              <div className="p-3.5 rounded-2xl bg-[#ffdf27]/10 border border-[#ffdf27]/25 text-[#ffdf27] shadow-[0_0_20px_rgba(255,223,39,0.15)]">
                <Sparkles className="h-6 w-6" />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffdf27]/10 border border-[#ffdf27]/30 text-[10px] font-mono font-bold text-[#ffee72]">
                  <Lock className="h-3 w-3" />
                  <span>AI Architect Feature</span>
                </div>
                <h3 className="text-base font-bold text-white pt-1">
                  AI Agent Chat & Execution
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                  Interactive AI conversations, prompt-to-tool generation, and schema simulations with Gemini are exclusive to the AI Architect tier ($49/mo).
                </p>
              </div>

              <Link href="/dashboard/pricing" className="w-full">
                <Button className="w-full text-xs font-bold h-10 rounded-xl bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none shadow-md cursor-pointer">
                  <Zap className="h-3.5 w-3.5 mr-1" />
                  Upgrade to AI Architect ($49)
                </Button>
              </Link>

              <span className="text-[10px] text-zinc-500 font-mono">
                Visual schema diagram remains fully interactive.
              </span>
            </div>
          ) : !agentDetail?.agentToolConfig ? (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
              <Button
                onClick={GenerateAgentToolConfig}
                disabled={loading}
                className="gap-2 font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none shadow-sm cursor-pointer"
              >
                <RefreshCcwIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Initialize AI Agent
              </Button>
              <p className="text-xs text-muted-foreground max-w-xs">
                Generates instruction prompts & tools from your flow nodes with Gemini.
              </p>
            </div>
          ) : (
            <ChatUI
              GenerateAgentToolConfig={GenerateAgentToolConfig}
              loading={loading}
              agentDetail={agentDetail}
            />
          )}
        </div>
      </div>
    </div>
  );
}