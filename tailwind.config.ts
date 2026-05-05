import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

/**
 * Catalst Market — Tailwind config.
 *
 * Source of truth: design-system/MASTER.md
 * All tokens here are REFERENCES to CSS variables defined in app/globals.css.
 * Never paste a literal hex / px here — change it in MASTER, port to globals.css,
 * and Tailwind picks it up via these var() bindings.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    // Replace, don't extend — MASTER §10 mobile-first ladder.
    screens: {
      sm: "375px",
      md: "768px",
      lg: "1024px",
      xl: "1440px",
    },
    extend: {
      colors: {
        ink: "var(--color-ink)",
        pen: "var(--color-pen)",
        cta: "var(--color-cta)",
        paper: "var(--color-paper)",
        card: "var(--color-card)",
        text: "var(--color-text)",
        rule: "var(--color-rule)",
        mood: {
          ember: "var(--mood-ember)",
          "ember-ink": "var(--mood-ember-ink)",
          moss: "var(--mood-moss)",
          "moss-ink": "var(--mood-moss-ink)",
          brass: "var(--mood-brass)",
          "brass-ink": "var(--mood-brass-ink)",
          cobalt: "var(--mood-cobalt)",
          "cobalt-ink": "var(--mood-cobalt-ink)",
          "slate-sage": "var(--mood-slate-sage)",
          "slate-sage-ink": "var(--mood-slate-sage-ink)",
          lemon: "var(--mood-lemon)",
          "lemon-ink": "var(--mood-lemon-ink)",
          "rose-clay": "var(--mood-rose-clay)",
          "rose-clay-ink": "var(--mood-rose-clay-ink)",
          "olive-gold": "var(--mood-olive-gold)",
          "olive-gold-ink": "var(--mood-olive-gold-ink)",
          saffron: "var(--mood-saffron)",
          "saffron-ink": "var(--mood-saffron-ink)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        16: "var(--space-16)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        sheet: "var(--shadow-sheet)",
        toast: "var(--shadow-toast)",
      },
      // MASTER §4 type scale. Hero sets opsz 144 via font-variation-settings
      // applied at the component level (Tailwind can't emit it from fontSize).
      fontSize: {
        hero: [
          "clamp(2.75rem, 9vw, 5.5rem)",
          { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        h1: ["2rem", { lineHeight: "1.1", fontWeight: "600" }],
        h2: ["1.5rem", { lineHeight: "1.2", fontWeight: "500" }],
        h3: ["1.25rem", { lineHeight: "1.3", fontWeight: "500" }],
        body: ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        caption: [
          "0.8125rem",
          { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "500" },
        ],
        label: [
          "0.75rem",
          { lineHeight: "1.3", letterSpacing: "0.06em", fontWeight: "600" },
        ],
      },
    },
  },
  plugins: [
    // MASTER §5 — register Glass tokens as Tailwind utilities so IntelliSense /
    // @apply / class scanning all see them. The @supports fallback is in
    // globals.css (Tailwind plugins can't easily emit @supports rules).
    plugin(({ addUtilities }) => {
      addUtilities({
        ".glass-chrome": {
          background: "rgba(250, 247, 242, 0.72)",
          backdropFilter: "blur(24px) saturate(140%)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
          border: "1px solid rgba(11, 11, 15, 0.06)",
        },
        ".glass-floating": {
          background: "rgba(250, 247, 242, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        },
        ".glass-toast": {
          background: "rgba(255, 255, 255, 0.78)",
          backdropFilter: "blur(32px) saturate(160%)",
          WebkitBackdropFilter: "blur(32px) saturate(160%)",
        },
      });
    }),
  ],
};

export default config;
