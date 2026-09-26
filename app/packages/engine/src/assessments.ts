import { DAY_MS } from "./scheduler";
import type { Assessment } from "./schema/course";

const HOUR = 3_600_000;

/** A sitting starts 09:00 Jamaica time (UTC−5, no daylight saving). */
export const assessmentTime = (a: Pick<Assessment, "date">) => Date.parse(`${a.date}T09:00:00-05:00`);

/** Until the end of the sitting's day (midnight Jamaica time). */
const endOfDay = (a: Pick<Assessment, "date">) => assessmentTime(a) + 15 * HOUR;

/** The first assessment still ahead (its day not over), optionally only those whose scope has the concept. */
export function nextAssessment(course: { assessments: Assessment[] }, now: number, conceptId?: string): Assessment | undefined {
  return [...course.assessments]
    .filter((a) => !conceptId || a.scope.concepts.includes(conceptId))
    .sort((a, b) => assessmentTime(a) - assessmentTime(b))
    .find((a) => endOfDay(a) > now);
}

/** Whole days to the sitting; 0 on the day itself. */
export function daysUntil(a: Pick<Assessment, "date">, now: number): number {
  const startOfDay = assessmentTime(a) - 9 * HOUR;
  return Math.max(0, Math.ceil((startOfDay - now) / DAY_MS));
}
