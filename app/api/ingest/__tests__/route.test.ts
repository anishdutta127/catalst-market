import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { LIVE_STORIES_PATH, readLiveStories } from "@/lib/ingest/store";
import type { RawSignal } from "@/lib/ingest/types";

const FILE = join(process.cwd(), LIVE_STORIES_PATH);
const TEST_SECRET = "test-secret-please-ignore";

/**
 * Per-test fixtures: an array of fixture RawSignals each adapter's
 * mocked fetch returns. The orchestrator route imports the adapter
 * functions via lib/ingest/adapters, so we mock the per-source
 * module rather than the route file itself.
 */
let hnReturn: RawSignal[] = [];
let phReturn: RawSignal[] = [];
let ghReturn: RawSignal[] = [];
let cbReturn: RawSignal[] = [];
let lfReturn: RawSignal[] = [];
let throwOn: Set<string> = new Set();

mock.module("@/lib/ingest/adapters/hackernews", () => ({
  fetchSignals: async () => {
    if (throwOn.has("hn")) throw new Error("hn went boom");
    return hnReturn;
  },
}));
mock.module("@/lib/ingest/adapters/producthunt", () => ({
  fetchSignals: async () => {
    if (throwOn.has("ph")) throw new Error("ph went boom");
    return phReturn;
  },
}));
mock.module("@/lib/ingest/adapters/github-trending", () => ({
  fetchSignals: async () => {
    if (throwOn.has("gh")) throw new Error("gh went boom");
    return ghReturn;
  },
}));
mock.module("@/lib/ingest/adapters/crunchbase-rss", () => ({
  fetchSignals: async () => {
    if (throwOn.has("cb")) throw new Error("cb went boom");
    return cbReturn;
  },
  parseRssToSignals: () => [],
}));
mock.module("@/lib/ingest/adapters/layoffsfyi", () => ({
  fetchSignals: async () => {
    if (throwOn.has("lf")) throw new Error("lf went boom");
    return lfReturn;
  },
}));

// Import AFTER mocks so the route picks up the mocked adapters.
const { GET } = await import("../route");

beforeEach(() => {
  hnReturn = [];
  phReturn = [];
  ghReturn = [];
  cbReturn = [];
  lfReturn = [];
  throwOn = new Set();
  process.env.INGEST_SECRET = TEST_SECRET;
  if (existsSync(FILE)) {
    try {
      unlinkSync(FILE);
    } catch {
      /* ignore */
    }
  }
});

afterEach(() => {
  if (existsSync(FILE)) {
    try {
      unlinkSync(FILE);
    } catch {
      /* ignore */
    }
  }
});

function makeRequest(secret: string | null): Request {
  const url = secret === null
    ? "http://localhost/api/ingest"
    : `http://localhost/api/ingest?secret=${encodeURIComponent(secret)}`;
  return new Request(url);
}

