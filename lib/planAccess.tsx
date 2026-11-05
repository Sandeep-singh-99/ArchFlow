/**
 * ArchFlow Plan & Feature Access Control
 *
 * Defines the canonical 7 features, subscription tiers, project quotas,
 * and unified permission checkers used across client components and server routes.
 */

import React from "react";
import { toast } from "sonner";
import { LockedFeatureToast } from "@/components/plans/LockedFeatureToast";

export type PlanCode = "free" | "pro" | "ai";

export type FeatureKey =
  | "visual_canvas"
  | "export_ddl"
  | "domain_grouping"
  | "cascade_simulator"
  | "mermaid_tools"
  | "ai_copilot"
  | "ai_agent_chat";

export interface FeatureMeta {
  key: FeatureKey;
  label: string;
  description: string;
  requiredPlan: "free" | "pro" | "ai";
  badge?: "PRO" | "AI";
  shortName: string;
}

export const CANONICAL_FEATURES: Record<FeatureKey, FeatureMeta> = {
  visual_canvas: {
    key: "visual_canvas",
    label: "React Flow Visual Canvas",
    shortName: "Visual Canvas",
    description: "Design interactive relational and document database schema models.",
    requiredPlan: "free",
  },
  export_ddl: {
    key: "export_ddl",
    label: "Export SQL & NoSQL DDL",
    shortName: "Export DDL",
    description: "Export PostgreSQL, MySQL, SQLite, Prisma, and MongoDB schema definitions.",
    requiredPlan: "free",
  },
  domain_grouping: {
    key: "domain_grouping",
    label: "Multi-Domain Grouping",
    shortName: "Domain Grouping",
    description: "Organize large schemas into bounded domain containers (Auth, Billing, Catalog).",
    requiredPlan: "pro",
    badge: "PRO",
  },
  cascade_simulator: {
    key: "cascade_simulator",
    label: "CASCADE Drop Simulator",
    shortName: "CASCADE Simulator",
    description: "Simulate foreign-key cascade drops, verify referential integrity, and inspect dependent views.",
    requiredPlan: "pro",
    badge: "PRO",
  },
  mermaid_tools: {
    key: "mermaid_tools",
    label: "Import & Export Mermaid",
    shortName: "Mermaid ER",
    description: "Bi-directional Mermaid ER diagram import and live syntax export.",
    requiredPlan: "pro",
    badge: "PRO",
  },
  ai_copilot: {
    key: "ai_copilot",
    label: "AI Prompt-to-Schema Copilot",
    shortName: "AI Copilot",
    description: "Generate production database schemas from natural language prompts using Gemini.",
    requiredPlan: "ai",
    badge: "AI",
  },
  ai_agent_chat: {
    key: "ai_agent_chat",
    label: "AI Agent Chat & Tool Execution",
    shortName: "AI Agent Chat",
    description: "Interactive AI agent copilot that dynamically creates and links canvas nodes in real-time.",
    requiredPlan: "ai",
    badge: "AI",
  },
};

export const PLAN_PROJECT_QUOTAS: Record<PlanCode, number> = {
  free: 1,
  pro: 15,
  ai: 9999, // Effectively unlimited
};

export const PLAN_NAMES: Record<PlanCode, string> = {
  free: "Hobbyist Free",
  pro: "Pro Architect",
  ai: "AI Architect Pro",
};

/**
 * Resolves the user's active plan code from their Convex user details and Clerk session.
 * Handles subscription expiry timestamp check.
 */
export function getUserPlanCode(
  userDetails: any,
  clerkHas?: any
): PlanCode {
  // 1. Check Clerk session plan claims if available
  if (clerkHas) {
    if (
      clerkHas({ plan: "ai_architect_pro" }) ||
      clerkHas({ plan: "ai_unlimited_plan" }) ||
      clerkHas({ plan: "unlimited_plan" })
    ) {
      return "ai";
    }
    if (
      clerkHas({ plan: "pro_architect" }) ||
      clerkHas({ plan: "pro_plan" })
    ) {
      return "pro";
    }
  }

  if (!userDetails) return "free";

  // 2. Check if subscription timestamp is expired
  if (
    userDetails.subscriptionExpiresAt &&
    typeof userDetails.subscriptionExpiresAt === "number" &&
    userDetails.subscriptionExpiresAt < Date.now()
  ) {
    return "free";
  }

  // 3. Check Convex subscription field
  const sub = String(userDetails.subscription || "").toLowerCase().trim();
  if (sub === "ai" || sub === "ai_unlimited" || sub.includes("ai")) {
    return "ai";
  }
  if (sub === "pro" || sub === "active" || sub.includes("pro")) {
    return "pro";
  }

  return "free";
}

/**
 * Checks whether a given plan has access to a specific feature.
 */
export function canAccessFeature(
  featureKey: FeatureKey,
  planCode: PlanCode
): boolean {
  const req = CANONICAL_FEATURES[featureKey]?.requiredPlan || "free";
  if (req === "free") return true;
  if (req === "pro") return planCode === "pro" || planCode === "ai";
  if (req === "ai") return planCode === "ai";
  return false;
}

/**
 * Returns the maximum allowed project quota for a plan code.
 */
export function getPlanProjectQuota(planCode: PlanCode): number {
  return PLAN_PROJECT_QUOTAS[planCode] ?? 1;
}

/**
 * Returns human-readable feature metadata.
 */
export function getFeatureMeta(featureKey: FeatureKey): FeatureMeta {
  return CANONICAL_FEATURES[featureKey] || {
    key: featureKey,
    label: featureKey,
    shortName: featureKey,
    description: "",
    requiredPlan: "pro",
  };
}

/**
 * Displays a styled minimal toast notification whenever a user tries to access a feature
 * that is not included in their active subscription plan.
 */
export function notifyFeatureLocked(
  featureKey: FeatureKey,
  currentPlan?: PlanCode
) {
  const toastId = `locked-${featureKey}`;

  toast.custom(
    (id) => (
      <LockedFeatureToast
        id={id}
        featureKey={featureKey}
        currentPlan={currentPlan}
      />
    ),
    {
      id: toastId,
      duration: 4000,
      position: "bottom-right",
    }
  );
}
