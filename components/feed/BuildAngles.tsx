"use client";

/**
 * BuildAngles — Module F of the v3 Editorial Console.
 *
 * 3 cross-story angle cards aggregated from `lib/angle-aggregator.ts`.
 * Multiple cards CAN expand simultaneously (unlike Top 3) — angles are
 * a "stash" the user opens to compare side-by-side.
 *
 * Per feed.md §7f Module F:
 *   - Mood-tinted top strip per card (color = primary mood of inspiring set)
 *   - Title in Fraunces 500
 *   - "Inspired by:" labeled list of company names
 *   - Expand reveals: full description, wedge_hint italic, inspiring-story
 *     chips (tap → bubble up to parent), Coral Build CTA
 *   - When the filter narrows the pool to <3 angles, render fewer cards
 *     (no slot-filling — angles are editorial judgment)
 */

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { DottedText } from "@/components/brand/DottedText";
import { SectionCaption } from "@/components/feed/SectionCaption";
import { Button } from "@/components/ui/Button";
import { MOOD_META } from "@/lib/moods";
import type { BuildAngleCard } from "@/lib/angle-aggregator";
import type { AnyStory } from "@/lib/types/story";

export interface BuildAnglesProps {
  /** 0..3 angle cards from `aggregateAngles`. */
  angles: BuildAngleCard[];
  /** All in-scope stories (used to resolve inspiring-story chip company names). */
  stories: AnyStory[];
  /** Fires when user taps an inspiring-story chip inside an expanded card. */
  onStoryChipTap?: (storyId: string) => void;
  /** Fires when user taps the Build CTA inside an expanded card. */
  onBuild?: (angleId: string) => void;
}

