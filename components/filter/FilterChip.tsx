"use client";

/**
 * FilterChip — persistent handle for the universal filter.
 *
 * Two layout variants:
 *   "inline"   — used in module A on desktop, sits beside the wordmark.
 *                Standard pill chip styling, rule border when inactive,
 *                Coral inset ring when isActive.
 *   "floating" — used as the bottom-right floating chip on mobile.
 *                glass-chrome bg, subtly elevated, larger touch target.
 *
 * Tap fires `onOpen()` — parent owns the palette open state and the
 * Cmd+K key listener (FilterChip is a passive trigger).
 */

import { Sliders } from "lucide-react";
import { DottedText } from "@/components/brand/DottedText";
import { useFilter } from "@/lib/filter/useFilter";

export type FilterChipVariant = "inline" | "floating";

export interface FilterChipProps {
  variant?: FilterChipVariant;
  onOpen: () => void;
}

export function FilterChip({ variant = "inline", onOpen }: FilterChipProps) {
  const { chipLabel, isActive } = useFilter();

  if (variant === "floating") {
    return (
      <button
        type="button"
        data-filter-chip=""
        data-filter-chip-variant="floating"
        data-filter-chip-active={isActive ? "true" : "false"}
        onClick={onOpen}
        aria-label={`Open filter (${chipLabel})`}
        className={[
          "fixed bottom-4 right-4 z-40 inline-flex items-center gap-2",
          "h-12 px-4 rounded-pill glass-chrome shadow-card",
          "text-ink hover:text-ink",
          "transition-shadow hover:shadow-card-hover cursor-pointer",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2",
          isActive ? "ring-2 ring-cta" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Sliders size={14} aria-hidden="true" />
        <span data-filter-chip-label="" data-filter-chip-label-text={chipLabel}>
          <DottedText
            text={chipLabel}
            dotSize={1.25}
            color="var(--color-ink)"
          />
        </span>
      </button>
    );
  }

  // inline
  return (
    <button
      type="button"
      data-filter-chip=""
      data-filter-chip-variant="inline"
      data-filter-chip-active={isActive ? "true" : "false"}
      onClick={onOpen}
      aria-label={`Open filter (${chipLabel})`}
      className={[
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-pill",
        "text-ink",
        "transition-colors cursor-pointer",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2",
        isActive
          ? "bg-card ring-2 ring-cta"
          : "bg-card border border-rule hover:border-pen",
      ].join(" ")}
    >
      <Sliders size={12} aria-hidden="true" className="text-pen" />
      <span data-filter-chip-label="" data-filter-chip-label-text={chipLabel}>
        <DottedText
          text={chipLabel}
          dotSize={1.25}
          color="var(--color-ink)"
        />
      </span>
    </button>
  );
}
