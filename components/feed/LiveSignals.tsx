"use client";

/**
 * LiveSignals — the ambient signal stream from the WZ home-feed layout.
 *
 * Two responsive variants:
 *
 *   DESKTOP (≥1024px): vertical sidebar, 280px wide, full hero height.
 *     Header strip + scrolling list of 8 visible items + footer hint.
 *     Auto-scrolls slowly upward; pauses on hover.
 *
 *   MOBILE (<1024px): horizontal ticker, 32px tall, full width.
 *     "◄ LIVE" prefix + signal items scrolling left-to-right at constant
 *     speed. Touch pauses for ~2s after release.
 *
 * Both honor `prefers-reduced-motion`: animation stops, list renders
 * statically. Both reuse the existing dotted-text vocabulary (DottedText
 * for timestamps + city codes, Geist for the readable signal text).
 *
 * Tap on an item fires `onItemTap(storyId)` — the parent (Phase 6c Part 3
 * home page) maps that to either expanding a top-3 card or opening a
 * BuildSheet preview (the BuildSheet wiring is Phase 6d, parent stub is
 * console.log for now).
 */

import { useEffect, useRef, useState } from "react";
import { Cassette } from "@/components/brand/Cassette";
import { DottedText } from "@/components/brand/DottedText";
import type { SignalItem } from "@/lib/live-signals";

/**
 * Tiny dotted-text type cassette rendered before the company name on each
 * row. Per feed.md §7f Module D (v3 ratification): "11:42 [FUND] Zepto $500M"
 * format. Reuses the StoryCard TYPE_DISPLAY vocabulary.
 */
function TypeBadge({ type }: { type: SignalItem["type"] }) {
  const label = TYPE_BADGE_LABELS[type];
  return (
    <Cassette
      contentWidth={label.length * 5 + (label.length - 1)}
      contentHeight={7}
      variant="pin-label"
      dotSize={1}
      padding={{ x: 2, y: 1 }}
      fill="var(--color-paper)"
      borderColor="var(--color-pen)"
      ariaLabel={`Type: ${label}`}
    >
      <DottedText text={label} dotSize={1} color="var(--color-ink)" />
    </Cassette>
  );
}

const TYPE_BADGE_LABELS: Record<SignalItem["type"], string> = {
  funding: "FUND",
  launch: "LAUNCH",
  ai: "AI",
  ma: "MA",
  ipo: "IPO",
  milestone: "MILE",
  founder: "FNDR",
  os: "OS",
  layoff: "LAYOFF",
  shutdown: "SHUT",
  regulatory: "REG",
};

export type LiveSignalsVariant = "sidebar" | "ticker";

