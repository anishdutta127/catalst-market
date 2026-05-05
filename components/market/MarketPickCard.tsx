"use client";

import { ArrowUpRight } from "lucide-react";
import { DottedText } from "@/components/brand/DottedText";
import { Button } from "@/components/ui/Button";
import type { MarketPick } from "@/lib/market-picks";

export interface MarketPickCardProps {
  pick: MarketPick;
  selected?: boolean;
  onSelect: (pick: MarketPick) => void;
  onOpenRecipe: (pick: MarketPick) => void;
}

export function MarketPickCard({
  pick,
  selected = false,
  onSelect,
  onOpenRecipe,
}: MarketPickCardProps) {
  return (
    <article
      data-market-pick-card=""
      data-market-pick-category={pick.category}
      data-market-pick-selected={selected ? "true" : "false"}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(pick)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(pick);
        }
      }}
      aria-label={`Select recipe for ${pick.companyName}`}
      aria-pressed={selected}
      className={[
        "group bg-card border rounded-lg overflow-hidden transition-[box-shadow,border-color] duration-300",
        selected
          ? "border-ink shadow-card-hover"
          : "border-rule shadow-card hover:shadow-card-hover",
      ].join(" ")}
    >
      <div className="px-4 pt-4 pb-3 md:px-5 md:pt-5 border-b border-rule bg-paper/60">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center">
              <DottedText
                text={pick.label}
                dotSize={1.25}
                color="var(--color-pen)"
                ariaLabel={pick.label}
              />
            </span>
            {selected && (
              <span className="inline-flex items-center">
                <DottedText
                  text="Selected recipe"
                  dotSize={1}
                  color="var(--color-cta)"
                  ariaLabel="Selected recipe"
                />
              </span>
            )}
          </div>
          <ArrowUpRight
            size={17}
            className="text-pen group-hover:text-ink transition-colors shrink-0"
            aria-hidden="true"
          />
        </div>
        <p
          className="mt-4 font-serif font-semibold text-ink leading-none"
          style={{
            fontSize: "clamp(1.875rem, 5.4vw, 2.75rem)",
            fontVariationSettings: "'opsz' 96",
            letterSpacing: "-0.02em",
          }}
        >
          {pick.companyName}
        </p>
      </div>

      <div className="px-4 py-4 md:px-5 md:py-5 flex flex-col gap-3">
        <h3
          className="font-serif font-medium text-ink leading-tight"
          style={{
            fontSize: "clamp(1.125rem, 2.1vw, 1.5rem)",
            fontVariationSettings: "'opsz' 48",
          }}
        >
          {pick.headline}
        </h3>
        <p className="text-[14px] md:text-[15px] leading-relaxed text-pen">
          {pick.businessPattern}
        </p>
        <Button
          variant="secondary"
          size="sm"
          width="full"
          onClick={(event) => {
            event.stopPropagation();
            onOpenRecipe(pick);
          }}
        >
          Read full recipe
        </Button>
      </div>
    </article>
  );
}
