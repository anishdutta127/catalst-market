# Pixel Aesthetic Audit (Phase 7b)

Date: 2026-05-04. Source of truth for which text elements on the home
feed render in dotted bitmap typography vs editorial type. Pair this
with `design-system/pages/feed.md §8` ("Aesthetic Playbook") which gives
the rubric for future modules.

User direction (verbatim): *"i really like the pixelated style on this
like old school meets new age tech its pretty cool"* — extend the
dotted-pixel vocabulary as a precision instrument, not a maximalist
sweep.

## Bucket framework

- **A — CONVERT TO DOTTED.** Short uppercase, factual, or numeric text
  where the pixel-display reads as terminal-stock-ticker identity
  without sacrificing legibility.
- **B — KEEP EDITORIAL.** Body copy, headlines, story titles, multi-
  sentence paragraphs — anything that needs typographic warmth or
  readable mass.
- **C — KEEP AS-IS (already dotted).** Confirm the existing dotted
  vocabulary so we don't double-convert or accidentally regress.

## Bitmap font support (constraint)

`components/brand/font-bitmap.ts` ships A–Z, 0–9, space, comma, period,
hyphen, colon, →. Phase 7b adds `+`, `%`, `·` (middle dot), `★` (star),
`#` (hash), and `↑`/`↓` arrows so the audit's Convert bucket renders
end-to-end without surprise blanks. No other glyphs are added — if a
future text element needs `&`, `'`, or `?` the playbook says rewrite
the copy or keep the element editorial.

## Audit table

Location keyed by component file. "Module letter" matches feed.md §7c.

### Module A — Top band (`page-client.tsx`)

| Element | Bucket | Current | Proposed |
|---|---|---|---|
| Wordmark "CATALST MARKET" | B | Fraunces bold ~15-18px clamp | unchanged (brand mark — editorial) |
| Filter chip text "All — 0 filters" / "AI · Builder" | A | Geist 500 13px | DottedText 1.25 dotSize, --color-ink |
| Streak chip "🔥 7" | A | flame Lucide + Geist 600 13px | DottedText "STREAK · 7" + Coral pulse dot |
| (mobile) compact wordmark "CATALST" | C / B | already short factual but Fraunces brand mark | keep editorial — wordmark is brand asset |

### Module B — GlobeHero

| Element | Bucket | Current | Proposed |
|---|---|---|---|
| Heat headline H1 (when `showHeadline`) | C / B | Fraunces text-h1 | KEEP editorial — `showHeadline=false` on home v3 (CityPanel owns it). When the standalone `/primitives` demo shows it, leave editorial. |
| Heat subline caption | B | text-caption Geist | unchanged — short paragraph, reads as caption |
| Globe internal city name (during ZOOM) | C | DottedText | already dotted |
| Globe route line (bottom band) | C | DottedText | already dotted |
| Globe pin labels | C | DottedText (cassette + bare) | already dotted |
| Quiet-state H1 | B | Fraunces | unchanged |

### Module C — CityPanel

| Element | Bucket | Current | Proposed |
|---|---|---|---|
| Heat headline "Today: BANGALORE is hot — 5 signals" | B | Fraunces 600 opsz 96, City span Coral | KEEP editorial — page's canonical heat headline (feed.md §7f Module C) |
| Section caption "Cities" above mini bar table | A | text-label Geist uppercase | DottedText 1.25 |
| Mini cities table row: city short ("BLR") + count | A | Geist tabular-nums | DottedText 1.25 (city short is already short upper) — count stays Geist tabular-nums for legibility of multi-digit numbers (the playbook treats counts as numeric Geist when adjacent to a bar chart) |
| Mini cities table row: bar chart fill | n/a | colored span | n/a (graphic, no text) |
| "City: Bangalore" subhead row | A | text-label Geist uppercase | DottedText 1.25 |
| "+N more →" link | A | Geist 13px | DottedText with → arrow already in font |
| Story row headline number ($500M, +22pts) | B | Fraunces 600 opsz 32 tabular | unchanged — headline numbers stay editorial |
| Story row title text | B | Geist 13px | unchanged |
| Type cassette pin | C | DottedText inside Cassette | already dotted |
| Empty state copy | B | Geist italic 13px | unchanged — sentence-level body copy |
| "Clear filter" inline link | B | underlined Geist | unchanged — sentence verb-link, reads better in editorial |