function makeSignal(overrides: Partial<RawSignal>): RawSignal {
  return {
    sourceId: overrides.sourceId ?? "id",
    source: overrides.source ?? "hackernews",
    title: overrides.title ?? "Acme raises $20M Series A",
    url: overrides.url ?? "https://example.com",
    description:
      overrides.description ??
      "Series A funding round led by Investor Co. The team is shipping fast.",
    publishedAt: overrides.publishedAt ?? "2026-05-04T00:00:00Z",
    rawData: overrides.rawData ?? {},
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

describe("/api/ingest — auth", () => {
  test("returns 401 when secret is missing", async () => {
    const res = await GET(makeRequest(null));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  test("returns 401 when secret is wrong", async () => {
    const res = await GET(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  test("returns 401 when INGEST_SECRET env is unset (no bypass)", async () => {
    const before = process.env.INGEST_SECRET;
    delete process.env.INGEST_SECRET;
    const res = await GET(makeRequest(TEST_SECRET));
    expect(res.status).toBe(401);
    process.env.INGEST_SECRET = before;
  });

  test("returns 200 when secret matches", async () => {
    const res = await GET(makeRequest(TEST_SECRET));
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Adapter dispatch
// ─────────────────────────────────────────────────────────────────────────────

describe("/api/ingest — adapter dispatch", () => {
  test("calls all 5 adapters and aggregates per-source stats", async () => {
    hnReturn = [makeSignal({ sourceId: "h1", source: "hackernews" })];
    phReturn = [makeSignal({ sourceId: "p1", source: "producthunt" })];
    ghReturn = [
      makeSignal({
        sourceId: "g1",
        source: "github-trending",
        title: "★ acme/x — A toolkit",
      }),
    ];
    cbReturn = [makeSignal({ sourceId: "c1", source: "crunchbase" })];
    lfReturn = [
      makeSignal({
        sourceId: "l1",
        source: "layoffsfyi",
        title: "Acme lays off 500 employees",
      }),
    ];
    const res = await GET(makeRequest(TEST_SECRET));
    const body = await res.json();
    expect(body.sources.hackernews?.fetched).toBe(1);
    expect(body.sources.producthunt?.fetched).toBe(1);
    expect(body.sources["github-trending"]?.fetched).toBe(1);
    expect(body.sources.crunchbase?.fetched).toBe(1);
    expect(body.sources.layoffsfyi?.fetched).toBe(1);
  });

  test("a single adapter rejection does NOT crash the route", async () => {
    hnReturn = [makeSignal({ sourceId: "h1", source: "hackernews" })];
    throwOn.add("ph");
    const res = await GET(makeRequest(TEST_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sources.producthunt?.error).toContain("ph went boom");
    expect(body.sources.hackernews?.fetched).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline (normalize + validate + write)
// ─────────────────────────────────────────────────────────────────────────────

describe("/api/ingest — pipeline", () => {
  test("inserts valid normalized stories into the live store", async () => {
    hnReturn = [
      makeSignal({
        sourceId: "good-1",
        source: "hackernews",
        title: "Acme raises $20M Series A",
      }),
    ];
    const res = await GET(makeRequest(TEST_SECRET));
    const body = await res.json();
    expect(body.inserted).toBe(1);
    const stored = readLiveStories();
    expect(stored.length).toBe(1);
    expect(stored[0]?.id).toBe("hackernews-good-1");
  });

  test("skips signals that normalize returns null for (e.g. title too short)", async () => {
    hnReturn = [
      makeSignal({ sourceId: "short", source: "hackernews", title: "x" }),
    ];
    const res = await GET(makeRequest(TEST_SECRET));
    const body = await res.json();
    expect(body.inserted).toBe(0);
    expect(readLiveStories().length).toBe(0);
  });

  test("dedups against existing live store", async () => {
    // Pre-seed the live store with one story.
    hnReturn = [
      makeSignal({
        sourceId: "dup-1",
        source: "hackernews",
        title: "Acme raises $20M Series A",
      }),
    ];
    await GET(makeRequest(TEST_SECRET));
    expect(readLiveStories().length).toBe(1);

    // Same signal again on a second call → no insertion.
    const res2 = await GET(makeRequest(TEST_SECRET));
    const body2 = await res2.json();
    expect(body2.inserted).toBe(0);
    expect(readLiveStories().length).toBe(1);
  });

  test("returns the IngestResult shape", async () => {
    hnReturn = [
      makeSignal({
        sourceId: "shape-1",
        source: "hackernews",
        title: "Acme raises $20M Series A",
      }),
    ];
    const res = await GET(makeRequest(TEST_SECRET));
    const body = await res.json();
    expect(typeof body.inserted).toBe("number");
    expect(typeof body.skipped).toBe("number");
    expect(Array.isArray(body.errors)).toBe(true);
    expect(typeof body.duration_ms).toBe("number");
    expect(typeof body.sources).toBe("object");
  });

  test("per-source 'inserted' counter reflects what actually wrote", async () => {
    hnReturn = [
      makeSignal({
        sourceId: "ok-1",
        source: "hackernews",
        title: "Acme raises $20M Series A",
      }),
      // This second one should be skipped (title too short)
      makeSignal({
        sourceId: "no-1",
        source: "hackernews",
        title: "x",
      }),
    ];
    const res = await GET(makeRequest(TEST_SECRET));
    const body = await res.json();
    expect(body.sources.hackernews?.fetched).toBe(2);
    expect(body.sources.hackernews?.inserted).toBe(1);
  });

  test("zero signals from all adapters → 0 inserted, no file written", async () => {
    const res = await GET(makeRequest(TEST_SECRET));
    const body = await res.json();
    expect(body.inserted).toBe(0);
    // store is allowed to write [] (clears the file). Either is fine
    // — the important contract is no exception and 0 stored stories.
    expect(readLiveStories()).toEqual([]);
  });
});
