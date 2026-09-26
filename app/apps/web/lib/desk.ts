import { plates } from "@forma/course-em1";
import type { LearnerState } from "@forma/engine";
import { conceptHref, conceptOrder, getConcept, getLesson, isPlateLesson, lessonHref } from "./course";

export type DeskContinue = { href: string; title: string; sub: string; plate?: { plateId: string; step: number } };

/** Where "Continue" goes and what the thumbnail shows. Always a real route. */
export function deskContinue(learner: LearnerState): DeskContinue {
  if (!learner.diagnostic && learner.history.length === 0) return { href: "/diagnostic", title: "Start with a 5-minute readiness check", sub: "It builds your route through the course." };
  const pos = learner.position;
  const concept = pos ? getConcept(pos.conceptId) : undefined;
  const lesson = pos && concept ? getLesson(pos.conceptId, pos.lessonId) : undefined;
  if (pos && concept && lesson) {
    const block = lesson.blocks.find((b) => b.id === pos.blockId);
    if (isPlateLesson(lesson) && block?.type === "plate" && plates[block.plateId]) {
      const plate = plates[block.plateId]!;
      const step = Math.max(0, Math.min(pos.plateStep ?? 0, plate.steps.length - 1));
      return {
        href: conceptHref(concept.id, "learn", { lesson: lesson.id, block: block.id, step: String(step) }),
        title: plate.steps[step]!.title,
        sub: `${concept.title} · ${plate.title} · step ${step + 1} of ${plate.steps.length}`,
        plate: { plateId: plate.id, step },
      };
    }
    if (!isPlateLesson(lesson)) return { href: lessonHref(concept.id, lesson.id), title: lesson.title, sub: `${concept.title} · classic lesson` };
  }
  const fallback = concept ?? getConcept(conceptOrder.find((id) => !getConcept(id)!.locked)!)!;
  return { href: conceptHref(fallback.id, "learn"), title: fallback.title, sub: "Pick up where the course continues." };
}
