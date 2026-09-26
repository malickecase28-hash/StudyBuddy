import { deriveState, emptyProgress, overallMastery, type ConceptState, type LearnerState } from "@forma/engine";
import { course } from "./course";

export const STATE_GLYPH: Record<ConceptState, { glyph: string; label: string }> = {
  NOT_STARTED: { glyph: "○", label: "Not started" },
  INTRODUCED: { glyph: "◔", label: "Introduced" },
  EXPLORED: { glyph: "◑", label: "Explored" },
  PRACTICED: { glyph: "◕", label: "Practised" },
  DEMONSTRATED: { glyph: "●", label: "Demonstrated" },
  MASTERED: { glyph: "✓", label: "Mastered" },
};

export function conceptProgress(learner: LearnerState, conceptId: string) {
  const p = learner.concepts[conceptId] ?? emptyProgress();
  return { progress: p, state: deriveState(p.dimensions, p.seen), mastery: overallMastery(p.dimensions) };
}

/** Mean mastery over the slice's unlocked concepts. */
export function courseMastery(learner: LearnerState): number {
  const open = course.concepts.filter((c) => !c.locked);
  return open.reduce((s, c) => s + conceptProgress(learner, c.id).mastery, 0) / open.length;
}

export const pct = (x: number) => `${Math.round(x * 100)}%`;
