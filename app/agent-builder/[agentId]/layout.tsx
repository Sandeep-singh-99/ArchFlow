import type { Metadata } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getSchemaType } from "@/lib/schemaClassifier";

interface Props {
  children: React.ReactNode;
  params: Promise<{ agentId: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentId: string }>;
}): Promise<Metadata> {
  const { agentId } = await params;
  const fallbackTitle = "ArchFlow Schema Studio | Visual SQL & NoSQL ER Designer";
  const fallbackDesc =
    "Interactive database schema canvas with AI Auto-Connect, ER cardinalities, and production DDL export.";

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl || !agentId) {
    return {
      title: fallbackTitle,
      description: fallbackDesc,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDesc,
        type: "website",
        images: ["/opengraph-image"],
      },
      twitter: {
        card: "summary_large_image",
        title: fallbackTitle,
        description: fallbackDesc,
        images: ["/twitter-image"],
      },
    };
  }

  try {
    const convex = new ConvexHttpClient(convexUrl);
    const project = await convex.query(api.agent.GetAgentById, { agentId });

    if (!project) {
      return {
        title: fallbackTitle,
        description: fallbackDesc,
        openGraph: { title: fallbackTitle, description: fallbackDesc, images: ["/opengraph-image"] },
        twitter: { card: "summary_large_image", title: fallbackTitle, description: fallbackDesc, images: ["/twitter-image"] },
      };
    }

    const schemaLabel = getSchemaType(project) === "nosql" ? "NoSQL" : "SQL";
    const nodeCount = Array.isArray(project.nodes) ? project.nodes.length : 0;
    const edgeCount = Array.isArray(project.edges) ? project.edges.length : 0;
    const title = `${project.name} — ArchFlow (${schemaLabel})`;
    const description = `Visual ${schemaLabel} database architecture with ${nodeCount} node(s) and ${edgeCount} relationship(s), built in ArchFlow.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        siteName: "ArchFlow",
        images: ["/opengraph-image"],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ["/twitter-image"],
      },
    };
  } catch {
    return {
      title: fallbackTitle,
      description: fallbackDesc,
      openGraph: { title: fallbackTitle, description: fallbackDesc, images: ["/opengraph-image"] },
      twitter: { card: "summary_large_image", title: fallbackTitle, description: fallbackDesc, images: ["/twitter-image"] },
    };
  }
}

export default function AgentBuilderProjectLayout({ children }: Props) {
  return <>{children}</>;
}
