/**
 * Story validator (ingest path).
 *
 * Distinct from lib/seed-validate.ts which throws on any malformed
 * row (build-time discipline for the hand-curated seed). The ingest
 * pipeline gets a steady stream of imperfect external data, so we
 * want a NON-throwing structured result that the orchestrator can
 * log + skip without crashing the whole batch.
 *
 * Returns:
 *   { valid: true }                   — story passes minimum bar
 *   { valid: false; reason: string }  — single human-readable reason
 *
 * Never throws.
 */

import type {
  AnyStory,
  Industry,
  Mood,
  Stage,
  StoryType,
} from "@/lib/types/story";

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

const VALID_STAGES: ReadonlySet<Stage> = new Set([
  "empires",
  "builders",
  "bootstrappers",
]);

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export function validateStory(story: AnyStory): ValidationResult {
  if (typeof story.id !== "string" || story.id.length === 0) {
    return { valid: false, reason: "id must be a non-empty string" };
  }
  if (!VALID_TYPES.has(story.type)) {
    return { valid: false, reason: `type "${story.type}" is not a valid StoryType` };
  }
  if (typeof story.title !== "string" || story.title.length < 5) {
    return { valid: false, reason: "title must be at least 5 chars" };
  }
  if (!VALID_MOODS.has(story.primaryMood)) {
    return {
      valid: false,
      reason: `primaryMood "${story.primaryMood}" is not a valid Mood`,
    };
  }
  if (!VALID_INDUSTRIES.has(story.industry)) {
    return {
      valid: false,
      reason: `industry "${story.industry}" is not a valid Industry`,
    };
  }
  if (!VALID_STAGES.has(story.stage)) {
    return {
      valid: false,
      reason: `stage "${story.stage}" is not a valid Stage`,
    };
  }
  if (!Array.isArray(story.microBullets) || story.microBullets.length < 1) {
    return { valid: false, reason: "microBullets must contain at least 1 entry" };
  }
  if (typeof story.whyNow !== "string" || story.whyNow.length < 5) {
    return { valid: false, reason: "whyNow must be at least 5 chars" };
  }
  return { valid: true };
}
