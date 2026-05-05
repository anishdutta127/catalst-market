/**
 * SectionCaption — single dotted-text section heading used across every
 * Editorial Console module.
 *
 * Phase 7b consolidation: every module previously emitted its own
 * `<h2 className="text-label uppercase tracking-wider text-pen mb-3">`
 * for its caption ("Today's build angles", "Business of the week",
 * "Quiet movers — stories you might've missed", etc). They now route
 * through this primitive so the dotted-pixel vocabulary is applied in
 * exactly one place.
 *
 * Contract:
 *   - Renders an <h2> for accessibility (modules `aria-labelledby` it).
 *   - Caption renders as DottedText at dotSize 1.5 in --color-pen.
 *   - Caller passes a stable `id` so `aria-labelledby` can resolve.
 *   - Bottom margin (mb-3) is owned by this component, NOT the parent
 *     section, so module spacing stays uniform.
 *
 * No CSS classes from outside — the caption visual is locked to the
 * playbook in design-system/PIXEL-AESTHETIC.md.
 */

import { DottedText } from "@/components/brand/DottedText";

export interface SectionCaptionProps {
  /** Stable DOM id — the parent section uses `aria-labelledby={id}`. */
  id: string;
  /** Caption copy — uppercased automatically by DottedText. */
  text: string;
}

export function SectionCaption({ id, text }: SectionCaptionProps) {
  return (
    <h2
      id={id}
      data-section-caption=""
      data-section-caption-text={text}
      className="mb-3 leading-none"
    >
      <DottedText
        text={text}
        dotSize={1.5}
        color="var(--color-pen)"
        ariaLabel={text}
      />
    </h2>
  );
}
