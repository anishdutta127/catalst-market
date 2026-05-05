/**
 * Normalizer — turns a RawSignal into an AnyStory the home feed can
 * render. Returns null (with a single console.warn) for any signal
 * that can't be coerced into a valid Story. Never throws.
 *
 * The classification rules (type, mood, industry, stage, city) are
 * keyword-driven heuristics chosen to be auditable in plain text
 * rather than ML-driven so the user can review and adjust without
 * retraining. See design-system/pages/feed.md §7c when the rules
 * land in their final form.
 *
 * IMPORTANT: this module is the single chokepoint where adapter
 * vocabulary becomes Story vocabulary. If a future Source enum value
 * is added, extend `classifyType` and `defaultDetailsForType` here.
 */

import { CITIES } from "@/components/brand/world-data";
import { deriveHeadline } from "@/lib/headline";
import type { RawSignal } from "@/lib/ingest/types";
import type {
  AnyStory,
  HeadlineNumber,
  Industry,
  Mood,
  Source,
  Stage,
  Story,
  StoryType,
  TypeDetails,
} from "@/lib/types/story";

// ─────────────────────────────────────────────────────────────────────────────
// Public entry
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeSignal(raw: RawSignal): AnyStory | null {
  try {
    const story = normalizeUnsafe(raw);
    return story;
  } catch (e) {
    console.warn(
      `[normalize] failed for ${raw.source}/${raw.sourceId}: ${
        e instanceof Error ? e.message : String(e)
      }`,
    );
    return null;
  }
}

function normalizeUnsafe(raw: RawSignal): AnyStory | null {
  if (typeof raw.title !== "string" || raw.title.length < 5) {
    console.warn(
      `[normalize] skipping ${raw.source}/${raw.sourceId}: title too short`,
    );
    return null;
  }

  const type = classifyType(raw);
  const industry = classifyIndustry(raw);
  const stage = classifyStage(raw);
  const primaryMood = classifyMood(raw, type, industry, stage);
  const city = bestCityMatch(raw);
  const details = buildDetails(type, raw);
  const headlineNumber = headlineFor(type, raw, details);
  const microBullets = makeMicroBullets(raw.description);
  const whyNow = makeWhyNow(raw.description);
  const region: "india" | "global" =
    industry === "india-shipping" || city?.country === "India"
      ? "india"
      : "global";

  // Build a typed Story by widening through the discriminated union.
  // The discriminator is `type`; the cast is safe because `details`
  // was constructed via buildDetails(type, …) which is exhaustively
  // typed per StoryType.
  const story = {
    id: `${raw.source}-${raw.sourceId}`,
    type,
    title: raw.title.slice(0, 200),
    headlineNumber,
    microBullets,
    whyNow,
    primaryMood,
    moods: [primaryMood],
    stage,
    industry,
    region,
    verified: false, // machine-extracted — Movers expects this
    source: raw.source,
    sourceUrl: raw.url,
    sourceId: raw.sourceId,
    createdAt: raw.publishedAt,
    publishedAt: raw.publishedAt,
    lat: city?.lat,
    lng: city?.lng,
    details,
  } as unknown as AnyStory;

  return story;
}

// ─────────────────────────────────────────────────────────────────────────────
// Type classification
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_RULES: ReadonlyArray<{ re: RegExp; type: StoryType }> = [
  { re: /raises?d?\s+\$[\d.]+\s*[MB]/i, type: "funding" },
  { re: /acqui[rs]/i, type: "ma" },
  { re: /\bIPO\b|S-1|goes? public/i, type: "ipo" },
  { re: /\$[\d.]+\s*[MB]\s+ARR|milestone/i, type: "milestone" },
  { re: /Show HN|just launched|we built/i, type: "launch" },
  { re: /open.sourc/i, type: "os" },
  { re: /founder|leaving|joins/i, type: "founder" },
];

export function classifyType(raw: RawSignal): StoryType {
  if (raw.source === "layoffsfyi") return "layoff";
  if (raw.source === "github-trending") return "os";
  if (raw.source === "producthunt") return "launch";
  // hackernews + crunchbase fall through to title scan.
  for (const rule of TYPE_RULES) {
    if (rule.re.test(raw.title)) return rule.type;
  }
  return "launch";
}

