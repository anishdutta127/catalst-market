/**
 * Catalst Market — canonical Story type.
 *
 * Single generic interface discriminated by `type`. Type-specific data lives
 * in `details: TypeDetails[T]`. Universal card and filter fields stay at the
 * top level so the StoryCard, feed, and ranking code never have to narrow.
 *
 * Adding a 12th story type means: one entry in TypeDetails, one angle
 * generator in lib/angles.ts, one derive rule in lib/headline.ts. Nothing
 * else changes.
 *
 * See:
 *   - CLAUDE.md — 11 story types, 9 moods, 3 stages
 *   - design-system/MASTER.md §3 — mood-lens tints
 *   - lib/headline.ts — per-type HeadlineNumber derivation
 */

export type StoryType =
  | "funding"
  | "launch"
  | "ai"
  | "ma"
  | "ipo"
  | "milestone"
  | "founder"
  | "os"
  | "layoff"
  | "shutdown"
  | "regulatory";

export type Mood =
  | "blowing-up"
  | "underdog-wins"
  | "bootstrapped-millions"
  | "overnight-rockets"
  | "quiet-builders"
  | "copy-able-ideas"
  | "founders-like-me"
  | "big-money-moves"
  | "india-shipping";

export type Stage = "empires" | "builders" | "bootstrappers";

export type Industry =
  | "ai"
  | "fintech"
  | "climate"
  | "biotech"
  | "defense"
  | "consumer"
  | "b2b"
  | "devtools"
  | "space"
  | "creator"
  | "commerce"
  | "india-shipping";

export type Region = "india" | "global";

export type Source =
  | "hackernews"
  | "producthunt"
  | "github-trending"
  | "crunchbase"
  | "layoffsfyi"
  | "seed";

/**
 * Big-format number on the Story Card.
 *
 * `null` (at the Story level) is meaningful — tells the renderer to skip
 * the headline number row and render the founder face at hero size
 * instead. Used for FounderStory and any story whose details don't yield
 * a sensible numeric anchor.
 */
export type HeadlineNumber = {
  value: number;
  unit: string;
  format: "currency" | "plain" | "percent";
};

/**
 * Type-specific extension shapes, keyed by StoryType.
 *
 * The StoryCard never reads `details` — only BuildSheet, lib/angles.ts,
 * and lib/headline.ts do.
 */
export type TypeDetails = {
  funding: {
    amountUsd: number;
    round: string;
    investors: string[];
    valuation?: number;
    leadInvestor?: string;
  };
  launch: {
    productName: string;
    productUrl: string;
    launchPlatform?: "producthunt" | "hackernews" | "twitter" | "direct";
  };
  ai: {
    modelName?: string;
    benchmark?: string;
    benchmarkGain?: number; // points improvement on `benchmark`
    costRatio?: number; // e.g. 40 for "1/40th the cost of SOTA"
    weightsLicense?: string;
    productUrl?: string;
  };
  ma: {
    acquirer: string;
    acquired: string;
    amountUsd?: number;
    dealType: "acquisition" | "merger" | "acquihire";
  };
  ipo: {
    ticker: string;
    exchange: "NYSE" | "NASDAQ" | "NSE" | "BSE" | "HKEX" | "LSE";
    marketCapUsd: number;
    priceFirstDay?: number;
  };
  milestone: {
    metric: string; // 'ARR' | 'users' | 'GMV' | 'DAU' | string
  };
  founder: {
    founderName: string;
  };
  os: {
    repoUrl: string;
    stars: number;
    language?: string;
    license?: string;
  };
  layoff: {
    headcountAffected: number;
    percentOfWorkforce?: number;
  };
  shutdown: {
    yearsOperating?: number;
    totalRaisedUsd?: number;
  };
  regulatory: {
    jurisdiction: string;
    authority?: string;
    rulingDate?: string;
  };
};

export interface Story<T extends StoryType = StoryType> {
  // Identity
  id: string;
  type: T;
  title: string;

  // Universal card fields
  headlineNumber: HeadlineNumber | null;
  founderFaceUrl?: string;
  companyLogoUrl?: string;
  microBullets: string[];
  whyNow: string;

  // Universal filter fields
  primaryMood: Mood;
  moods: Mood[];
  stage: Stage;
  industry: Industry;
  region: Region;

  // Universal metadata
  verified: boolean;

  // Provenance
  source: Source;
  sourceUrl?: string;
  sourceId?: string;
  createdAt: string;
  publishedAt?: string;

  // Geo anchor (optional). Used by lib/heat-headline.ts to bucket stories
  // into cities for the heat compute. Stories without lat/lng are excluded
  // from heat compute (with a dev warning) — they still render in the feed.
  lat?: number;
  lng?: number;

  // Curator flag — set true on hand-picked seed stories that should drive
  // a clear "Today: <City> is hot" cluster on first paint.
  featured?: boolean;

  // Type-specific extension
  details: TypeDetails[T];
}

/**
 * Discriminated union of every concrete Story instantiation.
 *
 * Built as `{[K in StoryType]: Story<K>}[StoryType]` rather than the
 * default `Story<StoryType>` because the latter does NOT correlate
 * `type` and `details` — narrowing `story.type === 'funding'` would
 * leave `story.details` as the wide union. The mapped form gives us
 * a true discriminated union: switch on `type` and `details` narrows
 * with it.
 */
export type AnyStory = { [K in StoryType]: Story<K> }[StoryType];

// Per-type aliases — import these where you know which kind you have.
export type FundingStory = Story<"funding">;
export type LaunchStory = Story<"launch">;
export type AIStory = Story<"ai">;
export type MAStory = Story<"ma">;
export type IPOStory = Story<"ipo">;
export type MilestoneStory = Story<"milestone">;
export type FounderStory = Story<"founder">;
export type OSStory = Story<"os">;
export type LayoffStory = Story<"layoff">;
export type ShutdownStory = Story<"shutdown">;
export type RegulatoryStory = Story<"regulatory">;
