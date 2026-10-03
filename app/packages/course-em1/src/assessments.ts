import type { Concept } from "@forma/engine";

const EXAM = "2026-12-15";

/** The course's two in-course tests and its final exam. */
export function assessmentsFor(concepts: Pick<Concept, "id" | "unit">[]) {
  const unit = (...n: number[]) => concepts.filter((c) => n.includes(c.unit)).map((c) => c.id);
  return [
    { id: "ict1", title: "Test 1", short: "Test 1", date: "2026-10-12", weight: 15, scope: { concepts: [...unit(1), ...unit(2), "em1.magnetostatics.ampere"] } },
    { id: "ict2", title: "Test 2", short: "Test 2", date: "2026-11-16", weight: 15, scope: { concepts: unit(3, 4) } },
    { id: "finals", title: "Final exam", short: "Final exam", date: EXAM, weight: 60, scope: { concepts: concepts.map((c) => c.id) } },
  ];
}
export const EXAM_DATE = EXAM;
