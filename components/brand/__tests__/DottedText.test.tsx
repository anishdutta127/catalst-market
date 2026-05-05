import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/react";
import { DottedText } from "../DottedText";
import { countOnPixels, GLYPH_HEIGHT, GLYPH_KERN, GLYPH_WIDTH } from "../font-bitmap";

describe("DottedText — pixel count", () => {
  test("renders one <rect data-dotted-pixel> per on-pixel in the input", () => {
    const { container } = render(<DottedText text="SF" size="label" />);
    const dots = container.querySelectorAll('[data-dotted-pixel]');
    expect(dots.length).toBe(countOnPixels("SF"));
  });

  test("uppercases the input transparently", () => {
    const { container: c1 } = render(<DottedText text="sf" />);
    const { container: c2 } = render(<DottedText text="SF" />);
    expect(
      c1.querySelectorAll('[data-dotted-pixel]').length,
    ).toBe(c2.querySelectorAll('[data-dotted-pixel]').length);
  });

  test("renders zero pixels for an all-space string", () => {
    const { container } = render(<DottedText text="   " />);
    expect(container.querySelectorAll('[data-dotted-pixel]').length).toBe(0);
  });

  test("renders zero pixels for unknown characters (no fallback glyph)", () => {
    const { container } = render(<DottedText text="@!?" />);
    expect(container.querySelectorAll('[data-dotted-pixel]').length).toBe(0);
  });
});

describe("DottedText — SVG dimensions", () => {
  test("width respects GLYPH_WIDTH × dotSize + kerning", () => {
    const dotSize = 4;
    const text = "AB"; // 2 glyphs
    const expectedWidth = 2 * GLYPH_WIDTH * dotSize + 1 * GLYPH_KERN * dotSize;
    const { container } = render(
      <DottedText text={text} dotSize={dotSize} />,
    );
    const svg = container.querySelector("svg");
    expect(svg!.getAttribute("width")).toBe(String(expectedWidth));
  });

  test("height is GLYPH_HEIGHT × dotSize", () => {
    const dotSize = 3;
    const { container } = render(<DottedText text="X" dotSize={dotSize} />);
    const svg = container.querySelector("svg");
    expect(svg!.getAttribute("height")).toBe(String(GLYPH_HEIGHT * dotSize));
  });

  test("size preset 'headline' produces taller SVG than 'route'", () => {
    const { container: ch } = render(<DottedText text="X" size="headline" />);
    const { container: cr } = render(<DottedText text="X" size="route" />);
    const hHeight = Number(ch.querySelector("svg")!.getAttribute("height"));
    const rHeight = Number(cr.querySelector("svg")!.getAttribute("height"));
    expect(hHeight).toBeGreaterThan(rHeight);
  });
});

describe("DottedText — accessibility", () => {
  test("default rendering is aria-hidden", () => {
    const { container } = render(<DottedText text="X" />);
    expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  test("ariaLabel promotes to role=img with the label", () => {
    const { container } = render(<DottedText text="X" ariaLabel="Active city: SF" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toBe("Active city: SF");
  });

  test("data-dotted-text-content reflects the uppercased input (debugging aid)", () => {
    const { container } = render(<DottedText text="hello" />);
    expect(
      container.querySelector("svg")!.getAttribute("data-dotted-text-content"),
    ).toBe("HELLO");
  });
});

describe("DottedText — coloring", () => {
  test("default fill is var(--color-ink)", () => {
    const { container } = render(<DottedText text="A" />);
    const px = container.querySelector('[data-dotted-pixel]') as SVGRectElement;
    expect(px.getAttribute("fill")).toBe("var(--color-ink)");
  });

  test("color override flows through to every pixel", () => {
    const { container } = render(<DottedText text="A" color="#ff0" />);
    const pixels = container.querySelectorAll('[data-dotted-pixel]');
    expect(pixels.length).toBeGreaterThan(0);
    pixels.forEach((p) => expect(p.getAttribute("fill")).toBe("#ff0"));
  });
});
