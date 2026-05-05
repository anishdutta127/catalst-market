"use client";

/**
 * Globe — scripted narrative stage rendered entirely in dot-matrix.
 *
 * Replaces the prior static dotted-disc with a state machine that telescopes
 * through three states in a continuous loop, mirroring the Code w/ Claude
 * reference video:
 *
 *   HERO    (3000ms) — full globe, all pins visible (one ACTIVE in a coral
 *                       cassette label, others as faint labels), dotted
 *                       headline above + route line below, character parked
 *                       lower-right.
 *   ROTATE  (1800ms) — globe rotates Y to bring the next stop's longitude
 *                       to center; pin labels move with the globe.
 *   ZOOM    (3500ms per city) — globe zooms in to ~3.5×, tilts to bring the
 *                       active city to vertical center; large dotted city
 *                       name appears above; coral date cassette appears
 *                       below; character HARD-CUTS to the opposite corner
 *                       (opacity 0 → reposition → opacity 1, no slide).
 *
 * Transitions are tweened with ease-in-out. Character relocations are NEVER
 * slides — always opacity hard-cuts (200ms each direction) per spec.
 *
 * prefers-reduced-motion: skip rotation + zoom transitions, hard-cut between
 * scenes with cassette labels updating.
 *
 * Imperative API (via ref):
 *   - gotoStop(slug)  — jump narrative to that city's ZOOM scene
 *   - pause(), resume()
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Cassette } from "./Cassette";
import { DottedText } from "./DottedText";
import { textWidth } from "./font-bitmap";
import { PixelCharacter, type CharacterPosition } from "./PixelCharacter";
import {
  ASTERISK_GLYPH,
  CITIES,
  type City,
  type GlobeDot3D,
  PLUS_GLYPH,
  getDotGrid,
  getDotGridCentered,
  project3D,
  project3DCentered,
} from "./world-data";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type GlobeVariant = "narrative" | "static" | "minimap";
export type GlobeSize = "sm" | "md" | "hero";
export type NarrativePhase = "HERO" | "ROTATE" | "ZOOM";

export interface GlobeStop {
  id: string;
  citySlug: string;
  date?: string;
  storyCount?: number;
  pinColor?: string;
}

export interface GlobeProps {
  stops: GlobeStop[];
  headline?: string;
  routeLine?: string;
  variant?: GlobeVariant;
  size?: GlobeSize;
  onStopChange?: (stop: GlobeStop) => void;
  onPinTap?: (citySlug: string) => void;
  showCharacter?: boolean;
  loop?: boolean;
  initialDelay?: number;
  className?: string;
  ariaLabel?: string;
}

export interface GlobeHandle {
  gotoStop: (citySlug: string) => void;
  pause: () => void;
  resume: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SIZE_PX: Record<GlobeSize, string> = {
  sm: "120px",
  md: "240px",
  // v3 (commit 64e12d5+): hero band has no headline above the globe — the
  // CityPanel module owns the canonical heat headline. The globe is now
  // the sole hero in its column, so it gets ~40px more presence (max bumped
  // 340 → 380; min lifted 280 → 320 for tablets where 38vh sat under 320).
  hero: "clamp(320px, 44vh, 380px)",
};

const VIEWBOX = 200;

const TIMINGS = {
  HERO: 4200,
  ROTATE: 3200,
  ZOOM: 5200,
};

const ZOOM_SCALE = 2.2;
const ZOOM_CENTERED_THRESHOLD = 2.0;
const CHAR_FADE_MS = 200;
// Sub-cell pixel size for asterisk + plus accent glyphs in viewBox units.
const ACCENT_SUBCELL = 0.95;
// Base radii for the four continent-dot size classes (viewBox units).
const DOT_R = 1.5;
const DOT_MEDIUM_R = 2.0;
const DOT_LARGE_R = 2.6;
const OCEAN_DOT_R = 0.8;
// Accent glyphs render at higher base opacity than dots so they read as accents.
const ACCENT_OPACITY_MULT = 1.5;

// ─────────────────────────────────────────────────────────────────────────────
// Scene scheduler — pure function
// ─────────────────────────────────────────────────────────────────────────────

interface Scene {
  phase: NarrativePhase;
  duration: number;
  rotationY: number;
  tiltX: number;
  zoom: number;
  characterPosition: CharacterPosition;
  /** -1 = HERO state (no single active stop). */
  activeStopIndex: number;
}

