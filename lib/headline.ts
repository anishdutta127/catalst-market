import type { AnyStory, HeadlineNumber } from "./types/story";

/**
 * Derive the headline number that anchors a Story Card.
 *
 * Per-type rules:
 *
 *   funding    → scaled USD from details.amountUsd, currency format
 *                  $900M → { 900, "M", currency }
 *                  $9.4B → { 9.4, "B", currency }
 *
 *   ma         → details.amountUsd if disclosed, else null
 *
 *   ipo        → scaled USD from details.marketCapUsd, currency format
 *
 *   ai         → details.costRatio takes priority and returns "×" plain;
 *                falls back to details.benchmarkGain returning "pts" plain;
 *                returns null if neither is set (renderer falls back to
 *                founder face at hero size).
 *
 *   os         → { details.stars, "★", plain }
 *
 *   layoff     → { details.headcountAffected, "people", plain }
 *
 *   shutdown   → years-operating-or-zero pattern:
 *                { details.yearsOperating ?? 0, "yrs", plain }
 *
 *   founder    → null (face is the hero)
 *
 *   launch     → null (no numeric anchor in details — a launch story's
 *                hero is the product screenshot)
 *
 *   milestone  → null (current details only carry metric *name*, not value;
 *                enrich TypeDetails.milestone before changing this)
 *
 *   regulatory → null (rulings are typographic, not numeric)
 */
export function deriveHeadline(story: AnyStory): HeadlineNumber | null {
  switch (story.type) {
    case "funding":
      return scaleCurrency(story.details.amountUsd);

    case "ma":
      return story.details.amountUsd != null
        ? scaleCurrency(story.details.amountUsd)
        : null;

    case "ipo":
      return scaleCurrency(story.details.marketCapUsd);

    case "ai":
      if (story.details.costRatio != null) {
        return { value: story.details.costRatio, unit: "×", format: "plain" };
      }
      if (story.details.benchmarkGain != null) {
        return {
          value: story.details.benchmarkGain,
          unit: "pts",
          format: "plain",
        };
      }
      return null;

    case "os":
      return { value: story.details.stars, unit: "★", format: "plain" };

    case "layoff":
      return {
        value: story.details.headcountAffected,
        unit: "people",
        format: "plain",
      };

    case "shutdown":
      return {
        value: story.details.yearsOperating ?? 0,
        unit: "yrs",
        format: "plain",
      };

    case "founder":
    case "launch":
    case "milestone":
    case "regulatory":
      return null;

    default: {
      // Exhaustiveness sentinel: if a 12th StoryType is added and we forget
      // to handle it here, this assignment fails at compile time. Cheaper
      // than a runtime undefined leaking into a Story Card render.
      const _exhaustive: never = story;
      return _exhaustive;
    }
  }
}

/**
 * Scale a USD amount to the largest unit where the value displays ≥ 1.
 * Currency-formatted; used by funding, ma, and ipo paths.
 *
 *   $750         → { 1, "K", currency }     (rounded)
 *   $900,000,000 → { 900, "M", currency }
 *   $9.4B        → { 9.4, "B", currency }   (B/T get one decimal)
 *   $2T          → { 2, "T", currency }
 *
 * Known boundary: amounts in [950_000, 999_999) round to "1000K" instead
 * of escalating to "1M". Real funding data lives well above $1M, so this
 * is acceptable; revisit if we ever surface sub-million stories.
 */
const CURRENCY_TIERS = [
  { divisor: 1e12, unit: "T", decimals: 1 },
  { divisor: 1e9, unit: "B", decimals: 1 },
  { divisor: 1e6, unit: "M", decimals: 0 },
  { divisor: 1e3, unit: "K", decimals: 0 },
] as const;

function scaleCurrency(amountUsd: number): HeadlineNumber {
  for (const { divisor, unit, decimals } of CURRENCY_TIERS) {
    if (amountUsd >= divisor) {
      const factor = 10 ** decimals;
      return {
        value: Math.round((amountUsd / divisor) * factor) / factor,
        unit,
        format: "currency",
      };
    }
  }
  // Below $1K — rare for funding/ma/ipo; emit as K with rounded zero
  // so the renderer still gets a well-formed HeadlineNumber.
  return { value: 0, unit: "K", format: "currency" };
}

/**
 * Format a HeadlineNumber for display on a Story Card.
 *
 *   { 500, "M", currency }      → "$500M"
 *   { 9.4, "B", currency }      → "$9.4B"
 *   { 1500, "people", plain }   → "1.5K people"
 *   { 8400, "★", plain }        → "8.4K ★"
 *   { 22, "pts", plain }        → "+22 pts"
 *   { 9, "yrs", plain }         → "9 yrs"
 *
 * Currency: always prefixed with `$`; `value` already carries the K/M/B/T
 * scaling from `scaleCurrency`.
 *
 * Plain: numbers ≥ 1000 get K-scaling for compactness. The "pts" unit is
 * the one place we prefix `+` because benchmark-improvement is universally
 * read as a delta. Other plain units (★, people, yrs) get no prefix.
 */
export function formatHeadline(n: HeadlineNumber): string {
  if (n.format === "currency") {
    return `$${n.value}${n.unit}`;
  }
  if (n.format === "percent") {
    return `${n.value}%`;
  }
  // Plain
  const v = n.value;
  let scaled: string;
  if (v >= 10000) {
    scaled = `${Math.round(v / 100) / 10}K`;
  } else if (v >= 1000) {
    scaled = `${(v / 1000).toFixed(1)}K`;
  } else {
    scaled = `${v}`;
  }
  if (n.unit === "pts") return `+${scaled} ${n.unit}`;
  return `${scaled} ${n.unit}`;
}
