import type { Metadata } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getSchemaType } from "@/lib/schemaClassifier";

const FALLBACK_TITLE = "ArchFlow Schema Studio | Visual SQL & NoSQL ER Designer";
const FALLBACK_DESC =
  "Interactive database schema canvas with AI Auto-Connect, ER cardinalities, and production DDL export.";

function fallbackMetadata(): Metadata {
  return {
    title: FALLBACK_TITLE,
    description: FALLBACK_DESC,
    openGraph: {
      title: FALLBACK_TITLE,
      description: FALLBACK_DESC,
      type: "website",
      siteName: "ArchFlow",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: FALLBACK_TITLE,
      description: FALLBACK_DESC,
      images: ["/twitter-image"],
    },
  };
}

export async function buildProjectMetadata(agentId: string): Promise<Metadata> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl || !agentId) {
    return fallbackMetadata();
  }

  try {
    const convex = new ConvexHttpClient(convexUrl);
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 2500)
    );
    const project = await Promise.race([
      convex.query(api.agent.GetAgentById, { agentId }),
      timeoutPromise,
    ]);

    if (!project) {
      return fallbackMetadata();
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
    return fallbackMetadata();
  }
}
