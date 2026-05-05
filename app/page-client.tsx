"use client";

import { useState } from "react";
import { DottedText } from "@/components/brand/DottedText";
import { GlobeHero } from "@/components/feed/GlobeHero";
import { WeeklyMarketPicks } from "@/components/market/WeeklyMarketPicks";
import type { MarketPick } from "@/lib/market-picks";
import type { AnyStory } from "@/lib/types/story";

export interface HomeClientProps {
  stories: AnyStory[];
  top3: AnyStory[];
  weeklyMarketPicks?: readonly MarketPick[];
}

export function HomeClient({
  stories,
  weeklyMarketPicks,
}: HomeClientProps) {
  const [globeLinkedIndex, setGlobeLinkedIndex] = useState<number | null>(null);
  const pickCount = weeklyMarketPicks?.length ?? 0;

  const linkGlobeToCard = (citySlug: string) => {
    if (pickCount === 0) return;
    setGlobeLinkedIndex(hashToIndex(citySlug, pickCount));
  };

  return (
    <div data-home="" className="min-h-screen bg-paper text-text font-sans">
      <Header />

      <main className="mx-auto max-w-[1120px] px-4 pb-16 md:px-6 md:pb-20">
        <GlobeStage
          stories={stories}
          onStopChange={linkGlobeToCard}
          onPinTap={linkGlobeToCard}
        />

        {weeklyMarketPicks && weeklyMarketPicks.length > 0 && (
          <div data-home-weekly-picks="" className="mt-4 md:mt-6">
            <WeeklyMarketPicks
              picks={weeklyMarketPicks}
              globeLinkedIndex={globeLinkedIndex}
            />
          </div>
        )}

        <HowItWorks />
      </main>
    </div>
  );
}

function Header() {
  return (
    <header
      data-home-header=""
      className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-4 pb-2 pt-4 md:px-6"
    >
      <a
        href="/"
        className="font-serif font-bold text-ink leading-none cursor-pointer"
        style={{
          fontSize: "clamp(15px, 2vw, 18px)",
          fontVariationSettings: "'opsz' 24",
        }}
        aria-label="Catalst Market home"
      >
        Catalst Market
      </a>
      <DottedText
        text="48 hour test"
        dotSize={1.05}
        color="var(--color-pen)"
        ariaLabel="48 hour test"
      />
    </header>
  );
}

function GlobeStage({
  stories,
  onStopChange,
  onPinTap,
}: {
  stories: AnyStory[];
  onStopChange: (citySlug: string) => void;
  onPinTap: (citySlug: string) => void;
}) {
  return (
    <section
      data-home-globe=""
      aria-label="Catalst Market discovery globe"
      className="pt-4 text-center md:pt-6"
    >
      <div className="mx-auto flex max-w-xl flex-col items-center gap-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink">
          Catalst Market
        </p>
        <DottedText
          text="Catalst Market"
          dotSize={1.2}
          color="var(--color-pen)"
          ariaLabel="Catalst Market"
        />
        <p className="text-[15px] leading-relaxed text-pen md:text-[17px]">
          3 ideas worth copying this week. See what is working. Pick your
          twist. Launch a waitlist page.
        </p>
      </div>

      <div className="mx-auto mt-2 flex max-w-[720px] justify-center border-y border-rule py-1 md:mt-3 md:py-2">
        <GlobeHero
          stories={stories}
          showHeadline={false}
          onStopChange={onStopChange}
          onPinTap={onPinTap}
        />
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <footer
      data-home-how-it-works=""
      className="mt-8 border-t border-rule pt-5 text-[13px] leading-relaxed text-pen md:mt-10"
    >
      <p>
        How it works: choose a card, choose your twist, then open the build plan
        for the waitlist page.
      </p>
    </footer>
  );
}

function hashToIndex(value: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash + value.charCodeAt(i) * (i + 1)) % length;
  }
  return hash;
}