export function BuildAngles({
  angles,
  stories,
  onStoryChipTap,
  onBuild,
}: BuildAnglesProps) {
  // Each card has its own expansion state — multiple expansions allowed.
  const [expandedSet, setExpandedSet] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (angles.length === 0) {
    return (
      <section
        data-build-angles=""
        data-build-angles-empty="true"
        aria-labelledby="angles-heading"
      >
        <SectionCaption id="angles-heading" text="Today's build angles" />
        <p className="text-body text-pen italic max-w-md">
          No angles match your filter — broaden it to see today&apos;s
          recommendations.
        </p>
      </section>
    );
  }

  return (
    <section
      data-build-angles=""
      data-build-angles-count={angles.length}
      aria-labelledby="angles-heading"
    >
      <SectionCaption id="angles-heading" text="Today's build angles" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {angles.map((angle) => (
          <AngleCard
            key={angle.id}
            angle={angle}
            stories={stories}
            expanded={expandedSet.has(angle.id)}
            onToggle={() => toggleExpand(angle.id)}
            onStoryChipTap={onStoryChipTap}
            onBuild={onBuild}
          />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AngleCard
// ─────────────────────────────────────────────────────────────────────────────

function AngleCard({
  angle,
  stories,
  expanded,
  onToggle,
  onStoryChipTap,
  onBuild,
}: {
  angle: BuildAngleCard;
  stories: AnyStory[];
  expanded: boolean;
  onToggle: () => void;
  onStoryChipTap?: (storyId: string) => void;
  onBuild?: (angleId: string) => void;
}) {
  const tint = MOOD_META[angle.primaryMood].tint;

  // Resolve inspiring-story chip labels from the in-scope story pool
  const inspiringStories = angle.inspiringStoryIds
    .map((id) => stories.find((s) => s.id === id))
    .filter((s): s is AnyStory => s !== undefined);

  return (
    <article
      data-build-angle-card=""
      data-build-angle-id={angle.id}
      data-build-angle-expanded={expanded ? "true" : "false"}
      className={[
        "bg-card border border-rule rounded-lg overflow-hidden flex flex-col",
        "transition-shadow duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
        expanded ? "shadow-card-hover" : "shadow-card",
      ].join(" ")}
    >
      {/* Mood-tinted top strip */}
      <div
        data-build-angle-strip=""
        style={{ background: `var(--mood-${tint})`, height: 8 }}
      />

      <div className="px-4 py-3 flex flex-col gap-2 flex-1">
        <h3
          data-build-angle-title=""
          className="font-serif font-medium text-ink text-[16px] leading-tight"
          style={{ fontVariationSettings: "'opsz' 32" }}
        >
          {angle.title}
        </h3>

        {!expanded && inspiringStories.length > 0 && (
          <p
            data-build-angle-inspired-by=""
            className="text-[11px] text-pen/70 leading-snug flex items-baseline gap-1.5 flex-wrap"
          >
            <span className="inline-flex items-center self-center">
              <DottedText
                text="INSPIRED BY"
                dotSize={1.0}
                color="var(--color-pen)"
              />
            </span>
            <span data-build-angle-inspired-by-list="">
              {inspiringStories
                .map((s) => companyOfTitle(s.title))
                .join(", ")}
            </span>
          </p>
        )}

        {expanded && (
          <ExpandedAngleBody
            angle={angle}
            inspiringStories={inspiringStories}
            onStoryChipTap={onStoryChipTap}
            onBuild={onBuild}
          />
        )}

        <button
          type="button"
          data-build-angle-toggle=""
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse this angle" : "Expand this angle"}
          className="self-end inline-flex items-center gap-1 text-[12px] text-pen hover:text-ink transition-colors mt-1 cursor-pointer"
        >
          {expanded ? "Collapse" : "Expand"}
          {expanded ? (
            <ChevronUp size={14} aria-hidden="true" />
          ) : (
            <ChevronDown size={14} aria-hidden="true" />
          )}
        </button>
      </div>
    </article>
  );
}

function ExpandedAngleBody({
  angle,
  inspiringStories,
  onStoryChipTap,
  onBuild,
}: {
  angle: BuildAngleCard;
  inspiringStories: AnyStory[];
  onStoryChipTap?: (storyId: string) => void;
  onBuild?: (angleId: string) => void;
}) {
  return (
    <div data-build-angle-expanded-body="" className="flex flex-col gap-3 mt-1">
      <p className="text-[14px] text-pen leading-snug">{angle.description}</p>
      <p
        data-build-angle-wedge=""
        className="font-serif italic text-[14px] text-ink leading-snug"
      >
        {angle.wedgeHint}
      </p>
      {inspiringStories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="inline-flex items-center self-center mr-1">
            <DottedText
              text="INSPIRED BY"
              dotSize={1.0}
              color="var(--color-pen)"
            />
          </span>
          {inspiringStories.map((s) => (
            <button
              key={s.id}
              type="button"
              data-build-angle-chip=""
              data-build-angle-chip-story={s.id}
              onClick={() => onStoryChipTap?.(s.id)}
              className="inline-flex items-center px-2 py-0.5 rounded-pill border border-rule bg-paper text-[11px] text-ink hover:border-pen transition-colors cursor-pointer"
            >
              {companyOfTitle(s.title)}
            </button>
          ))}
        </div>
      )}
      <Button
        variant="primary"
        size="sm"
        width="full"
        onClick={() => onBuild?.(angle.id)}
      >
        Build with Catalst →
      </Button>
    </div>
  );
}

// Local copy of the verb-split heuristic — keeps the chip labels short.
function companyOfTitle(title: string): string {
  const verbs =
    /\braises\b|\bships\b|\blaunches\b|\bfiles\b|\bacqui-?\s?hires\b|\bacquires\b|\bcrosses\b|\bhits\b|\breports\b|\blays off\b|\bshuts\b|\bwins\b|\bemerges\b|\bspins\b|\bpasses\b|\breleases\b/i;
  const m = title.match(verbs);
  if (m && typeof m.index === "number" && m.index > 0) {
    return title.slice(0, m.index).trim();
  }
  return title.split(/\s+/).slice(0, 3).join(" ");
}
