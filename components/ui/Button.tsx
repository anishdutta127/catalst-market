"use client";

import { Loader2, type LucideIcon } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { useEffect } from "react";

/**
 * Button — the four-variant primitive that the Build CTA, secondary
 * actions, tertiary text actions, and icon-only chrome all compose from.
 *
 * Source of truth: design-system/MASTER.md §6 (motion), §7 (Build CTA spec),
 * §9 (anti-patterns — no scale-on-hover, no glass).
 *
 * Tokens consumed via Tailwind config (which references CSS vars in
 * app/globals.css): bg-cta, text-ink, text-pen, rounded-pill, etc.
 *
 * Width default: primary defaults to full-width (the Build CTA pattern);
 * everything else defaults to auto. Override with `width="auto" | "full"`.
 */

type Size = "sm" | "md" | "lg";
type Width = "auto" | "full";

type CommonProps = {
  size?: Size;
  width?: Width;
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  type?: "button" | "submit" | "reset";
};

type TextButtonProps = CommonProps & {
  variant: "primary" | "secondary" | "ghost";
  children: ReactNode;
  Icon?: never;
  "aria-label"?: string;
};

type IconButtonProps = CommonProps & {
  variant: "icon";
  Icon: LucideIcon;
  "aria-label": string; // required at the type level
  children?: never;
};

export type ButtonProps = TextButtonProps | IconButtonProps;

// MASTER §6 motion primitives — these are the literal hex states for the
// Build CTA only; everything else uses token-driven hovers.
const CTA_HOVER = "hover:bg-[#E63E3E]";
const CTA_ACTIVE = "active:bg-[#D33636]";

const BASE =
  "inline-flex items-center justify-center font-sans font-semibold cursor-pointer " +
  "transition-colors duration-200 ease-[cubic-bezier(0.2,0,0,1)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const VARIANT: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: `bg-cta text-white rounded-pill ${CTA_HOVER} ${CTA_ACTIVE} btn-tap-pulse`,
  secondary: "bg-transparent text-ink border border-rule rounded-pill hover:bg-paper",
  ghost: "bg-transparent text-pen rounded-pill hover:text-ink",
  icon: "bg-transparent text-ink rounded-md hover:bg-paper",
};

// Heights honour MASTER §10 (≥44px touch target on mobile) and the
// user-spec primary pattern (48px mobile, 44px desktop) for the md size.
const SIZE: Record<NonNullable<ButtonProps["variant"]>, Record<Size, string>> = {
  primary: {
    sm: "h-11 px-4 text-sm",
    md: "h-12 md:h-11 px-5 text-base",
    lg: "h-14 px-6 text-base",
  },
  secondary: {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-5 text-base",
    lg: "h-12 px-6 text-base",
  },
  ghost: {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-base",
    lg: "h-12 px-5 text-base",
  },
  icon: {
    sm: "h-11 w-11",
    md: "h-11 w-11",
    lg: "h-12 w-12",
  },
};

function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Button(props: ButtonProps) {
  const {
    variant,
    size = "md",
    disabled,
    loading,
    onClick,
    className,
    type = "button",
  } = props;

  const width = props.width ?? (variant === "primary" ? "full" : "auto");
  const isDisabled = Boolean(disabled || loading);
  const ariaLabel = props["aria-label"];

  // Runtime guard — TS already enforces aria-label on icon variant for
  // typed callers, but JS callers and `@ts-expect-error` cases need this.
  useEffect(() => {
    if (variant === "icon" && !ariaLabel) {
      console.warn(
        "Button: variant='icon' requires aria-label for screen readers.",
      );
    }
  }, [variant, ariaLabel]);

  let inner: ReactNode;
  if (loading) {
    inner = (
      <Loader2
        size={variant === "icon" ? 18 : 20}
        className="animate-spin"
        data-spinner=""
        aria-hidden="true"
      />
    );
  } else if (variant === "icon") {
    inner = <props.Icon size={20} aria-hidden="true" />;
  } else {
    inner = props.children;
  }

  return (
    <button
      type={type}
      data-variant={variant}
      data-size={size}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      className={cn(
        BASE,
        VARIANT[variant],
        SIZE[variant][size],
        width === "full" && variant !== "icon" && "w-full",
        className,
      )}
    >
      {inner}
    </button>
  );
}
