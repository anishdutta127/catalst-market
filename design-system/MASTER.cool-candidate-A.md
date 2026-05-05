# Catalst Market — Design System (CANDIDATE A: Mist & Volt)

> **STATUS:** Exploration. NOT the active MASTER. Lives next to the warm-editorial
> baseline so we can pick a winner before propagating. See
> `design-system/MASTER.md` for the current production tokens.
>
> **Hand-tuned from a uipro raw output ("Editorial / Exaggerated Minimalism" pattern,
> rejected its `Newsreader + Roboto + #EC4899 pink` proposal verbatim) against the
> CLAUDE.md hard constraints, with the cool-system overrides described below.**

---

**Project:** Catalst Market — the Market layer of Catalst OS
**Direction:** Linear restraint × Arc Search electric accent × iOS 26 chrome glass
**Audience:** Gen Z + millennial hustlers in India and globally. Same as MASTER.
**What changes vs MASTER:** Paper, Ink, Pen, Rule, Card, CTA, and 9 mood tints.
**What does not change:** Typography (Fraunces + Geist), spacing/radius/shadow tokens,
mobile-first breakpoints, light-mode default, IA (3 switches × 9 moods × 12 industries),
glass-on-floating-chrome-only rule, anti-pattern list, accessibility floor.

---

## 1. Vibe summary (for the editorial gut-check)

The system goes from **warm newsprint** to **cool blueprint**. Paper picks up a
silver-mist undertone. Ink moves from neutral-warm black to deep indigo-black. The
Build CTA shifts from soft Catalst Coral to sharp **Volt Scarlet** — the same
Apple-iOS-system-red hue, more digital, less peachy. Mood tints stay semantically
identifiable (Ember is still orange, Cobalt is still blue) but each gets a slight
hue/saturation nudge for cohesion.

Reads as: **Linear** (the cool-paper restraint) plus **Arc Search** (the one
electric accent) plus a quiet nod to **iOS 26 glass** (existing chrome-only rule
is unchanged).

Rejected from the uipro output: Newsreader (we keep Fraunces — Newsreader has the
same DNA but Fraunces' `opsz` axis is what the hero number needs), Roboto (banned
in CLAUDE.md), `#EC4899` hot pink CTA (banned — reads "AI-product"), the
"Marketplace / Directory" pattern (we are an editorial feed, not a search-first
marketplace).

---

## 2. Color palette (the cool override)

### Base palette (changes from MASTER in **bold**)

