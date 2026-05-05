# `/` — The Feed (page override)

> **Scope:** the home route `/`. This file overrides `design-system/MASTER.md`
> only for the rules below. Everything not redefined here — Story Card recipe,
> color tokens, type scale, motion, anti-patterns — inherits **verbatim** from
> MASTER. In particular, the Story Card visual spec is MASTER §7; do not
> duplicate it here. Override what's *route-specific*, not what's universal.

The home feed is the heart of Catalst Market: vertical scroll, edge-to-edge Story Cards, Pinterest-meets-Twitter For-You energy. A user lands here, scans 3 cards in 3 seconds, and decides whether to stay. Mobile-first at 375 — every rule below was decided for that viewport first and adapted up.

> **Override (2026-05-03, Phase 6b):** The home feed adds a **dotted-continent globe** as the editorial hero on first paint. This explicitly overrides CLAUDE.md ("Don't build a globe — last attempt was wrong for mobile feed") and MASTER §9 ("Globe / 3D background ... Don't"). The override is **scoped to `/`** — `/story/[id]`, `/forge`, and any future page still inherit the ban. The reversal is justified by a different design grammar: not a 3D rotating data-globe (which is what was banned), but a flat dotted-continent SVG matrix in the visual idiom of the *Code w/ Claude* poster — restrained, warm, editorial, and explicitly subtle. See §7 for the layout rules, §8 for tap-dot behavior, §9 for wireframes.

---

## 1. Card width per breakpoint

| Breakpoint | Layout | Card width treatment |
|---|---|---|
| **375px (mobile)** | 1-col | Full-bleed minus a `16px` gutter on each side (`margin-inline: 16px`). Cards stretch edge-to-edge of the gutter. |
| **768px (tablet)** | 2-col masonry | `24px` gutter between columns and at viewport edges. **Max card width: 360px** — cards do not stretch beyond this even if column has room. |
| **1440px (desktop)** | 3-col masonry | `32px` gutter between columns and at viewport edges. **Max card width: 420px** — same don't-overstretch rule. |

**Why max widths instead of flex-fill:** photos lose their editorial weight past ~420px wide on desktop, and reading-line-length on the body copy goes past 75 characters. Capping width keeps the magazine-card feeling at every breakpoint.

Implementation hint: use CSS Grid `repeat(auto-fill, minmax(min(100%, var(--card-max)), 1fr))` with `--card-max` set per breakpoint. Masonry can be CSS `column-count` (good enough at 2-3 cols) or a JS masonry lib if column balancing matters.

---

## 2. Vertical rhythm

Story-to-story gap, applied as the grid `gap` (or `row-gap` if columns):

| Breakpoint | Gap | Token |
|---|---|---|
| **375px** | `32px` | `var(--space-8)` |
| **768px+** | `40px` | `var(--space-10)` |

The mobile-tighter / desktop-looser ladder matches the cards-feel-bigger-because-everything-is-closer logic at small viewports, and gives more breathing room as the grid widens.

---

## 3. Header behavior on scroll

| State | Behavior |
|---|---|
| **At top of feed** (`scrollY = 0`) | Header fully visible. **Transparent background** — no glass, no solid fill. Body content (the globe hero) shows through. The streak chip + XP bar sit on the Paper background unaided. See §7 for what's beneath the header at this state. |
| **Scrolling down** | Header hides via `transform: translateY(-100%)` over `220ms cubic-bezier(0.4, 0, 1, 1)` (ease-out). Once `scrollY > 80px` and direction is down. |
| **Scrolling up by > 40px** | Header reappears with **`.glass-chrome` treatment** (`backdrop-filter: blur(24px) saturate(140%)`, Paper at 0.72) over `200ms cubic-bezier(0, 0, 0.2, 1)` (ease-in). Hairline border `rgba(11,11,15,0.06)` becomes visible. **When `scrollY > globeBottomY + 40`**, the header also includes the collapsed globe minimap (left) + the filter rail (right) — see §7.3. |
| **Streak chip + XP bar** | Slide along with the header — they live inside the header element, not as separate floating chips. Single `transform`, single repaint. |

**Why the 40px scroll-up threshold:** keeps the header from yo-yoing on jitter scrolls. A user actually pulling up to navigate moves > 40px in one gesture; a thumb-rest tremor doesn't.

