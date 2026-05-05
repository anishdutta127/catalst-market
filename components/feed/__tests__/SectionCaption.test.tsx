import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/react";
import { SectionCaption } from "../SectionCaption";

describe("SectionCaption — pixel aesthetic playbook contract", () => {
  test("renders an <h2> with the supplied id and text mirror attribute", () => {
    const { container } = render(
      <SectionCaption id="test-cap" text="Today's build angles" />,
    );
    const h2 = container.querySelector("h2#test-cap") as HTMLElement;
    expect(h2).not.toBeNull();
    expect(h2.tagName).toBe("H2");
    expect(h2.getAttribute("data-section-caption-text")).toBe(
      "Today's build angles",
    );
  });

  test("emits a single DottedText SVG with the supplied text uppercased", () => {
    const { container } = render(
      <SectionCaption id="cap" text="Quiet movers — stories" />,
    );
    const dotted = container.querySelectorAll("[data-dotted-text]");
    expect(dotted.length).toBe(1);
    expect(dotted[0]!.getAttribute("data-dotted-text-content")).toBe(
      "QUIET MOVERS — STORIES",
    );
  });

  test("DottedText paints in --color-pen (every dot pixel inherits)", () => {
    const { container } = render(
      <SectionCaption id="cap" text="This week's momentum" />,
    );
    const firstPixel = container.querySelector("[data-dotted-pixel]");
    expect(firstPixel).not.toBeNull();
    expect(firstPixel!.getAttribute("fill")).toBe("var(--color-pen)");
  });

  test("ariaLabel exposes the caption to screen readers", () => {
    const { container } = render(
      <SectionCaption id="cap" text="Business of the week" />,
    );
    const dotted = container.querySelector("[data-dotted-text]") as HTMLElement;
    expect(dotted.getAttribute("aria-label")).toBe("Business of the week");
    expect(dotted.getAttribute("role")).toBe("img");
  });
});
