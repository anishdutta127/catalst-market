"use client";

import type { MouseEvent, ReactNode } from "react";
import type { Mood, Stage } from "@/lib/types/story";
import { MOOD_META } from "@/lib/moods";

/**
 * Chip — the filter-row primitive. Four variants:
 *
 *   neutral  — default chip, used in generic filter rows
 *   mood     — mood-lens chip; renders the mood emoji as content (per
 *              MASTER §9, emojis are content, not icons). When active,
 *              fills with `var(--mood-{tint})`.
 *   stage    — segmented-toggle chip for empires / builders /
 *              bootstrappers. Active fills with `--color-ink` and white
 *              text; inactive is transparent with `--color-pen` text.
 *   industry — like neutral, with an optional 6px Coral hot-dot
 *              indicator (top-right) when `hot` is true.
 *
 * Tokens consumed via Tailwind config or inline `var(--...)` for the
 * mood case (Tailwind static class names can't interpolate dynamically).
 */

type CommonProps = {
  active?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
};

type NeutralChipProps = CommonProps & {
  variant: "neutral";
  mood?: never;
  stage?: never;
  hot?: never;
};

type MoodChipProps = CommonProps & {
  variant: "mood";
  mood: Mood;
  stage?: never;
  hot?: never;
};

type StageChipProps = CommonProps & {
  variant: "stage";
  stage: Stage;
  mood?: never;
  hot?: never;
};

type IndustryChipProps = CommonProps & {
  variant: "industry";
  hot?: boolean;
  mood?: never;
  stage?: never;
};

export type ChipProps =
  | NeutralChipProps
  | MoodChipProps
  | StageChipProps
  | IndustryChipProps;

const BASE =
  "relative inline-flex items-center justify-center gap-1.5 h-9 px-3.5 " +
  "font-sans font-medium text-sm rounded-pill cursor-pointer " +
  "transition-all duration-150 ease-[cubic-bezier(0.2,0,0,1)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2";

const NEUTRAL_INACTIVE =
  "bg-card text-pen border border-rule hover:text-ink";
const NEUTRAL_ACTIVE = "bg-ink text-white border border-transparent";

const STAGE_INACTIVE = "bg-transparent text-pen border border-transparent hover:text-ink";
const STAGE_ACTIVE = "bg-ink text-white border border-transparent";

function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Chip(props: ChipProps) {
  const { variant, active = false, onClick, className, children } = props;
  const ariaLabel = props["aria-label"];

  // Resolve variant-specific styling.
  let variantClass = "";
  let inlineStyle: React.CSSProperties | undefined;
  let prefix: ReactNode = null;
  let suffix: ReactNode = null;

  if (variant === "neutral") {
    variantClass = active ? NEUTRAL_ACTIVE : NEUTRAL_INACTIVE;
  } else if (variant === "mood") {
    const meta = MOOD_META[props.mood];
    variantClass = active ? "border border-transparent" : NEUTRAL_INACTIVE;
    if (active) {
      inlineStyle = {
        background: `var(--mood-${meta.tint})`,
        color: `var(--mood-${meta.tint}-ink)`,
      };
    }
    // Emoji is content, not an icon. Render as text inside an aria-hidden
    // span so screen readers don't double-read with the label.
    prefix = (
      <span aria-hidden="true" className="text-base leading-none">
        {meta.emoji}
      </span>
    );
  } else if (variant === "stage") {
    variantClass = active ? STAGE_ACTIVE : STAGE_INACTIVE;
  } else if (variant === "industry") {
    variantClass = active ? NEUTRAL_ACTIVE : NEUTRAL_INACTIVE;
    if (props.hot) {
      suffix = (
        <span
          data-hot-dot=""
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 w-1.5 h-1.5 rounded-full bg-cta"
        />
      );
    }
  }

  return (
    <button
      type="button"
      data-variant={variant}
      data-active={active ? "true" : undefined}
      aria-pressed={active}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(BASE, variantClass, className)}
      style={inlineStyle}
    >
      {prefix}
      <span>{children}</span>
      {suffix}
    </button>
  );
}
