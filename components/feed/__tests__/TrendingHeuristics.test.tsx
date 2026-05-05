import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import seedRaw from "@/content/stories.seed.json";
import { TrendingHeuristics } from "../TrendingHeuristics";
import {
  computeHeuristics,
  padHeuristicsToCount,
} from "@/lib/heuristics";
import { validateSeed } from "@/lib/seed-validate";
import { useFilterStore } from "@/lib/filter/useFilter";

const seed = validateSeed(seedRaw);
const NOW = new Date("2026-05-03T12:00:00Z");
const ENTRIES = padHeuristicsToCount(computeHeuristics(seed, NOW), 6);

beforeEach(() => {
  useFilterStore.getState().clear();
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.clear();
  }
});

afterEach(() => {
  useFilterStore.getState().clear();
});

describe("TrendingHeuristics — render shape", () => {
  test("renders 6 cards exact", () => {
    const { container } = render(<TrendingHeuristics entries={ENTRIES} />);
    const cards = container.querySelectorAll("[data-trending-card]");
    expect(cards.length).toBe(6);
  });

  test("renders 'This week's momentum' section caption above the grid", () => {
    const { container } = render(<TrendingHeuristics entries={ENTRIES} />);
    const heading = container.querySelector("#trending-heading") as HTMLElement;
    expect(heading).not.toBeNull();
    // Phase 7b: caption is DottedText. Assert via the
    // data-section-caption-text mirror.
    expect(
      heading.getAttribute("data-section-caption-text"),
    ).toBe("This week's momentum");
  });

  test("each card has industry, count, delta, and top-story slot", () => {
    const { container } = render(<TrendingHeuristics entries={ENTRIES} />);
    const cards = container.querySelectorAll("[data-trending-card]");
    for (const card of cards) {
      expect(card.querySelector("[data-trending-label]")).not.toBeNull();
      expect(card.querySelector("[data-trending-count-display]")).not.toBeNull();
      expect(card.querySelector("[data-trending-delta]")).not.toBeNull();
      expect(card.querySelector("[data-trending-top-story]")).not.toBeNull();
    }
  });

  test("quiet (count=0) cards carry data-trending-card-quiet=true and the placeholder copy", () => {
    // Force a small input so padding kicks in
    const tinyEntries = padHeuristicsToCount(
      computeHeuristics(seed.slice(0, 1), NOW),
      6,
    );
    const { container } = render(<TrendingHeuristics entries={tinyEntries} />);
    const quietCards = container.querySelectorAll(
      '[data-trending-card-quiet="true"]',
    );
    expect(quietCards.length).toBeGreaterThan(0);
    for (const c of quietCards) {
      const ts = c.querySelector("[data-trending-top-story]") as HTMLElement;
      expect(ts.textContent).toContain("0 — quiet");
    }
  });
});

describe("TrendingHeuristics — tap toggles filter (symmetric)", () => {
  test("tapping a card adds that industry to the filter", () => {
    const { container } = render(<TrendingHeuristics entries={ENTRIES} />);
    const aiCard = container.querySelector(
      '[data-trending-card-industry="ai"]',
    ) as HTMLButtonElement;
    expect(aiCard).not.toBeNull();
    fireEvent.click(aiCard);
    expect(useFilterStore.getState().industries).toContain("ai");
  });

  test("tapping an active card REMOVES that industry (symmetric)", () => {
    useFilterStore.getState().toggleIndustry("ai");
    const { container } = render(<TrendingHeuristics entries={ENTRIES} />);
    const aiCard = container.querySelector(
      '[data-trending-card-industry="ai"]',
    ) as HTMLButtonElement;
    fireEvent.click(aiCard);
    expect(useFilterStore.getState().industries).not.toContain("ai");
  });
});

describe("TrendingHeuristics — active highlight", () => {
  test("active industry's card carries data-trending-card-active=true + Coral ring class + ACTIVE badge", () => {
    useFilterStore.getState().toggleIndustry("ai");
    const { container } = render(<TrendingHeuristics entries={ENTRIES} />);
    const aiCard = container.querySelector(
      '[data-trending-card-industry="ai"]',
    ) as HTMLElement;
    expect(aiCard.getAttribute("data-trending-card-active")).toBe("true");
    expect(aiCard.className).toContain("ring-cta");
    expect(aiCard.querySelector("[data-trending-active-badge]")).not.toBeNull();
  });

  test("inactive industry cards do NOT have the Coral ring or badge", () => {
    useFilterStore.getState().toggleIndustry("ai");
    const { container } = render(<TrendingHeuristics entries={ENTRIES} />);
    const fintechCard = container.querySelector(
      '[data-trending-card-industry="fintech"]',
    ) as HTMLElement;
    if (fintechCard) {
      expect(fintechCard.getAttribute("data-trending-card-active")).toBe("false");
      expect(fintechCard.className).not.toContain("ring-cta");
      expect(fintechCard.querySelector("[data-trending-active-badge]")).toBeNull();
    }
  });
});
