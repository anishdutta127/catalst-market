import { afterEach, describe, expect, test } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import seedRaw from "@/content/stories.seed.json";
import { getWeeklyMarketPicks } from "@/lib/market-picks";
import { validateSeed } from "@/lib/seed-validate";
import { HomeClient } from "../page-client";

const seed = validateSeed(seedRaw);
const TOP3 = [...seed]
  .filter((story) => story.featured === true)
  .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  .slice(0, 3);
const WEEKLY_PICKS = getWeeklyMarketPicks();

const ALL_PROPS = {
  stories: seed,
  top3: TOP3,
  weeklyMarketPicks: WEEKLY_PICKS,
};

afterEach(() => {
  document.body.style.overflow = "";
});

describe("HomeClient — MVP homepage loop", () => {
  test("renders the simplified page order", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);

    expect(container.querySelector("[data-home-header]")).not.toBeNull();
    expect(container.querySelector("[data-home-hero-copy]")).not.toBeNull();
    expect(container.querySelector("[data-home-globe]")).not.toBeNull();
    expect(container.querySelector("[data-home-weekly-picks]")).not.toBeNull();
    expect(container.querySelector("[data-more-market-signals]")).not.toBeNull();
  });

  test("first screen explains the weekly business-to-recipe loop", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const hero = container.querySelector("[data-home-hero-copy]")!;

    expect(hero.textContent).toContain("Three businesses of the week");
    expect(hero.textContent).toContain("choose a POD");
    expect(hero.textContent).toContain("48-hour validation plan");
  });

  test("renders exactly three weekly market pick cards", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const cards = container.querySelectorAll("[data-market-pick-card]");

    expect(cards.length).toBe(3);
    expect(Array.from(cards).map((card) => card.getAttribute("data-market-pick-category"))).toEqual([
      "established",
      "startup",
      "frontier",
    ]);
  });

  test("opening a pick shows the RecipeSheet", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const firstCard = container.querySelector("[data-market-pick-card]")!;

    fireEvent.click(firstCard);

    const sheet = container.querySelector("[data-recipe-sheet]");
    expect(sheet).not.toBeNull();
    const labels = Array.from(sheet!.querySelectorAll("[data-dotted-text]"))
      .map((node) => node.getAttribute("data-dotted-text-content"));
    expect(labels).toContain("SOURCE PATTERN");
    expect(labels).toContain("RECOMMENDED PODS");
    expect(labels).toContain("AI BUILD INSTRUCTIONS");
    expect(labels).toContain("48-HOUR VALIDATION PLAN");
  });

  test("secondary signals are below the main weekly loop", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const weekly = container.querySelector("[data-home-weekly-picks]")!;
    const more = container.querySelector("[data-more-market-signals]")!;

    expect(
      weekly.compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(more.querySelectorAll("[data-story-card]").length).toBe(3);
  });
});
