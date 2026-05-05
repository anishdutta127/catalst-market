"use client";

/**
 * BusinessOfWeek — single-company editorial spotlight, distinct from the
 * weekly Top 3 row.
 *
 * Two-column composition on desktop: ~60% left brief (hero, name, tagline,
 * weekly arc, key stats, external link, related angle) and ~40% right
 * dotted-typography pull-quote that frames the editorial reason for the
 * pick. On mobile the right column stacks beneath the brief so all of it
 * stays in one scroll.
 *
 * The pull-quote uses DottedText so the Sarvam-style hand-curated reason
 * reads as a magazine spread rather than a paragraph. Pull-quote stays in
 * the dotted-bitmap world the rest of the brand chrome lives in.
 *
 * The pick is editorial — it does NOT cascade with the universal filter
 * (caveat documented in design-system/pages/feed.md §7).
 */

import { ExternalLink } from "lucide-react";
import { DottedText } from "@/components/brand/DottedText";
import { SectionCaption } from "@/components/feed/SectionCaption";
import { MOOD_META } from "@/lib/moods";
import type {
  BusinessOfTheWeek,
  BusinessOfTheWeekStat,
} from "@/lib/curation";
import type { BuildAngleCard } from "@/lib/angle-aggregator";

export interface BusinessOfWeekProps {
  data: BusinessOfTheWeek;
  /** All in-scope build angles (used to resolve relatedBuildAngleId). */
  angles?: BuildAngleCard[];
  /** Fires when the user taps the related Build Angle line. */
  onAngleTap?: (angleId: string) => void;
}

const SECTION_HEADING = "Business of the week";

