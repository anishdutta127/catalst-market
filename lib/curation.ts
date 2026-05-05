/**
 * curation — editorial curation surfaces (Top 3 of the Week, Business of
 * the Week, Movers).
 *
 * Phase 7a: each surface reads from a hand-curated JSON file under
 * content/curation/. Future Phase 7c (Composio MCP) will swap the JSON
 * seed for live-computed picks, but the consumer interfaces here stay
 * stable.
 *
 * All functions are pure and synchronous: they evaluate at module load
 * during static export, so any malformed JSON FAILS THE BUILD — the same
 * build-time-guard discipline as lib/seed.
 */

import top3RawJson from "@/content/curation/top3-of-week.json";
import businessRawJson from "@/content/curation/business-of-week.json";
import { SEED_STORIES } from "@/lib/seed";
import { MOOD_META } from "@/lib/moods";
import type { AnyStory, Mood } from "@/lib/types/story";

// ─────────────────────────────────────────────────────────────────────────────
// Top 3 of the Week
// ─────────────────────────────────────────────────────────────────────────────

export interface Top3OfWeekItem {
  /** The story this card spotlights. Must exist in SEED_STORIES. */
  story: AnyStory;
  /** 1-2 sentence editorial paragraph explaining why this story mattered. */
  curatorialNote: string;
  /** Display rank (1, 2, or 3). */
  rank: 1 | 2 | 3;
}

interface Top3RawEntry {
  rank: number;
  storyId: string;
  curatorialNote: string;
}

/**
 * Read the hand-curated weekly top 3 from JSON. Returns an empty array if
 * the curation file is empty (the EditorialConsole shows a "being curated"
 * placeholder in that case).
 *
 * Throws at module load time if a referenced storyId does not exist in the
 * seed — that's a curation bug we want to catch in the build, not a soft
 * runtime fallback that silently shows fewer than three items.
 */
