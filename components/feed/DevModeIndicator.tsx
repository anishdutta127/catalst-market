/**
 * DevModeIndicator — bottom-center pill that surfaces the data source
 * (live JSON vs seed fallback) for the home feed.
 *
 * Rendered only when NODE_ENV === 'development'. The check happens at
 * render time inside the component (not at the call site) so the
 * caller can always render <DevModeIndicator …/> without a guard.
 *
 * Visually small + non-intrusive: 10 px dotted text in a thin pill at
 * the bottom of the page. Coral when falling back to seed (the same
 * "this needs attention" hue the rest of the page uses), Verdant when
 * live data is present.
 */

import { DottedText } from "@/components/brand/DottedText";

export type DevModeKind = "live" | "seed-fallback";

export interface DevModeIndicatorProps {
  kind: DevModeKind;
  count: number;
  /** Override for tests — when set, ignores process.env.NODE_ENV. */
  forceVisible?: boolean;
}

export function DevModeIndicator({
  kind,
  count,
  forceVisible,
}: DevModeIndicatorProps) {
  const visible = forceVisible ?? process.env.NODE_ENV === "development";
  if (!visible) return null;

  const text =
    kind === "live"
      ? `LIVE · ${count} STORIES`
      : `SEED FALLBACK · ${count} STORIES`;
  const color =
    kind === "live" ? "var(--color-verdant)" : "var(--color-cta)";

  return (
    <div
      data-dev-indicator=""
      data-dev-indicator-kind={kind}
      data-dev-indicator-count={count}
      className="fixed left-1/2 bottom-2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <div className="inline-flex items-center px-3 py-1 rounded-pill bg-card/80 border border-rule shadow-card backdrop-blur-sm">
        <DottedText
          text={text}
          dotSize={1.0}
          color={color}
          ariaLabel={text}
        />
      </div>
    </div>
  );
}
