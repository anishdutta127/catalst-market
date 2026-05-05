# AGENTS.md — catalst-market

> Read this first. This file is the canonical project brain for any AI agent (Codex, Claude Code, Cursor, etc.) operating in this repo. CLAUDE.md duplicates this content for Claude Code's loader — keep both in sync.

## Mission
Catalst Market is the Market layer of Catalst OS. A live, mood-first, mobile-first feed of business + startup stories built for the **general public** — not VCs, not founders only. Every story has a one-click **Build with Catalst** CTA that deep-links into Verdania for ideation.

## Audience and tone
- Gen Z + millennials in India and global. They want to be hustlers but aren't VCs.
- Editorial-pop refined. Robinhood approachability + Pinterest visual richness + Apple Newsroom typography + Substack editorial weight.
- Story copy is third-person, present-tense, editorial — never first-person Claude voice.

## Atomic unit — the Story
A Story is a single hand of news rendered emotionally:
- Founder face / company logo
- One-line *what they did*
- One number that pops (the headline metric, big serif type)
- 30-second *how* (3 micro-bullets max)
- Why it matters now (1 line)
- Copy-able angle (the build prompt)
- Build CTA → Verdania `/forge?seed=<storyId>`

The canonical Story type lives at `lib/types/story.ts`. Changes to it propagate everywhere — change with care.

## Three switches (the IA spine)
1. **Stage** — Empires (public + unicorns) | Builders (seed–B) | Bootstrappers (no VC)
2. **Industry** — bento of 12 industry tiles, swipeable, mood-art per tile
3. **Mood** — "I'm feeling..." → 9 lenses: 🔥 Blowing up • 🌱 Underdog wins • 🪙 Bootstrapped to millions • 🚀 Overnight rockets • 🧠 Quiet builders • 💡 Copy-able ideas • 🎯 Founders like me • 💸 Big money moves • 🇮🇳 India shipping

Switches compose. URL params: `?mood=&stage=&industry=`. Default route: home → mood picker → stage toggle → industry filter.

## Visual law
- Design system is **generated** by `uipro-cli`, persisted to `design-system/MASTER.md`. NEVER hand-pick colors or fonts.
- Page-specific deviations live in `design-system/pages/<page>.md` and override MASTER.
- Anti-patterns to refuse on sight: Inter as primary font, neon purple gradients, glassmorphism on every card, AI-slop gradients, dense data tables, terminal/Bloomberg aesthetics.
- Mobile-first. 375px is the design canvas. Scale up to 768 / 1440.

## Habit loop (non-negotiable for retention)
- Streak counter visible on the header
- Daily Brief modal on first open of day (3 missed signals from tracked moods)
- Daily Quest with +50 XP — appears in the Insight Bar
- XP from: opening app, claiming a build, sharing, completing a quest
- Toast for new live signals matching tracked mood/industry
- All habit state lives in `lib/habit.ts` — pure functions, client-first, server-synced

## Build CTA — the wedge
Every Story Card has it. Always one tap. Workflow:
1. Tap → BuildSheet opens (bottom sheet on mobile, dialog on desktop)
2. Sheet shows codename, 3 type-specific build angles, spec preview
3. User picks an angle, taps "Forge in Verdania"
4. POST `/api/forge` → mints forge_session in Supabase → returns deep-link to `<CATALST_OS_URL>/forge?seed=<storyId>&angle=<idx>`
5. Browser navigates → user lands in Verdania ready to ideate

Type-specific angle generation lives in `lib/angles.ts`. Each story type has 3 hand-tuned angle templates (funding ≠ launch ≠ M&A).

## Stack — locked, don't drift
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript strict mode, no `any` without explanation
- **Styling**: Tailwind v4 + CSS variables from MASTER.md
- **Animation**: Framer Motion
- **Client state**: Zustand
- **Server state**: TanStack Query
- **DB**: Supabase Postgres
- **Ingestion**: Composio MCP (Crunchbase, ProductHunt, HN, GitHub, RSS)
- **Runtime**: Bun in dev, Node in prod (Vercel)
- **Deploy**: Vercel
- **Analytics**: PostHog (self-hosted later, cloud for now)

