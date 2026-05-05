import { describe, expect, test } from "bun:test";
import seedRaw from "@/content/stories.seed.json";
import { validateSeed } from "../seed-validate";
import {
  __heuristicsTesting,
  computeHeuristics,
  computeWeekDelta,
  formatDelta,
  padHeuristicsToCount,
  pickTopStory,
} from "../heuristics";
import type { AnyStory, FundingStory, Industry, Mood } from "../types/story";

const seed = validateSeed(seedRaw);
const NOW = new Date("2026-05-03T12:00:00Z");

function fund(over: Partial<FundingStory>): FundingStory {
  return {
    id: over.id ?? "x",
    type: "funding",
    title: over.title ?? "Test raises",
    headlineNumber: { value: 100, unit: "M", format: "currency" },
    microBullets: over.microBullets ?? ["test bullet alpha"],
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
// computeWeekDelta
// ─────────────────────────────────────────────────────────────────────────────

describe("computeWeekDelta — math", () => {
  test("prev=10, curr=12 → +0.2", () => {
    expect(computeWeekDelta(12, 10)).toBeCloseTo(0.2, 2);
  });
  test("prev=10, curr=8 → -0.2", () => {
    expect(computeWeekDelta(8, 10)).toBeCloseTo(-0.2, 2);
  });
  test("prev=0, curr=5 → Infinity (undefined as percentage)", () => {
    expect(computeWeekDelta(5, 0)).toBe(Infinity);
  });
  test("prev=0, curr=0 → 0", () => {
    expect(computeWeekDelta(0, 0)).toBe(0);
  });
  test("prev=10, curr=10 → 0", () => {
    expect(computeWeekDelta(10, 10)).toBe(0);
  });
});

describe("formatDelta — display strings", () => {
  test("+0.22 → '+22%' arrow up", () => {
    expect(formatDelta(0.22)).toEqual({ arrow: "up", label: "+22%" });
  });
  test("-0.50 → '-50%' arrow down", () => {
    expect(formatDelta(-0.5)).toEqual({ arrow: "down", label: "-50%" });
  });
  test("0 → '—' arrow flat", () => {
    expect(formatDelta(0)).toEqual({ arrow: "flat", label: "—" });
  });
  test("Infinity (from-zero) → '↑ —' arrow up", () => {
    expect(formatDelta(Infinity)).toEqual({ arrow: "up", label: "↑ —" });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// pickTopStory
// ─────────────────────────────────────────────────────────────────────────────

describe("pickTopStory — most recent wins", () => {
  test("empty → null", () => {
    expect(pickTopStory([])).toBeNull();
  });
  test("single story → that story", () => {
    const s = fund({ id: "a", createdAt: "2026-05-01T00:00:00Z" });
    expect(pickTopStory([s])?.id).toBe("a");
  });
  test("most recent wins by createdAt", () => {
    const a = fund({ id: "a", createdAt: "2026-05-01T00:00:00Z" });
    const b = fund({ id: "b", createdAt: "2026-05-02T00:00:00Z" });
    const c = fund({ id: "c", createdAt: "2026-04-30T00:00:00Z" });
    expect(pickTopStory([a, b, c])?.id).toBe("b");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeHeuristics
// ─────────────────────────────────────────────────────────────────────────────

describe("computeHeuristics — empty + single", () => {
  test("empty pool → empty list", () => {
    expect(computeHeuristics([], NOW)).toEqual([]);
  });
  test("single in-window story → 1 entry with count=1, prev=0, delta=Infinity", () => {
    const stories = [
      fund({ industry: "ai", createdAt: "2026-05-02T00:00:00Z" }),
    ];
    const result = computeHeuristics(stories, NOW);
    expect(result.length).toBe(1);
    expect(result[0]!.industry).toBe("ai");
    expect(result[0]!.signalCount).toBe(1);
    expect(result[0]!.prevSignalCount).toBe(0);
    expect(result[0]!.weekDelta).toBe(Infinity);
  });
});

describe("computeHeuristics — sorting + top-N", () => {
  test("entries sorted by signalCount descending", () => {
    const stories: AnyStory[] = [
      fund({ id: "a-1", industry: "ai", createdAt: "2026-05-01T00:00:00Z" }),
      fund({ id: "a-2", industry: "ai", createdAt: "2026-05-01T00:00:00Z" }),
      fund({ id: "a-3", industry: "ai", createdAt: "2026-05-01T00:00:00Z" }),
      fund({ id: "f-1", industry: "fintech", createdAt: "2026-05-01T00:00:00Z" }),
      fund({ id: "f-2", industry: "fintech", createdAt: "2026-05-01T00:00:00Z" }),
      fund({ id: "c-1", industry: "climate", createdAt: "2026-05-01T00:00:00Z" }),
    ];
    const result = computeHeuristics(stories, NOW);
    expect(result.map((r) => r.industry)).toEqual(["ai", "fintech", "climate"]);
  });

  test("default limit=6", () => {
    // 8 industries, each with 1 story
    const industries: Industry[] = [
      "ai", "fintech", "climate", "biotech", "defense", "consumer", "b2b", "devtools",
    ];
    const stories = industries.map((ind, i) =>
      fund({
        id: `s-${i}`,
        industry: ind,
        createdAt: "2026-05-01T00:00:00Z",
      }),
    );
    expect(computeHeuristics(stories, NOW).length).toBe(6);
  });

  test("limit override is honored", () => {
    const stories: AnyStory[] = (["ai", "fintech", "climate"] as Industry[]).map(
      (ind, i) =>
        fund({
          id: `s-${i}`,
          industry: ind,
          createdAt: "2026-05-01T00:00:00Z",
        }),
    );
    expect(computeHeuristics(stories, NOW, { limit: 2 }).length).toBe(2);
  });
});

describe("computeHeuristics — top story per industry", () => {
  test("each entry's topStory is the most recent in that industry", () => {
    const stories: AnyStory[] = [
      fund({ id: "ai-old", industry: "ai", createdAt: "2026-04-30T00:00:00Z" }),
      fund({ id: "ai-new", industry: "ai", createdAt: "2026-05-02T00:00:00Z" }),
      fund({ id: "ai-mid", industry: "ai", createdAt: "2026-05-01T00:00:00Z" }),
    ];
    const result = computeHeuristics(stories, NOW);
    expect(result[0]!.topStory?.id).toBe("ai-new");
  });

  test("topStory.oneLine prefers first microBullet, falls back to title", () => {
    const stories = [
      fund({
        id: "with-bullets",
        microBullets: ["zinger one-liner"],
        industry: "ai",
        createdAt: "2026-05-01T00:00:00Z",
      }),
    ];
    const result = computeHeuristics(stories, NOW);
    expect(result[0]!.topStory?.oneLine).toBe("zinger one-liner");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeHeuristics — week delta
// ─────────────────────────────────────────────────────────────────────────────

describe("computeHeuristics — week delta against prior window", () => {
  test("3 current + 2 prior → delta = +50% (within tolerance)", () => {
    const stories: AnyStory[] = [
      // current window (within 7d of now)
      fund({ id: "c1", industry: "ai", createdAt: "2026-05-01T00:00:00Z" }),
      fund({ id: "c2", industry: "ai", createdAt: "2026-05-02T00:00:00Z" }),
      fund({ id: "c3", industry: "ai", createdAt: "2026-05-03T00:00:00Z" }),
      // prior window (7-14d ago)
      fund({ id: "p1", industry: "ai", createdAt: "2026-04-25T00:00:00Z" }),
      fund({ id: "p2", industry: "ai", createdAt: "2026-04-22T00:00:00Z" }),
    ];
    const result = computeHeuristics(stories, NOW);
    expect(result[0]!.signalCount).toBe(3);
    expect(result[0]!.prevSignalCount).toBe(2);
    expect(result[0]!.weekDelta).toBeCloseTo(0.5, 2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// padHeuristicsToCount
// ─────────────────────────────────────────────────────────────────────────────

describe("padHeuristicsToCount — fill to target with placeholders", () => {
  test("empty → 6 placeholder cards", () => {
    const padded = padHeuristicsToCount([], 6);
    expect(padded.length).toBe(6);
    for (const e of padded) {
      expect(e.signalCount).toBe(0);
      expect(e.prevSignalCount).toBe(0);
      expect(e.weekDelta).toBe(0);
      expect(e.topStory).toBeNull();
    }
  });

  test("3 entries → padded to 6 with 3 placeholders", () => {
    const stories: AnyStory[] = (["ai", "fintech", "climate"] as Industry[]).map(
      (ind, i) =>
        fund({
          id: `s-${i}`,
          industry: ind,
          createdAt: "2026-05-01T00:00:00Z",
        }),
    );
    const computed = computeHeuristics(stories, NOW);
    const padded = padHeuristicsToCount(computed, 6);
    expect(padded.length).toBe(6);
    expect(padded.slice(0, 3).every((e) => e.signalCount > 0)).toBe(true);
    expect(padded.slice(3).every((e) => e.signalCount === 0)).toBe(true);
  });

  test("more than count → truncates to count", () => {
    const allIndustries = __heuristicsTesting.ALL_INDUSTRIES;
    const stories = allIndustries.map((ind, i) =>
      fund({
        id: `s-${i}`,
        industry: ind,
        createdAt: "2026-05-01T00:00:00Z",
      }),
    );
    const computed = computeHeuristics(stories, NOW, { limit: 12 });
    expect(padHeuristicsToCount(computed, 6).length).toBe(6);
  });

  test("padding industries don't duplicate present industries", () => {
    const stories: AnyStory[] = (["ai", "fintech"] as Industry[]).map(
      (ind, i) =>
        fund({
          id: `s-${i}`,
          industry: ind,
          createdAt: "2026-05-01T00:00:00Z",
        }),
    );
    const computed = computeHeuristics(stories, NOW);
    const padded = padHeuristicsToCount(computed, 6);
    const industries = new Set(padded.map((e) => e.industry));
    // 6 unique entries — no duplicates
    expect(industries.size).toBe(6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeHeuristics — against the production seed
// ─────────────────────────────────────────────────────────────────────────────

describe("computeHeuristics — production seed", () => {
  test("returns a non-empty list for the 20-story seed", () => {
    const result = computeHeuristics(seed, NOW);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(6);
  });

  test("AI is in the top-3 (seed has Sarvam + Anthropic + Mistral + Sakana + Builder)", () => {
    const result = computeHeuristics(seed, NOW);
    const top3 = result.slice(0, 3).map((r) => r.industry);
    expect(top3).toContain("ai");
  });
});
