"use client";

import { Bookmark, Sparkles } from "lucide-react";
import { DottedText } from "@/components/brand/DottedText";
import { Button } from "@/components/ui/Button";
import type { MarketPick } from "@/lib/market-picks";

export interface MarketPickCardProps {
  pick: MarketPick;
  selected?: boolean;
  linkedFromGlobe?: boolean;
  cardNumber: number;
  weekLabel?: string;
  onSelect: (pick: MarketPick) => void;
}

export function MarketPickCard({
  pick,
  selected = false,
  linkedFromGlobe = false,
  cardNumber,
  weekLabel = "Week 01",
  onSelect,
}: MarketPickCardProps) {
  return (
    <article
      data-market-pick-card=""
      data-market-pick-category={pick.category}
      data-market-pick-selected={selected ? "true" : "false"}
      data-market-pick-globe-linked={linkedFromGlobe ? "true" : "false"}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(pick)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(pick);
        }
      }}
      aria-label={`Select opportunity card ${cardNumber}: ${pick.sourcePattern}`}
      aria-pressed={selected}
      className={[
        "group relative min-h-[20rem] overflow-hidden rounded-lg border bg-card text-left",
        "transition-[transform,box-shadow,border-color] duration-500 ease-out",
        "hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        selected
          ? "border-ink shadow-card-hover"
          : linkedFromGlobe
            ? "border-cta shadow-card-hover"
            : "border-rule shadow-card hover:border-ink hover:shadow-card-hover",
      ].join(" ")}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(115deg, transparent 18%, color-mix(in srgb, var(--color-cta) 18%, transparent) 38%, transparent 58%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-px rounded-[7px] border border-paper/70"
      />
      <div className="relative flex h-full min-h-[20rem] flex-col justify-between p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <DottedText
              text={pick.category}
              dotSize={1.2}
              color="var(--color-pen)"
              ariaLabel={pick.category}
            />
            <span className="text-[11px] uppercase tracking-[0.16em] text-pen">
              {weekLabel} / Card {String(cardNumber).padStart(2, "0")}
            </span>
          </div>
          <span
            aria-hidden="true"
            className={[
              "inline-flex h-8 w-8 items-center justify-center rounded-full border",
              selected ? "border-ink bg-paper" : "border-rule bg-paper/70",
            ].join(" ")}
          >
            <Sparkles size={14} className="text-ink" />
          </span>
        </div>

        <div className="py-6">
          <p
            className="font-serif font-semibold text-ink leading-[0.95]"
            style={{
              fontSize: "clamp(2.1rem, 7vw, 3rem)",
              fontVariationSettings: "'opsz' 96",
            }}
          >
            {pick.sourceCompany}
          </p>
          <h3 className="mt-4 font-serif text-[1.25rem] leading-tight text-ink">
            {pick.sourcePattern}
          </h3>
          <p className="mt-3 text-[13px] leading-relaxed text-pen">
            {pick.smallerVersion}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-rule pt-3 text-[12px] text-pen">
          <span>{pick.signalLabel}</span>
          <span className="text-right">{pick.buildDifficulty}</span>
          <span>{pick.locationLabel}</span>
          <span className="text-right">{pick.confidenceScore}/100</span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          width="full"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(pick);
          }}
        >
          Save this card
          <Bookmark size={14} aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}
