"use client";

/**
 * CityPanel — Module C of the v3 Editorial Console.
 *
 * Composes a heat headline + mini cities-by-count table + active city's
 * top stories. Subscribes to useFilter for the cascading story filter
 * within the active city.
 *
 * Reactive: parent passes `activeCitySlug` (driven by globe pin taps).
 * Tapping a row in the mini cities table re-targets the panel via
 * `onCityChange`.
 *
 * Per feed.md §7f Module C:
 *   - Heat headline Fraunces 600 opsz 96 with the <City> word in Coral
 *   - Mini cities bar table (desktop only — hidden on mobile to save space)
 *   - Story rows with 4px mood-tinted left bar + headline number + title +
 *     type cassette + city short
 *   - "+N more →" link only when N > 0
 *   - Empty state when active city has zero matching stories under filter
 */

import { useState } from "react";
import { CITIES } from "@/components/brand/world-data";
import { Cassette } from "@/components/brand/Cassette";
import { DottedText } from "@/components/brand/DottedText";
import { StoryCard } from "@/components/story/StoryCard";
import { useFilter } from "@/lib/filter/useFilter";
import { formatHeadline } from "@/lib/headline";
import { MOOD_META } from "@/lib/moods";
import type { AnyStory } from "@/lib/types/story";

export interface CityHeatRow {
  citySlug: string;
  cityLabelShort: string;
  signalCount: number;
}

export interface CityPanelProps {
  /** All stories in scope (parent has already applied filter). */
  stories: AnyStory[];
  /** The currently-active city slug (driven by globe pin tap). */
  activeCitySlug: string;
  /** Re-target callback — fires when the user taps a row in the mini table. */
  onCityChange: (citySlug: string) => void;
  /** Top 4 cities by signal count for the mini bar table. */
  cityHeat: CityHeatRow[];
}

const TYPE_DISPLAY_SHORT: Record<AnyStory["type"], string> = {
  funding: "FUND",
  launch: "LAUNCH",
  ai: "AI",
  ma: "MA",
  ipo: "IPO",
  milestone: "MILE",
  founder: "FNDR",
  os: "OS",
  layoff: "LAYOFF",
  shutdown: "SHUT",
  regulatory: "REG",
};

const ROW_LIMIT = 6;

