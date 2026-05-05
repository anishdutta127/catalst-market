import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/react";
import seedRaw from "@/content/stories.seed.json";
import { validateSeed } from "@/lib/seed-validate";
import { GlobeHero } from "../GlobeHero";

const seed = validateSeed(seedRaw);
const NOW = new Date("2026-05-03T12:00:00Z");

describe("GlobeHero — render states", () => {
  test("loading state (stories=undefined): renders skeleton with state attr", () => {
    const { container } = render(<GlobeHero stories={undefined} />);
    const root = container.querySelector("[data-globe-hero]") as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.getAttribute("data-globe-hero-state")).toBe("loading");
  });

  test("error state (stories=null): renders empty-state copy, NO globe", () => {
    const { container } = render(<GlobeHero stories={null} />);
    const root = container.querySelector("[data-globe-hero]") as HTMLElement;
    expect(root.getAttribute("data-globe-hero-state")).toBe("error");
    expect(container.querySelector("[data-globe]")).toBeNull();
    expect(container.textContent).toMatch(/Couldn.t load signals/);
  });

  test("quiet state (empty stories): renders quiet headline + static globe", () => {
    const { container } = render(<GlobeHero stories={[]} now={NOW} />);
    const root = container.querySelector("[data-globe-hero]") as HTMLElement;
    expect(root.getAttribute("data-globe-hero-state")).toBe("quiet");
    expect(container.querySelector("[data-globe-variant=static]")).not.toBeNull();
  });

  test("populated state (seed): renders heat headline + narrative globe", () => {
    const { container } = render(<GlobeHero stories={seed} now={NOW} />);
    const root = container.querySelector("[data-globe-hero]") as HTMLElement;
    expect(root.getAttribute("data-globe-hero-state")).toBe("populated");
    const headline = container.querySelector("[data-heat-headline]") as HTMLElement;
    expect(headline).not.toBeNull();
    expect(headline.textContent).toContain("Bangalore");
    expect(container.querySelector("[data-globe-variant=narrative]")).not.toBeNull();
  });

  test("populated state renders the subline (story-type breakdown)", () => {
    const { container } = render(<GlobeHero stories={seed} now={NOW} />);
    const subline = container.querySelector("[data-heat-subline]") as HTMLElement;
    expect(subline).not.toBeNull();
    expect(subline.textContent!.length).toBeGreaterThan(0);
  });

  test("showHeadline=false suppresses the heat headline + subline (v3 hero band)", () => {
    const { container } = render(
      <GlobeHero stories={seed} now={NOW} showHeadline={false} />,
    );
    const root = container.querySelector("[data-globe-hero]") as HTMLElement;
    expect(root.getAttribute("data-globe-hero-headline")).toBe("hidden");
    expect(container.querySelector("[data-heat-headline]")).toBeNull();
    expect(container.querySelector("[data-heat-subline]")).toBeNull();
    // Globe still renders
    expect(container.querySelector("[data-globe]")).not.toBeNull();
  });

  test("showHeadline default true preserves the headline (regression guard)", () => {
    const { container } = render(<GlobeHero stories={seed} now={NOW} />);
    const root = container.querySelector("[data-globe-hero]") as HTMLElement;
    expect(root.getAttribute("data-globe-hero-headline")).toBe("shown");
    expect(container.querySelector("[data-heat-headline]")).not.toBeNull();
  });
});

describe("GlobeHero — accessibility", () => {
  test("populated state passes the heat headline as aria-label on the globe", () => {
    const { container } = render(<GlobeHero stories={seed} now={NOW} />);
    const globe = container.querySelector("[data-globe]") as HTMLElement;
    expect(globe.getAttribute("aria-label")).toContain("Bangalore");
  });

  test("loading state has aria-label on the skeleton globe", () => {
    const { container } = render(<GlobeHero stories={undefined} />);
    const globe = container.querySelector("[data-globe]") as HTMLElement;
    expect(globe).not.toBeNull();
    expect(globe.getAttribute("aria-label")).toBe("Loading signals");
  });
});
