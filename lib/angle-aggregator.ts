/**
 * angle-aggregator — pure cross-story aggregation for the v3 Build Angles
 * module.
 *
 * Per feed.md §7f Module F (ratified): build angles are a cross-story
 * editorial layer, NOT a per-story metadata mirror. We collect angles
 * across the filtered story pool, dedupe by title, score by count of
 * inspiring stories, pick top 3 globally.
 *
 * Pure: same input, same output.
 *
 * Tie-breaking is deterministic to keep test snapshots stable. When two
 * angles are tied on `score`, we tiebreak by:
 *   1. industry's signal count (descending) — busier industry's angle wins
 *   2. angle title's lexical order (ascending) — final stable tiebreak
 */

import { getAngles } from "@/lib/angles";
import type { AnyStory, Industry, Mood } from "@/lib/types/story";

export interface BuildAngleCard {
  /** Stable id derived from the angle title. */
  id: string;
  /** Angle title — declarative, ≤ 8 words. */
  title: string;
  /** Wedge description, ≤ 25 words. */
  description: string;
  /** Editorial wedge hint (one sentence, may name companies). */
  wedgeHint: string;
  /** 2-3 stories that inspired this angle. */
  inspiringStoryIds: string[];
  /** Industry the angle anchors in (most common in the inspiring set). */
  industry: Industry;
  /** Primary mood from the inspiring stories' dominant mood. */
  primaryMood: Mood;
}

export interface AggregateOptions {
  /** Cap on returned angles. Defaults to 3 per the v3 spec. */
  limit?: number;
}

/**
 * Aggregate build angles across the story pool.
 *
 * Algorithm:
 *  1. For each story, get 3 angles via lib/angles.ts.
 *  2. Group by angle.title (the dedup key).
 *  3. For each group, accumulate inspiring story ids + industry counts +
 *     mood counts.
 *  4. Score = inspiringStoryIds.length, capped at 3 inspiring stories
 *     per card (extra stories increase score but only the first 3 surface).
 *  5. Sort by score desc, ties by industry signal count desc, ties by
 *     title ascending.
 *  6. Return top `limit` cards. If pool yields fewer than `limit`, return
 *     fewer (no padding — angles are editorial judgment, not slot-filler).
 */
export function aggregateAngles(
  stories: readonly AnyStory[],
  options: AggregateOptions = {},
): BuildAngleCard[] {
  const limit = options.limit ?? 3;
  if (stories.length === 0) return [];

  // Industry signal counts for tie-breaking
  const industrySignalCount = new Map<Industry, number>();
  for (const s of stories) {
    industrySignalCount.set(
      s.industry,
      (industrySignalCount.get(s.industry) ?? 0) + 1,
    );
  }

  // Group angles by title
  type Bucket = {
    title: string;
    description: string;
    wedgeHint: string;
    inspiringStoryIds: string[];
    industries: Map<Industry, number>;
    moods: Map<Mood, number>;
  };
  const buckets = new Map<string, Bucket>();

  for (const story of stories) {
    const angles = getAngles(story);
    for (const angle of angles) {
      let b = buckets.get(angle.title);
      if (!b) {
        b = {
          title: angle.title,
          description: angle.description,
          wedgeHint: angle.wedge_hint,
          inspiringStoryIds: [],
          industries: new Map(),
          moods: new Map(),
        };
        buckets.set(angle.title, b);
      }
      // Don't double-count a story for the same angle (defensive — getAngles
      // returns distinct titles per story but this is still cheap insurance).
      if (!b.inspiringStoryIds.includes(story.id)) {
        b.inspiringStoryIds.push(story.id);
      }
      b.industries.set(
        story.industry,
        (b.industries.get(story.industry) ?? 0) + 1,
      );
      b.moods.set(
        story.primaryMood,
        (b.moods.get(story.primaryMood) ?? 0) + 1,
      );
    }
  }

  // Convert buckets to cards
  const cards: BuildAngleCard[] = [];
  for (const b of buckets.values()) {
    const industry = pickModeKey(b.industries);
    const primaryMood = pickModeKey(b.moods);
    cards.push({
      id: titleToId(b.title),
      title: b.title,
      description: b.description,
      wedgeHint: b.wedgeHint,
      inspiringStoryIds: b.inspiringStoryIds.slice(0, 3),
      industry,
      primaryMood,
    });
  }

  // Sort: score desc → industry signal count desc → title asc
  cards.sort((a, b) => {
    const sa = a.inspiringStoryIds.length;
    const sb = b.inspiringStoryIds.length;
    if (sb !== sa) return sb - sa;
    const ic = (industrySignalCount.get(b.industry) ?? 0) -
      (industrySignalCount.get(a.industry) ?? 0);
    if (ic !== 0) return ic;
    return a.title.localeCompare(b.title);
  });

  return cards.slice(0, limit);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Most-common key in a Map<K, count>. Throws on empty. */
function pickModeKey<K>(counts: Map<K, number>): K {
  let bestKey: K | null = null;
  let bestN = -1;
  for (const [k, n] of counts) {
    if (n > bestN) {
      bestN = n;
      bestKey = k;
    }
  }
  if (bestKey === null) {
    throw new Error("pickModeKey: empty map");
  }
  return bestKey;
}

function titleToId(title: string): string {
  return (
    "angle-" +
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64)
  );
}
