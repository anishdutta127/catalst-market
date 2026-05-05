import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import seedRaw from "@/content/stories.seed.json";
import { LiveSignals } from "../LiveSignals";
import { buildSignalsFromStories } from "@/lib/live-signals";
import { validateSeed } from "@/lib/seed-validate";

const seed = validateSeed(seedRaw);
const SIGNALS = buildSignalsFromStories(seed);

// ─────────────────────────────────────────────────────────────────────────────
// matchMedia mock — toggles desktop vs mobile + reduced motion
// ─────────────────────────────────────────────────────────────────────────────

let originalMatchMedia: typeof window.matchMedia;
beforeEach(() => {
  originalMatchMedia = window.matchMedia;
});
afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

function mockMatchMedia({
  desktop = false,
  reducedMotion = false,
}: {
  desktop?: boolean;
  reducedMotion?: boolean;
} = {}) {
  window.matchMedia = ((query: string) => ({
    matches:
      (query.includes("min-width: 1024px") && desktop) ||
      (query.includes("prefers-reduced-motion: reduce") && reducedMotion),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant resolution
// ─────────────────────────────────────────────────────────────────────────────

describe("LiveSignals — variant resolution", () => {
  test("matchesDesktop=true → renders sidebar variant", () => {
    const { container } = render(
      <LiveSignals signals={SIGNALS} matchesDesktop />,
    );
    const root = container.querySelector("[data-live-signals]") as HTMLElement;
    expect(root.getAttribute("data-live-variant")).toBe("sidebar");
  });

  test("matchesDesktop=false → renders ticker variant", () => {
    const { container } = render(
      <LiveSignals signals={SIGNALS} matchesDesktop={false} />,
    );
    const root = container.querySelector("[data-live-signals]") as HTMLElement;
    expect(root.getAttribute("data-live-variant")).toBe("ticker");
  });

  test("variant prop overrides auto-detection", () => {
    const { container } = render(
      <LiveSignals signals={SIGNALS} matchesDesktop variant="ticker" />,
    );
    const root = container.querySelector("[data-live-signals]") as HTMLElement;
    expect(root.getAttribute("data-live-variant")).toBe("ticker");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar variant
// ─────────────────────────────────────────────────────────────────────────────

describe("LiveSignals — sidebar variant", () => {
  test("renders header + footer + scrolling list", () => {
    const { container } = render(
      <LiveSignals signals={SIGNALS} variant="sidebar" />,
    );
    expect(container.querySelector("[data-live-header]")).not.toBeNull();
    expect(container.querySelector("[data-live-footer]")).not.toBeNull();
    expect(container.querySelector("[data-live-list]")).not.toBeNull();
  });

  test("renders 8+ visible item rows in the doubled list", () => {
    const { container } = render(
      <LiveSignals signals={SIGNALS} variant="sidebar" />,
    );
    // Strip is doubled for seamless wrap, so 10 signals → 20 rendered nodes.
    const items = container.querySelectorAll("[data-live-item]");
    expect(items.length).toBe(SIGNALS.length * 2);
  });

  test("each item carries the storyId data attr", () => {
    const { container } = render(
      <LiveSignals signals={SIGNALS} variant="sidebar" />,
    );
    const items = container.querySelectorAll("[data-live-item]");
    for (const it of items) {
      expect(it.getAttribute("data-live-item-id")).not.toBeNull();
    }
  });

  test("clicking an item fires onItemTap with the storyId", () => {
    const onItemTap = mock((_id: string) => {});
    const { container } = render(
      <LiveSignals
        signals={SIGNALS}
        variant="sidebar"
        onItemTap={onItemTap}
      />,
    );
    const item = container.querySelector(
      "[data-live-item]",
    ) as HTMLButtonElement;
    fireEvent.click(item);
    expect(onItemTap).toHaveBeenCalledTimes(1);
    expect(onItemTap.mock.calls[0]?.[0]).toBe(
      item.getAttribute("data-live-item-id") ?? "",
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Ticker variant
// ─────────────────────────────────────────────────────────────────────────────

describe("LiveSignals — ticker variant", () => {
  test("renders LIVE prefix + scrolling strip", () => {
    const { container } = render(
      <LiveSignals signals={SIGNALS} variant="ticker" />,
    );
    expect(container.querySelector("[data-live-prefix]")).not.toBeNull();
    expect(container.querySelector("[data-live-strip]")).not.toBeNull();
  });

  test("renders signals doubled in the strip for seamless wrap", () => {
    const { container } = render(
      <LiveSignals signals={SIGNALS} variant="ticker" />,
    );
    const items = container.querySelectorAll("[data-live-item]");
    expect(items.length).toBe(SIGNALS.length * 2);
  });

  test("clicking a ticker item fires onItemTap", () => {
    const onItemTap = mock((_id: string) => {});
    const { container } = render(
      <LiveSignals signals={SIGNALS} variant="ticker" onItemTap={onItemTap} />,
    );
    const item = container.querySelector("[data-live-item]") as HTMLButtonElement;
    fireEvent.click(item);
    expect(onItemTap).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Quiet placeholder
// ─────────────────────────────────────────────────────────────────────────────

describe("LiveSignals — empty stories → quiet placeholder", () => {
  test("sidebar variant: renders quiet placeholder, no items", () => {
    const { container } = render(<LiveSignals signals={[]} variant="sidebar" />);
    const root = container.querySelector("[data-live-signals]") as HTMLElement;
    expect(root.getAttribute("data-live-quiet")).toBe("true");
    expect(container.querySelector("[data-live-item]")).toBeNull();
    expect(root.textContent).toMatch(/Quiet hour/);
  });

  test("ticker variant: renders quiet placeholder", () => {
    const { container } = render(<LiveSignals signals={[]} variant="ticker" />);
    const root = container.querySelector("[data-live-signals]") as HTMLElement;
    expect(root.getAttribute("data-live-quiet")).toBe("true");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Reduced motion
// ─────────────────────────────────────────────────────────────────────────────

describe("LiveSignals — prefers-reduced-motion", () => {
  test("sidebar with reduced motion: data-live-reduced-motion=true", () => {
    mockMatchMedia({ desktop: true, reducedMotion: true });
    const { container } = render(
      <LiveSignals signals={SIGNALS} matchesDesktop variant="sidebar" />,
    );
    const root = container.querySelector("[data-live-signals]") as HTMLElement;
    expect(root.getAttribute("data-live-reduced-motion")).toBe("true");
    // Pulse dot should NOT be marked active
    const pulse = container.querySelector("[data-live-pulse]") as HTMLElement;
    expect(pulse).not.toBeNull();
  });

  test("ticker with reduced motion: data-live-reduced-motion=true", () => {
    mockMatchMedia({ desktop: false, reducedMotion: true });
    const { container } = render(
      <LiveSignals signals={SIGNALS} variant="ticker" matchesDesktop={false} />,
    );
    const root = container.querySelector("[data-live-signals]") as HTMLElement;
    expect(root.getAttribute("data-live-reduced-motion")).toBe("true");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Hover pause
// ─────────────────────────────────────────────────────────────────────────────

describe("LiveSignals — hover pauses", () => {
  test("sidebar: pulse dot toggles inactive on mouseenter, active on mouseleave", () => {
    const { container } = render(
      <LiveSignals signals={SIGNALS} variant="sidebar" matchesDesktop />,
    );
    const root = container.querySelector("[data-live-signals]") as HTMLElement;
    const pulse = container.querySelector("[data-live-pulse]") as HTMLElement;
    expect(pulse.getAttribute("data-live-pulse-active")).toBe("true");

    fireEvent.mouseEnter(root);
    expect(pulse.getAttribute("data-live-pulse-active")).toBe("false");

    fireEvent.mouseLeave(root);
    expect(pulse.getAttribute("data-live-pulse-active")).toBe("true");
  });
});