function buildScenes(stops: GlobeStop[]): Scene[] {
  const scenes: Scene[] = [];
  const heroRotY = stops[0] ? cityFor(stops[0]).lng : 0;

  scenes.push({
    phase: "HERO",
    duration: TIMINGS.HERO,
    rotationY: heroRotY,
    tiltX: 0,
    zoom: 1,
    characterPosition: "lower-right",
    activeStopIndex: -1,
  });

  for (let i = 0; i < stops.length; i++) {
    const city = cityFor(stops[i]!);
    // Per spec: character relocates to the opposite corner from where the pin
    // sits relative to the HERO orientation. Pin east of HERO center →
    // character bottom-LEFT; pin west → bottom-RIGHT. When the pin sits at
    // HERO center (lngDelta=0, e.g. the first stop drives the HERO rotation),
    // default to bottom-LEFT so the character still hard-cuts away from its
    // HERO bottom-RIGHT — preserves the "character changed corners" beat.
    const lngDelta = ((city.lng - heroRotY + 540) % 360) - 180;
    const charPosition: CharacterPosition =
      lngDelta < 0 ? "lower-right" : "lower-left";

    scenes.push({
      phase: "ROTATE",
      duration: TIMINGS.ROTATE,
      rotationY: city.lng,
      tiltX: 0,
      zoom: 1,
      characterPosition: "lower-right",
      activeStopIndex: i,
    });
    scenes.push({
      phase: "ZOOM",
      duration: TIMINGS.ZOOM,
      rotationY: city.lng,
      tiltX: city.lat,
      zoom: ZOOM_SCALE,
      characterPosition: charPosition,
      activeStopIndex: i,
    });
  }

  // Final ROTATE back to HERO orientation.
  scenes.push({
    phase: "ROTATE",
    duration: TIMINGS.ROTATE,
    rotationY: heroRotY,
    tiltX: 0,
    zoom: 1,
    characterPosition: "lower-right",
    activeStopIndex: -1,
  });

  return scenes;
}

function cityFor(stop: GlobeStop): City {
  return (
    CITIES[stop.citySlug] ?? {
      slug: stop.citySlug,
      name: stop.citySlug.toUpperCase(),
      country: "",
      lat: 0,
      lng: 0,
      labelShort: stop.citySlug.slice(0, 3).toUpperCase() || "??",
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dev-only perf budget guard
//
// Globe v2.1 ships ~600 SVG nodes per frame at hero, more during cycles
// when accent glyphs and pin labels render. Once GlobeHero mounts on the
// home feed (Phase 6c) with real seed scaling, the budget could drift.
// This guard logs (via requestIdleCallback so it doesn't block paint) when
// the per-frame node count exceeds 800. Production builds tree-shake this
// out via the NODE_ENV gate.
// ─────────────────────────────────────────────────────────────────────────────

const PERF_BUDGET_DOTS = 800;

/** Pure helper — extracted for testability. Returns true if a perf warning
    should fire for the given dot count in the current environment. */
export function shouldPerfWarn(dotCount: number): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  return dotCount > PERF_BUDGET_DOTS;
}

/** Logs a perf warning via requestIdleCallback. Idempotent per-mount: warns
    at most once per Globe instance even if dot count stays high across many
    re-renders. */
function usePerfBudgetGuard(dotCount: number, instanceId: string): void {
  const warnedRef = useRef(false);
  useEffect(() => {
    if (warnedRef.current) return;
    if (!shouldPerfWarn(dotCount)) return;
    warnedRef.current = true;
    const fire = () =>
      // eslint-disable-next-line no-console
      console.warn(
        `[Globe perf] instance ${instanceId} rendered ${dotCount} continent dots in one frame (budget ≤ ${PERF_BUDGET_DOTS}). ` +
          `Investigate before scaling — see components/brand/Globe.tsx:usePerfBudgetGuard.`,
      );
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(fire);
      return () => cancelIdleCallback(id);
    }
    fire();
  }, [dotCount, instanceId]);
}

/**
 * Closed-form critically-damped spring step response evaluated at normalized
 * progress t ∈ [0, 1]. Tuned (omega ≈ 8.94) so the spring reaches >99% of
 * target at t = 1. Critically damped means NO overshoot, smooth landing —
 * the perceptual feel the user named "Duolingo smooth" (slow start, fast
 * middle, soft settle).
 *
 * Replaces the prior cubic easeInOut, which had symmetric ease at both ends
 * and read as "two-stage" (decelerate, then re-accelerate, then decelerate
 * again) on long ROTATE/ZOOM transitions.
 */
export function springEase(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  // Underlying: y = 1 − e^(−ωt) (1 + ωt) for critically damped
  const omega = 5.8;
  return 1 - Math.exp(-omega * t) * (1 + omega * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Shortest-path angle interpolation (handles the ±180° seam).
function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + 540) % 360) - 180;
  return a + diff * t;
}

