"use client";

/**
 * EditorialConsole — composes the three Phase 7a curation surfaces
 * (BusinessOfWeek → Top3OfWeek → Movers) and owns their filter-cascade
 * behavior so HomeClient stays focused on the existing daily modules.
 *
 * Cascade rules (per Phase 7a brief):
 *
 *   BusinessOfWeek — UNFILTERED. The hand-curated weekly pick is
 *     editorial; the universal filter cannot override it. The component
 *     does still receive the filtered angles list so the related-angle
 *     line resolves against the same pool the rest of the page sees.
 *
 *   Top3OfWeek — FILTERED. When no filter is active we render the
 *     hand-curated `items` from content/curation/top3-of-week.json. When
 *     a filter IS active we recompute picks from the filtered pool
 *     (sorted by createdAt desc, take 3) with a programmatic note that
 *     references the filter. Filtered pool < 3 → empty state.
 *
 *   Movers — FILTERED. When no filter is active we render the hand-
 *     selected movers from `getMovers()` against the full seed. When a
 *     filter IS active we recompute via `getMovers(filteredPool)` so the
 *     same isMoverCandidate predicate runs. Filtered pool yielding < 3
 *     candidates → trailing slots render as empty placeholders (existing
 *     Movers component behavior).
 *
 * Insertion order in the home feed: BusinessOfWeek → Top3OfWeek →
 * Movers, creating the editorial arc "single biggest story → 3 big
 * stories → 3 small stories."
 */

import { BusinessOfWeek } from "@/components/feed/BusinessOfWeek";
import { Movers } from "@/components/feed/Movers";
import { Top3OfWeek } from "@/components/feed/Top3OfWeek";
import { getMovers } from "@/lib/curation";
import type {
  BusinessOfTheWeek,
  Top3OfWeekItem,
} from "@/lib/curation";
import type { BuildAngleCard } from "@/lib/angle-aggregator";
import type { AnyStory } from "@/lib/types/story";

export interface EditorialConsoleProps {
  /** Hand-curated weekly Top 3 from `getTop3OfWeek()`. */
  top3OfWeekItems: Top3OfWeekItem[];
  /** Hand-curated Business of the Week from `getBusinessOfWeek()`. */
  businessOfWeek: BusinessOfTheWeek;
  /** Hand-selected movers from `getMovers()` with the full seed. */
  unfilteredMovers: AnyStory[];
  /** Filtered story pool — used to recompute when filter is active. */
  filteredStories: AnyStory[];
  /** True when at least one filter scope is active. */
  filterIsActive: boolean;
  /** Filter chip label (e.g. "AI · Builder") for programmatic notes. */
  filterLabel: string;
  /** Filtered angle aggregation, used for BoW related-angle resolution. */
  angles: BuildAngleCard[];
  onBuild: (storyId: string) => void;
  onAngleTap: (angleId: string) => void;
}

export function EditorialConsole(props: EditorialConsoleProps) {
  const {
    top3OfWeekItems,
    businessOfWeek,
    unfilteredMovers,
    filteredStories,
    filterIsActive,
    filterLabel,
    angles,
    onBuild,
    onAngleTap,
  } = props;

  const top3Items = filterIsActive
    ? deriveFilteredWeeklyTop3(filteredStories, filterLabel)
    : top3OfWeekItems;

  const moverStories = filterIsActive
    ? getMovers(filteredStories)
    : unfilteredMovers;

  return (
    <div data-editorial-console="" className="flex flex-col gap-8 lg:gap-10">
      <BusinessOfWeek
        data={businessOfWeek}
        angles={angles}
        onAngleTap={onAngleTap}
      />
      <Top3OfWeek items={top3Items} onBuild={onBuild} />
      <Movers stories={moverStories} onBuild={onBuild} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * When the universal filter is active, recompute the weekly Top 3 from
 * the filtered story pool. Less than 3 filtered stories → return empty
 * so the Top3OfWeek component renders the empty state.
 *
 * The curatorial note is a programmatic placeholder — the editorial
 * notes from the JSON only apply to the unfiltered curated view.
 */
function deriveFilteredWeeklyTop3(
  filteredStories: AnyStory[],
  filterLabel: string,
): Top3OfWeekItem[] {
  if (filteredStories.length < 3) return [];
  const sorted = [...filteredStories].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  return sorted.slice(0, 3).map((story, i) => ({
    story,
    rank: (i + 1) as 1 | 2 | 3,
    curatorialNote: `Top weekly story within your current filter (${filterLabel}).`,
  }));
}
