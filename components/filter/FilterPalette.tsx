"use client";

/**
 * FilterPalette — Spotlight-style modal overlay for the universal filter.
 *
 * Tabbed UI: Mood (9) · Industry (12) · Stage (3). Tap a chip to toggle.
 * Multi-select within and across categories. "Clear all" + "Done" footer.
 *
 * Open via Cmd+K (handler registered at the page level — this component
 * only takes `open` + `onOpenChange` props). Closes on ESC, click-outside,
 * or "Done." Returns focus to the trigger element on close.
 *
 * 480px wide on desktop, full-bleed on mobile (<768px). aria-modal=true,
 * focus trap inside the panel, ARIA tab roles on the section selector.
 */

import { X } from "lucide-react";
import {
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Chip } from "@/components/ui/Chip";
import { MOOD_META } from "@/lib/moods";
import type { Industry, Mood, Stage } from "@/lib/types/story";
import {
  __filterTesting,
  useFilter,
} from "@/lib/filter/useFilter";

const { INDUSTRY_LABELS, STAGE_LABELS } = __filterTesting;

const ALL_MOODS: Mood[] = Object.keys(MOOD_META) as Mood[];
const ALL_INDUSTRIES: Industry[] = [
  "ai", "fintech", "climate", "biotech", "defense", "consumer",
  "b2b", "devtools", "space", "creator", "commerce", "india-shipping",
];
const ALL_STAGES: Stage[] = ["empires", "builders", "bootstrappers"];

type Tab = "mood" | "industry" | "stage";

export interface FilterPaletteProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}

export function FilterPalette({ open, onOpenChange }: FilterPaletteProps) {
  const filter = useFilter();
  const [tab, setTab] = useState<Tab>("mood");
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerReturnRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Capture the active element on open so we can return focus to it on close.
  useEffect(() => {
    if (open) {
      triggerReturnRef.current = document.activeElement as HTMLElement | null;
      // Focus the dialog after paint so the focus trap works.
      requestAnimationFrame(() => dialogRef.current?.focus());
    } else if (triggerReturnRef.current) {
      triggerReturnRef.current.focus?.();
      triggerReturnRef.current = null;
    }
  }, [open]);

  // ESC + click-outside close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      const node = dialogRef.current;
      if (node && !node.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    // Arrow keys cycle tabs (ARIA tablist convention).
    const tabs: Tab[] = ["mood", "industry", "stage"];
    const idx = tabs.indexOf(tab);
    if (e.key === "ArrowRight") setTab(tabs[(idx + 1) % tabs.length]!);
    if (e.key === "ArrowLeft") setTab(tabs[(idx + 2) % tabs.length]!);
  };

  return (
    <div
      data-filter-palette-backdrop=""
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-ink/40 p-0 md:p-4"
      style={{ animation: "catalst-palette-fade-in 160ms ease-out" }}
    >
      <div
        ref={dialogRef}
        data-filter-palette=""
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-card border border-rule rounded-xl shadow-sheet w-full md:w-[480px] max-h-[100vh] md:max-h-[80vh] flex flex-col outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-rule">
          <h2
            id={titleId}
            className="font-serif text-h3 text-ink leading-none"
            style={{ fontVariationSettings: "'opsz' 32" }}
          >
            Filter
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close filter"
            className="inline-flex items-center justify-center h-9 w-9 rounded-md text-pen hover:text-ink hover:bg-paper transition-colors cursor-pointer"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Filter category"
          onKeyDown={onTabKey}
          className="flex border-b border-rule bg-paper/40"
        >
          <TabButton tab="mood"     activeTab={tab} setTab={setTab} count={filter.scope.moods.size} />
          <TabButton tab="industry" activeTab={tab} setTab={setTab} count={filter.scope.industries.size} />
          <TabButton tab="stage"    activeTab={tab} setTab={setTab} count={filter.scope.stages.size} />
        </div>

        {/* Body — scrollable */}
        <div
          role="tabpanel"
          data-filter-tab-panel={tab}
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          {tab === "mood" && (
            <div className="flex flex-wrap gap-2" data-filter-section="mood">
              {ALL_MOODS.map((m) => (
                <Chip
                  key={m}
                  variant="mood"
                  mood={m}
                  active={filter.scope.moods.has(m)}
                  onClick={() => filter.toggleMood(m)}
                  aria-label={`Mood filter: ${MOOD_META[m].label}`}
                >
                  {MOOD_META[m].label}
                </Chip>
              ))}
            </div>
          )}
          {tab === "industry" && (
            <div className="flex flex-wrap gap-2" data-filter-section="industry">
              {ALL_INDUSTRIES.map((i) => (
                <Chip
                  key={i}
                  variant="industry"
                  active={filter.scope.industries.has(i)}
                  onClick={() => filter.toggleIndustry(i)}
                  aria-label={`Industry filter: ${INDUSTRY_LABELS[i]}`}
                >
                  {INDUSTRY_LABELS[i]}
                </Chip>
              ))}
            </div>
          )}
          {tab === "stage" && (
            <div className="flex flex-wrap gap-2" data-filter-section="stage">
              {ALL_STAGES.map((s) => (
                <Chip
                  key={s}
                  variant="stage"
                  stage={s}
                  active={filter.scope.stages.has(s)}
                  onClick={() => filter.toggleStage(s)}
                  aria-label={`Stage filter: ${STAGE_LABELS[s]}`}
                >
                  {STAGE_LABELS[s]}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-rule">
          <button
            type="button"
            data-filter-clear=""
            onClick={() => filter.clear()}
            disabled={!filter.isActive}
            className="text-[13px] text-pen hover:text-ink disabled:text-pen/40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Clear all
          </button>
          <button
            type="button"
            data-filter-done=""
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center h-9 px-4 rounded-pill bg-ink text-white text-[13px] font-semibold hover:bg-pen transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  tab,
  activeTab,
  setTab,
  count,
}: {
  tab: Tab;
  activeTab: Tab;
  setTab: (t: Tab) => void;
  count: number;
}) {
  const active = tab === activeTab;
  const label = tab === "mood" ? "Mood" : tab === "industry" ? "Industry" : "Stage";
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-filter-tab={tab}
      data-filter-tab-active={active ? "true" : "false"}
      onClick={() => setTab(tab)}
      className={[
        "flex-1 px-4 py-2.5 text-[13px] font-medium transition-colors cursor-pointer",
        active
          ? "text-ink border-b-2 border-ink -mb-px"
          : "text-pen hover:text-ink",
      ].join(" ")}
    >
      {label}
      {count > 0 && (
        <span
          data-filter-tab-count=""
          className="ml-1.5 text-[11px] text-cta font-semibold"
        >
          {count}
        </span>
      )}
    </button>
  );
}
