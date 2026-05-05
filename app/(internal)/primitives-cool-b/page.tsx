"use client";

import "../../globals-cool-b.css";

import { Bookmark, Search, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { MOOD_META } from "@/lib/moods";
import type { Mood, Stage } from "@/lib/types/story";

/**
 * Cool palette — CANDIDATE B (Glacier & Pulse). Same demo as /primitives, with
 * the candidate-B token overrides loaded via globals-cool-b.css. Source of
 * truth: design-system/MASTER.cool-candidate-B.md.
 */

const STAGES: Stage[] = ["empires", "builders", "bootstrappers"];

export default function PrimitivesCoolBDemo() {
  return (
    <main className="min-h-screen bg-paper text-text font-sans px-6 py-12 md:px-12">
      <div className="max-w-6xl mx-auto space-y-16">
        <header>
          <p className="text-label uppercase tracking-wider text-pen">
            Catalst Market — Cool Candidate B
          </p>
          <h1 className="font-serif text-h1 md:text-hero text-ink leading-none mt-3">
            Glacier &amp; Pulse
          </h1>
          <p className="text-body text-pen mt-3 max-w-2xl">
            Cool-system override with deeper Glacier paper, navy ink, and a
            magenta-leaning Pulse Pink CTA
            <code className="font-mono text-sm bg-card px-1.5 py-0.5 rounded-sm border border-rule mx-1">
              #E61F65
            </code>
            (4.42:1 white-on-CTA — closer to body-text AA than the original).
            Mood tints are uniformly desaturated for cohesion. Compare with{" "}
            <a className="underline" href="/primitives">/primitives</a> (warm) and{" "}
            <a className="underline" href="/primitives-cool-a">/primitives-cool-a</a> (Candidate A).
          </p>
        </header>

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

            <Cell label="secondary / sm">
              <Button variant="secondary" size="sm">Save for later</Button>
            </Cell>
            <Cell label="secondary / md">
              <Button variant="secondary">Save for later</Button>
            </Cell>
            <Cell label="secondary / lg">
              <Button variant="secondary" size="lg">Save for later</Button>
            </Cell>
            <Cell label="secondary / disabled">
              <Button variant="secondary" disabled>Save for later</Button>
            </Cell>

            <Cell label="ghost / sm">
              <Button variant="ghost" size="sm">Skip</Button>
            </Cell>
            <Cell label="ghost / md">
              <Button variant="ghost">Skip</Button>
            </Cell>
            <Cell label="ghost / lg">
              <Button variant="ghost" size="lg">Skip</Button>
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

        <Section title="Chip — industry (with optional hot dot)">
          <div className="flex flex-wrap gap-2">
            <Chip variant="industry">AI</Chip>
            <Chip variant="industry" hot>
              Fintech
            </Chip>
            <Chip variant="industry">Climate</Chip>
            <Chip variant="industry" hot>
              Devtools
            </Chip>
            <Chip variant="industry">Biotech</Chip>
            <Chip variant="industry" active>
              Consumer
            </Chip>
          </div>
        </Section>

        <Section title="Chip — neutral (filter row)">
          <div className="flex flex-wrap gap-2">
            <Chip variant="neutral" active>
              All stages
            </Chip>
            <Chip variant="neutral">India only</Chip>
            <Chip variant="neutral">Verified</Chip>
            <Chip variant="neutral">Last 24h</Chip>
          </div>
        </Section>
      </div>
    </main>
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