export interface LiveSignalsProps {
  /** The pre-built signal items. Empty array → quiet placeholder. */
  signals: readonly SignalItem[];
  /** Force a variant. Defaults to auto (sidebar at ≥1024px, ticker below). */
  variant?: LiveSignalsVariant;
  /** Fires when a user taps an item. */
  onItemTap?: (storyId: string) => void;
  /** Override matchMedia for testing / SSR. */
  matchesDesktop?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// useMatchesDesktop — read 'min-width: 1024px' once + on change
// ─────────────────────────────────────────────────────────────────────────────

function useMatchesDesktop(override?: boolean): boolean {
  const [matches, setMatches] = useState<boolean>(() => override ?? false);
  useEffect(() => {
    if (override !== undefined) {
      setMatches(override);
      return;
    }
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, [override]);
  return matches;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = (e: MediaQueryListEvent) => setReduced(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", h);
    else mq.addListener(h);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", h);
      else mq.removeListener(h);
    };
  }, []);
  return reduced;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function LiveSignals(props: LiveSignalsProps) {
  const { signals, variant, onItemTap, matchesDesktop } = props;
  const isDesktop = useMatchesDesktop(matchesDesktop);
  const reducedMotion = usePrefersReducedMotion();
  const resolved: LiveSignalsVariant =
    variant ?? (isDesktop ? "sidebar" : "ticker");

  if (signals.length === 0) {
    return (
      <QuietPlaceholder variant={resolved} reducedMotion={reducedMotion} />
    );
  }

  return resolved === "sidebar" ? (
    <SidebarVariant
      signals={signals}
      onItemTap={onItemTap}
      reducedMotion={reducedMotion}
    />
  ) : (
    <TickerVariant
      signals={signals}
      onItemTap={onItemTap}
      reducedMotion={reducedMotion}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar (desktop) — vertical, 280px wide, slow auto-scroll
// ─────────────────────────────────────────────────────────────────────────────

const SIDEBAR_ITEM_HEIGHT = 52;
const SIDEBAR_SCROLL_PX_PER_S = 16;

function SidebarVariant({
  signals,
  onItemTap,
  reducedMotion,
}: {
  signals: readonly SignalItem[];
  onItemTap?: (storyId: string) => void;
  reducedMotion: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);

  // Auto-scroll loop. Pauses on hover, resets to top when item N has
  // scrolled fully off the visible window (8 items * SIDEBAR_ITEM_HEIGHT).
  useEffect(() => {
    if (reducedMotion || paused) {
      lastTickRef.current = null;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    const totalScrollPx =
      Math.max(0, signals.length - 8) * SIDEBAR_ITEM_HEIGHT;
    if (totalScrollPx === 0) return; // nothing to scroll
    const tick = (now: number) => {
      if (lastTickRef.current === null) lastTickRef.current = now;
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      offsetRef.current = (offsetRef.current + dt * SIDEBAR_SCROLL_PX_PER_S) %
        totalScrollPx;
      if (listRef.current) {
        listRef.current.style.transform = `translateY(${-offsetRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [signals.length, reducedMotion, paused]);

  return (
    <aside
      data-live-signals=""
      data-live-variant="sidebar"
      data-live-reduced-motion={reducedMotion ? "true" : "false"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="flex flex-col bg-card border border-rule rounded-lg overflow-hidden"
      style={{ width: 280, height: "100%" }}
    >
      <SidebarHeader paused={paused || reducedMotion} />

      <div
        data-live-window=""
        className="relative flex-1 overflow-hidden"
        style={{ minHeight: 8 * SIDEBAR_ITEM_HEIGHT }}
      >
        <div
          ref={listRef}
          data-live-list=""
          className="will-change-transform"
          style={{ transform: "translateY(0)" }}
        >
          {/* Render signals twice for seamless wrap-around. The transform
              wraps modulo totalScrollPx so the second copy slides in as
              the first scrolls off the top. */}
          {[...signals, ...signals].map((s, i) => (
            <SidebarItem
              key={`${s.id}-${i < signals.length ? "a" : "b"}`}
              signal={s}
              onTap={onItemTap}
            />
          ))}
        </div>
      </div>

      <div
        data-live-footer=""
        className="border-t border-rule px-3 py-2.5 select-none inline-flex items-center"
      >
        <DottedText
          text="PAUSE: HOVER · TAP: PREVIEW"
          dotSize={1.0}
          color="var(--color-pen)"
        />
      </div>
    </aside>
  );
}

function SidebarHeader({ paused }: { paused: boolean }) {
  return (
    <div
      data-live-header=""
      className="flex items-center justify-between border-b border-rule px-3 py-2.5"
    >
      <div className="flex items-center gap-2">
        <PulseDot pulsing={!paused} />
        <DottedText text="LIVE SIGNALS" dotSize={1.5} color="var(--color-pen)" />
      </div>
    </div>
  );
}

function SidebarItem({
  signal,
  onTap,
}: {
  signal: SignalItem;
  onTap?: (storyId: string) => void;
}) {
  return (
    <button
      type="button"
      data-live-item=""
      data-live-item-id={signal.storyId}
      onClick={() => onTap?.(signal.storyId)}
      className="block w-full text-left border-b border-rule px-3 py-2.5 hover:bg-paper transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-[-2px]"
      style={{ height: SIDEBAR_ITEM_HEIGHT }}
    >
      <div className="flex items-center gap-2">
        <DottedText text={signal.time} dotSize={1.25} color="var(--color-pen)" />
        <span
          data-live-item-city=""
          className="inline-flex items-center"
        >
          <DottedText
            text={signal.cityShort}
            dotSize={1.0}
            color="var(--color-pen)"
          />
        </span>
      </div>
      <div className="flex items-baseline gap-2 mt-0.5 min-w-0">
        <TypeBadge type={signal.type} />
        <span className="text-[13px] font-medium text-ink truncate flex-1">
          {signal.company}
        </span>
        {/* Notable metric: ratified ink + Geist 700 (was Coral + Geist 600).
            See feed.md §7f Module D and MASTER §3 Coral budget paragraph. */}
        <span
          className={[
            "text-[12px] shrink-0 text-ink",
            signal.isNotable ? "font-bold" : "font-semibold",
          ].join(" ")}
        >
          {signal.metricLabel}
        </span>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ticker (mobile) — horizontal, 32px tall, constant-speed translateX
// ─────────────────────────────────────────────────────────────────────────────

const TICKER_SCROLL_PX_PER_S = 40;
const TICKER_TOUCH_RESUME_MS = 2000;

function TickerVariant({
  signals,
  onItemTap,
  reducedMotion,
}: {
  signals: readonly SignalItem[];
  onItemTap?: (storyId: string) => void;
  reducedMotion: boolean;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const stripWidthRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reducedMotion || paused) {
      lastTickRef.current = null;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    // We render the strip TWICE so the loop point is invisible; scroll the
    // wrapper by stripWidth then snap back to 0.
    const measure = () => {
      if (stripRef.current) {
        // Width of one half of the doubled list. clientWidth includes both,
        // so divide by 2.
        const w = stripRef.current.scrollWidth / 2;
        stripWidthRef.current = w;
      }
    };
    measure();

    const tick = (now: number) => {
      if (lastTickRef.current === null) lastTickRef.current = now;
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      const w = stripWidthRef.current;
      if (w > 0) {
        offsetRef.current = (offsetRef.current + dt * TICKER_SCROLL_PX_PER_S) %
          w;
        if (stripRef.current) {
          stripRef.current.style.transform = `translateX(${-offsetRef.current}px)`;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [signals.length, reducedMotion, paused]);

  // Touch handlers — pause on touchstart, resume 2s after touchend.
  const onTouchStart = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    setPaused(true);
  };
  const onTouchEnd = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setPaused(false);
      resumeTimerRef.current = null;
    }, TICKER_TOUCH_RESUME_MS);
  };
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  return (
    <div
      data-live-signals=""
      data-live-variant="ticker"
      data-live-reduced-motion={reducedMotion ? "true" : "false"}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="flex items-center bg-card border-y border-rule overflow-hidden select-none"
      style={{ height: 32, width: "100%" }}
    >
      {/* "LIVE" prefix — sticky at left, doesn't scroll */}
      <div
        data-live-prefix=""
        className="flex items-center gap-1.5 px-2.5 shrink-0 border-r border-rule h-full"
        style={{ background: "var(--color-card)" }}
      >
        <PulseDot pulsing={!paused && !reducedMotion} />
        <DottedText text="LIVE" dotSize={1.25} color="var(--color-pen)" />
      </div>
      {/* Scrolling strip — duplicated for seamless loop */}
      <div className="relative overflow-hidden flex-1 h-full">
        <div
          ref={stripRef}
          data-live-strip=""
          className="flex items-center h-full will-change-transform whitespace-nowrap"
          style={{ transform: "translateX(0)" }}
        >
          {[...signals, ...signals].map((s, i) => (
            <TickerItem
              key={`${s.id}-${i < signals.length ? "a" : "b"}`}
              signal={s}
              onTap={onItemTap}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TickerItem({
  signal,
  onTap,
}: {
  signal: SignalItem;
  onTap?: (storyId: string) => void;
}) {
  return (
    <button
      type="button"
      data-live-item=""
      data-live-item-id={signal.storyId}
      onClick={(e) => {
        e.stopPropagation();
        onTap?.(signal.storyId);
      }}
      className="inline-flex items-center gap-2 px-3 h-full hover:bg-paper transition-colors cursor-pointer text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-[-2px]"
    >
      <DottedText text={signal.time} dotSize={1.1} color="var(--color-pen)" />
      <TypeBadge type={signal.type} />
      <span className="font-medium text-ink whitespace-nowrap">
        {signal.company}
      </span>
      <span
        className={[
          "text-ink",
          signal.isNotable ? "font-bold" : "font-semibold",
        ].join(" ")}
      >
        {signal.metricLabel}
      </span>
      <span className="text-pen/40 select-none" aria-hidden="true">
        ·
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-elements
// ─────────────────────────────────────────────────────────────────────────────

function PulseDot({ pulsing }: { pulsing: boolean }) {
  return (
    <span
      data-live-pulse=""
      data-live-pulse-active={pulsing ? "true" : "false"}
      style={{
        width: 6,
        height: 6,
        borderRadius: 999,
        background: "var(--color-cta)",
        animation: pulsing ? "catalst-live-pulse 1.4s ease-in-out infinite" : "none",
      }}
      aria-hidden="true"
    />
  );
}

function QuietPlaceholder({
  variant,
  reducedMotion,
}: {
  variant: LiveSignalsVariant;
  reducedMotion: boolean;
}) {
  if (variant === "ticker") {
    return (
      <div
        data-live-signals=""
        data-live-variant="ticker"
        data-live-quiet="true"
        data-live-reduced-motion={reducedMotion ? "true" : "false"}
        className="flex items-center justify-center bg-card border-y border-rule"
        style={{ height: 32, width: "100%" }}
      >
        <span className="text-[12px] text-pen/60 italic">
          Quiet hour — no signals
        </span>
      </div>
    );
  }
  return (
    <aside
      data-live-signals=""
      data-live-variant="sidebar"
      data-live-quiet="true"
      data-live-reduced-motion={reducedMotion ? "true" : "false"}
      className="flex flex-col items-center justify-center bg-card border border-rule rounded-lg p-6"
      style={{ width: 280, minHeight: 200 }}
    >
      <span className="text-[13px] text-pen/60 italic text-center max-w-[200px]">
        Quiet hour — no signals in the last cycle
      </span>
    </aside>
  );
}
