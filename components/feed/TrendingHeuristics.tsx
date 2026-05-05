"use client";

/**
 * TrendingHeuristics — Module E of the v3 Editorial Console.
 *
 * 6 cards EXACT at every viewport (per ratified spec). Composed from
 * `lib/heuristics.ts` + `padHeuristicsToCount` so that under-active
 * pools always pad to 6 with "0 — quiet" placeholders rather than
 * collapsing the strip width.
 *
 * Tap a card → toggles that industry on the universal filter
 * (symmetric — tapping an active industry CLEARS it).
 *
 * IMPORTANT: this module does NOT subscribe to useFilter for its
 * data computation — the heuristics are GLOBAL (filter-source).
 * Filter changes only HIGHLIGHT the active industry's card; they
 * never re-rank the cards.
 */

import {
  type IndustryHeuristic,
  formatDelta,
} from "@/lib/heuristics";
import { DottedText } from "@/components/brand/DottedText";
import { SectionCaption } from "@/components/feed/SectionCaption";
import { useFilter } from "@/lib/filter/useFilter";
import type { Industry } from "@/lib/types/story";

export interface TrendingHeuristicsProps {
  /** Pre-computed + padded list of EXACTLY 6 entries. */
  entries: IndustryHeuristic[];
}

export function TrendingHeuristics({ entries }: TrendingHeuristicsProps) {
  const filter = useFilter();
  // Defensive — caller should pad to 6, but if they passed fewer/more we
  // still render what we got.
  return (
    <section
      data-trending-heuristics=""
      data-trending-count={entries.length}
      aria-labelledby="trending-heading"
    >
      <SectionCaption id="trending-heading" text="This week's momentum" />
      <div
        data-trending-grid=""
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {entries.map((e) => (
          <TrendingCard
            key={e.industry}
            entry={e}
            isActive={filter.scope.industries.has(e.industry)}
            onToggle={() => filter.toggleIndustry(e.industry)}
          />
        ))}
      </div>
    </section>
  );
}

function TrendingCard({
  entry,
  isActive,
  onToggle,
}: {
  entry: IndustryHeuristic;
  isActive: boolean;
  onToggle: () => void;
}) {
  const isQuiet = entry.signalCount === 0;
  const delta = formatDelta(entry.weekDelta);
  return (
    <button
      type="button"
      data-trending-card=""
      data-trending-card-industry={entry.industry}
      data-trending-card-active={isActive ? "true" : "false"}
      data-trending-card-quiet={isQuiet ? "true" : "false"}
      onClick={onToggle}
      aria-pressed={isActive}
      aria-label={`${entry.industryLabel}: ${entry.signalCount} signals this week. ${
        isActive ? "Tap to clear filter." : "Tap to filter to this industry."
      }`}
      className={[
        "group relative flex flex-col gap-1 p-3 bg-card rounded-md border border-rule",
        "hover:shadow-card transition-all cursor-pointer text-left",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2",
        isActive ? "ring-2 ring-cta ring-inset border-transparent" : "",
        isQuiet ? "opacity-60" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ minHeight: 132 }}
    >
      {/* Industry label — DottedText for terminal-strip identity */}
      <div className="flex items-center justify-between gap-1">
        <span
          data-trending-label=""
          data-trending-label-text={entry.industryLabel.toUpperCase()}
          className="inline-flex items-center min-w-0 truncate"
        >
          <DottedText
            text={entry.industryLabel}
            dotSize={1.25}
            color="var(--color-pen)"
          />
        </span>
        {isActive && (
          <span
            data-trending-active-badge=""
            className="inline-flex items-center"
          >
            <DottedText
              text="ACTIVE"
              dotSize={1.0}
              color="var(--color-cta)"
            />
          </span>
        )}
      </div>

      {/* Signal count — eye anchor (stays Fraunces per playbook) */}
      <p
        data-trending-count-display=""
        className="font-serif font-bold text-ink leading-none"
        style={{
          fontSize: "clamp(28px, 3vw, 36px)",
          fontVariationSettings: "'opsz' 96",
          letterSpacing: "-0.02em",
        }}
      >
        {entry.signalCount}
      </p>

      {/* Week delta — Dotted-Terminal per Phase 7b brainstorm decision.
          Arrow + value ride the same dot grid as the industry label so
          the card reads as a unified terminal cell. */}
      <div
        data-trending-delta=""
        data-trending-delta-arrow={delta.arrow}
        className="inline-flex items-center"
      >
        <DottedText
          text={dottedDeltaText(delta.arrow, delta.label)}
          dotSize={1.25}
          color={
            delta.arrow === "flat" ? "var(--color-pen)" : "var(--color-pen)"
          }
        />
      </div>

      {/* Top story summary or quiet placeholder */}
      <p
        data-trending-top-story=""
        className="text-[11px] text-pen/80 leading-tight line-clamp-2 mt-auto"
      >
        {isQuiet ? "0 — quiet" : entry.topStory?.oneLine ?? "—"}
      </p>
    </button>
  );
}

/**
 * Compose the dotted delta string from the arrow direction + label.
 *
 * formatDelta() returns labels like "+22%", "-5%", "—", or the already-
 * decorated "↑ —" for the infinite-up edge case. We prefix ↑/↓ glyphs
 * for normal up/down deltas, but bail out if the label already carries
 * the arrow so we don't double-decorate.
 */
function dottedDeltaText(
  arrow: "up" | "down" | "flat",
  label: string,
): string {
  const trimmed = label.trim();
  if (trimmed.startsWith("↑") || trimmed.startsWith("↓")) return trimmed;
  if (arrow === "up") return `↑ ${trimmed}`;
  if (arrow === "down") return `↓ ${trimmed.replace(/^-/, "")}`;
  return trimmed;
}

// Re-export for convenience at call sites.
export type { Industry };
