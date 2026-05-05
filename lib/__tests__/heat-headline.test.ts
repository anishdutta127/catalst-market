import { describe, expect, test } from "bun:test";
import seedRaw from "@/content/stories.seed.json";
import { CITIES } from "@/components/brand/world-data";
import { computeHeat } from "../heat-headline";
import { validateSeed } from "../seed-validate";
import type { AnyStory, FundingStory, Mood } from "../types/story";

const seed = validateSeed(seedRaw);

const NOW = new Date("2026-05-03T12:00:00Z");

const noopWarn = () => {};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for synthesizing test stories
// ─────────────────────────────────────────────────────────────────────────────

function makeFunding(overrides: Partial<FundingStory>): FundingStory {
  return {
    id: overrides.id ?? "test-1",
    type: "funding",
    title: overrides.title ?? "Test Co raises money",
    headlineNumber: { value: 100, unit: "M", format: "currency" },
    microBullets: ["a", "b", "c"],
    whyNow: "x",
    primaryMood: overrides.primaryMood ?? "blowing-up",
    moods: overrides.moods ?? [overrides.primaryMood ?? "blowing-up"],
    stage: "builders",
    industry: "ai",
    region: "global",
    verified: true,
    source: "seed",
    createdAt: overrides.createdAt ?? "2026-05-01T00:00:00Z",
    lat: overrides.lat,
    lng: overrides.lng,
    details: {
      amountUsd: 100000000,
      round: "Series A",
      investors: ["X"],
    },
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// computeHeat — quiet states
// ─────────────────────────────────────────────────────────────────────────────

describe("computeHeat — quiet state", () => {
  test("empty stories array → isQuiet=true with peaceful copy", () => {
    const heat = computeHeat([], NOW, { onUnmatched: noopWarn });
    expect(heat.isQuiet).toBe(true);
    expect(heat.headline.length).toBeGreaterThan(0);
    expect(heat.headline).not.toMatch(/^Today: /);
  });

  test("all stories older than lookback → isQuiet=true", () => {
    const old = makeFunding({
      id: "ancient",
      createdAt: "2025-01-01T00:00:00Z",
      lat: CITIES.sf!.lat,
      lng: CITIES.sf!.lng,
    });
    const heat = computeHeat([old], NOW, { onUnmatched: noopWarn });
    expect(heat.isQuiet).toBe(true);
  });

  test("fewer than quietThreshold matched stories → isQuiet=true", () => {
    const blr = CITIES.bangalore!;
    const stories = [
      makeFunding({ id: "1", lat: blr.lat, lng: blr.lng, createdAt: "2026-05-02T00:00:00Z" }),
      makeFunding({ id: "2", lat: blr.lat, lng: blr.lng, createdAt: "2026-05-02T00:00:00Z" }),
    ];
    const heat = computeHeat(stories, NOW, { quietThreshold: 3, onUnmatched: noopWarn });
    expect(heat.isQuiet).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeHeat — populated state
// ─────────────────────────────────────────────────────────────────────────────

describe("computeHeat — Bangalore cluster headline", () => {
  test("14 BLR stories in last 24h → Bangalore as hot, 14 in headline", () => {
    const blr = CITIES.bangalore!;
    const stories: AnyStory[] = [];
    for (let i = 0; i < 14; i++) {
      stories.push(
        makeFunding({
          id: `blr-${i}`,
          lat: blr.lat,
          lng: blr.lng,
          createdAt: "2026-05-03T08:00:00Z",
        }),
      );
    }
    const heat = computeHeat(stories, NOW, { onUnmatched: noopWarn });
    expect(heat.isQuiet).toBe(false);
    expect(heat.headline).toContain("Bangalore");
    expect(heat.headline).toContain("14");
  });

  test("seed produces a Bangalore-led narrative for 'today'", () => {
    const heat = computeHeat(seed, NOW, { onUnmatched: noopWarn });
    expect(heat.isQuiet).toBe(false);
    expect(heat.headline).toContain("Bangalore");
    // The 5 featured BLR stories should all surface as the top bucket
    expect(heat.stops[0]?.citySlug).toBe("bangalore");
    expect(heat.stops[0]?.storyCount).toBeGreaterThanOrEqual(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeHeat — tie-breaking
// ─────────────────────────────────────────────────────────────────────────────

describe("computeHeat — tie-breaking", () => {
  test("equal counts: city with higher max-mood-weight wins", () => {
    const sf = CITIES.sf!;
    const ldn = CITIES.london!;
    const stories: AnyStory[] = [];
    // 5 SF stories all at "blowing-up" weight 1.5 → score 7.5
    for (let i = 0; i < 5; i++) {
      stories.push(
        makeFunding({
          id: `sf-${i}`,
          lat: sf.lat,
          lng: sf.lng,
          primaryMood: "blowing-up",
          moods: ["blowing-up"],
          createdAt: "2026-05-02T00:00:00Z",
        }),
      );
    }
    // 5 London stories all at "quiet-builders" weight 0.9 → score 4.5
    for (let i = 0; i < 5; i++) {
      stories.push(
        makeFunding({
          id: `lon-${i}`,
          lat: ldn.lat,
          lng: ldn.lng,
          primaryMood: "quiet-builders",
          moods: ["quiet-builders"],
          createdAt: "2026-05-02T00:00:00Z",
        }),
      );
    }
    const heat = computeHeat(stories, NOW, { onUnmatched: noopWarn });
    expect(heat.stops[0]?.citySlug).toBe("sf");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeHeat — unmatched stories
// ─────────────────────────────────────────────────────────────────────────────

describe("computeHeat — unmatched stories don't crash", () => {
  test("story missing lat/lng → fires onUnmatched, excluded from heat", () => {
    const calls: AnyStory[] = [];
    const stories: AnyStory[] = [
      makeFunding({
        id: "no-geo",
        lat: undefined,
        lng: undefined,
        createdAt: "2026-05-02T00:00:00Z",
      }),
    ];
    const heat = computeHeat(stories, NOW, {
      onUnmatched: (s) => calls.push(s),
    });
    expect(calls.length).toBe(1);
    expect(calls[0]?.id).toBe("no-geo");
    expect(heat.isQuiet).toBe(true);
  });

  test("story at (0, 0) → fires onUnmatched, excluded", () => {
    const calls: AnyStory[] = [];
    const stories: AnyStory[] = [
      makeFunding({
        id: "atlantis",
        lat: 0,
        lng: 0,
        createdAt: "2026-05-02T00:00:00Z",
      }),
    ];
    computeHeat(stories, NOW, {
      onUnmatched: (s) => calls.push(s),
    });
    expect(calls.length).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeHeat — output shape
// ─────────────────────────────────────────────────────────────────────────────

describe("computeHeat — output shape", () => {
  test("populated output has stops in [3, 5] range when enough cities exist", () => {
    const heat = computeHeat(seed, NOW, { onUnmatched: noopWarn });
    expect(heat.stops.length).toBeGreaterThanOrEqual(3);
    expect(heat.stops.length).toBeLessThanOrEqual(5);
  });

  test("route line is exactly 3 cities joined by ' → '", () => {
    const heat = computeHeat(seed, NOW, { onUnmatched: noopWarn });
    const segments = heat.routeLine.split(" → ");
    expect(segments.length).toBe(3);
    // Each segment is a known IATA labelShort
    const labels = new Set(Object.values(CITIES).map((c) => c.labelShort));
    for (const seg of segments) {
      expect(labels.has(seg)).toBe(true);
    }
  });

  test("subline lists top 2 story-types by count for the hot city", () => {
    const heat = computeHeat(seed, NOW, { onUnmatched: noopWarn });
    expect(heat.subline).toBeDefined();
    expect(heat.subline!.length).toBeGreaterThan(0);
    // Comma-separated, at most 2 segments
    expect(heat.subline!.split(", ").length).toBeLessThanOrEqual(2);
  });

  test("padding fills stops up to minStops when only 1 city has signals", () => {
    const blr = CITIES.bangalore!;
    const stories: AnyStory[] = [];
    for (let i = 0; i < 10; i++) {
      stories.push(
        makeFunding({
          id: `blr-${i}`,
          lat: blr.lat,
          lng: blr.lng,
          createdAt: "2026-05-03T08:00:00Z",
        }),
      );
    }
    // Add older stories from other cities outside the lookback to test padding
    stories.push(
      makeFunding({
        id: "sf-old",
        lat: CITIES.sf!.lat,
        lng: CITIES.sf!.lng,
        createdAt: "2025-12-01T00:00:00Z", // outside lookback
      }),
      makeFunding({
        id: "tyo-old",
        lat: CITIES.tokyo!.lat,
        lng: CITIES.tokyo!.lng,
        createdAt: "2025-12-01T00:00:00Z",
      }),
    );
    const heat = computeHeat(stories, NOW, { onUnmatched: noopWarn, minStops: 3 });
    expect(heat.stops.length).toBeGreaterThanOrEqual(3);
    expect(heat.stops[0]?.citySlug).toBe("bangalore");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeHeat — date-hash variation is stable
// ─────────────────────────────────────────────────────────────────────────────

describe("computeHeat — same date produces identical headline", () => {
  test("repeated calls on same date return identical headline", () => {
    const a = computeHeat(seed, NOW, { onUnmatched: noopWarn });
    const b = computeHeat(seed, NOW, { onUnmatched: noopWarn });
    expect(a.headline).toBe(b.headline);
    expect(a.routeLine).toBe(b.routeLine);
  });
});

// Suppress unused-var lint for Mood import that's only used at the type level
type _MoodAlias = Mood;
