import { describe, expect, test } from "bun:test";
import type {
  AIStory,
  AnyStory,
  FounderStory,
  FundingStory,
  Industry,
  LayoffStory,
  Mood,
  Story,
  StoryType,
} from "../types/story";
import { deriveHeadline } from "../headline";

/**
 * Universal fields shared by every story shape under test. Spread into
 * each fixture so the tests focus on the discriminated `type` + `details`,
 * not on boilerplate.
 */
const baseFields = {
  title: "Test story",
  microBullets: ["alpha", "beta", "gamma"],
  whyNow: "because the market just shifted",
  primaryMood: "blowing-up" as Mood,
  moods: ["blowing-up"] as Mood[],
  stage: "builders" as const,
  industry: "devtools" as Industry,
  region: "global" as const,
  source: "seed" as const,
  createdAt: "2026-05-02T00:00:00Z",
  verified: true,
};

// ───────────────────────────────────────────────────────────────────
// Discriminated-shape parsing
// ───────────────────────────────────────────────────────────────────

describe("Story — discriminated shape parsing", () => {
  test("FundingStory accepts funding-shaped details", () => {
    const s: FundingStory = {
      ...baseFields,
      id: "anysphere-c",
      type: "funding",
      headlineNumber: { value: 900, unit: "M", format: "currency" },
      details: {
        amountUsd: 900_000_000,
        round: "Series C",
        investors: ["Thrive Capital", "Andreessen Horowitz"],
        valuation: 9_400_000_000,
        leadInvestor: "Thrive Capital",
      },
    };
    expect(s.type).toBe("funding");
    expect(s.details.round).toBe("Series C");
    expect(s.details.amountUsd).toBe(900_000_000);
    expect(s.details.investors).toHaveLength(2);
  });

  test("AIStory accepts AI-shaped details", () => {
    const s: AIStory = {
      ...baseFields,
      id: "deepseek-r3",
      type: "ai",
      industry: "ai",
      headlineNumber: { value: 40, unit: "×", format: "plain" },
      details: {
        modelName: "DeepSeek R3",
        benchmark: "AIME",
        costRatio: 40,
        weightsLicense: "MIT",
      },
    };
    expect(s.type).toBe("ai");
    expect(s.details.modelName).toBe("DeepSeek R3");
    expect(s.details.costRatio).toBe(40);
  });

  test("FounderStory has headlineNumber === null", () => {
    const s: FounderStory = {
      ...baseFields,
      id: "liang",
      type: "founder",
      headlineNumber: null,
      details: { founderName: "Liang Wenfeng" },
    };
    expect(s.headlineNumber).toBeNull();
  });

  test("LayoffStory headlineNumber.unit === \"people\"", () => {
    const s: LayoffStory = {
      ...baseFields,
      id: "bigco-q1",
      type: "layoff",
      headlineNumber: { value: 1200, unit: "people", format: "plain" },
      details: { headcountAffected: 1200, percentOfWorkforce: 8 },
    };
    expect(s.headlineNumber).not.toBeNull();
    expect(s.headlineNumber?.unit).toBe("people");
    expect(s.headlineNumber?.value).toBe(1200);
  });

  test("\"india-shipping\" is valid as both Mood and Industry independently", () => {
    const asMood: Mood = "india-shipping";
    const asIndustry: Industry = "india-shipping";
    // Same string value, distinct type spaces — both must compile.
    expect(asMood).toBe("india-shipping");
    expect(asIndustry).toBe("india-shipping");
  });
});

// ───────────────────────────────────────────────────────────────────
// deriveHeadline — per-type rules
// ───────────────────────────────────────────────────────────────────

