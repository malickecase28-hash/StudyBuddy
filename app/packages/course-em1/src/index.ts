import { Course } from "@forma/engine";
import { coulomb, divergence, field, fluxDensity, lockedConcepts } from "./concepts/electrostatics";
import { gaussApplications } from "./concepts/gauss-applications";
import { gaussLaw } from "./concepts/gauss-law";
import { surfaceIntegrals, vectors } from "./concepts/math";

/** Electromagnetics I (ELE3001) vertical slice. Parsed (and thereby validated) at import time. */
export const course = Course.parse({
  id: "em1",
  code: "ELE3001",
  title: "Electromagnetics I",
  examDate: "2026-12-15",
  units: [
    { number: 2, title: "Electrostatic Fields" },
    { number: 3, title: "Magnetostatic Fields" },
    { number: 4, title: "Dynamic Fields" },
    { number: 5, title: "Plane Waves" },
  ],
  concepts: [vectors, surfaceIntegrals, coulomb, field, fluxDensity, gaussLaw, gaussApplications, divergence, ...lockedConcepts],
});

export { diagnostic } from "./diagnostic";
export { formulaSheet, pastPapers } from "./reference";
export * from "./lab";
export { classicLesson, ideaPlates, plates, registry } from "./plates";
export { checks, type Check } from "./checks";
export { templates, templatesFor } from "./templates";
export * from "./labs";
