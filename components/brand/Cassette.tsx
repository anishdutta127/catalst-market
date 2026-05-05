/**
 * Cassette — coral-fill rounded rectangle with a DOT-rendered border.
 *
 * The border MUST be discrete dots, not a solid SVG stroke. That's what
 * makes the cassette feel like part of the halftone composition instead
 * of an HTML button overlaid on top of it.
 *
 * Layout:
 *   ┌─────────── totalW ───────────┐
 *   ┌·······························┐  ← top: row of border dots (1 dot tall)
 *   ┌·                             ·┐
 *   ·                               ·  ← left/right: column of border dots
 *   ·    [content area]             ·
 *   ·                               ·
 *   ┌·                             ·┐
 *   └·······························┘  ← bottom: row of border dots
 *
 * The fill <rect> sits inside the border ring with rounded corners. The
 * border dot count is derived from totalW/totalH and dotSize so the dot
 * pitch reads as the same halftone grid as the globe's continent dots.
 *
 * Two presets:
 *   - "pin-label"     — small, on-globe, holds a city slug ("SF", "TYO")
 *   - "date-cassette" — medium, below globe, holds a date ("MAY 6 2026")
 *
 * The component is composition-only: caller passes the inner content
 * (typically a <DottedText>) and an explicit content size, so cassette
 * outer dimensions are deterministic and tests can assert on them.
 */

import type { ReactNode } from "react";

export type CassetteVariant = "pin-label" | "date-cassette";

const VARIANT_DEFAULTS: Record<
  CassetteVariant,
  { dotSize: number; padX: number; padY: number }
> = {
  "pin-label": { dotSize: 2, padX: 4, padY: 3 },
  "date-cassette": { dotSize: 2.5, padX: 6, padY: 4 },
};

export interface CassetteProps {
  /** Width of the inner content area (the children) in SVG units. */
  contentWidth: number;
  /** Height of the inner content area in SVG units. */
  contentHeight: number;
  variant?: CassetteVariant;
  /** Override the variant's default dot size. */
  dotSize?: number;
  /** Override the variant's default padding (X, Y separately). */
  padding?: { x?: number; y?: number };
  /** Cassette interior fill. Defaults to Coral at 90% opacity. */
  fill?: string;
  /** Border dot color. Defaults to ink. */
  borderColor?: string;
  className?: string;
  ariaLabel?: string;
  children?: ReactNode;
}

export function Cassette({
  contentWidth,
  contentHeight,
  variant = "pin-label",
  dotSize,
  padding,
  fill = "var(--color-cta)",
  borderColor = "var(--color-ink)",
  className,
  ariaLabel,
  children,
}: CassetteProps) {
  const defaults = VARIANT_DEFAULTS[variant];
  const dot = dotSize ?? defaults.dotSize;
  const padX = padding?.x ?? defaults.padX;
  const padY = padding?.y ?? defaults.padY;

  // Outer dims = content + padding + 1 dot for top/bottom borders.
  const totalW = contentWidth + padX * 2 + dot * 2;
  const totalH = contentHeight + padY * 2 + dot * 2;

  // How many dots fit along each edge? Use ~2× dot pitch so there's a clear
  // gap between border dots — matches the halftone density of the globe.
  const pitch = dot * 2;
  const dotsAcross = Math.max(2, Math.round(totalW / pitch));
  const dotsDown = Math.max(2, Math.round(totalH / pitch));
  // Step so first dot sits at x=0 and last at x=totalW-dot exactly.
  const stepX = (totalW - dot) / (dotsAcross - 1);
  const stepY = (totalH - dot) / (dotsDown - 1);

  const borderDots: React.ReactNode[] = [];
  for (let i = 0; i < dotsAcross; i++) {
    const x = i * stepX;
    borderDots.push(
      <rect
        key={`top-${i}`}
        data-cassette-border-dot="top"
        x={x}
        y={0}
        width={dot}
        height={dot}
        fill={borderColor}
      />,
    );
    borderDots.push(
      <rect
        key={`bot-${i}`}
        data-cassette-border-dot="bottom"
        x={x}
        y={totalH - dot}
        width={dot}
        height={dot}
        fill={borderColor}
      />,
    );
  }
  // Skip the corner positions (already drawn by top/bottom rows).
  for (let i = 1; i < dotsDown - 1; i++) {
    const y = i * stepY;
    borderDots.push(
      <rect
        key={`left-${i}`}
        data-cassette-border-dot="left"
        x={0}
        y={y}
        width={dot}
        height={dot}
        fill={borderColor}
      />,
    );
    borderDots.push(
      <rect
        key={`right-${i}`}
        data-cassette-border-dot="right"
        x={totalW - dot}
        y={y}
        width={dot}
        height={dot}
        fill={borderColor}
      />,
    );
  }

  return (
    <svg
      data-cassette=""
      data-cassette-variant={variant}
      width={totalW}
      height={totalH}
      viewBox={`0 0 ${totalW} ${totalH}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      style={{ display: "block", overflow: "visible" }}
    >
      <rect
        data-cassette-fill=""
        x={dot}
        y={dot}
        width={totalW - dot * 2}
        height={totalH - dot * 2}
        rx={dot * 1.5}
        ry={dot * 1.5}
        fill={fill}
        fillOpacity={0.9}
      />
      <g data-cassette-border="">{borderDots}</g>
      {children && (
        <g
          data-cassette-content=""
          transform={`translate(${dot + padX}, ${dot + padY})`}
        >
          {children}
        </g>
      )}
    </svg>
  );
}
