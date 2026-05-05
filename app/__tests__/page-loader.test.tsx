import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import {
  LIVE_STORIES_PATH,
  clearLiveStories,
  writeLiveStories,
} from "@/lib/ingest/store";
import { readSeedFallback } from "@/lib/db/seed-fallback";
import { getMovers } from "@/lib/curation";
import {
  DevModeIndicator,
  type DevModeKind,
} from "@/components/feed/DevModeIndicator";
import type { AnyStory } from "@/lib/types/story";

const FILE = join(process.cwd(), LIVE_STORIES_PATH);

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
    verified: false,
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

// ─────────────────────────────────────────────────────────────────────────────
// loadStories — live → fallback ladder
// ─────────────────────────────────────────────────────────────────────────────

describe("loadStories — live → seed fallback", () => {
  // Re-import the module fresh for each test so its cached state
  // doesn't survive the file delete in beforeEach.
  async function importLoadStories() {
    return (await import("../page")).loadStories;
  }

  test("returns live stories when the live file has content", async () => {
    const a = makeStory("a", "2026-05-04T00:00:00Z");
    writeLiveStories([a]);
    const loadStories = await importLoadStories();
    const result = await loadStories();
    expect(result.source).toBe("live");
    expect(result.stories.length).toBe(1);
    expect(result.stories[0]?.id).toBe("a");
  });

  test("returns seed when the live file is empty", async () => {
    clearLiveStories();
    const loadStories = await importLoadStories();
    const result = await loadStories();
    expect(result.source).toBe("seed-fallback");
    expect(result.stories.length).toBe(readSeedFallback().length);
    expect(result.stories.length).toBeGreaterThanOrEqual(20);
  });

  test("returns seed when the live file is missing", async () => {
    if (existsSync(FILE)) unlinkSync(FILE);
    const loadStories = await importLoadStories();
    const result = await loadStories();
    expect(result.source).toBe("seed-fallback");
    expect(result.stories.length).toBeGreaterThanOrEqual(20);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DevModeIndicator
// ─────────────────────────────────────────────────────────────────────────────

describe("DevModeIndicator", () => {
  function renderIndicator(kind: DevModeKind, count: number, force?: boolean) {
    return render(
      <DevModeIndicator kind={kind} count={count} forceVisible={force} />,
    );
  }

  test("shows 'LIVE · N STORIES' when kind=live (forceVisible)", () => {
    const { container } = renderIndicator("live", 7, true);
    const root = container.querySelector(
      "[data-dev-indicator]",
    ) as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.getAttribute("data-dev-indicator-kind")).toBe("live");
    expect(root.getAttribute("data-dev-indicator-count")).toBe("7");
    const dotted = root.querySelector(
      "[data-dotted-text]",
    ) as HTMLElement;
    expect(dotted.getAttribute("data-dotted-text-content")).toBe(
      "LIVE · 7 STORIES",
    );
  });

  test("shows 'SEED FALLBACK · N STORIES' when kind=seed-fallback", () => {
    const { container } = renderIndicator("seed-fallback", 20, true);
    const dotted = container.querySelector(
      "[data-dotted-text]",
    ) as HTMLElement;
    expect(dotted.getAttribute("data-dotted-text-content")).toBe(
      "SEED FALLBACK · 20 STORIES",
    );
  });

  test("uses --color-verdant when live", () => {
    const { container } = renderIndicator("live", 5, true);
    const firstPixel = container.querySelector("[data-dotted-pixel]");
    expect(firstPixel?.getAttribute("fill")).toBe("var(--color-verdant)");
  });

  test("uses --color-cta when seed-fallback", () => {
    const { container } = renderIndicator("seed-fallback", 20, true);
    const firstPixel = container.querySelector("[data-dotted-pixel]");
    expect(firstPixel?.getAttribute("fill")).toBe("var(--color-cta)");
  });

  test("hidden in production (NODE_ENV='production', no forceVisible)", () => {
    const before = process.env.NODE_ENV;
    // @ts-expect-error — runtime mutation for the test
    process.env.NODE_ENV = "production";
    const { container } = render(
      <DevModeIndicator kind="live" count={5} />,
    );
    expect(container.querySelector("[data-dev-indicator]")).toBeNull();
    // @ts-expect-error — restore
    process.env.NODE_ENV = before;
  });

  test("visible in development (NODE_ENV='development', no forceVisible)", () => {
    const before = process.env.NODE_ENV;
    // @ts-expect-error — runtime mutation for the test
    process.env.NODE_ENV = "development";
    const { container } = render(
      <DevModeIndicator kind="live" count={5} />,
    );
    expect(container.querySelector("[data-dev-indicator]")).not.toBeNull();
    // @ts-expect-error — restore
    process.env.NODE_ENV = before;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getMovers parameterization (Phase 7c contract)
// ─────────────────────────────────────────────────────────────────────────────

describe("getMovers — pool parameterization (Phase 7c)", () => {
  test("uses the passed stories array, not a static seed import", () => {
    // Build a custom pool with a non-tier-1 story that's quiet enough
    // to qualify. Cairo (lat 30.04, lng 31.24) is non-tier-1.
    const pool = [
      makeStory("custom-a", "2026-05-04T00:00:00Z", {
        title: "Custom mover from Cairo",
        verified: false,
        lat: 30.04,
        lng: 31.24,
      }),
      makeStory("custom-b", "2026-05-03T00:00:00Z", {
        title: "Another Cairo mover",
        verified: false,
        lat: 30.04,
        lng: 31.24,
      }),
    ];
    const movers = getMovers(pool);
    // Both qualify — non-tier-1 + verified=false → mover candidates.
    expect(movers.length).toBe(2);
    expect(new Set(movers.map((s) => s.id))).toEqual(
      new Set(["custom-a", "custom-b"]),
    );
  });

  test("default arg (no pool) still works (uses SEED_STORIES)", () => {
    const movers = getMovers();
    // Just assert it runs and returns ≤ 3 — the seed contents are
    // pinned by other tests already.
    expect(movers.length).toBeLessThanOrEqual(3);
  });
});
