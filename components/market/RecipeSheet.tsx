"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId } from "react";
import { DottedText } from "@/components/brand/DottedText";
import { Button } from "@/components/ui/Button";
import type { MarketPick, MarketPickCategory } from "@/lib/market-picks";

export interface RecipeSheetProps {
  pick: MarketPick | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RecipeContent {
  sourcePattern: string;
  whyItWorks: string;
  pods: string[];
  landingPageFormula: string[];
  aiBuildInstructions: string;
  validationPlan: string[];
}

export function RecipeSheet({ pick, open, onOpenChange }: RecipeSheetProps) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || !pick) return null;

  const recipe = buildRecipe(pick);

  return (
    <div
      data-recipe-sheet=""
      data-recipe-sheet-category={pick.category}
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <button
        type="button"
        aria-label="Close recipe"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 w-full h-full bg-ink/24 cursor-default"
      />

      <div className="absolute inset-x-0 bottom-0 md:inset-y-6 md:right-6 md:left-auto md:w-[min(560px,calc(100vw-48px))]">
        <div className="bg-card border border-rule rounded-t-xl md:rounded-xl shadow-sheet max-h-[88vh] md:max-h-full overflow-hidden flex flex-col">
          <header className="px-4 py-4 md:px-6 md:py-5 border-b border-rule bg-paper">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <DottedText
                  text={`${pick.label} pattern`}
                  dotSize={1.25}
                  color="var(--color-pen)"
                  ariaLabel={`${pick.label} pattern`}
                />
                <h2
                  id={titleId}
                  className="mt-3 font-serif font-semibold text-ink leading-tight"
                  style={{
                    fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                    fontVariationSettings: "'opsz' 96",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {pick.companyName}
                </h2>
                <p id={descId} className="mt-2 text-[15px] leading-relaxed text-pen">
                  {pick.headline}
                </p>
              </div>
              <Button
                variant="icon"
                Icon={X}
                aria-label="Close recipe"
                onClick={() => onOpenChange(false)}
              />
            </div>
          </header>

          <div className="overflow-y-auto px-4 py-4 md:px-6 md:py-5">
            <div className="flex flex-col gap-6">
              <RecipeSection title="Source pattern">
                <p>{recipe.sourcePattern}</p>
              </RecipeSection>

              <RecipeSection title="Why it works">
                <p>{recipe.whyItWorks}</p>
              </RecipeSection>

              <RecipeSection title="Recommended PODs">
                <div className="flex flex-wrap gap-2">
                  {recipe.pods.map((pod) => (
                    <span
                      key={pod}
                      className="inline-flex rounded-pill border border-rule bg-paper px-3 py-1.5 text-[13px] text-ink"
                    >
                      {pod}
                    </span>
                  ))}
                </div>
              </RecipeSection>

              <RecipeSection title="Landing page formula">
                <OrderedList items={recipe.landingPageFormula} />
              </RecipeSection>

              <RecipeSection title="AI build instructions">
                <div className="rounded-md border border-rule bg-paper p-4">
                  <p className="text-[14px] leading-relaxed text-ink whitespace-pre-line">
                    {recipe.aiBuildInstructions}
                  </p>
                </div>
              </RecipeSection>

              <RecipeSection title="48-hour validation plan">
                <OrderedList items={recipe.validationPlan} />
              </RecipeSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecipeSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 text-[15px] leading-relaxed text-pen">
      <h3 className="leading-none">
        <DottedText
          text={title}
          dotSize={1.1}
          color="var(--color-pen)"
          ariaLabel={title}
        />
      </h3>
      {children}
    </section>
  );
}

function OrderedList({ items }: { items: string[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {items.map((item, index) => (
        <li key={item} className="flex gap-3">
          <span className="font-serif text-ink tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function buildRecipe(pick: MarketPick): RecipeContent {
  return {
    sourcePattern: pick.businessPattern,
    whyItWorks: pick.whyThisWeek,
    pods: podsFor(pick.category),
    landingPageFormula: [
      `Lead with the specific buyer and painful delay: ${pick.copyablePrompt}`,
      "Show the before state in one sentence, then the faster after state.",
      "Add one proof block: time saved, money recovered, or manual steps removed.",
      "Close with a single waitlist or concierge pilot CTA.",
    ],
    aiBuildInstructions: [
      `Build a mobile-first landing page for this Catalst Market pattern: ${pick.businessPattern}`,
      `Use ${pick.companyName} only as source inspiration, not as a brand clone.`,
      "Create a restrained editorial page with a hero, problem section, workflow preview, proof strip, pricing anchor, and pilot CTA.",
      "Write third-person, present-tense copy for non-technical builders. Avoid hype, dashboards, and finance-news language.",
    ].join("\n"),
    validationPlan: [
      "Hour 1-4: write the buyer promise and publish a one-page waitlist.",
      "Hour 5-18: message 30 target users with the before and after workflow.",
      "Hour 19-32: run five calls and ask for the current workaround, not feedback.",
      "Hour 33-48: ask three users to commit to a pilot with a dated follow-up.",
    ],
  };
}

function podsFor(category: MarketPickCategory): string[] {
  switch (category) {
    case "established":
      return ["Merchant ops", "Compliance helper", "Workflow add-on"];
    case "startup":
      return ["Neighborhood service", "Repeat purchase tool", "Local supply layer"];
    case "frontier":
      return ["Language workflow", "Vertical AI wrapper", "Trust and review layer"];
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}