### Module D — LiveSignals

| Element | Bucket | Current | Proposed |
|---|---|---|---|
| Sidebar header "LIVE SIGNALS" | C | DottedText | already dotted |
| Mobile prefix "LIVE" | C | DottedText | already dotted |
| Item timestamp "11:42" | C | DottedText | already dotted |
| Sidebar item city short ("BLR") | A | Geist 10px uppercase | DottedText 1.0 (matches the timestamp scale on the row) |
| Item TYPE cassette ("FUND") | C | DottedText cassette | already dotted |
| Item company name | B | Geist 13px medium | unchanged — proper noun, mixed-case readable |
| Item metricLabel ("$500M") | B | Geist 12px bold | unchanged — see playbook (numeric anchors stay editorial when they're THE eye anchor) |
| Sidebar footer "pause: hover · tap: preview" | A | Geist 10px uppercase | DottedText 1.0 (factual instruction) |
| Quiet placeholder copy | B | Geist italic | unchanged |

### Module E — TrendingHeuristics

| Element | Bucket | Current | Proposed |
|---|---|---|---|
| Section caption "This week's momentum" | A | text-label Geist | DottedText 1.5 |
| Industry label ("AI", "FINTECH") | A | Geist 11px uppercase | DottedText 1.25 |
| "ACTIVE" badge | A | Geist 9px bold uppercase Coral | DottedText 1.0, --color-cta |
| Signal-count display (the big "6") | B | Fraunces bold opsz 96 28-36px | unchanged — eye anchor |
| Delta arrow + value ("↑ 22%") | A | Lucide arrow + Geist tabular-nums | **DottedText 1.25 with new ↑/↓/—-glyphs and `+`/`%` glyphs** (see brainstorm record below) |
| Top-story summary line | B | Geist 11px line-clamp-2 | unchanged — proper noun + verb sentence |

### Module F — BuildAngles

| Element | Bucket | Current | Proposed |
|---|---|---|---|
| Section caption "Today's build angles" | A | text-label Geist | DottedText 1.5 |
| Angle title (collapsed + expanded) | B | Fraunces 500 16px | unchanged — declarative ≤8-word title is editorial |
| "Inspired by" label | A | Geist 11px uppercase | DottedText 1.0 |
| Inspired-by company list (collapsed) | B | Geist 11px | unchanged — reads as a sentence-tail |
| Description paragraph (expanded) | B | Geist 14px | unchanged — body copy |
| Wedge hint italic | B | Fraunces italic 14px | unchanged — editorial soul |
| Inspiring-story chip labels | B | Geist 11px in pill | unchanged — proper nouns |
| Build CTA button text "Build with Catalst →" | B | Geist semibold | unchanged — call-to-action label |
| Expand/Collapse toggle | A | Geist 12px + Lucide chevron | text stays editorial — chevrons stay Lucide. The chevron was specifically called out in the brief as "decide if dotted ▼ ▲ vs Lucide icons" — Lucide stays because it scales smoothly at low pixel sizes and the dotted variant would look heavier than a chevron warrants. |

### Module G — Top 3 Today (StoryCard via page-client.tsx)

| Element | Bucket | Current | Proposed |
|---|---|---|---|
| Section heading "Top 3 today" / "Top 3 in AI" | A | text-label Geist uppercase | DottedText 1.5 |
| Story row everything (headline, title, microbullets, why-now, build CTA) | B/C | Fraunces / Geist editorial; type cassette + city pill already dotted | unchanged |
| Empty state "No stories match your filter — try clearing some scopes." | B | text-body Geist italic | unchanged — sentence-level body copy |

### EditorialConsole — BusinessOfWeek

| Element | Bucket | Current | Proposed |
|---|---|---|---|
| Section caption "Business of the week" | A | text-label Geist | DottedText 1.5 |
| Company name "Sarvam AI" | B | Fraunces 600 opsz 96 28-36px | unchanged — editorial display name |
| Italic tagline | B | Fraunces italic 16px | unchanged |
| "The week's arc" caption above paragraphs | A | text-label Geist uppercase | DottedText 1.0 |
| Weekly arc paragraphs (3) | B | Geist 15px line-height 1.6 | unchanged — body copy |
| Stat pill label ("FOUNDED") | A | Geist 10px uppercase | DottedText 1.0 |
| Stat pill value ("2023") | A | Geist 13px tabular-nums | DottedText 1.25 (numbers/short codes — paired with dotted label for visual unity) |
| External link "View on sarvam.ai" + Lucide icon | B | Geist 13px | unchanged — sentence-level verb |
| Related-angle line | B | Geist 13px | unchanged |
| Pull-quote (right column) | C | DottedText 1.75 | already dotted |

### EditorialConsole — Top3OfWeek

| Element | Bucket | Current | Proposed |
|---|---|---|---|
| Section caption "This week's biggest stories" | A | text-label Geist | DottedText 1.5 |
| Rank badge "#1 this week" | A | text-label Geist uppercase | DottedText 1.0 (needs new `#` glyph) |
| Headline number ($500M, +22 pts) | B | Fraunces 700 opsz 144 40-52px | unchanged — eye anchor |
| Story title | B | Fraunces 500 18-22px | unchanged |
| Company line ("CURSOR") | A | Geist 12px uppercase | DottedText 1.25 |
| City pill | C | DottedText 1.25 | already dotted |
| Curatorial note (italic 14px) | B | Fraunces italic | unchanged — editorial soul |

### EditorialConsole — Movers

| Element | Bucket | Current | Proposed |
|---|---|---|---|
| Section caption "Quiet movers — stories you might've missed" | A | text-label Geist | DottedText 1.5 |
| Row rank badge "#1" | C | DottedText 2.0 | already dotted (uses `#` — added to font) |
| Company name | B | Geist 14px semibold | unchanged — proper noun |
| Teaser line | B | Geist 12px | unchanged — sentence fragment |
| Headline metric | B | Fraunces 600 opsz 24 14px | unchanged — numeric anchor for the row |
| City short | C | DottedText 1.25 | already dotted |
| Empty placeholder copy | B | Geist 12px italic | unchanged |
| Build CTA text | B | Geist semibold | unchanged |
| Expanded body bullets / why-now | B | Geist + Fraunces italic | unchanged |

## Brainstorm record — TrendingHeuristics deltas

**Question.** Should TrendingHeuristics delta values (e.g., "+22%",
"↑ 12%", "— flat") render in dotted text or stay Geist bold ink?

**Candidate 1 — Dotted-Terminal.** Convert delta + arrow + value to
DottedText. Pros: pushes the strip toward Bloomberg-terminal density,
matches the section caption + industry-label convert. Cons: requires
adding `+`, `%`, and `↑/↓/—` to the bitmap font; arrows-as-bitmap may
read chunky next to the small Geist top-story line.

**Candidate 2 — Editorial-Bold.** Keep delta in Geist tabular-nums + a
Lucide arrow. Pros: zero font work; arrow vector scales smoothly. Cons:
breaks symmetry with the rest of the strip, which is now 100% dotted
(caption + label + active badge). The eye sees "small bold text island"
inside a dotted card.

**Pick: Dotted-Terminal.** Reasoning: TrendingHeuristics is the most
terminal-feeling module on the page (6-card stat strip with delta
indicators is literally a stock-ticker pattern). Symmetry inside the
card matters more than zero font work. The added `↑/↓` glyphs give
future modules (e.g., Movers expanded body, future earnings cards) a
reusable vocabulary for direction-of-change indicators. The signal
COUNT (the big "6") stays Fraunces because it's the eye anchor — the
playbook rule "headline numbers stay editorial when they're THE anchor"
holds.

## Deliberate exclusions (what we're NOT touching)

- Story bodies, microBullets, why-now, weekly arc paragraphs, curatorial
  notes — anything sentence-level stays Geist/Fraunces/Spectral.
- Headline numbers ($500M, $9B, +22pts) where they're the eye anchor of
  a card — Fraunces stays.
- Brand wordmark "CATALST MARKET" — Fraunces brand mark.
- Story titles, angle titles, company display names in BusinessOfWeek —
  editorial display type.
- All chevrons / Lucide icons — vector icons stay vector.
- "Build with Catalst →" CTA label — proper-noun-bearing button.
- Empty-state and quiet-placeholder copy — sentence-level body.

## Playbook — the rubric for new modules

The audit table above is the snapshot. The rubric below is the rule
that produced it; use it when adding any new text element.

### Three questions, in order

1. **Is this body copy?** (≥ 1 sentence, designed to be read in one
   visual sweep, mixed-case prose) → **EDITORIAL.** Geist for body,
   Fraunces for editorial display, Spectral italic for pull-quotes
   inside body text. Stop here.
2. **Is this the eye anchor of a card?** (the big number or company
   name the reader's gaze lands on first) → **EDITORIAL.** Fraunces
   with `'opsz'` set proportionally to size. Dotted is too dense at
   the anchor scale.
3. **Otherwise — is it short, factual, uppercase-tolerant, ≤ ~24
   chars?** (section caption, label, badge, timestamp, metric chip,
   stat pill, terminal-row indicator) → **DOTTED.** Use
   `<DottedText>` at one of the standard scales (1.0, 1.25, 1.5, 1.75,
   2.0). Use `<SectionCaption>` for any module heading.

If the answer to all three is "no," reach for editorial Geist 11–13px
as the safe default. Don't invent a fourth path.

### Standard DottedText scales (used across the page)

| dotSize | Used for |
|---|---|
| 1.0 | inline labels inside cards (FOUNDED, INSPIRED BY, ACTIVE) |
| 1.25 | row content (timestamps, city shorts, deltas, stat values, filter chip text) |
| 1.5 | section captions via `<SectionCaption>` |
| 1.75 | magazine pull-quote body (BusinessOfWeek right column) |
| 2.0 | row rank badges (Movers `#1`, `#2`, `#3`) |

Don't introduce sizes outside this ladder without a written reason in
the PR — the visual unity of the page depends on the dot grid being a
quantized scale, not a continuous one.

### Worked examples

- **"Today's build angles" (BuildAngles caption).** Q1 no, Q2 no, Q3
  yes (short, factual, uppercase-tolerant). → DottedText via
  `<SectionCaption text="Today's build angles" />`.
- **"Anysphere closed at $9B post" (Top3OfWeek curatorial note).** Q1
  yes, sentence-level prose. → STAYS editorial Fraunces italic.
- **"$500M" headline number (Top3OfWeek card).** Q1 no, Q2 yes (the
  eye anchor of the card). → STAYS Fraunces opsz 144.
- **"+22% wk" (TrendingHeuristics delta).** Q1 no, Q2 no (the count
  above it is the anchor), Q3 yes. → DottedText with `↑/↓` glyph
  prefix (added to font in Phase 7b).
- **"Build with Catalst →" (CTA button).** Q1 no, Q2 no, Q3
  borderline — but proper-noun + verb makes it read as
  conversational, not factual. Buttons stay editorial Geist for
  brand-action consistency.

### Bitmap font support

Phase 7b's font now ships: A–Z, 0–9, space, comma, period, hyphen,
colon, →, `+`, `%`, `·`, `★`, `#`, `↑`, `↓`, `'`, `—`. Adding any
new glyph requires:
1. Hand-encoded entry in `components/brand/font-bitmap.ts`'s `RAW`.
2. Visual review against the existing alphabet at
   `/primitives` ("DottedText alphabet dump").
3. PR note explaining why a new glyph earned its place.

If a copy string needs an unsupported character, prefer rewriting the
copy. The font is small on purpose.

### Anti-patterns (refuse in PR review)

- Two dotted-text implementations on the page. Always
  `components/brand/DottedText.tsx`.
- Any `<h2>` with `text-label uppercase tracking-wider` for a section
  caption. Always `<SectionCaption>`.
- Dotted text inside body copy paragraphs — breaks the rhythm.
- Dotted headline numbers — drops the editorial anchor.
- Mixing Lucide arrows + dotted arrows in the same row — pick one
  vocabulary per visual unit.
- Adding a glyph to the font without a use case in code. The font is
  shared infrastructure, not a sandbox.

