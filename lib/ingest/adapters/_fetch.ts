/**
 * Shared fetch helper for ingest adapters.
 *
 * Every adapter MUST go through this so:
 *   - the 10 s timeout is uniform (an unresponsive source can't stall
 *     the whole pipeline)
 *   - the descriptive User-Agent is sent on every request (some
 *     APIs — e.g. GitHub — refuse anonymous requests without one)
 *   - failures collapse to a structured warn-and-return rather than a
 *     thrown exception (adapters MUST never throw — see I2 contract)
 *
 * Returns `{ ok: true, response }` on success or `{ ok: false, error }`
 * on any failure mode (network error, timeout, non-2xx status).
 */

const USER_AGENT = "CatalstMarket/1.0 (+https://catalst.app)";
const DEFAULT_TIMEOUT_MS = 10_000;

export interface FetchOk {
  ok: true;
  response: Response;
}

export interface FetchErr {
  ok: false;
  error: string;
}

export type FetchResult = FetchOk | FetchErr;

export async function safeFetch(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP ${response.status} ${response.statusText} for ${url}`,
      };
    }
    return { ok: true, response };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `fetch failed for ${url}: ${msg}` };
  } finally {
    clearTimeout(timer);
  }
}

export const __fetchTesting = { USER_AGENT, DEFAULT_TIMEOUT_MS };
