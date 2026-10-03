import { assessmentsForItem, bankLabel, bankNumber, course, diagnostic, formulaSheet, foundations, ideaPlates, questionBank } from "@forma/course-em1";
import { topoOrder, type Concept, type Course, type Lesson } from "@forma/engine";

export { assessmentsForItem, bankLabel, bankNumber, course, diagnostic, formulaSheet, foundations, questionBank };
export { templatesFor } from "@forma/course-em1";

/** Every course, prerequisite first. `course` stays the EMag course the Desk, map and assessments are built around. */
export const courses: Course[] = [foundations, course];
export const getCourse = (id: string): Course | undefined => courses.find((k) => k.id === id);
/** The course a concept belongs to (EMag when unknown). */
export const courseOf = (conceptId: string): Course => courses.find((k) => k.concepts.some((c) => c.id === conceptId)) ?? course;

export const conceptById = new Map(courses.flatMap((k) => k.concepts).map((c) => [c.id, c]));
export const examDateMs = Date.parse(`${course.examDate}T09:00:00-05:00`);
/** Concepts in prerequisite order (locked ones last). */
export const conceptOrder = topoOrder(course).sort(
  (a, b) => Number(conceptById.get(a)!.locked) - Number(conceptById.get(b)!.locked),
);
/** Foundation concepts in prerequisite order. */
export const foundationsOrder = topoOrder(foundations);

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

export const isPlateLesson = (l: Lesson) => l.blocks.length > 0 && l.blocks.every((b) => b.type === "plate");

export const conceptHref = (conceptId: string, mode = "learn", query: Record<string, string> = {}) =>
  `/c/${courseOf(conceptId).id}/${encodeURIComponent(conceptId)}?${new URLSearchParams({ mode, ...query }).toString()}`;

/** Plate lessons live in the concept workspace; classic block lessons keep their v1 route. */
export function lessonHref(conceptId: string, lessonId: string, extra = "") {
  const lesson = getLesson(conceptId, lessonId);
  if (lesson && isPlateLesson(lesson)) {
    const base = conceptHref(conceptId, "learn", { lesson: lessonId });
    return extra ? `${base}&${extra.replace(/^\?/, "")}` : base;
  }
  return `/learn/${encodeURIComponent(conceptId)}/${encodeURIComponent(lessonId)}${extra}`;
}

export const lessonForPlate = (conceptId: string, plateId: string) =>
  getConcept(conceptId)?.lessons.find((l) => l.blocks.some((b) => b.type === "plate" && b.plateId === plateId))?.id;

/** The concept's primary lesson (first one); remediation lessons follow it. */
export const mainLesson = (c: Concept) => c.lessons[0];

/** Next unlocked concept after `conceptId` in study order. */
export function nextConcept(conceptId: string): Concept | undefined {
  const order = courseOf(conceptId).id === course.id ? conceptOrder : foundationsOrder;
  const i = order.indexOf(conceptId);
  return order
    .slice(i + 1)
    .map((id) => conceptById.get(id)!)
    .find((c) => !c.locked);
}

/** Lessons that are detours (remediation targets) rather than the main path. */
export function isDetour(conceptId: string, lessonId: string): boolean {
  const ref = `${conceptId}/${lessonId}`;
  return courses.some((k) => k.concepts.some((c) => c.misconceptions.some((m) => m.remediation === ref)));
}

export const misconceptionInfo = new Map(
  courses.flatMap((k) => k.concepts).flatMap((c) => c.misconceptions.map((m) => [m.tag, m] as const)),
);

/** Misconception description as worded by the concept where it fired (falls back to any concept). */
export function misconceptionFor(conceptId: string, tag: string) {
  return conceptById.get(conceptId)?.misconceptions.find((m) => m.tag === tag) ?? misconceptionInfo.get(tag);
}

/** Refresher concepts the diagnostic showed are already solid (every topic mapping to them was "ready"). */
export function diagnosticSolid(results: Record<string, string> | undefined): Set<string> {
  const solid = new Set<string>();
  if (!results) return solid;
  const byRefresher = new Map<string, string[]>();
  for (const t of diagnostic.topics) if (t.refresher) byRefresher.set(t.refresher, [...(byRefresher.get(t.refresher) ?? []), t.id]);
  for (const [refresher, topics] of byRefresher) if (topics.every((t) => results[t] === "ready")) solid.add(refresher);
  return solid;
}

/** The idea index for a plate authored with defineIdeaPlate, if any. */
export const ideaMetaFor = (plateId: string) => ideaPlates[plateId]?.meta;
