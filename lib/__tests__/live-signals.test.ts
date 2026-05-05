import { describe, expect, test } from "bun:test";
import seedRaw from "@/content/stories.seed.json";
import { validateSeed } from "../seed-validate";
import {
  buildSignalsFromStories,
  formatSignalTime,
  type SignalItem,
} from "../live-signals";
import type { AnyStory, FundingStory, Mood } from "../types/story";

const seed = validateSeed(seedRaw);

const baseFields = {
  microBullets: ["a", "b", "c"],
  whyNow: "x",
  primaryMood: "blowing-up" as Mood,
  moods: ["blowing-up"] as Mood[],
  stage: "builders" as const,
  industry: "ai" as const,
  region: "global" as const,
  source: "seed" as const,
  verified: true,
};

function fund(over: Partial<FundingStory>): FundingStory {
  return {
    id: over.id ?? "x",
    type: "funding",
    title: over.title ?? "Test Co raises money",
    headlineNumber: over.headlineNumber ?? {
      value: 100,
      unit: "M",
      format: "currency",
    },
    ...baseFields,
    createdAt: over.createdAt ?? "2026-05-01T00:00:00Z",
    lat: over.lat,
    lng: over.lng,
    details: {
      amountUsd: over.details?.amountUsd ?? 100_000_000,
      round: "Series A",
      investors: ["X"],
    },
    ...over,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// formatSignalTime
// ─────────────────────────────────────────────────────────────────────────────

describe("formatSignalTime — HH:MM 24-hour formatting", () => {
  test("midnight UTC → 00:00", () => {
    expect(formatSignalTime(new Date("2026-05-03T00:00:00Z"))).toBe("00:00");
  });

  test("11:42 UTC → 11:42", () => {
    expect(formatSignalTime(new Date("2026-05-03T11:42:00Z"))).toBe("11:42");
  });

  test("23:59 UTC → 23:59", () => {
    expect(formatSignalTime(new Date("2026-05-03T23:59:00Z"))).toBe("23:59");
  });

  test("invalid date → '--:--' (defensive)", () => {
    expect(formatSignalTime(new Date("not a date"))).toBe("--:--");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildSignalsFromStories
// ─────────────────────────────────────────────────────────────────────────────

describe("buildSignalsFromStories — sorting + limit", () => {
  test("empty array → empty signals", () => {
    expect(buildSignalsFromStories([])).toEqual([]);
  });

  test("sorts by createdAt descending (most recent first)", () => {
    const stories: AnyStory[] = [
      fund({ id: "old", createdAt: "2026-04-01T00:00:00Z" }),
      fund({ id: "new", createdAt: "2026-05-01T00:00:00Z" }),
      fund({ id: "mid", createdAt: "2026-04-15T00:00:00Z" }),
    ];
    const sigs = buildSignalsFromStories(stories);
    expect(sigs.map((s) => s.storyId)).toEqual(["new", "mid", "old"]);
  });

  test("default limit is 10", () => {
    const stories: AnyStory[] = Array.from({ length: 25 }).map((_, i) =>
      fund({
        id: `s-${i}`,
        createdAt: new Date(Date.UTC(2026, 4, i + 1)).toISOString(),
      }),
    );
    const sigs = buildSignalsFromStories(stories);
    expect(sigs.length).toBe(10);
  });

  test("respects custom limit", () => {
    const stories: AnyStory[] = Array.from({ length: 8 }).map((_, i) =>
      fund({
        id: `s-${i}`,
        createdAt: new Date(Date.UTC(2026, 4, i + 1)).toISOString(),
      }),
    );
    expect(buildSignalsFromStories(stories, { limit: 5 }).length).toBe(5);
  });
});

describe("buildSignalsFromStories — content shape", () => {
  test("every signal carries id, time, company, metricLabel, isNotable, storyId, cityShort", () => {
    const sigs = buildSignalsFromStories(seed);
    expect(sigs.length).toBe(10);
    for (const s of sigs) {
      expect(s.id).toMatch(/^sig-/);
      expect(s.time).toMatch(/^\d{2}:\d{2}$/);
      expect(s.company.length).toBeGreaterThan(0);
      expect(s.metricLabel.length).toBeGreaterThan(0);
      expect(typeof s.isNotable).toBe("boolean");
      expect(s.storyId.length).toBeGreaterThan(0);
      expect(s.cityShort.length).toBeGreaterThan(0);
    }
  });

  test("Zepto $500M signal: company='Zepto', metricLabel='$500M', isNotable=true", () => {
    const stories: AnyStory[] = [
      fund({
        id: "zepto",
        title: "Zepto raises $500M Series F at $5B",
        headlineNumber: { value: 500, unit: "M", format: "currency" },
        details: { amountUsd: 500_000_000, round: "F", investors: [] },
        lat: 12.97,
        lng: 77.59,
      }),
    ];
    const sig = buildSignalsFromStories(stories)[0]!;
    expect(sig.company).toBe("Zepto");
    expect(sig.metricLabel).toBe("$500M");
    expect(sig.isNotable).toBe(true);
    expect(sig.cityShort).toBe("BLR");
  });

  test("isNotable: $50M funding is NOT notable", () => {
    const stories: AnyStory[] = [
      fund({
        details: { amountUsd: 50_000_000, round: "Seed", investors: [] },
      }),
    ];
    expect(buildSignalsFromStories(stories)[0]!.isNotable).toBe(false);
  });

  test("isNotable: $500M funding IS notable", () => {
    const stories: AnyStory[] = [
      fund({
        details: { amountUsd: 500_000_000, round: "F", investors: [] },
      }),
    ];
    expect(buildSignalsFromStories(stories)[0]!.isNotable).toBe(true);
  });

  test("story without lat/lng → cityShort = '—'", () => {
    const stories: AnyStory[] = [fund({ lat: undefined, lng: undefined })];
    expect(buildSignalsFromStories(stories)[0]!.cityShort).toBe("—");
  });

  test("Founder story: metricLabel falls back to 'founder move'", () => {
    const stories: AnyStory[] = [
      {
        id: "f-1",
        type: "founder",
        title: "Mira Murati emerges with Thinking Machines",
        headlineNumber: null,
        ...baseFields,
        primaryMood: "founders-like-me",
        moods: ["founders-like-me"],
        createdAt: "2026-05-01T00:00:00Z",
        details: { founderName: "Mira Murati" },
      },
    ];
    expect(buildSignalsFromStories(stories)[0]!.metricLabel).toBe("founder move");
  });

  test("invalid createdAt is filtered out (no '--:--' leak)", () => {
    const stories: AnyStory[] = [
      fund({ id: "good", createdAt: "2026-05-01T00:00:00Z" }),
      fund({ id: "bad", createdAt: "not a date" }),
    ];
    const sigs = buildSignalsFromStories(stories);
    expect(sigs.length).toBe(1);
    expect(sigs[0]!.storyId).toBe("good");
  });
});

describe("buildSignalsFromStories — companyOf heuristic", () => {
  const cases: Array<readonly [string, string]> = [
    ["Zepto raises $500M Series F", "Zepto"],
    ["Anthropic ships Claude Opus 4.7", "Anthropic"],
    ["Mistral launches multimodal Le Chat", "Mistral"],
    ["Klarna files for $20B IPO on NYSE", "Klarna"],
    ["Cohere acqui-hires Replit AI team", "Cohere"],
    ["Wayve £450M Series C for autonomous driving", "Wayve £450M Series"], // no verb match → first 3 words
    ["Builder.ai files for administration", "Builder.ai"],
  ];
  for (const [title, expected] of cases) {
    test(`"${title}" → "${expected}"`, () => {
      const sig = buildSignalsFromStories([fund({ title })])[0]!;
      expect(sig.company).toBe(expected);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Determinism
// ─────────────────────────────────────────────────────────────────────────────

describe("buildSignalsFromStories — pure / deterministic", () => {
  test("same input array produces structurally equal output across calls", () => {
    const a = buildSignalsFromStories(seed);
    const b = buildSignalsFromStories(seed);
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      const sa = a[i]!;
      const sb = b[i]!;
      expect(sa.storyId).toBe(sb.storyId);
      expect(sa.metricLabel).toBe(sb.metricLabel);
      expect(sa.cityShort).toBe(sb.cityShort);
    }
  });
});

// suppress unused import lint for SignalItem (it documents the export)
type _Unused = SignalItem;
