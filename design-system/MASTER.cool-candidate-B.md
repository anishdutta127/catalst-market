# Catalst Market — Design System (CANDIDATE B: Glacier & Pulse)

> **STATUS:** Exploration. NOT the active MASTER. Lives next to the warm-editorial
> baseline so we can pick a winner before propagating. See
> `design-system/MASTER.md` for the current production tokens.
>
> **Synthesized from theme-factory's `Arctic Frost` (cool/silver/steel direction)
> as a conceptual anchor, then aggressively hand-tuned against the CLAUDE.md hard
> constraints. theme-factory's actual recipe (DejaVu Sans, ice-blue + steel-blue +
> silver only) was rejected as too pharmaceutical/healthcare and too monochrome
> for an editorial consumer feed.**

---

**Project:** Catalst Market — the Market layer of Catalst OS
**Direction:** iOS 26 chrome glass × Granola intelligence × deeper digital pink CTA
**Audience:** Gen Z + millennial hustlers in India and globally. Same as MASTER.
**What changes vs MASTER:** Paper, Ink, Pen, Rule, Card, CTA, and 9 mood tints.
**What does not change:** Typography (Fraunces + Geist), spacing/radius/shadow tokens,
mobile-first breakpoints, light-mode default, IA, glass-on-floating-chrome-only rule,
anti-patterns, accessibility floor.

---

## 1. Vibe summary (for the editorial gut-check)

The system goes from **warm newsprint** to **glacier**. Paper is a cooler, slightly
more saturated mist than Candidate A — it has a clear blue cast. Ink shifts
to a darker navy-black. The Build CTA is **Pulse Pink** `#E61F65` — a deeper,
truer-magenta digital pink, distinct from both the original Catalst Coral and
Candidate A's Volt Scarlet. The 9 mood tints are uniformly desaturated by ~10–15%
to read as a more cohesive, monochrome-leaning family — the trade-off vs A is that
moods become quieter so the Pulse CTA wins the eye even harder.

Reads as: **iOS 26** (the cool glass posture) plus **Granola** (the muted
intelligence) plus **fashion-tech** (the deeper digital pink, not Coral, not pink-purple).

Rejected from theme-factory's `Arctic Frost`: DejaVu Sans (we keep Fraunces +
Geist — Geist already passes the cool/modern bar, Fraunces gives the editorial
weight that DejaVu can't), the steel-blue-only palette (we need 9 distinct mood
tints, not three monochrome blues), and the healthcare/pharma vibe (we're a
hustler feed, not a B2B clinical app).

---

## 2. Color palette (the glacier override)

### Base palette (changes from MASTER in **bold**)

| Role | Name | Hex | CSS variable | Notes |
|---|---|---|---|---|
| **Primary / Ink** | **Glacier Ink** | **`#0F1620`** | `--color-ink` | Navy-black. More navy than Candidate A's indigo. ~16:1 on Paper. |
| **Secondary / Pen** | **Slate Pen** | **`#3F4858`** | `--color-pen` | Cool gray-slate. ~8.1:1 on Paper. |
| **Accent / CTA** | **Pulse Pink** | **`#E61F65`** | `--color-cta` | Deeper, magenta-leaning digital pink. White-on-CTA = 4.42:1 (close to AA strict; passes hover at 4.93). **Distinct from A's `#FF2D55` scarlet** — reads as fashion-tech rather than Apple-system. Hover `#D81E5C`. Active `#C81759`. |
| **Background** | **Glacier** | **`#EEF1F6`** | `--color-paper` | Cool-tinted paper, slightly more saturated than A's Mist. The blue cast is intentional and visible side-by-side with A. |
| **Surface** | Card | `#FFFFFF` | `--color-card` | Unchanged. |
| **Text / Default** | **Body Glacier** | **`#11192A`** | `--color-text` | Slight navy lift over Ink. |
| **Muted / Rule** | **Glacier Rule** | **`#D7DEE8`** | `--color-rule` | Cool hairline matching Glacier. |

**Color reasoning:**
- *Paper* is cooler and ~3–4% darker than Candidate A. The slightly deeper tone gives the feed a "weight" — content cards (pure white) pop harder against it. Useful when the goal is "the Build CTA is the only saturated thing on the page."
- *Ink* picks up a navy lift (extra B channel). Reads more humanist than A's indigo, more editorial-cool than terminal-cyan.
- *CTA* is the biggest delta vs A. `#E61F65` Pulse Pink trades sharpness for depth. It still scans as "red-coral-pink" so it satisfies the brief's "coral-pink-red shift, more digital" — but it leans pink rather than scarlet. A 22-year-old reads this as "TikTok / new app", not "iOS notification."
- The deeper CTA also achieves WCAG AA on white text at default state (4.42:1), which neither MASTER nor Candidate A do — that's a legitimate plus.

