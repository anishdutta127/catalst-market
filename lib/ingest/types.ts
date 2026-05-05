/**
 * Ingest pipeline shared types.
 *
 * RawSignal — wire-format payload one adapter normalizes to before the
 *   pipeline turns it into an AnyStory. Adapters never produce Story
 *   objects directly so the per-source quirks live in one place
 *   (`lib/ingest/normalize.ts`) instead of leaking into adapter code.
 *
 * IngestResult — JSON payload returned by /api/ingest. Carries enough
 *   per-source detail to debug a partial failure ("crunchbase fetched
 *   12, inserted 0" tells you the normalizer rejected them) without
 *   exposing the raw signal payload.
 */

import type { Source } from "@/lib/types/story";

export interface RawSignal {
  /** Source-local identifier (HN item id, GitHub repo full_name, etc). */
  sourceId: string;
  /** Which adapter produced this signal. */
  source: Source;
  /** Headline-quality string; the normalizer uses it for type/industry classification. */
  title: string;
  /** Outbound link to the underlying record (HN comments page, repo page, etc). */
  url: string;
  /** Optional longer body — drives microBullets + whyNow downstream. */
  description?: string;
  /** ISO 8601 publish timestamp from the source. */
  publishedAt: string;
  /** Whatever extra fields the adapter wants to forward (stargazer count, votes, etc). */
  rawData: unknown;
}

export interface IngestSourceStat {
  fetched: number;
  inserted: number;
  error?: string;
}

export type IngestSourceStats = Partial<Record<Source, IngestSourceStat>>;

export interface IngestResult {
  inserted: number;
  skipped: number;
  errors: string[];
  duration_ms: number;
  sources: IngestSourceStats;
}
