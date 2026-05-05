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

describe("Discovery homepage pixel/editorial contract", () => {
  test("top chrome keeps the pixel feel subtle", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const header = container.querySelector("[data-home-header]")!;
    const label = header.querySelector("[data-dotted-text]");

    expect(label).not.toBeNull();
    expect(label!.getAttribute("data-dotted-text-content")).toBe(
      "48 HOUR TEST",
    );
  });

  test("globe stage uses a small dotted eyebrow without an oversized headline", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const globe = container.querySelector("[data-home-globe]")!;

    expect(globe.querySelector("[data-dotted-text]")).not.toBeNull();
    expect(globe.querySelector("h1")).toBeNull();
    expect(globe.querySelector("[data-globe]")).not.toBeNull();
  });

  test("weekly cards render as collectible accents, not dense controls", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const cards = container.querySelectorAll("[data-market-pick-card]");

    expect(cards.length).toBe(3);
    for (const card of cards) {
      expect(card.querySelector("[data-dotted-text]")).not.toBeNull();
      expect(card.querySelector("table")).toBeNull();
      expect(card.textContent).toContain("Card");
    }
  });

  test("homepage keeps the long recipe behind the build-plan surface", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);

    expect(container.querySelector("[data-catalst-recipe]")).toBeNull();
    expect(container.querySelector("[data-selected-opportunity]")).not.toBeNull();
    expect(container.querySelector("table")).toBeNull();
  });

  test("selected summary stays compact and readable", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const summary = container.querySelector("[data-selected-opportunity]")!;

    expect(summary.textContent).toContain("Why this is worth testing");
    expect(summary.textContent).toContain("Your twist");
    expect(summary.textContent).toContain("Build this waitlist page");
  });
});
