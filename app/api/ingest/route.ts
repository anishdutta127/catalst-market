/**
 * /api/ingest — orchestrator route.
 *
 * GET /api/ingest?secret=<INGEST_SECRET>
 *
 * Pulls raw signals from all five Phase 7c adapters in parallel,
 * dedups against the existing live store, normalizes + validates the
 * survivors, and atomic-writes the merged result back to the JSON
 * store. Returns an IngestResult JSON payload with per-source stats
 * for debugging.
 *
 * Auth: a single shared secret in the INGEST_SECRET env var. Missing
 * or wrong → 401. The endpoint is rate-controlled by being unguessable;
 * for production this should be hidden behind a Vercel cron or a
 * Cloudflare worker rather than left open.
 *
 * Tests treat this route as a pure function over its dependencies —
 * fetch is mocked one layer down (lib/ingest/adapters/_fetch.ts) and
 * the JSON store is the real disk-backed store with file cleanup
 * between tests.
 */

import { writeLiveStories, readLiveStories } from "@/lib/ingest/store";
import { deduplicateSignals } from "@/lib/ingest/dedup";
import { normalizeSignal } from "@/lib/ingest/normalize";
import { validateStory } from "@/lib/ingest/validate";
import {
  fetchCrunchbaseRSS,
  fetchGitHubTrending,
  fetchHackerNews,
  fetchLayoffs,
  fetchProductHunt,
} from "@/lib/ingest/adapters";
import type { IngestResult, IngestSourceStat, RawSignal } from "@/lib/ingest/types";
import type { AnyStory, Source } from "@/lib/types/story";

// Disable any cache layers — this is a write endpoint.
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AdapterEntry {
  source: Source;
  fetch: () => Promise<RawSignal[]>;
}

const ADAPTERS: ReadonlyArray<AdapterEntry> = [
  { source: "hackernews", fetch: fetchHackerNews },
  { source: "producthunt", fetch: fetchProductHunt },
  { source: "github-trending", fetch: fetchGitHubTrending },
  { source: "crunchbase", fetch: fetchCrunchbaseRSS },
  { source: "layoffsfyi", fetch: fetchLayoffs },
];

export async function GET(request: Request): Promise<Response> {
  // 1. Auth
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const expected = process.env.INGEST_SECRET;
  if (!expected || secret !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();

  // 2. Existing IDs for dedup. Key shape matches dedup.ts (`source-sourceId`).
  const existing = readLiveStories();
  const existingIds = new Set(
    existing.map((s) => `${s.source}-${s.sourceId ?? s.id}`),
  );

  // 3. Fan-out — Promise.allSettled so a single adapter rejection
  // can't fail the route. Adapter contract says they don't throw, but
  // settled-not-all is the belt-and-braces pattern.
  const results = await Promise.allSettled(
    ADAPTERS.map((a) => a.fetch()),
  );

  // 4. Per-source stats + collect raw signals.
  const sources: Partial<Record<Source, IngestSourceStat>> = {};
  const allRaw: RawSignal[] = [];
  results.forEach((result, i) => {
    const src = ADAPTERS[i]!.source;
    if (result.status === "fulfilled") {
      sources[src] = { fetched: result.value.length, inserted: 0 };
      allRaw.push(...result.value);
    } else {
      const reason =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason ?? "unknown");
      sources[src] = { fetched: 0, inserted: 0, error: reason };
    }
  });

  // 5. Dedup
  const fresh = deduplicateSignals(allRaw, existingIds);

  // 6. Normalize (skip nulls)
  const normalized: AnyStory[] = [];
  for (const raw of fresh) {
    const story = normalizeSignal(raw);
    if (story !== null) normalized.push(story);
  }

  // 7. Validate (skip + warn)
  const valid: AnyStory[] = [];
  for (const story of normalized) {
    const r = validateStory(story);
    if (r.valid) {
      valid.push(story);
    } else {
      console.warn(`[ingest] skipping invalid ${story.id}: ${r.reason}`);
    }
  }

  // 8. Per-source insertion counts (now that we know which survived).
  for (const story of valid) {
    const stat = sources[story.source];
    if (stat) stat.inserted += 1;
  }

  // 9. Write merged store. The store handles dedup-by-id, sort, and
  // the LIVE_STORIES_MAX cap.
  writeLiveStories(valid);

  const payload: IngestResult = {
    inserted: valid.length,
    skipped: fresh.length - valid.length,
    errors: Object.entries(sources)
      .filter(([, v]) => v?.error)
      .map(([k, v]) => `${k}: ${v?.error}`),
    duration_ms: Date.now() - start,
    sources,
  };

  return Response.json(payload);
}
