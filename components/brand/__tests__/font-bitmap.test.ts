import { describe, expect, test } from "bun:test";
import {
  GLYPHS,
  GLYPH_HEIGHT,
  GLYPH_KERN,
  GLYPH_WIDTH,
  SUPPORTED_CHARS,
  countOnPixels,
  getGlyph,
  isPixelOn,
  textWidth,
} from "../font-bitmap";

describe("font-bitmap — shape", () => {
  test("glyph dimensions are 5×7 with 1 column kerning", () => {
    expect(GLYPH_WIDTH).toBe(5);
    expect(GLYPH_HEIGHT).toBe(7);
    expect(GLYPH_KERN).toBe(1);
  });

  test("every supported glyph compiles to a 35-cell boolean grid", () => {
    for (const ch of SUPPORTED_CHARS) {
      const g = GLYPHS[ch];
      expect(g).toBeDefined();
      expect(g!.length).toBe(GLYPH_WIDTH * GLYPH_HEIGHT);
      for (const v of g!) expect(typeof v).toBe("boolean");
    }
  });

  test("supported set covers A-Z, 0-9, space, comma, period, hyphen, →", () => {
    for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") {
      expect(GLYPHS[ch]).toBeDefined();
    }
    expect(GLYPHS[" "]).toBeDefined();
    expect(GLYPHS[","]).toBeDefined();
    expect(GLYPHS["."]).toBeDefined();
    expect(GLYPHS["-"]).toBeDefined();
    expect(GLYPHS["→"]).toBeDefined();
    expect(SUPPORTED_CHARS.length).toBeGreaterThanOrEqual(41);
  });
});

describe("font-bitmap — getGlyph", () => {
  test("returns the same glyph for upper and lower case", () => {
    expect(getGlyph("a")).toBe(getGlyph("A"));
    expect(getGlyph("z")).toBe(getGlyph("Z"));
  });

  test("returns undefined for unknown characters", () => {
    expect(getGlyph("@")).toBeUndefined();
    expect(getGlyph("!")).toBeUndefined();
    expect(getGlyph("?")).toBeUndefined();
  });
});

describe("font-bitmap — isPixelOn bounds", () => {
  test("'A' top-left corner is off, top-middle is on", () => {
    expect(isPixelOn("A", 0, 0)).toBe(false);
    expect(isPixelOn("A", 1, 0)).toBe(true);
  });

  test("out-of-range coordinates return false", () => {
    expect(isPixelOn("A", -1, 0)).toBe(false);
    expect(isPixelOn("A", 5, 0)).toBe(false);
    expect(isPixelOn("A", 0, -1)).toBe(false);
    expect(isPixelOn("A", 0, 7)).toBe(false);
  });

  test("unknown character returns false everywhere", () => {
    expect(isPixelOn("@", 0, 0)).toBe(false);
    expect(isPixelOn("@", 2, 3)).toBe(false);
  });
});

describe("font-bitmap — countOnPixels", () => {
  test("'SF' on-pixel count matches the encoded font", () => {
    // S in our font: rows ".####" "#...." "#...." ".###." "....#" "....#" "####." → 4+1+1+3+1+1+4 = 15
    // F in our font: rows "#####" "#...." "#...." "####." "#...." "#...." "#...." → 5+1+1+4+1+1+1 = 14
    expect(countOnPixels("S")).toBe(15);
    expect(countOnPixels("F")).toBe(14);
    expect(countOnPixels("SF")).toBe(29);
  });

  test("known glyphs have plausible pixel counts (8 ≤ n ≤ 25 for letters)", () => {
    for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
      const n = countOnPixels(ch);
      expect(n).toBeGreaterThanOrEqual(8);
      expect(n).toBeLessThanOrEqual(25);
    }
  });

  test("space contributes zero on-pixels but still counts as a glyph", () => {
    expect(countOnPixels(" ")).toBe(0);
    expect(countOnPixels("S F")).toBe(15 + 14);
  });

  test("unknown chars contribute zero", () => {
    expect(countOnPixels("S@F")).toBe(15 + 14);
  });
});

describe("font-bitmap — textWidth", () => {
  test("empty string is 0 wide", () => {
    expect(textWidth("")).toBe(0);
  });

  test("single char is 5 cols wide", () => {
    expect(textWidth("A")).toBe(5);
  });

  test("two chars include 1 kern column", () => {
    expect(textWidth("AB")).toBe(5 + 1 + 5);
  });

  test("three chars include two kern columns", () => {
    expect(textWidth("ABC")).toBe(5 + 1 + 5 + 1 + 5);
  });

  test("→ counts as a single grapheme (no surrogate-pair miscounting)", () => {
    expect(textWidth("A→B")).toBe(5 + 1 + 5 + 1 + 5);
  });
});
