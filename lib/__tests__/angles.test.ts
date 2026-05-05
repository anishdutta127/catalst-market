import { describe, expect, test } from "bun:test";
import type {
  Industry,
  Mood,
  Story,
  StoryType,
} from "../types/story";
import { getAngles } from "../angles";

const baseFields = {
  title: "Test story",
  microBullets: ["a", "b", "c"],
  whyNow: "now",
  primaryMood: "blowing-up" as Mood,
  moods: ["blowing-up"] as Mood[],
  stage: "builders" as const,
  industry: "devtools" as Industry,
  region: "global" as const,
  source: "seed" as const,
  createdAt: "2026-05-02T00:00:00Z",
  verified: true,
};

const fixtures: { [K in StoryType]: () => Story<K> } = {
  funding: () => ({
    ...baseFields,
    id: "fund-1",
    type: "funding",
    headlineNumber: { value: 100, unit: "M", format: "currency" },
    details: { amountUsd: 100_000_000, round: "Series B", investors: [] },
  }),
  launch: () => ({
    ...baseFields,
    id: "launch-1",
    type: "launch",
    headlineNumber: null,
    details: { productName: "Test", productUrl: "https://t.example" },
  }),
  ai: () => ({
    ...baseFields,
    id: "ai-1",
    type: "ai",
    industry: "ai",
    headlineNumber: null,
    details: { modelName: "Test Model" },
  }),
  ma: () => ({
    ...baseFields,
    id: "ma-1",
    type: "ma",
    headlineNumber: null,
    details: { acquirer: "A", acquired: "B", dealType: "acquisition" },
  }),
  ipo: () => ({
    ...baseFields,
    id: "ipo-1",
    type: "ipo",
    headlineNumber: { value: 5, unit: "B", format: "currency" },
    details: {
      ticker: "TEST",
      exchange: "NASDAQ",
      marketCapUsd: 5_000_000_000,
    },
  }),
  milestone: () => ({
    ...baseFields,
    id: "ms-1",
    type: "milestone",
    headlineNumber: null,
    details: { metric: "ARR" },
  }),
  founder: () => ({
    ...baseFields,
    id: "f-1",
    type: "founder",
    headlineNumber: null,
    details: { founderName: "Test Founder" },
  }),
  os: () => ({
    ...baseFields,
    id: "os-1",
    type: "os",
    headlineNumber: { value: 1000, unit: "★", format: "plain" },
    details: { repoUrl: "https://github.com/x", stars: 1000 },
  }),
  layoff: () => ({
    ...baseFields,
    id: "lay-1",
    type: "layoff",
    headlineNumber: null,
    details: { headcountAffected: 100 },
  }),
  shutdown: () => ({
    ...baseFields,
    id: "sd-1",
    type: "shutdown",
    headlineNumber: null,
    details: { yearsOperating: 5 },
  }),
  regulatory: () => ({
    ...baseFields,
    id: "reg-1",
    type: "regulatory",
    headlineNumber: null,
    details: { jurisdiction: "EU" },
  }),
};

const ALL_TYPES: readonly StoryType[] = [
  "funding",
  "launch",
  "ai",
  "ma",
  "ipo",
  "milestone",
  "founder",
  "os",
  "layoff",
  "shutdown",
  "regulatory",
];

const BANNED_WORDS = ["leverage", "synergy", "disrupt"] as const;