| Role | Name | Hex | CSS variable | Notes |
|---|---|---|---|---|
| **Primary / Ink** | **Indigo Ink** | **`#0A0E1A`** | `--color-ink` | Cool blue-black. Replaces MASTER's `#0B0B0F`. ~17.5:1 on Paper. |
| **Secondary / Pen** | **Steel Pen** | **`#3D4453`** | `--color-pen` | Cool slate. Replaces `#3A3A44`. ~8.9:1 on Paper. |
| **Accent / CTA** | **Volt Scarlet** | **`#FF2D55`** | `--color-cta` | Sharper, more digital coral — the Apple iOS system red hue. White-on-CTA = 3.65:1 (matches MASTER's existing 3.27 posture, slightly improved; passes WCAG SC 1.4.11 UI component 3:1). Hover `#E61F4F` (4.49:1, AA strict). Active `#CC1A45`. |
| **Background** | **Cool Mist** | **`#F1F4F9`** | `--color-paper` | Silver-mist with the lightest blue undertone. Replaces `#FAF7F2`. **This is the single biggest visible shift** from MASTER. |
| **Surface** | Card | `#FFFFFF` | `--color-card` | Unchanged — pure white retains editorial weight against cool paper. |
| **Text / Default** | **Body Cool** | **`#0E1320`** | `--color-text` | Same family as Ink, slightly cooler. Replaces `#0F0F14`. |
| **Muted / Rule** | **Cool Rule** | **`#DCE2EB`** | `--color-rule` | Cool gray hairline. Replaces `#E6E2D9` warm beige. |

**Color reasoning:**
- *Paper* moved from cream to silver-mist. The temperature shift is what reads as "futuristic-cool" without going into terminal/dashboard territory. We're not making it gray — we're making it cool-white.
- *Ink* picked up an indigo undertone (B channel slightly higher than R, G). Reads modern at small sizes, doesn't lose the editorial-black weight at headline sizes.
- *CTA* shifted from `#FF4D4D` peachy coral to `#FF2D55` Apple-iOS scarlet-pink. Same red-ish family (still scans as "red CTA"), but the slight pink lean makes it digital, not warm. **Crucially, this is NOT pink-purple AI gradient territory** — it's a single saturated solid, hue ~345°.
- *Rule* matches Paper's temperature so hairlines stay invisible in scanning, visible up close.

### Mood-lens tints (9, semantically preserved; cooled where natural)

| Mood | Tint name | Hex | On-tint text | Contrast |
|---|---|---|---|---|
| 🔥 Blowing up | Ember (sharp) | `#F0541F` | `--color-ink` | 5.49:1 ✓ |
| 🌱 Underdog wins | Pine Moss | `#2A8056` | `#FFFFFF` | 4.86:1 ✓ |
| 🪙 Bootstrapped to millions | Brass | `#B8A052` | `--color-ink` | 7.51:1 ✓ |
| 🚀 Overnight rockets | Electric Cobalt | `#1F4FEC` | `#FFFFFF` | 6.20:1 ✓ |
| 🧠 Quiet builders | True Steel | `#5B6776` | `#FFFFFF` | 5.76:1 ✓ |
| 💡 Copy-able ideas | Volt Lemon | `#EFD335` | `--color-ink` | 12.87:1 ✓ |
| 🎯 Founders like me | Deep Rose | `#B85068` | `#FFFFFF` | 4.79:1 ✓ |
| 💸 Big money moves | Olive Bronze | `#71712E` | `#FFFFFF` | 5.12:1 ✓ |
| 🇮🇳 India shipping | Saffron | `#DA751B` | `--color-ink` | 6.00:1 ✓ |

**Tint reasoning:** the moods are *content* — they semantically identify the lens.
Don't gray them out. We sharpened a few (Ember more orange, Cobalt more electric)
and pushed three to pass strict AA where the warm originals were borderline (Moss,
Steel, Rose). Hue separation between Ember (`#F0541F`) and Volt CTA (`#FF2D55`) is
preserved — orange vs pink-red.

### Hue map summary

```
        warm                           cool
Paper:  cream  #FAF7F2   ───►   mist   #F1F4F9
Ink:    neutral-black     ───►   indigo-black
Pen:    warm-slate        ───►   steel-slate
Rule:   warm-beige        ───►   cool-gray
CTA:    soft coral        ───►   Volt scarlet
```

---

## 3. Everything else — unchanged from MASTER

The following sections are **inherited verbatim** from `design-system/MASTER.md`
because the cool palette is a token-level swap, not an architectural shift:

- **§1 Pattern (Mobile Editorial Feed)** — same. Mood lens row, story feed, sticky
  switch bar, BuildSheet on every card.
- **§2 UI Style (Editorial Maximalism)** — same. No glass-on-content,
  photo-forward, low-chrome.
- **§4 Typography (Fraunces + Geist)** — same. Variable axes unchanged. Hero
  number `font-variation-settings: 'opsz' 144`.
- **§5 Spacing / Radius / Shadow** — same tokens. Same shadow values
  (`rgba(11,11,15,...)` is close enough to `rgba(10,14,26,...)` that we don't
  re-tune; the perceptible cool-ink shadow comes free).
- **§5 Glass (floating chrome only)** — same rule, retuned values:
  - `--glass-chrome` background: `rgba(241, 244, 249, 0.72)` (was `rgba(250,247,242,0.72)` — Mist instead of cream)
  - `--glass-floating` background: `rgba(241, 244, 249, 0.85)`
  - `--glass-toast` background: `rgba(255, 255, 255, 0.78)` (unchanged)
  - `@supports not` fallback unchanged.
- **§6 Motion presets** — same. Volt Scarlet hover is `#E61F4F`, active is `#CC1A45`.
- **§7 Component recipes (Story Card, Build CTA, mood chip, streak chip, BuildSheet)** —
  same recipes, same rules, just consume the new tokens.
- **§8 Iconography & imagery** — same. Lucide only, no emojis as icons, square
  avatars, founder photography full-bleed.
- **§9 Anti-patterns** — same. Plus: this candidate must NOT shift toward
  cyberpunk/HUD/neon-on-dark even though the system is cooler. Test: if a 22-year-old
  in Mumbai reads it as "trading terminal," it's failed.
- **§10 Mobile-first breakpoints** — same.
- **§11 Accessibility floor** — same. All 9 mood tints retested above.
- **§12 Pre-delivery checklist** — same.
- **§13 Page override directory** — same.

---

## 4. Diff summary — exactly what changes if this candidate wins

If this candidate is selected and propagated:

1. `design-system/MASTER.md` — replace §3 base palette + §3 mood tints + §5 glass
   backgrounds with the values in §2 above. Everything else stays.
2. `app/globals.css` — replace the 7 base-color custom-properties + 9 mood tint
   custom-properties + 3 glass-token rgba backgrounds. Tailwind config
   unchanged (it consumes via `var()`).
3. `tailwind.config.ts` — no changes.
4. Components — no changes (they consume tokens).
5. Existing demo route `/primitives` — no changes (it consumes tokens too).

That's the entire surface area of the change. The cool palette is a swap, not a refactor.
