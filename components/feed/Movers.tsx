"use client";

/**
 * Movers — quiet underdog signals, counter-programming to the headline-
 * grabbers in Top 3 and Top 3 of the Week.
 *
 * Different aspect ratio from StoryCard (wider, shorter, ~80px mobile /
 * ~96px desktop) so the row visually reads as a stock-ticker terminal
 * line, but warm. Three slots; if the pool yields fewer than three, the
 * remaining slots render as muted "no second mover this week" placeholders
 * rather than collapse — keeps the row's visual grid stable.
 *
 * Tap → expands in-place with a smaller body than StoryCard: just two
 * extra micro-bullet lines and the Build CTA.
 *
 * The Build CTA is wired through the same console.log placeholder as
 * other curation surfaces; Phase 6e wires the real BuildSheet.
 */

import { ChevronUp } from "lucide-react";
import { useState } from "react";
import { CITIES } from "@/components/brand/world-data";
import { DottedText } from "@/components/brand/DottedText";
import { SectionCaption } from "@/components/feed/SectionCaption";
import { Button } from "@/components/ui/Button";
import { formatHeadline } from "@/lib/headline";
import { MOOD_META } from "@/lib/moods";
import type { AnyStory } from "@/lib/types/story";

export interface MoversProps {
  /** Up to 3 mover stories from `getMovers()`. */
  stories: AnyStory[];
  /** Fires when a mover row's Build CTA is tapped. */
  onBuild?: (storyId: string) => void;
}

const SECTION_HEADING = "Quiet movers — stories you might've missed";
const SLOT_COUNT = 3;

