/**
 * heat-headline — derives "today's narrative" from a Story[] for the
 * GlobeHero composition.
 *
 * Pure function. Same input, same output. No I/O. No randomness — date-hash
 * driven copy variation so the headline shifts day to day but is stable
 * across reloads on the same day.
 *
 * Pipeline:
 *   1. Filter to last `lookbackHours` (default 168 = 7 days)
 *   2. Match each story's lat/lng to the nearest city in CITIES (50km window)
 *   3. Bucket stories by city, score by signal count + mood weight
 *   4. Pick top 3-5 cities → globe stops, top 1 → headline
 *   5. Generate headline + subline + route line from the buckets
 *
 * Quiet state: when total matched stories < 3 globally, isQuiet=true and the
 * copy switches to a peaceful "world is quiet" framing. The globe still
 * renders (parent uses static variant) but the urgency drops.
 *
 * Stories with no lat/lng — or lat/lng that doesn't match any city in CITIES
 * within tolerance — are EXCLUDED from heat compute and a dev-only console
 * warning fires. Never silently dropped.
 */

import { CITIES } from "@/components/brand/world-data";
import type { GlobeStop } from "@/components/brand/Globe";
import { nearestCity } from "./seed-validate";
import type { AnyStory, Mood } from "./types/story";

export interface HeatComputation {
  /** Top-line headline copy. */
  headline: string;
  /** Bottom route line — IATA codes joined by " → " (3 cities). */
  routeLine: string;
  /** Stops to feed Globe (3-5 cities, ranked by signal count). */
  stops: GlobeStop[];
  /** Optional second-line context — type breakdown for the hot city. */
  subline?: string;
  /** True when total matched stories in lookback < 3. Triggers quiet copy. */
  isQuiet: boolean;
}

/** Per-mood urgency weight for tiebreaking equally-counted city buckets. */
const MOOD_WEIGHT: Record<Mood, number> = {
  "blowing-up": 1.5,
  "overnight-rockets": 1.4,
  "underdog-wins": 1.2,
  "india-shipping": 1.2,
  "founders-like-me": 1.1,
  "big-money-moves": 1.1,
  "copy-able-ideas": 1.0,
  "bootstrapped-millions": 1.0,
  "quiet-builders": 0.9,
};

/** Headline templates — rotated by date hash so daily variation isn't random. */
const HEADLINE_TEMPLATES: ReadonlyArray<(city: string, n: number, hours: number) => string> = [
  (city, n) => `Today: ${city} is hot — ${n} ${pluralize(n, "signal")}`,
  (city, n, hours) => `${n} ${pluralize(n, "signal")} out of ${city} in the last ${hours}h`,
  (city, n) => `Action's in ${city}: ${n} ${pluralize(n, "story", "stories")} worth a look`,
];

const QUIET_HEADLINES: readonly string[] = [
  "The world is quiet today — peek at the week's signals",
  "Slow news day. Here's what mattered this week",
  "Calm hour. The week's biggest signals are still worth a look",
];

export interface ComputeHeatOptions {
  /** Lookback window in hours. Defaults to 168 (7 days). */
  lookbackHours?: number;
  /** Quiet threshold — when matched count < this, switch to quiet copy. */
  quietThreshold?: number;
  /** Minimum stops to surface in the globe. Pads from week-history if needed. */
  minStops?: number;
  /** Maximum stops to surface. */
  maxStops?: number;
  /** Coordinate-to-city match radius. Defaults to 50km. */
  cityMatchKm?: number;
  /** Override the warn function (tests inject a no-op). */
  onUnmatched?: (story: AnyStory) => void;
}

interface CityBucket {
  citySlug: string;
  cityName: string;
  cityLabelShort: string;
  stories: AnyStory[];
  score: number;
  latestAt: number;
}

