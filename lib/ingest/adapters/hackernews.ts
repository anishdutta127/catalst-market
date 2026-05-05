/**
 * Hacker News adapter.
 *
 * Endpoint: https://hacker-news.firebaseio.com/v0/
 *   - GET /topstories.json → array of HN item ids
 *   - GET /item/{id}.json  → full item record
 *
 * Strategy: pull the top 60 ids, fetch the items in batches of 10
 * (Promise.allSettled per batch — a single 404 from a deleted item
 * doesn't kill the batch), then filter by:
 *   - type === "story"
 *   - score >= 80 (HN's noise floor for "this is on the front page")
 *   - has a url (we want articles, not Ask HN threads)
 *   - title matches one of our startup-vocabulary keywords
 *
 * Never throws — on any error returns []. The caller (orchestrator)
 * wraps fetchSignals in Promise.allSettled but we maintain the
 * adapter contract anyway so manual calls behave predictably.
 */

import { safeFetch } from "./_fetch";
import type { RawSignal } from "@/lib/ingest/types";

const TOP_STORIES = "https://hacker-news.firebaseio.com/v0/topstories.json";
const ITEM_URL = (id: number) =>
  `https://hacker-news.firebaseio.com/v0/item/${id}.json`;

const MAX_IDS = 60;
const BATCH_SIZE = 10;
const MIN_SCORE = 80;

// Startup vocabulary the normalizer can downstream into a typed Story.
// Case-insensitive substring matches via the regex below.
const KEYWORDS = [
  "Show HN",
  "Launch HN",
  "raises",
  "raised",
  "acquired",
  "acquires",
  "IPO",
  "open source",
  "YC",
  "funding",
  "layoffs",
  "we built",
  "open-sourcing",
  "just launched",
];
const KEYWORD_RE = new RegExp(
  KEYWORDS.map((k) => k.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|"),
  "i",
);

interface HNItem {
  id: number;
  type?: string;
  title?: string;
  url?: string;
  score?: number;
  time?: number; // unix seconds
  by?: string;
  text?: string;
}

export async function fetchSignals(): Promise<RawSignal[]> {
  const top = await safeFetch(TOP_STORIES);
  if (!top.ok) {
    console.warn(`[hn] topstories: ${top.error}`);
    return [];
  }
  let ids: number[];
  try {
    const body = await top.response.json();
    if (!Array.isArray(body)) {
      console.warn("[hn] topstories: unexpected response shape");
      return [];
    }
    // De-duplicate ids before issuing per-item fetches. The /topstories
    // feed should already be unique but an upstream glitch repeating an
    // id would otherwise produce duplicate RawSignals (which then waste
    // a dedup-pass slot downstream).
    const seen = new Set<number>();
    const unique: number[] = [];
    for (const id of body as number[]) {
      if (typeof id !== "number" || seen.has(id)) continue;
      seen.add(id);
      unique.push(id);
      if (unique.length >= MAX_IDS) break;
    }
    ids = unique;
  } catch (e) {
    console.warn(`[hn] topstories: parse failed: ${msg(e)}`);
    return [];
  }

  const items: HNItem[] = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (id): Promise<HNItem | null> => {
        const r = await safeFetch(ITEM_URL(id));
        if (!r.ok) return null;
        try {
          return (await r.response.json()) as HNItem;
        } catch {
          return null;
        }
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value !== null) items.push(r.value);
    }
  }

  const signals: RawSignal[] = [];
  for (const item of items) {
    if (item.type !== "story") continue;
    if ((item.score ?? 0) < MIN_SCORE) continue;
    if (!item.url) continue;
    if (!item.title || !KEYWORD_RE.test(item.title)) continue;
    signals.push({
      sourceId: String(item.id),
      source: "hackernews",
      title: item.title,
      url: item.url,
      description: item.text,
      publishedAt: new Date((item.time ?? 0) * 1000).toISOString(),
      rawData: item,
    });
  }
  return signals;
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export const __hnTesting = {
  TOP_STORIES,
  ITEM_URL,
  MIN_SCORE,
  KEYWORDS,
  KEYWORD_RE,
};
