import { afterEach, describe, expect, test } from "bun:test";
import { render } from "@testing-library/react";
import seedRaw from "@/content/stories.seed.json";
import { getWeeklyMarketPicks } from "@/lib/market-picks";
import { validateSeed } from "@/lib/seed-validate";
import { HomeClient } from "../page-client";

const seed = validateSeed(seedRaw);
const TOP3 = [...seed]
  .filter((story) => story.featured === true)
  .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  .slice(0, 3);
const ALL_PROPS = {
  stories: seed,
  top3: TOP3,
  weeklyMarketPicks: getWeeklyMarketPicks(),
};

afterEach(() => {
  document.body.style.overflow = "";
});

describe("MVP homepage pixel/editorial contract", () => {
  test("top chrome keeps the pixel feel subtle", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const header = container.querySelector("[data-home-header]")!;
    const label = header.querySelector("[data-dotted-text]");

    expect(label).not.toBeNull();
    expect(label!.getAttribute("data-dotted-text-content")).toBe(
      "WEEKLY RECIPES",
    );
  });

  test("hero eyebrow uses DottedText while the headline stays editorial serif", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const hero = container.querySelector("[data-home-hero-copy]")!;
    const headline = hero.querySelector("h1")!;

    expect(hero.querySelector("[data-dotted-text]")).not.toBeNull();
    expect(headline.className).toContain("font-serif");
    expect(headline.querySelector("[data-dotted-text]")).toBeNull();
  });

  test("weekly pick labels render as dotted accents, not dense controls", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const cards = container.querySelectorAll("[data-market-pick-card]");

    expect(cards.length).toBe(3);
    for (const card of cards) {
      expect(card.querySelector("[data-dotted-text]")).not.toBeNull();
      expect(card.querySelector("table")).toBeNull();
    }
  });

  test("inline recipe section labels use dotted accents and body remains readable", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const recipe = container.querySelector("[data-catalst-recipe]")!;

    expect(recipe.querySelectorAll("[data-dotted-text]").length).toBeGreaterThan(
      4,
    );
    expect(recipe.querySelector("table")).toBeNull();
  });

  test("AI build prompt includes a compact copy affordance", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const recipe = container.querySelector("[data-catalst-recipe]")!;

    expect(recipe.textContent).toContain("Copy prompt");
    expect(recipe.querySelector("svg")).not.toBeNull();
  });
});
