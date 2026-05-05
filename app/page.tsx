/**
 * Home (`/`) — MVP homepage loop.
 *
 * Server component: reads the live JSON store on every request and falls
 * back to the hand-curated seed. The homepage now foregrounds the weekly
 * build loop instead of the market-console modules.
 */

import { HomeClient } from "./page-client";
import { DevModeIndicator, type DevModeKind } from "@/components/feed/DevModeIndicator";
import { readLiveStories } from "@/lib/ingest/store";
import { readSeedFallback } from "@/lib/db/seed-fallback";
import { getWeeklyMarketPicks } from "@/lib/market-picks";
import type { AnyStory } from "@/lib/types/story";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface LoadedStories {
  stories: AnyStory[];
  source: DevModeKind;
}

export async function loadStories(): Promise<LoadedStories> {
  const live = readLiveStories();
  if (live.length > 0) {
    return { stories: live, source: "live" };
  }
  console.warn("[Catalst] No live stories found, using seed fallback");
  return { stories: readSeedFallback(), source: "seed-fallback" };
}

function pickTop3(stories: readonly AnyStory[]): AnyStory[] {
  const featured = stories.filter((story) => story.featured === true);
  const pool = featured.length >= 3 ? featured : [...stories];
  return [...pool]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 3);
}

export default async function Home() {
  const { stories, source } = await loadStories();
  const top3 = pickTop3(stories);
  const weeklyMarketPicks = getWeeklyMarketPicks();

  return (
    <>
      <HomeClient
        stories={stories}
        top3={top3}
        weeklyMarketPicks={weeklyMarketPicks}
      />
      <DevModeIndicator kind={source} count={stories.length} />
    </>
  );
}
