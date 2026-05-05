/**
 * Product Hunt adapter — GraphQL v2 API.
 *
 * Endpoint: https://api.producthunt.com/v2/api/graphql
 * Auth: Bearer ${PRODUCTHUNT_TOKEN} from env.
 *
 * If PRODUCTHUNT_TOKEN is missing or empty, the adapter logs a single
 * warning and returns []. It does NOT throw — the orchestrator must
 * keep running across the other 4 adapters.
 *
 * Filter: votesCount >= 30 (rough cutoff for "real launches" vs
 * the long tail of empty submissions).
 */

import { safeFetch } from "./_fetch";
import type { RawSignal } from "@/lib/ingest/types";

const ENDPOINT = "https://api.producthunt.com/v2/api/graphql";
const MIN_VOTES = 30;
const FETCH_LIMIT = 20;

interface PHTopic {
  node?: { name?: string };
}

interface PHPost {
  id?: string;
  name?: string;
  tagline?: string;
  votesCount?: number;
  website?: string;
  createdAt?: string;
  topics?: { edges?: PHTopic[] };
}

interface PHResponse {
  data?: {
    posts?: { edges?: { node?: PHPost }[] };
  };
  errors?: { message: string }[];
}

export async function fetchSignals(): Promise<RawSignal[]> {
  const token = process.env.PRODUCTHUNT_TOKEN;
  if (!token || token.trim().length === 0) {
    console.warn(
      "[ph] PRODUCTHUNT_TOKEN missing — skipping Product Hunt adapter",
    );
    return [];
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const query = `query Posts($postedAfter: DateTime!, $first: Int!) {
    posts(postedAfter: $postedAfter, first: $first) {
      edges {
        node {
          id
          name
          tagline
          votesCount
          website
          createdAt
          topics(first: 5) { edges { node { name } } }
        }
      }
    }
  }`;

  const result = await safeFetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { postedAfter: yesterday, first: FETCH_LIMIT },
    }),
  });

  if (!result.ok) {
    console.warn(`[ph] fetch failed: ${result.error}`);
    return [];
  }

  let body: PHResponse;
  try {
    body = (await result.response.json()) as PHResponse;
  } catch (e) {
    console.warn(`[ph] parse failed: ${msg(e)}`);
    return [];
  }

  if (body.errors && body.errors.length > 0) {
    console.warn(
      `[ph] graphql errors: ${body.errors.map((e) => e.message).join("; ")}`,
    );
    return [];
  }

  const edges = body.data?.posts?.edges ?? [];
  const signals: RawSignal[] = [];
  for (const edge of edges) {
    const post = edge.node;
    if (!post) continue;
    if (typeof post.votesCount !== "number" || post.votesCount < MIN_VOTES) continue;
    if (!post.id || !post.name || !post.createdAt) continue;
    const topics = (post.topics?.edges ?? [])
      .map((t) => t.node?.name)
      .filter((n): n is string => typeof n === "string");
    const description = [
      post.tagline,
      topics.length > 0 ? `Topics: ${topics.join(", ")}` : "",
    ]
      .filter((s): s is string => typeof s === "string" && s.length > 0)
      .join(". ");
    signals.push({
      sourceId: post.id,
      source: "producthunt",
      title: post.name,
      url: post.website ?? `https://www.producthunt.com/posts/${post.id}`,
      description,
      publishedAt: post.createdAt,
      rawData: { ...post, topics },
    });
  }
  return signals;
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export const __phTesting = { ENDPOINT, MIN_VOTES, FETCH_LIMIT };
