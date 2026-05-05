/**
 * heuristics — pure aggregation for the v3 Trending Heuristics module.
 *
 * Groups stories by industry, computes signal counts in the lookback
 * window + the prior window for week-over-week deltas, picks the top
 * story per industry, formats the delta for display.
 *
 * Pure: same input, same output. No I/O, no randomness, no clocks
 * except `now` parameter (caller passes for SSR + test reproducibility).
 *
 * Per feed.md §7f Module E: 6 cards EXACT at every viewport. If the
 * filtered story pool covers fewer than 6 industries, the renderer pads
 * with placeholder "0 — quiet" cards — that padding belongs in the
 * component, not here. This module returns the actual computed list and
 * the caller decides how to fill remaining slots.
 */

import type { AnyStory, Industry } from "@/lib/types/story";

export interface IndustryHeuristic {
  industry: Industry;
  /** Display label, e.g. "AI" / "Fintech". */
  industryLabel: string;
  /** Signal count in the current lookback window. */
  signalCount: number;
  /** Signal count in the prior window of equal length. */
  prevSignalCount: number;
  /**
   * Week-over-week delta as a fraction. -1.0 .. +Inf.
   *   -0.50 → "↓ 50%"
   *   +0.20 → "↑ 20%"
   *    0.0  → "—"
   * If prevSignalCount is 0 and current > 0, returns Infinity (formatted
   * as "↑ —" by the display helper, since percent change from zero is
   * undefined as a percentage).
   */
  weekDelta: number;
  /** The top story for this industry by recency. Null if none. */
  topStory: { id: string; oneLine: string } | null;
}

const INDUSTRY_LABELS: Record<Industry, string> = {
  ai: "AI",
  fintech: "Fintech",
  climate: "Climate",
  biotech: "Biotech",
  defense: "Defense",
  consumer: "Consumer",
  b2b: "B2B",
  devtools: "Devtools",
  space: "Space",
  creator: "Creator",
  commerce: "Commerce",
  "india-shipping": "India",
};

const ALL_INDUSTRIES: Industry[] = Object.keys(INDUSTRY_LABELS) as Industry[];

export interface HeuristicsOptions {
  /** Lookback window in hours. Defaults to 168 (7 days). */
  lookbackHours?: number;
  /**
   * Limit on the returned list. Defaults to 6 (the v3 spec target). The
   * caller may set this higher to pre-compute all 12 industries and then
   * slice client-side for filter highlights.
   */
  limit?: number;
}

/**
 * Group stories by industry, returning entries sorted by signalCount
 * descending. Empty industries excluded — the v3 component pads to 6
 * with placeholder cards rather than receiving zero-count entries here.
 */
export function computeHeuristics(
  stories: readonly AnyStory[],
  now: Date = new Date(),
  options: HeuristicsOptions = {},
): IndustryHeuristic[] {
  const lookbackHours = options.lookbackHours ?? 168;
  const limit = options.limit ?? 6;
  const cutoffNow = now.getTime() - lookbackHours * 3_600_000;
  const cutoffPrev = now.getTime() - 2 * lookbackHours * 3_600_000;

  // Bucket stories into current vs prior window per industry
  const buckets = new Map<
    Industry,
    { current: AnyStory[]; prior: AnyStory[] }
  >();
  for (const s of stories) {
    const t = Date.parse(s.createdAt);
    if (!Number.isFinite(t)) continue;
    if (t < cutoffPrev) continue; // older than 2× lookback — irrelevant
    let b = buckets.get(s.industry);
    if (!b) {
      b = { current: [], prior: [] };
      buckets.set(s.industry, b);
    }
    if (t >= cutoffNow) b.current.push(s);
    else b.prior.push(s);
  }

  const entries: IndustryHeuristic[] = [];
  for (const [industry, b] of buckets) {
    if (b.current.length === 0) continue; // no current-window signals
    const top = pickTopStory(b.current);
    entries.push({
      industry,
      industryLabel: INDUSTRY_LABELS[industry],
      signalCount: b.current.length,
      prevSignalCount: b.prior.length,
      weekDelta: computeWeekDelta(b.current.length, b.prior.length),
      topStory: top
        ? { id: top.id, oneLine: oneLineFor(top) }
        : null,
    });
  }

  entries.sort((a, b) => {
    if (b.signalCount !== a.signalCount) return b.signalCount - a.signalCount;
    // Tie: most-recent top story wins
    const aT = a.topStory ? Date.parse(a.topStory.id) : 0;
    const bT = b.topStory ? Date.parse(b.topStory.id) : 0;
    if (bT !== aT) return bT - aT;
    return a.industryLabel.localeCompare(b.industryLabel);
  });

  return entries.slice(0, limit);
}

/**
 * Most-recent story by createdAt. If a tie at the millisecond, the
 * earliest in the input array wins (stable sort behavior).
 */
export function pickTopStory(stories: readonly AnyStory[]): AnyStory | null {
  if (stories.length === 0) return null;
  let best = stories[0]!;
  let bestT = Date.parse(best.createdAt);
  for (let i = 1; i < stories.length; i++) {
    const s = stories[i]!;
    const t = Date.parse(s.createdAt);
    if (Number.isFinite(t) && t > bestT) {
      best = s;
      bestT = t;
    }
  }
  return best;
}

/**
 * Compute the week-over-week delta as a fraction.
 *   prev=10, curr=12 → +0.20
 *   prev=10, curr=8  → -0.20
 *   prev=0,  curr=5  → +Infinity (undefined-as-percentage; renderer
 *                                 shows "↑ —" or "+5 from 0")
 *   prev=0,  curr=0  → 0
 */
export function computeWeekDelta(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : Infinity;
  return (curr - prev) / prev;
}

/**
 * Format a week delta for display. Returns the symbol + label combo —
 * e.g. { arrow: "up", label: "+22%" } — letting the renderer pick
 * its own icon component.
 */
export function formatDelta(delta: number): {
  arrow: "up" | "down" | "flat";
  label: string;
} {
  if (!Number.isFinite(delta)) return { arrow: "up", label: "↑ —" };
  if (delta === 0) return { arrow: "flat", label: "—" };
  const pct = Math.round(Math.abs(delta) * 100);
  if (delta > 0) return { arrow: "up", label: `+${pct}%` };
  return { arrow: "down", label: `-${pct}%` };
}

/** Pad a heuristics list out to the target count with placeholder rows. */
export function padHeuristicsToCount(
  entries: readonly IndustryHeuristic[],
  count: number,
): IndustryHeuristic[] {
  if (entries.length >= count) return entries.slice(0, count);
  const present = new Set(entries.map((e) => e.industry));
  const missing = ALL_INDUSTRIES.filter((i) => !present.has(i)).slice(
    0,
    count - entries.length,
  );
  return [
    ...entries,
    ...missing.map<IndustryHeuristic>((industry) => ({
      industry,
      industryLabel: INDUSTRY_LABELS[industry],
      signalCount: 0,
      prevSignalCount: 0,
      weekDelta: 0,
      topStory: null,
    })),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function oneLineFor(story: AnyStory): string {
  // Prefer the first microBullet if present (terse, editorial), else the
  // title. Truncated to 80 chars at the renderer.
  const b = story.microBullets[0];
  if (b && b.length > 0) return b;
  return story.title;
}

export const __heuristicsTesting = {
  INDUSTRY_LABELS,
  ALL_INDUSTRIES,
};
