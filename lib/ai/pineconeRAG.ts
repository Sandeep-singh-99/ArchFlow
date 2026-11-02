import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
const INDEX_NAME = process.env.PINECONE_INDEX || "portfolio-ai";

// Simple in-memory embedding cache to avoid redundant network calls
const embeddingCache = new Map<string, number[]>();

// Curated database architecture fallback knowledge when network/503 occurs
const DEFAULT_FALLBACK_KNOWLEDGE = [
  "Database Normalization (3NF): Eliminate transitive dependencies; each non-key column must depend directly on the primary key.",
  "Foreign Keys & Cascade: Ensure foreign key columns are explicitly indexed (B-Tree). Use ON DELETE CASCADE prudently to avoid unintended mass record loss.",
  "Relational Indexes: Index frequently queried foreign keys (user_id, order_id, course_id) and composite filters to eliminate sequential table scans.",
  "E-Commerce & LMS Schema Patterns: Use transactional junction tables for enrollments and order items; store snapshot purchase_price at point-in-time.",
];

async function callEmbeddingWithModel(
  genAI: GoogleGenerativeAI,
  modelName: string,
  text: string
): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.embedContent({
    content: { parts: [{ text: text.trim() }] },
    outputDimensionality: 768,
  } as any);

  return result.embedding.values;
}

// Embed query using Gemini with retry, model fallback, and in-memory cache
export async function getEmbedding(text: string): Promise<number[] | null> {
  const cleanText = text.trim();
  if (!cleanText) return null;

  // 1. Check in-memory cache
  if (embeddingCache.has(cleanText)) {
    return embeddingCache.get(cleanText)!;
  }

  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  const models = ["gemini-embedding-001", "gemini-embedding-2"];

  for (const modelName of models) {
    // Retry up to 2 times per model with backoff on 503 / 500
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const values = await callEmbeddingWithModel(genAI, modelName, cleanText);
        if (values && values.length > 0) {
          // Cache vector (limit cache size to 100 entries)
          if (embeddingCache.size > 100) {
            const firstKey = embeddingCache.keys().next().value;
            if (firstKey) embeddingCache.delete(firstKey);
          }
          embeddingCache.set(cleanText, values);
          return values;
        }
      } catch (err: any) {
        const isTransient =
          err?.message?.includes("503") ||
          err?.message?.includes("500") ||
          err?.message?.includes("429") ||
          err?.status === 503 ||
          err?.status === 429;

        if (isTransient && attempt === 0) {
          // Wait 600ms before retrying
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
        // If second attempt failed or non-transient, try next model in loop
        break;
      }
    }
  }

  return null;
}

// Retrieve knowledge documents from Pinecone with graceful fallback
export async function retrieveRelevantDocs(query: string, topK: number = 4): Promise<string[]> {
  try {
    if (!PINECONE_API_KEY || !GOOGLE_API_KEY) {
      return DEFAULT_FALLBACK_KNOWLEDGE;
    }

    const vector = await getEmbedding(query);
    if (!vector) {
      // Embedding was temporarily unavailable; use default curated database knowledge
      return DEFAULT_FALLBACK_KNOWLEDGE;
    }

    const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
    const index = pinecone.index(INDEX_NAME);

    const queryResponse = await index.query({
      vector,
      topK,
      includeMetadata: true,
    });

    const docs: string[] = [];
    if (queryResponse.matches && queryResponse.matches.length > 0) {
      for (const match of queryResponse.matches) {
        const metadata = match.metadata as any;
        if (metadata?.text) {
          docs.push(metadata.text);
        } else if (metadata?.content) {
          docs.push(metadata.content);
        } else if (metadata?.title || metadata?.description) {
          docs.push(`${metadata.title || ""}: ${metadata.description || ""}`);
        } else if (metadata) {
          docs.push(JSON.stringify(metadata));
        }
      }
    }

    return docs.length > 0 ? docs : DEFAULT_FALLBACK_KNOWLEDGE;
  } catch (error: any) {
    // Silently fall back to curated knowledge so user chat NEVER breaks on 503
    return DEFAULT_FALLBACK_KNOWLEDGE;
  }
}