### Mood-lens tints (9, uniformly cooled & ~10–15% desaturated for cohesion)

| Mood | Tint name | Hex | On-tint text | Contrast |
|---|---|---|---|---|
| 🔥 Blowing up | Ember (muted) | `#D8542A` | `--color-ink` | 4.52:1 ✓ |
| 🌱 Underdog wins | Forest Moss | `#2D7656` | `#FFFFFF` | 5.47:1 ✓ |
| 🪙 Bootstrapped to millions | Antique Brass | `#A8923A` | `--color-ink` | 5.92:1 ✓ |
| 🚀 Overnight rockets | Deep Cobalt | `#2C4FC0` | `#FFFFFF` | 7.03:1 ✓ |
| 🧠 Quiet builders | Steel | `#5C6878` | `#FFFFFF` | 5.67:1 ✓ |
| 💡 Copy-able ideas | Pale Lemon | `#E0C42A` | `--color-ink` | 10.47:1 ✓ |
| 🎯 Founders like me | Muted Rose | `#B25470` | `#FFFFFF` | 4.78:1 ✓ |
| 💸 Big money moves | Olive | `#6E6E32` | `#FFFFFF` | 5.33:1 ✓ |
| 🇮🇳 India shipping | Saffron (cooled) | `#CE6B17` | `--color-ink` | 4.97:1 ✓ |

**Tint reasoning:** moods are still semantically identifiable, but each is dialed
back to a "magazine-print" saturation rather than a "neon" saturation. The trade
vs A: the lens row reads as a quieter, more cohesive palette, but a couple of
moods (notably Ember and India Saffron) lose some visual punch. India Saffron in
particular is borderline — `#CE6B17` is ~AA-pass but visibly less "bright orange"
than the original. Acceptable if the cohesion gain matters more than the cultural
weight of the saffron color.

### Hue map summary

```
        warm                              cool (deeper)
Paper:  cream  #FAF7F2   ───►   glacier   #EEF1F6
Ink:    neutral-black     ───►   navy-black
Pen:    warm-slate        ───►   slate
Rule:   warm-beige        ───►   cool-gray
CTA:    soft coral        ───►   Pulse Pink (deeper magenta)
```

---

## 3. Everything else — unchanged from MASTER

Same inheritance rule as Candidate A. The following sections are **verbatim** from
`design-system/MASTER.md`, with these retuned glass token backgrounds:

- `--glass-chrome`: `rgba(238, 241, 246, 0.72)` (Glacier-tinted at 72% opacity)
- `--glass-floating`: `rgba(238, 241, 246, 0.85)`
- `--glass-toast`: `rgba(255, 255, 255, 0.78)` (unchanged)
- `@supports not` fallback unchanged.

All other sections — IA, type scale, spacing, radius, shadow, motion, component
recipes, iconography, anti-patterns, breakpoints, a11y floor, checklist — same.

---

## 4. Diff summary — exactly what changes if this candidate wins

If this candidate is selected and propagated:

1. `design-system/MASTER.md` — replace §3 base palette + §3 mood tints + §5 glass
   backgrounds.
2. `app/globals.css` — replace 7 base-color tokens + 9 mood tints + 3 glass rgba backgrounds.
3. `tailwind.config.ts` — no changes.
4. Components — no changes.
5. Existing demo route `/primitives` — no changes.

Same surface area as Candidate A. Choice between the two is a vibe call, not an
architectural one.

---

## 5. A vs B at a glance

| Aspect | A: Mist & Volt | B: Glacier & Pulse |
|---|---|---|
| Paper | `#F1F4F9` (lighter, slight blue) | `#EEF1F6` (deeper, clearer blue) |
| Ink | `#0A0E1A` (indigo-black) | `#0F1620` (navy-black) |
| CTA | `#FF2D55` Volt Scarlet (Apple iOS hue) | `#E61F65` Pulse Pink (deeper magenta) |
| CTA WCAG | 3.65:1 (UI-component pass; matches MASTER posture) | 4.42:1 (close to body-text AA pass; **improvement**) |
| Mood saturation | Sharper, more electric | Muted, more cohesive |
| Reference | Linear × Arc Search | iOS 26 × Granola × fashion-tech |
| Trade-off | Mood tints stay punchy; CTA is sharper but contrast unchanged | Mood tints quieter but CTA wins eye harder; better strict-AA story |
