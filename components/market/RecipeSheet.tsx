"use client";

import { Check, Clipboard, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useMemo, useState } from "react";
import { DottedText } from "@/components/brand/DottedText";
import { Button } from "@/components/ui/Button";
import type { MarketPick, RecommendedTwist } from "@/lib/market-picks";

export interface RecipeSheetProps {
  pick: MarketPick | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ActiveRecipe {
  heroHeadline: string;
  subheadline: string;
  waitlistCta: string;
  landingPageSections: string[];
  whatToTrack: string[];
  aiBuildPrompt: string;
  validationPlan: string[];
  whatNotToBuildYet: string[];
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

      <div className="absolute inset-x-0 bottom-0 md:inset-y-5 md:right-5 md:left-auto md:w-[min(720px,calc(100vw-40px))]">
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
  const [selectedTwistId, setSelectedTwistId] = useState(
    pick.recommendedTwists[0]?.id ?? "",
  );
  const [customTwist, setCustomTwist] = useState("");

  useEffect(() => {
    setSelectedTwistId(pick.recommendedTwists[0]?.id ?? "");
    setCustomTwist("");
  }, [pick.id, pick.recommendedTwists]);

  const selectedTwist =
    pick.recommendedTwists.find((twist) => twist.id === selectedTwistId) ??
    pick.recommendedTwists[0];
  const activeTwist = customTwist.trim()
    ? customTwistToRecommendedTwist(pick, customTwist.trim())
    : selectedTwist;
  const recipe = useMemo(
    () => buildRecipe(pick, activeTwist),
    [pick, activeTwist],
  );

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
        <div className="grid grid-cols-1 lg:grid-cols-[0.88fr_1.12fr] gap-5 lg:gap-8">
          <div className="flex flex-col gap-4 md:gap-5">
            <RecipeSection title="This business works">
              <p className="text-ink font-medium">{pick.sourcePattern}</p>
              <p>{pick.simpleExplanation}</p>
            </RecipeSection>

            <RecipeSection title="Why this is worth testing">
              <p>{pick.whyPeoplePay}</p>
            </RecipeSection>

            <RecipeSection title="Here is the gap">
              <p>{pick.marketGap}</p>
            </RecipeSection>

            <RecipeSection title="What not to copy">
              <p>{pick.whatNotToCopy}</p>
            </RecipeSection>

            <RecipeSection title="Pick a twist">
              <TwistPicker
                twists={pick.recommendedTwists}
                selectedTwistId={selectedTwistId}
                customTwist={customTwist}
                onSelectTwist={(twistId) => {
                  setSelectedTwistId(twistId);
                  setCustomTwist("");
                }}
                onCustomTwistChange={setCustomTwist}
              />
            </RecipeSection>
          </div>

          <div className="flex flex-col gap-4 md:gap-5">
            <RecipeSection title="Your smaller version">
              <p>{pick.smallerVersion}</p>
              <HighlightBox
                title={activeTwist.title}
                body={`${activeTwist.simpleDescription} Target user: ${activeTwist.targetUser}.`}
              />
            </RecipeSection>

            <RecipeSection title="Get the waitlist page">
              <LandingPagePreview recipe={recipe} />
            </RecipeSection>

            <RecipeSection title="What to launch first">
              <OrderedList items={recipe.landingPageSections} />
            </RecipeSection>

            <RecipeSection title="What to track">
              <PlainList items={recipe.whatToTrack} />
            </RecipeSection>

            <RecipeSection title="AI build prompt">
              <PromptBlock prompt={recipe.aiBuildPrompt} />
            </RecipeSection>

            <RecipeSection title="48-hour validation">
              <OrderedList items={recipe.validationPlan} />
            </RecipeSection>

            <RecipeSection title="What not to build yet">
              <PlainList items={recipe.whatNotToBuildYet} />
            </RecipeSection>

            <RecipeSection title="Skill files">
              <PlainList items={pick.recipe.skillFiles} />
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
        text={`${pick.category} waitlist recipe`}
        dotSize={1.25}
        color="var(--color-pen)"
        ariaLabel={`${pick.category} waitlist recipe`}
      />
      <h2
        id={titleId}
        className="mt-3 font-serif font-semibold text-ink leading-tight"
        style={{
          fontSize: "clamp(1.625rem, 4.6vw, 2.5rem)",
          fontVariationSettings: "'opsz' 96",
          letterSpacing: "-0.02em",
        }}
      >
        {pick.sourcePattern}
      </h2>
      <p id={descId} className="mt-2 text-[14px] md:text-[16px] leading-relaxed text-pen max-w-2xl">
        {pick.simpleExplanation}
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
    <section className="flex flex-col gap-2 text-[14px] md:text-[15px] leading-relaxed text-pen">
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

function TwistPicker({
  twists,
  selectedTwistId,
  customTwist,
  onSelectTwist,
  onCustomTwistChange,
}: {
  twists: readonly RecommendedTwist[];
  selectedTwistId: string;
  customTwist: string;
  onSelectTwist: (twistId: string) => void;
  onCustomTwistChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {twists.map((twist) => {
        const selected = !customTwist.trim() && twist.id === selectedTwistId;
        return (
          <button
            key={twist.id}
            type="button"
            data-twist-option=""
            data-selected={selected ? "true" : "false"}
            onClick={() => onSelectTwist(twist.id)}
            className={[
              "text-left rounded-md border px-3 py-3 transition-colors cursor-pointer",
              selected
                ? "border-ink bg-paper text-ink"
                : "border-rule bg-card text-pen hover:border-ink",
            ].join(" ")}
          >
            <span className="block text-[14px] font-semibold text-ink">
              {twist.title}
            </span>
            <span className="mt-1 block text-[13px] leading-relaxed">
              {twist.simpleDescription}
            </span>
          </button>
        );
      })}
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-ink">
          Or write your own twist
        </span>
        <input
          type="text"
          value={customTwist}
          onChange={(event) => onCustomTwistChange(event.target.value)}
          placeholder="Example: for independent fitness coaches"
          className="min-h-11 rounded-md border border-rule bg-paper px-3 text-[14px] text-ink outline-none transition-colors placeholder:text-pen/60 focus:border-ink"
        />
      </label>
    </div>
  );
}

function LandingPagePreview({ recipe }: { recipe: ActiveRecipe }) {
  return (
    <div className="rounded-md border border-rule bg-paper overflow-hidden">
      <div className="border-b border-rule px-3 py-3">
        <span className="text-[12px] font-semibold text-pen">
          Suggested hero headline
        </span>
        <p className="mt-1 font-serif text-[1.25rem] leading-tight text-ink">
          {recipe.heroHeadline}
        </p>
      </div>
      <div className="px-3 py-3 flex flex-col gap-2 text-[13px] leading-relaxed">
        <p>
          <span className="font-semibold text-ink">Subheadline: </span>
          {recipe.subheadline}
        </p>
        <p>
          <span className="font-semibold text-ink">Waitlist CTA: </span>
          {recipe.waitlistCta}
        </p>
      </div>
    </div>
  );
}

function HighlightBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-rule bg-paper px-3 py-3">
      <p className="text-[14px] font-semibold text-ink">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed">{body}</p>
    </div>
  );
}