## Folder layout
```
catalst-market/
├── app/
│   ├── (feed)/             # mood/stage/industry routes
│   ├── story/[id]/         # individual story (deep-link)
│   ├── api/
│   │   ├── stories/        # CRUD + ingest webhook
│   │   ├── forge/          # bridge to Catalst OS
│   │   └── ingest/         # Composio webhook receivers
│   └── layout.tsx
├── components/
│   ├── story/              # StoryCard, StorySheet, StoryFeed, BuildSheet
│   ├── nav/                # MoodPicker, StageToggle, IndustryBento
│   ├── habit/              # StreakChip, XPBar, DailyBrief, QuestPill
│   └── ui/                 # primitives (button, sheet, chip)
├── lib/
│   ├── types/story.ts      # canonical Story type
│   ├── angles.ts           # type-specific build angle templates
│   ├── codenames.ts        # 200 codenames, deterministic pick
│   ├── ranking.ts          # mood-to-story scoring
│   ├── habit.ts            # streak/XP logic
│   ├── analytics.ts        # PostHog wrapper
│   ├── ingest/             # source adapters (crunchbase, hn, ph, gh, rss)
│   └── utils/cn.ts
├── design-system/
│   ├── MASTER.md           # generated by uipro-cli
│   └── pages/              # per-route overrides
├── content/
│   └── stories.seed.json   # cold-start hand-picked stories
├── AGENTS.md               # this file (canonical)
├── CLAUDE.md               # mirrors this file for Claude Code
├── BUILD-PLAN.md           # phase-by-phase roadmap
└── package.json
```

## Working agreements
- Direct, no neutral-options. Recommend, don't survey.
- One commit per concern. Conventional commits only: `feat:` `fix:` `chore:` `docs:` `test:` `refactor:`
- TDD on every `lib/` module. Run `bun test` before committing.
- gstack `/review` ≥ 9 AND `/design-review` ≥ 9 before any merge.
- Use git worktrees for parallel batch builds (`using-git-worktrees` skill).
- If you generate >100 lines without writing a test, stop and write one.
- If you find yourself writing the same prop interface twice, extract a type.
- If a component file passes 250 lines, split it.

## Available skills (verify with `/plugin list` in Claude Code, or check `~/.codex/skills/` for Codex)
- gstack — review, design-review, careful, ship, freeze, qa
- ui-ux-pro-max — design system generator (`uipro` CLI)
- document-skills — docx, pdf, pptx, xlsx
- example-skills — artifacts-builder, brand-guidelines, webapp-testing
- connect-apps — Composio MCP for ingestion
- brainstorming, deep-research, content-research-writer, theme-factory
- using-git-worktrees, test-driven-development, finishing-a-development-branch, root-cause-tracing

## Multi-agent workflow
- **Claude Code** = primary architect. Owns CLAUDE.md, design system reasoning, complex refactors, design reviews.
- **Codex CLI (GPT-5.5)** = parallel implementation. Owns AGENTS.md, fast multi-file refactors, test generation, ingestion adapter scaffolding.
- They share the repo via git worktrees. Conflict resolution: human picks. Never auto-merge between agents.
- Both honor the same `MASTER.md` design system and the same CLAUDE.md / AGENTS.md principles.

## Don't list
- Don't build a 3D-rotating data-globe as the centerpiece (the original Bloomberg-terminal pattern). The dotted-continent SVG hero on / IS approved — see design-system/pages/feed.md for spec. Globe is banned everywhere except /.
- Don't write content copy in agent voice.
- Don't use the word "leverage."
- Don't use emojis as icons (use Lucide).
- Don't ship without `lib/types/story.ts` shape locked.
- Don't add subscription gating before MVP.
- Don't compete on data depth (Crunchbase wins). Compete on emotional clarity + the Build CTA.
- Don't accept the first MASTER.md if it proposes Inter / glassmorphism / dark default.

## Definition of done — per batch
1. `bun test` passes
2. `/review` ≥ 9 (Claude Code) or `codex review` clean (Codex)
3. `/design-review` ≥ 9 against the relevant `design-system/pages/<page>.md`
4. Visual check at 375 / 768 / 1440
5. Lighthouse ≥ 90 perf, ≥ 95 a11y
6. One PR per batch — commit messages tell the story
7. 60-second Loom recorded before merge to main

## Compass for ambiguity
"Does this make a 22-year-old in Mumbai who has never met a VC feel like they could build something tomorrow?" If no → cut it.
