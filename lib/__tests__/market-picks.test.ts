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

  test("each pick includes copyable gap and twist inputs", () => {
    const picks = getWeeklyMarketPicks();

    for (const pick of picks) {
      expect(pick.marketGap.length).toBeGreaterThan(0);
      expect(pick.smallerVersion.length).toBeGreaterThan(0);
      expect(pick.whatNotToCopy.length).toBeGreaterThan(0);
      expect(pick.recommendedTwists.length).toBeGreaterThanOrEqual(3);
      for (const twist of pick.recommendedTwists) {
        expect(twist.targetUser.length).toBeGreaterThan(0);
        expect(twist.landingPageAngle.length).toBeGreaterThan(0);
      }
    }
  });

  test("each recipe includes waitlist validation and skill files", () => {
    const picks = getWeeklyMarketPicks();

    for (const pick of picks) {
      expect(pick.recipe.waitlistOffer.length).toBeGreaterThan(0);
      expect(pick.recipe.validationPlan.length).toBeGreaterThan(0);
      expect(pick.recipe.whatNotToBuildYet.length).toBeGreaterThan(0);
      expect(pick.recipe.skillFiles.length).toBeGreaterThan(0);
      for (const file of pick.recipe.skillFiles) {
        expect(file.startsWith("content/skill-files/")).toBe(true);
        expect(file.endsWith(".md")).toBe(true);
      }
    }
  });
});
