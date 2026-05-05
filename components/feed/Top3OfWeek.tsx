"use client";

/**
 * Top3OfWeek — weekly editorial spotlight, distinct from the daily Top 3.
 *
 * Carries more editorial weight than the daily Top 3 row: bigger mood
 * strip (24px vs 12px), bigger headline number (Fraunces 700 opsz 144,
 * 52px desktop / 40px mobile), and a curatorial-note paragraph in italic
 * that explains "why this story mattered this week."
 *
 * Single-card-expansion semantics, mirroring the Top 3 Today row: when one
 * card is expanded, siblings dim to compact state via the existing
 * StoryCard variant pattern. Tapping a collapsed card flips it into
 * expanded; tapping the expanded card or pressing ESC collapses.
 *
 * Build CTA wiring is still console.log via the StoryCard's onBuild prop
 * (Phase 6e wires the real BuildSheet).
 */

import { useState } from "react";
import { CITIES } from "@/components/brand/world-data";
import { DottedText } from "@/components/brand/DottedText";
import { SectionCaption } from "@/components/feed/SectionCaption";
import { StoryCard } from "@/components/story/StoryCard";
import { formatHeadline } from "@/lib/headline";
import { MOOD_META } from "@/lib/moods";
import type { Top3OfWeekItem } from "@/lib/curation";
import type { AnyStory } from "@/lib/types/story";

export interface Top3OfWeekProps {
  /** 0..3 hand-curated weekly picks. Empty triggers the "being curated" state. */
  items: Top3OfWeekItem[];
  /** Callback when a card's Build CTA fires. */
  onBuild?: (storyId: string) => void;
}

const SECTION_HEADING = "This week's biggest stories";

