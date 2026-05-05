/**
 * live-signals — pure helpers that derive the LiveSignals ticker payload
 * from a Story[]. Sorted by recency, top 10 by default. Same-shape on
 * desktop (sidebar) and mobile (horizontal strip); the component decides
 * the visual presentation.
 *
 * Each item carries the storyId so a tap can resolve back to the source
 * Story in Phase 6d (BuildSheet wiring).
 */

import { CITIES } from "@/components/brand/world-data";
import { formatHeadline } from "@/lib/headline";
import { deriveHeadline } from "@/lib/headline";
import type { AnyStory, StoryType } from "@/lib/types/story";

export interface SignalItem {
  /** Stable id derived from storyId (suitable as React key). */
  id: string;
  /** Story type — drives the [FUND] / [AI] / etc. badge in the v3 row. */
  type: StoryType;
  /** ISO timestamp string from the source story. */
  timestamp: string;
  /** Display "HH:MM" in user's locale. */
  time: string;
  /** Company / subject — the noun the signal is about. */
  company: string;
  /** Compact metric label, e.g. "$500M", "8.4K ★", "+22 pts". */
  metricLabel: string;
  /**
   * True when the metric is "notable" enough to deserve the Coral CTA accent
   * (currency ≥ $100M, OS stars ≥ 5K, layoff ≥ 1K). Used for emphasis only,
   * not data filtering.
   */
  isNotable: boolean;
  /** Source story id — used by the BuildSheet preview wiring (Phase 6d). */
  storyId: string;
  /** IATA-style city short code, or "—" if no geo. */
  cityShort: string;
}

export interface BuildSignalsOptions {
  /** Maximum items to surface. Defaults to 10. */
  limit?: number;
  /** Override the locale used for timestamp formatting. */
  locale?: string;
}

/**
 * Build the SignalItem[] payload from a Story[]. Pure: same input, same
 * output. Sorts by `createdAt` descending, takes the top `limit`, derives
 * a compact metric label from each story's headlineNumber (or a sensible
 * fallback when headlineNumber is null).
 */
export function buildSignalsFromStories(
  stories: AnyStory[],
  options: BuildSignalsOptions = {},
): SignalItem[] {
  const limit = options.limit ?? 10;
  const sorted = [...stories]
    .filter((s) => Number.isFinite(Date.parse(s.createdAt)))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);

  return sorted.map((s) => {
    const headline = s.headlineNumber ?? deriveHeadline(s);
    const metricLabel = headline
      ? formatHeadline(headline)
      : fallbackMetric(s);
    return {
      id: `sig-${s.id}`,
      type: s.type,
      timestamp: s.createdAt,
      time: formatSignalTime(new Date(s.createdAt), options.locale),
      company: companyOf(s),
      metricLabel,
      isNotable: isNotable(s),
      storyId: s.id,
      cityShort: cityShortFor(s),
    };
  });
}

/**
 * Format a Date as "HH:MM" using 24-hour clock (locale-independent for
 * consistency across user time zones — the user wants timestamps that
 * read like a terminal log, not localized "9:42 AM" / "21:42").
 */
export function formatSignalTime(date: Date, _locale?: string): string {
  if (!Number.isFinite(date.getTime())) return "--:--";
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pull the company name out of the story title — first 1-3 tokens before
 * a verb-y separator. Heuristic: split on the first " raises | ships |
 * launches | files | acqui | acquires | crosses | hits | reports | lays |
 * shuts | passes | wins | files | drops". If none match, take first 3 words.
 */
function companyOf(story: AnyStory): string {
  const title = story.title;
  const verbs = [
    /\braises\b/i,
    /\bships\b/i,
    /\blaunches\b/i,
    /\bfiles\b/i,
    /\bacqui-?\s?hires\b/i,
    /\bacquires\b/i,
    /\bcrosses\b/i,
    /\bhits\b/i,
    /\breports\b/i,
    /\blays off\b/i,
    /\bshuts\b/i,
    /\bwins\b/i,
    /\bemerges\b/i,
    /\bspins\b/i,
    /\bpasses\b/i,
    /\breleases\b/i,
  ];
  let cutAt = title.length;
  let matched = false;
  for (const re of verbs) {
    const m = title.match(re);
    if (m && typeof m.index === "number" && m.index < cutAt) {
      cutAt = m.index;
      matched = true;
    }
  }
  if (matched) {
    const head = title.slice(0, cutAt).trim();
    if (head.length > 0) return head;
  }
  // No verb match — fall back to first 3 words so we don't dump the
  // entire title into the ticker line.
  return title.split(/\s+/).slice(0, 3).join(" ");
}

/** Compact metric for a story whose headlineNumber is null. */
function fallbackMetric(story: AnyStory): string {
  switch (story.type) {
    case "founder":
      return "founder move";
    case "launch":
      return "launches";
    case "milestone":
      return "milestone";
    case "regulatory":
      return "ruling";
    default:
      return story.type;
  }
}

/**
 * Notability heuristic for the Coral accent. Currency ≥ $100M is notable;
 * OS ≥ 5K stars is notable; layoff ≥ 1K is notable; everything else is
 * "ambient" and gets the regular --color-ink treatment.
 */
function isNotable(story: AnyStory): boolean {
  switch (story.type) {
    case "funding":
      return story.details.amountUsd >= 100_000_000;
    case "ipo":
      return story.details.marketCapUsd >= 1_000_000_000;
    case "ma":
      return (story.details.amountUsd ?? 0) >= 100_000_000;
    case "os":
      return story.details.stars >= 5000;
    case "layoff":
      return story.details.headcountAffected >= 1000;
    case "ai":
      return (story.details.benchmarkGain ?? 0) >= 10 ||
        (story.details.costRatio ?? 0) >= 5;
    default:
      return false;
  }
}

/** Nearest CITIES match for the story's lat/lng. "—" if no geo. */
function cityShortFor(story: AnyStory): string {
  if (story.lat === undefined || story.lng === undefined) return "—";
  let best: { slug: string; d: number } | null = null;
  for (const [slug, city] of Object.entries(CITIES)) {
    const dLat = city.lat - story.lat;
    const dLng = city.lng - story.lng;
    const d = dLat * dLat + dLng * dLng;
    if (best === null || d < best.d) best = { slug, d };
  }
  return best ? CITIES[best.slug]!.labelShort : "—";
}
