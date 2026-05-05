import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import { Top3OfWeek } from "../Top3OfWeek";
import { getTop3OfWeek } from "@/lib/curation";
import { SEED_STORIES } from "@/lib/seed";
import type { Top3OfWeekItem } from "@/lib/curation";

const ITEMS = getTop3OfWeek();

describe("Top3OfWeek — render shape", () => {
  test("renders 3 cards from curated input", () => {
    const { container } = render(<Top3OfWeek items={ITEMS} />);
    const cards = container.querySelectorAll("[data-top3-of-week-card]");
    expect(cards.length).toBe(3);
  });

  test("each collapsed card shows headline number, title, and curatorial note in italic", () => {
    const { container } = render(<Top3OfWeek items={ITEMS} />);
    const cards = container.querySelectorAll("[data-top3-of-week-card]");
    for (const card of cards) {
      expect(card.querySelector("[data-top3-of-week-title]")).not.toBeNull();
      const note = card.querySelector(
        "[data-top3-of-week-note]",
      ) as HTMLElement | null;
      expect(note).not.toBeNull();
      expect(note!.className).toContain("italic");
      expect(note!.className).toContain("font-serif");
      expect(note!.textContent && note!.textContent.length).toBeGreaterThan(20);
    }
  });

  test("mood-tinted top strip is 24px tall (vs Top 3 Today's 12px)", () => {
    const { container } = render(<Top3OfWeek items={ITEMS} />);
    const strip = container.querySelector(
      "[data-top3-of-week-strip]",
    ) as HTMLElement;
    expect(strip).not.toBeNull();
    expect(strip.style.height).toBe("24px");
  });

  test("rank badge shows '#1 this week', '#2 this week', '#3 this week'", () => {
    const { container } = render(<Top3OfWeek items={ITEMS} />);
    const badges = container.querySelectorAll("[data-top3-of-week-rank-badge]");
    // Phase 7b: badges render as DottedText SVG. The mirror attribute
    // data-top3-of-week-rank-text carries the source string for tests.
    const texts = Array.from(badges).map((b) =>
      (b.getAttribute("data-top3-of-week-rank-text") ?? "").toLowerCase(),
    );
    expect(texts.some((t) => t.includes("#1") && t.includes("this week"))).toBe(
      true,
    );
    expect(texts.some((t) => t.includes("#2"))).toBe(true);
    expect(texts.some((t) => t.includes("#3"))).toBe(true);
  });
});

describe("Top3OfWeek — empty state", () => {
  test("empty items → 'being curated' placeholder copy", () => {
    const { container } = render(<Top3OfWeek items={[]} />);
    const root = container.querySelector(
      "[data-top3-of-week]",
    ) as HTMLElement;
    expect(root.getAttribute("data-top3-of-week-empty")).toBe("true");
    expect(root.textContent).toMatch(/being curated/i);
    expect(root.textContent).toMatch(/check back tomorrow/i);
  });
});

describe("Top3OfWeek — interactions", () => {
  test("tapping a card expands it; siblings dim to 30% opacity", () => {
    const { container } = render(<Top3OfWeek items={ITEMS} />);
    const cards = Array.from(
      container.querySelectorAll("[data-top3-of-week-card]"),
    ) as HTMLElement[];
    fireEvent.click(cards[0]!);

    // Re-query — the active card swaps to the StoryCard expanded body.
    const cardsAfter = Array.from(
      container.querySelectorAll("[data-top3-of-week-card]"),
    ) as HTMLElement[];
    expect(cardsAfter.length).toBe(3);
    expect(cardsAfter[0]!.getAttribute("data-top3-of-week-expanded")).toBe(
      "true",
    );
    // The other two carry the dimmed class
    expect(cardsAfter[1]!.className).toContain("opacity-30");
    expect(cardsAfter[2]!.className).toContain("opacity-30");
  });

  test("expanded card hosts a StoryCard with expanded=true", () => {
    const { container } = render(<Top3OfWeek items={ITEMS} />);
    const card = container.querySelector(
      "[data-top3-of-week-card]",
    ) as HTMLElement;
    fireEvent.click(card);
    const expandedStory = container.querySelector(
      '[data-story-card][data-story-expanded="true"]',
    );
    expect(expandedStory).not.toBeNull();
  });

  test("Build CTA on the expanded card fires onBuild with the story id", () => {
    const onBuild = mock((_id: string) => {});
    const { container } = render(<Top3OfWeek items={ITEMS} onBuild={onBuild} />);
    const card = container.querySelector(
      "[data-top3-of-week-card]",
    ) as HTMLElement;
    fireEvent.click(card);
    const cta = container.querySelector(
      'button[data-variant="primary"]',
    ) as HTMLButtonElement;
    expect(cta).not.toBeNull();
    fireEvent.click(cta);
    expect(onBuild).toHaveBeenCalledTimes(1);
    expect(onBuild.mock.calls[0]?.[0]).toBe(ITEMS[0]!.story.id);
  });
});

describe("Top3OfWeek — prefers-reduced-motion", () => {
  // The collapsed-card transition uses CSS classes (transition-[opacity,
  // box-shadow] + duration-300). Globally, app/globals.css forces
  // transition-duration ~0ms under prefers-reduced-motion. The component
  // does not gate behavior on the media query itself — it relies on the
  // global override. This test pins that contract: the component must NOT
  // emit any inline animation/transition style that would bypass the global
  // reduced-motion override.
  test("no inline animation/transition on the collapsed card root", () => {
    const { container } = render(<Top3OfWeek items={ITEMS} />);
    const card = container.querySelector(
      "[data-top3-of-week-card]",
    ) as HTMLElement;
    expect(card.style.animation).toBe("");
    expect(card.style.transition).toBe("");
    expect(card.style.transform).toBe("");
  });
});

describe("Top3OfWeek — curation lib contract", () => {
  test("getTop3OfWeek resolves storyIds against the seed", () => {
    expect(ITEMS.length).toBe(3);
    for (const item of ITEMS) {
      expect(SEED_STORIES.some((s) => s.id === item.story.id)).toBe(true);
      expect([1, 2, 3]).toContain(item.rank);
      expect(item.curatorialNote.length).toBeGreaterThan(20);
    }
  });

  test("ranks are unique across the 3 picks", () => {
    const ranks = new Set(ITEMS.map((i: Top3OfWeekItem) => i.rank));
    expect(ranks.size).toBe(ITEMS.length);
  });
});
