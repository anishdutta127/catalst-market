import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  __filterTesting,
  deriveChipLabel,
  useFilterStore,
} from "../useFilter";
import type { Industry, Mood, Stage } from "@/lib/types/story";

beforeEach(() => {
  // Reset both the store + localStorage between tests so each test sees
  // an empty scope.
  useFilterStore.getState().clear();
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(__filterTesting.STORAGE_KEY);
  }
});

afterEach(() => {
  useFilterStore.getState().clear();
});

// ─────────────────────────────────────────────────────────────────────────────
// Toggle behavior
// ─────────────────────────────────────────────────────────────────────────────

describe("useFilterStore — toggle behavior", () => {
  test("toggleMood adds the mood when not present", () => {
    useFilterStore.getState().toggleMood("blowing-up");
    expect(useFilterStore.getState().moods).toEqual(["blowing-up"]);
  });

  test("toggleMood removes the mood when already present (symmetric toggle)", () => {
    useFilterStore.getState().toggleMood("blowing-up");
    useFilterStore.getState().toggleMood("blowing-up");
    expect(useFilterStore.getState().moods).toEqual([]);
  });

  test("toggleMood composes — multiple moods accumulate", () => {
    useFilterStore.getState().toggleMood("blowing-up");
    useFilterStore.getState().toggleMood("underdog-wins");
    useFilterStore.getState().toggleMood("india-shipping");
    expect(useFilterStore.getState().moods.length).toBe(3);
  });

  test("toggleIndustry / toggleStage behave the same way", () => {
    useFilterStore.getState().toggleIndustry("ai");
    useFilterStore.getState().toggleStage("builders");
    expect(useFilterStore.getState().industries).toEqual(["ai"]);
    expect(useFilterStore.getState().stages).toEqual(["builders"]);
    useFilterStore.getState().toggleIndustry("ai");
    useFilterStore.getState().toggleStage("builders");
    expect(useFilterStore.getState().industries).toEqual([]);
    expect(useFilterStore.getState().stages).toEqual([]);
  });

  test("clear empties all three categories at once", () => {
    useFilterStore.getState().toggleMood("blowing-up");
    useFilterStore.getState().toggleIndustry("ai");
    useFilterStore.getState().toggleStage("builders");
    useFilterStore.getState().clear();
    const s = useFilterStore.getState();
    expect(s.moods).toEqual([]);
    expect(s.industries).toEqual([]);
    expect(s.stages).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// chipLabel derivation
// ─────────────────────────────────────────────────────────────────────────────

describe("deriveChipLabel — formatting", () => {
  test("zero scopes → 'All — 0 filters'", () => {
    expect(
      deriveChipLabel({ moods: [], industries: [], stages: [] }),
    ).toBe("All — 0 filters");
  });

  test("one mood → just the label", () => {
    expect(
      deriveChipLabel({ moods: ["blowing-up"], industries: [], stages: [] }),
    ).toBe("Blowing up");
  });

  test("one industry → just the label", () => {
    expect(
      deriveChipLabel({ moods: [], industries: ["ai"], stages: [] }),
    ).toBe("AI");
  });

  test("one stage → just the label (capitalized)", () => {
    expect(
      deriveChipLabel({ moods: [], industries: [], stages: ["builders"] }),
    ).toBe("Builders");
  });

  test("two scopes → joined by ' · '", () => {
    expect(
      deriveChipLabel({
        moods: [],
        industries: ["ai"],
        stages: ["builders"],
      }),
    ).toBe("AI · Builders");
  });

  test("three+ scopes → first two + '+N' overflow indicator", () => {
    expect(
      deriveChipLabel({
        moods: ["blowing-up"],
        industries: ["ai"],
        stages: ["builders"],
      }),
    ).toBe("Blowing up · AI · +1");
    expect(
      deriveChipLabel({
        moods: ["blowing-up", "underdog-wins"],
        industries: ["ai", "fintech"],
        stages: ["builders"],
      }),
    ).toBe("Blowing up · Underdog wins · +3");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isActive
// ─────────────────────────────────────────────────────────────────────────────

describe("isActive flag (derived from store state)", () => {
  function isActiveFromState(): boolean {
    const s = useFilterStore.getState();
    return s.moods.length + s.industries.length + s.stages.length > 0;
  }

  test("empty scopes → false", () => {
    expect(isActiveFromState()).toBe(false);
  });

  test("any single scope → true", () => {
    useFilterStore.getState().toggleMood("blowing-up");
    expect(isActiveFromState()).toBe(true);
    useFilterStore.getState().clear();

    useFilterStore.getState().toggleIndustry("ai");
    expect(isActiveFromState()).toBe(true);
    useFilterStore.getState().clear();

    useFilterStore.getState().toggleStage("builders");
    expect(isActiveFromState()).toBe(true);
  });

  test("clear flips to false", () => {
    useFilterStore.getState().toggleMood("blowing-up");
    expect(isActiveFromState()).toBe(true);
    useFilterStore.getState().clear();
    expect(isActiveFromState()).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// localStorage persistence
// ─────────────────────────────────────────────────────────────────────────────

describe("useFilterStore — persist middleware", () => {
  test("scope writes to localStorage", () => {
    useFilterStore.getState().toggleMood("blowing-up");
    useFilterStore.getState().toggleIndustry("ai");
    const raw = window.localStorage.getItem(__filterTesting.STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    // Zustand persist wraps state under .state
    expect(parsed.state.moods).toContain("blowing-up");
    expect(parsed.state.industries).toContain("ai");
  });

  test("corrupted JSON in localStorage falls back to empty scope", () => {
    // Write malformed JSON before reading — the merge fn should reject and
    // fall back to []s. We verify the ratified merge() behavior by
    // round-tripping a structurally invalid payload.
    window.localStorage.setItem(
      __filterTesting.STORAGE_KEY,
      JSON.stringify({
        state: {
          moods: "not-an-array",
          industries: [42, "imagine"],
          stages: null,
        },
        version: 0,
      }),
    );
    // Trigger rehydration by calling persist's API
    useFilterStore.persist.rehydrate();
    const s = useFilterStore.getState();
    expect(s.moods).toEqual([]);
    expect(s.industries).toEqual([]); // 42 rejected, "imagine" rejected
    expect(s.stages).toEqual([]);
  });

  test("invalid scope values inside an otherwise valid array are filtered out", () => {
    window.localStorage.setItem(
      __filterTesting.STORAGE_KEY,
      JSON.stringify({
        state: {
          moods: ["blowing-up", "fake-mood", "underdog-wins"] as Mood[],
          industries: ["ai", "fake-industry"] as Industry[],
          stages: ["builders", "fake-stage"] as Stage[],
        },
        version: 0,
      }),
    );
    useFilterStore.persist.rehydrate();
    const s = useFilterStore.getState();
    expect(s.moods).toEqual(["blowing-up", "underdog-wins"]);
    expect(s.industries).toEqual(["ai"]);
    expect(s.stages).toEqual(["builders"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// __filterTesting helpers
// ─────────────────────────────────────────────────────────────────────────────

describe("__filterTesting export — testing surface", () => {
  test("reset clears the store", () => {
    useFilterStore.getState().toggleMood("blowing-up");
    __filterTesting.reset();
    expect(useFilterStore.getState().moods).toEqual([]);
  });

  test("getRaw returns plain arrays (not the store's mutable references)", () => {
    useFilterStore.getState().toggleMood("blowing-up");
    const raw = __filterTesting.getRaw();
    expect(raw.moods).toEqual(["blowing-up"]);
    // Mutate the returned array — store should be unaffected
    raw.moods.push("underdog-wins" as Mood);
    expect(useFilterStore.getState().moods).toEqual(["blowing-up"]);
  });
});
