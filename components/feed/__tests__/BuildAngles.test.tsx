import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import seedRaw from "@/content/stories.seed.json";
import { BuildAngles } from "../BuildAngles";
import { aggregateAngles } from "@/lib/angle-aggregator";
import { validateSeed } from "@/lib/seed-validate";

const seed = validateSeed(seedRaw);
const ANGLES = aggregateAngles(seed);

describe("BuildAngles — render shape", () => {
  test("renders 3 cards from seed-derived angles", () => {
    const { container } = render(
      <BuildAngles angles={ANGLES} stories={seed} />,
    );
    const cards = container.querySelectorAll("[data-build-angle-card]");
    expect(cards.length).toBe(3);
  });

  test("each card has title + inspired-by + expand toggle (collapsed)", () => {
    const { container } = render(
      <BuildAngles angles={ANGLES} stories={seed} />,
    );
    const cards = container.querySelectorAll("[data-build-angle-card]");
    for (const card of cards) {
      expect(card.querySelector("[data-build-angle-title]")).not.toBeNull();
      expect(card.querySelector("[data-build-angle-inspired-by]")).not.toBeNull();
      expect(card.querySelector("[data-build-angle-toggle]")).not.toBeNull();
      expect(card.getAttribute("data-build-angle-expanded")).toBe("false");
    }
  });

  test("empty angles → renders empty-state copy with 'broaden' message", () => {
    const { container } = render(
      <BuildAngles angles={[]} stories={seed} />,
    );
    const root = container.querySelector("[data-build-angles]") as HTMLElement;
    expect(root.getAttribute("data-build-angles-empty")).toBe("true");
    expect(root.textContent).toMatch(/broaden it/i);
  });
});

describe("BuildAngles — multi-expand (per spec)", () => {
  test("tapping the toggle expands one card; another tap expands a SECOND card simultaneously", () => {
    const { container } = render(
      <BuildAngles angles={ANGLES} stories={seed} />,
    );
    const cards = container.querySelectorAll("[data-build-angle-card]");
    const toggle0 = (cards[0] as HTMLElement).querySelector(
      "[data-build-angle-toggle]",
    ) as HTMLButtonElement;
    const toggle1 = (cards[1] as HTMLElement).querySelector(
      "[data-build-angle-toggle]",
    ) as HTMLButtonElement;
    fireEvent.click(toggle0);
    fireEvent.click(toggle1);
    expect(cards[0]!.getAttribute("data-build-angle-expanded")).toBe("true");
    expect(cards[1]!.getAttribute("data-build-angle-expanded")).toBe("true");
  });

  test("tapping an already-expanded card's toggle collapses it (independent of siblings)", () => {
    const { container } = render(
      <BuildAngles angles={ANGLES} stories={seed} />,
    );
    const card0 = container.querySelectorAll(
      "[data-build-angle-card]",
    )[0] as HTMLElement;
    const toggle = card0.querySelector(
      "[data-build-angle-toggle]",
    ) as HTMLButtonElement;
    fireEvent.click(toggle);
    expect(card0.getAttribute("data-build-angle-expanded")).toBe("true");
    fireEvent.click(toggle);
    expect(card0.getAttribute("data-build-angle-expanded")).toBe("false");
  });
});

describe("BuildAngles — expanded body content", () => {
  test("expanded card renders description + wedge + inspiring chips + Build CTA", () => {
    const { container } = render(
      <BuildAngles angles={ANGLES} stories={seed} />,
    );
    const card0 = container.querySelectorAll(
      "[data-build-angle-card]",
    )[0] as HTMLElement;
    const toggle = card0.querySelector(
      "[data-build-angle-toggle]",
    ) as HTMLButtonElement;
    fireEvent.click(toggle);
    const body = card0.querySelector(
      "[data-build-angle-expanded-body]",
    ) as HTMLElement;
    expect(body).not.toBeNull();
    expect(card0.querySelector("[data-build-angle-wedge]")).not.toBeNull();
    expect(card0.querySelectorAll("[data-build-angle-chip]").length).toBeGreaterThan(0);
    expect(card0.querySelector('button[data-variant="primary"]')).not.toBeNull();
  });

  test("Build CTA fires onBuild with the angle id", () => {
    const onBuild = mock((_id: string) => {});
    const { container } = render(
      <BuildAngles angles={ANGLES} stories={seed} onBuild={onBuild} />,
    );
    const card0 = container.querySelectorAll(
      "[data-build-angle-card]",
    )[0] as HTMLElement;
    fireEvent.click(
      card0.querySelector("[data-build-angle-toggle]") as HTMLButtonElement,
    );
    const cta = card0.querySelector('button[data-variant="primary"]') as HTMLButtonElement;
    fireEvent.click(cta);
    expect(onBuild).toHaveBeenCalledTimes(1);
    expect(onBuild.mock.calls[0]?.[0]).toBe(ANGLES[0]!.id);
  });

  test("inspiring-story chip tap fires onStoryChipTap with the storyId", () => {
    const onStoryChipTap = mock((_id: string) => {});
    const { container } = render(
      <BuildAngles
        angles={ANGLES}
        stories={seed}
        onStoryChipTap={onStoryChipTap}
      />,
    );
    const card0 = container.querySelectorAll(
      "[data-build-angle-card]",
    )[0] as HTMLElement;
    fireEvent.click(
      card0.querySelector("[data-build-angle-toggle]") as HTMLButtonElement,
    );
    const chip = card0.querySelector(
      "[data-build-angle-chip]",
    ) as HTMLButtonElement;
    fireEvent.click(chip);
    expect(onStoryChipTap).toHaveBeenCalledTimes(1);
    expect(onStoryChipTap.mock.calls[0]?.[0]).toBe(
      chip.getAttribute("data-build-angle-chip-story") ?? "",
    );
  });
});
