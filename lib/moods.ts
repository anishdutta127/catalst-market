import type { Mood } from "./types/story";

/**
 * Per-mood display metadata used by the StoryCard top strip and the
 * mood-lens chip row.
 *
 * - `tint`  — the CSS variable suffix. The tint color lives in
 *             app/globals.css as `--mood-{tint}` and `--mood-{tint}-ink`.
 *             Two moods share no tint; the mapping is bijective.
 * - `emoji` — content character (NOT a UI icon, per MASTER §9). Only
 *             rendered inside mood chips and Story Card top strips.
 * - `label` — human-readable display string.
 */
export type MoodMeta = {
  readonly tint:
    | "ember"
    | "moss"
    | "brass"
    | "cobalt"
    | "slate-sage"
    | "lemon"
    | "rose-clay"
    | "olive-gold"
    | "saffron";
  readonly emoji: string;
  readonly label: string;
};

export const MOOD_META: Readonly<Record<Mood, MoodMeta>> = {
  "blowing-up": { tint: "ember", emoji: "🔥", label: "Blowing up" },
  "underdog-wins": { tint: "moss", emoji: "🌱", label: "Underdog wins" },
  "bootstrapped-millions": {
    tint: "brass",
    emoji: "🪙",
    label: "Bootstrapped to millions",
  },
  "overnight-rockets": {
    tint: "cobalt",
    emoji: "🚀",
    label: "Overnight rockets",
  },
  "quiet-builders": {
    tint: "slate-sage",
    emoji: "🧠",
    label: "Quiet builders",
  },
  "copy-able-ideas": { tint: "lemon", emoji: "💡", label: "Copy-able ideas" },
  "founders-like-me": {
    tint: "rose-clay",
    emoji: "🎯",
    label: "Founders like me",
  },
  "big-money-moves": {
    tint: "olive-gold",
    emoji: "💸",
    label: "Big money moves",
  },
  "india-shipping": { tint: "saffron", emoji: "🇮🇳", label: "India shipping" },
};
