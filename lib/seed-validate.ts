/**
 * Seed validator — runtime + build-time guard for content/stories.seed.json.
 *
 * Hand-rolled TypeScript schema check. Intentionally no Zod (or other runtime
 * schema lib) — the dependency cost is not worth the size for one validation
 * surface that runs on a hand-curated JSON. If we end up validating multiple
 * runtime payloads (live ingest, API responses) we can swap in Zod cleanly;
 * the public API here (`validateSeed`) stays the same.
 *
 * Throws on any malformed entry. Caller (Next.js build, test suite) propagates
 * the throw so the build fails loudly instead of shipping bad data.
 */

import type {
  AnyStory,
  HeadlineNumber,
  Industry,
  Mood,
  Region,
  Source,
  Stage,
  StoryType,
} from "./types/story";
import { CITIES } from "@/components/brand/world-data";

const VALID_TYPES: ReadonlySet<StoryType> = new Set([
  "funding",
  "launch",
  "ai",
  "ma",
  "ipo",
  "milestone",
  "founder",
  "os",
  "layoff",
  "shutdown",
  "regulatory",
]);

const VALID_MOODS: ReadonlySet<Mood> = new Set([
  "blowing-up",
  "underdog-wins",
  "bootstrapped-millions",
  "overnight-rockets",
  "quiet-builders",
  "copy-able-ideas",
  "founders-like-me",
  "big-money-moves",
  "india-shipping",
]);

const VALID_STAGES: ReadonlySet<Stage> = new Set([
  "empires",
  "builders",
  "bootstrappers",
]);

const VALID_INDUSTRIES: ReadonlySet<Industry> = new Set([
  "ai",
  "fintech",
  "climate",
  "biotech",
  "defense",
  "consumer",
  "b2b",
  "devtools",
  "space",
  "creator",
  "commerce",
  "india-shipping",
]);

const VALID_REGIONS: ReadonlySet<Region> = new Set(["india", "global"]);

const VALID_SOURCES: ReadonlySet<Source> = new Set([
  "hackernews",
  "producthunt",
  "github-trending",
  "crunchbase",
  "layoffsfyi",
  "seed",
]);

const VALID_FORMATS = new Set(["currency", "plain", "percent"]);

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function err(id: string, msg: string): never {
  throw new Error(`[seed-validate] story "${id}": ${msg}`);
}

function checkHeadlineNumber(id: string, h: unknown): asserts h is HeadlineNumber | null {
  if (h === null) return;
  if (!isObject(h)) err(id, "headlineNumber must be null or an object");
  if (typeof h.value !== "number") err(id, "headlineNumber.value must be a number");
  if (typeof h.unit !== "string" || h.unit.length === 0)
    err(id, "headlineNumber.unit must be a non-empty string");
  if (typeof h.format !== "string" || !VALID_FORMATS.has(h.format))
    err(id, `headlineNumber.format must be one of ${[...VALID_FORMATS].join("|")}`);
}

function checkDetails(id: string, type: StoryType, details: unknown): void {
  if (!isObject(details)) err(id, "details must be an object");
  // Light-touch per-type checks — the most load-bearing fields per
  // lib/types/story.ts TypeDetails. Type-specific fields not listed here
  // are passed through as-is.
  switch (type) {
    case "funding":
      if (typeof details.amountUsd !== "number")
        err(id, "details.amountUsd must be a number");
      if (typeof details.round !== "string")
        err(id, "details.round must be a string");
      if (!isStringArray(details.investors))
        err(id, "details.investors must be a string[]");
      break;
    case "launch":
      if (typeof details.productName !== "string")
        err(id, "details.productName must be a string");
      if (typeof details.productUrl !== "string")
        err(id, "details.productUrl must be a string");
      break;
    case "ai":
      // All ai detail fields are optional per the type
      break;
    case "ma":
      if (typeof details.acquirer !== "string") err(id, "details.acquirer must be a string");
      if (typeof details.acquired !== "string") err(id, "details.acquired must be a string");
      if (typeof details.dealType !== "string") err(id, "details.dealType must be a string");
      break;
    case "ipo":
      if (typeof details.ticker !== "string") err(id, "details.ticker must be a string");
      if (typeof details.exchange !== "string") err(id, "details.exchange must be a string");
      if (typeof details.marketCapUsd !== "number")
        err(id, "details.marketCapUsd must be a number");
      break;
    case "milestone":
      if (typeof details.metric !== "string") err(id, "details.metric must be a string");
      break;
    case "founder":
      if (typeof details.founderName !== "string")
        err(id, "details.founderName must be a string");
      break;
    case "os":
      if (typeof details.repoUrl !== "string") err(id, "details.repoUrl must be a string");
      if (typeof details.stars !== "number") err(id, "details.stars must be a number");
      break;
    case "layoff":
      if (typeof details.headcountAffected !== "number")
        err(id, "details.headcountAffected must be a number");
      break;
    case "shutdown":
      // All shutdown detail fields are optional
      break;
    case "regulatory":
      if (typeof details.jurisdiction !== "string")
        err(id, "details.jurisdiction must be a string");
      break;
  }
}

