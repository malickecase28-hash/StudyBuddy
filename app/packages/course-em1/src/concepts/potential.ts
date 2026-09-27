import { meta, SLIDES, src } from "../sources";

const ID = "em1.electrostatics.potential";
export const potentialConcept = {
  id: ID,
  title: "Electric potential and energy",
  unit: 2,
  objectives: [
    "Find the work done and the potential difference from a field: W = −Q∫E·dL.",
    "Find the potential of point charges by superposition, with V = 0 at infinity.",
    "Find E, and D, from V using E = −∇V.",
    "Find the energy to move a charge, and the energy of a system of point charges.",
  ],
  prerequisites: [{ conceptId: "em1.electrostatics.field", minMastery: 0.3 }, { conceptId: "em1.math.vector-calculus", minMastery: 0.3 }],
  misconceptions: [
    { tag: "WORK_SIGN", description: "Loses the minus sign in W = −Q∫E·dL, or mixes up start and end.", remediation: `${ID}/main` },
    { tag: "V_VECTOR", description: "Adds potentials as vectors, or gives V a direction.", remediation: `${ID}/main` },
    { tag: "GRAD_SIGN", description: "Writes E = ∇V without the minus sign.", remediation: `${ID}/main` },
    { tag: "V_INVERSE_SQUARE", description: "Uses 1/R² for a point charge's potential.", remediation: `${ID}/main` },
  ],
  examLinks: [{ paper: "UTech ELE3001 Finals 2024-25 Sem 1", question: "Q1(c)", marks: 10, weight: 1 }],
  sources: [src(SLIDES, "Electric potential"), src("UTech ELE3001 Unit 2b slides (G. D. Boswell)", "Examples 4 and 5")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Potential and energy (in depth)",
      minutes: 80,
      blocks: [
        { ...meta("vivid", src(SLIDES, "Work done")), id: "idea-work", type: "plate" as const, plateId: "idea-work" },
        { ...meta("vivid", src(SLIDES, "Potential")), id: "idea-v-point", type: "plate" as const, plateId: "idea-v-point" },
      ],
    },
  ],
};
