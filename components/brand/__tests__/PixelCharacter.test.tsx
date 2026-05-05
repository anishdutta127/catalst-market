import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/react";
import { PixelCharacter, countPosePixels } from "../PixelCharacter";

describe("PixelCharacter — encoded grid", () => {
  test("'stand' pose has a sensible on-pixel count (>= 30, <= 80)", () => {
    const n = countPosePixels("stand");
    expect(n).toBeGreaterThanOrEqual(30);
    expect(n).toBeLessThanOrEqual(80);
  });

  test("'wave' pose differs from 'stand' (different bitmap)", () => {
    expect(countPosePixels("wave")).not.toBe(countPosePixels("stand"));
  });

  test("renders one <rect data-character-pixel> per on-pixel for the active pose", () => {
    const { container } = render(<PixelCharacter pose="stand" position="lower-right" />);
    const dots = container.querySelectorAll('[data-character-pixel]');
    expect(dots.length).toBe(countPosePixels("stand"));
  });
});

describe("PixelCharacter — sizing", () => {
  test("13×10 grid scales by `cell` prop", () => {
    const { container } = render(
      <PixelCharacter pose="stand" position="lower-right" cell={4} />,
    );
    const svg = container.querySelector("svg")!;
    expect(Number(svg.getAttribute("width"))).toBe(13 * 4);
    expect(Number(svg.getAttribute("height"))).toBe(10 * 4);
  });

  test("default cell is 3", () => {
    const { container } = render(
      <PixelCharacter pose="stand" position="lower-right" />,
    );
    const svg = container.querySelector("svg")!;
    expect(Number(svg.getAttribute("width"))).toBe(13 * 3);
    expect(Number(svg.getAttribute("height"))).toBe(10 * 3);
  });
});

describe("PixelCharacter — position prop", () => {
  test("data-character-position reflects the position prop on the SVG", () => {
    for (const pos of ["lower-left", "lower-right", "upper-right"] as const) {
      const { container, unmount } = render(
        <PixelCharacter position={pos} />,
      );
      const svg = container.querySelector("[data-character]") as HTMLElement;
      expect(svg.getAttribute("data-character-position")).toBe(pos);
      unmount();
    }
  });
});

describe("PixelCharacter — pose prop", () => {
  test("data-character-pose reflects the pose prop", () => {
    const { container, rerender } = render(
      <PixelCharacter position="lower-left" pose="stand" />,
    );
    expect(container.querySelector("[data-character]")!.getAttribute("data-character-pose")).toBe("stand");
    rerender(<PixelCharacter position="lower-left" pose="wave" />);
    expect(container.querySelector("[data-character]")!.getAttribute("data-character-pose")).toBe("wave");
  });
});

describe("PixelCharacter — hard-cut hidden behavior", () => {
  test("default rendering is opacity 1 (visible)", () => {
    const { container } = render(<PixelCharacter position="lower-right" />);
    const svg = container.querySelector("[data-character]") as HTMLElement;
    expect(svg.getAttribute("data-character-hidden")).toBe("false");
    expect(svg.style.opacity).toBe("1");
  });

  test("hidden=true sets opacity 0 (NOT translate or transform)", () => {
    const { container } = render(
      <PixelCharacter position="lower-right" hidden />,
    );
    const svg = container.querySelector("[data-character]") as HTMLElement;
    expect(svg.getAttribute("data-character-hidden")).toBe("true");
    expect(svg.style.opacity).toBe("0");
    // Transform must be empty — no slide. Hard cut only.
    expect(svg.style.transform === "" || svg.style.transform === undefined).toBe(true);
  });

  test("uses CSS transition on opacity (200ms ease) — no transform animation", () => {
    const { container } = render(
      <PixelCharacter position="lower-right" hidden />,
    );
    const svg = container.querySelector("[data-character]") as HTMLElement;
    expect(svg.style.transition).toBe("opacity 200ms ease");
  });
});

describe("PixelCharacter — coloring", () => {
  test("default color is var(--color-cta) Coral", () => {
    const { container } = render(<PixelCharacter position="lower-right" />);
    const px = container.querySelector("[data-character-pixel]") as SVGRectElement;
    expect(px.getAttribute("fill")).toBe("var(--color-cta)");
  });

  test("color override flows to every pixel", () => {
    const { container } = render(
      <PixelCharacter position="lower-right" color="#0ff" />,
    );
    const pixels = container.querySelectorAll('[data-character-pixel]');
    expect(pixels.length).toBeGreaterThan(0);
    pixels.forEach((p) => expect(p.getAttribute("fill")).toBe("#0ff"));
  });
});
