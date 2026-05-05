"use client";

import { Bookmark, Search, Share2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Cassette } from "@/components/brand/Cassette";
import { DottedText } from "@/components/brand/DottedText";
import { Globe, type GlobeStop } from "@/components/brand/Globe";
import { PixelCharacter } from "@/components/brand/PixelCharacter";
import { SUPPORTED_CHARS } from "@/components/brand/font-bitmap";
import { FilterChip } from "@/components/filter/FilterChip";
import { FilterPalette } from "@/components/filter/FilterPalette";
import { BuildAngles } from "@/components/feed/BuildAngles";
import { CityPanel, type CityHeatRow } from "@/components/feed/CityPanel";
import { GlobeHero } from "@/components/feed/GlobeHero";
import { LiveSignals } from "@/components/feed/LiveSignals";
import { BusinessOfWeek } from "@/components/feed/BusinessOfWeek";
import { Movers } from "@/components/feed/Movers";
import { Top3OfWeek } from "@/components/feed/Top3OfWeek";
import { TrendingHeuristics } from "@/components/feed/TrendingHeuristics";
import { StoryCard } from "@/components/story/StoryCard";
import { StoryCardSkeleton } from "@/components/story/StoryCardSkeleton";
import { aggregateAngles } from "@/lib/angle-aggregator";
import { getBusinessOfWeek, getMovers, getTop3OfWeek } from "@/lib/curation";
import {
  computeHeuristics,
  padHeuristicsToCount,
} from "@/lib/heuristics";
import { buildSignalsFromStories } from "@/lib/live-signals";
import { MOOD_META } from "@/lib/moods";
import { SEED_STORIES } from "@/lib/seed";
import type { AnyStory, Mood, Stage, StoryType } from "@/lib/types/story";

const SAMPLE_STOPS: GlobeStop[] = [
  { id: "1", citySlug: "sf",     date: "MAY 6 2026"  },
  { id: "2", citySlug: "london", date: "MAY 8 2026"  },
  { id: "3", citySlug: "tokyo",  date: "MAY 10 2026" },
];

/**
 * Internal dev surface for the UI primitives. Not promoted in IA.
 *
 * Lives under the `(internal)` route group so the URL is `/primitives`
 * (route groups don't appear in the path). Excluded from search via
 * public/robots.txt. Move out of `(internal)` only when this becomes a
 * public-facing showcase.
 */

const STAGES: Stage[] = ["empires", "builders", "bootstrappers"];

