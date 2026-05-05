/**
 * Weekly market picks.
 *
 * Static, curated source for the homepage MVP loop. These are Catalst sample
 * picks: they describe copyable business patterns, not live market facts.
 * Importing this module validates the JSON and fails the build if the weekly
 * file stops being exactly Established / Startup / Frontier.
 */

import rawPicks from "@/content/market-picks.weekly.json";

export type MarketPickCategory = "established" | "startup" | "frontier";
export type BuildDifficulty = "low" | "medium" | "high";

export interface RecommendedTwist {
  id: string;
  title: string;
  simpleDescription: string;
  targetUser: string;
  gapItUses: string;
  whyThisTwistCanWin: string;
  landingPageAngle: string;
}

export interface MarketPickRecipe {
  landingPageSections: string[];
  waitlistOffer: string;
  aiBuildPrompt: string;
  validationPlan: string[];
  whatNotToBuildYet: string[];
  skillFiles: string[];
}

export interface MarketPick {
  id: string;
  category: MarketPickCategory;
  sourceCompany: string;
  sourcePattern: string;
  simpleExplanation: string;
  whyPeoplePay: string;
  marketGap: string;
  copyableMechanic: string;
  smallerVersion: string;
  whatNotToCopy: string;
  locationLabel: string;
  signalLabel: string;
  confidenceScore: number;
  buildDifficulty: BuildDifficulty;
  recommendedTwists: RecommendedTwist[];
  recipe: MarketPickRecipe;
}

type RawMarketPick = Record<string, unknown>;

const REQUIRED_CATEGORIES: readonly MarketPickCategory[] = [
  "established",
  "startup",
  "frontier",
];

const SKILL_FILE_PREFIX = "content/skill-files/";

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

    const recommendedTwists = readTwists(raw.recommendedTwists, index);
    const recipe = readRecipe(raw.recipe, index);

    return {
      id: readString(raw.id, "id", index),
      category,
      sourceCompany: readString(raw.sourceCompany, "sourceCompany", index),
      sourcePattern: readString(raw.sourcePattern, "sourcePattern", index),
      simpleExplanation: readString(
        raw.simpleExplanation,
        "simpleExplanation",
        index,
      ),
      whyPeoplePay: readString(raw.whyPeoplePay, "whyPeoplePay", index),
      marketGap: readString(raw.marketGap, "marketGap", index),
      copyableMechanic: readString(
        raw.copyableMechanic,
        "copyableMechanic",
        index,
      ),
      smallerVersion: readString(raw.smallerVersion, "smallerVersion", index),
      whatNotToCopy: readString(raw.whatNotToCopy, "whatNotToCopy", index),
      locationLabel: readString(raw.locationLabel, "locationLabel", index),
      signalLabel: readString(raw.signalLabel, "signalLabel", index),
      confidenceScore: readScore(raw.confidenceScore, index),
      buildDifficulty: readDifficulty(raw.buildDifficulty, index),
      recommendedTwists,
      recipe,
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

function readDifficulty(value: unknown, index: number): BuildDifficulty {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  throw new Error(
    `[market-picks] pick ${index + 1} buildDifficulty must be low, medium, or high`,
  );
}

function readScore(value: unknown, index: number): number {
  if (typeof value !== "number" || value < 0 || value > 100) {
    throw new Error(
      `[market-picks] pick ${index + 1} confidenceScore must be 0-100`,
    );
  }
  return value;
}

function readTwists(value: unknown, pickIndex: number): RecommendedTwist[] {
  if (!Array.isArray(value) || value.length < 3) {
    throw new Error(
      `[market-picks] pick ${pickIndex + 1} must include at least 3 recommendedTwists`,
    );
  }
  return value.map((entry, twistIndex) => {
    if (!isRecord(entry)) {
      throw new Error(
        `[market-picks] pick ${pickIndex + 1} twist ${twistIndex + 1} must be an object`,
      );
    }
    return {
      id: readString(entry.id, "recommendedTwists.id", pickIndex),
      title: readString(entry.title, "recommendedTwists.title", pickIndex),
      simpleDescription: readString(
        entry.simpleDescription,
        "recommendedTwists.simpleDescription",
        pickIndex,
      ),
      targetUser: readString(
        entry.targetUser,
        "recommendedTwists.targetUser",
        pickIndex,
      ),
      gapItUses: readString(
        entry.gapItUses,
        "recommendedTwists.gapItUses",
        pickIndex,
      ),
      whyThisTwistCanWin: readString(
        entry.whyThisTwistCanWin,
        "recommendedTwists.whyThisTwistCanWin",
        pickIndex,
      ),
      landingPageAngle: readString(
        entry.landingPageAngle,
        "recommendedTwists.landingPageAngle",
        pickIndex,
      ),
    };
  });
}

function readRecipe(value: unknown, index: number): MarketPickRecipe {
  if (!isRecord(value)) {
    throw new Error(`[market-picks] pick ${index + 1} recipe must be an object`);
  }
  const skillFiles = readStringArray(value.skillFiles, "skillFiles", index);
  for (const file of skillFiles) {
    if (!file.startsWith(SKILL_FILE_PREFIX) || !file.endsWith(".md")) {
      throw new Error(
        `[market-picks] pick ${index + 1} skillFiles must point to content/skill-files/*.md`,
      );
    }
  }
  return {
    landingPageSections: readStringArray(
      value.landingPageSections,
      "landingPageSections",
      index,
    ),
    waitlistOffer: readString(value.waitlistOffer, "waitlistOffer", index),
    aiBuildPrompt: readString(value.aiBuildPrompt, "aiBuildPrompt", index),
    validationPlan: readStringArray(value.validationPlan, "validationPlan", index),
    whatNotToBuildYet: readStringArray(
      value.whatNotToBuildYet,
      "whatNotToBuildYet",
      index,
    ),
    skillFiles,
  };
}

function readStringArray(value: unknown, field: string, index: number): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`[market-picks] pick ${index + 1} missing ${field}`);
  }
  return value.map((item, itemIndex) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new Error(
        `[market-picks] pick ${index + 1} ${field}[${itemIndex}] must be a non-empty string`,
      );
    }
    return item.trim();
  });
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
