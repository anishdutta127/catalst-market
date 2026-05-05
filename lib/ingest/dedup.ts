/**
 * Deduplicator — drops RawSignals that already exist in the live store
 * (matched by `${source}-${sourceId}`) AND drops duplicates within the
 * fresh batch (some adapters can emit the same item twice if the
 * source is unstable). Order-preserving — the first occurrence in the
 * fresh batch wins so adapter ordering is deterministic for tests.
 *
 * existingIds is a Set the orchestrator builds once before the dedup
 * pass — passing it in (rather than reading the store inside this
 * function) keeps the unit testable and the orchestrator's I/O
 * surface explicit.
 */

import type { RawSignal } from "@/lib/ingest/types";

export function deduplicateSignals(
  fresh: readonly RawSignal[],
  existingIds: ReadonlySet<string>,
): RawSignal[] {
  const seenInBatch = new Set<string>();
  const out: RawSignal[] = [];
  for (const sig of fresh) {
    const key = `${sig.source}-${sig.sourceId}`;
    if (existingIds.has(key)) continue;
    if (seenInBatch.has(key)) continue;
    seenInBatch.add(key);
    out.push(sig);
  }
  return out;
}

export const __dedupTesting = {
  keyOf: (sig: RawSignal) => `${sig.source}-${sig.sourceId}`,
};