export function Top3OfWeek({ items, onBuild }: Top3OfWeekProps) {
  const [expandedRank, setExpandedRank] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <section
        data-top3-of-week=""
        data-top3-of-week-empty="true"
        aria-labelledby="top3-of-week-heading"
      >
        <SectionCaption id="top3-of-week-heading" text={SECTION_HEADING} />
        <p className="text-body text-pen italic max-w-md">
          This week&apos;s stories are being curated. Check back tomorrow.
        </p>
      </section>
    );
  }

  return (
    <section
      data-top3-of-week=""
      data-top3-of-week-count={items.length}
      aria-labelledby="top3-of-week-heading"
    >
      <SectionCaption id="top3-of-week-heading" text={SECTION_HEADING} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {items.map((item) => {
          const isExpanded = expandedRank === item.rank;
          const someoneExpanded = expandedRank !== null;
          return (
            <Top3OfWeekCard
              key={`${item.rank}-${item.story.id}`}
              item={item}
              expanded={isExpanded}
              dimmed={someoneExpanded && !isExpanded}
              onExpand={() => setExpandedRank(item.rank)}
              onCollapse={() => setExpandedRank(null)}
              onBuild={onBuild}
            />
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────────

function Top3OfWeekCard({
  item,
  expanded,
  dimmed,
  onExpand,
  onCollapse,
  onBuild,
}: {
  item: Top3OfWeekItem;
  expanded: boolean;
  dimmed: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onBuild?: (storyId: string) => void;
}) {
  // When this card is expanded, defer to the canonical StoryCard expanded
  // body — that's the surface that already implements the Build CTA, ESC
  // handling, click-outside, and the full title + microbullets layout.
  if (expanded) {
    return (
      <article
        data-top3-of-week-card=""
        data-top3-of-week-rank={item.rank}
        data-top3-of-week-expanded="true"
      >
        <StoryCard
          story={item.story}
          expanded
          onExpandChange={(next) => {
            if (!next) onCollapse();
          }}
          onBuild={onBuild}
        />
      </article>
    );
  }

  const tint = MOOD_META[item.story.primaryMood].tint;
  const headlineLabel = item.story.headlineNumber
    ? formatHeadline(item.story.headlineNumber)
    : "";
  const cityLabel = cityShortFor(item.story);
  const company = companyOfTitle(item.story.title);

  return (
    <article
      data-top3-of-week-card=""
      data-top3-of-week-rank={item.rank}
      data-top3-of-week-expanded="false"
      onClick={onExpand}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onExpand();
        }
      }}
      role="button"
      tabIndex={dimmed ? -1 : 0}
      aria-label={`Weekly story #${item.rank}: ${item.story.title}. Tap to expand.`}
      className={[
        "group relative bg-card border border-rule rounded-lg overflow-hidden flex flex-col",
        "transition-[opacity,box-shadow] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
        "shadow-card hover:shadow-card-hover cursor-pointer",
        dimmed && "opacity-30 pointer-events-none",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Mood-tinted top strip — 24px (vs 12px on Top 3 Today). */}
      <div
        data-top3-of-week-strip=""
        style={{ background: `var(--mood-${tint})`, height: 24 }}
        className="w-full"
        aria-hidden="true"
      />

      <div className="px-5 py-4 md:px-6 md:py-5 flex flex-col gap-3 flex-1">
        {/* Rank + this-week label row — DottedText for terminal identity */}
        <div className="flex items-center justify-between gap-2">
          <span
            data-top3-of-week-rank-badge=""
            data-top3-of-week-rank-text={`#${item.rank} THIS WEEK`}
            className="inline-flex items-center"
          >
            <DottedText
              text={`#${item.rank} THIS WEEK`}
              dotSize={1.25}
              color="var(--color-pen)"
            />
          </span>
        </div>

        {/* Big headline number — Fraunces 700 opsz 144 */}
        {headlineLabel && (
          <p
            data-top3-of-week-headline=""
            className="font-serif font-bold leading-[0.9] text-ink"
            style={{
              fontSize: "clamp(2.5rem, 4.6vw, 3.25rem)", // 40px → 52px
              fontVariationSettings: "'opsz' 144",
              letterSpacing: "-0.025em",
            }}
          >
            {headlineLabel}
          </p>
        )}

        {/* Story title — Fraunces 500 ~22px */}
        <h3
          data-top3-of-week-title=""
          className="font-serif font-medium text-ink leading-tight line-clamp-2"
          style={{
            fontSize: "clamp(1.125rem, 1.8vw, 1.375rem)",
            fontVariationSettings: "'opsz' 32",
          }}
        >
          {item.story.title}
        </h3>

        {/* Company + city pill row — both dotted for terminal-row identity */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            data-top3-of-week-company=""
            data-top3-of-week-company-text={company.toUpperCase()}
            className="inline-flex items-center"
          >
            <DottedText
              text={company}
              dotSize={1.25}
              color="var(--color-pen)"
            />
          </span>
          {cityLabel && (
            <span
              data-top3-of-week-city=""
              className="inline-flex items-center px-1.5 py-0.5 rounded-sm border border-rule bg-paper"
            >
              <DottedText
                text={cityLabel}
                dotSize={1.25}
                color="var(--color-pen)"
              />
            </span>
          )}
        </div>

        {/* Curatorial note — the editorial soul. */}
        <p
          data-top3-of-week-note=""
          className="font-serif italic text-pen leading-snug mt-1"
          style={{
            fontSize: "0.875rem", // 14px
            fontVariationSettings: "'opsz' 14",
          }}
        >
          {item.curatorialNote}
        </p>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function cityShortFor(story: AnyStory): string {
  if (story.lat === undefined || story.lng === undefined) return "";
  let best: { slug: string; d: number } | null = null;
  for (const [slug, city] of Object.entries(CITIES)) {
    const dLat = city.lat - story.lat;
    const dLng = city.lng - story.lng;
    const d = dLat * dLat + dLng * dLng;
    if (best === null || d < best.d) best = { slug, d };
  }
  return best ? CITIES[best.slug]!.labelShort : "";
}

/** Pull the company name from a story title — same heuristic as BuildAngles. */
function companyOfTitle(title: string): string {
  const verbs =
    /\braises\b|\bships\b|\blaunches\b|\bfiles\b|\bacqui-?\s?hires\b|\bacquires\b|\bcrosses\b|\bhits\b|\breports\b|\blays off\b|\bshuts\b|\bwins\b|\bemerges\b|\bspins\b|\bpasses\b|\breleases\b/i;
  const m = title.match(verbs);
  if (m && typeof m.index === "number" && m.index > 0) {
    return title.slice(0, m.index).trim();
  }
  return title.split(/\s+/).slice(0, 3).join(" ");
}