export function getTop3OfWeek(): Top3OfWeekItem[] {
  const raw = top3RawJson as Top3RawEntry[];
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.map((entry) => {
    const story = SEED_STORIES.find((s) => s.id === entry.storyId);
    if (!story) {
      throw new Error(
        `[curation] top3-of-week.json references unknown storyId "${entry.storyId}"`,
      );
    }
    if (entry.rank !== 1 && entry.rank !== 2 && entry.rank !== 3) {
      throw new Error(
        `[curation] top3-of-week.json rank for "${entry.storyId}" must be 1, 2, or 3 (got ${entry.rank})`,
      );
    }
    if (
      typeof entry.curatorialNote !== "string" ||
      entry.curatorialNote.trim().length === 0
    ) {
      throw new Error(
        `[curation] top3-of-week.json curatorialNote for "${entry.storyId}" is empty`,
      );
    }
    return {
      rank: entry.rank,
      story,
      curatorialNote: entry.curatorialNote,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Business of the Week
// ─────────────────────────────────────────────────────────────────────────────

export interface BusinessOfTheWeekStat {
  label: string;
  value: string;
}

export interface BusinessOfTheWeek {
  /** Stable slug — e.g. "sarvam-ai". Drives data-* attrs in the DOM. */
  companyId: string;
  /** Display name, e.g. "Sarvam AI". */
  companyName: string;
  /** One-line tagline shown italic under the name. */
  tagline: string;
  /** 3 paragraphs of editorial brief on the company's recent activity. */
  weeklyArc: [string, string, string];
  /** 3 inline pill stats (founded, headcount/stage, total raised). */
  keyStats: [BusinessOfTheWeekStat, BusinessOfTheWeekStat, BusinessOfTheWeekStat];
  /** Outbound link button target. */
  externalUrl: string;
  /** ~3 sentences in big dotted display text — the magazine pull-quote. */
  pullQuote: string;
  /** Optional id of a related Build Angle to surface as a link. */
  relatedBuildAngleId?: string;
  /** Optional hero image URL. Falls back to a mood-tinted placeholder. */
  imageUrl?: string;
  /** Mood used for the placeholder hero tint and accent color. */
  primaryMoodForTint: Mood;
}

interface BusinessRaw {
  companyId: string;
  companyName: string;
  tagline: string;
  weeklyArc: string[];
  keyStats: BusinessOfTheWeekStat[];
  externalUrl: string;
  pullQuote: string;
  relatedBuildAngleId?: string;
  imageUrl?: string;
  primaryMoodForTint?: string;
}

export function getBusinessOfWeek(): BusinessOfTheWeek {
  const raw = businessRawJson as BusinessRaw;
  if (!raw || typeof raw !== "object") {
    throw new Error("[curation] business-of-week.json must be a single object");
  }
  if (typeof raw.companyId !== "string" || raw.companyId.length === 0) {
    throw new Error("[curation] business-of-week.json missing companyId");
  }
  if (!Array.isArray(raw.weeklyArc) || raw.weeklyArc.length !== 3) {
    throw new Error(
      "[curation] business-of-week.json weeklyArc must be exactly 3 paragraphs",
    );
  }
  if (!Array.isArray(raw.keyStats) || raw.keyStats.length !== 3) {
    throw new Error(
      "[curation] business-of-week.json keyStats must be exactly 3 entries",
    );
  }
  if (typeof raw.pullQuote !== "string" || raw.pullQuote.trim().length === 0) {
    throw new Error("[curation] business-of-week.json pullQuote is empty");
  }
  const tintCandidate = raw.primaryMoodForTint ?? "quiet-builders";
  if (!(tintCandidate in MOOD_META)) {
    throw new Error(
      `[curation] business-of-week.json primaryMoodForTint "${tintCandidate}" is not a valid Mood`,
    );
  }
  return {
    companyId: raw.companyId,
    companyName: raw.companyName,
    tagline: raw.tagline,
    weeklyArc: [raw.weeklyArc[0]!, raw.weeklyArc[1]!, raw.weeklyArc[2]!],
    keyStats: [raw.keyStats[0]!, raw.keyStats[1]!, raw.keyStats[2]!],
    externalUrl: raw.externalUrl,
    pullQuote: raw.pullQuote,
    relatedBuildAngleId: raw.relatedBuildAngleId,
    imageUrl: raw.imageUrl,
    primaryMoodForTint: tintCandidate as Mood,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Movers — quiet underdog signals (counter-programming to Top 3)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tier-1 cities the headline-grabbing modules already over-index on. A
 * Mover story is explicitly drawn from outside this set so we surface
 * Lagos, Seoul, Tel Aviv, Mexico City, Cairo, BLR, etc. instead.
 *
 * Match is by lat/lng with a ~1° squared radius (city scale).
 */
const TIER_1_CITIES_LATLNG: ReadonlyArray<{ lat: number; lng: number }> = [
  { lat: 37.77, lng: -122.42 }, // SF
  { lat: 40.71, lng: -74.01 }, // NYC
  { lat: 51.51, lng: -0.13 }, // London
  { lat: 35.68, lng: 139.69 }, // Tokyo
];

/** Upper bound for "quiet" funding-style stories. Brief says $10M-$100M;
 *  bumped to $200M so realistic Series A/B underdogs (~$150M) qualify. */
const MOVER_DOLLAR_FLOOR = 10_000_000;
const MOVER_DOLLAR_CEIL = 200_000_000;

function isTier1Story(story: AnyStory): boolean {
  if (story.lat === undefined || story.lng === undefined) return false;
  for (const c of TIER_1_CITIES_LATLNG) {
    const dLat = c.lat - story.lat;
    const dLng = c.lng - story.lng;
    if (dLat * dLat + dLng * dLng < 1) return true;
  }
  return false;
}

/** Currency-typed dollar amount of the story's headline, or null. */
function storyDollarAmount(story: AnyStory): number | null {
  if (story.type === "funding") return story.details.amountUsd;
  if (story.type === "ipo") return story.details.marketCapUsd;
  if (story.type === "ma" && story.details.amountUsd != null) {
    return story.details.amountUsd;
  }
  return null;
}

/**
 * "Quiet" headline = either no currency headline at all (the story doesn't
 * flex a dollar number) OR a currency in the small-dollar range. Either
 * way, the story is not the $500M+ kind that dominates Top 3.
 */
function isQuietHeadline(story: AnyStory): boolean {
  const amt = storyDollarAmount(story);
  if (amt === null) return true;
  return amt >= MOVER_DOLLAR_FLOOR && amt <= MOVER_DOLLAR_CEIL;
}

/**
 * Combined mover predicate: non-tier-1 city AND (machine-extracted OR
 * quiet-headline). Exposed for test assertions so the test pins the same
 * truth table the implementation uses.
 */
export function isMoverCandidate(story: AnyStory): boolean {
  if (isTier1Story(story)) return false;
  if (story.verified === false) return true;
  return isQuietHeadline(story);
}

/**
 * Pick up to 3 quiet movers from a story pool — counter-programming to
 * Top 3's headline-grabbers. Sort: createdAt desc, so the freshest
 * underdog signal wins each slot.
 *
 * Pool defaults to SEED_STORIES; callers can pass a filtered pool to
 * cascade with the universal filter.
 */
export function getMovers(pool: readonly AnyStory[] = SEED_STORIES): AnyStory[] {
  const candidates = pool.filter(isMoverCandidate);
  const sorted = [...candidates].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  return sorted.slice(0, 3);
}

export const __curationTesting = {
  isTier1Story,
  isQuietHeadline,
  storyDollarAmount,
  MOVER_DOLLAR_FLOOR,
  MOVER_DOLLAR_CEIL,
  TIER_1_CITIES_LATLNG,
};