// Per-frame state equality used by the RAF tick to bail on identical
// updates. Quantizes the floats so micro-changes (≤ 0.005°) don't
// trigger a re-render — the user can't perceive them anyway.
export function statesEqual(a: NarrativeState, b: NarrativeState): boolean {
  return (
    a.phase === b.phase &&
    a.currentStopIndex === b.currentStopIndex &&
    a.characterPosition === b.characterPosition &&
    a.characterHidden === b.characterHidden &&
    Math.abs(a.rotationY - b.rotationY) < 0.005 &&
    Math.abs(a.tiltX - b.tiltX) < 0.005 &&
    Math.abs(a.zoom - b.zoom) < 0.0005
  );
}

interface NarrativeState {
  phase: NarrativePhase;
  currentStopIndex: number;
  rotationY: number;
  tiltX: number;
  zoom: number;
  characterPosition: CharacterPosition;
  characterHidden: boolean;
}

function getStateAtTime(
  scenes: Scene[],
  t: number,
  reducedMotion: boolean,
): NarrativeState {
  let elapsed = 0;
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]!;
    if (t < elapsed + scene.duration) {
      const sceneT = t - elapsed;
      const progress = sceneT / scene.duration;
      const eased = springEase(Math.min(1, Math.max(0, progress)));

      const prev = i === 0 ? scenes[scenes.length - 1]! : scenes[i - 1]!;

      const rotationY = reducedMotion
        ? scene.rotationY
        : lerpAngle(prev.rotationY, scene.rotationY, eased);
      const tiltX = reducedMotion
        ? scene.tiltX
        : lerp(prev.tiltX, scene.tiltX, eased);
      const zoom = reducedMotion ? scene.zoom : lerp(prev.zoom, scene.zoom, eased);

      // Character HARD-CUT logic. If position changes from prev to scene,
      // we hide for the first (CHAR_FADE_MS * 2) of the scene; position
      // changes at the midpoint of that window.
      const positionChanges = prev.characterPosition !== scene.characterPosition;
      let characterHidden = false;
      let characterPosition = scene.characterPosition;
      if (positionChanges) {
        if (sceneT < CHAR_FADE_MS) {
          characterHidden = true;
          characterPosition = prev.characterPosition;
        } else if (sceneT < CHAR_FADE_MS * 2) {
          characterHidden = true;
          characterPosition = scene.characterPosition;
        }
        // After 2× fade window: visible at new position.
      }

      return {
        phase: scene.phase,
        currentStopIndex: Math.max(0, scene.activeStopIndex),
        rotationY,
        tiltX,
        zoom,
        characterPosition,
        characterHidden,
      };
    }
    elapsed += scene.duration;
  }
  // Past end (when loop=false) — return last scene's stable state.
  const last = scenes[scenes.length - 1]!;
  return {
    phase: last.phase,
    currentStopIndex: Math.max(0, last.activeStopIndex),
    rotationY: last.rotationY,
    tiltX: last.tiltX,
    zoom: last.zoom,
    characterPosition: last.characterPosition,
    characterHidden: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useGlobeNarrative hook
// ─────────────────────────────────────────────────────────────────────────────

interface UseNarrativeOptions {
  loop: boolean;
  initialDelay: number;
  reducedMotion: boolean;
  onStopChange?: (stop: GlobeStop) => void;
}

function useGlobeNarrative(
  stops: GlobeStop[],
  enabled: boolean,
  opts: UseNarrativeOptions,
): { state: NarrativeState; controls: GlobeHandle } {
  const scenes = useMemo(() => buildScenes(stops), [stops]);
  const totalDuration = useMemo(
    () => scenes.reduce((sum, s) => sum + s.duration, 0),
    [scenes],
  );

  const initialState = useMemo<NarrativeState>(
    () => ({
      phase: "HERO",
      currentStopIndex: 0,
      rotationY: scenes[0]?.rotationY ?? 0,
      tiltX: 0,
      zoom: 1,
      characterPosition: "lower-right",
      characterHidden: false,
    }),
    [scenes],
  );

  const [state, setState] = useState<NarrativeState>(initialState);
  const [paused, setPaused] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const pauseElapsedRef = useRef(0);
  const overrideOffsetRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastStopIndexRef = useRef<number>(-1);

  // Latest-callback ref: avoids capturing a stale onStopChange when the
  // parent re-renders with a new function identity. The RAF effect doesn't
  // re-subscribe on opts.onStopChange changes (would cancel/restart the loop
  // on every parent render), so we read through the ref at call time.
  const onStopChangeRef = useRef(opts.onStopChange);
  useEffect(() => {
    onStopChangeRef.current = opts.onStopChange;
  }, [opts.onStopChange]);

  // Tick: read clock, compute scene time, derive state.
  useEffect(() => {
    if (!enabled) return;
    if (paused) return;

    const tick = (now: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = now - pauseElapsedRef.current;
      }
      let elapsed = now - startTimeRef.current - opts.initialDelay;
      if (elapsed < 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (overrideOffsetRef.current !== null) {
        elapsed += overrideOffsetRef.current;
      }
      let t = opts.loop
        ? elapsed % totalDuration
        : Math.min(elapsed, totalDuration);

      const next = getStateAtTime(scenes, t, opts.reducedMotion);
      // State-equality bail: skip the React re-render when nothing visually
      // changed since last frame. HERO scene holds rotationY/zoom/tiltX
      // constant, so this collapses 60 setState/sec down to ~1 (just the
      // initial transition). During ROTATE/ZOOM the values change every
      // frame so React still re-renders — but at least we no longer waste
      // reconciliation budget during stable phases.
      setState((prev) =>
        statesEqual(prev, next) ? prev : next,
      );

      // Fire onStopChange when entering a ZOOM scene's stop
      if (
        next.phase === "ZOOM" &&
        next.currentStopIndex !== lastStopIndexRef.current
      ) {
        lastStopIndexRef.current = next.currentStopIndex;
        const stop = stops[next.currentStopIndex];
        if (stop) onStopChangeRef.current?.(stop);
      } else if (next.phase !== "ZOOM") {
        lastStopIndexRef.current = -1;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      // Save where we paused so resume picks up.
      if (startTimeRef.current !== null) {
        pauseElapsedRef.current = performance.now() - startTimeRef.current;
      }
      startTimeRef.current = null;
    };
    // onStopChange is intentionally read via ref so a new callback identity
    // doesn't restart the RAF loop. See onStopChangeRef above.
  }, [enabled, paused, scenes, stops, totalDuration, opts.loop, opts.reducedMotion, opts.initialDelay]);

  const gotoStop = useCallback(
    (slug: string) => {
      const targetIndex = stops.findIndex((s) => s.citySlug === slug);
      if (targetIndex < 0) return;
      // Find the ZOOM scene for that stop in the schedule
      let offsetIntoSchedule = 0;
      for (const s of scenes) {
        if (s.phase === "ZOOM" && s.activeStopIndex === targetIndex) break;
        offsetIntoSchedule += s.duration;
      }
      // Set override so the next tick lands at that scene start.
      const now = performance.now();
      const elapsedSinceStart =
        startTimeRef.current === null
          ? 0
          : now - startTimeRef.current - opts.initialDelay;
      overrideOffsetRef.current = offsetIntoSchedule - elapsedSinceStart;
      // Also drive the visible state immediately.
      const next = getStateAtTime(scenes, offsetIntoSchedule, opts.reducedMotion);
      setState(next);
    },
    [scenes, stops, opts.initialDelay, opts.reducedMotion],
  );

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  return {
    state,
    controls: { gotoStop, pause, resume },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useReducedMotion — read the media query once at mount; no SSR mismatch.
// ─────────────────────────────────────────────────────────────────────────────

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);
  return reduced;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const Globe = forwardRef<GlobeHandle, GlobeProps>(function Globe(
  props,
  ref,
) {
  const {
    stops,
    headline,
    routeLine,
    variant = "narrative",
    size = "hero",
    onStopChange,
    onPinTap,
    showCharacter = true,
    loop = true,
    initialDelay = 0,
    className,
    ariaLabel,
  } = props;

  const reducedMotion = useReducedMotion();
  const reactId = useId();
  const clipId = `globe-clip-${reactId}`;

  // Static + minimap don't run the scheduler.
  const enabled = variant === "narrative" && stops.length > 0;
  const { state, controls } = useGlobeNarrative(stops, enabled, {
    loop,
    initialDelay,
    reducedMotion,
    onStopChange,
  });

  useImperativeHandle(ref, () => controls, [controls]);

  // Hover/touch pause for narrative variants
  const [hoverPaused, setHoverPaused] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    if (hoverPaused) controls.pause();
    else controls.resume();
  }, [hoverPaused, enabled, controls]);

  // Frozen state for static + minimap
  const heroState = useMemo<NarrativeState>(() => {
    const heroRotY = stops[0] ? cityFor(stops[0]).lng : 0;
    return {
      phase: "HERO",
      currentStopIndex: 0,
      rotationY: heroRotY,
      tiltX: 0,
      zoom: 1,
      characterPosition: "lower-right",
      characterHidden: false,
    };
  }, [stops]);

  const active = enabled ? state : heroState;

  // At deep zoom, pin the projection to the active city so the continent
  // stays framed even mid-tween. At hero / rotate, the camera state drives
  // the projection so the globe still reads as spinning.
  const focusCity =
    active.zoom > ZOOM_CENTERED_THRESHOLD &&
    active.currentStopIndex >= 0 &&
    stops[active.currentStopIndex]
      ? cityFor(stops[active.currentStopIndex]!)
      : null;

  const dots = useMemo<GlobeDot3D[]>(
    () => {
      const step = variant === "minimap" ? 6 : 3;
      if (focusCity) {
        return getDotGridCentered(focusCity, active.zoom, VIEWBOX, { step });
      }
      return getDotGrid(active.rotationY, active.zoom, VIEWBOX, {
        tiltX: active.tiltX,
        step,
      });
    },
    [focusCity, active.rotationY, active.zoom, active.tiltX, variant],
  );

  // Dev-only perf budget guard. No-op in production.
  usePerfBudgetGuard(dots.length, reactId);

  // Project pin positions — match the dot grid's projection mode so pins
  // and continents stay aligned at deep zoom.
  const pinProjections = useMemo(
    () =>
      stops.map((stop) => {
        const city = cityFor(stop);
        const p = focusCity
          ? project3DCentered(city.lat, city.lng, active.zoom, VIEWBOX, focusCity)
          : project3D(city.lat, city.lng, active.rotationY, active.zoom, VIEWBOX, {
              tiltX: active.tiltX,
            });
        return { stop, city, p };
      }),
    [stops, focusCity, active.rotationY, active.zoom, active.tiltX],
  );

  const containerSize = SIZE_PX[size] ?? SIZE_PX.md;
  const isHero = size === "hero";
  const isMinimap = variant === "minimap";

  const composition = (
    <div
      data-globe=""
      data-globe-variant={variant}
      data-globe-size={size}
      data-globe-size-px={containerSize}
      data-globe-phase={active.phase}
      data-globe-active-stop={
        active.currentStopIndex >= 0 && stops[active.currentStopIndex]
          ? stops[active.currentStopIndex]!.citySlug
          : undefined
      }
      data-reduced-motion={reducedMotion ? "true" : "false"}
      className={cn(
        "relative inline-flex flex-col items-center max-w-full",
        className,
      )}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      onMouseEnter={enabled ? () => setHoverPaused(true) : undefined}
      onMouseLeave={enabled ? () => setHoverPaused(false) : undefined}
      onTouchStart={enabled ? () => setHoverPaused(true) : undefined}
      onTouchEnd={enabled ? () => setHoverPaused(false) : undefined}
    >
      {/* Top text band: HERO=headline, ZOOM=city name big.
          overflow-hidden + max-w-full clips the dotted headline on viewports
          narrower than the rendered SVG (e.g. 375px mobile) — prevents the
          headline from forcing a horizontal scroll on the host page. */}
      {!isMinimap && (
        <div
          data-globe-top-band=""
          className="flex items-center justify-center mb-2 max-w-full overflow-hidden"
          style={{ minHeight: isHero ? 56 : 28 }}
        >
          {active.phase === "ZOOM" && stops[active.currentStopIndex] ? (
            <DottedText
              text={cityFor(stops[active.currentStopIndex]!).name}
              size="headline"
              color="var(--color-ink)"
              ariaLabel={`Active city: ${cityFor(stops[active.currentStopIndex]!).name}`}
            />
          ) : headline ? (
            <DottedText
              text={headline}
              size={isHero ? "headline" : "label"}
              color="var(--color-ink)"
              ariaLabel={headline}
            />
          ) : null}
        </div>
      )}

      {/* Globe SVG */}
      <div
        className="relative"
        style={{ width: containerSize, height: containerSize }}
      >
        <svg
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          // willChange + transform: translateZ(0) hint promotes the SVG to
          // its own GPU compositing layer so the per-frame React renders
          // during ROTATE/ZOOM tweens don't trigger full-document repaints
          // — the browser composites the layer instead. Cheap, no-cost when
          // not animating.
          style={{
            display: "block",
            willChange: variant === "narrative" ? "transform" : undefined,
            transform: variant === "narrative" ? "translateZ(0)" : undefined,
          }}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={VIEWBOX} height={VIEWBOX} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            {/* Continent dots — mixed glyphs (small circle, large circle,
                asterisk, plus). Asterisks + pluses render at higher opacity
                to read as accents in the halftone field. */}
            {dots.map((d, i) =>
              renderContinentGlyph(d, i, isMinimap),
            )}

            {/* Pins */}
            {pinProjections.map(({ stop, p }, i) => {
              if (!p.visible) return null;
              const isActive =
                active.currentStopIndex === i && active.phase !== "HERO";
              return (
                <g key={stop.id} data-pin="" data-pin-active={isActive ? "true" : "false"}>
                  <rect
                    x={p.x - (isActive ? 3 : 2)}
                    y={p.y - (isActive ? 3 : 2)}
                    width={isActive ? 6 : 4}
                    height={isActive ? 6 : 4}
                    fill={stop.pinColor ?? "var(--color-cta)"}
                    fillOpacity={isActive ? 1 : active.phase === "HERO" ? 0.85 : 0.4}
                  />
                  {/* Hit area — keyboard-focusable so pin can be activated
                      with Enter/Space, not just mouse/touch. */}
                  {onPinTap && (
                    <rect
                      data-pin-hitbox=""
                      x={p.x - 10}
                      y={p.y - 10}
                      width={20}
                      height={20}
                      fill="transparent"
                      onClick={() => onPinTap(stop.citySlug)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onPinTap(stop.citySlug);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      style={{ cursor: "pointer" }}
                      aria-label={`Pin: ${cityFor(stop).name}`}
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Pin labels (cassettes) overlaid in HERO state */}
        {!isMinimap && active.phase === "HERO" &&
          pinProjections.map(({ stop, city, p }, i) => {
            if (!p.visible) return null;
            const slugUpper = city.labelShort;
            const isActive = i === 0; // first stop is the "ACTIVE" cassette in hero
            return (
              <div
                key={stop.id}
                data-pin-label=""
                data-pin-label-text={slugUpper}
                style={{
                  position: "absolute",
                  left: `${(p.x / VIEWBOX) * 100}%`,
                  top: `${(p.y / VIEWBOX) * 100}%`,
                  transform: "translate(8px, -50%)",
                  pointerEvents: "none",
                  opacity: isActive ? 1 : 0.55,
                }}
              >
                {isActive ? (
                  <Cassette
                    contentWidth={dottedWidthPx(slugUpper, 2)}
                    contentHeight={7 * 2}
                    variant="pin-label"
                    dotSize={1.5}
                    fill={stop.pinColor ?? "var(--color-cta)"}
                  >
                    <DottedText text={slugUpper} dotSize={2} color="var(--color-ink)" />
                  </Cassette>
                ) : (
                  <DottedText text={slugUpper} dotSize={1.5} color="var(--color-pen)" />
                )}
              </div>
            );
          })}

        {/* Character — absolute positioned per state */}
        {showCharacter && !isMinimap && (
          <div
            data-character-slot=""
            data-character-slot-position={active.characterPosition}
            style={absolutePositionFor(active.characterPosition)}
          >
            <PixelCharacter
              position={active.characterPosition}
              hidden={active.characterHidden}
              cell={isHero ? 3 : 2}
            />
          </div>
        )}
      </div>

      {/* Bottom band: HERO=route, ZOOM=date cassette */}
      {!isMinimap && (
        <div
          data-globe-bottom-band=""
          className="flex items-center justify-center mt-3 max-w-full overflow-hidden"
          style={{ minHeight: isHero ? 32 : 16 }}
        >
          {active.phase === "ZOOM" && stops[active.currentStopIndex]?.date ? (
            <Cassette
              contentWidth={dottedWidthPx(stops[active.currentStopIndex]!.date!, 2)}
              contentHeight={7 * 2}
              variant="date-cassette"
              dotSize={2}
              fill={stops[active.currentStopIndex]!.pinColor ?? "var(--color-cta)"}
            >
              <DottedText
                text={stops[active.currentStopIndex]!.date!}
                dotSize={2}
                color="var(--color-ink)"
              />
            </Cassette>
          ) : routeLine ? (
            <DottedText text={routeLine} size="route" color="var(--color-pen)" />
          ) : stops.length >= 2 ? (
            <DottedText
              text={defaultRouteLine(stops)}
              size="route"
              color="var(--color-pen)"
            />
          ) : null}
        </div>
      )}
    </div>
  );

  return composition;
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders a single continent glyph based on its `glyph` kind. Small + large
 * dots become <circle>; asterisks + pluses become a <g> of 5 small <rect>s
 * laid out per ASTERISK_GLYPH / PLUS_GLYPH. Accents at boosted opacity so
 * they register as printed-halftone texture, not just bigger dots.
 */
function renderContinentGlyph(
  d: GlobeDot3D,
  key: number,
  isMinimap: boolean,
): React.ReactNode {
  const minimapShrink = isMinimap ? 0.75 : 1;
  if (d.glyph === "asterisk" || d.glyph === "plus") {
    const offsets = d.glyph === "asterisk" ? ASTERISK_GLYPH : PLUS_GLYPH;
    const cell = ACCENT_SUBCELL * minimapShrink;
    return (
      <g
        key={key}
        data-continent-dot=""
        data-glyph={d.glyph}
        opacity={Math.min(1, d.opacity * ACCENT_OPACITY_MULT)}
      >
        {offsets.map(([dx, dy], i) => (
          <rect
            key={i}
            x={d.x + dx * cell - cell / 2}
            y={d.y + dy * cell - cell / 2}
            width={cell}
            height={cell}
            fill="var(--color-pen)"
          />
        ))}
      </g>
    );
  }
  // Per-glyph radius lookup. Ocean dots are tiny + low-opacity (they add
  // printed-paper texture, never compete with continents).
  let r: number;
  switch (d.glyph) {
    case "dot-large":
      r = DOT_LARGE_R;
      break;
    case "dot-medium":
      r = DOT_MEDIUM_R;
      break;
    case "ocean-dot":
      r = OCEAN_DOT_R;
      break;
    default:
      r = DOT_R;
  }
  return (
    <circle
      key={key}
      data-continent-dot=""
      data-glyph={d.glyph}
      cx={d.x}
      cy={d.y}
      r={r * minimapShrink}
      fill="var(--color-pen)"
      fillOpacity={d.opacity}
    />
  );
}

/** SVG-pixel width of `text` rendered in DottedText at the given dotSize. */
function dottedWidthPx(text: string, dot: number): number {
  return textWidth(text) * dot;
}

function defaultRouteLine(stops: GlobeStop[]): string {
  return stops.map((s) => cityFor(s).labelShort).join(" → ");
}

function absolutePositionFor(pos: CharacterPosition): React.CSSProperties {
  const common: React.CSSProperties = { position: "absolute" };
  switch (pos) {
    case "lower-left":
      return { ...common, left: 4, bottom: 4 };
    case "lower-right":
      return { ...common, right: 4, bottom: 4 };
    case "upper-right":
      return { ...common, right: 4, top: 4 };
  }
}

function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Exposed for tests
// ─────────────────────────────────────────────────────────────────────────────

export const __testing = {
  buildScenes,
  getStateAtTime,
  TIMINGS,
  ZOOM_SCALE,
  CHAR_FADE_MS,
};
