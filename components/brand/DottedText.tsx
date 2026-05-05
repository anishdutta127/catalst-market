/**
 * DottedText — renders a string as a 5×7 bitmap-font dot grid in SVG.
 *
 * Each on-pixel becomes one <rect>; off-pixels emit nothing. Three preset
 * sizes anchor the composition: "headline" for big city names, "label"
 * for cassette interiors, "route" for the bottom route line.
 *
 * Output is per-pixel SVG so the type stays in the same dot-matrix world
 * as the globe and character. There is no font-family fallback path —
 * unsupported characters are silently skipped (their column is left blank).
 */

import {
  GLYPH_HEIGHT,
  GLYPH_KERN,
  GLYPH_WIDTH,
  getGlyph,
} from "./font-bitmap";

export type DottedTextSize = "headline" | "label" | "route";

const SIZE_DOT_PX: Record<DottedTextSize, number> = {
  headline: 5, // big — used for city names above the globe at zoom
  label: 2.5, // medium — used inside cassettes
  route: 1.8, // small — used in the bottom route line
};

export interface DottedTextProps {
  text: string;
  size?: DottedTextSize;
  color?: string;
  className?: string;
  /** Promote to role="img" with this label; otherwise rendered aria-hidden. */
  ariaLabel?: string;
  /** Override the per-dot pixel size (in SVG units). Used by Cassette to
      keep cassette border + interior text on a consistent dot grid. */
  dotSize?: number;
}

export function DottedText({
  text,
  size = "label",
  color,
  className,
  ariaLabel,
  dotSize,
}: DottedTextProps) {
  const dot = dotSize ?? SIZE_DOT_PX[size];
  const upper = text.toUpperCase();
  const chars = Array.from(upper);

  const widthPx =
    chars.length === 0
      ? 0
      : chars.length * GLYPH_WIDTH * dot + (chars.length - 1) * GLYPH_KERN * dot;
  const heightPx = GLYPH_HEIGHT * dot;

  const rects: React.ReactNode[] = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    const glyph = getGlyph(ch);
    if (!glyph) continue;
    const charBaseX = i * (GLYPH_WIDTH + GLYPH_KERN) * dot;
    for (let y = 0; y < GLYPH_HEIGHT; y++) {
      for (let x = 0; x < GLYPH_WIDTH; x++) {
        if (!glyph[y * GLYPH_WIDTH + x]) continue;
        rects.push(
          <rect
            key={`${i}-${x}-${y}`}
            data-dotted-pixel=""
            x={charBaseX + x * dot}
            y={y * dot}
            width={dot}
            height={dot}
            fill={color ?? "var(--color-ink)"}
          />,
        );
      }
    }
  }

  return (
    <svg
      data-dotted-text=""
      data-dotted-size={size}
      data-dotted-text-content={upper}
      width={widthPx}
      height={heightPx}
      viewBox={`0 0 ${widthPx} ${heightPx}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      // maxWidth + height:auto lets the SVG scale-to-fit when used as a
      // top-level element in HTML layout (e.g. headline above the globe at
      // a 375px viewport). When nested inside another SVG (e.g. inside a
      // Cassette's <g>), HTML CSS sizing doesn't apply — the SVG renders
      // at its width/height attrs in user-units regardless.
      style={{ display: "block", overflow: "visible", maxWidth: "100%", height: "auto" }}
    >
      {rects}
    </svg>
  );
}
