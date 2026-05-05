# Catalst Market — Design System (MASTER)

> **LOGIC:** When building a specific page, first check `design-system/pages/<page>.md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.
>
> Do not hand-pick colors, fonts, or shadows in components — pull tokens from this file.
> Regenerate via `python .claude/skills/ui-ux-pro-max/scripts/search.py "..." --design-system --persist`,
> then hand-tune to honor the hard constraints in CLAUDE.md.

---

**Project:** Catalst Market — the Market layer of Catalst OS
**Generated:** 2026-05-02 (uipro v2.2.3, hand-tuned against CLAUDE.md hard constraints)
**Category:** Mobile-first editorial consumer feed (lifestyle, not SaaS, not dashboard)
**Vibe target:** Robinhood approachability × Pinterest visual richness × Apple Newsroom typography × Substack editorial weight
**Audience:** Gen Z + millennial hustlers in India and globally. They scroll like TikTok, decide like Robinhood, copy like Pinterest.

---

## 1. Recommended Pattern — **Mobile Editorial Feed**

A vertical, mood-filtered Story Card feed with a sticky bottom switch bar (Stage / Industry / Mood) and a sheet-modal Build CTA on every card. **Not** a long-scroll landing page. **Not** a data dashboard.

| Layer | What it is | Where it lives |
|---|---|---|
| **Header** | Brand wordmark + Streak chip + XP bar | Top, transparent on scroll-up, solid on scroll-down |
| **Mood lens** | "I'm feeling…" → 9 curated chips. Active chip pinned. | Sticky just under header at 375px; inline at 1440px |
| **Story Feed** | Vertical 1-col on mobile, 2-col on tablet, 3-col masonry on desktop | Scroll surface, ~70% of viewport |
| **Switch bar** | Stage toggle (Empires / Builders / Bootstrappers) + Industry bento opener | Sticky bottom on mobile, sidebar on desktop |
| **StorySheet** | Bottom sheet (mobile) / right drawer (desktop) for full story + Build CTA | Triggered on card tap |
| **Daily Brief** | One-time modal on first load of the day | Centered overlay |

**Section order on first paint (mobile):** Streak/XP chip → Daily Quest pill → Mood lens row → Story feed → Sticky switch bar.

**CTA placement:** **Build with Catalst** button on every Story Card. Always visible. Always one tap. Repeated inside StorySheet at the foot. No other primary CTA competes.

**Color strategy:** Off-paper background. Cards are paper-white with hairline borders. Each Story Card carries a **mood-tag tint** at the top (one of 9 lenses). The Build CTA is the only saturated color in the feed — that's how the eye finds it.

---

## 2. UI Style — **Editorial Maximalism**

Bold, typographic, photo-forward, low-chrome. Headline numbers are the hero element on every card (massive serif, optical-tracked). Generous whitespace between cards. Photography is full-bleed inside the card frame; no rounded-photo-circle avatars (squares, like Substack/Pinterest).

**Reasoning (why this and not Flat Design or Glassmorphism):**
- *Flat Design* wins on perf but kills the editorial weight your Newsroom-style headlines need. We keep flatness for chrome, but cards get one shadow level.
- *Glassmorphism* is banned as the hero style (CLAUDE.md hard constraint). We do **not** stack translucent cards over photos.
- *Brutalism* matches the youth energy but reads as "art project," not "I could build this tomorrow." We borrow only oversized type and sharp negative space.
- *Editorial Maximalism* is the synthesis: maximal **type and image weight**, minimal **chrome and ornament**. Pinterest cards meet Apple Newsroom layout meet Robinhood's one-CTA-per-screen discipline.

**Performance:** Excellent (no per-card shaders, no backdrop-filter on the feed)
**Accessibility target:** WCAG AA across all surfaces; AAA on body text where possible

---

## 3. Color Palette

7 base tokens + 9 mood-lens tints. **Light mode is the default.** Dark mode is post-MVP (banned as default per CLAUDE.md).

### Base palette

| Role | Name | Hex | CSS variable | Usage |
|---|---|---|---|---|
| **Primary / Ink** | Editorial Black | `#0B0B0F` | `--color-ink` | Headlines, headline numbers, body text on paper. Use this, not pure `#000`. |
| **Secondary / Pen** | Pen Slate | `#3A3A44` | `--color-pen` | Captions, metadata, secondary copy. ~7:1 on Paper. |
| **Accent / CTA** | Catalst Coral | `#FF4D4D` | `--color-cta` | The Build CTA. Streak flame. New-signal toast. **Used sparingly — one saturated point per viewport.** |
| **Background** | Paper | `#FAF7F2` | `--color-paper` | App background. Warmer than `#FAFAFA`; it's "newsprint" not "Notion." |
| **Surface** | Card | `#FFFFFF` | `--color-card` | Story Card body, sheet/modal surface. Hairline `1px` border in `--color-rule`. |
| **Text / Default** | Body | `#0F0F14` | `--color-text` | Default body text. Same family as Ink, slightly cooler for readability blocks. |
| **Muted / Rule** | Rule Gray | `#E6E2D9` | `--color-rule` | Hairlines, dividers, disabled states, skeleton fills. Matches Paper warmth. |

