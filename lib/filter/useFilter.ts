"use client";

/**
 * useFilter — universal filter store for the v3 Editorial Console.
 *
 * Three composable scopes (Mood · Industry · Stage). Multi-select within a
 * category (OR), AND across categories. Single source of truth for the
 * cascading effects in feed.md §7f: globe pin opacity, LiveSignals item
 * filter, City Panel story filter, Top 3 reshuffle, Build Angles
 * regenerate, Trending Heuristics highlight.
 *
 * Persisted to localStorage under `catalst-filter`. SSR-safe via Zustand's
 * persist middleware (initial render returns the defined initial state;
 * client rehydrates on first effect tick — chip text may briefly flash
 * "All — 0 filters" before the persisted scope shows, which is acceptable).
 *
 * Exposed API uses ReadonlySet<T> per the spec contract in feed.md §7f.
 * Internal storage is plain arrays (Set isn't JSON-serializable; arrays
 * survive the persist middleware cleanly).
 */

import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MOOD_META } from "@/lib/moods";
import type { Industry, Mood, Stage } from "@/lib/types/story";

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export interface FilterScope {
  readonly moods: ReadonlySet<Mood>;
  readonly industries: ReadonlySet<Industry>;
  readonly stages: ReadonlySet<Stage>;
}

export interface UseFilterReturn {
  scope: FilterScope;
  toggleMood: (m: Mood) => void;
  toggleIndustry: (i: Industry) => void;
  toggleStage: (s: Stage) => void;
  clear: () => void;
  /** True when at least one scope has any active value. */
  isActive: boolean;
  /** Pretty short summary for chip text. See deriveChipLabel below. */
  chipLabel: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal store
// ─────────────────────────────────────────────────────────────────────────────

interface FilterState {
  moods: Mood[];
  industries: Industry[];
  stages: Stage[];
  toggleMood: (m: Mood) => void;
  toggleIndustry: (i: Industry) => void;
  toggleStage: (s: Stage) => void;
  clear: () => void;
}

const STORAGE_KEY = "catalst-filter";

function toggleIn<T>(arr: readonly T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

/**
 * Browser-only localStorage wrapper that returns `null` on SSR + on any read
 * error. Without this guard, Zustand's persist middleware throws during
 * static export because `localStorage` is undefined at build time.
 */
const safeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(name, value);
    } catch {
      /* quota / private mode — silently no-op */
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* no-op */
    }
  },
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      moods: [],
      industries: [],
      stages: [],
      toggleMood: (m) =>
        set((s) => ({ moods: toggleIn(s.moods, m) as Mood[] })),
      toggleIndustry: (i) =>
        set((s) => ({ industries: toggleIn(s.industries, i) as Industry[] })),
      toggleStage: (st) =>
        set((s) => ({ stages: toggleIn(s.stages, st) as Stage[] })),
      clear: () => set({ moods: [], industries: [], stages: [] }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        moods: s.moods,
        industries: s.industries,
        stages: s.stages,
      }),
      // Defensive: if the persisted JSON is corrupted (wrong shape, bad
      // values), fall back to the empty scope rather than crashing on
      // hydration. The persist middleware swallows JSON.parse errors;
      // this guard handles the case where the JSON is valid but the
      // shape is wrong (e.g., someone set localStorage manually).
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<FilterState>;
        const VALID_MOODS = new Set(Object.keys(MOOD_META) as Mood[]);
        const VALID_INDUSTRIES: ReadonlySet<Industry> = new Set([
          "ai", "fintech", "climate", "biotech", "defense", "consumer",
          "b2b", "devtools", "space", "creator", "commerce", "india-shipping",
        ]);
        const VALID_STAGES: ReadonlySet<Stage> = new Set([
          "empires", "builders", "bootstrappers",
        ]);
        return {
          ...current,
          moods: Array.isArray(p.moods)
            ? p.moods.filter((m): m is Mood => VALID_MOODS.has(m as Mood))
            : [],
          industries: Array.isArray(p.industries)
            ? p.industries.filter(
                (i): i is Industry => VALID_INDUSTRIES.has(i as Industry),
              )
            : [],
          stages: Array.isArray(p.stages)
            ? p.stages.filter((s): s is Stage => VALID_STAGES.has(s as Stage))
            : [],
        };
      },
    },
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// Public hook + label derivation
// ─────────────────────────────────────────────────────────────────────────────

const INDUSTRY_LABELS: Record<Industry, string> = {
  ai: "AI",
  fintech: "Fintech",
  climate: "Climate",
  biotech: "Biotech",
  defense: "Defense",
  consumer: "Consumer",
  b2b: "B2B",
  devtools: "Devtools",
  space: "Space",
  creator: "Creator",
  commerce: "Commerce",
  "india-shipping": "India",
};

const STAGE_LABELS: Record<Stage, string> = {
  empires: "Empires",
  builders: "Builders",
  bootstrappers: "Bootstrappers",
};

export function deriveChipLabel(state: {
  moods: readonly Mood[];
  industries: readonly Industry[];
  stages: readonly Stage[];
}): string {
  const labels: string[] = [
    ...state.moods.map((m) => MOOD_META[m].label),
    ...state.industries.map((i) => INDUSTRY_LABELS[i]),
    ...state.stages.map((s) => STAGE_LABELS[s]),
  ];
  if (labels.length === 0) return "All — 0 filters";
  if (labels.length === 1) return labels[0]!;
  if (labels.length === 2) return `${labels[0]} · ${labels[1]}`;
  return `${labels[0]} · ${labels[1]} · +${labels.length - 2}`;
}

export function useFilter(): UseFilterReturn {
  const moods = useFilterStore((s) => s.moods);
  const industries = useFilterStore((s) => s.industries);
  const stages = useFilterStore((s) => s.stages);
  const toggleMood = useFilterStore((s) => s.toggleMood);
  const toggleIndustry = useFilterStore((s) => s.toggleIndustry);
  const toggleStage = useFilterStore((s) => s.toggleStage);
  const clear = useFilterStore((s) => s.clear);

  // Memoize the Set-based scope object so consumers using === / Object.is
  // comparisons (e.g., useEffect deps) don't see a fresh object every render.
  const scope = useMemo<FilterScope>(
    () => ({
      moods: new Set(moods),
      industries: new Set(industries),
      stages: new Set(stages),
    }),
    [moods, industries, stages],
  );

  const isActive = moods.length + industries.length + stages.length > 0;
  const chipLabel = useMemo(
    () => deriveChipLabel({ moods, industries, stages }),
    [moods, industries, stages],
  );

  return {
    scope,
    toggleMood,
    toggleIndustry,
    toggleStage,
    clear,
    isActive,
    chipLabel,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test-only — reset store between tests + read raw state
// ─────────────────────────────────────────────────────────────────────────────

export const __filterTesting = {
  reset: () => useFilterStore.getState().clear(),
  getRaw: () => {
    const s = useFilterStore.getState();
    return {
      moods: [...s.moods],
      industries: [...s.industries],
      stages: [...s.stages],
    };
  },
  STORAGE_KEY,
  INDUSTRY_LABELS,
  STAGE_LABELS,
};