export function CityPanel(props: CityPanelProps) {
  const { stories, activeCitySlug, onCityChange, cityHeat } = props;
  const filter = useFilter();

  // Filter to the active city's stories that match the universal filter
  const activeCityStories = stories.filter((s) => {
    if (matchedCitySlug(s) !== activeCitySlug) return false;
    if (filter.scope.moods.size > 0 && !filter.scope.moods.has(s.primaryMood))
      return false;
    if (
      filter.scope.industries.size > 0 &&
      !filter.scope.industries.has(s.industry)
    )
      return false;
    if (filter.scope.stages.size > 0 && !filter.scope.stages.has(s.stage))
      return false;
    return true;
  });

  // Sort by createdAt desc, take ROW_LIMIT
  const sorted = [...activeCityStories].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  const visible = sorted.slice(0, ROW_LIMIT);
  const hiddenCount = Math.max(0, sorted.length - ROW_LIMIT);

  const cityName = CITIES[activeCitySlug]?.name ?? activeCitySlug;
  const totalCount = sorted.length;

  return (
    <aside
      data-city-panel=""
      data-city-panel-active={activeCitySlug}
      className="bg-card border border-rule rounded-lg overflow-hidden flex flex-col"
    >
      <HeatHeadline cityName={cityName} totalCount={totalCount} />

      <CityHeatTable
        rows={cityHeat}
        activeSlug={activeCitySlug}
        onPick={onCityChange}
      />

      <div className="border-t border-rule">
        <div className="flex items-center justify-between px-4 py-2.5 gap-2">
          <h3
            data-city-panel-active-caption=""
            data-city-panel-active-caption-text={`CITY ${cityName.toUpperCase()}`}
            className="inline-flex items-center"
          >
            <DottedText
              text={`CITY ${cityName}`}
              dotSize={1.0}
              color="var(--color-pen)"
            />
          </h3>
          {totalCount > 0 && (
            <span
              data-city-panel-signal-count=""
              className="inline-flex items-center"
            >
              <DottedText
                text={`${totalCount} ${totalCount === 1 ? "SIGNAL" : "SIGNALS"}`}
                dotSize={1.0}
                color="var(--color-pen)"
              />
            </span>
          )}
        </div>

        {totalCount === 0 ? (
          <EmptyCity
            cityName={cityName}
            filterActive={filter.isActive}
            onClearFilter={filter.clear}
          />
        ) : (
          <ul data-city-stories="" className="flex flex-col">
            {visible.map((story) => (
              <CityStoryRow key={story.id} story={story} />
            ))}
            {hiddenCount > 0 && (
              <li>
                <button
                  type="button"
                  data-city-more=""
                  data-city-more-count={hiddenCount}
                  onClick={() =>
                    // eslint-disable-next-line no-console
                    console.log(
                      `[CityPanel] +${hiddenCount} more from ${cityName} — /city/${activeCitySlug} route lands in Phase 7.`,
                    )
                  }
                  className="w-full text-left px-4 py-2.5 border-t border-rule hover:bg-paper transition-colors cursor-pointer inline-flex items-center"
                  aria-label={`See ${hiddenCount} more stories from ${cityName}`}
                >
                  <DottedText
                    text={`+${hiddenCount} MORE →`}
                    dotSize={1.25}
                    color="var(--color-pen)"
                  />
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-elements
// ─────────────────────────────────────────────────────────────────────────────

function HeatHeadline({
  cityName,
  totalCount,
}: {
  cityName: string;
  totalCount: number;
}) {
  return (
    <div data-heat-headline="" className="px-4 py-3 border-b border-rule">
      <p
        // data-heat-headline-size: testable expression of the locked v3
        // size (happy-dom strips clamp() from inline style, so a data-attr
        // is the cleanest way to assert).
        data-heat-headline-size="clamp(26px, 2.8vw, 32px)"
        className="font-serif font-semibold leading-tight text-ink"
        style={{
          // v3 polish: bumped from clamp(20, 2.4vw, 24) → clamp(26, 2.8vw, 32).
          // CityPanel's headline is now the page's canonical heat headline
          // (the hero-band one was removed when globe became sole hero).
          fontSize: "clamp(26px, 2.8vw, 32px)",
          fontVariationSettings: "'opsz' 96",
        }}
      >
        Today:{" "}
        <span data-heat-city-span="" className="text-cta uppercase">
          {cityName}
        </span>{" "}
        is {totalCount > 0 ? "hot" : "quiet"}
        {totalCount > 0 && (
          <>
            {" — "}
            {totalCount} signal{totalCount === 1 ? "" : "s"}
          </>
        )}
      </p>
    </div>
  );
}

function CityHeatTable({
  rows,
  activeSlug,
  onPick,
}: {
  rows: CityHeatRow[];
  activeSlug: string;
  onPick: (slug: string) => void;
}) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.signalCount));
  return (
    <div
      data-city-heat-table=""
      className="hidden md:flex flex-col gap-1 px-4 py-3 border-b border-rule"
    >
      <p
        data-city-heat-caption=""
        className="mb-1 inline-flex items-center leading-none"
      >
        <DottedText
          text="CITIES"
          dotSize={1.0}
          color="var(--color-pen)"
        />
      </p>
      {rows.map((r) => {
        const active = r.citySlug === activeSlug;
        const widthPct = max === 0 ? 0 : Math.round((r.signalCount / max) * 100);
        return (
          <button
            type="button"
            key={r.citySlug}
            data-city-heat-row={r.citySlug}
            data-city-heat-active={active ? "true" : "false"}
            onClick={() => onPick(r.citySlug)}
            className="flex items-center gap-2 py-1 hover:bg-paper -mx-1 px-1 rounded-sm transition-colors cursor-pointer text-left"
          >
            <span
              className="text-[12px] font-medium tabular-nums text-pen w-10 shrink-0"
              style={{ color: active ? "var(--color-ink)" : undefined }}
            >
              {r.cityLabelShort}
            </span>
            <span className="relative flex-1 h-3 bg-rule/40 rounded-sm overflow-hidden">
              <span
                className="absolute inset-y-0 left-0 bg-pen/60"
                style={{
                  width: `${widthPct}%`,
                  background: active ? "var(--color-cta)" : undefined,
                }}
              />
            </span>
            <span className="text-[12px] tabular-nums text-pen/80 w-6 shrink-0 text-right">
              {r.signalCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CityStoryRow({ story }: { story: AnyStory }) {
  const [expanded, setExpanded] = useState(false);
  const tint = MOOD_META[story.primaryMood].tint;

  if (expanded) {
    return (
      <li data-city-story-row="" data-city-story-expanded="true">
        <StoryCard
          story={story}
          expanded
          onExpandChange={(next) => setExpanded(next)}
          onBuild={(id) =>
            // eslint-disable-next-line no-console
            console.log(`[CityPanel] Build with Catalst on ${id}`)
          }
        />
      </li>
    );
  }

  const headlineLabel = story.headlineNumber
    ? formatHeadline(story.headlineNumber)
    : "";
  const typeLabel = TYPE_DISPLAY_SHORT[story.type];

  return (
    <li
      data-city-story-row=""
      data-city-story-id={story.id}
      className="border-t border-rule first:border-t-0"
    >
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full flex items-stretch gap-3 px-3 py-2 hover:bg-paper transition-colors cursor-pointer text-left"
        aria-label={`Expand: ${story.title}`}
      >
        {/* mood-tinted left bar */}
        <span
          aria-hidden="true"
          className="w-1 shrink-0 rounded-sm self-stretch"
          style={{ background: `var(--mood-${tint})` }}
        />
        <div className="flex-1 flex items-baseline gap-2 min-w-0">
          {headlineLabel && (
            <span
              className="font-serif font-semibold text-ink text-[15px] tabular-nums shrink-0"
              style={{
                fontVariationSettings: "'opsz' 32",
                letterSpacing: "-0.01em",
              }}
            >
              {headlineLabel}
            </span>
          )}
          <span className="text-[13px] text-pen truncate flex-1">
            {firstWord(story.title)}
          </span>
          <Cassette
            contentWidth={typeLabel.length * 5 + (typeLabel.length - 1)}
            contentHeight={7}
            variant="pin-label"
            dotSize={1}
            padding={{ x: 2, y: 1 }}
            fill={`var(--mood-${tint})`}
            ariaLabel={`Type: ${typeLabel}`}
          >
            <DottedText text={typeLabel} dotSize={1} color="var(--color-ink)" />
          </Cassette>
        </div>
      </button>
    </li>
  );
}

function EmptyCity({
  cityName,
  filterActive,
  onClearFilter,
}: {
  cityName: string;
  filterActive: boolean;
  onClearFilter: () => void;
}) {
  return (
    <div
      data-city-empty=""
      className="px-4 py-6 text-center text-[13px] text-pen"
    >
      {filterActive ? (
        <>
          No stories from {cityName} match your filter.{" "}
          <button
            type="button"
            onClick={onClearFilter}
            className="text-ink underline cursor-pointer"
          >
            Clear filter
          </button>
        </>
      ) : (
        <>Quiet day in {cityName}.</>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function matchedCitySlug(story: AnyStory): string | null {
  if (story.lat === undefined || story.lng === undefined) return null;
  let best: { slug: string; d: number } | null = null;
  for (const [slug, city] of Object.entries(CITIES)) {
    const dLat = city.lat - story.lat;
    const dLng = city.lng - story.lng;
    const d = dLat * dLat + dLng * dLng;
    if (best === null || d < best.d) best = { slug, d };
  }
  return best?.slug ?? null;
}

function firstWord(title: string): string {
  // Pull the first 4-6 words out of the title for the row preview.
  return title.split(/\s+/).slice(0, 6).join(" ");
}

export const __cityPanelTesting = {
  matchedCitySlug,
  ROW_LIMIT,
};
