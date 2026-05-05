"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DottedText } from "@/components/brand/DottedText";
import { MarketPickCard } from "@/components/market/MarketPickCard";
import { RecipeSheet } from "@/components/market/RecipeSheet";
import { Button } from "@/components/ui/Button";
import type { MarketPick, RecommendedTwist } from "@/lib/market-picks";

export interface WeeklyMarketPicksProps {
  picks: readonly MarketPick[];
  globeLinkedIndex?: number | null;
}

export function WeeklyMarketPicks({
  picks,
  globeLinkedIndex = null,
}: WeeklyMarketPicksProps) {
  const [selectedPick, setSelectedPick] = useState<MarketPick | null>(
    picks[0] ?? null,
  );
  const [selectedTwistId, setSelectedTwistId] = useState(
    picks[0]?.recommendedTwists[0]?.id ?? "",
  );
  const [sheetPick, setSheetPick] = useState<MarketPick | null>(null);

  const selectedTwist = useMemo(
    () =>
      selectedPick?.recommendedTwists.find(
        (twist) => twist.id === selectedTwistId,
      ) ??
      selectedPick?.recommendedTwists[0] ??
      null,
    [selectedPick, selectedTwistId],
  );

  useEffect(() => {
    if (!selectedPick) return;
    setSelectedTwistId(selectedPick.recommendedTwists[0]?.id ?? "");
  }, [selectedPick]);

  if (!selectedPick || !selectedTwist) return null;

  const linkedPick = globeLinkedIndex == null ? null : picks[globeLinkedIndex];

  return (
    <section
      data-weekly-market-picks=""
      aria-labelledby="weekly-market-picks-heading"
      className="w-full"
    >
      <div className="mb-4 flex flex-col gap-2 md:mb-5">
        <h2 id="weekly-market-picks-heading" className="leading-none">
          <DottedText
            text="3 ideas worth copying this week"
            dotSize={1.5}
            color="var(--color-pen)"
            ariaLabel="3 ideas worth copying this week"
          />
        </h2>
        <p className="max-w-xl text-[15px] leading-relaxed text-pen md:text-[17px]">
          3 ideas worth copying this week. See what is working. Pick your
          twist. Launch a waitlist page.
        </p>
      </div>

      <div
        data-card-dock=""
        className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0"
      >
        {picks.map((pick, index) => (
          <div key={pick.id} className="min-w-[78vw] snap-center md:min-w-0">
            <MarketPickCard
              pick={pick}
              cardNumber={index + 1}
              selected={selectedPick.id === pick.id}
              linkedFromGlobe={linkedPick?.id === pick.id}
              onSelect={setSelectedPick}
            />
          </div>
        ))}
      </div>

      <div
        data-selected-opportunity=""
        className="mt-5 grid grid-cols-1 gap-4 border-y border-rule py-5 md:mt-7 md:grid-cols-[1fr_0.9fr] md:gap-6 md:py-6"
      >
        <OpportunitySummary pick={selectedPick} />
        <TwistDock
          twists={selectedPick.recommendedTwists}
          selectedTwist={selectedTwist}
          onSelect={setSelectedTwistId}
          onOpenBuildPlan={() => setSheetPick(selectedPick)}
        />
      </div>

      <RecipeSheet
        pick={sheetPick}
        open={sheetPick !== null}
        onOpenChange={(open) => {
          if (!open) setSheetPick(null);
        }}
      />
    </section>
  );
}

function OpportunitySummary({ pick }: { pick: MarketPick }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <DottedText
          text="Selected opportunity"
          dotSize={1.15}
          color="var(--color-pen)"
          ariaLabel="Selected opportunity"
        />
        <h3 className="mt-3 font-serif text-[1.8rem] leading-none text-ink md:text-[2.4rem]">
          {pick.sourcePattern}
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-3 text-[14px] leading-relaxed text-pen sm:grid-cols-2">
        <SummaryItem title="What is working" body={pick.simpleExplanation} />
        <SummaryItem title="Why this is worth testing" body={pick.whyPeoplePay} />
        <SummaryItem title="Market gap" body={pick.marketGap} />
        <SummaryItem title="What not to copy" body={pick.whatNotToCopy} />
      </div>
    </div>
  );
}

function SummaryItem({ title, body }: { title: string; body: string }) {
  return (
    <section className="border border-rule bg-card px-3 py-3">
      <h4 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink">
        {title}
      </h4>
      <p className="mt-1">{body}</p>
    </section>
  );
}

function TwistDock({
  twists,
  selectedTwist,
  onSelect,
  onOpenBuildPlan,
}: {
  twists: readonly RecommendedTwist[];
  selectedTwist: RecommendedTwist;
  onSelect: (twistId: string) => void;
  onOpenBuildPlan: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink">
          Your twist
        </h3>
        <DottedText
          text="Your twist"
          dotSize={1.15}
          color="var(--color-pen)"
          ariaLabel="Your twist"
        />
        <p className="mt-2 text-[14px] leading-relaxed text-pen">
          Choose the smaller version you would test first.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {twists.map((twist) => {
          const selected = twist.id === selectedTwist.id;
          return (
            <button
              key={twist.id}
              type="button"
              data-home-twist-option=""
              data-selected={selected ? "true" : "false"}
              onClick={() => onSelect(twist.id)}
              className={[
                "min-h-11 rounded-md border px-3 py-2 text-left transition-colors",
                selected
                  ? "border-ink bg-paper text-ink"
                  : "border-rule bg-card text-pen hover:border-ink",
              ].join(" ")}
            >
              <span className="block text-[14px] font-semibold text-ink">
                {twist.title}
              </span>
              {selected && (
                <span className="mt-1 block text-[13px] leading-relaxed">
                  {twist.simpleDescription}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="border border-rule bg-paper px-3 py-3">
        <p className="font-serif text-[1.25rem] leading-tight text-ink">
          {selectedTwist.landingPageAngle}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-pen">
          Target user: {selectedTwist.targetUser}
        </p>
      </div>

      <Button
        variant="primary"
        size="md"
        width="full"
        onClick={onOpenBuildPlan}
      >
        Build this waitlist page
        <ArrowRight size={16} aria-hidden="true" />
      </Button>
    </div>
  );
}
