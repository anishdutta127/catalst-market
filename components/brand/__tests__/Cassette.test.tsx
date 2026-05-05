import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/react";
import { Cassette } from "../Cassette";
import { DottedText } from "../DottedText";

describe("Cassette — structure", () => {
  test("renders a fill rect AND a dot-rendered border (no solid stroke)", () => {
    const { container } = render(
      <Cassette contentWidth={20} contentHeight={10} />,
    );
    expect(container.querySelector("[data-cassette-fill]")).not.toBeNull();
    expect(container.querySelector("[data-cassette-border]")).not.toBeNull();
    // The fill rect must NOT carry a stroke attribute — borders are dots.
    const fill = container.querySelector("[data-cassette-fill]") as SVGRectElement;
    expect(fill.getAttribute("stroke")).toBeNull();
  });

  test("border is composed of discrete <rect data-cassette-border-dot> dots", () => {
    const { container } = render(
      <Cassette contentWidth={40} contentHeight={20} />,
    );
    const dots = container.querySelectorAll("[data-cassette-border-dot]");
    expect(dots.length).toBeGreaterThanOrEqual(8); // top + bottom + left + right
    // Every border element is a square dot, not a line/stroke.
    dots.forEach((d) => {
      expect(d.tagName.toLowerCase()).toBe("rect");
      const w = Number(d.getAttribute("width"));
      const h = Number(d.getAttribute("height"));
      expect(w).toBe(h); // square
    });
  });

  test("border has dots on all four sides (top, bottom, left, right)", () => {
    const { container } = render(
      <Cassette contentWidth={30} contentHeight={20} />,
    );
    expect(container.querySelectorAll('[data-cassette-border-dot="top"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-cassette-border-dot="bottom"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-cassette-border-dot="left"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-cassette-border-dot="right"]').length).toBeGreaterThan(0);
  });
});

describe("Cassette — sizing", () => {
  test("outer SVG dimensions = content + 2×padding + 2×dotSize", () => {
    const dotSize = 2;
    const padX = 5;
    const padY = 3;
    const contentWidth = 30;
    const contentHeight = 14;
    const { container } = render(
      <Cassette
        contentWidth={contentWidth}
        contentHeight={contentHeight}
        dotSize={dotSize}
        padding={{ x: padX, y: padY }}
      />,
    );
    const svg = container.querySelector("svg")!;
    expect(Number(svg.getAttribute("width"))).toBe(contentWidth + padX * 2 + dotSize * 2);
    expect(Number(svg.getAttribute("height"))).toBe(contentHeight + padY * 2 + dotSize * 2);
  });

  test("variant 'date-cassette' produces a larger outer box than 'pin-label' for the same content", () => {
    const { container: pin } = render(
      <Cassette contentWidth={20} contentHeight={10} variant="pin-label" />,
    );
    const { container: dat } = render(
      <Cassette contentWidth={20} contentHeight={10} variant="date-cassette" />,
    );
    const pinW = Number(pin.querySelector("svg")!.getAttribute("width"));
    const datW = Number(dat.querySelector("svg")!.getAttribute("width"));
    expect(datW).toBeGreaterThan(pinW);
  });
});

describe("Cassette — fill", () => {
  test("default fill is Catalst Coral var(--color-cta) at 90% opacity", () => {
    const { container } = render(<Cassette contentWidth={20} contentHeight={10} />);
    const fill = container.querySelector("[data-cassette-fill]") as SVGRectElement;
    expect(fill.getAttribute("fill")).toBe("var(--color-cta)");
    expect(Number(fill.getAttribute("fill-opacity"))).toBeCloseTo(0.9, 2);
  });

  test("custom fill flows to the inner rect (border color independent)", () => {
    const { container } = render(
      <Cassette contentWidth={20} contentHeight={10} fill="#abc" borderColor="#def" />,
    );
    const fill = container.querySelector("[data-cassette-fill]") as SVGRectElement;
    expect(fill.getAttribute("fill")).toBe("#abc");
    const dot = container.querySelector("[data-cassette-border-dot]") as SVGRectElement;
    expect(dot.getAttribute("fill")).toBe("#def");
  });
});

describe("Cassette — content slot", () => {
  test("renders children inside a translated <g data-cassette-content>", () => {
    const { container } = render(
      <Cassette contentWidth={10} contentHeight={7}>
        <DottedText text="X" dotSize={1} />
      </Cassette>,
    );
    const slot = container.querySelector("[data-cassette-content]");
    expect(slot).not.toBeNull();
    // The DottedText SVG should be a descendant of the slot
    expect(slot!.querySelector("[data-dotted-text]")).not.toBeNull();
  });

  test("slot transform offsets by (dot + padX, dot + padY)", () => {
    const { container } = render(
      <Cassette
        contentWidth={20}
        contentHeight={10}
        dotSize={2}
        padding={{ x: 5, y: 3 }}
      >
        <text>x</text>
      </Cassette>,
    );
    const slot = container.querySelector("[data-cassette-content]") as SVGGElement;
    const t = slot.getAttribute("transform");
    // dot=2, padX=5 → 7, padY=3 → 5
    expect(t).toBe("translate(7, 5)");
  });
});
