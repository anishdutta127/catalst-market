/**
 * Crunchbase News RSS adapter.
 *
 * Endpoint: https://news.crunchbase.com/feed/
 * No auth, no GraphQL key required — Crunchbase News is a separate
 * editorial product from the paid Crunchbase database. The RSS feed
 * carries fresh M&A / funding / IPO posts.
 *
 * Filter: items with pubDate within the last 48 hours (the feed
 * itself is ~30-50 items; this trims to "recent" so the dedup pass
 * stays fast).
 *
 * XML parsing via fast-xml-parser (added to package.json in I2). On
 * any parse failure the adapter returns [] — never throws.
 */

import { XMLParser } from "fast-xml-parser";
import { safeFetch } from "./_fetch";
import type { RawSignal } from "@/lib/ingest/types";

const FEED_URL = "https://news.crunchbase.com/feed/";
const RECENCY_WINDOW_MS = 48 * 60 * 60 * 1000;

interface RssItem {
  guid?: string | { "#text"?: string };
  title?: string;
  link?: string;
  description?: string;
  "content:encoded"?: string;
  pubDate?: string;
}

export async function fetchSignals(): Promise<RawSignal[]> {
  const result = await safeFetch(FEED_URL, {
    headers: { Accept: "application/rss+xml, application/xml, text/xml" },
  });
  if (!result.ok) {
    console.warn(`[cb] fetch failed: ${result.error}`);
    return [];
  }

  let xml: string;
  try {
    xml = await result.response.text();
  } catch (e) {
    console.warn(`[cb] read failed: ${msg(e)}`);
    return [];
  }

  return parseRssToSignals(xml, "crunchbase");
}

/**
 * Shared RSS → RawSignal[] pipeline. Exported so the techcrunch-layoffs
 * adapter can reuse the parsing without duplicating the XML wiring.
 */
export function parseRssToSignals(
  xml: string,
  source: RawSignal["source"],
): RawSignal[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    // Don't promote CDATA into a sub-property — fold it into the
    // parent tag's value so item.description reads as a plain string
    // regardless of whether the source wraps it in <![CDATA[ … ]]>.
    parseTagValue: false,
  });

  let parsed: unknown;
  try {
    parsed = parser.parse(xml);
  } catch (e) {
    console.warn(`[${source}] xml parse failed: ${msg(e)}`);
    return [];
  }

  // Tolerant shape probing — RSS root structure: rss > channel > item[]
  const channel = (parsed as { rss?: { channel?: unknown } } | undefined)?.rss
    ?.channel as { item?: RssItem | RssItem[] } | undefined;
  if (!channel) {
    console.warn(`[${source}] no <channel> in feed`);
    return [];
  }
  const itemsRaw = channel.item;
  if (itemsRaw === undefined) return [];
  const items: RssItem[] = Array.isArray(itemsRaw) ? itemsRaw : [itemsRaw];

  const cutoff = Date.now() - RECENCY_WINDOW_MS;
  const signals: RawSignal[] = [];
  for (const item of items) {
    const title = textOf(item.title);
    const link = textOf(item.link);
    if (!title || !link) continue;
    const pub = textOf(item.pubDate);
    const pubMs = pub ? Date.parse(pub) : NaN;
    if (Number.isNaN(pubMs)) continue;
    if (pubMs < cutoff) continue;
    const description =
      textOf(item.description) ??
      textOf(item["content:encoded"]) ??
      undefined;
    const guid = textOf(item.guid) ?? link;
    signals.push({
      sourceId: stableId(guid),
      source,
      title,
      url: link,
      description: description ? stripHtml(description) : undefined,
      publishedAt: new Date(pubMs).toISOString(),
      rawData: item,
    });
  }
  return signals;
}

function textOf(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim();
  if (v && typeof v === "object" && "#text" in v) {
    const t = (v as { "#text"?: unknown })["#text"];
    if (typeof t === "string") return t.trim();
  }
  return undefined;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function stableId(raw: string): string {
  // Many feeds use full URLs as guids; trim to the path so we don't
  // duplicate when a feed flips http/https or adds tracking params.
  try {
    const u = new URL(raw);
    return `${u.host}${u.pathname}`;
  } catch {
    return raw.slice(0, 200);
  }
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export const __cbTesting = { FEED_URL, RECENCY_WINDOW_MS, parseRssToSignals };