/** Validates a single story object. Throws on any violation. */
export function validateStory(raw: unknown): AnyStory {
  if (!isObject(raw)) throw new Error("[seed-validate] story is not an object");
  const id = typeof raw.id === "string" ? raw.id : "<no-id>";
  if (typeof raw.id !== "string" || raw.id.length === 0) err(id, "id must be a non-empty string");
  if (typeof raw.type !== "string" || !VALID_TYPES.has(raw.type as StoryType))
    err(id, `type must be one of ${[...VALID_TYPES].join("|")}`);
  if (typeof raw.title !== "string" || raw.title.length === 0)
    err(id, "title must be a non-empty string");
  checkHeadlineNumber(id, raw.headlineNumber);
  if (!isStringArray(raw.microBullets)) err(id, "microBullets must be a string[]");
  if (typeof raw.whyNow !== "string") err(id, "whyNow must be a string");
  if (typeof raw.primaryMood !== "string" || !VALID_MOODS.has(raw.primaryMood as Mood))
    err(id, "primaryMood must be a valid Mood");
  if (!Array.isArray(raw.moods) || !raw.moods.every((m) => VALID_MOODS.has(m as Mood)))
    err(id, "moods must be Mood[]");
  if (!(raw.moods as Mood[]).includes(raw.primaryMood as Mood))
    err(id, "moods must include primaryMood");
  if (typeof raw.stage !== "string" || !VALID_STAGES.has(raw.stage as Stage))
    err(id, "stage must be a valid Stage");
  if (typeof raw.industry !== "string" || !VALID_INDUSTRIES.has(raw.industry as Industry))
    err(id, "industry must be a valid Industry");
  if (typeof raw.region !== "string" || !VALID_REGIONS.has(raw.region as Region))
    err(id, "region must be a valid Region");
  if (typeof raw.verified !== "boolean") err(id, "verified must be a boolean");
  if (typeof raw.source !== "string" || !VALID_SOURCES.has(raw.source as Source))
    err(id, "source must be a valid Source");
  if (typeof raw.createdAt !== "string") err(id, "createdAt must be a string");
  if (raw.lat !== undefined && typeof raw.lat !== "number")
    err(id, "lat must be a number when present");
  if (raw.lng !== undefined && typeof raw.lng !== "number")
    err(id, "lng must be a number when present");
  if (raw.featured !== undefined && typeof raw.featured !== "boolean")
    err(id, "featured must be a boolean when present");
  checkDetails(id, raw.type as StoryType, raw.details);
  return raw as unknown as AnyStory;
}

/**
 * Validates the seed array. Asserts every story is well-formed AND that any
 * story with lat/lng matches a known city in CITIES within 50km. Throws on
 * any failure.
 */
export function validateSeed(raw: unknown): AnyStory[] {
  if (!Array.isArray(raw)) throw new Error("[seed-validate] seed must be an array");
  const stories = raw.map(validateStory);
  for (const s of stories) {
    if (s.lat !== undefined && s.lng !== undefined) {
      const match = nearestCity(s.lat, s.lng);
      if (!match) {
        throw new Error(
          `[seed-validate] story "${s.id}" at (${s.lat}, ${s.lng}) does not match any CITIES entry within 50km`,
        );
      }
    }
  }
  return stories;
}

/** Distance in km between two lat/lng points (haversine). */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Returns the nearest city to (lat, lng) within `maxKm`. Null if none match. */
export function nearestCity(
  lat: number,
  lng: number,
  maxKm: number = 50,
): { slug: string; distanceKm: number } | null {
  let best: { slug: string; distanceKm: number } | null = null;
  for (const [slug, city] of Object.entries(CITIES)) {
    const d = haversineKm(lat, lng, city.lat, city.lng);
    if (d <= maxKm && (best === null || d < best.distanceKm)) {
      best = { slug, distanceKm: d };
    }
  }
  return best;
}
