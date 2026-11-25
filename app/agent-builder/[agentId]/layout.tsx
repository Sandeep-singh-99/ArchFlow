import type { Metadata } from "next";
import { buildProjectMetadata } from "@/lib/projectMetadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentId: string }>;
}): Promise<Metadata> {
  const { agentId } = await params;
  return buildProjectMetadata(agentId);
}

export default function AgentBuilderProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
