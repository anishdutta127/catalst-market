import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import { FilterChip } from "../FilterChip";
import { useFilterStore } from "@/lib/filter/useFilter";

beforeEach(() => {
  useFilterStore.getState().clear();
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.clear();
  }
});

afterEach(() => {
  useFilterStore.getState().clear();
});

describe("FilterChip — variants", () => {
  test("inline variant renders with data-filter-chip-variant=inline", () => {
    const { container } = render(<FilterChip onOpen={() => {}} />);
    const chip = container.querySelector("[data-filter-chip]") as HTMLElement;
    expect(chip.getAttribute("data-filter-chip-variant")).toBe("inline");
  });

  test("floating variant renders with data-filter-chip-variant=floating", () => {
    const { container } = render(
      <FilterChip variant="floating" onOpen={() => {}} />,
    );
    const chip = container.querySelector("[data-filter-chip]") as HTMLElement;
    expect(chip.getAttribute("data-filter-chip-variant")).toBe("floating");
  });

  test("floating variant uses glass-chrome class", () => {
    const { container } = render(
      <FilterChip variant="floating" onOpen={() => {}} />,
    );
    const chip = container.querySelector("[data-filter-chip]") as HTMLElement;
    expect(chip.className).toContain("glass-chrome");
  });
});

describe("FilterChip — click → onOpen", () => {
  test("clicking the inline chip calls onOpen", () => {
    const onOpen = mock(() => {});
    const { container } = render(<FilterChip onOpen={onOpen} />);
    const chip = container.querySelector(
      "[data-filter-chip]",
    ) as HTMLButtonElement;
    fireEvent.click(chip);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test("clicking the floating chip calls onOpen", () => {
    const onOpen = mock(() => {});
    const { container } = render(
      <FilterChip variant="floating" onOpen={onOpen} />,
    );
    const chip = container.querySelector(
      "[data-filter-chip]",
    ) as HTMLButtonElement;
    fireEvent.click(chip);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe("FilterChip — label states reflect store", () => {
  test("empty store → 'All — 0 filters'", () => {
    const { container } = render(<FilterChip onOpen={() => {}} />);
    const label = container.querySelector(
      "[data-filter-chip-label]",
    ) as HTMLElement;
    // Phase 7b: chip label renders as DottedText SVG. Assert the
    // data attribute that mirrors the source string instead of
    // textContent (DottedText emits no text nodes).
    expect(label.getAttribute("data-filter-chip-label-text")).toBe(
      "All — 0 filters",
    );
  });

  test("one mood → just the label", () => {
    useFilterStore.getState().toggleMood("blowing-up");
    const { container } = render(<FilterChip onOpen={() => {}} />);
    const label = container.querySelector(
      "[data-filter-chip-label]",
    ) as HTMLElement;
    expect(label.getAttribute("data-filter-chip-label-text")).toBe("Blowing up");
  });

  test("two scopes → joined by ' · '", () => {
    useFilterStore.getState().toggleMood("blowing-up");
    useFilterStore.getState().toggleIndustry("ai");
    const { container } = render(<FilterChip onOpen={() => {}} />);
    const label = container.querySelector(
      "[data-filter-chip-label]",
    ) as HTMLElement;
    expect(label.getAttribute("data-filter-chip-label-text")).toBe(
      "Blowing up · AI",
    );
  });

  test("three+ scopes → +N overflow", () => {
    useFilterStore.getState().toggleMood("blowing-up");
    useFilterStore.getState().toggleIndustry("ai");
    useFilterStore.getState().toggleStage("builders");
    const { container } = render(<FilterChip onOpen={() => {}} />);
    const label = container.querySelector(
      "[data-filter-chip-label]",
    ) as HTMLElement;
    expect(label.getAttribute("data-filter-chip-label-text")).toBe(
      "Blowing up · AI · +1",
    );
  });
});

describe("FilterChip — active visual state", () => {
  test("inactive → no Coral ring", () => {
    const { container } = render(<FilterChip onOpen={() => {}} />);
    const chip = container.querySelector("[data-filter-chip]") as HTMLElement;
    expect(chip.getAttribute("data-filter-chip-active")).toBe("false");
    expect(chip.className).not.toContain("ring-cta");
  });

  test("active (any scope present) → Coral ring", () => {
    useFilterStore.getState().toggleMood("blowing-up");
    const { container } = render(<FilterChip onOpen={() => {}} />);
    const chip = container.querySelector("[data-filter-chip]") as HTMLElement;
    expect(chip.getAttribute("data-filter-chip-active")).toBe("true");
    expect(chip.className).toContain("ring-cta");
  });
});
