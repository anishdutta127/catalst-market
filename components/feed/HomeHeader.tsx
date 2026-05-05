"use client";

/**
 * HomeHeader — the sticky top bar of the home feed.
 *
 * Contains: brand wordmark (left), StreakChip + XP bar (right).
 *
 * Glass-chrome background per MASTER §5 — `--glass-chrome` is permitted
 * for floating chrome surfaces. Hairline border-bottom for separation
 * from the page body.
 *
 * StreakChip + XP bar are rendered inline (not separate components) —
 * they're tiny placeholder primitives sized for first paint. When the
 * habit-loop scope (Phase 8 per BUILD-PLAN) ships, they'll get extracted
 * into proper components with real state.
 *
 * Sticky behavior: position: sticky, top: 0, z-index above the page so
 * it floats over scroll. Page body uses padding-top to compensate at
 * mobile (where the header is full-width); on desktop the header sits
 * above a 2-column grid that doesn't need offset.
 */

import { Flame } from "lucide-react";

export interface HomeHeaderProps {
  streakDays?: number;
  xpProgress?: number; // 0..1
}

export function HomeHeader({
  streakDays = 7,
  xpProgress = 0.6,
}: HomeHeaderProps) {
  const xpSegments = 5;
  const filledSegments = Math.max(
    0,
    Math.min(xpSegments, Math.round(xpProgress * xpSegments)),
  );

  return (
    <header
      data-home-header=""
      className="glass-chrome sticky top-0 z-30 w-full border-b border-rule"
      style={{ height: 56 }}
    >
      <div className="h-full max-w-[1440px] mx-auto px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Wordmark */}
        <a
          href="/"
          data-home-wordmark=""
          className="flex items-center gap-1 font-serif font-bold text-ink leading-none hover:opacity-80 transition-opacity cursor-pointer"
          style={{
            fontSize: "clamp(15px, 2vw, 18px)",
            fontVariationSettings: "'opsz' 24",
            letterSpacing: "-0.02em",
          }}
          aria-label="Catalst Market — home"
        >
          <span className="hidden md:inline">CATALST&nbsp;MARKET</span>
          <span className="md:hidden">CATALST</span>
        </a>

        {/* Streak + XP */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            data-streak-chip=""
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-pill bg-card border border-rule"
          >
            <Flame size={14} className="text-cta" aria-hidden="true" />
            <span className="text-[13px] font-semibold text-ink leading-none">
              {streakDays}
            </span>
          </div>
          <div
            data-xp-bar=""
            className="hidden md:flex items-center gap-1"
            aria-label={`XP progress ${Math.round(xpProgress * 100)}%`}
          >
            {Array.from({ length: xpSegments }).map((_, i) => (
              <span
                key={i}
                data-xp-segment={i < filledSegments ? "filled" : "empty"}
                className={[
                  "block w-3 h-3 rounded-sm",
                  i < filledSegments ? "bg-ink" : "bg-rule",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
