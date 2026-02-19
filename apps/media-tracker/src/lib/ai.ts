import type { CollectionItem } from "@/lib/types";
import { getServerEnv } from "@/lib/env";

type CachedRecommendation = {
  expiresAt: number;
  results: Recommendation[];
};

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

const cache = new Map<string, CachedRecommendation>();
const rateLimitMap = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 6;
const CACHE_TTL_MS = 5 * 60_000;

export type Recommendation = {
  tmdb_id: number;
  media_type: "movie" | "tv";
  reason: string;
};

export function isRateLimited(userId: string) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  entry.count += 1;
  return false;
}

export function getCachedRecommendations(userId: string) {
  const entry = cache.get(userId);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt < Date.now()) {
    cache.delete(userId);
    return null;
  }

  return entry.results;
}

export function setCachedRecommendations(
  userId: string,
  results: Recommendation[],
) {
  cache.set(userId, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    results,
  });
}

function buildPrompt(collection: CollectionItem[]) {
  const shortlist = collection.slice(0, 50).map((item) => ({
    tmdb_id: item.tmdb_id,
    media_type: item.media_type,
    status: item.status,
  }));

  return `
You are a recommendation assistant for a personal media tracker app.
Only return valid JSON with this shape:
{"recommendations":[{"tmdb_id":number,"media_type":"movie"|"tv","reason":"string"}]}
Give exactly 5 recommendations.
Use concise reasons.
Avoid requesting or exposing personal data.

User collection summary:
${JSON.stringify(shortlist)}
`;
}

export async function generateRecommendations(collection: CollectionItem[]) {
  const env = getServerEnv();
  if (!env.AI_API_KEY) {
    return [];
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You provide media recommendations. Never output private or sensitive personal data.",
        },
        { role: "user", content: buildPrompt(collection) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("AI provider request failed.");
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return [];
  }

  try {
    const parsed = JSON.parse(content) as {
      recommendations?: Recommendation[];
    };
    return parsed.recommendations ?? [];
  } catch {
    return [];
  }
}
