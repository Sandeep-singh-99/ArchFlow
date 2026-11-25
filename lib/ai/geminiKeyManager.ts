import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export type GeminiAgentRole = "analyzer" | "relationship" | "enricher";

interface RoleConfig {
  envKeyName: string;
  envModelName: string;
  defaultModel: string;
}

const ROLE_CONFIGS: Record<GeminiAgentRole, RoleConfig> = {
  analyzer: {
    envKeyName: "GEMINI_ANALYZER_API_KEY",
    envModelName: "GEMINI_ANALYZER_MODEL",
    defaultModel: "gemini-2.5-flash",
  },
  relationship: {
    envKeyName: "GEMINI_RELATIONSHIP_API_KEY",
    envModelName: "GEMINI_RELATIONSHIP_MODEL",
    defaultModel: "gemini-2.5-flash",
  },
  enricher: {
    envKeyName: "GEMINI_ENRICHER_API_KEY",
    envModelName: "GEMINI_ENRICHER_MODEL",
    defaultModel: "gemini-2.5-flash",
  },
};

/**
 * Collects unique Gemini API keys for a given agent role, prioritizing the
 * role-specific key first and falling back to the shared GEMINI_API_KEYS pool.
 */
export function getGeminiKeysForRole(role: GeminiAgentRole): string[] {
  const keys: string[] = [];
  const pushUnique = (raw?: string) => {
    const trimmed = raw?.trim();
    if (trimmed && !keys.includes(trimmed)) {
      keys.push(trimmed);
    }
  };

  const roleCfg = ROLE_CONFIGS[role];
  pushUnique(process.env[roleCfg.envKeyName]);

  const poolRaw = process.env.GEMINI_API_KEYS || process.env.GOOGLE_API_KEYS || "";
  for (const part of poolRaw.split(",")) {
    pushUnique(part);
  }

  pushUnique(process.env.GOOGLE_API_KEY);
  pushUnique(process.env.GEMINI_API_KEY);

  return keys;
}

/**
 * Resolves the configured Gemini model name for a specific agent role.
 */
export function getGeminiModelForRole(role: GeminiAgentRole): string {
  const roleCfg = ROLE_CONFIGS[role];
  const configured = process.env[roleCfg.envModelName]?.trim();
  if (!configured || configured === "gemini-2.5-pro") {
    return roleCfg.defaultModel;
  }
  return configured;
}

function isRateLimitOrQuotaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const record = err as Record<string, unknown>;
  const status = typeof record.status === "number" ? record.status : undefined;
  if (status === 429 || status === 503) return true;
  const message = typeof record.message === "string" ? record.message.toLowerCase() : "";
  return (
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("resource_exhausted")
  );
}

/**
 * Executes an LLM operation using the role's Gemini API key, automatically
 * rotating through the configured key pool on rate-limit/quota errors.
 */
export async function withGeminiKeyRotation<T>(
  role: GeminiAgentRole,
  operation: (llm: ChatGoogleGenerativeAI, meta: { model: string; keyIndex: number }) => Promise<T>
): Promise<T> {
  const keys = getGeminiKeysForRole(role);
  if (keys.length === 0) {
    throw new Error(
      `No Gemini API keys configured for "${role}". Set GEMINI_API_KEYS or ${ROLE_CONFIGS[role].envKeyName} in .env.local.`
    );
  }

  const primaryModel = getGeminiModelForRole(role);
  const modelsToTry =
    primaryModel === "gemini-2.5-flash"
      ? [primaryModel]
      : [primaryModel, "gemini-2.5-flash"];
  let lastError: unknown;

  for (const model of modelsToTry) {
    for (let i = 0; i < keys.length; i += 1) {
      const llm = new ChatGoogleGenerativeAI({
        apiKey: keys[i],
        model,
        temperature: 0.15,
      });

      try {
        return await operation(llm, { model, keyIndex: i });
      } catch (err) {
        lastError = err;
        const hasMoreAttempts = i < keys.length - 1 || model !== modelsToTry[modelsToTry.length - 1];
        if (isRateLimitOrQuotaError(err) && hasMoreAttempts) {
          continue;
        }
        throw err;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("All Gemini API keys failed.");
}
