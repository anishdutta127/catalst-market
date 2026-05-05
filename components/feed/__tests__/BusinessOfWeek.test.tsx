import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import { BusinessOfWeek } from "../BusinessOfWeek";
import { getBusinessOfWeek } from "@/lib/curation";
import type { BusinessOfTheWeek } from "@/lib/curation";
import type { BuildAngleCard } from "@/lib/angle-aggregator";

const DATA = getBusinessOfWeek();

// A stand-in angle that matches DATA.relatedBuildAngleId so the related-
// angle line resolves and renders during tests.
const RESOLVED_ANGLE: BuildAngleCard = {
  id: DATA.relatedBuildAngleId ?? "angle-test",
  title: "Domain UX over the raw model",
  description: "wedge",
  wedgeHint: "hint",
  inspiringStoryIds: ["sarvam-ai-multilingual-launch"],
  industry: "ai",
  primaryMood: "quiet-builders",
};

describe("BusinessOfWeek — render shape (all sections)", () => {
  test("renders hero, name, tagline, weekly arc paragraphs, stats, link, pull-quote", () => {
    const { container } = render(<BusinessOfWeek data={DATA} />);
    const root = container.querySelector("[data-business-of-week]") as HTMLElement;
    expect(root).not.toBeNull();
    expect(container.querySelector("[data-business-of-week-hero]")).not.toBeNull();
    expect(container.querySelector("[data-business-of-week-name]")?.textContent).toBe(
      DATA.companyName,
    );
    expect(
      container.querySelector("[data-business-of-week-tagline]")?.textContent,
    ).toBe(DATA.tagline);
    const arcParagraphs = container.querySelectorAll(
      "[data-business-of-week-arc-paragraph]",
    );
    expect(arcParagraphs.length).toBe(3);
    const stats = container.querySelectorAll("[data-business-of-week-stat]");
    expect(stats.length).toBe(3);
    const link = container.querySelector(
      "[data-business-of-week-external]",
    ) as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toBe(DATA.externalUrl);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(
      container.querySelector("[data-business-of-week-pullquote]"),
    ).not.toBeNull();
  });

  test("section caption renders 'Business of the week'", () => {
    const { container } = render(<BusinessOfWeek data={DATA} />);
    const heading = container.querySelector(
      "#business-of-week-heading",
    ) as HTMLElement;
    expect(heading).not.toBeNull();
    // Phase 7b: the section caption renders as DottedText. Assert via the
    // shared SectionCaption data attribute rather than textContent.
    expect(
      heading.getAttribute("data-section-caption-text")?.toLowerCase(),
    ).toBe("business of the week");
  });
});

describe("BusinessOfWeek — image fallback", () => {
  test("undefined imageUrl renders the mood-tinted placeholder hero", () => {
    const noImage: BusinessOfTheWeek = { ...DATA, imageUrl: undefined };
    const { container } = render(<BusinessOfWeek data={noImage} />);
    const placeholder = container.querySelector(
      '[data-business-of-week-hero="placeholder"]',
    ) as HTMLElement;
    expect(placeholder).not.toBeNull();
    expect(placeholder.getAttribute("aria-hidden")).toBe("true");
    // Real img tag must NOT be present
    expect(container.querySelector("img[data-business-of-week-hero]")).toBeNull();
  });

  test("provided imageUrl renders a real <img> hero", () => {
    const withImage: BusinessOfTheWeek = {
      ...DATA,
      imageUrl: "https://example.com/sarvam.jpg",
    };
    const { container } = render(<BusinessOfWeek data={withImage} />);
    const img = container.querySelector(
      "img[data-business-of-week-hero]",
    ) as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toBe("https://example.com/sarvam.jpg");
    expect(
      container.querySelector('[data-business-of-week-hero="placeholder"]'),
    ).toBeNull();
  });
});

