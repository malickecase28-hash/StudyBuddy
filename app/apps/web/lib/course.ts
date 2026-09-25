import { course, diagnostic, formulaSheet, pastPapers } from "@studybuddy/course-em1";
import { topoOrder, type Concept, type Lesson } from "@studybuddy/engine";

export { course, diagnostic, formulaSheet, pastPapers };

export const conceptById = new Map(course.concepts.map((c) => [c.id, c]));
export const examDateMs = Date.parse(`${course.examDate}T09:00:00-05:00`);
/** Concepts in prerequisite order (locked ones last). */
export const conceptOrder = topoOrder(course).sort(
  (a, b) => Number(conceptById.get(a)!.locked) - Number(conceptById.get(b)!.locked),
);

export function getConcept(id: string): Concept | undefined {
  return conceptById.get(id);
}

export function getLesson(conceptId: string, lessonId: string): Lesson | undefined {
  return conceptById.get(conceptId)?.lessons.find((l) => l.id === lessonId);
}

/** "conceptId/lessonId" → both parts. */
export function splitRef(ref: string): { conceptId: string; lessonId: string } {
  const [conceptId = "", lessonId = ""] = ref.split("/");
  return { conceptId, lessonId };
}

export const lessonHref = (conceptId: string, lessonId: string, extra = "") =>
  `/learn/${encodeURIComponent(conceptId)}/${encodeURIComponent(lessonId)}${extra}`;

/** The concept's primary lesson (first one); remediation lessons follow it. */
export const mainLesson = (c: Concept) => c.lessons[0];

/** Next unlocked concept after `conceptId` in study order. */
export function nextConcept(conceptId: string): Concept | undefined {
  const i = conceptOrder.indexOf(conceptId);
  return conceptOrder
    .slice(i + 1)
    .map((id) => conceptById.get(id)!)
    .find((c) => !c.locked);
}

/** Lessons that are detours (remediation targets) rather than the main path. */
export function isDetour(conceptId: string, lessonId: string): boolean {
  const ref = `${conceptId}/${lessonId}`;
  return course.concepts.some((c) => c.misconceptions.some((m) => m.remediation === ref));
}

export const misconceptionInfo = new Map(
  course.concepts.flatMap((c) => c.misconceptions.map((m) => [m.tag, m] as const)),
);
