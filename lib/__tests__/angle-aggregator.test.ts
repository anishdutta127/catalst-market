import { describe, expect, test } from "bun:test";
import seedRaw from "@/content/stories.seed.json";
import { aggregateAngles } from "../angle-aggregator";
import { validateSeed } from "../seed-validate";
import type {
  AnyStory,
  FundingStory,
  Industry,
  Mood,
} from "../types/story";

const seed = validateSeed(seedRaw);

function fund(over: Partial<FundingStory>): FundingStory {
  return {
    id: over.id ?? "x",
    type: "funding",
    title: over.title ?? "Test raises money",
    headlineNumber: { value: 100, unit: "M", format: "currency" },
    microBullets: over.microBullets ?? ["bullet alpha"],
    whyNow: "x",
    primaryMood: over.primaryMood ?? ("blowing-up" as Mood),
    moods: [over.primaryMood ?? ("blowing-up" as Mood)],
    stage: "builders",
    industry: over.industry ?? ("ai" as Industry),
    region: "global",
    source: "seed",
    verified: true,
    createdAt: over.createdAt ?? "2026-05-01T00:00:00Z",
    details: {
      amountUsd: 100_000_000,
      round: "A",
      investors: ["X"],
    },
    ...over,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty + single
// ─────────────────────────────────────────────────────────────────────────────

describe("aggregateAngles — empty + single", () => {
  test("empty pool → empty list", () => {
    expect(aggregateAngles([])).toEqual([]);
  });

  test("single story produces ≤ 3 distinct angles", () => {
    const cards = aggregateAngles([fund({ id: "a" })]);
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(3);
    // Each card has ≥ 1 inspiring story
    for (const c of cards) {
      expect(c.inspiringStoryIds.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-story dedup
// ─────────────────────────────────────────────────────────────────────────────

describe("aggregateAngles — cross-story dedup by title", () => {
  test("two same-type stories share angle titles → dedup with score=2", () => {
    // Two funding stories of the same type should produce the same 3 angle
    // titles per the per-type generator in lib/angles.ts. Aggregation
    // dedups them and counts both stories as inspiring.
    const cards = aggregateAngles([
      fund({ id: "a-1", industry: "ai" }),
      fund({ id: "a-2", industry: "ai" }),
    ]);
    expect(cards.length).toBeGreaterThan(0);
    // Top card should reference both stories
    expect(cards[0]!.inspiringStoryIds.length).toBe(2);
    expect(cards[0]!.inspiringStoryIds).toEqual(
      expect.arrayContaining(["a-1", "a-2"]),
    );
  });

  test("inspiringStoryIds capped at 3 even when more inspire", () => {
    const stories: AnyStory[] = Array.from({ length: 5 }).map((_, i) =>
      fund({ id: `s-${i}`, industry: "ai" }),
    );
    const cards = aggregateAngles(stories);
    for (const c of cards) {
      expect(c.inspiringStoryIds.length).toBeLessThanOrEqual(3);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Limit + scoring
// ─────────────────────────────────────────────────────────────────────────────

describe("aggregateAngles — top-3 selection", () => {
  test("default returns ≤ 3 cards", () => {
    const cards = aggregateAngles([
      fund({ id: "a-1", industry: "ai" }),
      fund({ id: "a-2", industry: "ai" }),
      fund({ id: "a-3", industry: "ai" }),
      fund({ id: "f-1", industry: "fintech" }),
    ]);
    expect(cards.length).toBeLessThanOrEqual(3);
  });

  test("limit override is honored", () => {
    const cards = aggregateAngles(
      [
        fund({ id: "a-1", industry: "ai" }),
        fund({ id: "f-1", industry: "fintech" }),
      ],
      { limit: 1 },
    );
    expect(cards.length).toBe(1);
  });

  test("higher-score angles surface first", () => {
    // 3 AI fund stories → 3 angles each, dedup by title → 3 cards each
    // with score=3. 1 fintech story → 3 angles each with score=1. AI
    // angles should rank first.
    const stories: AnyStory[] = [
      fund({ id: "a-1", industry: "ai" }),
      fund({ id: "a-2", industry: "ai" }),
      fund({ id: "a-3", industry: "ai" }),
      fund({ id: "f-1", industry: "fintech" }),
    ];
    const cards = aggregateAngles(stories);
    // All top-3 should be AI angles
    for (const c of cards) {
      expect(c.industry).toBe("ai");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tie-breaking
// ─────────────────────────────────────────────────────────────────────────────

describe("aggregateAngles — ties broken deterministically", () => {
  test("equal score → industry signal count desc breaks the tie", () => {
    // 1 AI story + 1 fintech story. Their angles all have score=1. With
    // a tie at score, the aggregator falls back to industry signal count
    // (also tied at 1) then to title lex. We just verify the result is
    // deterministic across runs.
    const stories: AnyStory[] = [
      fund({ id: "a-1", industry: "ai" }),
      fund({ id: "f-1", industry: "fintech" }),
    ];
    const a = aggregateAngles(stories);
    const b = aggregateAngles(stories);
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Card shape
// ─────────────────────────────────────────────────────────────────────────────

describe("aggregateAngles — card shape", () => {
  test("each card has all required fields", () => {
    const cards = aggregateAngles([fund({ id: "a-1" })]);
    for (const c of cards) {
      expect(typeof c.id).toBe("string");
      expect(c.id.startsWith("angle-")).toBe(true);
      expect(typeof c.title).toBe("string");
      expect(typeof c.description).toBe("string");
      expect(typeof c.wedgeHint).toBe("string");
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.description.length).toBeGreaterThan(0);
      expect(c.wedgeHint.length).toBeGreaterThan(0);
      expect(c.inspiringStoryIds.length).toBeGreaterThan(0);
      expect(typeof c.industry).toBe("string");
      expect(typeof c.primaryMood).toBe("string");
    }
  });

  test("id is kebab-case derived from title", () => {
    const cards = aggregateAngles([fund({ id: "a-1" })]);
    for (const c of cards) {
      expect(c.id).toMatch(/^angle-[a-z0-9-]+$/);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Production seed
// ─────────────────────────────────────────────────────────────────────────────

describe("aggregateAngles — production seed", () => {
  test("returns 3 cards for the 20-story seed", () => {
    const cards = aggregateAngles(seed);
    expect(cards.length).toBe(3);
  });

  test("every inspiringStoryIds entry is a real seed id", () => {
    const cards = aggregateAngles(seed);
    const seedIds = new Set(seed.map((s) => s.id));
    for (const c of cards) {
      for (const sid of c.inspiringStoryIds) {
        expect(seedIds.has(sid)).toBe(true);
      }
    }
  });
});
