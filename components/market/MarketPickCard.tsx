"use client";

import { ArrowUpRight } from "lucide-react";
import { DottedText } from "@/components/brand/DottedText";
import { Button } from "@/components/ui/Button";
import type { MarketPick } from "@/lib/market-picks";

export interface MarketPickCardProps {
  pick: MarketPick;
  onOpen: (pick: MarketPick) => void;
}

export function MarketPickCard({ pick, onOpen }: MarketPickCardProps) {
  return (
    <article
      data-market-pick-card=""
      data-market-pick-category={pick.category}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(pick)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(pick);
        }
      }}
      aria-label={`Open recipe for ${pick.companyName}`}
      className="group bg-card border border-rule rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300"
    >
      <div className="px-4 pt-4 pb-3 md:px-5 md:pt-5 border-b border-rule">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center">
            <DottedText
              text={pick.label}
              dotSize={1.25}
              color="var(--color-pen)"
              ariaLabel={pick.label}
            />
          </span>
          <ArrowUpRight
            size={17}
            className="text-pen group-hover:text-ink transition-colors shrink-0"
            aria-hidden="true"
          />
        </div>
        <p
          className="mt-5 font-serif font-semibold text-ink leading-none"
          style={{
            fontSize: "clamp(2rem, 6vw, 3rem)",
            fontVariationSettings: "'opsz' 96",
            letterSpacing: "-0.02em",
          }}
        >
          {pick.companyName}
        </p>
      </div>

      <div className="px-4 py-4 md:px-5 md:py-5 flex flex-col gap-4">
        <h3
          className="font-serif font-medium text-ink leading-tight"
          style={{
            fontSize: "clamp(1.25rem, 2.4vw, 1.625rem)",
            fontVariationSettings: "'opsz' 48",
          }}
        >
          {pick.headline}
        </h3>
        <p className="text-[15px] leading-relaxed text-pen">
          {pick.businessPattern}
        </p>
        <Button
          variant="secondary"
          size="sm"
          width="full"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(pick);
          }}
        >
          Open recipe
        </Button>
      </div>
    </article>
  );
}
