"use client";

import { useState } from "react";
import { DottedText } from "@/components/brand/DottedText";
import { MarketPickCard } from "@/components/market/MarketPickCard";
import { RecipeSheet } from "@/components/market/RecipeSheet";
import type { MarketPick } from "@/lib/market-picks";

export interface WeeklyMarketPicksProps {
  picks: readonly MarketPick[];
}

export function WeeklyMarketPicks({ picks }: WeeklyMarketPicksProps) {
  const [activePick, setActivePick] = useState<MarketPick | null>(null);

  return (
    <section
      data-weekly-market-picks=""
      aria-labelledby="weekly-market-picks-heading"
      className="w-full"
    >
      <div className="mb-4 md:mb-5 flex flex-col gap-2">
        <h2 id="weekly-market-picks-heading" className="leading-none">
          <DottedText
            text="Businesses of the week"
            dotSize={1.5}
            color="var(--color-pen)"
            ariaLabel="Businesses of the week"
          />
        </h2>
        <p className="font-serif text-ink leading-tight max-w-2xl text-[1.5rem] md:text-[2rem]">
          Three patterns worth copying before they become obvious.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {picks.map((pick) => (
          <MarketPickCard
            key={pick.category}
            pick={pick}
            onOpen={setActivePick}
          />
        ))}
      </div>

      <RecipeSheet
        pick={activePick}
        open={activePick !== null}
        onOpenChange={(open) => {
          if (!open) setActivePick(null);
        }}
      />
    </section>
  );
}