export default function PrimitivesDemo() {
  return (
    <main className="min-h-screen bg-paper text-text font-sans px-6 py-12 md:px-12">
      <div className="max-w-6xl mx-auto space-y-16">
        <header>
          <p className="text-label uppercase tracking-wider text-pen">
            Catalst Market
          </p>
          <h1 className="font-serif text-h1 md:text-hero text-ink leading-none mt-3">
            UI primitives
          </h1>
          <p className="text-body text-pen mt-3 max-w-2xl">
            Every variant of every primitive. Tokens consumed from
            design-system/MASTER.md via app/globals.css.
          </p>
        </header>

        {/* ─── CURATION SURFACES — Phase 7a ─────────────────────────────── */}

        <Section title="Top3OfWeek — weekly editorial spotlight (curatorial notes)">
          <div className="bg-paper border border-rule rounded-lg p-6">
            <Top3OfWeek
              items={WEEK_TOP_3}
              onBuild={(id) => console.log("Top3OfWeek Build CTA:", id)}
            />
          </div>
        </Section>

        <Section title="Top3OfWeek — empty state (curation pending)">
          <div className="bg-paper border border-rule rounded-lg p-6">
            <Top3OfWeek items={[]} />
          </div>
        </Section>

        <Section title="BusinessOfWeek — single-company spotlight (Sarvam AI)">
          <div className="bg-paper border border-rule rounded-lg p-6">
            <BusinessOfWeek
              data={WEEK_BUSINESS}
              angles={SEED_BUILD_ANGLES}
              onAngleTap={(id) => console.log("BusinessOfWeek angle tap:", id)}
            />
          </div>
        </Section>

        <Section title="Movers — quiet underdog signals (counter-programming)">
          <div className="bg-paper border border-rule rounded-lg p-6">
            <Movers
              stories={WEEK_MOVERS}
              onBuild={(id) => console.log("Mover Build CTA:", id)}
            />
          </div>
        </Section>

        <Section title="Movers — empty state (zero matching stories)">
          <div className="bg-paper border border-rule rounded-lg p-6">
            <Movers stories={[]} />
          </div>
        </Section>

        {/* ─── EDITORIAL CONSOLE NEW MODULES — Phase 6d Part 2 ──────────── */}

        <Section title="CityPanel — Module C (Bangalore default)">
          <div className="bg-paper border border-rule rounded-lg p-6 max-w-md">
            <CityPanel
              stories={[...SEED_STORIES]}
              activeCitySlug="bangalore"
              onCityChange={(slug) => console.log("CityPanel re-target:", slug)}
              cityHeat={SEED_CITY_HEAT}
            />
          </div>
        </Section>

        <Section title="TrendingHeuristics — Module E (6 cards exact, tap to filter)">
          <div className="bg-paper border border-rule rounded-lg p-6">
            <TrendingHeuristics entries={SEED_TRENDING} />
          </div>
        </Section>

        <Section title="BuildAngles — Module F (3 cross-story aggregates, multi-expand)">
          <div className="bg-paper border border-rule rounded-lg p-6">
            <BuildAngles
              angles={SEED_BUILD_ANGLES}
              stories={[...SEED_STORIES]}
              onStoryChipTap={(id) => console.log("Angle chip tap:", id)}
              onBuild={(id) => console.log("Angle Build CTA:", id)}
            />
          </div>
        </Section>

        {/* ─── UNIVERSAL FILTER — Phase 6d Part 1 ───────────────────────── */}

        <Section title="FilterChip — inline + floating variants">
          <Grid cols={2}>
            <Cell label="inline (used in Module A on desktop)">
              <FilterChipDemo variant="inline" />
            </Cell>
            <Cell label="floating (mobile bottom-right, glass-chrome)">
              <div className="relative w-full h-32 bg-paper border border-rule rounded-md">
                <FilterChipDemo variant="floating" />
              </div>
            </Cell>
          </Grid>
        </Section>

        <Section title="FilterPalette — Spotlight modal (open below)">
          <PaletteDemo />
        </Section>

        {/* ─── LIVE SIGNALS — Phase 6c Part 2 ──────────────────────────── */}

        <Section title="LiveSignals — desktop sidebar (≥1024px)">
          <div className="bg-paper border border-rule rounded-lg p-6 flex justify-center">
            <div style={{ height: 480 }}>
              <LiveSignals
                signals={LIVE_SIGNALS}
                variant="sidebar"
                matchesDesktop
                onItemTap={(id) => console.log("LiveSignals tap:", id)}
              />
            </div>
          </div>
          <p className="text-caption text-pen text-center mt-3">
            Auto-scrolls upward at 16px/s. Hover to pause, tap an item to
            preview (Phase 6d wiring).
          </p>
        </Section>

        <Section title="LiveSignals — mobile horizontal ticker (<1024px)">
          <div className="bg-paper border border-rule rounded-lg overflow-hidden">
            <LiveSignals
              signals={LIVE_SIGNALS}
              variant="ticker"
              matchesDesktop={false}
              onItemTap={(id) => console.log("LiveSignals tap:", id)}
            />
          </div>
          <p className="text-caption text-pen text-center mt-3">
            Scrolls left-to-right at 40px/s. Touch pauses for 2s after release.
          </p>
        </Section>

        <Section title="LiveSignals — quiet state (zero signals)">
          <Grid cols={2}>
            <Cell label="sidebar / quiet">
              <div style={{ height: 240 }}>
                <LiveSignals signals={[]} variant="sidebar" matchesDesktop />
              </div>
            </Cell>
            <Cell label="ticker / quiet">
              <div className="w-full">
                <LiveSignals
                  signals={[]}
                  variant="ticker"
                  matchesDesktop={false}
                />
              </div>
            </Cell>
          </Grid>
        </Section>

        {/* ─── STORY CARD — Phase 6c Part 1 ────────────────────────────── */}

        <Section title="StoryCard — top 3 row (collapsed default)">
          <div className="bg-paper border border-rule rounded-lg p-6 md:p-8">
            <Top3Row />
            <p className="text-caption text-pen text-center mt-6 max-w-xl mx-auto">
              Tap any card to expand. The other two dim to 30% (no layout shift)
              while the active card grows. Tap outside, press ESC, or tap the
              up-chevron to collapse.
            </p>
          </div>
        </Section>

        <Section title="StoryCard — all 11 types (collapsed)">
          <Grid cols={4}>
            {ONE_OF_EACH_TYPE.map((s) => (
              <Cell key={s.id} label={s.type}>
                <div style={{ width: 240 }}>
                  <StoryCard story={s} />
                </div>
              </Cell>
            ))}
          </Grid>
        </Section>

        <Section title="StoryCard — verified=false indicator">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <Cell label="verified=true (default)">
              <div style={{ width: 240 }}>
                <StoryCard story={SEED_STORIES[0]!} />
              </div>
            </Cell>
            <Cell label="verified=false">
              <div style={{ width: 240 }}>
                <StoryCard
                  story={{ ...SEED_STORIES[0]!, verified: false } as AnyStory}
                />
              </div>
            </Cell>
          </div>
        </Section>

        <Section title="StoryCard — skeleton row (loading state)">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StoryCardSkeleton />
            <StoryCardSkeleton />
            <StoryCardSkeleton />
          </div>
        </Section>

        {/* ─── GLOBEHERO — wired to seed data ──────────────────────────── */}

        <Section title="GlobeHero — wired to seed data (lib/heat-headline + content/stories.seed.json)">
          <div className="bg-paper border border-rule rounded-lg p-6 md:p-8">
            <GlobeHero stories={[...SEED_STORIES]} />
            <p className="text-caption text-pen text-center mt-6 max-w-xl mx-auto">
              Heat compute runs on 20 seed stories. The 5 BLR-anchored stories
              from this week win the cluster, so the headline reads &quot;Today:
              Bangalore is hot — 5 signals.&quot; Globe stops are the top 5 cities by
              signal count.
            </p>
          </div>
        </Section>

        <Section title="GlobeHero — quiet state (zero stories)">
          <div className="bg-paper border border-rule rounded-lg p-6 md:p-8">
            <GlobeHero stories={[]} />
          </div>
        </Section>

        <Section title="GlobeHero — loading state (stories === undefined)">
          <div className="bg-paper border border-rule rounded-lg p-6 md:p-8">
            <GlobeHero stories={undefined} />
          </div>
        </Section>

        <Section title="GlobeHero — error state (stories === null)">
          <div className="bg-paper border border-rule rounded-lg p-6 md:p-8">
            <GlobeHero stories={null} />
          </div>
        </Section>

        {/* ─── GLOBE — primitive variants ───────────────────────────────── */}

        <Section title="Globe — narrative hero (loops through stops)">
          <div className="bg-paper border border-rule rounded-lg p-6 md:p-12 flex flex-col items-center gap-4">
            <Globe
              stops={SAMPLE_STOPS}
              variant="narrative"
              size="hero"
              headline="CODE W CLAUDE"
              showCharacter
              ariaLabel="Code with Claude — narrative globe cycling through SF, London, Tokyo"
            />
            <p className="text-caption text-pen text-center max-w-md mt-4">
              Loops: HERO (3s) → ROTATE (1.8s) → ZOOM SF (3.5s) → ROTATE → ZOOM
              London → ROTATE → ZOOM Tokyo → ROTATE → HERO. Hover or touch to
              pause.
            </p>
          </div>
        </Section>

        <Section title="Globe — static (frozen hero state, no narrative)">
          <div className="bg-paper border border-rule rounded-lg p-6 md:p-8 flex flex-col items-center gap-2">
            <Globe
              stops={SAMPLE_STOPS}
              variant="static"
              size="md"
              headline="CODE W CLAUDE"
              showCharacter
            />
            <p className="text-caption text-pen mt-2">
              No state machine. Useful for screenshots, reduced-motion fallback
              testing, or any non-loop placement.
            </p>
          </div>
        </Section>

        <Section title="Globe — minimap (36×36, dots only)">
          <Grid cols={2}>
            <Cell label="minimap / sm">
              <Globe stops={SAMPLE_STOPS} variant="minimap" size="sm" />
            </Cell>
            <Cell label="minimap / md (still 240px container)">
              <Globe stops={SAMPLE_STOPS} variant="minimap" size="md" />
            </Cell>
          </Grid>
        </Section>

        <Section title="Globe — reduced-motion path (manual override for review)">
          <div className="bg-paper border border-rule rounded-lg p-6 md:p-8 flex flex-col items-center gap-2">
            {/* We can't easily mock prefers-reduced-motion in a live demo, so
                this shows the static variant which IS the visual reduced-motion
                target: phases hard-cut between cassette labels with no tween. */}
            <Globe
              stops={SAMPLE_STOPS}
              variant="static"
              size="md"
              headline="CODE W CLAUDE"
              showCharacter
            />
            <p className="text-caption text-pen mt-2 text-center max-w-md">
              Reduced-motion path renders identical to the static variant
              between scene transitions. Toggle <code>prefers-reduced-motion</code>
              in DevTools and reload to see the narrative variant honor it.
            </p>
          </div>
        </Section>

        {/* ─── DOTTED TEXT ─────────────────────────────────────────────── */}

        <Section title="DottedText — size presets (5×7 bitmap font, hand-encoded)">
          <Grid cols={2}>
            <Cell label="headline (city names)">
              <DottedText text="SAN FRANCISCO" size="headline" />
            </Cell>
            <Cell label="label (cassette interior)">
              <DottedText text="MAY 6 2026" size="label" />
            </Cell>
            <Cell label="route (bottom band)">
              <DottedText text="SF → LDN → TYO" size="route" />
            </Cell>
            <Cell label="custom color">
              <DottedText text="ACTIVE" size="label" color="var(--color-cta)" />
            </Cell>
          </Grid>
        </Section>

        <Section title="DottedText — alphabet dump (every supported glyph)">
          <div className="bg-card border border-rule rounded-lg p-6">
            <p className="text-label uppercase tracking-wider text-pen mb-4">
              uppercase
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((ch) => (
                <DottedText key={ch} text={ch} size="label" />
              ))}
            </div>
            <p className="text-label uppercase tracking-wider text-pen mb-4">
              digits + punctuation
            </p>
            <div className="flex flex-wrap gap-3">
              {SUPPORTED_CHARS.filter((c) => !/[A-Z]/.test(c)).map((ch) => (
                <div key={ch} className="flex flex-col items-center gap-1">
                  <DottedText text={ch} size="label" />
                  <span className="text-label text-pen">{ch === " " ? "·" : ch}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── CASSETTE ────────────────────────────────────────────────── */}

        <Section title="Cassette — labels with dot-rendered borders (NOT solid stroke)">
          <Grid cols={2}>
            <Cell label="pin-label / 'SF'">
              <Cassette
                contentWidth={5 * 2 * 2 + 1 * 2}
                contentHeight={7 * 2}
                variant="pin-label"
              >
                <DottedText text="SF" dotSize={2} color="var(--color-ink)" />
              </Cassette>
            </Cell>
            <Cell label="date-cassette / 'MAY 6 2026'">
              <Cassette
                contentWidth={10 * 5 * 2 + 9 * 2}
                contentHeight={7 * 2}
                variant="date-cassette"
              >
                <DottedText text="MAY 6 2026" dotSize={2} color="var(--color-ink)" />
              </Cassette>
            </Cell>
            <Cell label="custom fill — Coral mood-saffron">
              <Cassette
                contentWidth={5 * 2 * 3 + 2 * 2}
                contentHeight={7 * 2}
                variant="pin-label"
                fill="var(--mood-saffron)"
              >
                <DottedText text="BLR" dotSize={2} color="var(--color-ink)" />
              </Cassette>
            </Cell>
            <Cell label="empty cassette (no children, just border + fill)">
              <Cassette contentWidth={40} contentHeight={20} variant="date-cassette" />
            </Cell>
          </Grid>
        </Section>

        {/* ─── PIXEL CHARACTER ─────────────────────────────────────────── */}

        <Section title="PixelCharacter — poses × positions (HARD CUT, not slide)">
          <Grid cols={2}>
            <Cell label="stand / lower-left">
              <PixelCharacter pose="stand" position="lower-left" cell={4} />
            </Cell>
            <Cell label="stand / lower-right">
              <PixelCharacter pose="stand" position="lower-right" cell={4} />
            </Cell>
            <Cell label="stand / upper-right">
              <PixelCharacter pose="stand" position="upper-right" cell={4} />
            </Cell>
            <Cell label="wave / lower-right">
              <PixelCharacter pose="wave" position="lower-right" cell={4} />
            </Cell>
            <Cell label="hidden=true (opacity 0)">
              <div style={{ minHeight: 40 }}>
                <PixelCharacter pose="stand" position="lower-right" cell={4} hidden />
              </div>
            </Cell>
            <Cell label="custom color (Cobalt mood)">
              <PixelCharacter
                pose="stand"
                position="lower-right"
                cell={4}
                color="var(--mood-cobalt)"
              />
            </Cell>
          </Grid>
        </Section>

        {/* ─── PREVIOUSLY-EXISTING PRIMITIVES (unchanged) ──────────────── */}

        <Section title="Button — variants × sizes">
          <Grid cols={4}>
            <Cell label="primary / sm">
              <Button variant="primary" size="sm">Build with Catalst</Button>
            </Cell>
            <Cell label="primary / md">
              <Button variant="primary">Build with Catalst</Button>
            </Cell>
            <Cell label="primary / lg">
              <Button variant="primary" size="lg">Build with Catalst</Button>
            </Cell>
            <Cell label="primary / loading">
              <Button variant="primary" loading>Build with Catalst</Button>
            </Cell>

            <Cell label="secondary / md">
              <Button variant="secondary">Save for later</Button>
            </Cell>
            <Cell label="secondary / disabled">
              <Button variant="secondary" disabled>Save for later</Button>
            </Cell>
            <Cell label="ghost / md">
              <Button variant="ghost">Skip</Button>
            </Cell>
            <Cell label="ghost / disabled">
              <Button variant="ghost" disabled>Skip</Button>
            </Cell>

            <Cell label="icon / sm">
              <Button variant="icon" size="sm" Icon={Share2} aria-label="share" />
            </Cell>
            <Cell label="icon / md">
              <Button variant="icon" Icon={Bookmark} aria-label="save" />
            </Cell>
            <Cell label="icon / lg">
              <Button variant="icon" size="lg" Icon={X} aria-label="close" />
            </Cell>
            <Cell label="icon / loading">
              <Button variant="icon" loading Icon={Search} aria-label="search" />
            </Cell>
          </Grid>
        </Section>

        <Section title="Chip — mood lens (inactive / active)">
          <Grid cols={2}>
            {(Object.keys(MOOD_META) as Mood[]).map((m) => (
              <div key={m} className="flex items-center gap-3">
                <Chip variant="mood" mood={m}>
                  {MOOD_META[m].label}
                </Chip>
                <Chip variant="mood" mood={m} active>
                  {MOOD_META[m].label}
                </Chip>
              </div>
            ))}
          </Grid>
        </Section>

        <Section title="Chip — stage segmented toggle">
          <div className="inline-flex gap-1 bg-card border border-rule rounded-pill p-1">
            {STAGES.map((s, i) => (
              <Chip key={s} variant="stage" stage={s} active={i === 1}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Chip — industry">
          <div className="flex flex-wrap gap-2">
            <Chip variant="industry">AI</Chip>
            <Chip variant="industry" hot>Fintech</Chip>
            <Chip variant="industry">Climate</Chip>
            <Chip variant="industry" hot>Devtools</Chip>
            <Chip variant="industry">Biotech</Chip>
            <Chip variant="industry" active>Consumer</Chip>
          </div>
        </Section>
      </div>
    </main>
  );
}

// LiveSignals payload derived from the same seed as everything else.
const LIVE_SIGNALS = buildSignalsFromStories([...SEED_STORIES]);

// Computed once at module load — pure functions over the static seed.
const SEED_TRENDING = padHeuristicsToCount(
  computeHeuristics([...SEED_STORIES], new Date("2026-05-03T12:00:00Z")),
  6,
);

const SEED_BUILD_ANGLES = aggregateAngles([...SEED_STORIES]);

// Hand-curated weekly picks — Phase 7a editorial surface.
const WEEK_TOP_3 = getTop3OfWeek();
const WEEK_BUSINESS = getBusinessOfWeek();
const WEEK_MOVERS = getMovers();

// Static city-heat table for the CityPanel demo. Top 4 cities by featured-
// story signal count from the seed.
const SEED_CITY_HEAT: CityHeatRow[] = [
  { citySlug: "bangalore", cityLabelShort: "BLR", signalCount: 5 },
  { citySlug: "sf", cityLabelShort: "SF", signalCount: 3 },
  { citySlug: "london", cityLabelShort: "LON", signalCount: 2 },
  { citySlug: "la", cityLabelShort: "LA", signalCount: 1 },
];

/** Inline FilterChip demo with a controlled palette. */
function FilterChipDemo({ variant }: { variant: "inline" | "floating" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <FilterChip variant={variant} onOpen={() => setOpen(true)} />
      <FilterPalette open={open} onOpenChange={setOpen} />
    </>
  );
}

/** Open-by-default palette demo for visual review. */
function PaletteDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-paper border border-rule rounded-lg p-6 flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center h-10 px-4 rounded-pill bg-ink text-white text-[13px] font-semibold cursor-pointer"
      >
        Open Filter Palette
      </button>
      <p className="text-caption text-pen text-center max-w-md">
        Tap to open. Tabbed Mood (9) · Industry (12) · Stage (3). Multi-select
        composes. ESC / click-outside / &quot;Done&quot; closes. State persists
        to localStorage under <code>catalst-filter</code>.
      </p>
      <FilterPalette open={open} onOpenChange={setOpen} />
    </div>
  );
}

// One representative seed story per type for the type grid demo.
const ONE_OF_EACH_TYPE: AnyStory[] = (() => {
  const byType = new Map<StoryType, AnyStory>();
  for (const s of SEED_STORIES) {
    if (!byType.has(s.type)) byType.set(s.type, s);
  }
  return Array.from(byType.values());
})();

const TOP3_STORIES: AnyStory[] = [
  SEED_STORIES.find((s) => s.id === "zepto-series-f-2026")!,
  SEED_STORIES.find((s) => s.id === "sarvam-ai-multilingual-launch")!,
  SEED_STORIES.find((s) => s.id === "phonepe-ipo-filing")!,
];

/**
 * Top-3 demo with single-expansion enforcement. Click a card to expand it;
 * the other two automatically fall to compact (dimmed) state. Click again
 * (or ESC, or click outside) to collapse.
 */
function Top3Row() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  return (
    <div
      data-top3-row=""
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
      style={{ alignItems: "start" }}
    >
      {TOP3_STORIES.map((s, i) => (
        <StoryCard
          key={s.id}
          story={s}
          expanded={expandedIdx === i}
          variant={
            expandedIdx !== null && expandedIdx !== i ? "compact" : "default"
          }
          onExpandChange={(next) => setExpandedIdx(next ? i : null)}
          onBuild={(id) => console.log("Build with Catalst:", id)}
        />
      ))}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-serif text-h2 text-ink mb-6">{title}</h2>
      {children}
    </section>
  );
}

function Grid({
  cols,
  children,
}: {
  cols: number;
  children: React.ReactNode;
}) {
  const colClass =
    cols === 4
      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
      : "grid grid-cols-1 md:grid-cols-2 gap-4";
  return <div className={colClass}>{children}</div>;
}

function Cell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-label uppercase tracking-wider text-pen">{label}</p>
      <div className="bg-card border border-rule rounded-lg p-4 min-h-[80px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
