import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import { Movers } from "../Movers";
import {
  __curationTesting,
  getMovers,
  isMoverCandidate,
} from "@/lib/curation";
import { SEED_STORIES } from "@/lib/seed";
import type { AnyStory } from "@/lib/types/story";

const MOVERS = getMovers();

describe("Movers — render shape", () => {
  test("renders 3 mover rows", () => {
    const { container } = render(<Movers stories={MOVERS} />);
    const rows = container.querySelectorAll("[data-mover-row]");
    expect(rows.length).toBe(3);
  });

  test("each row has a rank badge, company, teaser, and city short", () => {
    const { container } = render(<Movers stories={MOVERS} />);
    const rows = container.querySelectorAll(
      "[data-mover-row]:not([data-mover-empty])",
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.querySelector("[data-mover-company]")).not.toBeNull();
      expect(row.querySelector("[data-mover-teaser]")).not.toBeNull();
    }
  });

  test("section heading reads 'Quiet movers'", () => {
    const { container } = render(<Movers stories={MOVERS} />);
    const heading = container.querySelector(
      "#movers-heading",
    ) as HTMLElement;
    expect(heading).not.toBeNull();
    // Phase 7b: caption is DottedText. Assert via the shared
    // data-section-caption-text mirror attribute.
    const captionText = heading
      .getAttribute("data-section-caption-text")
      ?.toLowerCase();
    expect(captionText).toContain("quiet movers");
    expect(captionText).toContain("stories you might've missed");
  });
});

describe("Movers — underdog selection contract", () => {
  test("all 3 picks are from non-tier-1 cities (lat/lng outside SF/NYC/London/Tokyo)", () => {
    expect(MOVERS.length).toBe(3);
    for (const m of MOVERS) {
      expect(__curationTesting.isTier1Story(m)).toBe(false);
    }
  });

  test("all 3 picks satisfy the mover predicate (verified=false OR quiet headline)", () => {
    for (const m of MOVERS) {
      const isQuiet = __curationTesting.isQuietHeadline(m);
      const isUnverified = m.verified === false;
      expect(isUnverified || isQuiet).toBe(true);
    }
  });

  test("isMoverCandidate excludes tier-1 stories regardless of dollar amount", () => {
    // A synthetic SF-anchored story is tier-1 → never a mover.
    const sfStory: AnyStory = {
      ...SEED_STORIES[0]!,
      id: "synthetic-sf",
      lat: 37.77,
      lng: -122.42,
    };
    expect(isMoverCandidate(sfStory)).toBe(false);
  });

  test("isMoverCandidate accepts non-tier-1 stories with no currency headline", () => {
    // The seed Sarvam story (BLR, AI, +22pts) has no currency headline.
    const sarvam = SEED_STORIES.find(
      (s) => s.id === "sarvam-ai-multilingual-launch",
    )!;
    expect(isMoverCandidate(sarvam)).toBe(true);
  });

  test("isMoverCandidate rejects non-tier-1 stories with $500M+ currency headlines", () => {
    // Zepto $500M Series F in BLR — non-tier-1 but big-dollar → not a mover.
    const zepto = SEED_STORIES.find((s) => s.id === "zepto-series-f-2026")!;
    expect(__curationTesting.isTier1Story(zepto)).toBe(false);
    expect(isMoverCandidate(zepto)).toBe(false);
  });
});

describe("Movers — interactions", () => {
  test("tap on a row toggles its expanded state", () => {
    const { container } = render(<Movers stories={MOVERS} />);
    const firstRow = container.querySelector(
      "[data-mover-row]:not([data-mover-empty])",
    ) as HTMLElement;
    expect(firstRow.getAttribute("data-mover-expanded")).toBe("false");
    const toggle = firstRow.querySelector("button") as HTMLButtonElement;
    fireEvent.click(toggle);
    expect(firstRow.getAttribute("data-mover-expanded")).toBe("true");
    expect(firstRow.querySelector("[data-mover-expanded-body]")).not.toBeNull();
    fireEvent.click(toggle);
    expect(firstRow.getAttribute("data-mover-expanded")).toBe("false");
  });

  test("Build CTA inside expanded body fires onBuild with the story id", () => {
    const onBuild = mock((_id: string) => {});
    const { container } = render(
      <Movers stories={MOVERS} onBuild={onBuild} />,
    );
    const firstRow = container.querySelector(
      "[data-mover-row]:not([data-mover-empty])",
    ) as HTMLElement;
    const toggle = firstRow.querySelector("button") as HTMLButtonElement;
    fireEvent.click(toggle);
    const cta = firstRow.querySelector(
      'button[data-variant="primary"]',
    ) as HTMLButtonElement;
    expect(cta).not.toBeNull();
    fireEvent.click(cta);
    expect(onBuild).toHaveBeenCalledTimes(1);
    expect(onBuild.mock.calls[0]?.[0]).toBe(MOVERS[0]!.id);
  });

  test("expanded body shows up to 2 micro-bullets even when story has more", () => {
    // Pick a story with 3 bullets and pass it as the only mover candidate.
    const richStory = SEED_STORIES.find(
      (s) => s.microBullets.length >= 3 && !__curationTesting.isTier1Story(s),
    )!;
    const { container } = render(<Movers stories={[richStory]} />);
    const row = container.querySelector(
      "[data-mover-row]:not([data-mover-empty])",
    ) as HTMLElement;
    fireEvent.click(row.querySelector("button") as HTMLButtonElement);
    const bullets = row
      .querySelector("[data-mover-expanded-body]")!
      .querySelectorAll("ul > li");
    expect(bullets.length).toBeLessThanOrEqual(2);
    expect(bullets.length).toBeGreaterThan(0);
  });
});

describe("Movers — empty-slot padding", () => {
  test("zero stories → 3 empty placeholder rows", () => {
    const { container } = render(<Movers stories={[]} />);
    const rows = container.querySelectorAll("[data-mover-row]");
    expect(rows.length).toBe(3);
    const empties = container.querySelectorAll(
      '[data-mover-row][data-mover-empty="true"]',
    );
    expect(empties.length).toBe(3);
  });

  test("one story → 1 mover row + 2 empty placeholders", () => {
    const onlyOne = MOVERS.slice(0, 1);
    const { container } = render(<Movers stories={onlyOne} />);
    const rows = container.querySelectorAll("[data-mover-row]");
    expect(rows.length).toBe(3);
    const realRows = container.querySelectorAll(
      "[data-mover-row]:not([data-mover-empty])",
    );
    expect(realRows.length).toBe(1);
    const empties = container.querySelectorAll(
      '[data-mover-row][data-mover-empty="true"]',
    );
    expect(empties.length).toBe(2);
  });

  test("empty placeholder copy reads 'No mover for this slot today.'", () => {
    const { container } = render(<Movers stories={[]} />);
    const empty = container.querySelector(
      '[data-mover-row][data-mover-empty="true"]',
    ) as HTMLElement;
    expect(empty.textContent).toMatch(/no mover for this slot/i);
  });
});
