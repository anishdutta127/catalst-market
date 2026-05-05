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

describe("HomeClient - MVP homepage loop", () => {
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

    expect(hero.textContent).toContain("Find a business idea worth copying");
    expect(hero.textContent).toContain("Pick your twist");
    expect(hero.textContent).toContain("waitlist");
    expect(hero.textContent).toContain("48-hour validation");
  });

  test("renders exactly three weekly market pick cards", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const cards = container.querySelectorAll("[data-market-pick-card]");

    expect(cards.length).toBe(3);
    expect(
      Array.from(cards).map((card) =>
        card.getAttribute("data-market-pick-category"),
      ),
    ).toEqual(["established", "startup", "frontier"]);
  });

  test("renders the full recipe inline as the core value", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const inline = container.querySelector("[data-weekly-recipe-inline]");

    expect(inline).not.toBeNull();
    expect(container.textContent).toContain("3 ideas worth copying this week");
    expect(container.textContent).toContain("Pick a twist");
    expect(container.textContent).toContain("waitlist");
    expect(container.textContent).toContain("48-hour validation");
    const labels = Array.from(inline!.querySelectorAll("[data-dotted-text]"))
      .map((node) => node.getAttribute("data-dotted-text-content"));
    expect(labels).toContain("THIS BUSINESS WORKS");
    expect(labels).toContain("WHY THIS IS WORTH TESTING");
    expect(labels).toContain("HERE IS THE GAP");
    expect(labels).toContain("WHAT NOT TO COPY");
    expect(labels).toContain("PICK A TWIST");
    expect(labels).toContain("GET THE WAITLIST PAGE");
    expect(labels).toContain("WHAT TO LAUNCH FIRST");
    expect(labels).toContain("AI BUILD PROMPT");
    expect(labels).toContain("48-HOUR VALIDATION");
    expect(labels).toContain("WHAT NOT TO BUILD YET");
  });

  test("card CTA opens the expanded RecipeSheet", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const cta = container.querySelector("[data-market-pick-card] button")!;

    fireEvent.click(cta);

    expect(container.querySelector("[data-recipe-sheet]")).not.toBeNull();
  });

  test("selecting a different twist changes the waitlist recipe", () => {
    const { container } = render(<HomeClient {...ALL_PROPS} />);
    const twistOptions = container.querySelectorAll("[data-twist-option]");

    expect(container.textContent).toContain(
      "Finish the first care-plan draft without staring at a blank page.",
    );

    fireEvent.click(twistOptions[1]);

    expect(container.textContent).toContain(
      "Turn messy intake notes into a clean first client summary.",
    );
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