// ─────────────────────────────────────────────────────────────────────────────
// Industry classification — first-match-wins keyword map
// ─────────────────────────────────────────────────────────────────────────────

const INDUSTRY_KEYWORDS: ReadonlyArray<{
  industry: Industry;
  words: string[];
}> = [
  {
    industry: "india-shipping",
    words: [
      "India",
      "Bangalore",
      "Mumbai",
      "IIT",
      "Zepto",
      "Sarvam",
      "Razorpay",
      "SEBI",
      "BSE",
      "NSE",
    ],
  },
  {
    industry: "ai",
    words: [
      "AI",
      "LLM",
      "GPT",
      "Claude",
      "OpenAI",
      "Anthropic",
      "model",
      "agent",
      "ML",
    ],
  },
  {
    industry: "fintech",
    words: [
      "fintech",
      "payment",
      "bank",
      "neobank",
      "lending",
      "crypto",
    ],
  },
  {
    industry: "climate",
    words: ["climate", "carbon", "energy", "solar", "EV", "battery", "green"],
  },
  {
    industry: "biotech",
    words: ["bio", "health", "medical", "pharma", "drug", "genomic", "FDA"],
  },
  {
    industry: "defense",
    words: [
      "defense",
      "military",
      "drone",
      "weapon",
      "cyber",
      "security",
      "surveillance",
    ],
  },
  {
    industry: "consumer",
    words: [
      "consumer",
      "social",
      "gaming",
      "entertainment",
      "music",
      "video",
    ],
  },
  {
    industry: "b2b",
    words: ["enterprise", "SaaS", "B2B", "workflow", "productivity", "HR"],
  },
  {
    industry: "devtools",
    words: [
      "developer",
      "devtools",
      "CLI",
      "API",
      "SDK",
      "framework",
      "open source",
      "repo",
      "GitHub",
    ],
  },
  {
    industry: "space",
    words: ["space", "satellite", "rocket", "orbit", "aerospace"],
  },
  {
    industry: "creator",
    words: [
      "creator",
      "newsletter",
      "Substack",
      "podcast",
      "influencer",
    ],
  },
  {
    industry: "commerce",
    words: ["ecommerce", "marketplace", "retail", "shopify", "D2C"],
  },
];

