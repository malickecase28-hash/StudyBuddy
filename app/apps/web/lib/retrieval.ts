import { walkBlocks, type Block, type Dimension, type LearnerState, type McqBlock } from "@studybuddy/engine";
import { course } from "./course";

export type RetrievalItem = { conceptId: string; dimension: Dimension; block: McqBlock };

/** Every mcq in the course, grouped by concept: the pool for retrieval practice. */
const pool: RetrievalItem[] = course.concepts.flatMap((c) => {
  const out: RetrievalItem[] = [];
  for (const l of c.lessons) {
    walkBlocks(l.blocks, (b: Block) => {
      // Context-free questions only: skip multi-part exam items ("Part (ii)…").
      if (b.type === "mcq" && !b.selfExplain && !/^Part/.test(b.prompt)) out.push({ conceptId: c.id, dimension: b.dimension, block: b });
    });
  }
  return out;
});

/**
 * Pick retrieval questions: concepts with reviews due first (most overdue first), then the
 * most recently studied concepts. Deterministic, so the same state gives the same questions.
 */
export function pickRetrieval(learner: LearnerState, now: number, count: number): RetrievalItem[] {
  const due = Object.entries(learner.concepts)
    .flatMap(([conceptId, p]) =>
      Object.entries(p.review)
        .filter(([, r]) => r && r.due <= now)
        .map(([dimension, r]) => ({ conceptId, dimension: dimension as Dimension, due: r!.due })),
    )
    .sort((a, b) => a.due - b.due);
  const recent = Object.entries(learner.concepts)
    .filter(([, p]) => p.seen && p.lastSeen)
    .sort((a, b) => (b[1].lastSeen ?? 0) - (a[1].lastSeen ?? 0))
    .map(([conceptId]) => conceptId);

  const chosen: RetrievalItem[] = [];
  const take = (conceptId: string, dimension?: Dimension) => {
    const candidates = pool.filter((i) => i.conceptId === conceptId && !chosen.includes(i));
    const item = candidates.find((i) => i.dimension === dimension) ?? candidates[0];
    if (item) chosen.push(item);
  };
  for (const d of due) if (chosen.length < count) take(d.conceptId, d.dimension);
  for (const c of recent) if (chosen.length < count) take(c);
  return chosen;
}

export function dueCount(learner: LearnerState, now: number): number {
  return Object.values(learner.concepts).reduce((n, p) => n + Object.values(p.review).filter((r) => r && r.due <= now).length, 0);
}