const DOMAIN_NOUNS: Record<StoryType, readonly string[]> = {
  funding: ["round", "investor", "market", "valuation", "raised", "series"],
  launch: ["product", "user", "ship", "launch", "distribution", "buyer"],
  ai: ["model", "benchmark", "weights", "eval", "agent", "capability"],
  ma: ["acquirer", "acquired", "merger", "deal", "integration", "acquihire"],
  ipo: ["s-1", "ticker", "listed", "listing", "ipo", "filing", "risk"],
  milestone: ["scale", "threshold", "milestone", "arr", "users", "platform"],
  founder: ["founder", "team", "hire", "recruit", "role", "cto", "cfo", "ceo"],
  os: ["repo", "license", "open-source", "oss", "maintainer", "stars"],
  layoff: ["layoff", "headcount", "role", "team", "cut", "ic"],
  shutdown: ["shutdown", "sunset", "shut", "customer", "bankruptcy"],
  regulatory: [
    "rule",
    "regulation",
    "jurisdiction",
    "compliance",
    "ruling",
    "audit",
    "law",
    "act",
  ],
};

function wordCount(s: string): number {
  return s.trim().split(/\s+/).length;
}

// ───────────────────────────────────────────────────────────────────
// Coverage: every type returns 3 well-formed angles
// ───────────────────────────────────────────────────────────────────

describe("getAngles — coverage and shape", () => {
  for (const t of ALL_TYPES) {
    test(`${t} → returns exactly 3 angles`, () => {
      const angles = getAngles(fixtures[t]());
      expect(angles).toHaveLength(3);
    });

    test(`${t} → every angle has non-empty title/description/wedge_hint`, () => {
      const angles = getAngles(fixtures[t]());
      for (const a of angles) {
        expect(a.title.trim().length).toBeGreaterThan(0);
        expect(a.description.trim().length).toBeGreaterThan(0);
        expect(a.wedge_hint.trim().length).toBeGreaterThan(0);
      }
    });
  }
});

// ───────────────────────────────────────────────────────────────────
// Length constraints — title ≤ 8 words, description ≤ 25 words
// ───────────────────────────────────────────────────────────────────

describe("Word count constraints", () => {
  for (const t of ALL_TYPES) {
    test(`${t} → all titles ≤ 8 words`, () => {
      const angles = getAngles(fixtures[t]());
      for (const a of angles) {
        expect(wordCount(a.title)).toBeLessThanOrEqual(8);
      }
    });

    test(`${t} → all descriptions ≤ 25 words`, () => {
      const angles = getAngles(fixtures[t]());
      for (const a of angles) {
        expect(wordCount(a.description)).toBeLessThanOrEqual(25);
      }
    });
  }
});

// ───────────────────────────────────────────────────────────────────
// Editorial bans — no leverage, synergy, disrupt, exclamation points
// ───────────────────────────────────────────────────────────────────

describe("Banned content", () => {
  for (const t of ALL_TYPES) {
    test(`${t} → no banned words or "!"`, () => {
      const angles = getAngles(fixtures[t]());
      for (const a of angles) {
        const text = [a.title, a.description, a.wedge_hint]
          .join(" ")
          .toLowerCase();
        for (const w of BANNED_WORDS) {
          expect(text).not.toContain(w);
        }
        expect(text).not.toMatch(/!/);
      }
    });
  }
});

// ───────────────────────────────────────────────────────────────────
// Determinism — same input → same output
// ───────────────────────────────────────────────────────────────────

describe("Determinism", () => {
  for (const t of ALL_TYPES) {
    test(`${t} → same fixture produces identical output across two calls`, () => {
      const a = getAngles(fixtures[t]());
      const b = getAngles(fixtures[t]());
      expect(a).toEqual(b);
    });
  }
});

// ───────────────────────────────────────────────────────────────────
// Domain relevance — at least one angle per type names its domain
// ───────────────────────────────────────────────────────────────────

describe("Domain-relevant nouns", () => {
  for (const t of ALL_TYPES) {
    test(`${t} → at least one angle contains a domain-relevant noun`, () => {
      const angles = getAngles(fixtures[t]());
      const allText = angles
        .flatMap((a) => [a.title, a.description, a.wedge_hint])
        .join(" ")
        .toLowerCase();
      const hit = DOMAIN_NOUNS[t].some((noun) => allText.includes(noun));
      expect(hit).toBe(true);
    });
  }
});
