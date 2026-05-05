# BUILD-PLAN.md — catalst-market

> The Market layer of Catalst OS. Mood-first business + startup tracker for the general public. Every story has a one-click Build CTA into Verdania.

## Phase summary

| # | Phase | Time | Output |
|---|---|---|---|
| 0 | Project init | 5 min | empty repo, Next.js 15, git, Bun |
| 1 | Skill + plugin install | 10 min | all Claude Code skills loaded |
| 2 | CLAUDE.md + AGENTS.md drop | 3 min | brain in place |
| 3 | Design system generation | 15 min | `design-system/MASTER.md` |
| 4 | Information architecture | 20 min | route map + Story type locked |
| 5 | App scaffold + theme | 30 min | shell, layout, primitives, navigation skeleton |
| 6 | Story Card + Story Feed | 60 min | the atom + the feed |
| 7 | Mood Picker + Stage Toggle + Industry Bento | 90 min | the three switches |
| 8 | Build CTA → BuildSheet → Forge bridge | 60 min | the wedge wired end-to-end |
| 9 | Habit loop layer | 60 min | streak, XP, daily brief, quest |
| 10 | Live ingestion (Composio) | 90 min | real signals flowing |
| 11 | Polish, perf, a11y, ship | 60 min | Vercel deploy |

Total: ~9 hours of focused work split across as many sessions as needed. Each phase ends with a green `/review` and `/design-review`.

---

## Phase 0 — Project init (5 min)

Open PowerShell. Cd to your usual home.

```powershell
cd C:\Users\anish\Downloads
bunx create-next-app@latest catalst-market --typescript --tailwind --app --src-dir=false --import-alias "@/*" --no-eslint
cd catalst-market
git init
git branch -M main
echo "node_modules/`n.next/`n.env*.local`n.vercel`n.DS_Store" > .gitignore
git add -A
git commit -m "chore: initial Next.js 15 scaffold"
```

Open in VS Code:
```powershell
code .
```

Open Claude Code in terminal at the same directory:
```powershell
claude
```

---

## Phase 1 — Skill + plugin install (10 min)

Inside Claude Code, run these commands one at a time. Wait for confirmation between each.

### 1a. Anthropic skills (document + example)
```
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills
```

### 1b. UI UX Pro Max — the design system generator
```
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

Then in PowerShell (separate terminal):
```powershell
npm install -g uipro-cli
uipro init --ai claude
```

### 1c. Composio connect-apps (live ingestion)
```powershell
git clone https://github.com/ComposioHQ/awesome-claude-skills.git C:\temp\composio-skills
claude --plugin-dir C:\temp\composio-skills\connect-apps-plugin
```

Inside Claude Code:
```
/connect-apps:setup
```
Paste your Composio API key from `platform.composio.dev`. Restart Claude Code.

### 1d. Composio individual skills (copy what we need)
```powershell
$dest = "$HOME\.claude\skills"
mkdir $dest -ErrorAction SilentlyContinue
Copy-Item C:\temp\composio-skills\webapp-testing $dest -Recurse
Copy-Item C:\temp\composio-skills\content-research-writer $dest -Recurse
Copy-Item C:\temp\composio-skills\brand-guidelines $dest -Recurse
Copy-Item C:\temp\composio-skills\theme-factory $dest -Recurse
```

### 1e. obra/superpowers — TDD, worktrees, brainstorming
```powershell
git clone https://github.com/obra/superpowers.git C:\temp\superpowers
Copy-Item C:\temp\superpowers\skills\brainstorming $dest -Recurse
Copy-Item C:\temp\superpowers\skills\test-driven-development $dest -Recurse
Copy-Item C:\temp\superpowers\skills\using-git-worktrees $dest -Recurse
Copy-Item C:\temp\superpowers\skills\finishing-a-development-branch $dest -Recurse
Copy-Item C:\temp\superpowers\skills\root-cause-tracing $dest -Recurse
```

### 1f. Verify
Inside Claude Code:
```
/plugin list
```

Confirm all of these are present:
- gstack (already installed globally)
- document-skills
- example-skills
- ui-ux-pro-max
- connect-apps
- brainstorming, test-driven-development, using-git-worktrees, finishing-a-development-branch
- webapp-testing, content-research-writer, brand-guidelines, theme-factory

If any are missing, retry the install. Don't proceed without all green.

---

## Phase 2 — CLAUDE.md + AGENTS.md drop (3 min)

Drop the `CLAUDE.md` file (provided alongside this plan) into the repo root.

Then ask Claude:
```
Read CLAUDE.md. Write AGENTS.md describing 4 subagents we'll dispatch in parallel during batch builds: design-agent (owns design-system + visual QA), data-agent (owns ingestion + types), feature-agent (owns components + routes), test-agent (owns Playwright + unit tests). Keep AGENTS.md under 80 lines. Karpathy style — terse, principled, constraint-first.
```

Commit:
```
git add CLAUDE.md AGENTS.md
git commit -m "docs: drop CLAUDE.md and AGENTS.md"
```

---

## Phase 3 — Design system generation (15 min)

This kills the Bloomberg-terminal problem. Tell `uipro` what the product actually is.

Inside Claude Code:
```
Use the ui-ux-pro-max skill. Generate a design system for: "Catalst Market — a mood-first, mobile-first, editorial-pop business + startup story feed for the general public. Audience: Gen Z and millennials in India + global, who want to be hustlers but aren't VCs. Vibe: Robinhood approachability + Pinterest visual richness + Apple Newsroom typography + Substack editorial weight. Hero unit is a Story Card with a founder face, a big number, and a Build CTA. Anti-patterns: Bloomberg terminals, AI purple gradients, glassmorphism overload, dense data tables, Inter font."

