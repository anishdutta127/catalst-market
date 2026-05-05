import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import { FilterPalette } from "../FilterPalette";
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

describe("FilterPalette — visibility", () => {
  test("open=false renders nothing", () => {
    const { container } = render(
      <FilterPalette open={false} onOpenChange={() => {}} />,
    );
    expect(container.querySelector("[data-filter-palette]")).toBeNull();
  });

  test("open=true renders the dialog with role=dialog + aria-modal", () => {
    const { container } = render(
      <FilterPalette open={true} onOpenChange={() => {}} />,
    );
    const dialog = container.querySelector("[data-filter-palette]") as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });
});

describe("FilterPalette — tabs", () => {
  test("default tab is 'mood', renders 9 mood chips", () => {
    const { container } = render(
      <FilterPalette open={true} onOpenChange={() => {}} />,
    );
    const moodSection = container.querySelector(
      '[data-filter-section="mood"]',
    ) as HTMLElement;
    expect(moodSection).not.toBeNull();
    const chips = moodSection.querySelectorAll('[data-chip-variant="mood"], button');
    expect(chips.length).toBeGreaterThanOrEqual(9);
  });

  test("clicking the industry tab swaps to 12 industry chips", () => {
    const { container } = render(
      <FilterPalette open={true} onOpenChange={() => {}} />,
    );
    const industryTab = container.querySelector(
      '[data-filter-tab="industry"]',
    ) as HTMLButtonElement;
    fireEvent.click(industryTab);
    const industrySection = container.querySelector(
      '[data-filter-section="industry"]',
    ) as HTMLElement;
    expect(industrySection).not.toBeNull();
    const chips = industrySection.querySelectorAll("button");
    expect(chips.length).toBeGreaterThanOrEqual(12);
  });

  test("clicking the stage tab swaps to 3 stage chips", () => {
    const { container } = render(
      <FilterPalette open={true} onOpenChange={() => {}} />,
    );
    const stageTab = container.querySelector(
      '[data-filter-tab="stage"]',
    ) as HTMLButtonElement;
    fireEvent.click(stageTab);
    const stageSection = container.querySelector(
      '[data-filter-section="stage"]',
    ) as HTMLElement;
    expect(stageSection).not.toBeNull();
    const chips = stageSection.querySelectorAll("button");
    expect(chips.length).toBe(3);
  });
});

describe("FilterPalette — chip toggle wiring", () => {
  test("clicking a mood chip toggles the store", () => {
    const { container } = render(
      <FilterPalette open={true} onOpenChange={() => {}} />,
    );
    const moodSection = container.querySelector(
      '[data-filter-section="mood"]',
    ) as HTMLElement;
    const firstChip = moodSection.querySelector("button") as HTMLButtonElement;
    fireEvent.click(firstChip);
    expect(useFilterStore.getState().moods.length).toBe(1);
    fireEvent.click(firstChip);
    expect(useFilterStore.getState().moods.length).toBe(0);
  });
});

describe("FilterPalette — close affordances", () => {
  test("ESC key calls onOpenChange(false)", () => {
    const onOpenChange = mock((_n: boolean) => {});
    render(<FilterPalette open={true} onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("'Done' button calls onOpenChange(false)", () => {
    const onOpenChange = mock((_n: boolean) => {});
    const { container } = render(
      <FilterPalette open={true} onOpenChange={onOpenChange} />,
    );
    const done = container.querySelector("[data-filter-done]") as HTMLButtonElement;
    fireEvent.click(done);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("close icon-button calls onOpenChange(false)", () => {
    const onOpenChange = mock((_n: boolean) => {});
    const { container } = render(
      <FilterPalette open={true} onOpenChange={onOpenChange} />,
    );
    const closeBtn = container.querySelector(
      'button[aria-label="Close filter"]',
    ) as HTMLButtonElement;
    fireEvent.click(closeBtn);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("FilterPalette — Clear all", () => {
  test("'Clear all' is disabled when filter is empty", () => {
    const { container } = render(
      <FilterPalette open={true} onOpenChange={() => {}} />,
    );
    const clear = container.querySelector(
      "[data-filter-clear]",
    ) as HTMLButtonElement;
    expect(clear.disabled).toBe(true);
  });

  test("'Clear all' is enabled and works once filter has any scope", () => {
    useFilterStore.getState().toggleMood("blowing-up");
    const { container } = render(
      <FilterPalette open={true} onOpenChange={() => {}} />,
    );
    const clear = container.querySelector(
      "[data-filter-clear]",
    ) as HTMLButtonElement;
    expect(clear.disabled).toBe(false);
    fireEvent.click(clear);
    expect(useFilterStore.getState().moods).toEqual([]);
  });
});
