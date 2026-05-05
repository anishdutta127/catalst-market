"use client";

/**
 * GlobeHero — Catalst-aware wrapper around <Globe>.
 *
 * Glues real Story[] data to the narrative globe via `computeHeat()` from
 * lib/heat-headline.ts. Handles three edge states:
 *   - loading  (stories === undefined)  → skeleton at same vertical footprint
 *   - error    (stories === null)       → empty-state copy, no globe
 *   - quiet    (computeHeat.isQuiet)    → static globe + peaceful copy
 *   - populated (default)               → narrative globe with computed stops
 *
 * The Fraunces headline + Geist subline render as REAL editorial type ABOVE
 * the Globe. The Globe's own dotted top-band (city name during ZOOM) and
 * dotted bottom-band (route line) still drive from the same heat data, so
 * type-on-type composition stays tight.
 *
 * Phase 6c will compose this onto the actual home feed. For now it's
 * mounted on /primitives only.
 */

import { useMemo } from "react";
import { Globe } from "@/components/brand/Globe";
import { computeHeat } from "@/lib/heat-headline";
import type { AnyStory } from "@/lib/types/story";

export interface GlobeHeroProps {
  /** Stories to compute heat from. `undefined` = loading, `null` = error. */
  stories: AnyStory[] | undefined | null;
  /** Fires when the narrative loop reaches a new ZOOM stop. */
  onStopChange?: (citySlug: string) => void;
  /** Fires when a user taps a pin. */
  onPinTap?: (citySlug: string) => void;
  /** Override "now" for testing / SSR snapshot reproducibility. */
  now?: Date;
  /**
   * When false, suppress the heat headline + subline above the globe.
   * Default true (preserves the /primitives demo + standalone use).
   * Set false in v3 Editorial Console where the CityPanel module owns
   * the canonical heat headline and the globe is the sole hero element.
   */
  showHeadline?: boolean;
}

export function GlobeHero({
  stories,
  onStopChange,
  onPinTap,
  now,
  showHeadline = true,
}: GlobeHeroProps) {
  // ── Loading ────────────────────────────────────────────────────────────
  if (stories === undefined) {
    return (
      <section
        data-globe-hero=""
        data-globe-hero-state="loading"
        className="flex flex-col items-center gap-4 py-8"
      >
        <div className="h-8 w-64 rounded-sm bg-rule" />
        <div className="h-4 w-40 rounded-sm bg-rule" />
        <Globe
          stops={[{ id: "skel", citySlug: "sf" }]}
          variant="static"
          size="md"
          showCharacter={false}
          headline="LOADING"
          ariaLabel="Loading signals"
        />
      </section>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (stories === null) {
    return (
      <section
        data-globe-hero=""
        data-globe-hero-state="error"
        className="flex flex-col items-center justify-center text-center py-12 px-6"
      >
        <p className="font-serif text-h2 text-ink">
          Couldn&apos;t load signals
        </p>
        <p className="text-body text-pen mt-3 max-w-sm">
          Refresh in a sec — the feed is sometimes slower than the news.
        </p>
      </section>
    );
  }

  // ── Compute heat ───────────────────────────────────────────────────────
  const heat = useMemo(
    () => computeHeat(stories, now ?? new Date()),
    [stories, now],
  );

  const handleStopChange = (stop: { citySlug: string }) =>
    onStopChange?.(stop.citySlug);

  // ── Quiet ──────────────────────────────────────────────────────────────
  if (heat.isQuiet) {
    return (
      <section
        data-globe-hero=""
        data-globe-hero-state="quiet"
        className="flex flex-col items-center gap-3 py-8"
      >
        <h1 className="font-serif text-h1 text-ink text-center max-w-2xl px-4">
          {heat.headline}
        </h1>
        <Globe
          stops={heat.stops}
          variant="static"
          size="hero"
          showCharacter
          routeLine={heat.routeLine}
          ariaLabel={heat.headline}
          onPinTap={onPinTap}
        />
      </section>
    );
  }

  // ── Populated ──────────────────────────────────────────────────────────
  return (
    <section
      data-globe-hero=""
      data-globe-hero-state="populated"
      data-globe-hero-headline={showHeadline ? "shown" : "hidden"}
      className="flex flex-col items-center gap-3 py-8"
    >
      {showHeadline && (
        <>
          <h1
            data-heat-headline=""
            className="font-serif text-h1 md:text-hero text-ink text-center max-w-3xl px-4"
            style={{ fontVariationSettings: "'opsz' 96" }}
          >
            {heat.headline}
          </h1>
          {heat.subline && (
            <p
              data-heat-subline=""
              className="text-caption text-pen text-center max-w-md"
            >
              {heat.subline}
            </p>
          )}
        </>
      )}
      <Globe
        stops={heat.stops}
        variant="narrative"
        size="hero"
        showCharacter
        routeLine={heat.routeLine}
        ariaLabel={heat.headline}
        onStopChange={handleStopChange}
        onPinTap={onPinTap}
      />
    </section>
  );
}
