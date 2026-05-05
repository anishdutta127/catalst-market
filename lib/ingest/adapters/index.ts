/**
 * Barrel of all five Phase 7c adapters. The orchestrator imports
 * from here so adding a sixth source is a single addition.
 */

export { fetchSignals as fetchHackerNews } from "./hackernews";
export { fetchSignals as fetchProductHunt } from "./producthunt";
export { fetchSignals as fetchGitHubTrending } from "./github-trending";
export { fetchSignals as fetchCrunchbaseRSS } from "./crunchbase-rss";
export { fetchSignals as fetchLayoffs } from "./layoffsfyi";