export function classifyIndustry(raw: RawSignal): Industry {
  const haystack = `${raw.title} ${raw.description ?? ""}`;
  for (const { industry, words } of INDUSTRY_KEYWORDS) {
    for (const w of words) {
      // Word-boundary leading + tolerant trailing so short keywords
      // ("AI", "ML") don't false-positive on substrings ("rAIses",
      // "shipMLng") but plural / participle forms still match
      // ("payment" → "payments", "model" → "models", "agent" →
      // "agents"). Multi-word keywords ("open source", "Show HN")
      // straddle the inner space without trouble.
      const re = new RegExp(`\\b${escapeRegExp(w)}(?:s|es|ed|ing)?\\b`, "i");
      if (re.test(haystack)) return industry;
    }
  }
  return "b2b";
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage classification
// ─────────────────────────────────────────────────────────────────────────────

const DOLLAR_RE = /\$(\d+(?:\.\d+)?)\s*([KMB])/i;

export function classifyStage(raw: RawSignal): Stage {
  const t = raw.title;
  if (/bootstrap|profitable|no\s*VC/i.test(t)) return "bootstrappers";
  if (/unicorn|\bIPO\b|NYSE|NASDAQ/i.test(t)) return "empires";
  const m = DOLLAR_RE.exec(t);
  if (m) {
    const amount = Number(m[1]);
    const unit = (m[2] ?? "M").toUpperCase();
    if (unit === "B") return "empires";
    // Spec says `> 500`; using >= 500 to match the seed convention
    // (Zepto's $500M Series F is stage="empires"). Documented
    // divergence from the literal brief.
    if (unit === "M") return amount >= 500 ? "empires" : "builders";
    // K — too small to anchor anywhere; default to builders.
    return "builders";
  }
  return "builders";
}

// ─────────────────────────────────────────────────────────────────────────────
// Mood classification — order matters (specific overrides before fallback)
// ─────────────────────────────────────────────────────────────────────────────

const INDIA_RE =
  /\b(India|Bangalore|Mumbai|Chennai|Hyderabad|Pune)\b/i;
const ROCKET_RE = /\b(overnight|viral|1M|million)\b/i;

export function classifyMood(
  raw: RawSignal,
  type: StoryType,
  industry: Industry,
  _stage: Stage,
): Mood {
  // India override — applies regardless of type, per spec.
  if (INDIA_RE.test(raw.title) || industry === "india-shipping") {
    return "india-shipping";
  }
  if (type === "funding") {
    const amount = parseFundingAmount(raw.title);
    if (amount !== null && amount >= 100_000_000) return "big-money-moves";
    return "underdog-wins";
  }
  if (type === "layoff") return "quiet-builders";
  if (type === "os") {
    const stars = githubStarsFromRaw(raw);
    return stars >= 2000 ? "blowing-up" : "copy-able-ideas";
  }
  if (type === "ipo") return "big-money-moves";
  if (type === "milestone") return "bootstrapped-millions";
  if (type === "ma") return "big-money-moves";
  if (type === "founder") return "founders-like-me";
  if (type === "launch" && ROCKET_RE.test(raw.title)) return "overnight-rockets";
  return "blowing-up";
}

// ─────────────────────────────────────────────────────────────────────────────
// City best-match — substring scan against CITIES.name
// ─────────────────────────────────────────────────────────────────────────────

interface CityHit {
  citySlug: string;
  lat: number;
  lng: number;
  country: string;
}

export function bestCityMatch(raw: RawSignal): CityHit | null {
  const haystack = `${raw.title} ${raw.description ?? ""}`;
  for (const [slug, city] of Object.entries(CITIES)) {
    // Word-boundary match so "Berlin" doesn't match "Berliner"; case-insensitive.
    const re = new RegExp(`\\b${escapeRegExp(city.name)}\\b`, "i");
    if (re.test(haystack)) {
      return { citySlug: slug, lat: city.lat, lng: city.lng, country: city.country };
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Headline number per type
// ─────────────────────────────────────────────────────────────────────────────

function headlineFor(
  type: StoryType,
  raw: RawSignal,
  details: TypeDetails[StoryType],
): HeadlineNumber | null {
  // Build a partial Story shape just well-formed enough for deriveHeadline.
  // deriveHeadline only inspects `type` and `details`.
  const stub = { type, details } as unknown as AnyStory;
  return deriveHeadline(stub);
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-type details builder
// ─────────────────────────────────────────────────────────────────────────────

function buildDetails<T extends StoryType>(
  type: T,
  raw: RawSignal,
): TypeDetails[T] {
  switch (type) {
    case "funding": {
      const amount = parseFundingAmount(raw.title) ?? 0;
      const round = parseRoundLabel(raw.title) ?? "";
      return {
        amountUsd: amount,
        round,
        investors: [],
      } as unknown as TypeDetails[T];
    }
    case "launch": {
      return {
        productName: extractProductName(raw.title),
        productUrl: raw.url,
        launchPlatform:
          raw.source === "producthunt" ? "producthunt" : "direct",
      } as unknown as TypeDetails[T];
    }
    case "ai": {
      // Best-effort — adapters rarely surface benchmark numbers from
      // the headline. Leave fields undefined; deriveHeadline returns
      // null and the renderer falls back to founder face / placeholder.
      return {} as unknown as TypeDetails[T];
    }
    case "ma": {
      const acquirer = extractMaSubject(raw.title, "acquirer");
      const acquired = extractMaSubject(raw.title, "acquired");
      const dealType: "acquisition" | "merger" | "acquihire" =
        /acqui-?hire/i.test(raw.title)
          ? "acquihire"
          : /\bmerger\b|\bmerges\b/i.test(raw.title)
            ? "merger"
            : "acquisition";
      const amount = parseFundingAmount(raw.title);
      return {
        acquirer,
        acquired,
        dealType,
        ...(amount !== null ? { amountUsd: amount } : {}),
      } as unknown as TypeDetails[T];
    }
    case "ipo": {
      const exchange =
        /NYSE/i.test(raw.title)
          ? "NYSE"
          : /NASDAQ/i.test(raw.title)
            ? "NASDAQ"
            : /NSE/i.test(raw.title)
              ? "NSE"
              : /BSE/i.test(raw.title)
                ? "BSE"
                : /HKEX/i.test(raw.title)
                  ? "HKEX"
                  : "LSE";
      const amount = parseFundingAmount(raw.title) ?? 0;
      return {
        ticker: extractTicker(raw.title),
        exchange,
        marketCapUsd: amount,
      } as unknown as TypeDetails[T];
    }
    case "milestone": {
      const metricMatch = /\$[\d.]+\s*[MB]\s+(\w+)/i.exec(raw.title);
      const metric = metricMatch?.[1] ?? "milestone";
      return { metric } as unknown as TypeDetails[T];
    }
    case "founder": {
      return {
        founderName: extractProductName(raw.title),
      } as unknown as TypeDetails[T];
    }
    case "os": {
      const stars = githubStarsFromRaw(raw);
      return {
        repoUrl: raw.url,
        stars,
      } as unknown as TypeDetails[T];
    }
    case "layoff": {
      return {
        headcountAffected: parseHeadcount(raw.title) ?? 0,
      } as unknown as TypeDetails[T];
    }
    case "shutdown": {
      return {} as unknown as TypeDetails[T];
    }
    case "regulatory": {
      return {
        jurisdiction: "Unknown",
      } as unknown as TypeDetails[T];
    }
    default: {
      // Exhaustiveness sentinel.
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Microbullets + whyNow
// ─────────────────────────────────────────────────────────────────────────────

function makeMicroBullets(description: string | undefined): string[] {
  if (!description) return ["Read more →"];
  // Crude sentence split on period+space; trim, cap at 80 chars.
  const sentences = description
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 3)
    .map((s) => (s.length > 80 ? `${s.slice(0, 77)}…` : s));
  while (sentences.length < 3) sentences.push("Read more →");
  return sentences;
}

function makeWhyNow(description: string | undefined): string {
  if (!description) return "Read the full story for context.";
  const trimmed = description.trim();
  if (trimmed.length === 0) return "Read the full story for context.";
  if (trimmed.length <= 120) return trimmed;
  return `${trimmed.slice(0, 117)}…`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const FUNDING_AMOUNT_RE = /\$(\d+(?:\.\d+)?)\s*([KMB])/i;

export function parseFundingAmount(title: string): number | null {
  const m = FUNDING_AMOUNT_RE.exec(title);
  if (!m) return null;
  const n = Number(m[1]);
  if (Number.isNaN(n)) return null;
  const unit = (m[2] ?? "").toUpperCase();
  if (unit === "B") return n * 1_000_000_000;
  if (unit === "M") return n * 1_000_000;
  return n * 1_000;
}

function parseRoundLabel(title: string): string | null {
  const m = /(Series\s+[A-Z]|Seed|Pre-seed|Pre-Seed)/i.exec(title);
  return m?.[1] ?? null;
}

function parseHeadcount(title: string): number | null {
  const m = /(\d+(?:,\d+)*)\s+(?:people|employees|jobs|workers)/i.exec(title);
  if (!m) return null;
  const n = Number(m[1]?.replace(/,/g, "") ?? "");
  return Number.isNaN(n) ? null : n;
}

function extractProductName(title: string): string {
  // First 4 words of the title — good enough for "X.ai launches Y" → "X.ai launches Y".
  return title.split(/\s+/).slice(0, 4).join(" ");
}

function extractMaSubject(
  title: string,
  side: "acquirer" | "acquired",
): string {
  // "Cisco acquires Splunk" — split on the verb.
  const m = /(.+?)\s+acqui[rs]\w*\s+(.+)/i.exec(title);
  if (!m) return side === "acquirer" ? "Unknown" : title;
  return side === "acquirer" ? (m[1] ?? "Unknown") : (m[2] ?? "Unknown");
}

function extractTicker(title: string): string {
  const m = /\b([A-Z]{2,5})\b/.exec(title);
  return m?.[1] ?? "TICK";
}

function githubStarsFromRaw(raw: RawSignal): number {
  const data = raw.rawData;
  if (typeof data === "object" && data !== null && "stargazers_count" in data) {
    const n = (data as { stargazers_count?: unknown }).stargazers_count;
    if (typeof n === "number") return n;
  }
  return 0;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const __normalizeTesting = {
  TYPE_RULES,
  INDUSTRY_KEYWORDS,
  parseFundingAmount,
  parseHeadcount,
};
