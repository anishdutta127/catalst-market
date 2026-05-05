/**
 * 5×7 bitmap font for the Code w/ Claude dotted typography.
 *
 * Hand-encoded — NO web font, NO mask, NO npm bitmap library. Every dot
 * in the composition (city names, dates, route line, character, cassette
 * borders) comes from the same dot-matrix grid. The point of doing this
 * by hand is that the typography reads as part of the dotted world, not
 * as antialiased text laid on top of it.
 *
 * Style reference: classic Atari / early-Apple-II uppercase — solid,
 * slightly squarish, readable at the 18–48 px sizes the composition uses.
 *
 * Glyphs are 5 wide × 7 tall. Encoded as 7 strings of 5 chars; '#' = on,
 * '.' = off. Compiled to a flat boolean[35] at module load (row-major:
 * pixel(x, y) = GLYPHS[char][y*5 + x]).
 *
 * Kerning: 1 column of space between glyphs, so "AB" is 11 columns wide.
 *
 * Glyph set (41 total): A-Z, 0-9, space, comma, period, hyphen, → arrow.
 */

export const GLYPH_WIDTH = 5;
export const GLYPH_HEIGHT = 7;
export const GLYPH_KERN = 1;

const RAW: Readonly<Record<string, readonly string[]>> = {
  // ── Uppercase A–Z ───────────────────────────────────────────────────────
  A: [
    ".###.",
    "#...#",
    "#...#",
    "#####",
    "#...#",
    "#...#",
    "#...#",
  ],
  B: [
    "####.",
    "#...#",
    "#...#",
    "####.",
    "#...#",
    "#...#",
    "####.",
  ],
  C: [
    ".####",
    "#....",
    "#....",
    "#....",
    "#....",
    "#....",
    ".####",
  ],
  D: [
    "####.",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    "####.",
  ],
  E: [
    "#####",
    "#....",
    "#....",
    "####.",
    "#....",
    "#....",
    "#####",
  ],
  F: [
    "#####",
    "#....",
    "#....",
    "####.",
    "#....",
    "#....",
    "#....",
  ],
  G: [
    ".####",
    "#....",
    "#....",
    "#..##",
    "#...#",
    "#...#",
    ".####",
  ],
  H: [
    "#...#",
    "#...#",
    "#...#",
    "#####",
    "#...#",
    "#...#",
    "#...#",
  ],
  I: [
    "#####",
    "..#..",
    "..#..",
    "..#..",
    "..#..",
    "..#..",
    "#####",
  ],
  J: [
    "#####",
    "....#",
    "....#",
    "....#",
    "....#",
    "#...#",
    ".###.",
  ],
  K: [
    "#...#",
    "#..#.",
    "#.#..",
    "##...",
    "#.#..",
    "#..#.",
    "#...#",
  ],
  L: [
    "#....",
    "#....",
    "#....",
    "#....",
    "#....",
    "#....",
    "#####",
  ],
  M: [
    "#...#",
    "##.##",
    "#.#.#",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
  ],
  N: [
    "#...#",
    "##..#",
    "#.#.#",
    "#..##",
    "#...#",
    "#...#",
    "#...#",
  ],
  O: [
    ".###.",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    ".###.",
  ],
  P: [
    "####.",
    "#...#",
    "#...#",
    "####.",
    "#....",
    "#....",
    "#....",
  ],
  Q: [
    ".###.",
    "#...#",
    "#...#",
    "#...#",
    "#.#.#",
    "#..#.",
    ".##.#",
  ],
  R: [
    "####.",
    "#...#",
    "#...#",
    "####.",
    "#.#..",
    "#..#.",
    "#...#",
  ],
  S: [
    ".####",
    "#....",
    "#....",
    ".###.",
    "....#",
    "....#",
    "####.",
  ],
  T: [
    "#####",
    "..#..",
    "..#..",
    "..#..",
    "..#..",
    "..#..",
    "..#..",
  ],
  U: [
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    ".###.",
  ],
  V: [
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    ".#.#.",
    ".#.#.",
    "..#..",
  ],
  W: [
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    "#.#.#",
    "##.##",
    "#...#",
  ],
  X: [
    "#...#",
    "#...#",
    ".#.#.",
    "..#..",
    ".#.#.",
    "#...#",
    "#...#",
  ],
  Y: [
    "#...#",
    "#...#",
    ".#.#.",
    "..#..",
    "..#..",
    "..#..",
    "..#..",
  ],
  Z: [
    "#####",
    "....#",
    "...#.",
    "..#..",
    ".#...",
    "#....",
    "#####",
  ],

  // ── Digits 0–9 ──────────────────────────────────────────────────────────
  "0": [
    ".###.",
    "#...#",
    "#..##",
    "#.#.#",
    "##..#",
    "#...#",
    ".###.",
  ],
  "1": [
    "..#..",
    ".##..",
    "..#..",
    "..#..",
    "..#..",
    "..#..",
    ".###.",
  ],
  "2": [
    ".###.",
    "#...#",
    "....#",
    "..##.",
    ".#...",
    "#....",
    "#####",
  ],
  "3": [
    ".###.",
    "#...#",
    "....#",
    "..##.",
    "....#",
    "#...#",
    ".###.",
  ],
  "4": [
    "...#.",
    "..##.",
    ".#.#.",
    "#..#.",
    "#####",
    "...#.",
    "...#.",
  ],
  "5": [
    "#####",
    "#....",
    "#....",
    "####.",
    "....#",
    "#...#",
    ".###.",
  ],
  "6": [
    ".###.",
    "#....",
    "#....",
    "####.",
    "#...#",
    "#...#",
    ".###.",
  ],
  "7": [
    "#####",
    "....#",
    "...#.",
    "..#..",
    ".#...",
    ".#...",
    ".#...",
  ],
  "8": [
    ".###.",
    "#...#",
    "#...#",
    ".###.",
    "#...#",
    "#...#",
    ".###.",
  ],
  "9": [
    ".###.",
    "#...#",
    "#...#",
    ".####",
    "....#",
    "....#",
    ".###.",
  ],

  // ── Punctuation ─────────────────────────────────────────────────────────
  " ": [
    ".....",
    ".....",
    ".....",
    ".....",
    ".....",
    ".....",
    ".....",
  ],
  ",": [
    ".....",
    ".....",
    ".....",
    ".....",
    "..#..",
    "..#..",
    ".#...",
  ],
  ".": [
    ".....",
    ".....",
    ".....",
    ".....",
    ".....",
    ".....",
    "..#..",
  ],
  "-": [
    ".....",
    ".....",
    ".....",
    "#####",
    ".....",
    ".....",
    ".....",
  ],
  "→": [
    ".....",
    "....#",
    "...##",
    "#####",
    "...##",
    "....#",
    ".....",
  ],
  ":": [
    ".....",
    ".....",
    "..#..",
    ".....",
    "..#..",
    ".....",
    ".....",
  ],
  "+": [
    ".....",
    "..#..",
    "..#..",
    "#####",
    "..#..",
    "..#..",
    ".....",
  ],
  "%": [
    "##..#",
    "##.#.",
    "..#..",
    ".#...",
    "#..##",
    "...##",
    ".....",
  ],
  // Middle dot (·) — used inside compound short labels like "STREAK · 7".
  "·": [
    ".....",
    ".....",
    ".....",
    "..#..",
    ".....",
    ".....",
    ".....",
  ],
  // Star — used in headline number labels (★ = repo stars).
  "★": [
    "..#..",
    "..#..",
    "#####",
    ".###.",
    "#...#",
    "#...#",
    ".....",
  ],
  // Hash — used for rank prefixes (#1, #2, #3).
  "#": [
    ".#.#.",
    ".#.#.",
    "#####",
    ".#.#.",
    "#####",
    ".#.#.",
    ".#.#.",
  ],
  // Up arrow — direction-of-change indicators (TrendingHeuristics deltas).
  "↑": [
    "..#..",
    ".###.",
    "#.#.#",
    "..#..",
    "..#..",
    "..#..",
    "..#..",
  ],
  // Down arrow — pairs with ↑ for delta indicators.
  "↓": [
    "..#..",
    "..#..",
    "..#..",
    "..#..",
    "#.#.#",
    ".###.",
    "..#..",
  ],
  // Apostrophe — used in possessive captions ("TODAY'S BUILD ANGLES").
  "'": [
    "..#..",
    "..#..",
    ".....",
    ".....",
    ".....",
    ".....",
    ".....",
  ],
  // Em dash — used in compound captions ("QUIET MOVERS — STORIES…").
  // Wider stroke than hyphen, vertically centered.
  "—": [
    ".....",
    ".....",
    ".....",
    "#####",
    ".....",
    ".....",
    ".....",
  ],
};