export function Movers({ stories, onBuild }: MoversProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Pad to 3 slots so the row always reads as a 3-column terminal table.
  const slots: (AnyStory | null)[] = [
    ...stories.slice(0, SLOT_COUNT),
    ...Array<null>(Math.max(0, SLOT_COUNT - stories.length)).fill(null),
  ];

  return (
    <section
      data-movers=""
      data-movers-count={stories.length}
      aria-labelledby="movers-heading"
    >
      <SectionCaption id="movers-heading" text={SECTION_HEADING} />
      <ul
        data-movers-list=""
        className="flex flex-col bg-card border border-rule rounded-lg overflow-hidden"
      >
        {slots.map((story, i) =>
          story ? (
            <MoverRow
              key={story.id}
              story={story}
              rank={i + 1}
              expanded={expandedId === story.id}
              onToggle={() =>
                setExpandedId(expandedId === story.id ? null : story.id)
              }
              onBuild={onBuild}
            />
          ) : (
            <EmptyMoverSlot key={`empty-${i}`} rank={i + 1} />
          ),
        )}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Row — collapsed state
// ─────────────────────────────────────────────────────────────────────────────

function MoverRow({
  story,
  rank,
  expanded,
  onToggle,
  onBuild,
}: {
  story: AnyStory;
  rank: number;
  expanded: boolean;
  onToggle: () => void;
  onBuild?: (storyId: string) => void;
}) {
  const tint = MOOD_META[story.primaryMood].tint;
  const headlineLabel = story.headlineNumber
    ? formatHeadline(story.headlineNumber)
    : "";
  const cityShort = cityShortFor(story);
  const company = companyOfTitle(story.title);
  const teaser = teaserFromTitle(story.title, company);

  return (
    <li
      data-mover-row=""
      data-mover-id={story.id}
      data-mover-rank={rank}
      data-mover-expanded={expanded ? "true" : "false"}
      className="border-t border-rule first:border-t-0"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={
          expanded
            ? `Collapse mover #${rank}: ${story.title}`
            : `Expand mover #${rank}: ${story.title}`
        }
        className="w-full flex items-stretch gap-3 px-3 md:px-4 hover:bg-paper transition-colors cursor-pointer text-left"
        style={{ minHeight: 80 }}
      >
        {/* Mood-tinted left bar */}
        <span
          aria-hidden="true"
          className="w-1 shrink-0 self-stretch"
          style={{ background: `var(--mood-${tint})` }}
        />

        {/* Left: dotted rank badge */}
        <div className="flex items-center shrink-0 w-10 md:w-12">
          <DottedText
            text={`#${rank}`}
            dotSize={2}
            color="var(--color-pen)"
          />
        </div>

        {/* Middle: company name + teaser */}
        <div className="flex-1 flex flex-col justify-center min-w-0 py-2">
          <span
            data-mover-company=""
            className="text-[14px] font-semibold text-ink leading-tight truncate"
          >
            {company}
          </span>
          <span
            data-mover-teaser=""
            className="text-[12px] text-pen leading-snug line-clamp-1"
          >
            {teaser}
          </span>
        </div>

        {/* Right: headline metric (dotted) + city */}
        <div className="flex flex-col items-end justify-center shrink-0 gap-1 py-2 md:w-32">
          {headlineLabel && (
            <span
              data-mover-metric=""
              className="font-serif font-semibold text-ink text-[14px] tabular-nums"
              style={{
                fontVariationSettings: "'opsz' 24",
                letterSpacing: "-0.01em",
              }}
            >
              {headlineLabel}
            </span>
          )}
          {cityShort && (
            <DottedText
              text={cityShort}
              dotSize={1.25}
              color="var(--color-pen)"
            />
          )}
        </div>

        <ChevronUp
          size={14}
          aria-hidden="true"
          className={`text-pen self-center shrink-0 transition-transform duration-200 ${
            expanded ? "" : "rotate-180"
          }`}
        />
      </button>

      {expanded && (
        <MoverExpandedBody story={story} onBuild={onBuild} />
      )}
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Row — expanded state (just two extra detail lines + Build CTA)
// ─────────────────────────────────────────────────────────────────────────────

function MoverExpandedBody({
  story,
  onBuild,
}: {
  story: AnyStory;
  onBuild?: (storyId: string) => void;
}) {
  // Pull two micro-bullets — the row is intentionally short, so we cap
  // even when the story has 3+ bullets in seed data.
  const bullets = story.microBullets.slice(0, 2);

  return (
    <div
      data-mover-expanded-body=""
      className="px-4 md:px-5 py-3 border-t border-rule bg-paper"
    >
      <ul className="flex flex-col gap-1.5 text-[13px] text-pen leading-snug">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-pen/40 select-none" aria-hidden="true">
              ·
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {story.whyNow && (
        <p
          data-mover-whynow=""
          className="font-serif italic text-[13px] text-pen mt-2"
        >
          Why now: {story.whyNow}
        </p>
      )}
      <div className="mt-3 max-w-xs">
        <Button
          variant="primary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onBuild?.(story.id);
          }}
        >
          Build with Catalst →
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty slot — when seed yields fewer than 3 candidates
// ─────────────────────────────────────────────────────────────────────────────

function EmptyMoverSlot({ rank }: { rank: number }) {
  return (
    <li
      data-mover-row=""
      data-mover-empty="true"
      data-mover-rank={rank}
      className="border-t border-rule first:border-t-0"
    >
      <div
        className="w-full flex items-stretch gap-3 px-3 md:px-4 opacity-40"
        style={{ minHeight: 80 }}
      >
        <span
          aria-hidden="true"
          className="w-1 shrink-0 self-stretch bg-rule"
        />
        <div className="flex items-center shrink-0 w-10 md:w-12">
          <DottedText text={`#${rank}`} dotSize={2} color="var(--color-pen)" />
        </div>
        <div className="flex-1 flex items-center min-w-0 py-2">
          <span className="text-[12px] text-pen italic">
            No mover for this slot today.
          </span>
        </div>
      </div>
    </li>
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

function companyOfTitle(title: string): string {
  const verbs =
    /\braises\b|\bships\b|\blaunches\b|\bfiles\b|\bacqui-?\s?hires\b|\bacquires\b|\bcrosses\b|\bhits\b|\breports\b|\blays off\b|\bshuts\b|\bwins\b|\bemerges\b|\bspins\b|\bpasses\b|\breleases\b/i;
  const m = title.match(verbs);
  if (m && typeof m.index === "number" && m.index > 0) {
    return title.slice(0, m.index).trim();
  }
  return title.split(/\s+/).slice(0, 3).join(" ");
}

/**
 * Verb-onward part of the title — e.g. "raises Series B from Algeria"
 * for the Yassir story. Falls back to the full title if the verb split
 * heuristic doesn't match.
 */
function teaserFromTitle(title: string, company: string): string {
  if (company.length === 0) return title;
  const remainder = title.slice(company.length).trim();
  return remainder.length > 0 ? remainder : title;
}