Persist to design-system/MASTER.md. Use product type = "Lifestyle / Editorial Consumer".
```

Then verify the output. The MASTER.md should specify:
- Pattern (likely Hero-Centric or Storytelling-Driven)
- Style (likely Editorial Grid, Soft UI Evolution, or Tactile Digital — NOT Glassmorphism, NOT Cyberpunk)
- Colors (warm, optimistic, not corporate)
- Typography (a strong serif for headlines + a humanist sans for body — NOT Inter)
- Anti-patterns (the "do not do" list)

If MASTER.md proposes something off-brief (e.g., dark mode default, terminal aesthetics), regenerate with sharper input. Don't accept the first output if it doesn't match the brief.

Generate page overrides for the home feed:
```
Use the ui-ux-pro-max skill. Generate a page-specific override for the home feed at design-system/pages/feed.md. The feed must feel like Pinterest meets Twitter for-you — vertical scroll, full-bleed Story Cards, large founder portraits, a sticky mood/stage toggle at top. Mobile breakpoint priority: 375px first, scale up.
```

Commit:
```
git add design-system/
git commit -m "feat: generate design system MASTER + feed page override"
```

---

## Phase 4 — Information architecture + types (20 min)

Lock the Story type before writing any UI. This is the most important step — every component descends from this shape.

Ask Claude:
```
Use the brainstorming skill. We need to lock the canonical Story type for catalst-market. A Story represents a real thing happening at a company that's interesting to a non-VC general public hustler. Walk me through 3 options for the Story shape, optimizing for: (a) emotional resonance on a mobile card, (b) ability to render the same Story in 9 different mood lenses, (c) a clean Build CTA payload. Pick a winner with justification, then write lib/types/story.ts.
```

After Claude picks, ask:
```
Now write lib/angles.ts — the function getBuildAngles(story: Story): Angle[] which returns 3 type-specific build angles per story type (funding, launch, M&A, IPO, milestone, founder, OS, layoff, shutdown, regulatory). Use the same logic as the previous prototype but tightened: each angle has a title (max 8 words), a desc (max 25 words), and a wedge_hint (1 sentence).
```

And:
```
Write the route map. Route table for app/. Mobile-first. Account for: (1) home feed with mood/stage/industry switches as URL params, (2) story detail at /story/[id], (3) build sheet as modal overlaying story, (4) profile at /me, (5) build history at /me/builds, (6) share-out OG images at /api/og/[storyId]. Output as a markdown table I can drop into ROUTES.md.
```

Commit:
```
git add lib/types ROUTES.md lib/angles.ts
git commit -m "feat: lock Story type + angle generator + route map"
```

---

## Phase 5 — App scaffold + theme (30 min)

This is where most builds go wrong by reaching for shadcn/ui defaults. Don't. The MASTER.md is the source of truth.

```
Read design-system/MASTER.md. Set up:
1. app/layout.tsx with the typography from MASTER (use next/font for both faces)
2. app/globals.css with the color tokens from MASTER as CSS variables
3. components/ui/button.tsx — only the variants MASTER specifies, no shadcn defaults
4. components/ui/sheet.tsx — bottom sheet on mobile, side sheet on desktop, Framer Motion driven
5. components/ui/chip.tsx — for the toggles
6. lib/utils/cn.ts — clsx + tailwind-merge

