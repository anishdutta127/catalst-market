"use client";

import { Check, Clipboard, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
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
  aiBuildPrompt: string;
  validationPlan: string[];
  notYet: string[];
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
        className="absolute inset-0 w-full h-full bg-ink/28 cursor-default"
      />

      <div className="absolute inset-x-0 bottom-0 md:inset-y-5 md:right-5 md:left-auto md:w-[min(680px,calc(100vw-40px))]">
        <div className="bg-card border border-rule rounded-t-xl md:rounded-xl shadow-sheet max-h-[90vh] md:max-h-full overflow-hidden flex flex-col">
          <header className="px-4 py-4 md:px-6 md:py-5 border-b border-rule bg-paper">
            <div className="flex items-start justify-between gap-4">
              <RecipeHeader pick={pick} titleId={titleId} descId={descId} />
              <Button
                variant="icon"
                Icon={X}
                aria-label="Close recipe"
                onClick={() => onOpenChange(false)}
              />
            </div>
          </header>

          <div className="overflow-y-auto px-4 py-4 md:px-6 md:py-5">
            <CatalstRecipePanel pick={pick} framed={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CatalstRecipePanel({
  pick,
  framed = true,
}: {
  pick: MarketPick;
  framed?: boolean;
}) {
  const recipe = buildRecipe(pick);

  return (
    <article
      data-catalst-recipe=""
      data-catalst-recipe-category={pick.category}
      className={[
        framed && "bg-card border border-rule rounded-lg shadow-card overflow-hidden",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {framed && (
        <header className="px-4 py-4 md:px-6 md:py-5 border-b border-rule bg-paper">
          <RecipeHeader pick={pick} />
        </header>
      )}

      <div className={framed ? "px-4 py-5 md:px-6 md:py-6" : ""}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-6 lg:gap-8">
          <div className="flex flex-col gap-5">
            <RecipeSection title="Source pattern">
              <p>{recipe.sourcePattern}</p>
            </RecipeSection>

            <RecipeSection title="Why this business works">
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

            <RecipeSection title="What not to build yet">
              <PlainList items={recipe.notYet} />
            </RecipeSection>
          </div>

          <div className="flex flex-col gap-5">
            <RecipeSection title="Landing page formula">
              <OrderedList items={recipe.landingPageFormula} />
            </RecipeSection>

            <RecipeSection title="AI build prompt">
              <PromptBlock prompt={recipe.aiBuildPrompt} />
            </RecipeSection>

            <RecipeSection title="48-hour validation plan">
              <OrderedList items={recipe.validationPlan} />
            </RecipeSection>
          </div>
        </div>
      </div>
    </article>
  );
}

function RecipeHeader({
  pick,
  titleId,
  descId,
}: {
  pick: MarketPick;
  titleId?: string;
  descId?: string;
}) {
  return (
    <div className="min-w-0">
      <DottedText
        text={`${pick.label} recipe`}
        dotSize={1.25}
        color="var(--color-pen)"
        ariaLabel={`${pick.label} recipe`}
      />
      <h2
        id={titleId}
        className="mt-3 font-serif font-semibold text-ink leading-tight"
        style={{
          fontSize: "clamp(1.75rem, 5vw, 2.75rem)",
          fontVariationSettings: "'opsz' 96",
          letterSpacing: "-0.02em",
        }}
      >
        {pick.companyName}
      </h2>
      <p id={descId} className="mt-2 text-[15px] md:text-[16px] leading-relaxed text-pen max-w-2xl">
        {pick.headline}
      </p>
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
    <section className="flex flex-col gap-2.5 text-[15px] leading-relaxed text-pen">
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
    <ol className="flex flex-col gap-2.5">
      {items.map((item, index) => (
        <li key={item} className="grid grid-cols-[2rem_1fr] gap-2.5">
          <span className="font-serif text-ink tabular-nums leading-relaxed">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function PlainList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="grid grid-cols-[0.75rem_1fr] gap-2">
          <span className="mt-2 h-1.5 w-1.5 bg-pen/50" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PromptBlock({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  };

  return (
    <div className="rounded-md border border-rule bg-paper overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-rule px-3 py-2">
        <span className="text-[12px] text-pen">Ready for AI tools</span>
        <button
          type="button"
          onClick={copyPrompt}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink hover:text-cta transition-colors cursor-pointer"
        >
          {copied ? (
            <Check size={14} aria-hidden="true" />
          ) : (
            <Clipboard size={14} aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy prompt"}
        </button>
      </div>
      <p className="p-4 text-[14px] leading-relaxed text-ink whitespace-pre-line">
        {prompt}
      </p>
    </div>
  );
}

function buildRecipe(pick: MarketPick): RecipeContent {
  return {
    sourcePattern: pick.businessPattern,
    whyItWorks: pick.whyThisWeek,
    pods: podsFor(pick.category),
    landingPageFormula: [
      `Hero: name the buyer and the painful delay. Use this angle: ${pick.copyablePrompt}`,
      "Problem: show the manual workaround in one short paragraph.",
      "Workflow: preview the three-step experience a buyer would use first.",
      "Proof: anchor the page in time saved, revenue recovered, or manual steps removed.",
      "CTA: ask for a dated concierge pilot, not a generic waitlist.",
    ],
    aiBuildPrompt: [
      `Build a mobile-first landing page for this Catalst Market pattern: ${pick.businessPattern}`,
      `Use ${pick.companyName} only as source inspiration, not as a brand clone.`,
      `Target a non-technical buyer who wants this outcome: ${pick.copyablePrompt}`,
      "Create a restrained editorial page with a hero, problem section, workflow preview, proof strip, pricing anchor, and pilot CTA.",
      "Use concise third-person, present-tense copy. Avoid hype, dashboards, finance-news language, emojis, and fake testimonials.",
    ].join("\n"),
    validationPlan: [
      "Hour 1-4: write the buyer promise and publish a one-page pilot offer.",
      "Hour 5-18: message 30 target users with the before and after workflow.",
      "Hour 19-32: run five calls and ask for the current workaround, not feedback.",
      "Hour 33-44: turn repeated objections into one pricing and scope sentence.",
      "Hour 45-48: ask three users to commit to a dated pilot follow-up.",
    ],
    notYet: notYetFor(pick.category),
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

function notYetFor(category: MarketPickCategory): string[] {
  switch (category) {
    case "established":
      return [
        "Do not rebuild the full platform or payments stack.",
        "Do not sell to every merchant category on day one.",
        "Do not start with dashboards; start with one painful workflow.",
      ];
    case "startup":
      return [
        "Do not copy the logistics footprint.",
        "Do not promise instant delivery before demand is proven.",
        "Do not build a marketplace until one neighborhood repeats.",
      ];
    case "frontier":
      return [
        "Do not train a model first.",
        "Do not start with a generic chatbot.",
        "Do not support every language or role before one workflow works.",
      ];
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}
