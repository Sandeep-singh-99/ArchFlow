"use client";
import { useEffect, useState } from "react";
import Header from "../../_components/Header";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Agent } from "@/types/AgentTypes";
import { Background, ReactFlow, ConnectionMode } from "@xyflow/react";
import { nodeTypes } from "../../_customNodes/nodeTypes";
import "@xyflow/react/dist/style.css";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { RefreshCcwIcon } from "lucide-react";
import ChatUI from "./_components/ChatUI";

export default function PreviewAgent() {
  const { agentId } = useParams();
  const convex = useConvex();
  const [agentDetail, setAgentDetail] = useState<Agent>();
  const [flowConfig, setFlowConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const updateAgentToolConfig = useMutation(api.agent.UpdateAgentToolConfig);

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
            next
        };
    });

    const startNode = agentDetail?.nodes?.[0];

    const config = {
        startNode: startNode?.id || null,
        flow
    };
    setFlowConfig(config);

    console.log("Generated Workflow Config", JSON.stringify(config));
  };

  const GenerateAgentToolConfig = async () => {
    setLoading(true);
    const result = await axios.post(`/api/generate-agent-tool-config`, {
        jsonConfig: JSON.stringify(flowConfig)
    });
    setLoading(false);
    console.log("Generated Agent Tool Config", result.data);

    await updateAgentToolConfig({
        id: agentDetail?._id as any,
        agentToolConfig: result.data
    });

    GetAgentDetail();
  };


  return (
    <div>
      <Header previewHeader={true} agentDetail={agentDetail} />

      <div className="grid grid-cols-4">
        <div className="col-span-3 p-5 border-2 rounded-2xl m-5">
            <h2>Preview</h2>
          <div style={{ width: "100%", height: "90vh", backgroundColor: '#f8f8f8', borderRadius: 20 }}>
            <ReactFlow
              colorMode="dark"
              connectionMode={ConnectionMode.Loose}
              nodes={agentDetail?.nodes || []}
              edges={agentDetail?.edges || []}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={{
                animated: true,
                style: { stroke: "#10b981", strokeWidth: 2 },
                interactionWidth: 20,
                labelStyle: { fill: "#ffffff", fontWeight: 500, fontSize: 11 },
                labelBgStyle: { fill: "rgba(0, 0, 0, 0.75)", stroke: "#ffffff", strokeWidth: 1 },
                labelBgPadding: [12, 6],
                labelBgBorderRadius: 8,
              }}
              fitView
              draggable={false}
            >
              {/* @ts-ignore */}
              {/* <Background variant="dots" gap={12} size={1} /> */}
            </ReactFlow>
          </div>
        </div>
        <div className="">
          <div className="flex items-center justify-center h-full">
            {!agentDetail?.agentToolConfig ? <Button onClick={GenerateAgentToolConfig} disabled={loading}>
              <RefreshCcwIcon className={loading ? `animate-spin` : ''}/>
              Reboot Agent
              </Button> : <ChatUI GenerateAgentToolConfig={GenerateAgentToolConfig} loading={loading} agentDetail={agentDetail} />}
          </div>
        </div>
      </div>
    </div>
  );
}
