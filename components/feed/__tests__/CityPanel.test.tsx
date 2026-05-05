import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import seedRaw from "@/content/stories.seed.json";
import { CityPanel, type CityHeatRow } from "../CityPanel";
import { validateSeed } from "@/lib/seed-validate";
import { useFilterStore } from "@/lib/filter/useFilter";

const seed = validateSeed(seedRaw);

const HEAT: CityHeatRow[] = [
  { citySlug: "bangalore", cityLabelShort: "BLR", signalCount: 5 },
  { citySlug: "sf", cityLabelShort: "SF", signalCount: 3 },
  { citySlug: "london", cityLabelShort: "LON", signalCount: 2 },
  { citySlug: "la", cityLabelShort: "LA", signalCount: 1 },
];

beforeEach(() => {
  useFilterStore.getState().clear();
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.clear();
  }
});

afterEach(() => {
  useFilterStore.getState().clear();
});

describe("CityPanel — heat headline weight (v3 polish)", () => {
  test("headline carries data-heat-headline-size = clamp(26px, 2.8vw, 32px)", () => {
    const { container } = render(
      <CityPanel
        stories={seed}
        activeCitySlug="bangalore"
        onCityChange={() => {}}
        cityHeat={HEAT}
      />,
    );
    const headline = container.querySelector(
      "[data-heat-headline-size]",
    ) as HTMLElement;
    expect(headline).not.toBeNull();
    expect(headline.getAttribute("data-heat-headline-size")).toBe(
      "clamp(26px, 2.8vw, 32px)",
    );
  });
});

describe("CityPanel — render shape", () => {
  test("renders heat headline with City span in coral", () => {
    const { container } = render(
      <CityPanel
        stories={seed}
        activeCitySlug="bangalore"
        onCityChange={() => {}}
        cityHeat={HEAT}
      />,
    );
    const root = container.querySelector("[data-city-panel]") as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.getAttribute("data-city-panel-active")).toBe("bangalore");
    const citySpan = container.querySelector("[data-heat-city-span]") as HTMLElement;
    expect(citySpan).not.toBeNull();
    expect(citySpan.textContent?.toLowerCase()).toContain("bangalore");
    expect(citySpan.className).toContain("text-cta");
  });

  test("renders city heat table with 4 rows when provided", () => {
    const { container } = render(
      <CityPanel
        stories={seed}
        activeCitySlug="bangalore"
        onCityChange={() => {}}
        cityHeat={HEAT}
      />,
    );
    const rows = container.querySelectorAll("[data-city-heat-row]");
    expect(rows.length).toBe(4);
    // Active row marked
    const activeRow = container.querySelector(
      '[data-city-heat-row="bangalore"]',
    ) as HTMLElement;
    expect(activeRow.getAttribute("data-city-heat-active")).toBe("true");
  });

  test("renders up to 6 city stories rows for the active city", () => {
    const { container } = render(
      <CityPanel
        stories={seed}
        activeCitySlug="bangalore"
        onCityChange={() => {}}
        cityHeat={HEAT}
      />,
    );
    const rows = container.querySelectorAll("[data-city-story-row]");
    // Bangalore has 5 stories in seed → 5 rows visible, no "+more" link
    expect(rows.length).toBe(5);
    expect(container.querySelector("[data-city-more]")).toBeNull();
  });

  test("renders +N more link when totalCount > 6 (synthetic test)", () => {
    // Synthetic — clone Bangalore stories to 8 to verify the link shows
    const blrStories = seed.filter(
      (s) => s.lat !== undefined && s.lat > 12 && s.lat < 14,
    );
    const inflated = [
      ...seed,
      ...blrStories.map((s, i) => ({ ...s, id: `${s.id}-clone-${i}` })),
      ...blrStories.map((s, i) => ({ ...s, id: `${s.id}-clone-b-${i}` })),
    ];
    const { container } = render(
      <CityPanel
        stories={inflated}
        activeCitySlug="bangalore"
        onCityChange={() => {}}
        cityHeat={HEAT}
      />,
    );
    const rows = container.querySelectorAll("[data-city-story-row]");
    expect(rows.length).toBe(6);
    expect(container.querySelector("[data-city-more]")).not.toBeNull();
  });
});

describe("CityPanel — interactions", () => {
  test("tapping a city heat row fires onCityChange", () => {
    const onCityChange = mock((_slug: string) => {});
    const { container } = render(
      <CityPanel
        stories={seed}
        activeCitySlug="bangalore"
        onCityChange={onCityChange}
        cityHeat={HEAT}
      />,
    );
    const sfRow = container.querySelector(
      '[data-city-heat-row="sf"]',
    ) as HTMLButtonElement;
    fireEvent.click(sfRow);
    expect(onCityChange).toHaveBeenCalledWith("sf");
  });

  test("tapping a story row expands it to the StoryCard expanded body", () => {
    const { container } = render(
      <CityPanel
        stories={seed}
        activeCitySlug="bangalore"
        onCityChange={() => {}}
        cityHeat={HEAT}
      />,
    );
    const firstRow = container.querySelector(
      "[data-city-story-row] button",
    ) as HTMLButtonElement;
    fireEvent.click(firstRow);
    // After expansion, the row hosts a <StoryCard expanded>
    const expanded = container.querySelector(
      '[data-city-story-row][data-city-story-expanded="true"]',
    );
    expect(expanded).not.toBeNull();
    expect(expanded!.querySelector('[data-story-card][data-story-expanded="true"]')).not.toBeNull();
  });
});

describe("CityPanel — filter cascade", () => {
  test("filtering to a non-matching mood collapses the city to empty state", () => {
    // Bangalore stories' moods: bootstrapped-millions, quiet-builders,
    // india-shipping, copy-able-ideas, big-money-moves. Filter to a mood
    // that's NOT in any BLR story → empty.
    useFilterStore.getState().toggleMood("overnight-rockets");
    const { container } = render(
      <CityPanel
        stories={seed}
        activeCitySlug="bangalore"
        onCityChange={() => {}}
        cityHeat={HEAT}
      />,
    );
    expect(container.querySelector("[data-city-empty]")).not.toBeNull();
    expect(container.querySelectorAll("[data-city-story-row]").length).toBe(0);
  });

  test("empty state shows 'Clear filter' link when filter is active", () => {
    useFilterStore.getState().toggleMood("overnight-rockets");
    const { container } = render(
      <CityPanel
        stories={seed}
        activeCitySlug="bangalore"
        onCityChange={() => {}}
        cityHeat={HEAT}
      />,
    );
    const empty = container.querySelector("[data-city-empty]") as HTMLElement;
    expect(empty.textContent).toMatch(/Clear filter/);
  });

  test("empty state shows 'Quiet day' copy when filter is INACTIVE", () => {
    // Pick a city with no stories in seed (e.g., 'amsterdam')
    const { container } = render(
      <CityPanel
        stories={seed}
        activeCitySlug="amsterdam"
        onCityChange={() => {}}
        cityHeat={HEAT}
      />,
    );
    const empty = container.querySelector("[data-city-empty]") as HTMLElement;
    expect(empty.textContent).toMatch(/Quiet day/);
  });
});