function OrderedList({ items }: { items: readonly string[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {items.map((item, index) => (
        <li key={item} className="grid grid-cols-[1.75rem_1fr] gap-2.5">
          <span className="font-serif text-ink tabular-nums leading-relaxed">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function PlainList({ items }: { items: readonly string[] }) {
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
        <span className="text-[12px] text-pen">
          For Codex, Cursor, Lovable, or Bolt
        </span>
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
      <p className="p-3 md:p-4 text-[13px] md:text-[14px] leading-relaxed text-ink whitespace-pre-line">
        {prompt}
      </p>
    </div>
  );
}

function buildRecipe(pick: MarketPick, twist: RecommendedTwist): ActiveRecipe {
  const heroHeadline = twist.landingPageAngle;
  const subheadline = `A focused waitlist page for ${twist.targetUser} who need ${twist.gapItUses.toLowerCase()}.`;
  const waitlistCta = `${pick.recipe.waitlistOffer} for ${twist.targetUser}`;

  return {
    heroHeadline,
    subheadline,
    waitlistCta,
    landingPageSections: [
      `Hero: ${heroHeadline}`,
      `Problem: name the slow manual workaround for ${twist.targetUser}.`,
      `Twist: explain ${twist.title.toLowerCase()} in one plain paragraph.`,
      ...pick.recipe.landingPageSections,
      `Waitlist: ask for email, role, and the one task they want solved first.`,
    ],
    whatToTrack: [
      "CTA clicks on the hero and final waitlist block.",
      "Waitlist form submissions by target user type.",
      "Replies that describe the same repeated pain in their own words.",
      "Requests for a demo, template, or concierge version before the product exists.",
    ],
    aiBuildPrompt: buildPrompt(pick, twist, heroHeadline, subheadline, waitlistCta),
    validationPlan: [
      `Hour 1-4: publish a mobile-first waitlist page for ${twist.targetUser}.`,
      `Hour 5-18: send the page to 25 people who match this twist: ${twist.title}.`,
      "Hour 19-30: ask five interested users what they currently use and what feels too slow.",
      `Hour 31-42: rewrite the headline around the clearest phrase from ${twist.targetUser}.`,
      "Hour 43-48: count waitlist submissions, qualified replies, and requests for a first version.",
      ...pick.recipe.validationPlan,
    ],
    whatNotToBuildYet: [
      ...pick.recipe.whatNotToBuildYet,
      `Do not build beyond ${twist.targetUser} until the waitlist shows repeated demand.`,
      `Do not copy the source company, brand, protected content, code, or full product.`,
    ],
  };
}

function buildPrompt(
  pick: MarketPick,
  twist: RecommendedTwist,
  heroHeadline: string,
  subheadline: string,
  waitlistCta: string,
) {
  return [
    "Build a mobile-first waitlist landing page, not a full app.",
    `Source pattern to study: ${pick.sourcePattern}`,
    `Do not copy the source brand, protected content, code, or full product. Extract only this mechanic: ${pick.copyableMechanic}`,
    `Selected twist: ${twist.title}`,
    `Target user: ${twist.targetUser}`,
    `Gap this uses: ${twist.gapItUses}`,
    `Why this twist can win: ${twist.whyThisTwistCanWin}`,
    `Hero headline: ${heroHeadline}`,
    `Subheadline: ${subheadline}`,
    `Waitlist CTA: ${waitlistCta}`,
    "Page sections: hero, problem, why now, how the smaller version works, waitlist form, and what the first version will not include.",
    "Acceptance criteria: mobile-first layout, clear single offer, working waitlist form UI, CTA click tracking hooks, no auth, no dashboard, no fake testimonials.",
    "Use these Catalst skill-file principles: start with the narrowest possible user; build the landing page before the product; add waitlist capture first; avoid full dashboards in v1; make every claim specific enough to test in 48 hours.",
    `Referenced skill files: ${pick.recipe.skillFiles.join(", ")}`,
  ].join("\n");
}

function customTwistToRecommendedTwist(
  pick: MarketPick,
  customTwist: string,
): RecommendedTwist {
  return {
    id: "custom-twist",
    title: customTwist,
    simpleDescription: `A custom version of this pattern for ${customTwist}.`,
    targetUser: customTwist,
    gapItUses: pick.marketGap,
    whyThisTwistCanWin:
      "It starts with one narrow audience before building the full product.",
    landingPageAngle: `A simpler ${pick.sourcePattern.toLowerCase()} for ${customTwist}`,
  };
}
