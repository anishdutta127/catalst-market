import { describe, expect, test } from "bun:test";
import seedRaw from "@/content/stories.seed.json";
import { CITIES } from "@/components/brand/world-data";
import {
  haversineKm,
  nearestCity,
  validateSeed,
  validateStory,
} from "../seed-validate";
import type { AnyStory, Mood, StoryType } from "../types/story";

const seed = validateSeed(seedRaw);

describe("seed-validate — schema", () => {
  test("the production seed validates cleanly through the schema (no throw)", () => {
    expect(seed.length).toBeGreaterThan(0);
  });

  test("seed has 20 stories", () => {
    expect(seed.length).toBe(20);
  });

  test("malformed story throws with a useful error", () => {
    expect(() => validateStory({ id: "bad", type: "funding" })).toThrow(/title/);
  });

  test("invalid type rejected", () => {
    expect(() =>
      validateStory({
        id: "x",
        type: "imagine",
        title: "x",
        headlineNumber: null,
        microBullets: [],
        whyNow: "x",
        primaryMood: "blowing-up",
        moods: ["blowing-up"],
        stage: "builders",
        industry: "ai",
        region: "global",
        verified: true,
        source: "seed",
        createdAt: "2026-01-01T00:00:00Z",
        details: { productName: "x", productUrl: "x" },
      }),
    ).toThrow(/type/);
  });

  test("primaryMood must be in moods array", () => {
    expect(() =>
      validateStory({
        id: "x",
        type: "founder",
        title: "x",
        headlineNumber: null,
        microBullets: [],
        whyNow: "x",
        primaryMood: "blowing-up",
        moods: ["quiet-builders"],
        stage: "builders",
        industry: "ai",
        region: "global",
        verified: true,
        source: "seed",
        createdAt: "2026-01-01T00:00:00Z",
        details: { founderName: "x" },
      }),
    ).toThrow(/moods must include primaryMood/);
  });
});

describe("seed-validate — geographic match", () => {
  test("haversineKm — Bangalore to itself is 0", () => {
    const blr = CITIES.bangalore!;
    expect(haversineKm(blr.lat, blr.lng, blr.lat, blr.lng)).toBeCloseTo(0, 5);
  });

  test("haversineKm — SF to NYC ≈ 4140km (sanity check)", () => {
    const sf = CITIES.sf!;
    const nyc = CITIES.nyc!;
    const d = haversineKm(sf.lat, sf.lng, nyc.lat, nyc.lng);
    expect(d).toBeGreaterThan(4000);
    expect(d).toBeLessThan(4200);
  });

  test("nearestCity — story at exact Bangalore coords matches BLR", () => {
    const blr = CITIES.bangalore!;
    const m = nearestCity(blr.lat, blr.lng);
    expect(m).not.toBeNull();
    expect(m!.slug).toBe("bangalore");
    expect(m!.distanceKm).toBeLessThan(1);
  });

  test("nearestCity — story at (0, 0) returns null (no city within 50km)", () => {
    expect(nearestCity(0, 0)).toBeNull();
  });

  test("nearestCity — point 100km from a city returns null at default 50km tolerance", () => {
    const blr = CITIES.bangalore!;
    // Move ~1° latitude north (≈111km)
    expect(nearestCity(blr.lat + 1, blr.lng)).toBeNull();
  });

  test("seed lat/lng all match a CITIES entry within 50km", () => {
    for (const story of seed) {
      if (story.lat === undefined || story.lng === undefined) continue;
      const m = nearestCity(story.lat, story.lng);
      expect({ id: story.id, match: m }).toEqual({ id: story.id, match: expect.objectContaining({ slug: expect.any(String) }) });
    }
  });
});

describe("seed-validate — content distribution", () => {
  test("all 11 story types present", () => {
    const types = new Set<StoryType>(seed.map((s) => s.type));
    const expected: StoryType[] = [
      "funding",
      "launch",
      "ai",
      "ma",
      "ipo",
      "milestone",
      "founder",
      "os",
      "layoff",
      "shutdown",
      "regulatory",
    ];
    for (const t of expected) {
      expect(types.has(t)).toBe(true);
    }
  });

  test("all 9 moods present (as primaryMood)", () => {
    const moods = new Set<Mood>(seed.map((s) => s.primaryMood));
    const expected: Mood[] = [
      "blowing-up",
      "underdog-wins",
      "bootstrapped-millions",
      "overnight-rockets",
      "quiet-builders",
      "copy-able-ideas",
      "founders-like-me",
      "big-money-moves",
      "india-shipping",
    ];
    for (const m of expected) {
      expect(moods.has(m)).toBe(true);
    }
  });

  test("featured: true count is 5-7 (drives the 'hot city' cluster)", () => {
    const featured = seed.filter((s) => s.featured === true);
    expect(featured.length).toBeGreaterThanOrEqual(5);
    expect(featured.length).toBeLessThanOrEqual(7);
  });

  test("featured stories cluster in a single city (consistent 'hot' city)", () => {
    const featured = seed.filter((s) => s.featured === true);
    const cities = new Set<string>();
    for (const s of featured) {
      if (s.lat !== undefined && s.lng !== undefined) {
        const m = nearestCity(s.lat, s.lng);
        if (m) cities.add(m.slug);
      }
    }
    expect(cities.size).toBe(1);
  });

  test("every story has a non-empty title and at least one microBullet", () => {
    for (const s of seed) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.microBullets.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("every story's createdAt parses to a valid date", () => {
    for (const s of seed) {
      const t = Date.parse(s.createdAt);
      expect(Number.isFinite(t)).toBe(true);
    }
  });
});

describe("seed-validate — invalid lat/lng rejected", () => {
  test("validateSeed throws when a story's lat/lng doesn't match any city", () => {
    const bad: AnyStory = {
      id: "atlantis",
      type: "founder",
      title: "Atlantean Founder",
      headlineNumber: null,
      microBullets: ["x"],
      whyNow: "x",
      primaryMood: "blowing-up",
      moods: ["blowing-up"],
      stage: "builders",
      industry: "ai",
      region: "global",
      verified: true,
      source: "seed",
      createdAt: "2026-01-01T00:00:00Z",
      lat: 0,
      lng: 0,
      details: { founderName: "x" },
    };
    expect(() => validateSeed([bad])).toThrow(/does not match any CITIES entry/);
  });
});
