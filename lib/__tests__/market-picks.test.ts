import { describe, expect, test } from "bun:test";
import rawPicks from "@/content/market-picks.weekly.json";
import {
  __marketPicksTesting,
  getWeeklyMarketPicks,
  validateMarketPicks,
} from "../market-picks";

describe("market-picks", () => {
  test("production weekly picks validate cleanly", () => {
    const picks = validateMarketPicks(rawPicks);
    expect(picks.map((pick) => pick.category)).toEqual([
      "established",
      "startup",
      "frontier",
    ]);
  });

  test("export returns exactly one pick per required category", () => {
    const picks = getWeeklyMarketPicks();
    expect(picks).toHaveLength(3);
    expect(picks.map((pick) => pick.category)).toEqual(
      [...__marketPicksTesting.REQUIRED_CATEGORIES],
    );
  });

  test("unknown storyId fails build-safe validation", () => {
    expect(() =>
      validateMarketPicks([
        { ...rawPicks[0], storyId: "missing-story" },
        rawPicks[1],
        rawPicks[2],
      ]),
    ).toThrow(/unknown storyId/);
  });
});
