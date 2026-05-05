/**
 * Seed fallback — last-line guarantee that the home page renders
 * something even if the live JSON file is missing or empty.
 *
 * Reads content/stories.seed.json via the existing build-time-validated
 * SEED_STORIES export. Always works offline, always returns the 20
 * hand-curated launch stories.
 *
 * Lives at lib/db/ rather than lib/ingest/ because it intentionally
 * sits OUTSIDE the ingest pipeline — it's the floor under the pipeline,
 * not part of it.
 */

import { SEED_STORIES } from "@/lib/seed";
import type { AnyStory } from "@/lib/types/story";

export function readSeedFallback(): AnyStory[] {
  return [...SEED_STORIES] as AnyStory[];
}
