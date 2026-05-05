/**
 * Validated seed export.
 *
 * Imports content/stories.seed.json at module load, runs it through
 * `validateSeed`, and re-exports the result as a strongly-typed AnyStory[].
 *
 * Side effect: any consumer that imports this module triggers schema
 * validation. Static-rendered pages (e.g. /primitives) evaluate page
 * modules during `next build`, so a malformed seed throws there and FAILS
 * THE BUILD — exactly the build-time guard the brief asked for.
 *
 * Always import the seed via this module, never the raw JSON. The TS type
 * of the JSON is `unknown[]` from Next.js's JSON loader; here you get
 * `AnyStory[]` with full discriminated-union narrowing.
 */

import seedRaw from "@/content/stories.seed.json";
import { validateSeed } from "./seed-validate";
import type { AnyStory } from "./types/story";

export const SEED_STORIES: readonly AnyStory[] = validateSeed(seedRaw);