Use TDD where possible. After each component, write a Storybook-style usage example in components/ui/__demos__/<name>.demo.tsx so I can visually verify.
```

Then run gstack design review:
```
/design-review components/ui
```

Iterate until ≥ 9. Then commit:
```
git add components/ui app/layout.tsx app/globals.css lib/utils
git commit -m "feat: theme + ui primitives aligned to MASTER design system"
```

---

## Phase 6 — Story Card + Story Feed (60 min)

The atom and the feed. Don't worry about live data yet — use `content/stories.seed.json` (60 hand-picked stories I'll provide separately, or ask Claude to draft them).

```
Use brainstorming skill. Draft content/stories.seed.json with 60 stories spanning all 11 types (funding, launch, ai, ma, ipo, milestone, founder, os, layoff, shutdown, regulatory) and all 9 moods. Each story is real (use famous + recent events: Cursor's $9B, Zepto's $1B, Mira Murati's stealth lab, Krutrim, Sarvam, Anduril, Skild, Cohere, Perplexity, etc.). Each follows the Story type exactly. Founder faces = use placeholder URLs from unavatar.io/<handle> for now.
```

Then build the components:
```
Build components/story/StoryCard.tsx. Pixel-perfect to design-system/pages/feed.md. Must include:
- Founder portrait, top-left, 56px, soft ring
- Mood tag chip top-right
- Big serif headline number (the "pop number")
- One-line "what they did"
- 3 micro-bullets for "how"
- Build CTA — sticky bottom of card on mobile, inline on desktop
- Long-press → opens StorySheet for full detail

Then build components/story/StoryFeed.tsx — vertical scroll, snap-to-card on mobile, masonry on desktop. Use react-intersection-observer to track which Story is in view (drives "seen" state).

Build components/story/StorySheet.tsx — the full detail bottom sheet.
```

Test:
```
/design-review components/story
```

Commit:
```
git add components/story content/stories.seed.json app/page.tsx
git commit -m "feat: Story Card + Feed + Sheet with seed data"
```

### 6b — Globe hero + integrated home (added 2026-05-03)

Phase 6b expanded to include globe hero per ratified Candidate D in design-system/pages/feed.md. See app/page.tsx for integrated home.

---

## Deferred

Active tradeoffs that have been seen and explicitly deferred (not bugs).
See `design-system/DEFERRED.md` for the full list with originating commits,
user direction, and next-pass scope.

---

## Phase 7 — The three switches (90 min)

The IA spine. This is what separates the prototype from a real product.

### 7a. MoodPicker
```
Build components/nav/MoodPicker.tsx. Spec:
- Floating action button bottom-right when collapsed (current mood emoji + label)
- Tap → expands to 9-tile grid as bottom sheet (mobile) or popover (desktop)
- Each tile: emoji at 32px, label below, illustrated background (use abstract gradient art per mood — mood-specific, NOT one shared gradient)
- Tap a mood → updates URL param ?mood=<key>, refilters feed with motion (Framer FLIP)
- "Clear" option at top → ?mood=null
- Persists to localStorage so next session reopens to same mood
```

### 7b. StageToggle
```
Build components/nav/StageToggle.tsx. 3-position segmented control: Empires | Builders | Bootstrappers. Sticky-top. URL param ?stage=. Match the design system, not iOS/Android defaults.
```

### 7c. IndustryBento
```
Build components/nav/IndustryBento.tsx. Bento grid of 12 industry tiles: AI, Fintech, Climate, Bio, Defense, Consumer, B2B, DevTools, Space, Creator, Commerce, India. Each tile has:
- Industry name (display serif)
- Story count for active filters
- Heat indicator (subtle pulse if hot)
- Mood-art background (different visual per industry, derived from MASTER colors)
- Tap → ?industry=<slug>
- Multi-select supported (long-press to add/remove)
- Bento grid is asymmetric — featured industries get larger tiles based on heat

Open as full-screen sheet, not a sidebar.
```

### 7d. Compose them on the home route
```
Update app/(feed)/page.tsx to read URL params for mood/stage/industry, filter stories from the seed via lib/ranking.ts. Add a "Reset" pill in the top-right when any filter is active.
```

Commit each subphase separately for clean history:
```
git add components/nav/MoodPicker.tsx; git commit -m "feat: MoodPicker with 9 mood lenses"
git add components/nav/StageToggle.tsx; git commit -m "feat: StageToggle (Empires/Builders/Bootstrappers)"
git add components/nav/IndustryBento.tsx; git commit -m "feat: IndustryBento grid"
git add app/(feed) lib/ranking.ts; git commit -m "feat: compose switches on home feed"
```

---

## Phase 8 — Build CTA → BuildSheet → Forge bridge (60 min)

The wedge.

```
Build components/story/BuildSheet.tsx. Triggered by Build CTA. Bottom sheet on mobile, dialog on desktop. Contents:
1. Eyebrow: "Forge from this signal"
2. Generated codename (use lib/codenames.ts → adjective + noun, deterministic from story.id)
3. Tabs: 3 angles (from getBuildAngles)
4. For each angle: title, desc, wedge_hint, "Use this angle" button
5. Below: a spec preview block showing what will be sent to Catalst OS forge
6. Primary CTA: "Forge in Verdania" → POST /api/forge → 302 to <CATALST_OS_URL>/forge?seed=<storyId>
7. Secondary: "Save for later" → adds to /me/builds

Build app/api/forge/route.ts as the bridge. POST receives {storyId, angleIdx}, mints a forge_session record in Supabase, returns the deep-link URL.

Add lib/codenames.ts — 200 codenames as an array, deterministic hash on story.id picks one.
```

Wire instrumentation:
```
Add lib/analytics.ts — wraps PostHog. Track: story_seen, story_opened, story_shared, build_cta_clicked, build_angle_chosen, build_forged, story_skipped. Each event tagged with mood + stage + industry context.
```

```
git add components/story/BuildSheet.tsx app/api/forge lib/codenames.ts lib/analytics.ts
git commit -m "feat: BuildSheet + Forge bridge to Catalst OS"
```

---

## Phase 9 — Habit loop layer (60 min)

Streak, XP, Daily Brief, Quest. Without this, retention dies.

```
Build components/habit/StreakChip.tsx — top-right of header, flame icon, day count. Updates on first open per day.

Build components/habit/XPBar.tsx — Level + XP bar. Sub-component of profile.

Build components/habit/DailyBrief.tsx — modal that fires on first daily open. Pulls 3 stories from user's tracked moods/industries that arrived since last open. Three actions: View, Save, Skip. After triage → "Enter the feed" CTA.

Build components/habit/QuestPill.tsx — bottom-bar mini quest. Daily quest ideas:
- "Find a build idea in [random industry]"
- "Open 5 stories"
- "Share 1 story"
- "Try a new mood you haven't used this week"

Build lib/habit.ts — pure functions for: incrementStreak, awardXP, getTodayQuest, completeQuest. All client-side first; server sync later.

Persist to localStorage immediately. Sync to Supabase per route change.
```

```
git add components/habit lib/habit.ts
git commit -m "feat: habit loop — streak, XP, daily brief, quest"
```

---

## Phase 10 — Live ingestion via Composio (90 min)

This is where the app becomes alive.

```
Use the connect-apps skill. Set up ingestion adapters in lib/ingest/. Sources:
1. ProductHunt (daily top 5 launches — Composio adapter)
2. Hacker News (Show HN front page, last 24h, score > 100 — official API, no Composio needed)
3. GitHub trending (weekly, JS/TS/Python/Rust — official API)
4. Crunchbase News RSS (https://news.crunchbase.com/feed — RSS adapter)
5. layoffs.fyi RSS

Each adapter: fetches → normalizes to Story shape → upserts to Supabase via lib/db.

Build app/api/ingest/route.ts as a cron-triggered handler (Vercel Cron, every 30 min).

Build the Story enrichment pipeline: when a new raw signal arrives, use the content-research-writer skill (or claude-3-5-haiku for cost) to generate the editorial copy — the "what they did" line, the 3 how-bullets, the why-it-matters line. Cache aggressively.
```

Add a kill switch in case ingestion goes haywire:
```
Add lib/feature-flags.ts. Flag INGESTION_ENABLED defaults to false in dev, true in prod. Honor it in the cron.
```

```
git add lib/ingest app/api/ingest lib/feature-flags.ts
git commit -m "feat: live ingestion via Composio + cron + LLM enrichment"
```

---

## Phase 11 — Polish, perf, a11y, ship (60 min)

```
Use webapp-testing skill. Write Playwright tests for the 5 critical flows:
1. Open app cold → mood picker → see filtered feed
2. Open story → see full detail → close
3. Tap Build CTA → BuildSheet opens → choose angle → forge link generated
4. Streak increments on second-day open
5. Daily Brief modal appears on first open of day

Run lighthouse on /. Target: ≥ 90 perf, 100 a11y, ≥ 95 best practices.
```

```
/review
/design-review
```

Both must be ≥ 9. Then:

```
git push -u origin main
```

Connect to Vercel:
```powershell
bunx vercel link
bunx vercel env pull
bunx vercel --prod
```

Set up custom domain (e.g., `market.catalst.app`).

---

## Parallelization tip

For phases 6, 7, 9, 10 — use `using-git-worktrees`. Each subagent gets its own worktree, builds in parallel, you merge into main one at a time after `/review`.

```
Use using-git-worktrees skill. Create 4 worktrees: design-agent at ../market-design, data-agent at ../market-data, feature-agent at ../market-feature, test-agent at ../market-test. Each on a feature branch.
```

---

## Definition of done — final checklist

- [ ] CLAUDE.md and AGENTS.md committed
- [ ] design-system/MASTER.md generated and validated
- [ ] Story type locked, angle generator written
- [ ] Story Card / Feed / Sheet shipped
- [ ] MoodPicker + StageToggle + IndustryBento all functional
- [ ] Build CTA wired end-to-end to Verdania forge endpoint
- [ ] Streak / XP / Daily Brief / Quest functional
- [ ] Live ingestion running every 30 min
- [ ] Playwright tests passing
- [ ] Lighthouse ≥ 90 perf, 100 a11y
- [ ] gstack `/review` ≥ 9, `/design-review` ≥ 9
- [ ] Deployed to Vercel
- [ ] Custom domain live
- [ ] First Loom recorded showing the loop

---

## What I'll need from you between phases

1. **After Phase 3:** Confirm or reject the generated design system. Show me MASTER.md.
2. **After Phase 4:** Confirm the Story type. Show me lib/types/story.ts.
3. **Before Phase 8:** Catalst OS forge endpoint URL + auth contract (so the bridge actually works).
4. **Before Phase 10:** Composio API key + Supabase project keys.
5. **Before Phase 11:** Custom domain decision.
