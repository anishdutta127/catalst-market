# Deferred Work — Catalst Market

> Acknowledged issues that have been seen, scoped, and explicitly deferred.
> NOT bugs (those go in issues). These are conscious tradeoffs the team is
> carrying with intent.

---

## Globe — animation smoothness (commit `8050cb0`)

**Status.** Polish pass landed but the rotation between scripted stops still
reads slightly stuttery to the user's eye. The refs+RAF + spring migration
improved it but didn't fully match the Duolingo standard.

**User direction.** "It's fine for now — eventually I want the globe to rotate
freely as the user drags it, not just scripted checkpoints."

**Implication.** The scripted narrative state machine becomes secondary to
user-controlled drag rotation. Stutter on auto-rotation is less critical
because it'll only run when no user is interacting.

**Next pass scope.** Add drag-to-rotate gesture handling. Pointer events +
inertial scroll. Auto-narrative pauses on user interaction, resumes after N
seconds idle. **This becomes a Phase 6e feature, after the home feed ships.**

---

## Globe — fidelity vs Anthropic reference (commit `8050cb0`)

**Status.** 4-size glyph mix + coastal accents + ocean texture shipped. Some
interior continent regions may still read sparser than the *Code w/ Claude*
reference.

**User direction.** Acceptable for now alongside the item above.

**Next pass scope.** Re-evaluate after Phase 6c lands and globe is composed
in real product surface, not isolated `/primitives` demo. Real composition
often reveals different tradeoffs than isolated review.

---

## Conventions

When closing an item from this file:
1. Update its **Status** line to `RESOLVED in commit <sha>` and keep the body.
2. Move the resolved entry to a `## Resolved` section at the bottom (don't
   delete — the history of acknowledged tradeoffs is part of the design record).
3. Mention the resolution in the closing commit's body.

When adding a new item:
1. Cite the originating commit SHA so future readers can find the change that
   exposed the tradeoff.
2. Capture the **User direction** verbatim where possible — it's the load-bearing
   bit (this file documents conscious tradeoffs, not unilateral cuts).
3. State the **Next pass scope** concretely — what would need to be done to
   close it, when (which phase), and why it isn't this phase.
