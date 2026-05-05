"use client";

import { useState } from "react";
import { DottedText } from "@/components/brand/DottedText";
import { GlobeHero } from "@/components/feed/GlobeHero";
import { SectionCaption } from "@/components/feed/SectionCaption";
import { WeeklyMarketPicks } from "@/components/market/WeeklyMarketPicks";
import { StoryCard } from "@/components/story/StoryCard";
import type { MarketPick } from "@/lib/market-picks";
import type { AnyStory } from "@/lib/types/story";

export interface HomeClientProps {
  stories: AnyStory[];
  top3: AnyStory[];
  weeklyMarketPicks?: readonly MarketPick[];
}

export function HomeClient({
  stories,
  top3,
  weeklyMarketPicks,
}: HomeClientProps) {
  const [expandedSignalIdx, setExpandedSignalIdx] = useState<number | null>(null);

  return (
    <div data-home="" className="min-h-screen bg-paper text-text font-sans">
      <Header />

      <main className="max-w-[1120px] mx-auto px-4 md:px-6 pb-20">
        <HeroCopy />

        <section
          data-home-globe=""
          aria-label="Catalst Market globe"
          className="mt-5 md:mt-7 flex justify-center"
        >
          <div className="w-full max-w-[640px] border-y border-rule py-2 md:py-4">
            <GlobeHero stories={stories} showHeadline={false} />
          </div>
        </section>

        {weeklyMarketPicks && weeklyMarketPicks.length > 0 && (
          <div data-home-weekly-picks="" className="mt-8 md:mt-12">
            <WeeklyMarketPicks picks={weeklyMarketPicks} />
          </div>
        )}

        <section
          data-more-market-signals=""
          aria-labelledby="more-market-signals-heading"
          className="mt-12 md:mt-16 border-t border-rule pt-8 md:pt-10"
        >
          <SectionCaption
            id="more-market-signals-heading"
            text="More market signals"
          />
          <p className="text-[15px] leading-relaxed text-pen max-w-2xl mb-4">
            A small archive for later. Start with the three ideas above; these
            signals are secondary.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {top3.map((story, index) => (
              <StoryCard
                key={story.id}
                story={story}
                expanded={expandedSignalIdx === index}
                variant={
                  expandedSignalIdx !== null && expandedSignalIdx !== index
                    ? "compact"
                    : "default"
                }
                onExpandChange={(next) =>
                  setExpandedSignalIdx(next ? index : null)
                }
                onBuild={(storyId) =>
                  console.log(
                    `[HomeClient] Build with Catalst on ${storyId} — RecipeSheet flow owns the homepage MVP.`,
                  )
                }
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header
      data-home-header=""
      className="max-w-[1120px] mx-auto px-4 md:px-6 pt-4 pb-2 flex items-center justify-between gap-3"
    >
      <a
        href="/"
        className="font-serif font-bold text-ink leading-none cursor-pointer"
        style={{
          fontSize: "clamp(15px, 2vw, 18px)",
          fontVariationSettings: "'opsz' 24",
          letterSpacing: "-0.02em",
        }}
        aria-label="Catalst Market home"
      >
        <span className="hidden md:inline">CATALST&nbsp;MARKET</span>
        <span className="md:hidden">CATALST</span>
      </a>
      <div className="inline-flex items-center gap-2 h-8 px-3 rounded-pill bg-card border border-rule shrink-0">
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "var(--color-cta)",
          }}
        />
        <DottedText
          text="48 HOUR TEST"
          dotSize={1.1}
          color="var(--color-ink)"
          ariaLabel="48 hour test"
        />
      </div>
    </header>
  );
}

function HeroCopy() {
  return (
    <section data-home-hero-copy="" className="pt-8 md:pt-14 text-center">
      <p className="inline-flex items-center justify-center">
        <DottedText
          text="See what is working. Pick your twist. Test the page."
          dotSize={1.4}
          color="var(--color-pen)"
          ariaLabel="See what is working. Pick your twist. Test the page."
        />
      </p>
      <h1
        className="mt-4 mx-auto max-w-4xl font-serif font-semibold text-ink leading-[0.96]"
        style={{
          fontSize: "clamp(2.75rem, 9vw, 6.25rem)",
          fontVariationSettings: "'opsz' 144",
          letterSpacing: "-0.025em",
        }}
      >
        Find a business idea worth copying. Launch the waitlist in 48 hours.
      </h1>
      <p className="mt-4 mx-auto max-w-xl text-[15px] md:text-[18px] leading-relaxed text-pen">
        Each week: three simple business patterns. Pick your twist, then use an
        AI-ready waitlist page plan with a 48-hour validation path.
      </p>
    </section>
  );
}
