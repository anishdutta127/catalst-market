/**
 * JSON-file store for live ingest output.
 *
 * Phase 7c is intentionally DB-less: live stories live in a single
 * append-merged JSON file at content/stories.live.json. The home page
 * server component reads this file on every render (no ISR — see
 * app/page.tsx) and falls back to the hand-curated seed when the file
 * is empty or missing.
 *
 * Atomicity: writes go to a sibling .tmp file then rename-into-place
 * so a crash mid-serialize never leaves the live file half-written.
 *
 * Caps: 200 most-recent stories. Older entries get trimmed when a write
 * pushes the total over the cap. The cap is a UX choice (the home
 * page only renders the first ~30 stories anyway) plus a safety limit
 * — without it, a runaway adapter could grow the JSON unbounded.
 */

import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import { validateStory } from "@/lib/seed-validate";
import type { AnyStory } from "@/lib/types/story";

/** Path is relative to process.cwd() so the same code works in dev,
 *  build, and the API route's serverless function context. */
export const LIVE_STORIES_PATH = "content/stories.live.json";

export const LIVE_STORIES_MAX = 200;

function fullPath(): string {
  return join(process.cwd(), LIVE_STORIES_PATH);
}

/**
 * Read the live JSON. Returns [] for any failure mode (missing file,
 * malformed JSON, validation error on individual rows). NEVER throws —
 * the home page calls this on every render and a thrown error here
 * would break the page.
 *
 * Per-row validation: rows that fail seed-validate's check are dropped
 * with a console.warn. The well-formed remainder is returned.
 */
export function readLiveStories(): AnyStory[] {
  const path = fullPath();
  if (!existsSync(path)) return [];
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (e) {
    console.warn(`[store] readLiveStories: failed to read ${path}:`, e);
    return [];
  }
  if (raw.trim().length === 0) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.warn(`[store] readLiveStories: invalid JSON in ${path}:`, e);
    return [];
  }
  if (!Array.isArray(parsed)) {
    console.warn(`[store] readLiveStories: expected array, got`, typeof parsed);
    return [];
  }
  const valid: AnyStory[] = [];
  for (const row of parsed) {
    try {
      valid.push(validateStory(row));
    } catch (e) {
      console.warn(`[store] readLiveStories: dropping invalid row:`, e);
    }
  }
  return valid;
}

/**
 * Merge `incoming` with whatever is already on disk. Dedup by id (new
 * wins on conflict), sort by publishedAt desc (createdAt fallback),
 * truncate to LIVE_STORIES_MAX, atomic-write the result.
 *
 * Pure side effect — no return value. Callers that want the resulting
 * length should call readLiveStories() afterward.
 */
export function writeLiveStories(incoming: readonly AnyStory[]): void {
  const existing = readLiveStories();
  // New-wins-on-id-conflict: merge incoming AFTER existing in the seen
  // map so the latter overwrites.
  const merged = new Map<string, AnyStory>();
  for (const s of existing) merged.set(s.id, s);
  for (const s of incoming) merged.set(s.id, s);
  const ordered = [...merged.values()].sort(
    (a, b) => sortableTime(b) - sortableTime(a),
  );
  const trimmed = ordered.slice(0, LIVE_STORIES_MAX);

  const path = fullPath();
  ensureDir(path);
  // Atomic write: serialize to .tmp, then rename. Avoids a partial-file
  // window if the process is killed mid-stringify.
  const tmpPath = `${path}.tmp.${process.pid}.${Date.now()}`;
  const json = JSON.stringify(trimmed, null, 2);
  writeFileSync(tmpPath, json, "utf8");
  try {
    renameSync(tmpPath, path);
  } catch (e) {
    // Best-effort cleanup of the tmp file on rename failure.
    try {
      unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
    throw e;
  }
}

/**
 * Truncate the live store. Dev/test only — production never calls
 * this (live data only grows or trims-by-cap).
 */
export function clearLiveStories(): void {
  const path = fullPath();
  ensureDir(path);
  writeFileSync(path, "[]", "utf8");
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sortable timestamp for ordering. publishedAt is preferred (set by
 * adapters from the source's own timestamp); we fall back to createdAt
 * which the seed always carries. NaN dates sort to the back.
 */
function sortableTime(s: AnyStory): number {
  const candidates = [s.publishedAt, s.createdAt].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  for (const c of candidates) {
    const t = Date.parse(c);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

function ensureDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
