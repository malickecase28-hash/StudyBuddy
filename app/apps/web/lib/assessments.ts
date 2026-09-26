import { assessmentTime, daysUntil, nextAssessment, type LearnerState } from "@forma/engine";
import { course } from "./course";
import { conceptProgress } from "./progress";

/** "ICT 1 in 16 days" / "ICT 1 today" / "" when nothing is ahead. */
export function countdownText(now: number, conceptId?: string): string {
  const a = nextAssessment(course, now, conceptId);
  if (!a) return "";
  const d = daysUntil(a, now);
  return d === 0 ? `${a.short} today` : `${a.short} in ${d} day${d === 1 ? "" : "s"}`;
}

/** The date reviews for this concept should compress toward: its next in-scope sitting. */
export const reviewDateFor = (conceptId: string, now: number): number | undefined => {
  const a = nextAssessment(course, now, conceptId);
  return a ? assessmentTime(a) : undefined;
};

/** Unlocked in-scope concepts at Demonstrated or better. */
export function readiness(learner: LearnerState, assessmentId: string) {
  const a = course.assessments.find((x) => x.id === assessmentId);
  const open = (a?.scope.concepts ?? []).filter((id) => !course.concepts.find((c) => c.id === id)?.locked);
  const ready = open.filter((id) => ["DEMONSTRATED", "MASTERED"].includes(conceptProgress(learner, id).state)).length;
  return { ready, total: open.length };
}