describe("BusinessOfWeek — related Build Angle line", () => {
  test("renders the related-angle button when angle resolves", () => {
    const { container } = render(
      <BusinessOfWeek data={DATA} angles={[RESOLVED_ANGLE]} />,
    );
    const link = container.querySelector(
      "[data-business-of-week-related-angle]",
    ) as HTMLElement;
    expect(link).not.toBeNull();
    expect(link.getAttribute("data-business-of-week-related-angle-id")).toBe(
      RESOLVED_ANGLE.id,
    );
    expect(link.textContent).toContain(RESOLVED_ANGLE.title);
  });

  test("hides the related-angle line when relatedBuildAngleId is undefined", () => {
    const noAngle: BusinessOfTheWeek = {
      ...DATA,
      relatedBuildAngleId: undefined,
    };
    const { container } = render(<BusinessOfWeek data={noAngle} />);
    expect(
      container.querySelector("[data-business-of-week-related-angle]"),
    ).toBeNull();
  });

  test("hides the related-angle line when angle id is set but not in the angles list", () => {
    const { container } = render(
      <BusinessOfWeek data={DATA} angles={[]} />,
    );
    expect(
      container.querySelector("[data-business-of-week-related-angle]"),
    ).toBeNull();
  });

  test("tap fires onAngleTap with the angle id", () => {
    const onAngleTap = mock((_id: string) => {});
    const { container } = render(
      <BusinessOfWeek
        data={DATA}
        angles={[RESOLVED_ANGLE]}
        onAngleTap={onAngleTap}
      />,
    );
    const link = container.querySelector(
      "[data-business-of-week-related-angle]",
    ) as HTMLButtonElement;
    fireEvent.click(link);
    expect(onAngleTap).toHaveBeenCalledTimes(1);
    expect(onAngleTap.mock.calls[0]?.[0]).toBe(RESOLVED_ANGLE.id);
  });
});

describe("BusinessOfWeek — pull-quote uses DottedText", () => {
  test("pull-quote renders one dotted-text word per token", () => {
    const { container } = render(<BusinessOfWeek data={DATA} />);
    const pq = container.querySelector(
      "[data-business-of-week-pullquote]",
    ) as HTMLElement;
    expect(pq).not.toBeNull();
    const dotted = pq.querySelectorAll("[data-dotted-text]");
    const expectedTokenCount = DATA.pullQuote.trim().split(/\s+/).length;
    expect(dotted.length).toBe(expectedTokenCount);
  });

  test("pull-quote DottedText pixels render in ink color", () => {
    const { container } = render(<BusinessOfWeek data={DATA} />);
    const pq = container.querySelector(
      "[data-business-of-week-pullquote]",
    ) as HTMLElement;
    const firstPixel = pq.querySelector("[data-dotted-pixel]");
    expect(firstPixel).not.toBeNull();
    expect(firstPixel!.getAttribute("fill")).toBe("var(--color-ink)");
  });
});

describe("BusinessOfWeek — mobile stacking layout", () => {
  test("grid uses md:grid-cols-[3fr_2fr] (single column on mobile, 60/40 on md+)", () => {
    const { container } = render(<BusinessOfWeek data={DATA} />);
    const grid = container.querySelector(
      "[data-business-of-week-grid]",
    ) as HTMLElement;
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("md:grid-cols-[3fr_2fr]");
  });

  test("pull-quote wrapper stacks below brief on mobile (border-t at base, border-l at md+)", () => {
    const { container } = render(<BusinessOfWeek data={DATA} />);
    const wrapper = container.querySelector(
      "[data-business-of-week-pullquote-wrapper]",
    ) as HTMLElement;
    expect(wrapper.className).toContain("border-t");
    expect(wrapper.className).toContain("md:border-t-0");
    expect(wrapper.className).toContain("md:border-l");
  });
});

describe("BusinessOfWeek — curation lib contract", () => {
  test("getBusinessOfWeek returns Sarvam AI as the seed pick", () => {
    expect(DATA.companyId).toBe("sarvam-ai");
    expect(DATA.companyName).toBe("Sarvam AI");
    expect(DATA.weeklyArc.length).toBe(3);
    expect(DATA.keyStats.length).toBe(3);
    expect(DATA.pullQuote.length).toBeGreaterThan(40);
    expect(DATA.primaryMoodForTint).toBe("quiet-builders");
  });
});
