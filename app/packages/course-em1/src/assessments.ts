import type { Concept } from "@forma/engine";

const EXAM = "2026-12-15";

/** ICT dates are Group A's sittings (Group B sits three days later); see the 2026-27 module outline. */
export function assessmentsFor(concepts: Pick<Concept, "id" | "unit">[]) {
  const unit = (...n: number[]) => concepts.filter((c) => n.includes(c.unit)).map((c) => c.id);
  return [
    { id: "ict1", title: "In-Course Test 1", short: "ICT 1", date: "2026-10-12", weight: 15, scope: { concepts: [...unit(1), ...unit(2), "em1.magnetostatics.ampere"] } },
    { id: "ict2", title: "In-Course Test 2", short: "ICT 2", date: "2026-11-16", weight: 15, scope: { concepts: unit(3, 4) } },
    { id: "finals", title: "Final exam", short: "Finals", date: EXAM, weight: 60, scope: { concepts: concepts.map((c) => c.id) } },
  ];
}
export const EXAM_DATE = EXAM;
