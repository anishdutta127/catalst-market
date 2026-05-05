/**
 * GitHub trending adapter — uses the public Search API (no auth).
 *
 * Endpoint: https://api.github.com/search/repositories
 * Query: repos created in the last 7 days, sorted by stars desc.
 *
 * GitHub explicitly requires a User-Agent header on every request
 * (see https://docs.github.com/en/rest/overview/resources-in-the-rest-api#user-agent-required).
 * Our shared safeFetch helper sets it automatically.
 *
 * Filter: stargazers_count >= 300 (rough cutoff for "going viral",
 * not just "someone made a repo"). 15 results is enough for the
 * dedup pass downstream — we don't want to flood the feed.
 */

import { safeFetch } from "./_fetch";
import type { RawSignal } from "@/lib/ingest/types";

const SEARCH_URL = "https://api.github.com/search/repositories";
const MIN_STARS = 300;
const PER_PAGE = 15;

interface GitHubRepo {
  id?: number;
  full_name?: string;
  name?: string;
  description?: string | null;
  html_url?: string;
  stargazers_count?: number;
  language?: string | null;
  license?: { spdx_id?: string } | null;
  created_at?: string;
  pushed_at?: string;
}

interface GitHubSearchResponse {
  items?: GitHubRepo[];
  message?: string;
}

export async function fetchSignals(): Promise<RawSignal[]> {
  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10); // YYYY-MM-DD only — GitHub's `created:` operator wants a date, not full ISO
  const url = new URL(SEARCH_URL);
  url.searchParams.set("q", `created:>${sevenDaysAgoIso}`);
  url.searchParams.set("sort", "stars");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", String(PER_PAGE));

  const result = await safeFetch(url.toString(), {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!result.ok) {
    console.warn(`[gh] fetch failed: ${result.error}`);
    return [];
  }

  let body: GitHubSearchResponse;
  try {
    body = (await result.response.json()) as GitHubSearchResponse;
  } catch (e) {
    console.warn(`[gh] parse failed: ${msg(e)}`);
    return [];
  }

  if (body.message) {
    console.warn(`[gh] api message: ${body.message}`);
    return [];
  }

  const items = body.items ?? [];
  const signals: RawSignal[] = [];
  for (const repo of items) {
    if (!repo.full_name || !repo.html_url) continue;
    if ((repo.stargazers_count ?? 0) < MIN_STARS) continue;
    const desc = repo.description?.trim() ?? "";
    signals.push({
      sourceId: repo.full_name,
      source: "github-trending",
      title: `★ ${repo.full_name}${desc.length > 0 ? ` — ${desc}` : ""}`,
      url: repo.html_url,
      description: desc.length > 0 ? desc : undefined,
      publishedAt: repo.pushed_at ?? repo.created_at ?? new Date().toISOString(),
      rawData: repo,
    });
  }
  return signals;
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export const __ghTesting = { SEARCH_URL, MIN_STARS, PER_PAGE };
