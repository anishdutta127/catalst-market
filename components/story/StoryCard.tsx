"use client";

/**
 * StoryCard — the atomic unit of the Top 3 Today row in the WZ home feed.
 *
 * Two states, single component:
 *
 *   COLLAPSED (default) — compact ~110px tall (mobile) / ~140px (desktop)
 *     row tile. Tap anywhere to expand. Shows mood strip, founder/logo,
 *     type cassette, headline number, single-line title, city pill,
 *     expand chevron.
 *
 *   EXPANDED — fills the row, ~70vh mobile / ~600px desktop. Full photo,
 *     huge headline number, title, three microBullets, why-now line,
 *     Build CTA, "Read full" link.
 *
 * Controlled by parent (`expanded` + `onExpandChange`). Only one card per row
 * may be expanded at a time — parent enforces that. When a sibling card is
 * expanded, this card receives `variant="compact"` and dims to 30% opacity
 * (no layout shift — see brainstorm note in renderCompact below).
 *
 * Specs:
 *   MASTER §7 — Story Card recipe (mood strip, photo, headline number, etc)
 *   design-system/pages/feed.md §7d — WZ "Top 3 Today" module
 *   MASTER §6 — motion tokens (320ms easeStandard for expand)
 *   MASTER §11 — accessibility floor (touch ≥ 44px, focus ring, ESC closes)
 */

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef } from "react";
import { Cassette } from "@/components/brand/Cassette";
import { DottedText } from "@/components/brand/DottedText";
import { CITIES } from "@/components/brand/world-data";
import { Button } from "@/components/ui/Button";
import { formatHeadline } from "@/lib/headline";
import { MOOD_META } from "@/lib/moods";
import type { AnyStory } from "@/lib/types/story";

export type StoryCardVariant = "default" | "compact";

export interface StoryCardProps {
  story: AnyStory;
  /** Controlled expansion state. Undefined = uncontrolled (always collapsed). */
  expanded?: boolean;
  onExpandChange?: (next: boolean) => void;
  /** "compact" = sibling-of-expanded state (dimmed, non-interactive). */
  variant?: StoryCardVariant;
  /** Fires when user taps the Build CTA inside expanded body. */
  onBuild?: (storyId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve a 2-3 char IATA-style city label for the story's lat/lng.
 * Returns "—" if the story has no geo or no nearest city. Matches the
 * Globe component's labelShort vocabulary (single source of truth in
 * world-data.ts CITIES).
 */
function cityLabelFor(story: AnyStory): string {
  if (story.lat === undefined || story.lng === undefined) return "—";
  // Closest city by simple-distance — small N (~32) so brute-force is fine.
  let best: { slug: string; d: number } | null = null;
  for (const [slug, city] of Object.entries(CITIES)) {
    const dLat = city.lat - story.lat;
    const dLng = city.lng - story.lng;
    const d = dLat * dLat + dLng * dLng;
    if (best === null || d < best.d) best = { slug, d };
  }
  return best ? CITIES[best.slug]!.labelShort : "—";
}

/** Type label for the top-right cassette. Constraint: must use only chars
 *  supported by the 5×7 bitmap font (A-Z, 0-9, space, comma, period, hyphen,
 *  →). No ampersand (M&A renders as "MA"), no other punctuation. */
const TYPE_DISPLAY: Record<AnyStory["type"], string> = {
  funding: "FUNDING",
  launch: "LAUNCH",
  ai: "AI",
  ma: "MA",
  ipo: "IPO",
  milestone: "MILE",
  founder: "FOUNDER",
  os: "OS",
  layoff: "LAYOFF",
  shutdown: "SHUT",
  regulatory: "REG",
};

function moodStyle(story: AnyStory): { background: string; color: string } {
  const tint = MOOD_META[story.primaryMood].tint;
  return {
    background: `var(--mood-${tint})`,
    color: `var(--mood-${tint}-ink)`,
  };
}

function dottedWidth(text: string, dot: number): number {
  // 5x7 glyph width, 1-col kern between
  const len = text.length;
  if (len === 0) return 0;
  return len * 5 * dot + (len - 1) * dot;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function StoryCard(props: StoryCardProps) {
  const {
    story,
    expanded = false,
    onExpandChange,
    variant = "default",
    onBuild,
  } = props;

  const cardRef = useRef<HTMLDivElement>(null);

  // ESC key closes when expanded
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onExpandChange?.(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded, onExpandChange]);

  // Click-outside-to-close when expanded
  useEffect(() => {
    if (!expanded) return;
    const onMouseDown = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onExpandChange?.(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [expanded, onExpandChange]);

  const isCompact = variant === "compact";
  const cityLabel = cityLabelFor(story);
  const typeLabel = TYPE_DISPLAY[story.type];
  const mStyle = moodStyle(story);

  const ariaLabel = expanded
    ? `Story (expanded): ${story.title}. Press Escape to close.`
    : `Story: ${story.title}. Tap to expand.`;

  return (
    <div
      ref={cardRef}
      data-story-card=""
      data-story-id={story.id}
      data-story-type={story.type}
      data-story-mood={story.primaryMood}
      data-story-expanded={expanded ? "true" : "false"}
      data-story-variant={variant}
      role="article"
      aria-label={ariaLabel}
      aria-expanded={expanded}
      tabIndex={isCompact ? -1 : 0}
      onClick={
        isCompact || expanded ? undefined : () => onExpandChange?.(true)
      }
      onKeyDown={
        isCompact || expanded
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onExpandChange?.(true);
              }
            }
      }
      className={[
        "group relative bg-card border border-rule rounded-lg overflow-hidden",
        "transition-[opacity,box-shadow,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
        // Reduced-motion: globals.css forces transition-duration ~0ms,
        // so the change becomes a 1-frame opacity flip rather than a slide.
        expanded
          ? "shadow-sheet"
          : "shadow-card hover:shadow-card-hover cursor-pointer",
        isCompact && "opacity-30 pointer-events-none",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        // willChange hint only when sibling is expanded — opacity tween is hot.
        willChange: isCompact ? "opacity" : undefined,
      }}
    >
      {/* Mood strip — always visible, height matches state */}
      <div
        data-story-mood-strip=""
        style={{
          ...mStyle,
          height: expanded ? 24 : 12,
        }}
        className="w-full transition-[height] duration-300 ease-[cubic-bezier(0.2,0,0,1)] flex items-center px-3"
      >
        {expanded && (
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: mStyle.color }}
          >
            {MOOD_META[story.primaryMood].emoji}{" "}
            {MOOD_META[story.primaryMood].label}
          </span>
        )}
      </div>

