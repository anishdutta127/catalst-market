/**
 * Weekly market picks.
 *
 * Static, curated source for the homepage MVP loop. This deliberately does
 * not touch live APIs: importing the module validates the JSON and fails the
 * build if the weekly file stops being exactly Established / Startup /
 * Frontier or points at a missing seed story.
 */

import rawPicks from "@/content/market-picks.weekly.json";
import { SEED_STORIES } from "@/lib/seed";
import type { AnyStory } from "@/lib/types/story";

export type MarketPickCategory = "established" | "startup" | "frontier";

export interface MarketPick {
  category: MarketPickCategory;
  storyId: string;
  label: string;
  companyName: string;
  headline: string;
  businessPattern: string;
  whyThisWeek: string;
  copyablePrompt: string;
  story: AnyStory;
}

type RawMarketPick = {
  category?: unknown;
  storyId?: unknown;
  label?: unknown;
  companyName?: unknown;
  headline?: unknown;
  businessPattern?: unknown;
  whyThisWeek?: unknown;
  copyablePrompt?: unknown;
};

const REQUIRED_CATEGORIES: readonly MarketPickCategory[] = [
  "established",
  "startup",
  "frontier",
];

export function getWeeklyMarketPicks(): readonly MarketPick[] {
  return WEEKLY_MARKET_PICKS;
}

export const WEEKLY_MARKET_PICKS: readonly MarketPick[] =
  validateMarketPicks(rawPicks);

export function validateMarketPicks(input: unknown): MarketPick[] {
  if (!Array.isArray(input)) {
    throw new Error("[market-picks] weekly source must be an array");
  }
  if (input.length !== REQUIRED_CATEGORIES.length) {
    throw new Error("[market-picks] weekly source must contain exactly 3 picks");
  }

  const seen = new Set<MarketPickCategory>();
  const storiesById = new Map(SEED_STORIES.map((story) => [story.id, story]));

  const picks = input.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`[market-picks] pick ${index + 1} must be an object`);
    }
    const raw = entry as RawMarketPick;
    const category = readCategory(raw.category, index);
    if (seen.has(category)) {
      throw new Error(`[market-picks] duplicate category "${category}"`);
    }
    seen.add(category);

    const storyId = readString(raw.storyId, "storyId", index);
    const story = storiesById.get(storyId);
    if (!story) {
      throw new Error(
        `[market-picks] pick ${index + 1} references unknown storyId "${storyId}"`,
      );
    }

    return {
      category,
      storyId,
      label: readString(raw.label, "label", index),
      companyName: readString(raw.companyName, "companyName", index),
      headline: readString(raw.headline, "headline", index),
      businessPattern: readString(raw.businessPattern, "businessPattern", index),
      whyThisWeek: readString(raw.whyThisWeek, "whyThisWeek", index),
      copyablePrompt: readString(raw.copyablePrompt, "copyablePrompt", index),
      story,
    };
  });

  for (const category of REQUIRED_CATEGORIES) {
    if (!seen.has(category)) {
      throw new Error(`[market-picks] missing category "${category}"`);
    }
  }

  return REQUIRED_CATEGORIES.map((category) => {
    const pick = picks.find((item) => item.category === category);
    if (!pick) {
      throw new Error(`[market-picks] missing category "${category}"`);
    }
    return pick;
  });
}

function readCategory(value: unknown, index: number): MarketPickCategory {
  if (
    value === "established" ||
    value === "startup" ||
    value === "frontier"
  ) {
    return value;
  }
  throw new Error(
    `[market-picks] pick ${index + 1} category must be established, startup, or frontier`,
  );
}

function readString(value: unknown, field: string, index: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`[market-picks] pick ${index + 1} missing ${field}`);
  }
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const __marketPicksTesting = {
  REQUIRED_CATEGORIES,
};