**Color notes:** Editorial black on warm paper (not stark cool gray). One hot accent (Catalst Coral) reserved for the Build wedge so it always wins the eye. Coral was chosen over hot pink (#EC4899) because pink reads "AI-product" — Coral reads "Robinhood / News alert." Pink is on the banned list as a primary tone.

**Coral budget on first viewport (ratified v3, 2026-05-03):** ≤ 2 saturated Coral locations on `/` first paint, exactly: (a) Build CTA when an expanded Story Card is visible, (b) heat headline `<City>` span. The LiveSignals notable-metric Coral exception was **trialled in WZ (Phase 6c) and rolled back in v3** — that surface now uses ink + Geist 700 weight for visual emphasis. Other Coral surfaces (streak flame, new-signal toast, button hover/active fills) appear only on interaction or at points the user navigated to deliberately, never simultaneous with the home-feed first viewport. See `design-system/pages/feed.md` §7f Module D for the rollback rationale.

### Mood-lens tints (Story Card top-tag color, one of nine)

Each maps to a mood from CLAUDE.md. Use as a 32px-tall colored strip at the top of the Story Card with the mood emoji + label, so the lens is identifiable in a one-second scan.

| Mood | Tint name | Hex | On-tint text |
|---|---|---|---|
| 🔥 Blowing up | Ember | `#F26B22` | `--color-ink` |
| 🌱 Underdog wins | Moss | `#3F8F5C` | `#FFFFFF` |
| 🪙 Bootstrapped to millions | Brass | `#C9A24A` | `--color-ink` |
| 🚀 Overnight rockets | Cobalt | `#2A5BD7` | `#FFFFFF` |
| 🧠 Quiet builders | Slate-Sage | `#6E7A6A` | `#FFFFFF` |
| 💡 Copy-able ideas | Lemon | `#F2D544` | `--color-ink` |
| 🎯 Founders like me | Rose Clay | `#D86A7A` | `#FFFFFF` |
| 💸 Big money moves | Olive Gold | `#8A7E2C` | `#FFFFFF` |
| 🇮🇳 India shipping | Saffron | `#E07B1B` | `--color-ink` |

**Important:** mood tints are *only* used in (a) the mood-lens chip row, (b) the Story Card top strip, and (c) Daily Brief mood markers. **Do not** color whole backgrounds or buttons in mood tints — the Build CTA is always Coral.

**Ember reasoning:** Pushed away from red toward true orange (`#F26B22`, was `#FF6A2C`) to maintain hue separation from Catalst Coral CTA — prevents the mood strip and Build CTA from reading as the same color in one-second scans.

---

## 4. Typography — **Magazine Style** (Fraunces + Geist Sans)

Selected via the ui-ux-pro-max typography database (`Magazine Style` pairing), then swapped to variable-axis families for finer optical control. **Fraunces** is a high-contrast variable serif with `opsz`, `SOFT`, `WONK`, and `wght` axes — at large optical sizes it gives the Apple Newsroom / Substack editorial weight while staying readable at small sizes. **Geist** is Vercel's variable sans (single `wght` axis, 100–900) — clean, neutral, modern UI body type that passes the hard constraint banning Inter and Roboto.

| Role | Family | Weights | Notes |
|---|---|---|---|
| **Display / Headline numbers** | Fraunces | 600, 700 (variable `opsz` 9–144) | The "headline number" on every Story Card. Optical tracking `-0.02em`. `font-size: clamp(2.75rem, 9vw, 5.5rem)` on cards. |
| **Headline / Section titles** | Fraunces | 500, 600 (variable `opsz` 9–144) | h1/h2. Paragraph-style headlines. |
| **Body / UI** | Geist Sans | 400, 500, 600 (variable `wght` 100–900) | All body, captions, labels, buttons, sheets. `font-size: 16px` minimum on mobile. |
| **Mono / Codename + IDs** | JetBrains Mono | 400, 500 | Story IDs, codename in BuildSheet, debug. Loaded only on `/forge` and `/story/[id]`. |

**Google Fonts:** [Fraunces + Geist](https://fonts.google.com/share?selection.family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..900,0..100,0..1|Geist:wght@100..900) | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

**CSS import (root layout):**
```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..900,0..100,0..1&family=Geist:wght@100..900&display=swap');
```

**Tailwind config:**
```ts
fontFamily: {
  serif: ['"Fraunces"', 'Georgia', 'serif'],       // headline numbers, h1/h2 — variable opsz/SOFT/WONK/wght
  sans:  ['"Geist"', 'system-ui', 'sans-serif'],   // default — variable wght 100–900
  mono:  ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
}
```

**Type scale (mobile → desktop):**
| Token | Mobile | Desktop | Family |
|---|---|---|---|
| `text-hero` | `clamp(2.75rem, 9vw, 5.5rem)` | up to `5.5rem` | serif 700, **`font-variation-settings: 'opsz' 144`** for max optical size |
| `text-h1` | `2rem` / `32px` | `2.5rem` / `40px` | serif 600 |
| `text-h2` | `1.5rem` / `24px` | `1.75rem` / `28px` | serif 500 |
| `text-h3` | `1.25rem` / `20px` | `1.375rem` / `22px` | serif 500 |
| `text-body` | `1rem` / `16px` | `1.0625rem` / `17px` | sans 400, line-height 1.6 |
| `text-caption` | `0.8125rem` / `13px` | `0.8125rem` / `13px` | sans 500, tracking `0.01em` |
| `text-label` | `0.75rem` / `12px` | `0.75rem` / `12px` | sans 600, uppercase, tracking `0.06em` |

---

## 5. Spacing, Radius, Shadow

### Spacing tokens (4px grid)

| Token | Value | Where it lives |
|---|---|---|
| `--space-1` | `4px` | Tight gaps inside chips, between icon and label |
| `--space-2` | `8px` | Inline spacing |
| `--space-3` | `12px` | Card internal pad-tight |
| `--space-4` | `16px` | Default card padding (mobile) |
| `--space-5` | `20px` | Card padding (desktop) |
| `--space-6` | `24px` | Section padding |
| `--space-8` | `32px` | Story-to-story gap (mobile) |
| `--space-10` | `40px` | Story-to-story gap (desktop) |
| `--space-12` | `48px` | Section margins |
| `--space-16` | `64px` | Hero whitespace |

### Radius

| Token | Value | Where |
|---|---|---|
| `--radius-sm` | `6px` | Chips, small tags |
| `--radius-md` | `12px` | Buttons, inputs, mood-lens chips |
| `--radius-lg` | `18px` | Story Cards (warm, magazine-feeling — not 8px tech-y, not 24px chubby) |
| `--radius-xl` | `24px` | BuildSheet, Daily Brief modal |
| `--radius-pill` | `999px` | Streak chip, XP bar, Build CTA pill on cards |

### Shadow (used sparingly — Editorial Maximalism is mostly flat)

| Token | Value | Where |
|---|---|---|
| `--shadow-card` | `0 1px 2px rgba(11,11,15,0.04), 0 4px 16px rgba(11,11,15,0.06)` | Story Cards (default state) |
| `--shadow-card-hover` | `0 4px 8px rgba(11,11,15,0.06), 0 12px 32px rgba(11,11,15,0.10)` | Card hover (desktop only) |
| `--shadow-sheet` | `0 -8px 32px rgba(11,11,15,0.12)` | Bottom sheet rising over feed |
| `--shadow-toast` | `0 8px 24px rgba(11,11,15,0.14)` | New-signal toast |

No `box-shadow` on chrome, headers, or the switch bar. No glow. No inner shadows.

### Glass (floating chrome only — Liquid Glass, not glassmorphism)

Reserved for **floating UI chrome** that sits over scrolling content. **Never** on Story Cards, BuildSheet body, or modal interiors (those stay solid — see Section 9). This mirrors iOS 26's actual usage pattern: glass on the bar, solid on the content.

| Token | Value | Where |
|---|---|---|
| `--glass-chrome` | `backdrop-filter: blur(24px) saturate(140%); background: rgba(250,247,242,0.72); border: 1px solid rgba(11,11,15,0.06);` | Sticky bottom switch bar, scrolled-state header |
| `--glass-floating` | `backdrop-filter: blur(12px); background: rgba(250,247,242,0.85);` | Streak chip floating over feed, mood-chip row when pinned |
| `--glass-toast` | `backdrop-filter: blur(32px) saturate(160%); background: rgba(255,255,255,0.78);` | New-signal toast |

**`@supports` fallback** — required, since Safari < 18 and lots of Android shells either lack `backdrop-filter` or render it broken. Always pair every glass usage with a solid fallback:

```css
.surface-chrome {
  background: rgba(250, 247, 242, 0.72);
  backdrop-filter: blur(24px) saturate(140%);
  -webkit-backdrop-filter: blur(24px) saturate(140%);
  border: 1px solid rgba(11, 11, 15, 0.06);
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .surface-chrome {
    background: var(--color-card);
    box-shadow: var(--shadow-card);
    border-color: var(--color-rule);
  }
}
```

The same `@supports not` pattern applies to `--glass-floating` and `--glass-toast`. Fallback is always solid `--color-card` + `--shadow-card`.

---

## 6. Key Effects — Transitions, Hover, Motion

| Property | Value |
|---|---|
| **Default transition** | `transition: all 200ms cubic-bezier(0.2, 0, 0, 1)` |
| **Card hover (desktop)** | Shadow `--shadow-card` → `--shadow-card-hover`. **No transform.** No scale. Pure depth shift. |
| **Card press (mobile)** | `opacity: 0.92` for `120ms`, then back. Tactile, not bouncy. |
| **Build CTA hover** | Coral darkens to `#E63E3E`, `200ms`. No transform. |
| **Build CTA tap** | Pulse: scale `1 → 0.96 → 1` over `180ms`. Only on the CTA, never on cards. |
| **Sheet open** | Translate-Y from `100%` to `0`, `260ms` `cubic-bezier(0.2, 0, 0, 1)`. Backdrop fades in `200ms`. |
| **Mood chip select** | Background fills with mood tint over `160ms`. Other chips fade text to `--color-pen`. |
| **Streak +1** | Coral flame icon scales `1 → 1.15 → 1` over `400ms` with a single sparkline. Once. No loop. |
| **New-signal toast** | Slides in from top-right (desktop) or bottom (mobile) over `220ms`. Auto-dismiss `5s`. |
| **Reduced motion** | All transforms become opacity-only. Sheet uses fade, not slide. Honor `prefers-reduced-motion: reduce`. |

**Framer Motion presets** (already in stack):
```ts
export const easeStandard = [0.2, 0, 0, 1]   // standard
export const easeEmphasized = [0.3, 0, 0, 1] // sheets, modals
export const dur = { fast: 0.16, base: 0.2, slow: 0.26 }
```

---

## 7. Component recipes

### Story Card (the atomic unit)

```
┌────────────────────────────────────┐  radius-lg, shadow-card
│ ▮ MOOD TINT (32px tall)            │  e.g. "🔥 Blowing up"
├────────────────────────────────────┤
│ [photo / founder face — full-bleed]│  4:5 aspect
├────────────────────────────────────┤
│ One line: what they did             │  text-body, --color-pen
│                                    │
│      ₹4.2 Cr                        │  text-hero, serif 700, --color-ink
│      ──── headline number ────      │
│                                    │
│ • micro-bullet 1                    │  text-caption
│ • micro-bullet 2                    │
│ • micro-bullet 3                    │
│                                    │
│ Why it matters now: …               │  text-caption, italic serif
│                                    │
│ [  Build with Catalst  →  ]         │  Coral pill, full-width
└────────────────────────────────────┘
```

### Build CTA (the wedge)

```css
.btn-build {
  background: var(--color-cta);            /* #FF4D4D Catalst Coral */
  color: #FFFFFF;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 1rem;
  padding: 14px 20px;                      /* 44px tall — touch target */
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 200ms cubic-bezier(0.2, 0, 0, 1);
  cursor: pointer;
}
.btn-build:hover  { background: #E63E3E; }
.btn-build:active { background: #D33636; }
.btn-build:focus-visible { outline: 2px solid var(--color-ink); outline-offset: 2px; }
```

### Mood chip

```css
.mood-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-pill);
  font: 500 0.875rem var(--font-sans);
  background: var(--color-card);
  color: var(--color-pen);
  border: 1px solid var(--color-rule);
  transition: all 160ms;
}
.mood-chip[aria-pressed="true"] {
  background: var(--mood-tint);  /* set per-mood */
  color: var(--mood-ink);
  border-color: transparent;
}
```

### Streak chip

```css
.streak-chip {
  display: inline-flex; align-items: center; gap: 6px;
  height: 32px; padding: 0 12px;
  border-radius: var(--radius-pill);
  background: var(--color-card);
  border: 1px solid var(--color-rule);
  font: 600 0.8125rem var(--font-sans);
  color: var(--color-ink);
}
.streak-chip svg { color: var(--color-cta); width: 14px; height: 14px; }
```

### BuildSheet (bottom sheet, the wedge modal)

- Full width on mobile, max-width `520px` centered on tablet+, right drawer `420px` on desktop.
- Drag handle on mobile (`32×4px` `--color-rule`).
- Header: codename (mono) + close.
- Body: wedge hypothesis · target user · first build · house assignment.
- Footer: full-width Build CTA → POST `/api/forge` → deeplink `/forge?seed=<story-id>`.
- Backdrop: `rgba(11,11,15,0.40)`. **No blur on the backdrop itself** (modal isn't floating chrome — it's stop-the-world). Sheet body content stays solid (`--color-card`). The drag handle row and close-button bar at the top of the sheet may use `--glass-chrome` since they function as floating chrome over the feed peeking from behind during the open/close animation. Bottom CTA bar stays solid.

---

## 8. Iconography & imagery

- **Icons:** Lucide only (matches stack). 24×24 viewBox, `1.5px` stroke, `--color-ink` default.
- **No emojis as icons** — the mood emojis (🔥 🌱 etc.) are **content**, used only inside mood chips and Story Card top strips. Never as button glyphs, navbar items, or section headers.
- **Photography:** Founder face or company shot, full-bleed inside the card frame, 4:5 mobile / 16:9 hero. Use `next/image` with priority on first 3 cards. WebP, lazy below the fold.
- **Logos:** Square-cropped, `--radius-md` corners. No drop shadows. Companies use Simple Icons SVG when available.
- **Avatars:** Squares with `--radius-md`, never circles. Pinterest/Substack logic: editorial > social.

---

## 9. Anti-patterns — DO NOT use

The CLAUDE.md hard constraints, made enforceable here. PR review and `/design-review` should fail on any of these:

- **Inter or Roboto as primary font** — use Geist Sans (UI) + Fraunces (display). The auto-generated MASTER from uipro proposed Roboto; we explicitly reject it.
- **Glass on content surfaces** — Story Cards, BuildSheet body, and modals stay **solid**. Glass is reserved for floating chrome only (sticky switch bar, scrolled header, streak chip, new-signal toast) per Section 5. This matches iOS 26's actual usage pattern, not a vibes interpretation. Banned: `backdrop-filter` on any Story Card, the feed background, BuildSheet body content, or modal interiors.
- **Dark mode as the default** — light mode (Paper) is the default. Dark mode is post-MVP and must ship behind a toggle, never auto-detect.
- **Cyberpunk / HUD / terminal / Bloomberg aesthetics** — no monospace headlines, no ticker-tape data strips, no green-on-black, no "data density" layouts. Catalst Market is a magazine, not a trading terminal.
- **AI-purple or pink-purple gradients** — banned. The CTA is Coral (`#FF4D4D`). No purple-to-pink anywhere. The auto-generated `#EC4899` hot pink is rejected for the same reason.
- **Dense data-table layouts** — no `<table>` UI in the feed surface. If we ever need tabular data (admin), it lives outside the consumer feed.
- **3D-rotating data-globes** — banned everywhere. The dotted-continent SVG hero on / route is approved exception (see design-system/pages/feed.md). Globe pattern banned on /story/[id], /forge, BuildSheet, and modal interiors.
- **Generic stock photography** — only real founder/company imagery. If unavailable, use a colored Paper card with the mood tint and a typographic headline only.
- **Emojis used as UI icons** — Lucide SVG only for actions/nav. Mood emojis are content, not chrome.
- **Layout-shifting hovers** — no `transform: scale(1.05)` on cards. Depth via shadow only.
- **Background gradients on cards** — flat fills only. Photography provides the visual richness.
- **Multiple competing CTAs** — one Build CTA per Story Card. Secondary actions (share, save) are icon-only and live in a sub-row.
- **The word "leverage"** in any copy. (CLAUDE.md.)
- **Subscription gating, mana economy, Pulse upsell** before MVP. Don't even mock them in.

---

## 10. Mobile-first breakpoints

Design and review **at 375 first**, then expand. A feature that doesn't make sense at 375 doesn't ship.

| Name | Min width | Layout shift |
|---|---|---|
| **Mobile (default)** | `375px` | 1-col feed. Sticky bottom switch bar. Mood chips horizontally scrollable under header. BuildSheet is a bottom sheet. |
| **Tablet** | `768px` | 2-col feed (masonry). Switch bar moves inline under header (no longer sticky bottom). Mood chips fit on one row. |
| **Desktop** | `1440px` | 3-col masonry feed. Switch bar collapses into a left rail. Industry bento opens as a popover. BuildSheet is a right drawer (`420px`). |

Tailwind breakpoints to use:
```ts
screens: {
  sm: '375px',    // mobile (default — design here first)
  md: '768px',    // tablet
  lg: '1024px',   // small desktop (no layout change vs md by default)
  xl: '1440px',   // desktop target
}
```

**Touch targets:** ≥ `44×44px` everywhere on mobile. Build CTA is `48px` tall to dominate. Mood chips are `36px` (acceptable inside a horizontally scrolling row where the row itself has `≥44px` of vertical hit area).

---

## 11. Accessibility floor (non-negotiable)

- Body text contrast ≥ **4.5:1** (`--color-ink` on `--color-paper` = `≈18.4:1` ✓).
- Caption text contrast ≥ **4.5:1** (`--color-pen` on `--color-paper` = `≈10.1:1` ✓).
- Mood chips, when active, must hit `4.5:1` against their tint (mood-lens table above documents the on-tint text choice — verify any new tint).
- All interactive elements have a visible `:focus-visible` ring (`2px solid --color-ink`, `offset 2px`).
- All photos have descriptive alt text (no `alt=""` on founder portraits).
- All icon-only buttons have `aria-label`.
- `prefers-reduced-motion`: drop sheet slide → fade, drop streak pulse, drop CTA tap-pulse.
- Forms (Suggest page later): visible labels, never placeholder-only.

---

## 12. Pre-delivery checklist (every batch)

Before opening a PR or running `/design-review`:

- [ ] All tokens come from this MASTER (or the page override) — no hand-picked hex in components
- [ ] Fraunces + Geist Sans loaded in root layout, no other primary font in use
- [ ] No `backdrop-filter` on Story Cards, BuildSheet body, or modal interiors. Glass tokens (`--glass-chrome`, `--glass-floating`, `--glass-toast`) permitted only on floating chrome per Section 5, and every usage has an `@supports not` fallback to solid `--color-card`
- [ ] No purple/pink-purple gradients anywhere
- [ ] No emojis as UI icons (mood emojis ok inside chips/strips only)
- [ ] No globe, no 3D background, no terminal aesthetic
- [ ] Build CTA visible on every Story Card; opens BuildSheet on tap
- [ ] Mood lens chip row works at 375px without horizontal page scroll
- [ ] Sticky bottom switch bar does not occlude the last card (`padding-bottom` on feed = switch bar height + 16px)
- [ ] All clickable elements have `cursor-pointer`
- [ ] Touch targets ≥ 44×44 on mobile
- [ ] Hover states are depth-only (no transform on cards)
- [ ] Reduced-motion path tested
- [ ] Screen-reader pass at 375px (cards, mood chips, sheet)
- [ ] Lighthouse Perf ≥ 90, A11y ≥ 90 on `/` at mobile preset
- [ ] Visual diff at 375 / 768 / 1440 — three screenshots in PR
- [ ] Loom-style 60s demo recorded (CLAUDE.md requirement)

---

## 13. Page override directory

Per-route deviations live in `design-system/pages/<page>.md` and override this file at the page scope. Suggested overrides as the build progresses:

- `pages/feed.md` — the home `/` mood feed
- `pages/story.md` — `/story/[id]` deep link
- `pages/forge-bridge.md` — the BuildSheet → `/forge?seed=` handoff
- `pages/daily-brief.md` — the first-load modal

Empty placeholders are fine — create them when a page first ships.
