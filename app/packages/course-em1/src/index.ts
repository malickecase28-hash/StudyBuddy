import { Course } from "@forma/engine";
import type { BankItem } from "./questions";
import { assessmentsFor, EXAM_DATE } from "./assessments";
import { coulomb, divergence, field, fluxDensity, lockedConcepts } from "./concepts/electrostatics";
import { emWorld } from "./concepts/intro";
import { gaussApplications } from "./concepts/gauss-applications";
import { gaussLaw } from "./concepts/gauss-law";
import { surfaceIntegrals, vectors } from "./concepts/math";
import { vectorCalculus } from "./concepts/calculus";
import { potentialConcept } from "./concepts/potential";
import { currentConcept } from "./concepts/current";

/** Electromagnetics I (ELE3001) vertical slice. Parsed (and thereby validated) at import time. */
const concepts = [emWorld, vectors, vectorCalculus, surfaceIntegrals, coulomb, field, fluxDensity, gaussLaw, gaussApplications, divergence, potentialConcept, currentConcept, ...lockedConcepts];
export const course = Course.parse({
  id: "em1",
  code: "ELE3001",
  title: "Electromagnetics I",
  examDate: EXAM_DATE,
  assessments: assessmentsFor(concepts),
  units: [
    { number: 1, title: "Introduction" },
    { number: 2, title: "Electrostatic Fields" },
    { number: 3, title: "Magnetostatic Fields" },
    { number: 4, title: "Dynamic Fields" },
    { number: 5, title: "Plane Waves" },
  ],
  concepts,
});

export { diagnostic } from "./diagnostic";
export { formulaSheet } from "./reference";
export { questionBank } from "./questions";
export type { BankItem } from "./questions";
/** Assessment ids (in date order) whose scope covers any of the item's concepts. */
export const assessmentsForItem = (item: BankItem) =>
  [...course.assessments]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((a) => item.concepts.some((c) => a.scope.concepts.includes(c.conceptId)))
    .map((a) => a.id);
export * from "./lab";
export { classicLesson, ideaPlates, plates, registry } from "./plates";
export { checks, type Check } from "./checks";
export { templates, templatesFor } from "./templates";
export * from "./labs";
