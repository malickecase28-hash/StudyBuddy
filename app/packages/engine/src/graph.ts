import type { LearnerState } from "./learner-state";
import { overallMastery } from "./mastery";
import type { Course } from "./schema/course";

export function topoOrder(course: Course): string[] {
  const byId = new Map(course.concepts.map((c) => [c.id, c]));
  const out: string[] = [];
  const mark = new Map<string, "visiting" | "done">();
  const visit = (id: string, path: string[]) => {
    const m = mark.get(id);
    if (m === "done") return;
    if (m === "visiting") throw new Error(`cycle: ${[...path, id].join(" -> ")}`);
    mark.set(id, "visiting");
    for (const p of byId.get(id)?.prerequisites ?? []) if (byId.has(p.conceptId)) visit(p.conceptId, [...path, id]);
    mark.set(id, "done");
    out.push(id);
  };
  for (const c of course.concepts) visit(c.id, []);
  return out;
}

export function unmetPrerequisites(course: Course, conceptId: string, state: LearnerState) {
  const concept = course.concepts.find((c) => c.id === conceptId);
  if (!concept) throw new Error(`Unknown concept: ${conceptId}`);
  return concept.prerequisites
    .map((p) => {
      const prog = state.concepts[p.conceptId];
      return { conceptId: p.conceptId, minMastery: p.minMastery, current: prog ? overallMastery(prog.dimensions) : 0 };
    })
    .filter((p) => p.current < p.minMastery);
}