export function computeHeat(
  stories: AnyStory[],
  now: Date = new Date(),
  options: ComputeHeatOptions = {},
): HeatComputation {
  const lookbackHours = options.lookbackHours ?? 168;
  const quietThreshold = options.quietThreshold ?? 3;
  const minStops = options.minStops ?? 3;
  const maxStops = options.maxStops ?? 5;
  const cityMatchKm = options.cityMatchKm ?? 50;
  const onUnmatched = options.onUnmatched ?? defaultUnmatchedWarn;

  const cutoff = now.getTime() - lookbackHours * 3_600_000;

  // 1) Lookback window filter
  const recent = stories.filter((s) => {
    const t = Date.parse(s.createdAt);
    return Number.isFinite(t) && t >= cutoff;
  });

  // 2) Match each story to a city. Drop unmatched (with dev warning).
  const buckets = new Map<string, CityBucket>();
  for (const s of recent) {
    if (s.lat === undefined || s.lng === undefined) {
      onUnmatched(s);
      continue;
    }
    const match = nearestCity(s.lat, s.lng, cityMatchKm);
    if (!match) {
      onUnmatched(s);
      continue;
    }
    const city = CITIES[match.slug]!;
    let bucket = buckets.get(match.slug);
    if (!bucket) {
      bucket = {
        citySlug: match.slug,
        cityName: city.name,
        cityLabelShort: city.labelShort,
        stories: [],
        score: 0,
        latestAt: 0,
      };
      buckets.set(match.slug, bucket);
    }
    bucket.stories.push(s);
    bucket.score += MOOD_WEIGHT[s.primaryMood];
    bucket.latestAt = Math.max(bucket.latestAt, Date.parse(s.createdAt));
  }

  const allBuckets = Array.from(buckets.values());
  // 3) Rank: count desc → score desc → recency desc
  allBuckets.sort((a, b) => {
    if (b.stories.length !== a.stories.length) return b.stories.length - a.stories.length;
    if (b.score !== a.score) return b.score - a.score;
    return b.latestAt - a.latestAt;
  });

  // Quiet state
  const isQuiet = recent.length < quietThreshold || allBuckets.length === 0;

  if (isQuiet) {
    const quietHeadline = pickByDateHash(QUIET_HEADLINES, now);
    // For quiet copy, route line is the top-3 of-the-week regardless of count
    const quietBuckets = bucketsAcrossLookback(stories, now, options);
    const quietStops = quietBuckets
      .slice(0, Math.max(minStops, 3))
      .map(bucketToStop);
    const padded = padToMinStops(quietStops, minStops, stories);
    return {
      headline: quietHeadline,
      routeLine: padded.slice(0, 3).map((s) => labelShortFor(s)).join(" → "),
      stops: padded,
      isQuiet: true,
    };
  }

  // 4) Top stops
  const stops = allBuckets
    .slice(0, maxStops)
    .map(bucketToStop);
  const paddedStops = padToMinStops(stops, minStops, stories);

  // 5) Headline + subline
  const top = allBuckets[0]!;
  const template = pickByDateHash(HEADLINE_TEMPLATES, now);
  const headline = template(top.cityName, top.stories.length, lookbackHours);
  const subline = subLineForBucket(top);

  const routeLine = paddedStops
    .slice(0, 3)
    .map((s) => labelShortFor(s))
    .join(" → ");

  return {
    headline,
    routeLine,
    stops: paddedStops,
    subline,
    isQuiet: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function defaultUnmatchedWarn(story: AnyStory): void {
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.warn(
      `[heat-headline] story "${story.id}" excluded — lat/lng (${story.lat}, ${story.lng}) doesn't match any city within tolerance.`,
    );
  }
}

function bucketToStop(b: CityBucket): GlobeStop {
  const mostRecent = b.stories.reduce((acc, s) =>
    Date.parse(s.createdAt) > Date.parse(acc.createdAt) ? s : acc,
  );
  return {
    id: `heat-${b.citySlug}`,
    citySlug: b.citySlug,
    date: formatHeatDate(mostRecent.createdAt),
    storyCount: b.stories.length,
  };
}

function labelShortFor(stop: GlobeStop): string {
  return CITIES[stop.citySlug]?.labelShort ?? stop.citySlug.slice(0, 3).toUpperCase();
}

function subLineForBucket(b: CityBucket): string | undefined {
  if (b.stories.length === 0) return undefined;
  const counts = new Map<string, number>();
  for (const s of b.stories) {
    counts.set(s.type, (counts.get(s.type) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
  if (sorted.length === 0) return undefined;
  return sorted.map(([type, n]) => `${n} ${typeLabel(type, n)}`).join(", ");
}

const TYPE_LABELS_SINGULAR: Record<string, string> = {
  funding: "funding round",
  launch: "launch",
  ai: "AI release",
  ma: "M&A deal",
  ipo: "IPO",
  milestone: "milestone",
  founder: "founder story",
  os: "open-source release",
  layoff: "layoff",
  shutdown: "shutdown",
  regulatory: "regulatory move",
};

const TYPE_LABELS_PLURAL: Record<string, string> = {
  funding: "funding rounds",
  launch: "launches",
  ai: "AI releases",
  ma: "M&A deals",
  ipo: "IPOs",
  milestone: "milestones",
  founder: "founder stories",
  os: "open-source releases",
  layoff: "layoffs",
  shutdown: "shutdowns",
  regulatory: "regulatory moves",
};

function typeLabel(type: string, n: number): string {
  if (n === 1) return TYPE_LABELS_SINGULAR[type] ?? type;
  return TYPE_LABELS_PLURAL[type] ?? type + "s";
}

function pluralize(n: number, sing: string, plur?: string): string {
  if (n === 1) return sing;
  return plur ?? sing + "s";
}

function formatHeatDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()} ${d.getUTCFullYear()}`;
}

/** Picks an item from `arr` deterministically based on the day-of-year of `now`. */
function pickByDateHash<T>(arr: readonly T[], now: Date): T {
  if (arr.length === 0) throw new Error("pickByDateHash: empty array");
  const dayOfYear =
    Math.floor((now.getTime() - new Date(now.getUTCFullYear(), 0, 0).getTime()) / 86_400_000);
  return arr[dayOfYear % arr.length]!;
}

/** Builds buckets across the full lookback window (used by quiet path). */
function bucketsAcrossLookback(
  stories: AnyStory[],
  now: Date,
  options: ComputeHeatOptions,
): CityBucket[] {
  const lookbackHours = options.lookbackHours ?? 168;
  const cityMatchKm = options.cityMatchKm ?? 50;
  const cutoff = now.getTime() - lookbackHours * 3_600_000;
  const buckets = new Map<string, CityBucket>();
  for (const s of stories) {
    const t = Date.parse(s.createdAt);
    if (!Number.isFinite(t) || t < cutoff) continue;
    if (s.lat === undefined || s.lng === undefined) continue;
    const match = nearestCity(s.lat, s.lng, cityMatchKm);
    if (!match) continue;
    const city = CITIES[match.slug]!;
    let b = buckets.get(match.slug);
    if (!b) {
      b = {
        citySlug: match.slug,
        cityName: city.name,
        cityLabelShort: city.labelShort,
        stories: [],
        score: 0,
        latestAt: 0,
      };
      buckets.set(match.slug, b);
    }
    b.stories.push(s);
    b.score += MOOD_WEIGHT[s.primaryMood];
    b.latestAt = Math.max(b.latestAt, t);
  }
  return Array.from(buckets.values()).sort(
    (a, b) => b.latestAt - a.latestAt || b.stories.length - a.stories.length,
  );
}

/** Pads `stops` up to `min` entries by pulling additional cities from
 *  the next-most-recent stories globally (regardless of recency window). */
function padToMinStops(
  stops: GlobeStop[],
  min: number,
  allStories: AnyStory[],
): GlobeStop[] {
  if (stops.length >= min) return stops;
  const have = new Set(stops.map((s) => s.citySlug));
  const candidates: GlobeStop[] = [];
  const sorted = [...allStories].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  for (const s of sorted) {
    if (s.lat === undefined || s.lng === undefined) continue;
    const m = nearestCity(s.lat, s.lng);
    if (!m || have.has(m.slug)) continue;
    have.add(m.slug);
    candidates.push({
      id: `heat-pad-${m.slug}`,
      citySlug: m.slug,
      date: formatHeatDate(s.createdAt),
      storyCount: 1,
    });
  }
  return [...stops, ...candidates].slice(0, min);
}
