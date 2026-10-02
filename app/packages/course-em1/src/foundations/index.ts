import { Course } from "@forma/engine";
import { EXAM_DATE } from "../assessments";

/** Units and concepts of Maths Foundations; plans N2–N6 add theirs here. Course.parse validates them below. */
import { integrationConcepts } from "./integration";

const foundationUnits = [{ number: 4, title: "Integration" }];
const foundationConcepts: unknown[] = [...integrationConcepts];

/**
 * Maths Foundations for Engineering: the prerequisite course the readiness check recommends from. It shares EMag's
 * exam date so the scheduler spaces its reviews before the finals; it has no assessments of its own.
 */
export const foundations = Course.parse({
  id: "math0",
  code: "MATHS",
  title: "Maths Foundations for Engineering",
  examDate: EXAM_DATE,
  assessments: [],
  units: foundationUnits,
  concepts: foundationConcepts,
});