import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  LIVE_STORIES_MAX,
  LIVE_STORIES_PATH,
  clearLiveStories,
  readLiveStories,
  writeLiveStories,
} from "@/lib/ingest/store";
import { readSeedFallback } from "@/lib/db/seed-fallback";
import { SEED_STORIES } from "@/lib/seed";
import type { AnyStory } from "@/lib/types/story";

const FILE = join(process.cwd(), LIVE_STORIES_PATH);

/** Build a synthetic but valid story so tests don't need to fixture
 *  the entire seed shape. Mood/stage/industry pinned to known-valid
 *  values; type=funding so the per-type detail check passes. */
function makeStory(
  id: string,
  publishedAt: string,
  overrides: Partial<AnyStory> = {},
): AnyStory {
  return {
    id,
    type: "funding",
    title: `Story ${id}`,
    headlineNumber: { value: 1, unit: "M", format: "currency" },
    microBullets: ["one", "two", "three"],
    whyNow: "Because.",
    primaryMood: "blowing-up",
    moods: ["blowing-up"],
    stage: "builders",
    industry: "ai",
    region: "global",
    verified: true,
    source: "hackernews",
    sourceUrl: "https://example.com",
    sourceId: id,
    createdAt: publishedAt,
    publishedAt,
    details: {
      amountUsd: 1_000_000,
      round: "Seed",
      investors: [],
    },
    ...overrides,
  } as AnyStory;
}

beforeEach(() => {
  // Start each test from a clean slate. Use unlinkSync so the "missing
  // file" path is exercised by readLiveStories tests too.
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

describe("readLiveStories — failure modes", () => {
  test("returns [] when file is missing", () => {
    expect(existsSync(FILE)).toBe(false);
    expect(readLiveStories()).toEqual([]);
  });

  test("returns [] when file is empty", () => {
    writeFileSync(FILE, "", "utf8");
    expect(readLiveStories()).toEqual([]);
  });

  test("returns [] when file contains invalid JSON (does not throw)", () => {
    writeFileSync(FILE, "{not json", "utf8");
    expect(() => readLiveStories()).not.toThrow();
    expect(readLiveStories()).toEqual([]);
  });

  test("returns [] when file is JSON but not an array", () => {
    writeFileSync(FILE, '{"hello":"world"}', "utf8");
    expect(readLiveStories()).toEqual([]);
  });

  test("drops invalid rows but keeps the well-formed ones", () => {
    const valid = makeStory("a", "2026-05-04T00:00:00Z");
    const invalid = { id: "b", type: "not-a-real-type" };
    writeFileSync(FILE, JSON.stringify([valid, invalid]), "utf8");
    const got = readLiveStories();
    expect(got.length).toBe(1);
    expect(got[0]?.id).toBe("a");
  });
});

describe("writeLiveStories — merge + dedup + cap", () => {
  test("writes a fresh array when the file does not yet exist", () => {
    const a = makeStory("a", "2026-05-04T00:00:00Z");
    writeLiveStories([a]);
    const got = readLiveStories();
    expect(got.length).toBe(1);
    expect(got[0]?.id).toBe("a");
  });

  test("dedups by id (new wins on conflict)", () => {
    const old = makeStory("a", "2026-05-01T00:00:00Z", {
      title: "Old version",
    });
    const updated = makeStory("a", "2026-05-04T00:00:00Z", {
      title: "New version",
    });
    writeLiveStories([old]);
    writeLiveStories([updated]);
    const got = readLiveStories();
    expect(got.length).toBe(1);
    expect(got[0]?.title).toBe("New version");
  });

  test("sorts by publishedAt desc", () => {
    const a = makeStory("a", "2026-05-01T00:00:00Z");
    const b = makeStory("b", "2026-05-04T00:00:00Z");
    const c = makeStory("c", "2026-05-02T00:00:00Z");
    writeLiveStories([a, b, c]);
    const got = readLiveStories();
    expect(got.map((s) => s.id)).toEqual(["b", "c", "a"]);
  });

  test("trims to LIVE_STORIES_MAX, keeping the newest", () => {
    const N = LIVE_STORIES_MAX + 5;
    const stories: AnyStory[] = [];
    for (let i = 0; i < N; i++) {
      // i=0 is oldest, i=N-1 is newest.
      const day = String(i % 28 + 1).padStart(2, "0");
      const month = String(Math.floor(i / 28) + 1).padStart(2, "0");
      const ts = `2025-${month}-${day}T00:00:${String(i % 60).padStart(2, "0")}Z`;
      stories.push(makeStory(`s${i}`, ts));
    }
    // Sort sample timestamps to know which 200 are newest BEFORE writing.
    const expectedNewestIds = [...stories]
      .sort((a, b) => Date.parse(b.publishedAt!) - Date.parse(a.publishedAt!))
      .slice(0, LIVE_STORIES_MAX)
      .map((s) => s.id);
    writeLiveStories(stories);
    const got = readLiveStories();
    expect(got.length).toBe(LIVE_STORIES_MAX);
    expect(got.map((s) => s.id)).toEqual(expectedNewestIds);
  });

  test("persists across read/write cycles", () => {
    writeLiveStories([makeStory("a", "2026-05-04T00:00:00Z")]);
    writeLiveStories([makeStory("b", "2026-05-05T00:00:00Z")]);
    const got = readLiveStories();
    expect(got.length).toBe(2);
    expect(new Set(got.map((s) => s.id))).toEqual(new Set(["a", "b"]));
  });

  test("written file is the same JSON shape readLiveStories will accept", () => {
    const a = makeStory("a", "2026-05-04T00:00:00Z");
    writeLiveStories([a]);
    const raw = readFileSync(FILE, "utf8");
    const parsed = JSON.parse(raw);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].id).toBe("a");
  });
});

describe("clearLiveStories", () => {
  test("empties the file (subsequent readLiveStories returns [])", () => {
    writeLiveStories([makeStory("a", "2026-05-04T00:00:00Z")]);
    expect(readLiveStories().length).toBe(1);
    clearLiveStories();
    expect(readLiveStories()).toEqual([]);
  });

  test("after clear, the on-disk content is the empty-array literal", () => {
    writeLiveStories([makeStory("a", "2026-05-04T00:00:00Z")]);
    clearLiveStories();
    const raw = readFileSync(FILE, "utf8");
    expect(raw.trim()).toBe("[]");
  });
});

describe("readSeedFallback — last-line guarantee", () => {
  test("returns the seed array (>= 20 stories)", () => {
    const seed = readSeedFallback();
    expect(seed.length).toBeGreaterThanOrEqual(20);
    expect(seed.length).toBe(SEED_STORIES.length);
  });

  test("seed has the expected first story (BLR cluster)", () => {
    const seed = readSeedFallback();
    // The seed always starts with Zepto today; if we re-order the seed,
    // update this assertion intentionally.
    expect(seed[0]?.id).toBe("zepto-series-f-2026");
  });

  test("returns a fresh array (callers can mutate without affecting the source)", () => {
    const a = readSeedFallback();
    const b = readSeedFallback();
    expect(a).not.toBe(b); // different references
    expect(a).toEqual(b); // same content
  });
});
