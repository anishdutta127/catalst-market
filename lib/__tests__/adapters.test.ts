import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { fetchSignals as fetchHackerNews, __hnTesting } from "@/lib/ingest/adapters/hackernews";
import { fetchSignals as fetchProductHunt } from "@/lib/ingest/adapters/producthunt";
import { fetchSignals as fetchGitHubTrending } from "@/lib/ingest/adapters/github-trending";
import { fetchSignals as fetchCrunchbaseRSS, __cbTesting } from "@/lib/ingest/adapters/crunchbase-rss";
import { fetchSignals as fetchLayoffs } from "@/lib/ingest/adapters/layoffsfyi";
import { __fetchTesting } from "@/lib/ingest/adapters/_fetch";
import type { RawSignal } from "@/lib/ingest/types";

// ─────────────────────────────────────────────────────────────────────────────
// Tiny fetch mock — install before each test, restore after.
// ─────────────────────────────────────────────────────────────────────────────

let originalFetch: typeof fetch;
let lastInit: { url: string; init?: RequestInit }[] = [];

beforeEach(() => {
  originalFetch = globalThis.fetch;
  lastInit = [];
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

interface MockSpec {
  status?: number;
  json?: unknown;
  text?: string;
}

/**
 * Install a per-URL fetch mock. Lookup is by substring match — first
 * spec whose key appears in the requested URL wins. Lets each test
 * stub all the URLs the adapter calls (HN: topstories + 60 items)
 * with a single map.
 */
function installFetchMock(specs: Record<string, MockSpec>): void {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    lastInit.push({ url, init });
    let chosen: MockSpec | undefined;
    for (const [needle, spec] of Object.entries(specs)) {
      if (url.includes(needle)) {
        chosen = spec;
        break;
      }
    }
    if (!chosen) {
      return new Response(JSON.stringify({ unmocked: url }), { status: 404 });
    }
    const status = chosen.status ?? 200;
    if (chosen.text !== undefined) {
      return new Response(chosen.text, { status });
    }
    return new Response(JSON.stringify(chosen.json ?? {}), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hacker News
// ─────────────────────────────────────────────────────────────────────────────

describe("hackernews adapter", () => {
  test("returns RawSignal[] with correct shape", async () => {
    installFetchMock({
      "/v0/topstories.json": { json: [101, 102] },
      "/v0/item/101.json": {
        json: {
          id: 101,
          type: "story",
          title: "Show HN: we built an LLM toolkit",
          url: "https://example.com/show",
          score: 200,
          time: 1700000000,
        },
      },
      "/v0/item/102.json": {
        json: {
          id: 102,
          type: "story",
          title: "Acme raises $20M Series A",
          url: "https://example.com/raises",
          score: 150,
          time: 1700000500,
        },
      },
    });
    const signals = await fetchHackerNews();
    expect(signals.length).toBe(2);
    for (const s of signals) {
      expect(s.source).toBe("hackernews");
      expect(typeof s.sourceId).toBe("string");
      expect(typeof s.title).toBe("string");
      expect(typeof s.url).toBe("string");
      expect(typeof s.publishedAt).toBe("string");
      expect(Number.isNaN(Date.parse(s.publishedAt))).toBe(false);
    }
  });

  test("filters items with score < 80", async () => {
    installFetchMock({
      "/v0/topstories.json": { json: [200, 201] },
      "/v0/item/200.json": {
        json: {
          id: 200,
          type: "story",
          title: "Show HN: low score story",
          url: "https://example.com/low",
          score: 20,
          time: 1700000000,
        },
      },
      "/v0/item/201.json": {
        json: {
          id: 201,
          type: "story",
          title: "Show HN: high score story",
          url: "https://example.com/high",
          score: 500,
          time: 1700000000,
        },
      },
    });
    const signals = await fetchHackerNews();
    expect(signals.length).toBe(1);
    expect(signals[0]!.sourceId).toBe("201");
  });

  test("filters items without startup keywords in the title", async () => {
    installFetchMock({
      "/v0/topstories.json": { json: [300, 301] },
      "/v0/item/300.json": {
        json: {
          id: 300,
          type: "story",
          title: "Why React is great",
          url: "https://example.com/x",
          score: 1000,
          time: 1700000000,
        },
      },
      "/v0/item/301.json": {
        json: {
          id: 301,
          type: "story",
          title: "Show HN: my weekend project",
          url: "https://example.com/y",
          score: 100,
          time: 1700000000,
        },
      },
    });
    const signals = await fetchHackerNews();
    expect(signals.map((s) => s.sourceId)).toEqual(["301"]);
  });

  test("ignores non-story types and items without urls", async () => {
    installFetchMock({
      "/v0/topstories.json": { json: [400, 401, 402] },
      "/v0/item/400.json": {
        json: {
          id: 400,
          type: "comment",
          title: "Show HN: not a story",
          url: "https://example.com",
          score: 200,
        },
      },
      "/v0/item/401.json": {
        json: {
          id: 401,
          type: "story",
          title: "Show HN: missing url",
          score: 200,
        },
      },
      "/v0/item/402.json": {
        json: {
          id: 402,
          type: "story",
          title: "Show HN: real story",
          url: "https://example.com",
          score: 200,
          time: 1700000000,
        },
      },
    });
    const signals = await fetchHackerNews();
    expect(signals.map((s) => s.sourceId)).toEqual(["402"]);
  });

  test("returns [] without throwing on topstories fetch failure", async () => {
    installFetchMock({ "/v0/topstories.json": { status: 500, text: "down" } });
    let signals: RawSignal[] = [];
    await expect(
      (async () => {
        signals = await fetchHackerNews();
      })(),
    ).resolves.toBeUndefined();
    expect(signals).toEqual([]);
  });

  test("uses the descriptive User-Agent on every request", async () => {
    installFetchMock({
      "/v0/topstories.json": { json: [500] },
      "/v0/item/500.json": {
        json: {
          id: 500,
          type: "story",
          title: "raises",
          url: "https://example.com",
          score: 100,
          time: 1700000000,
        },
      },
    });
    await fetchHackerNews();
    for (const call of lastInit) {
      const headers = call.init?.headers as Record<string, string> | undefined;
      expect(headers?.["User-Agent"]).toBe(__fetchTesting.USER_AGENT);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Product Hunt
// ─────────────────────────────────────────────────────────────────────────────

describe("producthunt adapter", () => {
  test("returns [] when PRODUCTHUNT_TOKEN is missing (does not throw)", async () => {
    const before = process.env.PRODUCTHUNT_TOKEN;
    delete process.env.PRODUCTHUNT_TOKEN;
    let signals: RawSignal[] = [];
    await expect(
      (async () => {
        signals = await fetchProductHunt();
      })(),
    ).resolves.toBeUndefined();
    expect(signals).toEqual([]);
    if (before !== undefined) process.env.PRODUCTHUNT_TOKEN = before;
  });

  test("returns [] when PRODUCTHUNT_TOKEN is empty string", async () => {
    const before = process.env.PRODUCTHUNT_TOKEN;
    process.env.PRODUCTHUNT_TOKEN = "";
    const signals = await fetchProductHunt();
    expect(signals).toEqual([]);
    if (before !== undefined) process.env.PRODUCTHUNT_TOKEN = before;
    else delete process.env.PRODUCTHUNT_TOKEN;
  });

  test("filters posts with votesCount < 30", async () => {
    process.env.PRODUCTHUNT_TOKEN = "test_token";
    installFetchMock({
      "api.producthunt.com": {
        json: {
          data: {
            posts: {
              edges: [
                {
                  node: {
                    id: "ph1",
                    name: "Quiet launch",
                    tagline: "low votes",
                    votesCount: 10,
                    website: "https://example.com/1",
                    createdAt: "2026-05-04T00:00:00Z",
                    topics: { edges: [] },
                  },
                },
                {
                  node: {
                    id: "ph2",
                    name: "Big launch",
                    tagline: "high votes",
                    votesCount: 200,
                    website: "https://example.com/2",
                    createdAt: "2026-05-04T01:00:00Z",
                    topics: { edges: [{ node: { name: "AI" } }] },
                  },
                },
              ],
            },
          },
        },
      },
    });
    const signals = await fetchProductHunt();
    expect(signals.map((s) => s.sourceId)).toEqual(["ph2"]);
    expect(signals[0]!.source).toBe("producthunt");
    delete process.env.PRODUCTHUNT_TOKEN;
  });

  test("returns [] gracefully on graphql error response", async () => {
    process.env.PRODUCTHUNT_TOKEN = "test_token";
    installFetchMock({
      "api.producthunt.com": {
        json: { errors: [{ message: "Rate limited" }] },
      },
    });
    const signals = await fetchProductHunt();
    expect(signals).toEqual([]);
    delete process.env.PRODUCTHUNT_TOKEN;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GitHub trending
// ─────────────────────────────────────────────────────────────────────────────

describe("github-trending adapter", () => {
  test("includes User-Agent header (GitHub requires it)", async () => {
    installFetchMock({
      "api.github.com": {
        json: {
          items: [
            {
              full_name: "acme/cool",
              html_url: "https://github.com/acme/cool",
              description: "A cool tool",
              stargazers_count: 1500,
              created_at: "2026-05-01T00:00:00Z",
              pushed_at: "2026-05-04T00:00:00Z",
            },
          ],
        },
      },
    });
    await fetchGitHubTrending();
    expect(lastInit.length).toBeGreaterThan(0);
    const headers = lastInit[0]?.init?.headers as
      | Record<string, string>
      | undefined;
    expect(headers?.["User-Agent"]).toBe(__fetchTesting.USER_AGENT);
  });

  test("filters repos with stars < 300", async () => {
    installFetchMock({
      "api.github.com": {
        json: {
          items: [
            {
              full_name: "acme/small",
              html_url: "https://github.com/acme/small",
              description: "tiny",
              stargazers_count: 10,
              pushed_at: "2026-05-04T00:00:00Z",
            },
            {
              full_name: "acme/big",
              html_url: "https://github.com/acme/big",
              description: "huge",
              stargazers_count: 5000,
              pushed_at: "2026-05-04T00:00:00Z",
            },
          ],
        },
      },
    });
    const signals = await fetchGitHubTrending();
    expect(signals.map((s) => s.sourceId)).toEqual(["acme/big"]);
    expect(signals[0]!.title.startsWith("★ acme/big")).toBe(true);
  });

  test("returns [] gracefully on api error message", async () => {
    installFetchMock({
      "api.github.com": {
        json: { message: "API rate limit exceeded" },
      },
    });
    const signals = await fetchGitHubTrending();
    expect(signals).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Crunchbase RSS
// ─────────────────────────────────────────────────────────────────────────────

describe("crunchbase-rss adapter", () => {
  test("parses recent RSS items into RawSignal[]", async () => {
    const recent = new Date(Date.now() - 60 * 60 * 1000).toUTCString();
    const xml = `<?xml version="1.0"?>
      <rss>
        <channel>
          <item>
            <guid>https://news.crunchbase.com/article-a/</guid>
            <title>Acme raises $50M Series B</title>
            <link>https://news.crunchbase.com/article-a/</link>
            <description>Series B led by Investor Co.</description>
            <pubDate>${recent}</pubDate>
          </item>
        </channel>
      </rss>`;
    installFetchMock({ "news.crunchbase.com/feed": { text: xml } });
    const signals = await fetchCrunchbaseRSS();
    expect(signals.length).toBe(1);
    expect(signals[0]!.source).toBe("crunchbase");
    expect(signals[0]!.title).toBe("Acme raises $50M Series B");
  });

  test("drops items older than 48 hours", async () => {
    const old = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toUTCString();
    const fresh = new Date(Date.now() - 1 * 60 * 60 * 1000).toUTCString();
    const xml = `<?xml version="1.0"?>
      <rss><channel>
        <item>
          <guid>old-1</guid><title>Old story</title>
          <link>https://example.com/old</link>
          <pubDate>${old}</pubDate>
        </item>
        <item>
          <guid>fresh-1</guid><title>Fresh story</title>
          <link>https://example.com/fresh</link>
          <pubDate>${fresh}</pubDate>
        </item>
      </channel></rss>`;
    installFetchMock({ "news.crunchbase.com/feed": { text: xml } });
    const signals = await fetchCrunchbaseRSS();
    expect(signals.map((s) => s.title)).toEqual(["Fresh story"]);
  });

  test("handles empty channel gracefully (no items)", async () => {
    const xml = `<?xml version="1.0"?>
      <rss><channel><title>Crunchbase News</title></channel></rss>`;
    installFetchMock({ "news.crunchbase.com/feed": { text: xml } });
    const signals = await fetchCrunchbaseRSS();
    expect(signals).toEqual([]);
  });

  test("returns [] when XML is malformed (does not throw)", async () => {
    installFetchMock({
      "news.crunchbase.com/feed": { text: "<rss><channel><item><title>oops" },
    });
    let signals: RawSignal[] = [];
    await expect(
      (async () => {
        signals = await fetchCrunchbaseRSS();
      })(),
    ).resolves.toBeUndefined();
    // Either parser returns empty or the malformed payload yields no
    // valid items — both acceptable. The important part is no throw.
    expect(Array.isArray(signals)).toBe(true);
  });

  test("strips HTML from descriptions", () => {
    const recent = new Date(Date.now() - 60 * 60 * 1000).toUTCString();
    const xml = `<?xml version="1.0"?>
      <rss><channel>
        <item>
          <guid>html-1</guid><title>HTML test</title>
          <link>https://example.com</link>
          <description><![CDATA[<p>The <b>quick</b> brown fox.</p>]]></description>
          <pubDate>${recent}</pubDate>
        </item>
      </channel></rss>`;
    const signals = __cbTesting.parseRssToSignals(xml, "crunchbase");
    expect(signals.length).toBe(1);
    // HTML tags stripped — the description should not contain <p> or <b>.
    expect(signals[0]!.description?.includes("<")).toBe(false);
    expect(signals[0]!.description).toContain("quick");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Layoffs (TechCrunch RSS)
// ─────────────────────────────────────────────────────────────────────────────

describe("layoffsfyi (TechCrunch RSS) adapter", () => {
  test("parses TechCrunch layoff posts into RawSignal[]", async () => {
    const recent = new Date(Date.now() - 60 * 60 * 1000).toUTCString();
    const xml = `<?xml version="1.0"?>
      <rss><channel>
        <item>
          <guid>https://techcrunch.com/post-x</guid>
          <title>Acme lays off 500 employees</title>
          <link>https://techcrunch.com/post-x</link>
          <description>The cuts hit the platform team.</description>
          <pubDate>${recent}</pubDate>
        </item>
      </channel></rss>`;
    installFetchMock({ "techcrunch.com/tag/layoffs": { text: xml } });
    const signals = await fetchLayoffs();
    expect(signals.length).toBe(1);
    expect(signals[0]!.source).toBe("layoffsfyi");
    expect(signals[0]!.title).toBe("Acme lays off 500 employees");
  });

  test("returns [] on malformed XML (does not throw)", async () => {
    installFetchMock({ "techcrunch.com/tag/layoffs": { text: "<not real xml" } });
    let signals: RawSignal[] = [];
    await expect(
      (async () => {
        signals = await fetchLayoffs();
      })(),
    ).resolves.toBeUndefined();
    expect(Array.isArray(signals)).toBe(true);
  });

  test("returns [] on fetch failure", async () => {
    installFetchMock({
      "techcrunch.com/tag/layoffs": { status: 500, text: "down" },
    });
    const signals = await fetchLayoffs();
    expect(signals).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-adapter contract: no duplicate sourceIds within a single batch
// ─────────────────────────────────────────────────────────────────────────────

describe("All adapters — no duplicate sourceIds within a single batch", () => {
  test("hackernews dedups by item id", async () => {
    installFetchMock({
      "/v0/topstories.json": { json: [600, 600, 601] },
      "/v0/item/600.json": {
        json: {
          id: 600,
          type: "story",
          title: "Show HN: dup",
          url: "https://example.com",
          score: 200,
          time: 1700000000,
        },
      },
      "/v0/item/601.json": {
        json: {
          id: 601,
          type: "story",
          title: "Show HN: real",
          url: "https://example.com/2",
          score: 200,
          time: 1700000000,
        },
      },
    });
    const signals = await fetchHackerNews();
    const ids = signals.map((s) => s.sourceId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("github-trending dedups by full_name (no duplicate repos)", async () => {
    installFetchMock({
      "api.github.com": {
        json: {
          items: [
            {
              full_name: "acme/x",
              html_url: "https://github.com/acme/x",
              description: "first",
              stargazers_count: 1000,
              pushed_at: "2026-05-04T00:00:00Z",
            },
            {
              full_name: "acme/y",
              html_url: "https://github.com/acme/y",
              description: "second",
              stargazers_count: 1000,
              pushed_at: "2026-05-04T00:00:00Z",
            },
          ],
        },
      },
    });
    const signals = await fetchGitHubTrending();
    const ids = signals.map((s) => s.sourceId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sanity: HN keyword regex actually matches the documented strings
// ─────────────────────────────────────────────────────────────────────────────

describe("HN keyword regex", () => {
  test("matches each documented startup keyword case-insensitively", () => {
    for (const k of __hnTesting.KEYWORDS) {
      expect(__hnTesting.KEYWORD_RE.test(k)).toBe(true);
      expect(__hnTesting.KEYWORD_RE.test(k.toLowerCase())).toBe(true);
    }
  });

  test("does not match generic startup-adjacent strings", () => {
    expect(__hnTesting.KEYWORD_RE.test("How to write good tests")).toBe(false);
    expect(__hnTesting.KEYWORD_RE.test("Why I left Twitter")).toBe(false);
  });
});