      {expanded ? (
        <ExpandedBody
          story={story}
          cityLabel={cityLabel}
          typeLabel={typeLabel}
          onBuild={onBuild}
          onClose={() => onExpandChange?.(false)}
        />
      ) : (
        <CollapsedBody
          story={story}
          cityLabel={cityLabel}
          typeLabel={typeLabel}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Collapsed body (~110px content area mobile / ~140px desktop)
// ─────────────────────────────────────────────────────────────────────────────

function CollapsedBody({
  story,
  cityLabel,
  typeLabel,
}: {
  story: AnyStory;
  cityLabel: string;
  typeLabel: string;
}) {
  const headline = story.headlineNumber;
  const isFounder = story.type === "founder";

  // Type cassette is shared between layouts. Stays in the top-right per
  // user feedback: "i love the dotted accent for the type on the card
  // really fits the style." Don't refactor what's loved.
  const typeCassette = (
    <Cassette
      contentWidth={dottedWidth(typeLabel, 1.5)}
      contentHeight={7 * 1.5}
      variant="pin-label"
      dotSize={1}
      padding={{ x: 3, y: 2 }}
      fill={`var(--mood-${MOOD_META[story.primaryMood].tint})`}
      ariaLabel={`Story type: ${typeLabel}`}
    >
      <DottedText text={typeLabel} dotSize={1.5} color="var(--color-ink)" />
    </Cassette>
  );

  const cityRow = (
    <div className="flex items-center justify-between mt-1">
      <div className="flex items-center gap-1.5">
        <CityPill label={cityLabel} />
        {!story.verified && (
          <span
            data-story-unverified=""
            className="text-[10px] uppercase tracking-wider text-pen/60"
          >
            [unverified]
          </span>
        )}
      </div>
      <ChevronDown
        size={14}
        className="text-pen group-hover:text-ink transition-colors"
        aria-hidden="true"
      />
    </div>
  );

  // ── Founder layout (vertical) ─────────────────────────────────────────────
  // Founder stories have no headline number — the face IS the hero. Stack
  // vertically with the face centered, title beneath. Diverging from the
  // horizontal default keeps the founder card readable as a portrait card.
  if (isFounder) {
    return (
      <div
        data-story-collapsed-body=""
        data-layout="vertical-founder"
        className="px-3 py-2.5 md:px-4 md:py-3 flex flex-col gap-1.5 relative"
        style={{ minHeight: 98 }}
      >
        <div className="absolute right-3 top-2.5 md:right-4 md:top-3">
          {typeCassette}
        </div>
        <div className="flex flex-col items-center justify-center gap-1.5 mt-auto mb-auto">
          <PlaceholderFace story={story} size={56} mdSize={72} />
          <p
            data-story-title=""
            className="text-[13px] md:text-[14px] leading-tight text-pen line-clamp-1 text-center max-w-[88%]"
          >
            {story.title}
          </p>
        </div>
        {cityRow}
      </div>
    );
  }

  // ── Default layout (horizontal) ───────────────────────────────────────────
  // Logo on the left, headline number + title stacked on the right. Frees
  // the vertical stack so the headline number can scale up (32-40px instead
  // of 24-36px). Per user feedback: "the colored square above the number
  // is a waste of space, can we stack them horizontally instead."
  return (
    <div
      data-story-collapsed-body=""
      data-layout="horizontal"
      className="px-3 py-2.5 md:px-4 md:py-3 flex flex-col gap-1.5 relative"
      style={{ minHeight: 98 }}
    >
      <div className="absolute right-3 top-2.5 md:right-4 md:top-3 z-10">
        {typeCassette}
      </div>
      <div
        data-story-collapsed-main=""
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <PlaceholderFace story={story} size={40} mdSize={48} />
        <div
          data-story-collapsed-right=""
          className="flex flex-col min-w-0 flex-1 pr-12"
        >
          {headline && (
            <p
              data-story-headline-number=""
              className="font-serif font-semibold leading-none text-ink"
              style={{
                // 32px mobile → 40px desktop. opsz scales accordingly:
                // smaller opsz=64 on mobile, opsz=96 on desktop.
                fontSize: "clamp(2rem, 3.4vw, 2.5rem)",
                fontVariationSettings: "'opsz' 80",
                letterSpacing: "-0.02em",
              }}
            >
              {formatHeadline(headline)}
            </p>
          )}
          <p
            data-story-title=""
            className="text-[13px] md:text-[14px] leading-tight text-pen line-clamp-1"
            style={{ marginTop: headline ? 4 : 0 }}
          >
            {story.title}
          </p>
        </div>
      </div>
      {cityRow}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Expanded body
// ─────────────────────────────────────────────────────────────────────────────

function ExpandedBody({
  story,
  cityLabel,
  typeLabel,
  onBuild,
  onClose,
}: {
  story: AnyStory;
  cityLabel: string;
  typeLabel: string;
  onBuild?: (storyId: string) => void;
  onClose: () => void;
}) {
  const headline = story.headlineNumber;
  const isFounder = story.type === "founder";

  return (
    <div
      data-story-expanded-body=""
      className="flex flex-col"
      style={{ minHeight: "min(70vh, 600px)" }}
    >
      {/* Close affordance — top-right floating */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close expanded story"
        className="absolute right-3 top-7 md:top-8 z-10 inline-flex h-11 w-11 items-center justify-center rounded-md text-ink/70 hover:text-ink hover:bg-paper transition-colors cursor-pointer"
      >
        <ChevronUp size={20} aria-hidden="true" />
      </button>

      {/* Photo region (4:3) — placeholder for now since seed has no faces */}
      <PlaceholderPhoto story={story} large={isFounder} />

      <div className="px-4 md:px-6 py-4 md:py-5 flex flex-col gap-3 flex-1">
        {/* Type cassette + city pill row */}
        <div className="flex items-center justify-between gap-2">
          <Cassette
            contentWidth={dottedWidth(typeLabel, 2)}
            contentHeight={7 * 2}
            variant="pin-label"
            dotSize={1.5}
            fill={`var(--mood-${MOOD_META[story.primaryMood].tint})`}
            ariaLabel={`Story type: ${typeLabel}`}
          >
            <DottedText text={typeLabel} dotSize={2} color="var(--color-ink)" />
          </Cassette>
          <div className="flex items-center gap-2">
            <CityPill label={cityLabel} large />
            {!story.verified && (
              <span
                data-story-unverified=""
                className="text-[11px] uppercase tracking-wider text-pen/60"
              >
                [unverified]
              </span>
            )}
          </div>
        </div>

        {/* Huge headline number */}
        {headline && (
          <p
            data-story-headline-number=""
            className="font-serif font-bold leading-[0.9] text-ink"
            style={{
              fontSize: "clamp(3rem, 9vw, 4rem)", // 48-64px
              fontVariationSettings: "'opsz' 144",
              letterSpacing: "-0.02em",
            }}
          >
            {formatHeadline(headline)}
          </p>
        )}

        {/* Title */}
        <h2
          data-story-title=""
          className="font-serif font-medium text-[20px] md:text-[22px] leading-tight text-ink line-clamp-2"
          style={{ fontVariationSettings: "'opsz' 48" }}
        >
          {story.title}
        </h2>

        {/* Micro-bullets */}
        {story.microBullets.length > 0 && (
          <ul
            data-story-microbullets=""
            className="flex flex-col gap-1.5 text-[15px] text-pen leading-snug"
          >
            {story.microBullets.map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-pen/40 select-none" aria-hidden="true">
                  ·
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Why-now */}
        {story.whyNow && (
          <p
            data-story-whynow=""
            className="font-serif italic text-[14px] text-pen mt-1"
          >
            Why now: {story.whyNow}
          </p>
        )}

        {/* Footer actions */}
        <div className="mt-auto pt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <Button
            variant="primary"
            size="md"
            width="full"
            onClick={() => onBuild?.(story.id)}
          >
            Build with Catalst →
          </Button>
          <a
            href={`/story/${story.id}`}
            data-story-readfull=""
            className="text-[13px] text-pen hover:text-ink transition-colors text-center md:text-right"
            onClick={(e) => e.stopPropagation()}
          >
            Read full →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-elements
// ─────────────────────────────────────────────────────────────────────────────

function CityPill({ label, large = false }: { label: string; large?: boolean }) {
  const dot = large ? 1.5 : 1.25;
  return (
    <span
      data-story-city-pill=""
      data-story-city={label}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border border-rule bg-paper"
    >
      <DottedText text={label} dotSize={dot} color="var(--color-pen)" />
    </span>
  );
}

/**
 * Placeholder for the small face/logo on the collapsed card. Real photo
 * support lands when seed stories carry founderFaceUrl / companyLogoUrl
 * (currently empty). Renders as a mood-tinted square with the city label
 * dotted inside — stays on-brand instead of an empty gray box.
 */
function PlaceholderFace({
  story,
  size,
  mdSize,
}: {
  story: AnyStory;
  size: number;
  mdSize: number;
}) {
  const tint = MOOD_META[story.primaryMood].tint;
  if (story.founderFaceUrl || story.companyLogoUrl) {
    const src = (story.founderFaceUrl ?? story.companyLogoUrl)!;
    return (
      <img
        data-story-face=""
        src={src}
        alt={story.title}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: "var(--radius-sm)",
          boxShadow: `0 0 0 1px var(--mood-${tint})`,
          objectFit: "cover",
        }}
        className={`md:w-[${mdSize}px] md:h-[${mdSize}px]`}
      />
    );
  }
  return (
    <div
      data-story-face="placeholder"
      style={{
        width: size,
        height: size,
        background: `var(--mood-${tint})`,
        borderRadius: "var(--radius-sm)",
      }}
      className="flex items-center justify-center shrink-0"
      aria-hidden="true"
    />
  );
}

function PlaceholderPhoto({ story, large }: { story: AnyStory; large?: boolean }) {
  const tint = MOOD_META[story.primaryMood].tint;
  if (story.founderFaceUrl || story.companyLogoUrl) {
    const src = (story.founderFaceUrl ?? story.companyLogoUrl)!;
    return (
      <img
        data-story-photo=""
        src={src}
        alt={story.title}
        className="w-full block"
        style={{
          aspectRatio: "4 / 3",
          objectFit: "cover",
          borderBottom: "1px solid var(--color-rule)",
        }}
      />
    );
  }
  // Placeholder: mood-tinted block at 4:3, with optional founder-large hint.
  return (
    <div
      data-story-photo="placeholder"
      style={{
        aspectRatio: large ? "1 / 1" : "4 / 3",
        background: `var(--mood-${tint})`,
        borderBottom: "1px solid var(--color-rule)",
      }}
      className="w-full"
      aria-hidden="true"
    />
  );
}
