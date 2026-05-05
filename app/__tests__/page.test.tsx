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

describe("HomeClient - discovery homepage loop", () => {
  test("renders the discovery-first page order", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);

    expect(container.querySelector("[data-home-header]")).not.toBeNull();
    expect(container.querySelector("[data-home-globe]")).not.toBeNull();
    expect(container.querySelector("[data-home-weekly-picks]")).not.toBeNull();
    expect(container.querySelector("[data-card-dock]")).not.toBeNull();
    expect(container.querySelector("[data-selected-opportunity]")).not.toBeNull();
    expect(container.querySelector("[data-home-how-it-works]")).not.toBeNull();
    expect(container.querySelector("[data-more-market-signals]")).toBeNull();
  });

  test("first screen uses quiet copy and lets the globe lead", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const globeStage = container.querySelector("[data-home-globe]")!;

    expect(globeStage.textContent).toContain("Catalst Market");
    expect(globeStage.textContent).toContain("3 ideas worth copying this week");
    expect(globeStage.textContent).toContain("Pick your twist");
    expect(globeStage.textContent).toContain("waitlist page");
    expect(globeStage.querySelector("h1")).toBeNull();
    expect(globeStage.querySelector("[data-globe]")).not.toBeNull();
  });

  test("renders exactly three collectible opportunity cards", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const cards = container.querySelectorAll("[data-market-pick-card]");

    expect(cards.length).toBe(3);
    expect(
      Array.from(cards).map((card) =>
        card.getAttribute("data-market-pick-category"),
      ),
    ).toEqual(["established", "startup", "frontier"]);
    expect(container.textContent).toContain("Save this card");
  });

  test("homepage shows a short opportunity summary instead of the full recipe", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const summary = container.querySelector("[data-selected-opportunity]")!;

    expect(container.querySelector("[data-catalst-recipe]")).toBeNull();
    expect(summary.textContent).toContain("What is working");
    expect(summary.textContent).toContain("Why this is worth testing");
    expect(summary.textContent).toContain("Market gap");
    expect(summary.textContent).toContain("What not to copy");
    expect(summary.textContent).toContain("Your twist");
    expect(summary.textContent).toContain("Build this waitlist page");
  });

  test("selecting a different twist changes the homepage waitlist angle", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const twistOptions = container.querySelectorAll("[data-home-twist-option]");

    expect(container.textContent).toContain(
      "Finish the first care-plan draft without staring at a blank page.",
    );

    fireEvent.click(twistOptions[1]);

    expect(container.textContent).toContain(
      "Turn messy intake notes into a clean first client summary.",
    );
  });

  test("build CTA opens the deeper RecipeSheet", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const buttons = Array.from(container.querySelectorAll("button"));
    const buildButton = buttons.find((button) =>
      button.textContent?.includes("Build this waitlist page"),
    );

    expect(buildButton).toBeDefined();
    fireEvent.click(buildButton!);

    expect(container.querySelector("[data-recipe-sheet]")).not.toBeNull();
  });
});
