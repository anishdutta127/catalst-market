import { describe, expect, test } from "bun:test";
import {
  classifyIndustry,
  classifyMood,
  classifyStage,
  classifyType,
  normalizeSignal,
  parseFundingAmount,
  __normalizeTesting,
} from "@/lib/ingest/normalize";
import { deduplicateSignals, __dedupTesting } from "@/lib/ingest/dedup";
import { validateStory } from "@/lib/ingest/validate";
import type { RawSignal } from "@/lib/ingest/types";
import type { AnyStory, FundingStory } from "@/lib/types/story";

// ─────────────────────────────────────────────────────────────────────────────
// RawSignal fixtures
// ─────────────────────────────────────────────────────────────────────────────

function makeRaw(overrides: Partial<RawSignal>): RawSignal {
  return {
    sourceId: overrides.sourceId ?? "default-id",
    source: overrides.source ?? "hackernews",
    title: overrides.title ?? "default title that is long enough",
    url: overrides.url ?? "https://example.com",
    description: overrides.description,
    publishedAt: overrides.publishedAt ?? "2026-05-04T00:00:00Z",
    rawData: overrides.rawData ?? {},
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// classifyType — direct unit tests (decision-table coverage)
// ─────────────────────────────────────────────────────────────────────────────

describe("classifyType", () => {
  test("layoffsfyi source → 'layoff' (no title scan)", () => {
    expect(
      classifyType(
        makeRaw({ source: "layoffsfyi", title: "Acme launches a feature" }),
      ),
    ).toBe("layoff");
  });

  test("github-trending source → 'os'", () => {
    expect(
      classifyType(makeRaw({ source: "github-trending", title: "anything" })),
    ).toBe("os");
  });

  test("producthunt source → 'launch'", () => {
    expect(
      classifyType(makeRaw({ source: "producthunt", title: "anything" })),
    ).toBe("launch");
  });

  test("HN/crunchbase 'raises $X[MB]' → 'funding'", () => {
    expect(
      classifyType(
        makeRaw({ source: "hackernews", title: "Acme raises $20M Series A" }),
      ),
    ).toBe("funding");
  });

  test("HN 'acquires' → 'ma'", () => {
    expect(
      classifyType(
        makeRaw({ source: "hackernews", title: "Cisco acquires Splunk" }),
      ),
    ).toBe("ma");
  });

  test("HN 'IPO' → 'ipo'", () => {
    expect(
      classifyType(
        makeRaw({ source: "hackernews", title: "Klarna files $20B IPO" }),
      ),
    ).toBe("ipo");
  });

  test("HN 'Show HN: …' → 'launch'", () => {
    expect(
      classifyType(
        makeRaw({ source: "hackernews", title: "Show HN: a side project" }),
      ),
    ).toBe("launch");
  });

  test("HN 'open-sourcing' → 'os'", () => {
    expect(
      classifyType(
        makeRaw({ source: "hackernews", title: "We are open-sourcing X" }),
      ),
    ).toBe("os");
  });

  test("HN unrelated headline falls back to 'launch'", () => {
    expect(
      classifyType(
        makeRaw({
          source: "hackernews",
          title: "How to write better tests in 2026",
        }),
      ),
    ).toBe("launch");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// classifyIndustry
// ─────────────────────────────────────────────────────────────────────────────

describe("classifyIndustry", () => {
  test("AI keywords match", () => {
    expect(
      classifyIndustry(
        makeRaw({ title: "Anthropic ships Claude 4.7", description: "" }),
      ),
    ).toBe("ai");
  });

  test("India keyword override comes before AI", () => {
    expect(
      classifyIndustry(
        makeRaw({
          title: "Sarvam ships open-weight Indian language model",
          description: "Bangalore startup",
        }),
      ),
    ).toBe("india-shipping");
  });

  test("fintech keyword detection", () => {
    expect(
      classifyIndustry(
        makeRaw({ title: "Acme raises Series B for payments", description: "" }),
      ),
    ).toBe("fintech");
  });

  test("falls back to 'b2b' when nothing matches", () => {
    expect(
      classifyIndustry(makeRaw({ title: "A weekend project", description: "" })),
    ).toBe("b2b");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// classifyStage
// ─────────────────────────────────────────────────────────────────────────────

describe("classifyStage", () => {
  test("$B amount → empires", () => {
    expect(classifyStage(makeRaw({ title: "Acme raises $2B Series D" }))).toBe(
      "empires",
    );
  });

  test("$M > 500 → empires", () => {
    expect(
      classifyStage(makeRaw({ title: "Acme raises $900M Series C" })),
    ).toBe("empires");
  });

  test("$M 10-499 → builders", () => {
    expect(classifyStage(makeRaw({ title: "Acme raises $50M Series B" }))).toBe(
      "builders",
    );
  });

  test("'bootstrapped' keyword wins over $ amount", () => {
    expect(
      classifyStage(
        makeRaw({ title: "Bootstrapped startup hits $5M ARR" }),
      ),
    ).toBe("bootstrappers");
  });

  test("'IPO' keyword → empires", () => {
    expect(
      classifyStage(makeRaw({ title: "PhonePe files for $15B IPO" })),
    ).toBe("empires");
  });

  test("no amount, no keyword → builders fallback", () => {
    expect(classifyStage(makeRaw({ title: "Quiet announcement" }))).toBe(
      "builders",
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// classifyMood — interaction with type/industry
// ─────────────────────────────────────────────────────────────────────────────

describe("classifyMood", () => {
  test("funding $200M → big-money-moves", () => {
    expect(
      classifyMood(
        makeRaw({ title: "Acme raises $200M Series C" }),
        "funding",
        "ai",
        "empires",
      ),
    ).toBe("big-money-moves");
  });

  test("funding $20M → underdog-wins", () => {
    expect(
      classifyMood(
        makeRaw({ title: "Acme raises $20M Series A" }),
        "funding",
        "ai",
        "builders",
      ),
    ).toBe("underdog-wins");
  });

  test("layoff → quiet-builders", () => {
    expect(
      classifyMood(
        makeRaw({ title: "ByteDance lays off 1,500 from Pico" }),
        "layoff",
        "consumer",
        "empires",
      ),
    ).toBe("quiet-builders");
  });

  test("os with stars >= 2000 → blowing-up", () => {
    expect(
      classifyMood(
        makeRaw({
          title: "Trending repo",
          rawData: { stargazers_count: 5000 },
        }),
        "os",
        "devtools",
        "builders",
      ),
    ).toBe("blowing-up");
  });

  test("os < 2000 stars → copy-able-ideas", () => {
    expect(
      classifyMood(
        makeRaw({
          title: "Smaller repo",
          rawData: { stargazers_count: 500 },
        }),
        "os",
        "devtools",
        "builders",
      ),
    ).toBe("copy-able-ideas");
  });

  test("India keyword overrides type-based mood", () => {
    expect(
      classifyMood(
        makeRaw({ title: "Razorpay crosses $200M ARR in India" }),
        "milestone",
        "fintech",
        "empires",
      ),
    ).toBe("india-shipping");
  });

  test("launch + 'overnight' → overnight-rockets", () => {
    expect(
      classifyMood(
        makeRaw({ title: "Overnight viral launch hits 1M users" }),
        "launch",
        "consumer",
        "builders",
      ),
    ).toBe("overnight-rockets");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseFundingAmount
// ─────────────────────────────────────────────────────────────────────────────

describe("parseFundingAmount", () => {
  test("$500M → 500_000_000", () => {
    expect(parseFundingAmount("Zepto raises $500M Series F")).toBe(
      500_000_000,
    );
  });

  test("$9B → 9_000_000_000", () => {
    expect(parseFundingAmount("Cursor raises $9B at $9B post")).toBe(
      9_000_000_000,
    );
  });

  test("$1.5M → 1_500_000", () => {
    expect(parseFundingAmount("Acme raises $1.5M seed")).toBe(1_500_000);
  });

  test("no amount in title → null", () => {
    expect(parseFundingAmount("A nice product")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// normalizeSignal — end-to-end shape
// ─────────────────────────────────────────────────────────────────────────────

describe("normalizeSignal — end to end", () => {
  test("Show HN with LLM keyword → type='launch', industry='ai'", () => {
    const story = normalizeSignal(
      makeRaw({
        sourceId: "42",
        source: "hackernews",
        title: "Show HN: we built an LLM toolkit for agents",
        description: "It runs locally and is fast.",
      }),
    );
    expect(story).not.toBeNull();
    expect(story!.type).toBe("launch");
    expect(story!.industry).toBe("ai");
    expect(story!.id).toBe("hackernews-42");
    expect(story!.verified).toBe(false);
  });

  test("Crunchbase 'raises $500M' → type='funding', stage='empires', headline=$500M", () => {
    const story = normalizeSignal(
      makeRaw({
        sourceId: "cb-1",
        source: "crunchbase",
        title: "Acme raises $500M Series D at $5B",
        description: "Lead by Investor.",
      }),
    );
    expect(story).not.toBeNull();
    expect(story!.type).toBe("funding");
    expect(story!.stage).toBe("empires");
    const funding = story as FundingStory;
    expect(funding.details.amountUsd).toBe(500_000_000);
    expect(story!.headlineNumber?.value).toBe(500);
    expect(story!.headlineNumber?.unit).toBe("M");
    expect(story!.headlineNumber?.format).toBe("currency");
  });

  test("GitHub repo description containing 'India' → industry='india-shipping'", () => {
    const story = normalizeSignal(
      makeRaw({
        sourceId: "acme/repo",
        source: "github-trending",
        title: "★ acme/repo — A toolkit",
        description: "Built by IIT Bangalore students for the India market.",
        rawData: { stargazers_count: 1500 },
      }),
    );
    expect(story).not.toBeNull();
    expect(story!.industry).toBe("india-shipping");
    expect(story!.region).toBe("india");
  });

  test("title 'x' (too short) → null, does not throw", () => {
    let story: AnyStory | null = null;
    expect(() => {
      story = normalizeSignal(makeRaw({ title: "x" }));
    }).not.toThrow();
    expect(story).toBeNull();
  });

  test("normalized story passes the ingest validator", () => {
    const story = normalizeSignal(
      makeRaw({
        title: "Acme raises $20M Series A from Investor",
        description: "Series A funding round.",
      }),
    );
    expect(story).not.toBeNull();
    const v = validateStory(story!);
    expect(v).toEqual({ valid: true });
  });

  test("attaches lat/lng when a known city is mentioned", () => {
    const story = normalizeSignal(
      makeRaw({
        title: "Acme raises $20M",
        description: "Headquartered in Bangalore, India.",
      }),
    );
    expect(story).not.toBeNull();
    expect(typeof story!.lat).toBe("number");
    expect(typeof story!.lng).toBe("number");
  });

  test("no city mention → lat/lng undefined", () => {
    const story = normalizeSignal(
      makeRaw({
        title: "Acme raises $20M",
        description: "Pure software no geo.",
      }),
    );
    expect(story).not.toBeNull();
    expect(story!.lat).toBeUndefined();
    expect(story!.lng).toBeUndefined();
  });

  test("microBullets pad to 3 entries when description has fewer sentences", () => {
    const story = normalizeSignal(
      makeRaw({
        title: "Show HN: tiny app",
        description: "Just one sentence.",
      }),
    );
    expect(story).not.toBeNull();
    expect(story!.microBullets.length).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// deduplicateSignals
// ─────────────────────────────────────────────────────────────────────────────

describe("deduplicateSignals", () => {
  test("filters signals already in existingIds", () => {
    const fresh = [
      makeRaw({ sourceId: "1", source: "hackernews" }),
      makeRaw({ sourceId: "2", source: "hackernews" }),
    ];
    const existing = new Set([__dedupTesting.keyOf(fresh[0]!)]);
    const out = deduplicateSignals(fresh, existing);
    expect(out.length).toBe(1);
    expect(out[0]!.sourceId).toBe("2");
  });

  test("dedups duplicates within the fresh batch (first wins)", () => {
    const fresh = [
      makeRaw({ sourceId: "x", source: "hackernews", title: "first" }),
      makeRaw({ sourceId: "x", source: "hackernews", title: "second" }),
    ];
    const out = deduplicateSignals(fresh, new Set());
    expect(out.length).toBe(1);
    expect(out[0]!.title).toBe("first");
  });

  test("preserves order of unique signals", () => {
    const fresh = [
      makeRaw({ sourceId: "a", source: "hackernews" }),
      makeRaw({ sourceId: "b", source: "hackernews" }),
      makeRaw({ sourceId: "c", source: "hackernews" }),
    ];
    const out = deduplicateSignals(fresh, new Set());
    expect(out.map((s) => s.sourceId)).toEqual(["a", "b", "c"]);
  });

  test("source distinguishes — same sourceId across sources is NOT a duplicate", () => {
    const fresh = [
      makeRaw({ sourceId: "1", source: "hackernews" }),
      makeRaw({ sourceId: "1", source: "producthunt" }),
    ];
    const out = deduplicateSignals(fresh, new Set());
    expect(out.length).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateStory (ingest path)
// ─────────────────────────────────────────────────────────────────────────────

describe("validateStory (ingest)", () => {
  function makeFunding(overrides: Partial<FundingStory> = {}): FundingStory {
    return {
      id: "test-id",
      type: "funding",
      title: "Acme raises $20M Series A",
      headlineNumber: { value: 20, unit: "M", format: "currency" },
      microBullets: ["bullet"],
      whyNow: "Because.",
      primaryMood: "underdog-wins",
      moods: ["underdog-wins"],
      stage: "builders",
      industry: "ai",
      region: "global",
      verified: false,
      source: "hackernews",
      sourceId: "1",
      createdAt: "2026-05-04T00:00:00Z",
      details: { amountUsd: 20_000_000, round: "Series A", investors: [] },
      ...overrides,
    };
  }

  test("complete FundingStory passes", () => {
    expect(validateStory(makeFunding())).toEqual({ valid: true });
  });

  test("empty title → reason mentions title", () => {
    const r = validateStory(makeFunding({ title: "" }));
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason.toLowerCase()).toContain("title");
  });

  test("invalid mood → reason names primaryMood", () => {
    const r = validateStory(
      makeFunding({ primaryMood: "not-a-mood" as never }),
    );
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toContain("primaryMood");
  });

  test("zero microBullets → invalid", () => {
    const r = validateStory(makeFunding({ microBullets: [] }));
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toContain("microBullets");
  });

  test("whyNow too short → invalid", () => {
    const r = validateStory(makeFunding({ whyNow: "x" }));
    expect(r.valid).toBe(false);
  });

  test("never throws on garbage input", () => {
    // @ts-expect-error — intentionally feeding bad shape
    expect(() => validateStory({ id: 1 })).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sanity: keyword arrays exposed for inspection
// ─────────────────────────────────────────────────────────────────────────────

describe("classification rules — sanity surface", () => {
  test("INDUSTRY_KEYWORDS includes india-shipping FIRST so it wins keyword priority", () => {
    expect(__normalizeTesting.INDUSTRY_KEYWORDS[0]?.industry).toBe(
      "india-shipping",
    );
  });

  test("TYPE_RULES exists with at least 5 entries", () => {
    expect(__normalizeTesting.TYPE_RULES.length).toBeGreaterThanOrEqual(5);
  });
});