describe("deriveHeadline — per-type rules", () => {
  test("funding → derives from details.amountUsd, currency format (M scale)", () => {
    const s = makeStory("funding", {
      amountUsd: 900_000_000,
      round: "Series C",
      investors: [],
    });
    expect(deriveHeadline(s)).toEqual({
      value: 900,
      unit: "M",
      format: "currency",
    });
  });

  test("funding → values ≥ $1B render as B with one decimal", () => {
    const s = makeStory("funding", {
      amountUsd: 9_400_000_000,
      round: "Series C",
      investors: [],
    });
    expect(deriveHeadline(s)).toEqual({
      value: 9.4,
      unit: "B",
      format: "currency",
    });
  });

  test("ai → costRatio takes priority, returns × plain", () => {
    const s = makeStory("ai", {
      modelName: "R3",
      benchmarkGain: 12,
      costRatio: 40,
    });
    expect(deriveHeadline(s)).toEqual({
      value: 40,
      unit: "×",
      format: "plain",
    });
  });

  test("ai → benchmarkGain when no costRatio, pts plain", () => {
    const s = makeStory("ai", {
      modelName: "R3",
      benchmarkGain: 12,
    });
    expect(deriveHeadline(s)).toEqual({
      value: 12,
      unit: "pts",
      format: "plain",
    });
  });

  test("ai → null when neither benchmarkGain nor costRatio is set", () => {
    const s = makeStory("ai", { modelName: "R3" });
    expect(deriveHeadline(s)).toBeNull();
  });

  test("founder → null (face is the hero, not a number)", () => {
    const s = makeStory("founder", { founderName: "Anyone" });
    expect(deriveHeadline(s)).toBeNull();
  });

  test("layoff → { headcountAffected, 'people', 'plain' }", () => {
    const s = makeStory("layoff", { headcountAffected: 1200 });
    expect(deriveHeadline(s)).toEqual({
      value: 1200,
      unit: "people",
      format: "plain",
    });
  });

  test("shutdown → years-operating-or-zero pattern", () => {
    const withYears = makeStory("shutdown", { yearsOperating: 8 });
    expect(deriveHeadline(withYears)).toEqual({
      value: 8,
      unit: "yrs",
      format: "plain",
    });

    const withoutYears = makeStory("shutdown", {});
    expect(deriveHeadline(withoutYears)).toEqual({
      value: 0,
      unit: "yrs",
      format: "plain",
    });
  });
});

// ───────────────────────────────────────────────────────────────────
// Type-level assignability — runtime no-ops, verified by `tsc --noEmit`
// ───────────────────────────────────────────────────────────────────

describe("Type assignability", () => {
  test("Story<'funding'> assigns to AnyStory without narrowing", () => {
    const f: FundingStory = {
      ...baseFields,
      id: "f1",
      type: "funding",
      headlineNumber: { value: 1, unit: "M", format: "currency" },
      details: { amountUsd: 1_000_000, round: "Seed", investors: [] },
    };
    const a: AnyStory = f; // must compile — narrow → wide is safe
    expect(a.type).toBe("funding");
  });
});

describe("Type-level negative checks (verified by tsc --noEmit)", () => {
  // The @ts-expect-error directive itself is the test: tsc fails if the
  // next line does NOT produce a type error. Runtime expectation is
  // trivial — the proof lives in `bun x tsc --noEmit`.
  test("Industry typo fails at compile time", () => {
    // @ts-expect-error — 'aviation' is not in the Industry union
    const _bad: Industry = "aviation";
    void _bad;
    expect(true).toBe(true);
  });

  test("Mood typo fails at compile time", () => {
    // @ts-expect-error — 'angry' is not a Mood
    const _bad: Mood = "angry";
    void _bad;
    expect(true).toBe(true);
  });

  test("AnyStory cannot be assigned to Story<'funding'> without narrowing", () => {
    const launch: AnyStory = {
      ...baseFields,
      id: "l1",
      type: "launch",
      headlineNumber: null,
      details: { productName: "Acme", productUrl: "https://acme.example" },
    };
    // @ts-expect-error — wide → narrow needs a runtime check first
    const _f: FundingStory = launch;
    void _f;
    expect(true).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────
// Helper: build a Story<T> with valid base fields + caller-supplied details
// ───────────────────────────────────────────────────────────────────

function makeStory<T extends StoryType>(
  type: T,
  details: Story<T>["details"],
): Story<T> {
  return {
    ...baseFields,
    id: `test-${type}`,
    type,
    // deriveHeadline doesn't read this — it derives from details. The
    // headlineNumber field is what gets stored on the persisted Story
    // (often the result of deriveHeadline at ingest), but for these tests
    // we pass null so we're only exercising the deriveHeadline rules.
    headlineNumber: null,
    details,
  } as Story<T>;
}
