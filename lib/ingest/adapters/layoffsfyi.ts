/**
 * Layoffs adapter — TechCrunch RSS fallback.
 *
 * **Source choice + reasoning.** layoffs.fyi exposes its data through
 * an Airtable embed; the public Airtable API requires per-base API
 * keys that aren't documented for the layoffs.fyi base, and the
 * community-maintained CSV mirrors are unmaintained / on-and-off.
 * Rather than ship a brittle parser that breaks the moment they
 * restructure, we use the TechCrunch /tag/layoffs RSS feed as the
 * Phase 7c source for layoff signals: stable, public, no auth, same
 * RSS-shaped payload as crunchbase-rss so we reuse parseRssToSignals.
 *
 * The Source enum keeps the value "layoffsfyi" (per lib/types/story
 * Source union) so downstream code doesn't need to change when we
 * eventually swap to a real Airtable / structured source. The
 * adapter file is the only place that knows the URL changed.
 */

import { safeFetch } from "./_fetch";
import { parseRssToSignals } from "./crunchbase-rss";
import type { RawSignal } from "@/lib/ingest/types";

const FEED_URL = "https://techcrunch.com/tag/layoffs/feed/";

export async function fetchSignals(): Promise<RawSignal[]> {
  const result = await safeFetch(FEED_URL, {
    headers: { Accept: "application/rss+xml, application/xml, text/xml" },
  });
  if (!result.ok) {
    console.warn(`[lf] fetch failed: ${result.error}`);
    return [];
  }

  let xml: string;
  try {
    xml = await result.response.text();
  } catch (e) {
    console.warn(
      `[lf] read failed: ${e instanceof Error ? e.message : String(e)}`,
    );
    return [];
  }

  return parseRssToSignals(xml, "layoffsfyi");
}

export const __lfTesting = { FEED_URL };