export function BusinessOfWeek({
  data,
  angles = [],
  onAngleTap,
}: BusinessOfWeekProps) {
  const tint = MOOD_META[data.primaryMoodForTint].tint;
  const relatedAngle =
    data.relatedBuildAngleId !== undefined
      ? angles.find((a) => a.id === data.relatedBuildAngleId)
      : undefined;

  const externalHost = friendlyHost(data.externalUrl);

  return (
    <section
      data-business-of-week=""
      data-business-of-week-id={data.companyId}
      aria-labelledby="business-of-week-heading"
    >
      <SectionCaption id="business-of-week-heading" text={SECTION_HEADING} />

      <div
        data-business-of-week-grid=""
        className="bg-card border border-rule rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-0"
      >
        {/* ── Left brief (60% on desktop) ─────────────────────────────── */}
        <div
          data-business-of-week-brief=""
          className="flex flex-col"
        >
          <BusinessHero data={data} tint={tint} />

          <div className="px-5 md:px-6 py-5 md:py-6 flex flex-col gap-3">
            <h3
              data-business-of-week-name=""
              className="font-serif font-semibold text-ink leading-none"
              style={{
                fontSize: "clamp(1.75rem, 3.2vw, 2.25rem)", // 28-36px
                fontVariationSettings: "'opsz' 96",
                letterSpacing: "-0.02em",
              }}
            >
              {data.companyName}
            </h3>

            <p
              data-business-of-week-tagline=""
              className="font-serif italic text-pen leading-snug"
              style={{
                fontSize: "1rem", // 16px
                fontVariationSettings: "'opsz' 18",
              }}
            >
              {data.tagline}
            </p>

            {/* The Week's Arc — 3 paragraphs (caption dotted, body editorial) */}
            <div
              data-business-of-week-arc=""
              className="flex flex-col gap-3 mt-2"
            >
              <p
                data-business-of-week-arc-caption=""
                className="leading-none"
              >
                <DottedText
                  text="The week's arc"
                  dotSize={1.0}
                  color="var(--color-pen)"
                />
              </p>
              {data.weeklyArc.map((paragraph, i) => (
                <p
                  key={i}
                  data-business-of-week-arc-paragraph=""
                  className="text-pen"
                  style={{
                    fontSize: "0.9375rem", // 15px
                    lineHeight: 1.6,
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Key stats — 3 inline pills */}
            <div
              data-business-of-week-stats=""
              className="flex flex-wrap gap-2 mt-2"
            >
              {data.keyStats.map((stat) => (
                <KeyStatPill key={stat.label} stat={stat} />
              ))}
            </div>

            {/* External link button */}
            <div className="mt-3">
              <a
                href={data.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-business-of-week-external=""
                className="inline-flex items-center gap-1.5 text-[13px] text-ink hover:text-cta transition-colors"
              >
                <span className="border-b border-rule">
                  View on {externalHost}
                </span>
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </div>

            {/* Related Build Angle line */}
            {relatedAngle && (
              <button
                type="button"
                data-business-of-week-related-angle=""
                data-business-of-week-related-angle-id={relatedAngle.id}
                onClick={() => onAngleTap?.(relatedAngle.id)}
                className="self-start mt-2 text-[13px] text-pen hover:text-ink transition-colors text-left cursor-pointer"
              >
                <span className="text-pen/60 mr-1">
                  What you could build like them →
                </span>
                <span className="font-medium text-ink underline">
                  {relatedAngle.title}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ── Right pull-quote (40% on desktop, stacks below on mobile) ─ */}
        <aside
          data-business-of-week-pullquote-wrapper=""
          className="border-t border-rule md:border-t-0 md:border-l md:border-rule flex"
          style={{ background: `var(--mood-${tint})` }}
        >
          <PullQuote text={data.pullQuote} />
        </aside>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero (image OR mood-tinted placeholder, same fallback as StoryCard)
// ─────────────────────────────────────────────────────────────────────────────

function BusinessHero({
  data,
  tint,
}: {
  data: BusinessOfTheWeek;
  tint: string;
}) {
  if (data.imageUrl) {
    return (
      <img
        data-business-of-week-hero=""
        src={data.imageUrl}
        alt={`${data.companyName} hero`}
        className="w-full block"
        style={{
          aspectRatio: "16 / 9",
          objectFit: "cover",
          borderBottom: "1px solid var(--color-rule)",
        }}
      />
    );
  }
  return (
    <div
      data-business-of-week-hero="placeholder"
      style={{
        aspectRatio: "16 / 9",
        background: `var(--mood-${tint})`,
        borderBottom: "1px solid var(--color-rule)",
      }}
      className="w-full flex items-center justify-center"
      aria-hidden="true"
    />
  );
}

function KeyStatPill({ stat }: { stat: BusinessOfTheWeekStat }) {
  return (
    <div
      data-business-of-week-stat={stat.label}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-pill border border-rule bg-paper"
    >
      <DottedText
        text={stat.label}
        dotSize={1.0}
        color="var(--color-pen)"
      />
      <DottedText
        text={stat.value}
        dotSize={1.25}
        color="var(--color-ink)"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pull-quote — dotted-typography, magazine-style
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render the pull-quote as a sequence of dotted-text words. Wrapping is
 * handled by the flex container — each word is its own SVG so the line
 * naturally breaks at word boundaries when the column narrows.
 *
 * Punctuation is preserved on the trailing edge of each word; the bitmap
 * font supports comma, period, and hyphen so this round-trips losslessly
 * through the dot grid.
 */
function PullQuote({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <blockquote
      data-business-of-week-pullquote=""
      className="px-5 md:px-6 py-6 md:py-8 flex flex-wrap gap-x-2 gap-y-1.5 self-center"
    >
      {words.map((word, i) => (
        <DottedText
          key={`${i}-${word}`}
          text={word}
          dotSize={1.75}
          color="var(--color-ink)"
        />
      ))}
    </blockquote>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip protocol + leading "www." from a URL so the link button reads as
 * "View on sarvam.ai" rather than "View on https://www.sarvam.ai/".
 * Falls back to the raw URL if parsing fails.
 */
function friendlyHost(url: string): string {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