function compile(rows: readonly string[]): readonly boolean[] {
  const out: boolean[] = new Array(GLYPH_WIDTH * GLYPH_HEIGHT);
  for (let y = 0; y < GLYPH_HEIGHT; y++) {
    const row = rows[y]!;
    for (let x = 0; x < GLYPH_WIDTH; x++) {
      out[y * GLYPH_WIDTH + x] = row[x] === "#";
    }
  }
  return Object.freeze(out);
}

/**
 * Compiled glyph table. Lookup is by character; pass uppercase or use
 * `getGlyph()` which uppercases for you. Returns `undefined` for chars
 * outside the supported set so callers can decide to render a blank cell
 * or throw.
 */
export const GLYPHS: Readonly<Record<string, readonly boolean[]>> = Object.freeze(
  Object.fromEntries(Object.entries(RAW).map(([ch, rows]) => [ch, compile(rows)])),
);

/** Returns the compiled glyph for `char`, or `undefined` if not supported. */
export function getGlyph(char: string): readonly boolean[] | undefined {
  return GLYPHS[char.toUpperCase()];
}

/** True if pixel (x, y) of `char` is on. False outside the grid or for unknown chars. */
export function isPixelOn(char: string, x: number, y: number): boolean {
  const g = getGlyph(char);
  if (!g) return false;
  if (x < 0 || x >= GLYPH_WIDTH || y < 0 || y >= GLYPH_HEIGHT) return false;
  return g[y * GLYPH_WIDTH + x] === true;
}

/** Counts the on-pixels in `text`. Kerning columns are always off. */
export function countOnPixels(text: string): number {
  let count = 0;
  for (const ch of text) {
    const g = getGlyph(ch);
    if (g) for (const v of g) if (v) count++;
  }
  return count;
}

/** Total width of `text` in pixel columns (kerning included). 0 for empty. */
export function textWidth(text: string): number {
  if (text.length === 0) return 0;
  // Use Array.from to count code points, not UTF-16 units (handles "→" correctly).
  const len = Array.from(text).length;
  return len * GLYPH_WIDTH + (len - 1) * GLYPH_KERN;
}

/** All supported characters (for tests + alphabet-dump demos). */
export const SUPPORTED_CHARS: readonly string[] = Object.keys(RAW);