**Reduced motion:** drop the translate, use `opacity 0 ↔ 1` over `200ms`. (Inherits from MASTER §11; calling it out so the implementer doesn't reinvent the rule.)

---

## 4. First-paint priority

Cards visible above the fold get `next/image` `priority` plus `fetchpriority="high"`. Below the fold defaults to `loading="lazy"`.

| Breakpoint | Priority cards | Lazy from |
|---|---|---|
| **375px** | First **2** | Card #3 onward |
| **768px** | First **4** | Card #5 onward |
| **1440px** | First **6** | Card #7 onward |

The numbers match what's actually in the viewport on first paint at each width given the cards-per-row + average card height. Erring smaller is wrong (LCP suffers); erring larger wastes bandwidth on cards the user never sees.

For founder-photo cards specifically: the photo is the LCP candidate. `priority` here also suppresses the placeholder blur for the priority set (use `placeholder="empty"`) — a placeholder blur on the LCP element delays the actual paint by 50-200ms.

---

## 5. Skeleton card design

While the feed is loading, render **same-dimensions** skeleton placeholders. The grid doesn't reflow when real cards arrive — that's the whole point.

```
┌────────────────────────────────────┐  radius-lg, no shadow
│ ▮ MOOD STRIP — solid --color-rule  │  32px tall
├────────────────────────────────────┤
│                                    │
│   PHOTO REGION — solid             │  4:5 aspect
│   --color-rule                     │
│                                    │
├────────────────────────────────────┤
│ ████████████████████████  60% wide │  bar 1 — headline number area
│ ███████████████  40% wide          │  bar 2
│ ██████████  30% wide               │  bar 3
│                                    │
│ [  ──────── solid pill ────────  ] │  Build CTA placeholder, full-width
└────────────────────────────────────┘
```

- All bars: `--color-rule`, `border-radius: var(--radius-sm)`, height `1em` worth (~`16-24px` depending on which bar).
- Spacing between bars: `var(--space-2)` (`8px`).
- CTA placeholder: full-width pill, height matches the real Build CTA (`48px`), `--color-rule` fill.
- **No shimmer animation.** No moving gradients, no pulse, no fade-loop. Static placeholders only. Shimmer is overdone, costs CPU on low-end Android, and visually conflicts with the editorial restraint of the real cards. The skeleton's job is to hold space, not entertain.

Show skeletons for at most 600ms — past that we're slower than the user's patience and should surface a "Loading slowly…" caption above the feed.

---

## 6. Empty state (zero stories match active filters)

When the active filter combination (mood + stage + industry) returns zero stories, replace the feed with a centered Paper card.

| Element | Spec |
|---|---|
| **Container** | Single full-bleed `--color-paper` card, max-width `560px`, vertically centered in the feed scroll surface. Padding `var(--space-12)` on all sides. No border, no shadow — the empty space *is* the design. |
| **Heading** | Fraunces, `text-h1` size (or `text-h2` on 375px), color `--color-ink`. Copy: **"No signals match your filters yet."** |
| **Sub-line** | Geist, `text-body`, color `--color-pen`, `margin-top: var(--space-3)`. Copy: **"Loosen a filter, change your mood, or wait — new stories drop every 30 minutes."** |
| **Primary action** | Single Coral pill button (the standard `.btn-build` recipe from MASTER §7, but with reset-icon-left). `margin-top: var(--space-6)`. Copy: **"Reset filters"**. On tap, clears mood + stage + industry to defaults and re-fetches. |
| **Live caption** | Geist, `text-caption`, color `--color-pen`, `margin-top: var(--space-4)`. Copy: **"Last signal arrived [N] [units] ago"** — `N` and `units` derived from the latest story's `createdAt` across *all* moods (not just the active filter). Updates client-side every `60s` via a setInterval. |

**Copy rules:**
- Use "signals," not "stories" or "results" — matches the product's mood/feed vocabulary.
- "30 minutes" is the rough ingestion cadence; if that changes, change the copy.
- The live caption answers "is this thing alive?" without making the user open another tab. Static "0 results" empty states feel broken; this one feels paused.

**Anti-pattern (calling out explicitly):** do **not** suggest filter combinations the user could try ("Try Underdog wins + Bootstrappers"). That's a recommendation engine, and we don't have one yet. The Reset button is the one true escape hatch.

---

## What this file does NOT redefine

These all inherit unchanged from MASTER:

- The Story Card visual recipe itself (mood strip, photo, headline number, micro-bullets, "why it matters now" line, Build CTA layout) — **MASTER §7**
- Color tokens, mood tints, on-tint text colors — **MASTER §3**
- Type scale (`text-hero`, `text-h1`, etc.) — **MASTER §4**
- All motion presets, easing curves, durations — **MASTER §6**
- Hard anti-patterns (no purple gradients, no Inter/Roboto, no glass on content surfaces, etc.) — **MASTER §9**
- Touch targets ≥ 44×44, accessibility floor — **MASTER §10–11**

If you find yourself wanting to override one of those *for the feed specifically*, stop and reconsider — most of the time the right move is to update MASTER instead, because the same rule probably applies to `/story/[id]` and the BuildSheet too.

---

## 7. v3 — Editorial Console (supersedes WZ)

> **Override (Phase 6c.5 brainstorm, after live review of the WZ home page):**
> WZ shipped four modules (Header · Globe · LiveSignals · Top 3) and the user's
> live verdict was tight: too sparse to be a dashboard, too dashboard-y to be
> editorial. v3 extends to **seven modules + one universal filter** while
> keeping the editorial-terminal restraint. User direction (verbatim,
> condensed):
>
> > "I'm not really understanding much from the signal — maybe more tags. It's
> > not overwhelming, keep the editorial style. Top headlines or other stats.
> > No header. Live feed of business and startup world in cool editorial
> > terminal fashion. Easily check trending ideas according to events / moods /
> > industries, find detail, then make a replica or twist with Catalst. A
> > portion that reacts to the globe — if they select a city, the main
> > startups according to industry or mood. Universal filter for moods /
> > industries / stages. Spot on, actionable dashboard."
>
> The v3 architecture answers five tracking questions through seven modules:
>
> | Q | What the user wants to know | Module that answers it |
> |---|---|---|
> | 1 | What just happened (24h freshness) | D. Live Signals |
> | 2 | Where it's happening (globe + city dive) | B. Globe + C. City Panel |
> | 3 | What kind of bet is winning right now | E. Trending Heuristics |
> | 4 | What could I build today | F. Build Angles |
> | 5 | Pick a story and read it | G. Top 3 Stories |
>
> Sections **7a–7g** are the v3 spec. The prior WZ direction is preserved
> below as **§7-v2** (DEPRECATED, kept for design history). The shipped
> Globe / GlobeHero / LiveSignals / StoryCard primitives from Phase 6b–6c
> are all reused as modules in v3 — only the surrounding composition
> changes plus three new modules (City Panel, Trending Heuristics, Build
> Angles) and one cross-cutting concern (Universal Filter).

### 7a. Brainstorm record — three candidates evaluated

#### Candidate ALPHA — "Editorial Newspaper" (rejected as solo)

12-column desktop grid in the spirit of NYT Briefing or Bloomberg Daily Dive.
Globe upper-right where a newspaper photo would sit. Universal filter inline
with brand wordmark top-left. Heat headline + city panel as a 2-col block
under the globe. LiveSignals as a long single-column scrolling under the
globe area. Trending heuristics as a 3-column row mid-page. Build angles as a
left-aligned editorial vertical stack. Top 3 cards at bottom (longest form).
Mobile: vertical priority stack.

**Standout move.** Globe positioned where a real-newspaper hero photo sits —
visual analogy carries the editorial tone without ornament.

**Honest weakness.** The globe upper-right and the city panel under-globe
means they're spatially adjacent vertically but not the SAME row. Tapping a
globe pin to surface the city panel is a vertical eye-jump — works, but
loses the "feels reactive" quality. 12-col grid also forces too many
horizontal divisions on the eye when seven modules compete; below-fold
scroll required even on 1440.

#### Candidate BETA — "Mission Control" (rejected as solo)

Hub-and-spoke. Globe huge in center (~50% of viewport width). Modules orbit:
top-left = wordmark + filter + LiveSignals (combined info column), top-right
= trending heuristics (mini cards), bottom-left = city panel, bottom-right =
build angles, bottom-center = top 3 cards (full-width row). NASA mission
control rendered in warm editorial type.

**Standout move.** Globe DOMINATES (~50% width) rather than companions other
modules — the only candidate where the globe is unambiguously the marquee.
Spatial proximity = functional relationship: city panel sits directly below
the globe so reactivity is felt physically.

**Honest weakness.** Mobile DOA — orbital layout doesn't degrade gracefully;
everything has to stack vertically anyway, losing the spatial relationships
that justified the layout. NASA aesthetic risks Bloomberg-cold instead of
editorial-warm. Symmetric quadrants around the globe trip the same dashboard
trap that killed Candidate X in the WZ brainstorm.

#### Candidate GAMMA — "Living Page" (rejected outright)

The whole page IS the editorial. No discrete modules with hard borders — a
continuous flow that reads top to bottom like a Substack post. Heat headline
becomes an editorial paragraph ("Bangalore is hot today. Five signals out of
India in the last 24 hours. Two AI launches, one Series F."). Globe inline
within the prose. LiveSignals as italic ticker between sections. Trending as
a "the week in numbers" callout. Build angles as a "What you could build
today" inline recommendation. Top 3 as "And here's what's worth reading in
full."

**Standout move.** Most novel + most editorial of the three. Reads like a
morning newsletter, which is exactly what Catalst aspires to in voice.

**Honest weakness.** The user explicitly said "spot on, actionable
dashboard." Gamma fights that direction — a user wanting to JUMP to "what's
hot in AI right now" has to read prose first. Loses scannability. Also the
hardest to engineer (continuous prose generation from data + a mid-paragraph
SVG globe is a layout fight). Gamma is the right answer to a different
brief.

### 7b. Winner — Candidate "Editorial Console" (synthesis ALPHA + BETA)

Take ALPHA's editorial-grid foundation. Take BETA's spatial proximity for
the globe ↔ city panel reactivity. Reject GAMMA's prose-first direction
because it fights the dashboard ask. The winning shape:

**Hero band: 3 columns side-by-side on desktop — `LiveSignals | Globe | Heat+City`.**
The city panel sits IMMEDIATELY beside the globe so reactivity is felt
spatially: tap a globe pin, watch the panel right next to it populate.
LiveSignals on the far-left answers the TIME question with a companion
column.

**Secondary band: full-width sections, top to bottom — Trending Heuristics →
Today's Build Angles → Top 3 Stories.** Each is a scannable surface with one
job. Trending = momentum. Angles = "what could I build." Top 3 = "what
should I read in full."

**Universal filter: Spotlight palette (Cmd+K) + persistent chip rail.**
Filter changes ripple through every module simultaneously. Globe pins fade
non-matching cities, LiveSignals filters items, Top 3 reshuffles, Build
Angles regenerate. Trending Heuristics stays GLOBAL (it IS the filter
dimension — filtering Trending by Industry would defeat the point) but the
active industry chip gets highlighted.

**Why this beats the alternatives** (under 250 words):

ALPHA gets the editorial-grid right but loses the globe ↔ city reactivity
to a vertical eye-jump. BETA gets the reactivity right but breaks on mobile
and risks the symmetric-dashboard trap. GAMMA is too prose-y for the user's
"actionable dashboard" ask. Editorial Console keeps the 3-col hero band of
BETA (globe + immediate-neighbor city panel) without the orbital symmetry,
sits inside an editorial grid the eye can scan in 3 seconds (ALPHA's
sensibility), and degrades to a clean priority stack on mobile (Globe →
Heat → Ticker → City → Trending → Angles → Top 3) without having to
re-architect the layout. The seven-module density is real but each module
has one job and editorial-grade type weights anchor the hierarchy. The
global filter cuts through every surface so the "spot on" feeling lands —
filter to Industry=AI and the entire page rebases to "how does the AI
world look right now" in one chip tap.

### 7c. Editorial Console — module map

**Module count: ratified at 7 (six content + one chrome).** Module A is the
top-band chrome composition (wordmark + filter chip + streak/XP); modules
B–G are the six content surfaces. The Universal Filter (⊙) is a cross-
cutting concern, not a separate module slot.

**Anti-pattern (v3 explicit):** scroll-up does NOT bring back a glass header.
The top band is part of the page body, NOT `position: sticky`. Content
scrolls away on its own. The WZ scroll-collapse pattern in §3 is implicitly
deprecated under v3 — re-introducing it requires a fresh override.

| # | Module | Where (desktop) | Where (mobile) | Job |
|---|---|---|---|---|
| A | Wordmark + Universal Filter chip + Streak | Top band, full width | Top band, compact | brand + filter handle + habit cue |
| B | Globe Hero | Hero band, center column, **340px wide locked** | Below A, **clamp(280px, 38vh, 340px)** | Where it's happening |
| C | Heat Headline + City Panel | Hero band, right column (320px wide) | Below B + ticker | Globe-reactive deep-dive into one city |
| D | Live Signals | Hero band, left column (280px wide, sidebar variant) | Inline ticker beneath B | What just happened |
| E | Trending Heuristics | Below hero band, 6-col strip | Below C, horizontal-scroll row | What kind of bet is winning |
| F | Today's Build Angles | Below E, 3-col grid | Below E, vertical stack | What could I build today |
| G | Top 3 Stories | Below F, 3-col grid | Below F, vertical stack | Pick a story and read it |
| ⊙ | Universal Filter | Cmd+K palette + chip in A | Cmd+K palette + bottom-floating chip | Cross-cutting filter |

### 7d. Editorial Console — desktop wireframe (1440px)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ CATALST MARKET   [▾ All — 0 filters]                  🔥 7    ▰▰▰▱▱     │  A — top band
├───────────────────────────────────────────────────────────────────────────┤
│ ┌──────────┬─────────────────────────┬──────────────────────────────┐    │
│ │ ░ LIVE   │                         │ Today: BANGALORE is hot      │    │  C — heat headline
│ │ SIGNALS  │                         │ — 5 signals                  │    │
│ │ ──────   │                         │ 1 funding round, 1 AI release│    │
│ │ 11:42    │                         │                              │    │
│ │ [FUND]   │                         │ ─── CITIES ────────────      │    │
│ │ Zepto    │   ░ ·   ·   · ░         │ • BLR · 5 ░░░░░              │    │  C — city heat
│ │ $500M  ★ │  ·  [GLOBE 340]  ·      │ • SF  · 3 ░░░                │    │       table
│ │ ──────   │  · ░       ░ ·          │ • LON · 2 ░░                 │    │
│ │ 11:38    │   ░ · BLR · ░           │ • LA  · 1 ░                  │    │
│ │ [FUND]   │     · · · ·             │                              │    │
│ │ Cursor   │   (globe locked 340px)  │ ─── CITY: BANGALORE ───      │    │
│ │ $9B    ★ │  Today: BLR is hot      │ ▮ Zepto      $500M  FUND     │    │  C — city stories
│ │ ──────   │  ── 5 signals ──        │ ▮ Sarvam     +22pts AI       │    │       (6 visible)
│ │ ...      │                         │ ▮ Razorpay   $200M  MILE     │    │
│ │ (8 more) │                         │ ▮ Cred       8.4K★  OS       │    │
│ │ ──────   │                         │ ▮ PhonePe    $15B   IPO      │    │
│ │ pause:   │                         │ ▮ +0 more →                  │    │
│ │ hover    │                         │                              │    │
│ └──────────┴─────────────────────────┴──────────────────────────────┘    │
│  D — Live Signals     B — Globe Hero    C — Heat + City Panel             │
│  (sidebar variant)                                                        │
├───────────────────────────────────────────────────────────────────────────┤
│ TRENDING THIS WEEK                                                        │
│ ┌───────┬───────┬───────┬───────┬───────┬───────┐                       │  E — Trending
│ │ AI    │ FINTECH│ COMM  │ DEV   │ DEFENSE│ CONSUM│                       │      6-col strip
│ │       │        │       │       │        │       │                       │
│ │   6   │   4    │   2   │   2   │   1    │   1   │                       │
│ │ ↑ 22% │ ↑ 12%  │ ↑ 8%  │ —     │ ↑ —    │ ↓ 5%  │                       │
│ │       │        │       │       │        │       │                       │
│ │Sarvam │ Zepto  │PhonePe│ Cred  │Anduril │ByteDnc│                       │
│ │ +22pt │ $500M  │ $15B  │ 8.4K★ │ $2B    │ -1500 │                       │
│ └───────┴───────┴───────┴───────┴───────┴───────┘                       │
├───────────────────────────────────────────────────────────────────────────┤
│ TODAY'S BUILD ANGLES                                                      │
│ ┌────────────────┬────────────────┬────────────────┐                    │  F — Build Angles
│ │ Q-commerce for │ Open-weight    │ Defense supply │                    │      3-col
│ │ tier-3 cities  │ Indic LLM API  │ chain in a box │                    │
│ │                │                │                │                    │
│ │ Inspired by:   │ Inspired by:   │ Inspired by:   │                    │
│ │ Zepto, ByteDnc │ Sarvam, Mistrl │ Anduril, ByteD │                    │
│ │                │                │                │                    │
│ │ ▼ expand       │ ▼ expand       │ ▼ expand       │                    │
│ └────────────────┴────────────────┴────────────────┘                    │
├───────────────────────────────────────────────────────────────────────────┤
│ TOP 3 — ALL FILTERS                                                       │
│ ┌────────────┬────────────┬────────────┐                                 │  G — Top 3 Stories
│ │ #1  Zepto  │ #2 Sarvam  │ #3 Razorpy │                                 │      (existing
│ │ $500M FUND │ +22pts  AI │ $200M MILE │                                 │      StoryCards)
│ │ ▼ expand   │ ▼ expand   │ ▼ expand   │                                 │
│ └────────────┴────────────┴────────────┘                                 │
└───────────────────────────────────────────────────────────────────────────┘
```

### 7e. Editorial Console — mobile wireframe (375px)

```
┌─────────────────────────────────────┐
│ CATALST  [▾ All]            🔥 7    │  A — compact top band
├─────────────────────────────────────┤
│         [GLOBE 280h]                │  B — globe full-width
│  Today: BLR is hot — 5 signals      │      heat headline beneath
├─────────────────────────────────────┤
│ ◄ LIVE  [FUND] Zepto $500M · ...   │  D — inline ticker
├─────────────────────────────────────┤
│ ─── CITY: BANGALORE ───             │  C — city panel
│ ▮ Zepto      $500M    FUND          │      6 stories visible
│ ▮ Sarvam     +22pts   AI            │
│ ▮ Razorpay   $200M    MILE          │
│ ▮ Cred       8.4K★    OS            │
│ ▮ PhonePe    $15B     IPO           │
│ +0 more →                           │
├─────────────────────────────────────┤
│ TRENDING                            │  E — trending
│ ┌──┬──┬──┬──┬──┬──┐ →              │      h-scroll row
│ │AI│FI│CM│DV│DF│CN│                 │
│ │6 │4 │2 │2 │1 │1 │                 │
│ │↑ │↑ │↑ │— │↑ │↓ │                 │
│ └──┴──┴──┴──┴──┴──┘                 │
├─────────────────────────────────────┤
│ TODAY'S BUILD ANGLES                │  F — build angles
│ ┌─────────────────────────────────┐ │      vertical stack
│ │ Q-commerce for tier-3 ▼         │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Open-weight Indic LLM API ▼     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Defense supply chain in box ▼   │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ TOP 3 — ALL FILTERS                 │  G — top 3 cards
│ ┌────┐                              │      vertical stack
│ │ #1 │ ▼                            │
│ └────┘                              │
│ ┌────┐                              │
│ │ #2 │ ▼                            │
│ └────┘                              │
│ ┌────┐                              │
│ │ #3 │ ▼                            │
│ └────┘                              │
├─────────────────────────────────────┤
│                              [▾ ⊙]  │  ⊙ — floating filter
└─────────────────────────────────────┘      chip (sticky bottom)
```

### 7f. New module specs (data shapes, states, interactions, visuals)

#### Module C — Heat Headline + City Panel

**Data shape (TypeScript interface):**
```ts
interface CityPanelData {
  /** Authoritative city slug from CITIES (world-data.ts). */
  citySlug: string;
  /** Display name, e.g. "Bangalore". */
  cityName: string;
  /** IATA-style code, e.g. "BLR". */
  cityLabelShort: string;
  /** Up to 6 stories from this city, post-universal-filter. */
  stories: AnyStory[];
  /** Total stories in this city BEFORE truncation to 6. */
  totalCount: number;
  /** Per-mood signal-count breakdown for the right-rail mini bar chart. */
  moodCounts: Record<Mood, number>;
}
```

**Loading.** Skeleton: heat-headline two-line bar at 60% width, then 6
list-row placeholders (mood-bar + headline-text bar at 50% + type-cassette
bar at 20%).

**Empty.** "No stories from <City> match your filter — try clearing some
scopes." Inline link: "Clear filter" → resets universal filter to All.

**Error.** Build-time data, can't fail at runtime. If the active city has
no stories at all (zero total, not zero post-filter), copy is "Quiet day in
<City>."

**Interaction.**
- Tap a story row → expand inline as a mini-StoryCard (reuses the
  expanded-body recipe from `<StoryCard>`).
- Tap "+N more →" → opens a `/city/[slug]` route with the full list (Phase 7
  scope — for now, a no-op with a console.log).
- **"+N more →" link is rendered only when N > 0** (i.e., `totalCount >
  stories.length`). When the active city has zero matches under the current
  filter, the empty-state copy in §7f-loading replaces the row list and the
  link is suppressed entirely.

**Connection to other modules.**
- LISTENS to Globe `onPinTap(citySlug)` → re-targets the city panel to
  that city.
- LISTENS to Universal Filter changes → filters the `stories` array to
  matching mood/industry/stage.
- LISTENS to GlobeHero `onStopChange(citySlug)` for a subtle highlight
  pulse on the matching row inside the city panel (mirrors WZ's card-pulse
  pattern from `app/page-client.tsx`).

**Visual treatment.**
- White card surface (`--color-card`), hairline border (`--color-rule`).
- Heat headline: Fraunces 600 opsz 96, 24px mobile / 28px desktop, ink color.
  The `<City>` word colored Coral (`--color-cta`) per MASTER §3 — this is
  the permitted second saturated point on first viewport.
- Mini "Cities" bar table (desktop only): 4-row mood-tinted progress bars
  showing top 4 cities by signal count. Tap a row → re-targets the city
  panel to that city (alternative path to globe-pin tap).
- Story rows: 4px-wide mood-tinted left bar, then headline-number + title +
  type-cassette + city-short. ~52px per row × 6 rows = ~312px tall on
  desktop. Hairline rule between rows.

#### Module D — Live Signals (v3 amendments)

The shipped `<LiveSignals>` component (Phase 6c Part 2) carries forward
into v3 with two changes:

**1. Stronger TYPE tag rendered BEFORE the company name.** Each row
becomes:

```
11:42  [FUND] Zepto $500M    BLR   ← desktop sidebar item
◄ LIVE  [FUND] Zepto $500M ·  ...  ← mobile ticker item
```

The type tag is a tiny dotted-text cassette (matching StoryCard's
top-right type cassette). Tag values: `[FUND] [LAUNCH] [AI] [MA] [IPO]
[MILE] [FOUNDER] [OS] [LAYOFF] [SHUT] [REG]` — same vocabulary as the
existing `TYPE_DISPLAY` table in `components/story/StoryCard.tsx`.
Position: between the time cell and the company name. Width: roughly
matches a 3-character type code; expands to fit longer ones (FUNDING,
FOUNDER) at the same dot pitch.

**2. Notable-metric color rolls back from Coral to ink (visual weight via
font-weight, not hue).** Spec was ratified: LiveSignals notable metrics
no longer use `--color-cta`. New rendering:

| Metric kind | Pre-v3 | v3 |
|---|---|---|
| `isNotable: true` | Coral, Geist 600 | **`--color-ink`, Geist 700** |
| `isNotable: false` | ink, Geist 600 | `--color-ink`, Geist 600 |

The visual emphasis remains (notable metrics still draw the eye via
boldness), but Coral is removed from this surface entirely. Combined
with the heat-headline `<City>` Coral span, the first viewport now
shows ≤2 Coral locations: Build CTA (when expanded) and the heat
city span. Trending Heuristics' `↑ N%` arrow stays on its existing
ink + caption-grey palette — that wasn't Coral pre-v3 and isn't now.

**Loading / Empty / Error.** Unchanged from Phase 6c Part 2 spec.

**Interaction.** Unchanged. Tap row → `onItemTap(storyId)`. Filter
applies — items not matching the active universal filter scope drop
out of the visible list.

**Connection to other modules.**
- Subscribes to `useFilter` for the cascading item filter.
- Tap surfaces a BuildSheet preview (Phase 6e wiring).

**Visual treatment delta from Phase 6c Part 2:**
- TYPE tag: tiny pin-label Cassette + DottedText, dot size 1, ~14px
  tall, fits between time cell and company name with 6px horizontal
  margin on each side.
- Notable metric: `text-ink font-bold` (was `text-cta font-semibold`).

#### Module E — Trending Heuristics

**Data shape:**
```ts
interface TrendingCategory {
  industry: Industry;
  industryLabel: string;       // "AI" / "FINTECH" / "COMMERCE" / etc
  signalCount: number;          // last 7 days, GLOBAL (filter does NOT apply)
  prevSignalCount: number;      // prior 7 days for delta
  weekDelta: number;            // (signalCount - prev) / max(prev, 1)
                                 // -1.0 .. +∞, displayed as -100% to "↑ N%"
  topStory: { id: string; oneLine: string };  // top story in this industry
}

interface TrendingHeuristicsData {
  /** Top 6 industries by current-week signal count, descending. */
  categories: TrendingCategory[];
}
```

**Loading.** Six rectangular skeleton cards in a row (desktop) or h-scroll
strip (mobile). All bars at 60/40/30% widths.

**Empty.** **Six cards exact at every viewport — no scaling to 8 on wide.**
If the seed has fewer than 6 active industries, render placeholder "0 —
quiet" cards for the remaining slots (do NOT suppress slots, do NOT
collapse the strip width). The grid is always 6, even when half are quiet.

**Error.** Same as empty.

**Interaction.**
- Tap a card → toggles that Industry in the universal filter state.
  **Symmetric: tapping an already-active industry CLEARS that industry
  from the filter.** No long-press hold-to-clear, no separate "remove"
  affordance — same tap, opposite direction.
- Long-press / right-click (desktop) → open `/industry/[slug]` (Phase 7
  scope).

**Connection to other modules.**
- Trending Heuristics IS a filter source. Universal Filter changes do NOT
  rebase Trending — that would defeat the purpose (filtering Trending by
  Industry would just show the active industry alone).
- Universal Filter changes DO highlight the active industry's card (Coral
  ring + "active" badge).

**Visual treatment.**
- Six small cards in a row, each ~180px wide × ~140px tall on desktop.
- Industry label: Geist 600 uppercase, 11px, tracked 0.06em, ink color.
- Signal count: Fraunces 700 opsz 96, 32px, ink color (the eye anchor).
- Week delta: Geist 500 13px caption with Lucide ArrowUp/ArrowDown/Minus
  icon. Up = `--color-cta`, Down = `--color-pen`, Flat = `--color-pen/60`.
- Top story summary: Geist 400 12px, single-line truncated, `--color-pen`.
- Active filter highlight: 2px Coral inset ring, "ACTIVE" dotted-text
  label in the card corner.

#### Module F — Today's Build Angles

**Data shape:**
```ts
interface BuildAngleCard {
  id: string;
  /** Declarative title, ≤ 8 words (matches Angle.title from lib/angles.ts). */
  title: string;
  /** Wedge description, ≤ 25 words (matches Angle.description). */
  description: string;
  /** One editorial sentence with optional company names (Angle.wedge_hint). */
  wedgeHint: string;
  /** 2-3 stories that inspired this angle — surfaced as chips on expand. */
  inspiringStoryIds: string[];
  /** Industry the angle ANCHORS in — drives mood-tint + filter relevance. */
  industry: Industry;
  /** Primary mood from the inspiring stories' dominant mood. */
  primaryMood: Mood;
}

interface BuildAnglesData {
  /** Three build angles aggregated from filtered stories. */
  angles: BuildAngleCard[];
}
```

**How angles get aggregated. Cross-story aggregate, NOT per-story.**
Editorial judgment over metadata.
- Group filtered stories by industry. For each industry with ≥2 stories,
  call `lib/angles.ts` to derive three Angles per story, dedupe by `title`
  across the industry's pool, score by `count of inspiring stories`.
- Pick top 3 angles globally (across industries) by score, ties broken by
  industry's signal count.
- Output: 3 cards. If filter narrows the pool to <3 angles, show
  fewer cards (don't pad with placeholders — the angle stash is editorial
  judgment, not a fill-the-slots quota).
- **Per-story alternative is rejected.** "One angle per top-3 card" was
  ratified out: build angles are a cross-story editorial layer, not a
  metadata mirror of the cards beneath them. A user opening a card and
  an angle should learn two different things.

**Loading.** Three rectangular skeletons.

**Empty.** "No angles match your filter — broaden it to see today's
recommendations." Inline link: "Clear filter."

**Error.** Same as empty.

**Interaction.**
- Tap card → expand in-place (similar to `<StoryCard>` expand pattern).
  Expanded card shows: full description, wedge_hint in italic Fraunces,
  3 inspiring-story chips (tap → expand that story in the Top 3 row), and
  a Coral "Build with Catalst" CTA.
- Multiple cards CAN be expanded simultaneously (unlike Top 3 row's
  single-expansion rule). Build Angles are a "stash" — user opens 2 to
  compare, then picks one. No layout shift; cards expand vertically in
  place.

**Connection to other modules.**
- Regenerates from filtered story pool when Universal Filter changes.
- Tapping a story chip inside an expanded angle expands the matching
  Top 3 card if the story is in Top 3, else opens BuildSheet preview
  (Phase 6d scope — for now, console.log).

**Visual treatment.**
- Card with mood-tinted top strip (12px tall, color = `--mood-{primaryMood.tint}`).
- Title: Fraunces 500 opsz 48, 18px, ink color. 2-line max with ellipsis.
- "Inspired by:" subtle label in Geist 500 11px tracked, `--color-pen/60`.
- Inspiring company names: Geist 500 13px, comma-separated.
- "▼ expand" affordance bottom-right.
- Expanded body uses `--color-card` surface (no glass). Coral CTA at the
  foot. Total expanded height ~360px on desktop.

#### Module A — Wordmark + Universal Filter chip + Streak

**Data shape:** Stateless layout primitive. Reads from a `useFilter()` hook
(Phase 6c.5 also defines this hook, see §7g).

**Visual treatment.**
- No discrete header strip — this band is part of the page body, NOT
  position:sticky. The user explicitly said "no header." (See §3 for the
  prior scroll-collapse header pattern, now deprecated for v3.)
- Layout: wordmark left (Fraunces bold 18px), filter chip middle-left
  (Geist 600 13px in a coral-ring pill when any scope is active, else
  rule-bordered), streak chip right, XP bar far-right (desktop only).
- Filter chip text states:
  - Zero scopes active: `▾ All — 0 filters`
  - One scope active: `▾ AI` (just the label)
  - Two scopes active: `▾ AI · Builder`
  - Three+ scopes active: `▾ AI · Builder · +1`
- Tap chip → opens Universal Filter palette overlay.

#### Universal Filter — Spotlight palette + chip

**Data shape:**
```ts
interface FilterScope {
  moods: ReadonlySet<Mood>;          // active moods, empty = no mood filter
  industries: ReadonlySet<Industry>; // active industries
  stages: ReadonlySet<Stage>;        // active stages
}

interface UseFilter {
  scope: FilterScope;
  toggleMood: (m: Mood) => void;
  toggleIndustry: (i: Industry) => void;
  toggleStage: (s: Stage) => void;
  clear: () => void;
  /** True when at least one scope is active. */
  isActive: boolean;
  /** Pretty short summary for chip text: "AI" / "AI · Builder" / "All". */
  chipLabel: string;
}
```

**Palette UI.**
- Cmd+K (or Ctrl+K) opens a centered modal overlay (480px wide on desktop,
  full-bleed on mobile).
- Three tabbed sections: Mood (9) · Industry (12) · Stage (3). Tap to
  toggle. Multiple selections compose (AND across categories, OR within
  a category — e.g. "AI OR Fintech AND Builder").
- "Clear all" button bottom-left of palette. "Done" button bottom-right.
- ESC closes. Click-outside closes.
- Active scopes mirror to the chip in real time (no separate "apply" step).

**Persistent chip.**
- Desktop: inline next to wordmark in module A.
- Mobile: floating bottom-right, 48px diameter pill, glass-chrome bg.
  Tap → opens palette. Holds the chipLabel + a small Lucide chevron.

**Cascading effects when scope changes.**
- Globe (B): pin OPACITY drops to 30% for cities with zero matching
  stories. Pin remains tappable. Heat headline city stays the highest-
  signal-count city in the FILTERED set.
- LiveSignals (D): list filters to matching items. Empty → quiet
  placeholder copy ("No signals match — try clearing a filter").
- City Panel (C): stories array filters to matching stories within the
  active city. Heat headline rebases to the filtered hot zone.
- Trending Heuristics (E): does NOT rebase. Active industry highlighted.
- Build Angles (F): regenerates from filtered story pool.
- Top 3 Stories (G): reshuffles to top 3 of filtered set. Section heading
  reframes ("TOP 3 IN AI" / "TOP 3 BUILDER STAGE" / "TOP 3 — ALL FILTERS").

**Reset behavior.**
- "Clear all" in palette → all three scopes empty, isActive=false, chip
  reverts to "All — 0 filters."
- ESC twice in palette → first ESC closes palette, second ESC has no
  effect (filter state persists).

### 7g. Editorial Console — acceptance bar

To pass `/design-review` ≥ 9 against this v3 spec, the implementation must
satisfy:

- [ ] First paint at 1440px shows ALL seven modules (A through G + filter
      chip) without scrolling. The hero band (D | B | C) is visible above
      the fold; Trending + Angles + Top 3 require scroll but are part of
      the same page composition (no route navigation).
- [ ] First paint at 375px shows A, B, the heat headline, and the inline
      ticker (D mobile variant) above the fold. C, E, F, G stack below.
      Floating filter chip pinned bottom-right.
- [ ] Globe pin tap re-targets the City Panel — verified by tapping
      a non-default city (e.g., SF) and watching the panel update.
- [ ] Universal filter cascades through all modules simultaneously (≤ 16ms
      single-frame for the visible set). Cmd+K opens the palette.
- [ ] Trending Heuristics tap applies the matching Industry filter and
      highlights the active card.
- [ ] Build Angles allow MULTIPLE simultaneous expansion (unlike Top 3
      row's single-expansion).
- [ ] Build CTA Coral budget on first viewport: **≤ 2 saturated Coral
      locations**, exactly: (a) Build CTA when an expanded card is on
      screen, (b) heat headline `<City>` span. LiveSignals notable-metric
      Coral has been **rolled back** under v3 — the live signals surface
      uses ink + Geist 700 weight for visual emphasis instead. Any third
      Coral source on first viewport fails this gate.
- [ ] No glass on Story Card body, City Panel rows, Trending cards, or
      Build Angle cards. Glass permitted only on the floating mobile
      filter chip and (optional) on a sticky scroll-state header band if
      reintroduced — but per user direction, v3 removes the sticky header.
- [ ] `prefers-reduced-motion`: card-pulse, palette open/close, filter
      cascade all use opacity-only transitions.
- [ ] Keyboard navigation: Cmd+K opens palette; Tab cycles modules in DOM
      order (A → D → B → C → E → F → G); Enter/Space activates focused
      element; ESC closes any open palette/expanded card.
- [ ] Lighthouse perf ≥ 90, a11y ≥ 90 on `/` mobile preset.
- [ ] Visual diff at 375 / 768 / 1440 in PR.

**Implementation deferred.** The user ratifies this v3 spec before any
code lands. Phase 6c.5 ends here as a design artifact. The shipped Phase
6b–6c primitives (Globe, GlobeHero, LiveSignals, StoryCard, HomeHeader,
HomeClient) are reused; the new modules (City Panel, Trending Heuristics,
Build Angles, Universal Filter) are built fresh in the implementation
phase that follows ratification.

### 7h. Phase 7a addendum — Editorial curation surfaces (2026-05-04)

Three new modules sit below the existing daily console (Module G — Top
3 Today), composed inside `<EditorialConsole>` and rendered from
`HomeClient`. They are editorial — not real-time — surfaces.

**Insertion order** (after existing G — Top 3 Today):

1. `BusinessOfWeek` — single-company spotlight, full-width on mobile,
   60/40 split on desktop (left brief + right dotted-typography
   pull-quote against a mood-tinted background).
2. `Top3OfWeek` — three large cards, ~50% taller than Top 3 Today,
   with 24px mood strips and curatorial-note paragraphs in italic.
3. `Movers` — three small horizontal ticker rows, ~80px tall,
   counter-programming to the headline-grabbers above.

The arc reads: today's heat (Top 3 Today) → the week's biggest single
story (BoW) → the week's biggest three (Top3OfWeek) → the week's hidden
three (Movers).

**Universal filter cascade:**

- `BusinessOfWeek` — UNFILTERED. The hand-curated weekly pick is
  editorial; the universal filter cannot override it. The component
  still receives the filtered angle list so the related-angle line
  resolves against the same pool the rest of the page sees.
- `Top3OfWeek` — FILTERED. Inactive filter → hand-curated picks from
  `content/curation/top3-of-week.json`. Active filter → recompute from
  filtered story pool sorted by createdAt desc, with a programmatic
  curatorial note that references the filter. Filtered pool < 3 → empty
  state ("being curated, check back tomorrow").
- `Movers` — FILTERED. Inactive filter → `getMovers(SEED_STORIES)`.
  Active filter → `getMovers(filteredStories)` so the same
  `isMoverCandidate` predicate runs against the filtered pool.
  Trailing slots fill with empty placeholders (existing component
  behavior) so the 3-row grid stays visually stable.

**Curation source files:**

- `content/curation/top3-of-week.json` — array of 3 entries
  (`{ rank, storyId, curatorialNote }`). Validated at build time;
  unknown storyIds throw. Future Phase 7c (Composio MCP) will swap for
  computed picks while keeping the same `Top3OfWeekItem` shape.
- `content/curation/business-of-week.json` — single object matching
  `BusinessOfTheWeek`. Build-time validation requires exactly 3
  weeklyArc paragraphs and exactly 3 keyStats.
- Movers has no JSON seed — it filters the existing seed via
  `isMoverCandidate` (non-tier-1 city AND (verified=false OR quiet
  headline)).

## 8. Aesthetic Playbook — Dotted vs Editorial (Phase 7b, 2026-05-04)

Canonical reference: **`design-system/PIXEL-AESTHETIC.md`**. Single
source of truth for which text elements render in dotted bitmap
typography vs editorial Fraunces / Geist / Spectral. Includes the
audit table for every text element on `/`, the 3-question rubric for
new modules, the standard DottedText scales, the worked examples, and
the bitmap-font support / anti-patterns list.

When adding a new module heading, use `<SectionCaption>` from
`components/feed/SectionCaption.tsx` — it is the only sanctioned
caption primitive and it routes through the dotted vocabulary
automatically. The `app/__tests__/pixel-aesthetic.test.tsx` contract
test enforces this in CI.

---

## DEPRECATED v2 — Candidate WZ (Phase 6c, 2026-05-03)

> **Notice:** Sections §7-v2 (formerly §7) below documented the WZ "terminal-
> density single-look" direction that shipped in Phase 6c. v3 (Editorial
> Console) above supersedes WZ for first-paint composition. The shipped
> Globe, GlobeHero, LiveSignals, StoryCard, HomeHeader components from
> Phase 6b–6c remain — they're reused as modules in v3. The deprecated
> WZ content is kept for design history.

## 7-v2. Layout direction — terminal-density single-look (DEPRECATED)

> **Override (2026-05-03, Phase 6c brainstorm):** The home feed direction has
> shifted from "vertical scroll of Story Cards" to "terminal-density single-look."
> The user reframed first-paint vision verbatim:
>
> > "The first land first look of the user should look like a terminal where we
> > aren't forcing them info just highlighting the trending things in the world
> > and they can look around the globe themselves or look at our top 3 suggestions
> > for the day and expand each one and there should be other tickers and signals
> > on the screen around the globe... it's good to have everything in one look but
> > it cant be overwhelming for the user we need to be very selective when it
> > comes to the info we are showing it needs to be actionable and expandable on
> > inquiry."
>
> Translated: globe is hero, surrounded by ambient signals at terminal density
> but with editorial restraint. Three top-suggested stories prominently expandable.
> Other tickers/signals selective, not firehose. Everything visible in one look,
> no scrolling needed for the core experience. Each piece actionable.
>
> **Sections 7a–7e** are the new spec. Sections 7-old through 10-old below carry
> a DEPRECATED banner — they document the prior Candidate D ("Anchored Globe")
> direction, kept for design history. The shipped Globe components (`<Globe>`,
> `<GlobeHero>`) remain reusable in the new layout; the change is *what surrounds
> the globe*, not the globe itself.

### 7a. Brainstorm record — four candidates evaluated

#### Candidate W — "Globe + Side Tickers" (rejected)

**Idea.** Globe centered. Three thin scrolling tickers running on the sides:
top funding rounds (left rail), top launches (right rail), top movers (bottom).
Top 3 suggested stories appear as expandable cards below the globe in a 3-column
row (mobile: stack vertically). Tickers are non-interactive scrolling text —
selective summaries, "tap for full feed" link.

**Modules (7).** Header · Globe + heat headline · Funding ticker (left) ·
Launches ticker (right) · Movers ticker (bottom) · Top 3 cards row · Build
CTA inside each expanded card.

**Selectivity.** Each ticker shows top 3-5 items only. Globe shows hot city +
3 stops. Top 3 row is curated daily picks.

**Expansion.** Top 3 cards click → expand IN PLACE (height grows, full content
+ Build CTA reveal). Re-tap collapses.

**Globe relationship.** Globe = geographic atlas. Tickers = recent time-ordered
movers. Top 3 = curated editorial picks. Three abstractions of "today" stacked.

**Honest weakness.** 7 modules is a lot. Mobile particularly suffers: tickers
eat 72px (3 × 24px) before content begins. Three concurrent scrolling text
streams = motion noise that fights the editorial restraint mandate. Top 3
below the fold on mobile is a regression vs the user's "in one look" rule.

#### Candidate X — "Globe + Quadrant Cards" (rejected)

**Idea.** Globe centered, smaller (40% viewport). Four quadrant cards around
it: NW = Top Funding, NE = Top Launch, SW = Top Founder Move, SE = Heat Index
by City. Each quadrant card shows ONE item and "see more" link. Mobile: globe
top, quadrants stack 2x2 below.

**Modules (5).** Header · Globe + heat headline · NW card · NE card · SW card ·
SE card.

**Selectivity.** One item per category card. "See more →" link navigates to
category-filtered route.

**Expansion.** Each quadrant card tap → category-filtered route OR bottom sheet
preview. Not in-place expansion.

**Globe relationship.** Globe is centerpiece; quadrants are categorical slices.
Symmetric layout reads as "dashboard."

**Honest weakness.** Reads as DASHBOARD, not LIVE FEED — the very Bloomberg
aesthetic CLAUDE.md bans. Static structure (4 fixed categories) doesn't surface
cross-category narratives — a single "Cohere acquihires Replit" story is both
M&A and founder-move; categorical cards force a pick. Mobile 2x2 below the
globe means 4 cards stacked — vertical scroll required immediately.

#### Candidate Y — "Globe + Top 3 Carousel + Stat Strip" (close runner-up)

**Idea.** Globe centered + larger. Below: horizontal carousel of top 3 stories
of the day, each ~70% viewport width on mobile (Apple Music "Featured" style).
Below carousel: a thin "stat strip" with 4-5 key metrics. No tickers — strip
is the entire ambient layer.

**Modules (5).** Header · Globe + heat headline + subline · Top 3 carousel ·
Stat strip · (Build CTA inside each expanded card).

**Selectivity.** Globe = geographic. Top 3 = curated daily picks. Stat strip
= aggregate numbers (no story-level data). Three abstractions, no overlap.

**Expansion.** Top 3 cards expand in-place (photo + bullets + Build CTA appear
on tap). On mobile, vertical expansion within the carousel slot. On desktop,
3-col row stays put with one column expanding.

**Globe relationship.** Globe ↔ stat strip share aggregate ("12 signals" =
roll-up of cities visible). Globe ↔ Top 3 share specifics (top cities ↔ top
stories often correlate). Stat strip is the *surface* of the Globe atlas.

**Honest weakness.** No live element. Stat strip is static data points, less
"alive" than scrolling tickers — the user explicitly named "tickers" as part
of the vision. Carousel on mobile means only 1 of the top 3 is visible at a
time → contradicts "all in one look."

#### Candidate Z — "Terminal Sidebar + Globe Hero" (rejected as solo, basis for synthesis)

**Idea.** Desktop: 280px left sidebar with a "live signals" terminal-style
scrolling feed (real terminal aesthetic, dotted-text, scrolling pause-on-hover)
+ globe takes the remaining hero space + top 3 stories below globe in a row.
Mobile: sidebar collapses into a swipe-up drawer; globe + top 3 stack.

**Modules (5).** Header · Live signals sidebar (rail desktop, drawer mobile) ·
Globe + heat headline · Top 3 cards row · (Build CTA inside each expanded card).

**Selectivity.** Sidebar shows last 8-10 signals with timestamp. Top 3 = curated.
Globe = geographic. Each is a different lens on the same pool.

**Expansion.** Top 3 expand in-place. Sidebar items click → bottom sheet preview
(matches BuildSheet pattern from MASTER §7).

**Globe relationship.** Sidebar = TIME. Globe = SPACE. Top 3 = EDITORIAL JUDGMENT.
Three orthogonal axes of "today" surrounding the user. Sidebar is the
live-firehose; globe + top 3 are the curated lenses.

**Honest weakness.** Mobile loses the sidebar to a swipe-up drawer — the
"in one look" principle fails on the most important viewport. The literal
"terminal" feel only happens on desktop. Width constraint at 1440 is tight:
280 sidebar + ~840 globe + 320 padding leaves limited room for a 3-col top-3
that wants ~360px each.

### 7b. Winner — Candidate WZ (synthesis of W's ticker + Z's sidebar discipline)

**Z's terminal sidebar idea is the right answer to "looks like a terminal" —
but Z fails on mobile by hiding it behind a swipe-up drawer.**

**Synthesis WZ:** Keep Z's left-rail terminal sidebar on desktop. On mobile,
replace the drawer with a thin (32px) horizontal-scroll inline ticker placed
BELOW the heat headline and ABOVE the top 3 cards. Same selective signal
stream, same pause-on-touch, same tap-to-preview behavior — different
spatial arrangement to honor the viewport.

The other candidates were rejected for these reasons (kept tight, ≤250 words):

- **W** had three concurrent scrolling tickers — three streams of motion
  competes with the editorial restraint mandate. WZ keeps one stream.
- **X** read as a dashboard. The symmetric 2x2 quadrant grid IS the Bloomberg
  pattern CLAUDE.md bans. WZ has one asymmetric live element + one focused
  globe + one curated row.
- **Y** had no live element at all. The stat strip is static aggregate. The
  user named "tickers and signals" specifically as a requirement. WZ adds
  the live layer Y was missing.
- **Z** alone collapses on mobile. WZ keeps the sidebar feel desktop-side
  and matches the same information density inline on mobile.

The shape WZ ships: globe is the marquee, terminal signals run on a side rail
(desktop) or inline strip (mobile), top 3 stories are always visible and tap
to expand. Three orthogonal axes of "today": TIME (sidebar/ticker), SPACE
(globe), EDITORIAL JUDGMENT (top 3 cards).

### 7c. Winner spec — Candidate WZ wireframes

**Mobile (375px) first paint:**

```
┌─────────────────────────────────────┐
│ ░ STREAK 🔥7 · XP ▰▰▰▱▱      ☰     │  44px header, transparent
├─────────────────────────────────────┤
│         · · · · · · · ·             │
│       ·                ·            │
│     ·   [GLOBE 280h]    ·  🚶       │  globe hero
│       ·                ·            │  ~280px tall
│         · · · · · · · ·             │
│  Today: BANGALORE is hot — 5 signals│  Fraunces 600 24px
│  1 funding round, 1 AI release      │  Geist 13px pen
├─────────────────────────────────────┤
│ ◄ LIVE  Zepto $500M · Cursor $9B... │  32px inline ticker
├─────────────────────────────────────┤  glass-chrome bg
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │ #1 ▼ │ │ #2 ▼ │ │ #3 ▼ │         │  3 cards always visible
│ │ Zepto│ │ Sarvam│ │PhonePe│         │  ~110px each tall
│ │ $500M│ │ open │ │ IPO  │         │  tap to expand in-place
│ └──────┘ └──────┘ └──────┘         │
└─────────────────────────────────────┘
```

**Mobile expanded (one card tapped):**

```
┌─────────────────────────────────────┐
│ ░ STREAK · XP                  ☰   │
├─────────────────────────────────────┤
│  [globe — same height]              │  globe stays put
│  Today: BLR — 5 signals             │
├─────────────────────────────────────┤
│ ◄ LIVE  Zepto $500M · ...           │  ticker stays put
├─────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │ #1 ▲ │ │ #2 ▼ │ │ #3 ▼ │         │  card #1 expanded ▲
│ │ Zepto│ │ ...  │ │ ...  │         │
│ │ $500M│ │      │ │      │         │
│ │ ▮ photo                           │  full card content
│ │ • micro-bullet                    │
│ │ • micro-bullet                    │
│ │ • micro-bullet                    │
│ │ Why now: …                        │
│ │ [  Build with Catalst  →  ]       │  Coral CTA
│ └──────┘ └──────┘ └──────┘         │
└─────────────────────────────────────┘
```

**Desktop (1440px) first paint:**

```
┌──────────────────────────────────────────────────────────────────┐
│ CATALST MARKET           STREAK 🔥7   XP ▰▰▰▱▱                  │  56px header
├──────────────┬───────────────────────────────────────────────────┤
│ ░ LIVE       │                                                   │
│ SIGNALS      │           · · · · · · · · ·                       │
│ ──────────   │        ·                    ·                     │
│ 11:42 Zepto  │       ·     [GLOBE 420]      ·  🚶                │
│       $500M  │        ·                    ·                     │
│ 11:38 Cursor │           · · · · · · · · ·                       │
│       $9B    │     Today: BANGALORE is hot — 5 signals            │
│ 11:21 Opus   │     1 funding round, 1 AI release                  │
│ 4.7 ships    │                                                   │
│ 10:54 Anduril│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│       $2B    │ │ #1 — Zepto   │ │ #2 — Sarvam  │ │ #3 — PhonePe ││
│ 10:31 Sarvam │ │ ▮ photo      │ │ ▮ photo      │ │ ▮ photo      ││
│ 9B-IL drops  │ │ ▼ tap expand │ │ ▼ tap expand │ │ ▼ tap expand ││
│ 09:55 Wayve  │ └──────────────┘ └──────────────┘ └──────────────┘│
│ £450M        │                                                   │
│ ──────────   │                                                   │
│ pause: hover │                                                   │
│ tap: preview │                                                   │
└──────────────┴───────────────────────────────────────────────────┘
```

### 7d. WZ module spec — five named modules

| # | Module | Where | What it shows | Tap behavior |
|---|---|---|---|---|
| 1 | **Header** | Top, transparent until scroll | Wordmark · Streak · XP bar | Streak → drawer; XP → quest pill |
| 2 | **Live Signals** | Left rail desktop / inline strip mobile | Last 8-10 signals (desktop) or 3-4 (mobile), timestamp + 1-line summary, dotted-monospace styling. Pauses on hover/touch. Auto-scrolls otherwise. | Tap row → BuildSheet preview (matches MASTER §7 pattern) |
| 3 | **GlobeHero** | Center hero | Existing `<GlobeHero>` component (Phase 6b shipped). Heat headline + Globe with stops + dotted route line. | Tap pin → BuildSheet preview |
| 4 | **Top 3 Today** | Below globe (desktop row, mobile row of 3 small) | Three curated story cards from the day. Photo, headline number, 1-line teaser visible by default. | Tap card → expand in-place (height grows, photo + bullets + Build CTA reveal). Re-tap collapses. |
| 5 | **Build CTA** | Inside each expanded card | The wedge — only saturated CTA per viewport per MASTER §1 | Tap → POST `/api/forge` → deeplink `/forge?seed=<story-id>` per MASTER §7 |

**Selectivity rules:**
- Live Signals: 8 entries max (desktop) / 4 entries max (mobile). New entries
  bump oldest off the list — never grows beyond 8/4. Older history accessible
  via tap → preview → "see all" link.
- GlobeHero: 3-5 stops only (already enforced in `computeHeat`).
- Top 3 Today: hand-curated daily by Anish. Falls back to top 3 by mood weight
  + recency if no curation set for the day.

**No additional modules.** No related stories, no "you might like," no industry
filter chips visible at first paint, no stage toggle visible at first paint.
The switch bar (mood/stage/industry) appears ONLY when user scrolls past the
single-look hero (this is below-fold — out of the WZ scope).

### 7e. WZ acceptance bar

To pass `/design-review` ≥ 9 against this spec, the implementation must satisfy:

- [ ] First paint at 375px shows: header, globe (clamp 280-360px tall), heat
      headline, ticker strip, all 3 top cards (collapsed) — **no scrolling
      required to see all five modules.**
- [ ] First paint at 1440px shows: header, sidebar (left, ~280px), globe
      (~420px), all 3 top cards (collapsed) — **no scrolling.**
- [ ] Live Signals: monospace dotted-text, pause-on-hover, tap → preview.
- [ ] Top 3 cards expand in-place (no modal, no route navigation).
- [ ] Build CTA is the only saturated color anywhere on the first viewport
      (the heat headline's `<City>` Coral span is a permitted second accent
      per MASTER §3, single point in viewport).
- [ ] No glass on Story Card body or Top-3 card body. Sidebar may use
      `--glass-chrome` since it functions as floating chrome over the feed.
- [ ] `prefers-reduced-motion`: ticker auto-scroll disabled, manual scroll
      still works. Top-3 expansion uses opacity-only crossfade not slide.
- [ ] No 4-quadrant grid. No 3 concurrent tickers. No carousel.
- [ ] Lighthouse perf ≥ 90, a11y ≥ 90 on `/` mobile preset.
- [ ] Visual diff at 375 / 768 / 1440 in PR.

**Implementation deferred to Phase 6c.** This file is the design contract; the
implementation is the user's next green-light.

---

## DEPRECATED — superseded by Candidate WZ above (Phase 6c, 2026-05-03)

> **Notice:** Sections §7-old through §10-old below documented Candidate D
> ("Anchored Globe") which served Phase 6b implementation. WZ supersedes the
> first-paint composition (was: globe-hero + scroll into Story Card feed; now:
> globe-hero + sidebar/ticker + top-3 in single look). The shipped Globe and
> GlobeHero components from Phase 6b remain — they're reused as module #3 in
> WZ. The deprecated content is kept for design history.

## 7-old. Globe hero — composition, scroll-collapse, and minimap

> **Brainstorm record.** Three candidates were evaluated; **Candidate D ("Anchored Globe")** was selected. Brief evaluation kept here so future readers can see why we rejected the simpler patterns:
>
> - **Candidate A — Compressed Globe + Continuous Feed** *(rejected)*. 38vh hero collapsing to a 40px minimap pinned in the header at `scrollY > 200`. Heat-zone headline below the globe, filter chips sticky-top after collapse, Story Cards begin at globe-bottom with no break. Tap-dot pulses + auto-scrolls feed to the matching card. **Honest weakness:** auto-scroll on mobile is disorienting — the user loses scroll position context — and a 40px minimap shows zero continent detail (just a logo dot), losing the globe's whole visual signature.
>
> - **Candidate B — Globe Above Fold + Discrete Feed Section** *(rejected)*. 50vh globe with a hairline rule + Fraunces "Latest Signals" section title before cards begin. Globe stays visible until scrolled past, then completely gone (no minimap). Tap-dot opens BuildSheet directly, no feed scroll. **Honest weakness:** 50vh is heavy against the "subtle" mandate, and losing the globe entirely after the first scroll severs the geographic-awareness affordance that justified earning hero real estate. By card 7 the user has no way back to the globe except a full scroll-to-top journey.
>
> - **Candidate C — Globe-Carousel Hybrid** *(rejected)*. 40vh globe with a horizontal-scrolling story carousel directly below it (Apple Music "For You" pattern), then the vertical mood-first feed below that. Globe drives the carousel — pin a dot, carousel filters to that region; vertical feed remains untouched. **Honest weakness:** two scroll directions in one viewport is the classic mobile-feed antipattern; the carousel duplicates feed content (same story appears in both surfaces) and breaks the user's mental model of "where am I"; three-tier hierarchy is too much for a feed app's first viewport.
>
> - **Candidate D — Anchored Globe** *(selected)*. Synthesis. Persistent globe identity (from A) via a small minimap pinned alongside the filter rail (not as a competing header element); editorial discrete-feed boundary (from B) via hairline rule + Fraunces small-caps "Latest Signals" label; one new poster-native move not in any of the three: heat-zone headline lives **inside** the globe area, lower-left, slightly overlapping the globe edge — that's the *Code w/ Claude* poster composition, not generic caption-below-image. Tap-dot opens a BuildSheet in preview mode (B's wedge directness, not A's auto-scroll). C is fully rejected — its hybrid grammar runs counter to mobile-feed mandate. **Honest weakness:** the minimap loses continent detail (becomes 5–7 dot positions only). Mitigation: tapping the minimap smooth-scrolls to top, where the full continent globe is visible.

### 7.1 Globe hero proportions (first paint)

| Breakpoint | Globe size | Vertical-height token |
|---|---|---|
| **375px (mobile)** | `clamp(280px, 38vh, 360px)` | typically renders ~285px on a 750h device |
| **768px (tablet)** | `clamp(320px, 40vh, 400px)` | |
| **1440px (desktop)** | `clamp(340px, 36vh, 420px)` | capped at 420 — no Bloomberg "data wall" |

The globe sits on `--color-paper` background (no card surface, no shadow, no rounded container). It is **a layout layer**, not a UI component sitting on a card. The header floats above it transparently per §3.

### 7.2 Heat-zone headline placement (the poster move)

The headline `"Today: <City> is hot — <N> signals"` lives **inside the globe area**, lower-left, in the negative space below the continent silhouette. Specifically:

- Position: absolute inside the globe container, `bottom: var(--space-6)`, `left: var(--space-4)` (mobile) / `var(--space-8)` (desktop)
- Type: Fraunces 600 with `font-variation-settings: 'opsz' 96`. Mobile size `text-h2` (24px), desktop size `clamp(28px, 3vw, 36px)`
- Color: `--color-ink`. The "<City>" segment is wrapped in a `<span>` that color-shifts to `--color-cta` (Coral) — that's the only saturated point in the hero.
- The line **overlaps** the globe's bottom-left dots by 16–32px. This is intentional — the *Code w/ Claude* poster does the same thing with its title overlapping its art, and that overlap is what tells the user "this is editorial, not a dashboard."
- `<N>` is the count of stories whose city matches the hot zone, not the total feed size.

The hot-zone city is computed at build time from the highest-density `featured: true` cluster in `content/stories.seed.json`. For the launch seed, this will be **Bangalore** (3 of the 5–7 featured stories cluster there).

### 7.3 Scroll-collapse behavior — the minimap pin

| Scroll state | Globe state |
|---|---|
| `scrollY ≤ globeBottomY` | Full globe visible, hero size per §7.1, character figure shown at 12 o'clock per Globe component spec. Header is transparent (§3). |
| `globeBottomY < scrollY ≤ globeBottomY + 40` | Transition zone. Globe scales+fades to minimap proxy: `transform: scale()` + `opacity` interpolated against scroll position via Framer Motion `useScroll` + `useTransform`. **No layout shift** — minimap occupies its sticky-header slot from the start (initially `opacity: 0`, `transform: scale(0.4)`). |
| `scrollY > globeBottomY + 40` | Globe minimap pinned at **left of the sticky filter rail**, 36×36px, 5–7 dots only, no continent silhouette, no character figure. Glass chrome behind it (§3). Filter chip row fills the remaining header width. |

Animation timing: 320ms `easeStandard` ([0.2, 0, 0, 1]). The transition zone is short (40px) so the user perceives a single smooth handoff, not a long crossfade.

**Why pinned beside the filters and not as a separate header bar:** two stacked sticky bars at the top eat 88px of mobile real estate, which is one Story Card's worth of headline number. Combined into a single 56px sticky row, the cost is half — and the minimap reads as "globe got out of the way" rather than "now there are two header bars."

**Reduced motion path:** drop the scale interpolation, replace with opacity 0→1 over 200ms. The minimap appears when the threshold is crossed; no animated shrink.

### 7.4 Filter rail composition (sticky after collapse)

Once the minimap pins, the same row carries:

```
[ ⊙ minimap ]  [🔥][🌱][🪙][🚀][🧠][💡][🎯][💸][🇮🇳]→  [Empires•Builders•Boots]
   36×36          horizontally scrollable mood chips         stage segment toggle
```

- Mood chips: existing `.mood-chip` recipe from MASTER §7. Active chip pinned visually.
- Stage segment toggle: three-segment pill, single active state — uses Chip with `variant="stage"`.
- Industry filter is **not** in this rail. It opens via a sheet from a single `Filter` icon button at the right end (matches MASTER §1's "industry bento opener" rule, but launched from the feed rail rather than the bottom switch bar — because the bottom switch bar is replaced by the sticky top rail in this layout).

Total rail height: 56px including 8px padding above and below. The minimap occupies a 44×44 hit area (36×36 visual, 4px padding all sides) — touch-target compliant per MASTER §10.

### 7.5 Tap-the-minimap interaction

A tap on the minimap is a "go home" affordance:

- Smooth-scrolls the page to `scrollY = 0` over 480ms `easeEmphasized`.
- The full globe re-renders at hero size as the user reaches the top.
- This is the only way to re-engage the full continent view without scrolling manually — it's a deliberate single-purpose affordance, *not* a menu opener.
- `aria-label="Return to globe"`. Keyboard activate with Enter or Space.

---

## 8-old. Tap-dot interaction (BuildSheet preview) — DEPRECATED (Candidate D)

Each of the 5–7 hot dots on the globe is a button with `aria-label="<Company> — <one-line>"`. Tap behavior:

| Step | What happens |
|---|---|
| 1 | Dot pulses (scale 1 → 1.4 → 1, opacity 1 → 0.6 → 1, 240ms) — single pulse, no loop. |
| 2 | BuildSheet bottom-sheet animates up per MASTER §6 (`translateY 100% → 0`, 260ms, `easeEmphasized`). |
| 3 | Sheet renders the **preview variant** of the matched Story: top mood strip, headline number, micro-bullets, Why-now line, founder face — *minus* the Build CTA wrapper used in the full StorySheet. The CTA at the foot of the preview reads **"See full story"** (links to `/story/[id]`) above a secondary **"Build with Catalst"** Coral button (the actual wedge). |
| 4 | Backdrop is `rgba(11,11,15,0.40)` per MASTER §7 BuildSheet rules. The sheet body stays solid `--color-card`; glass is permitted only on the drag-handle row at the top. |
| 5 | While sheet is open, the original dot stays in a held-pulse state (subtle glow at 18% opacity Coral, no animation) so the user can tell which dot they tapped. Closing the sheet returns the dot to default. |

**No auto-scroll.** Auto-scrolling the feed to a "matching card" position is rejected as a candidate-A weakness: jarring on mobile, removes scroll-position context, and the BuildSheet is the actual wedge regardless. The tap moves the user **one click closer to the Build CTA**, not deeper into the feed.

**Tap targets:** each dot is a 4×4px visual square but lives inside an 8×8 hit area. On mobile (where 8×8 is below the 44px MASTER floor), dots additionally trigger a 32×32 invisible hit-box centered on the dot. Stacking dots are not allowed within a 32px radius — the seed curator must enforce this when picking `featured: true` stories.

---

## 9-old. ASCII wireframes — DEPRECATED (Candidate D)

### 9.1 Mobile (375px), first paint — `scrollY = 0`

```
┌─────────────────────────────────────────┐  edge of viewport
│ ░ STREAK 🔥7 · XP ▰▰▰▱▱           ☰   │  44px header, transparent
├─────────────────────────────────────────┤
│                                         │
│          · · · · · · · · ·              │
│       · ·                 · ·           │
│     ·         🚶                 ·      │  globe hero (~285px)
│    ·     ╱─ continent ─╲          ·     │  character at top
│   ·     │    dot grid   │           ·   │
│    ·    │   ▪▪    ▪▪    │          ·    │  red squares = 5–7 active dots
│     ·    ╲────────────╱           ·     │
│       · ·                 · ·           │
│          · · · · · · · · ·              │
│                                         │
│  Today: BANGALORE is hot                │  Fraunces 600, lower-left
│  — 14 signals                           │  overlaps globe edge by ~24px
│                                         │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ──┤  hairline --color-rule
│  LATEST SIGNALS                         │  Fraunces small-caps, 13px tracked
├─────────────────────────────────────────┤
│  [🔥][🌱][🪙][🚀][🧠][💡] →           │  filter chips (h-scroll)
│  [Empires • Builders • Bootstrappers]   │  stage segment
├─────────────────────────────────────────┤
│  ┌── Story Card 1 ────────────────────┐ │
│  │ ▮ 🔥 Blowing up                    │ │
│  │ [photo / founder face]             │ │
│  │ Anthropic raised…                  │ │
│  │       $3.5B                        │ │
│  │ • micro-bullet                     │ │
│  │ • micro-bullet                     │ │
│  │ [  Build with Catalst  →  ]        │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌── Story Card 2 ────────────────────┐ │
│  ...                                    │
└─────────────────────────────────────────┘
```

### 9.2 Mobile (375px), after collapse — `scrollY > globeBottomY + 40`

```
┌─────────────────────────────────────────┐
│ [⊙][🔥][🌱][🪙][🚀]→ [Emp•Bld•Boots] │  56px sticky rail, glass-chrome
│   ↑                                     │   ⊙ = 36×36 minimap (dots only)
├─────────────────────────────────────────┤
│  ┌── Story Card 4 ────────────────────┐ │
│  │ ▮ 🌱 Underdog wins                 │ │
│  │ ...                                 │ │
│  │ [  Build with Catalst  →  ]        │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌── Story Card 5 ────────────────────┐ │
│  ...                                    │
└─────────────────────────────────────────┘
```

### 9.3 Desktop (1440px), first paint

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  CATALST MARKET                STREAK 🔥7    XP ▰▰▰▱▱                       │  header (transparent)
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                          · · · · · · · · · · · · · ·                         │
│                       · ·                            · ·                     │
│                    ·              🚶                       ·                 │
│                  ·       ╱── continent dot grid ──╲          ·               │  globe hero
│                ·        │                            │         ·             │  ~360–400px
│                  ·      │   ▪▪          ▪▪           │        ·              │
│                    ·     ╲──────────────────────────╱       ·                │
│                       · ·                            · ·                     │
│                          · · · · · · · · · · · · · ·                         │
│                                                                              │
│  Today: BANGALORE is hot — 14 signals                                        │  Fraunces 600 32px,
│                                                                              │  lower-left, overlaps
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
│  LATEST SIGNALS              [🔥][🌱][🪙][🚀]…   [Empires•Builders•Boots]    │  inline rail
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌── card 1 ──────┐  ┌── card 2 ──────┐  ┌── card 3 ──────┐                  │
│  │ ▮ mood         │  │ ▮ mood         │  │ ▮ mood         │                  │  3-col masonry
│  │ headline #     │  │ headline #     │  │ headline #     │                  │
│  │ ...            │  │ ...            │  │ ...            │                  │
│  │ [Build CTA →]  │  │ [Build CTA →]  │  │ [Build CTA →]  │                  │
│  └────────────────┘  └────────────────┘  └────────────────┘                  │
│  ┌── card 4 ──────┐  ┌── card 5 ──────┐  ┌── card 6 ──────┐                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 9.4 Desktop (1440px), after collapse

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [⊙] LATEST SIGNALS    [🔥][🌱][🪙][🚀]…   [Empires•Builders•Boots]   ⚙ filter│  glass-chrome rail
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌── card 7 ──────┐  ┌── card 8 ──────┐  ┌── card 9 ──────┐                  │
│  ...                                                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 10-old. Acceptance bar for the globe-hero implementation — DEPRECATED (Candidate D)

To pass `/design-review` ≥ 9 against this override file, the implementation must satisfy:

- [ ] Globe at `clamp(280px, 38vh, 360px)` on mobile first paint; never exceeds 420px on any breakpoint
- [ ] Continents are recognizable in the dot grid — India, Africa, North America, Europe, South America, Australia, Asia each distinguishable at hero size
- [ ] Heat-zone headline overlaps the globe's lower-left edge; *not* placed below the globe in a separate row
- [ ] Build CTA (Coral) is the only saturated color in the first viewport — heat-zone city span is the *one* secondary Coral accent permitted
- [ ] On `scrollY > globeBottomY + 40`, single 56px sticky rail combines minimap + filter chips + stage toggle. Two stacked sticky bars is a fail.
- [ ] Tap-dot opens BuildSheet preview, *not* an auto-scroll. Auto-scroll on dot tap is a fail.
- [ ] Tap-minimap smooth-scrolls to top, full globe re-renders.
- [ ] `prefers-reduced-motion` honored: globe rotation off, minimap collapse uses opacity-only crossfade, dot pulse becomes static.
- [ ] Lighthouse perf ≥ 90 on `/` mobile preset with the globe rendered.
- [ ] Visual diff at 375 / 768 / 1440 in PR.
